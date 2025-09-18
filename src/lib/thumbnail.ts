import sharp from "sharp";
import { DEFAULT_THUMBNAIL_CONFIG, THUMBNAIL_SIZES_CONFIG } from "@/constants/image";
import type { ThumbnailConfig } from "@/types/image";

/**
 * Generates a thumbnail from an image file using Sharp
 * @param file - The original image file
 * @param config - Thumbnail configuration options
 * @returns Promise<Buffer> - The generated thumbnail as a buffer
 */
export async function generateThumbnail(
  file: File,
  config: ThumbnailConfig = DEFAULT_THUMBNAIL_CONFIG,
): Promise<Buffer> {
  try {
    // Convert File to ArrayBuffer, then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Generate thumbnail using Sharp
    const thumbnailBuffer = await sharp(inputBuffer)
      .resize(config.width, config.height, {
        fit: "cover", // Crop to maintain aspect ratio
        position: "center",
      })
      .toFormat(config.format || "webp", {
        quality: config.quality || 80,
      })
      .toBuffer();

    return thumbnailBuffer;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generates a thumbnail filename based on the original filename
 * @param originalFilename - The original file name
 * @param config - Thumbnail configuration to determine file extension
 * @returns string - The thumbnail filename
 */
export function getThumbnailFilename(
  originalFilename: string,
  config: ThumbnailConfig = DEFAULT_THUMBNAIL_CONFIG,
): string {
  const extension = `.${config.format || "webp"}`;
  const nameWithoutExtension = originalFilename.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExtension}_thumb_${config.width}x${config.height}${extension}`;
}

/**
 * Generates multiple thumbnail sizes for responsive images
 * @param file - The original image file
 * @returns Promise<{ size: string; buffer: Buffer; filename: string }[]>
 */
export async function generateResponsiveThumbnails(
  file: File,
): Promise<{ size: string; buffer: Buffer; filename: string }[]> {
  const sizes = Object.entries(THUMBNAIL_SIZES_CONFIG).map(([size, dimensions]) => ({
    ...dimensions,
    size,
  }));

  const thumbnails = await Promise.all(
    sizes.map(async ({ width, height, size }) => {
      const config = { width, height, quality: 80, format: "webp" as const };
      const buffer = await generateThumbnail(file, config);
      const filename = getThumbnailFilename(file.name, config);
      return { size, buffer, filename };
    }),
  );

  return thumbnails;
}

/**
 * Helper function to get the best thumbnail URL for a given size preference
 * @param thumbnails - Array of thumbnail info objects
 * @param preferredSize - Preferred size ("small", "medium", "large")
 * @returns string | undefined - The thumbnail URL or undefined if not found
 */
export function getThumbnailUrl(
  thumbnails: { url: string; size: string }[],
  preferredSize: "small" | "medium" | "large" = "medium",
): string | undefined {
  // First try to find exact match
  const exactMatch = thumbnails.find((thumb) => thumb.size === preferredSize);
  if (exactMatch) return exactMatch.url;

  // Fallback to any available thumbnail
  const fallback = thumbnails.find((thumb) => thumb.url);
  return fallback?.url;
}
