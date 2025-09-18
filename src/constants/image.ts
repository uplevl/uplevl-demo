/**
 * Image and thumbnail related constants
 */

export const THUMBNAIL_SIZES = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
} as const;

/**
 * Predefined thumbnail size configurations
 */
export const THUMBNAIL_SIZES_CONFIG = {
  [THUMBNAIL_SIZES.SMALL]: { width: 150, height: 150 },
  [THUMBNAIL_SIZES.MEDIUM]: { width: 300, height: 300 },
  [THUMBNAIL_SIZES.LARGE]: { width: 600, height: 600 },
} as const;

export const DEFAULT_THUMBNAIL_CONFIG = {
  width: THUMBNAIL_SIZES_CONFIG[THUMBNAIL_SIZES.MEDIUM].width,
  height: THUMBNAIL_SIZES_CONFIG[THUMBNAIL_SIZES.MEDIUM].height,
  quality: 80,
  format: "webp",
} as const;
