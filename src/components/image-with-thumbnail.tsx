import Image, { type ImageProps } from "next/image";
import { DEFAULT_THUMBNAIL_CONFIG, THUMBNAIL_SIZES, THUMBNAIL_SIZES_CONFIG } from "@/constants/image";
import { cn } from "@/lib/utils";
import type { ThumbnailConfig, ThumbnailSize } from "@/types/image";

type ImageWithThumbnailProps = Omit<ImageProps, "src"> & {
  src: string;
  thumbnailSize: ThumbnailSize;
};

export default function ImageWithThumbnail({ src, className, thumbnailSize, ...props }: ImageWithThumbnailProps) {
  const thumbnailUrl = getThumbnailUrlFromOriginal(src, thumbnailSize);

  return <Image {...props} src={thumbnailUrl} className={cn("object-cover", className)} />;
}

/**
 * Constructs a thumbnail URL from an original image URL
 * This function derives the thumbnail path based on the original URL structure
 * @param originalUrl - The original image URL from Supabase storage
 * @param size - The thumbnail size ("small", "medium", "large")
 * @returns string - The constructed thumbnail URL
 *
 * @example
 * const originalUrl = "https://supabase.co/storage/v1/object/public/bucket/user123/post_456/uploads/images/photo.jpg"
 * const thumbnailUrl = getThumbnailUrlFromOriginal(originalUrl, "medium")
 * // Returns: "https://supabase.co/storage/v1/object/public/bucket/user123/post_456/uploads/images/thumbnails/photo_thumb_300x200.webp"
 */
export function getThumbnailUrlFromOriginal(originalUrl: string, size: ThumbnailSize = THUMBNAIL_SIZES.MEDIUM): string {
  // Extract the filename from the original URL
  const urlParts = originalUrl.split("/");
  const filename = urlParts[urlParts.length - 1];

  // Get dimensions for the requested size
  const dimensions = THUMBNAIL_SIZES_CONFIG[size];

  // Create thumbnail filename
  const thumbnailConfig = {
    width: dimensions.width,
    height: dimensions.height,
    format: "webp" as const,
  };
  const thumbnailFilename = getThumbnailFilename(filename, thumbnailConfig);

  // Replace the original filename with the thumbnail path
  const basePath = originalUrl.substring(0, originalUrl.lastIndexOf("/"));
  const thumbnailUrl = `${basePath}/thumbnails/${thumbnailFilename}`;

  return thumbnailUrl;
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
