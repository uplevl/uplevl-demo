import type { THUMBNAIL_SIZES } from "@/constants/image";

export type Filename = string;

export interface ThumbnailConfig {
  width: number;
  height: number;
  quality?: number;
  format?: "jpeg" | "webp" | "png";
}

export interface ThumbnailInfo {
  url: string;
  size: string;
  width: number;
  height: number;
}

/**
 * Type-safe thumbnail size type derived from constants
 */
export type ThumbnailSize = (typeof THUMBNAIL_SIZES)[keyof typeof THUMBNAIL_SIZES];

export interface UploadedImage {
  file: File;
  originalUrl: string;
  url: string;
  localUrl: string;
  thumbnails: ThumbnailInfo[];
}

export interface AnalyzedImage {
  url: string;
  description: string;
  isEstablishingShot: boolean;
}

export interface ImageGroup {
  groupName: string;
}

export interface ImageGroupWithImages extends ImageGroup {
  images: string[];
}

export interface ImageGroupWithDescribedImages extends ImageGroup {
  describedImages: AnalyzedImage[];
}
