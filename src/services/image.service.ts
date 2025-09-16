import { generateObject, generateText } from "ai";
import pMap from "p-map";
import z from "zod";

import { addEntry, getEntry } from "@/lib/cache";
import { openRouter } from "@/lib/open-router";
import { bucket } from "@/lib/supabase";

import type { AnalyzedImage, ImageGroupWithDescribedImages, ImageGroupWithImages } from "@/types/image";

function getStoragePath(userId: string, postId: string) {
  return `${userId}/post_${postId}/uploads/images`;
}

async function uploadImage(userId: string, postId: string, file: { file: File; url: string }) {
  const path = getStoragePath(userId, postId);
  const { data, error } = await bucket.upload(`${path}/${file.file.name}`, file.file, {
    upsert: true,
  });

  if (error) {
    console.error("Error uploading image", error);
    return null;
  }

  const url = bucket.getPublicUrl(data.path).data.publicUrl;
  return { file: file.file, originalUrl: file.url, url };
}

export async function upload(userId: string, postId: string, files: { file: File; url: string }[]) {
  const promises = files.map((file) => uploadImage(userId, postId, file));
  const responses = await Promise.all(promises);
  const uploadedFiles = responses.filter(Boolean);

  return uploadedFiles as { file: File; originalUrl: string; url: string }[];
}

async function analyzeImage(url: string): Promise<AnalyzedImage> {
  // Create cache key based on image URL and current prompt version
  const cacheKey = `image-analysis:v2:${Buffer.from(url).toString("base64")}`;

  // Check cache first
  const cached = await getEntry<AnalyzedImage>(cacheKey);
  if (cached) {
    return cached;
  }

  const { text } = await generateText({
    model: openRouter("openai/gpt-4o-mini"),
    prompt: [
      {
        role: "system",
        content: `You are a real estate assistant. Briefly describe this photo of a property in 2-3 concise sentences. Focus only on the room type and most visually important real estate features. Do not mention furniture, decor, or personal items. Be as brief and clear as possible. At the end, include a line: "Establishing shot: Yes" or "Establishing shot: No" based on whether this image shows a wide front view of the house, typically used as the opening scene.`,
      },
      {
        role: "user",
        content: [{ type: "image", image: url }],
      },
    ],
    experimental_telemetry: {
      isEnabled: true,
      recordInputs: true,
      recordOutputs: true,
    },
  });

  // const content = result.choices[0].message.content;
  const content = text;
  // Extract description and establishing shot line
  const lines = content.trim().split("\n");
  const lastLine = lines[lines.length - 1];
  let isEstablishingShot = false;
  if (lastLine?.toLowerCase().startsWith("establishing shot: yes")) {
    isEstablishingShot = true;
    lines.pop();
  } else if (lastLine?.toLowerCase().startsWith("establishing shot: no")) {
    isEstablishingShot = false;
    lines.pop();
  }
  const description = lines.join("\n").trim();

  const result: AnalyzedImage = { description, isEstablishingShot, url } satisfies AnalyzedImage;

  // Cache the result for 24 hours
  await addEntry(cacheKey, result, 60 * 60 * 24);

  return result;
}

export async function analyzeImages(urls: string[]) {
  // Analyze images in parallel with higher concurrency for faster models
  const descriptions = await pMap(
    urls,
    async (url) => {
      if (!url) return null;
      const { description, isEstablishingShot } = await analyzeImage(url);
      return { url: url, description, isEstablishingShot };
    },
    { concurrency: 6 }, // Increased from 3 to 6 for faster models
  );

  return descriptions.filter(Boolean) as AnalyzedImage[];
}

