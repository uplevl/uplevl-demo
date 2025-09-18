import { generateText } from "ai";
import { brightDataClient } from "@/lib/bright-data";
import { addEntry, createCacheKey, getEntry } from "@/lib/cache";
import { openRouter } from "@/lib/open-router";
import type { Post } from "@/repositories/post.repository";
import type { PostMediaGroup } from "@/repositories/post-media-group.repository";
import type { BrightDataSnapshotStatus, BrightDataTriggerResponse } from "@/types/bright-data";
import type { PropertyStats } from "@/types/post";
import type { ZillowPropertyDetails } from "@/types/zillow";

export async function scrapeZillowPropertyDetails(url: string) {
  const response = await brightDataClient.post<BrightDataTriggerResponse>(
    "/trigger?dataset_id=gd_lfqkr8wm13ixtbd8f5&include_errors=true",
    JSON.stringify([{ url }]),
  );
  return response.data;
}

export async function getZillowSnapshotStatus(snapshotId: string) {
  const response = await brightDataClient.get<BrightDataSnapshotStatus>(`/progress/${snapshotId}`);
  return response.data;
}

export async function getZillowSnapshot(snapshotId: string) {
  const cacheKey = createCacheKey(["property_snapshot", snapshotId]);

  // Check if the snapshot is already in the cache
  const cachedResponse = await getEntry<ZillowPropertyDetails>(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch the snapshot from Bright Data
  const response = await brightDataClient.get<ZillowPropertyDetails>(`/snapshot/${snapshotId}`);
  const snapshot = response.data;
  if (!snapshot) {
    throw new Error("Snapshot not found");
  }

  // Add the snapshot to the cache
  await addEntry(cacheKey, snapshot);
  return snapshot;
}

export function compilePropertyData(snapshot: ZillowPropertyDetails) {
  const location = [
    snapshot.address.streetAddress,
    snapshot.address.city,
    snapshot.address.state,
    snapshot.address.zipcode,
  ]
    .filter(Boolean)
    .join(", ");

  const propertyStats: PropertyStats = {
    description: snapshot.description,
    homeType: snapshot.homeType,
    bedrooms: snapshot.bedrooms,
    bathrooms: snapshot.bathrooms,
    squareFeet: snapshot.livingArea,
    lotSize: snapshot.lotSize,
    yearBuilt: snapshot.yearBuilt,
    price: snapshot.price,
    meta: [...snapshot.property, ...snapshot.construction, ...snapshot.interior_full],
    mlsId: snapshot.mls_id,
    overview: snapshot.overview,
    lat: snapshot.latitude,
    lon: snapshot.longitude,
    hoaDetails: {
      hasHoa: snapshot.hoa_details.has_hoa,
      hoaFeeValue: snapshot.hoa_details.hoa_fee_value,
      hoaFeeCurrency: snapshot.hoa_details.hoa_fee_currency,
      hoaFeePeriod: snapshot.hoa_details.hoa_fee_period,
      servicesIncluded: snapshot.hoa_details.services_included,
      amenitiesIncluded: snapshot.hoa_details.amenities_included,
    },
  } satisfies PropertyStats;

  return { location, propertyStats };
}

interface GeneratePropertyContextProps {
  groups: PostMediaGroup[];
  propertyStats: Post["propertyStats"];
  location: Post["location"];
}

export async function generatePropertyContext({ groups, propertyStats, location }: GeneratePropertyContextProps) {
  const propertyInfo = [
    propertyStats?.description ? `- Description: ${propertyStats.description}` : null,
    propertyStats?.homeType ? `- Home Type: ${propertyStats.homeType}` : null,
    location ? `- Location: ${location}` : null,
    propertyStats?.price ? `- Price: ${propertyStats.price}` : null,
    propertyStats?.bedrooms ? `- Bedrooms: ${propertyStats.bedrooms}` : null,
    propertyStats?.bathrooms ? `- Bathrooms: ${propertyStats.bathrooms}` : null,
    propertyStats?.squareFeet ? `- Square Feet: ${propertyStats.squareFeet}` : null,
    propertyStats?.lotSize ? `- Lot Size: ${propertyStats.lotSize}` : null,
    propertyStats?.yearBuilt ? `- Year Built: ${propertyStats.yearBuilt}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const contextPrompt = `

<PropertyInfo>${propertyInfo ? `\n${propertyInfo}\n` : ""}

<Instructions>
- Create a concise property summary focused on key selling points for a 20-30 second social media video
- Highlight the most compelling features that would grab attention in a short video
- Include style, location appeal, and standout characteristics
- Keep it brief - this context will guide multiple short script segments
- Focus on emotional appeal and unique value propositions
  `;

  const { text } = await generateText({
    model: openRouter("openai/gpt-4o-mini"),
    prompt: [
      { role: "system", content: contextPrompt },
      {
        role: "user",
        content: groups
          .map(
            (group, i) =>
              `\n${i + 1}. ${group.groupName}:\n${group.media.map((img) => `   - ${img.description}`).join("\n")}`,
          )
          .join("\n"),
      },
    ],
    experimental_telemetry: {
      isEnabled: true,
      recordInputs: true,
      recordOutputs: true,
    },
  });

  return text;
}
