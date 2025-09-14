import { brightDataClient } from "@/server/lib/bright-data";
import { addEntry, createCacheKey, getEntry } from "@/server/lib/cache";
import { fetchImage } from "@/server/lib/utils";
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

export async function getPropertyPhotos(snapshot: ZillowPropertyDetails) {
  // Get photo URLs from the snapshot
  const photoUrls = snapshot.photos
    // Get the last photo URL from the JPEG sources (the largest photo)
    .map((photo) => photo.mixedSources.jpeg[photo.mixedSources.jpeg.length - 1]?.url ?? null)
    .filter(Boolean) as string[];

  const photos: File[] = [];

  for (const url of photoUrls) {
    try {
      const file = await fetchImage(url);
      photos.push(file);
    } catch (error) {
      console.error("Error fetching photo", error);
    }
  }

  return photos;
}
