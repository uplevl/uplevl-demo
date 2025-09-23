export const PARSE_ZILLOW_PROPERTY_EVENT = "zillow/parse" as const;
export const PARSE_ZILLOW_PROPERTY_STEPS = {
  SETUP: "setup",
  START_SCRAPING: "start-scraping",
  GET_SNAPSHOT_STATUS: "get-snapshot-status",
  RETRIEVE_PROPERTY_DATA: "retrieve-property-data",
  ANALYZE_PROPERTY_DATA: "analyze-property-data",
  ANALYZE_PHOTOS: "analyze-photos",
  GROUP_PHOTOS: "group-photos",
  STORE_GROUPS: "store-groups",
  FINISH: "finish",
} as const;

export type ParseZillowPropertyStep = (typeof PARSE_ZILLOW_PROPERTY_STEPS)[keyof typeof PARSE_ZILLOW_PROPERTY_STEPS];

export const GENERATE_SCRIPTS_EVENT = "post/generate.scripts" as const;
export const GENERATE_SCRIPTS_STEPS = {
  SETUP: "setup",
  GENERATE_SCRIPTS: "generate-scripts",
  UPDATE_POST_MEDIA_GROUPS: "update-post-media-groups",
  FINISH: "finish",
} as const;

export type GenerateScriptsStep = (typeof GENERATE_SCRIPTS_STEPS)[keyof typeof GENERATE_SCRIPTS_STEPS];

export const GENERATE_AUTO_REEL_EVENT = "post/generate.auto-reel" as const;
export const GENERATE_AUTO_REEL_STEPS = {
  SETUP: "setup",
  START_GENERATING: "start-generating",
  GET_VIDEO_STATUS: "get-video-status",
  GET_VIDEO_REEL: "get-video-reel",
  UPLOAD_VIDEO: "upload-video",
  FINISH: "finish",
} as const;

// Generate final video with voice-over
export const GENERATE_FINAL_VIDEO_EVENT = "app/generate-final-video";

export const GENERATE_FINAL_VIDEO_STEPS = {
  SETUP: "setup",
  CALCULATE_TIMING: "calculate-timing",
  START_REMOTION_RENDER: "start-remotion-render",
  WAIT_FOR_RENDER: "wait-for-render",
  UPLOAD_FINAL_VIDEO: "upload-final-video",
  FINISH: "finish",
} as const;

export type GenerateAutoReelStep = (typeof GENERATE_AUTO_REEL_STEPS)[keyof typeof GENERATE_AUTO_REEL_STEPS];

export type GenerateFinalVideoStep = (typeof GENERATE_FINAL_VIDEO_STEPS)[keyof typeof GENERATE_FINAL_VIDEO_STEPS];
