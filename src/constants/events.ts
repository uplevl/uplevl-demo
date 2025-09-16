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
