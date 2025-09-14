import pMap from "p-map";
import sharp from "sharp";

import { openai } from "@/server/lib/openai";
import { bucket } from "@/server/lib/supabase";
import type { AnalyzedImage, ImageGroupWithDescribedImages, ImageGroupWithImages } from "@/types/image";
import { fetchImage } from "../lib/utils";

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

async function analyzeImage(file: File) {
  const buffer = await file.arrayBuffer();

  // Compress image to 1024x768 - to save on tokens
  const compressedBuffer = await sharp(buffer).resize(1024, 768, { fit: "inside" }).webp({ quality: 80 }).toBuffer();

  const inlineImageUrl = `data:${file.type};base64,${Buffer.from(compressedBuffer).toString("base64")}`;

  const result = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a real estate assistant. Briefly describe this photo of a property in 2-3 concise sentences. Focus only on the room type and most visually important real estate features. Do not mention furniture, decor, or personal items. Be as brief and clear as possible. At the end, include a line: "Establishing shot: Yes" or "Establishing shot: No" based on whether this image shows a wide front view of the house, typically used as the opening scene.`,
      },
      {
        role: "user",
        content: [{ type: "image_url", image_url: { detail: "high", url: inlineImageUrl } }],
      },
    ],
    max_tokens: 500,
  });

  if (!result.choices[0]?.message.content) {
    throw new Error("Failed to analyze image");
  }

  const content = result.choices[0].message.content;
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

  return { description, isEstablishingShot };
}

export async function analyzeImages(urls: string[]) {
  // Analyze images in parallel, but limit to 3 at a time to avoid rate limiting
  const descriptions = await pMap(
    urls,
    async (url) => {
      const file = await fetchImage(url);
      const { description, isEstablishingShot } = await analyzeImage(file);
      return { url: url, filename: file.name, description, isEstablishingShot };
    },
    { concurrency: 3 },
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

### Output Format (JSON)
Return a JSON array like this:
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
  return groups.map((group) => ({
    groupName: group.groupName,
    describedImages: group.images.map((filename) => ({
      url: descriptions.find((d) => d.filename === filename)?.url ?? "",
      filename: filename,
      description: descriptions.find((d) => d.filename === filename)?.description ?? "",
      isEstablishingShot: descriptions.find((d) => d.filename === filename)?.isEstablishingShot ?? false,
    })),
  }));
}

export async function groupImages(descriptions: AnalyzedImage[]) {
  // Generate group
  const groupResult = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages: [
      { role: "system", content: groupSystemPrompt },
      { role: "user", content: JSON.stringify(descriptions, null, 2) },
    ],
  });

  if (!groupResult.choices[0]?.message.content) {
    throw new Error("Failed to group images");
  }

  const grouped = groupResult.choices[0].message.content;

  // Clean up the output
  const cleaned = grouped
    .trim()
    .replace(/^```json/, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned || "[]") as ImageGroupWithImages[];

  const combined = combineGroupsWithDescribedImages(parsed, descriptions);

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
