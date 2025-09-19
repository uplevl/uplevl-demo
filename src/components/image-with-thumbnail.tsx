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
 * This function properly handles URLs with query parameters and hashes by using the URL API
 * for absolute URLs and manual stripping for relative URLs
 * @param originalUrl - The original image URL (absolute or relative, may include query params/hashes)
 * @param size - The thumbnail size ("small", "medium", "large")
 * @returns string - The constructed thumbnail URL
 *
 * @example
 * // Absolute URL with query parameters
 * const originalUrl = "https://supabase.co/storage/v1/object/public/bucket/user123/post_456/uploads/images/photo.jpg?x=1&y=2"
 * const thumbnailUrl = getThumbnailUrlFromOriginal(originalUrl, "medium")
 * // Returns: "https://supabase.co/storage/v1/object/public/bucket/user123/post_456/uploads/images/thumbnails/photo_thumb_300x200.webp"
 *
 * @example
 * // Relative URL with hash
 * const originalUrl = "/uploads/images/photo.jpg#section1"
 * const thumbnailUrl = getThumbnailUrlFromOriginal(originalUrl, "medium")
 * // Returns: "/uploads/images/thumbnails/photo_thumb_300x200.webp"
 */
export function getThumbnailUrlFromOriginal(originalUrl: string, size: ThumbnailSize = THUMBNAIL_SIZES.MEDIUM): string {
  let cleanedPath: string;
  let basePath: string;

  try {
    // Try to parse as absolute URL
    const url = new URL(originalUrl);
    cleanedPath = url.pathname;
    basePath = url.origin + cleanedPath.substring(0, cleanedPath.lastIndexOf("/"));
  } catch {
    // Handle relative URL - remove query parameters and hash
    cleanedPath = originalUrl.split(/[?#]/)[0];
    basePath = cleanedPath.substring(0, cleanedPath.lastIndexOf("/"));
  }

  // Extract filename from cleaned path
  const pathParts = cleanedPath.split("/");
  const filename = pathParts[pathParts.length - 1];

  // Get dimensions for the requested size
  const dimensions = THUMBNAIL_SIZES_CONFIG[size];

  // Create thumbnail filename
  const thumbnailConfig = {
    width: dimensions.width,
    height: dimensions.height,
    format: "webp" as const,
  };
  const thumbnailFilename = getThumbnailFilename(filename, thumbnailConfig);

  // Build the thumbnail URL
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
