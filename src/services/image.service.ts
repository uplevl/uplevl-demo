import { generateObject, generateText } from "ai";
import pMap from "p-map";
import sharp from "sharp";
import z from "zod";

import { addEntry, getEntry } from "@/lib/cache";
import { fetchImage } from "@/lib/helpers";
import { openRouter } from "@/lib/open-router";
import { bucket } from "@/lib/supabase";

import type { AnalyzedImage, ImageGroupWithDescribedImages, ImageGroupWithImages } from "@/types/image";

function getStoragePath(userId: string, postId: string) {
  return `${userId}/post_${postId}/uploads/images`;
}

export async function upload(userId: string, postId: string, files: File[]) {
  const path = getStoragePath(userId, postId);
  console.log("files", files);

  async function uploadImage(file: File) {
    const { data, error } = await bucket.upload(`${path}/${file.name}`, file, {
      upsert: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    return bucket.getPublicUrl(data.path).data.publicUrl;
  }

  const uploadedFiles = await Promise.all(files.map(uploadImage));

  return uploadedFiles;
}

async function analyzeImage(file: File, url: string) {
  // Create cache key based on image URL and current prompt version
  const cacheKey = `image-analysis:v2:${Buffer.from(url).toString("base64")}`;

  // Check cache first
  const cached = await getEntry(cacheKey);
  if (cached) {
    return cached as { description: string; isEstablishingShot: boolean };
  }

  const buffer = await file.arrayBuffer();

  // Compress image to 512x384 for faster processing while maintaining quality
  const compressedBuffer = await sharp(buffer).resize(512, 384, { fit: "inside" }).webp({ quality: 75 }).toBuffer();

  const inlineImageUrl = `data:${file.type};base64,${Buffer.from(compressedBuffer).toString("base64")}`;

  const { text } = await generateText({
    model: openRouter("openai/gpt-4o-mini"),
    prompt: [
      {
        role: "system",
        content: `You are a real estate assistant. Briefly describe this photo of a property in 2-3 concise sentences. Focus only on the room type and most visually important real estate features. Do not mention furniture, decor, or personal items. Be as brief and clear as possible. At the end, include a line: "Establishing shot: Yes" or "Establishing shot: No" based on whether this image shows a wide front view of the house, typically used as the opening scene.`,
      },
      {
        role: "user",
        content: [{ type: "image", image: inlineImageUrl }],
      },
    ],
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

  const result = { description, isEstablishingShot };

  // Cache the result for 24 hours
  await addEntry(cacheKey, result, 60 * 60 * 24);

  return result;
}

export async function analyzeImages(urls: string[]) {
  // Pre-fetch all images in parallel for better performance
  const files = await Promise.all(urls.map(fetchImage));

  // Analyze images in parallel with higher concurrency for faster models
  const descriptions = await pMap(
    urls,
    async (url, index) => {
      const file = files[index];
      const { description, isEstablishingShot } = await analyzeImage(file, url);
      return { url: url, filename: file.name, description, isEstablishingShot };
    },
    { concurrency: 6 }, // Increased from 3 to 6 for faster models
  );

  return descriptions;
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
  // Debug logging for troubleshooting isEstablishingShot issues
  console.log(
    "🔍 Debug - Group filenames:",
    groups.flatMap((g) => g.images),
  );
  console.log(
    "🔍 Debug - Description filenames:",
    descriptions.map((d) => d.filename),
  );
  console.log(
    "🔍 Debug - isEstablishingShot values:",
    descriptions.map((d) => ({ filename: d.filename, isEstablishingShot: d.isEstablishingShot })),
  );

  // Create a lookup map for better performance and debugging
  const descriptionLookup = new Map<string, AnalyzedImage>();
  descriptions.forEach((desc) => {
    descriptionLookup.set(desc.filename, desc);
    // Also add without extension as fallback
    const nameWithoutExt = desc.filename.replace(/\.[^/.]+$/, "");
    descriptionLookup.set(nameWithoutExt, desc);
  });

  const combined = groups.map((group) => ({
    groupName: group.groupName,
    describedImages: group.images.map((filename) => {
      // Try exact match first, then without extension
      let foundDescription = descriptionLookup.get(filename);
      if (!foundDescription) {
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        foundDescription = descriptionLookup.get(nameWithoutExt);
      }

      console.log(`🔍 Looking for filename: ${filename}, found:`, foundDescription ? "MATCH" : "NOT FOUND");

      if (!foundDescription) {
        console.warn(`⚠️  No description found for filename: ${filename}`);
        console.warn("Available descriptions:", Array.from(descriptionLookup.keys()));
      }

      return {
        url: foundDescription?.url ?? "",
        filename: filename,
        description: foundDescription?.description ?? "",
        isEstablishingShot: foundDescription?.isEstablishingShot ?? false,
      };
    }),
  }));

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
  try {
    // Use GPT-4o-mini which works better with generateObject for structured output
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
    });

    console.log("🤖 LLM groupResult:", JSON.stringify(groupResult, null, 2));
    console.log(
      "📥 Input descriptions to LLM:",
      JSON.stringify(
        descriptions.map((d) => ({ filename: d.filename, isEstablishingShot: d.isEstablishingShot })),
        null,
        2,
      ),
    );

    return combineGroupsWithDescribedImages(groupResult, descriptions);
  } catch (error) {
    console.warn("generateObject failed, falling back to text parsing:", error);

    // Fallback: use generateText and parse manually
    const { text } = await generateText({
      model: openRouter("openai/gpt-4o-mini"),
      prompt: [
        { role: "system", content: groupSystemPrompt },
        { role: "user", content: JSON.stringify(descriptions, null, 2) },
      ],
    });

    // Extract JSON from text response
    let jsonText = text.trim();

    // Remove common wrapper text patterns
    const jsonStart = jsonText.indexOf("[");
    const jsonEnd = jsonText.lastIndexOf("]") + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd);
    }

    try {
      const groupResult = JSON.parse(jsonText) as ImageGroupWithImages[];
      return combineGroupsWithDescribedImages(groupResult, descriptions);
    } catch (parseError) {
      console.error("Failed to parse JSON from text response:", parseError);
      throw new Error("Failed to group images: Invalid JSON response from model");
    }
  }
}