const groupSystemPrompt = `
You are a real estate photo assistant.

Group property listing photos into logical clusters based on the area or room they depict, using common real estate terms like “Kitchen”, “Exterior”, or “Primary Bedroom”. Do not use generic names like “Room 1”.

### Grouping Guidelines
- Each image belongs to one group only.
- Group images showing the same room or visually connected area (e.g., open-plan kitchen/dining/living).
- Merge into “Great Room (Kitchen + Living + Dining)” only if the space is clearly open-concept.
- Combine front and back exterior shots into “Exterior” if either group is small or flow is continuous.
- Only include groups with 2+ images unless it's an important area like Exterior or Primary Bedroom.

### Ignore These Rooms Unless Exceptional
- Laundry / Utility
- Garage
- Closet
- Hallway
- Small or unstaged secondary bedrooms
- Bathrooms with only 1 image

### Use These Labels When Possible
- Exterior
- Entry / Foyer
- Kitchen
- Dining Area
- Living Room
- Great Room (Kitchen + Living + Dining)
- Kitchen & Dining
- Primary Bedroom
- Bedroom 2, Bedroom 3, …
- Primary Bathroom
- Bathroom
- Office / Study
- Loft
- Basement
- Staircase

### Output Format
Return ONLY a valid JSON array with no additional text or explanation. Each group should have exactly this structure:
[
  { "groupName": "Exterior", "images": ["exterior1.jpg", "backyard2.jpg"] },
  { "groupName": "Great Room (Kitchen + Living + Dining)", "images": ["kitchen1.jpg", "living1.jpg"] },
  { "groupName": "Primary Bedroom", "images": ["master1.jpg", "master2.jpg"] }
]
`;

function combineGroupsWithDescribedImages(
  groups: ImageGroupWithImages[],
  descriptions: AnalyzedImage[],
): ImageGroupWithDescribedImages[] {
  // Create a lookup map for better performance and debugging
  const descriptionLookup = new Map<string, AnalyzedImage>();

  for (const desc of descriptions) {
    descriptionLookup.set(desc.url, desc);
  }

  const combined: ImageGroupWithDescribedImages[] = groups.map((group) => ({
    groupName: group.groupName,
    describedImages: group.images
      .map((url) => {
        // Try exact match first, then without extension
        const foundDescription = descriptionLookup.get(url);

        if (!foundDescription) {
          console.warn(`⚠️  No description found for url: ${url}`);
          console.warn("Available descriptions:", Array.from(descriptionLookup.keys()));
          return null;
        }

        return {
          url: foundDescription?.url ?? "",
          description: foundDescription?.description ?? "",
          isEstablishingShot: foundDescription?.isEstablishingShot ?? false,
        } satisfies AnalyzedImage;
      })
      .filter(Boolean) as AnalyzedImage[],
  })) satisfies ImageGroupWithDescribedImages[];

  // Merge groups with the same name by combining their describedImages arrays
  const merged = combined.reduce((acc: ImageGroupWithDescribedImages[], group) => {
    const existingGroup = acc.find((g) => g.groupName === group.groupName);

    if (existingGroup) {
      // Combine describedImages arrays for groups with the same name
      existingGroup.describedImages.push(...group.describedImages);
    } else {
      // Add new group to accumulator
      acc.push({
        groupName: group.groupName,
        describedImages: [...group.describedImages],
      });
    }

    return acc;
  }, []);

  return merged;
}

export async function groupImages(descriptions: AnalyzedImage[]) {
  const { object: groupResult } = await generateObject({
    model: openRouter("anthropic/claude-3.5-sonnet-20241022"),
    schema: z.array(
      z.object({
        groupName: z.string(),
        images: z.array(z.string()),
      }),
    ),
    prompt: [
      { role: "system", content: groupSystemPrompt },
      { role: "user", content: JSON.stringify(descriptions, null, 2) },
    ],
    experimental_telemetry: {
      isEnabled: true,
      recordInputs: true,
      recordOutputs: true,
    },
  });

  console.log("🤖 LLM groupResult:", JSON.stringify(groupResult, null, 2));
  console.log(
    "📥 Input descriptions to LLM:",
    JSON.stringify(
      descriptions.map((d) => ({ url: d.url, isEstablishingShot: d.isEstablishingShot })),
      null,
      2,
    ),
  );

  const combinedGroups = combineGroupsWithDescribedImages(groupResult, descriptions);
  const filteredGroups = combinedGroups.filter((group) => group.describedImages.length > 2);

  return filteredGroups;
}
