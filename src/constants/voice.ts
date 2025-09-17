import type { VoiceModel } from "@/types/voice";

export const AUDIO_OUTPUT_FORMAT = "mp3_44100_128";

export const MODEL_ID = "eleven_v3";

export const VOICE_MODEL_IDS = {
  GRANDPA_SPUDS_OXLEY: "NOpBlnGInO9m6vDvFkFC",
  LAURA: "FGY2WhTYpPnrIDTdsKH5",
  AUSTIN: "Bj9UqZbhQsanLzgalpEG",
  ALEXANDRA: "kdmDKE6EkgrWrrykO9Qt",
  ARABELLA: "Z3R5wn05IrDiVCyEkUrK",
  HUSKY: "EkK5I93UQWFDigLMpZcX",
};

export const DEFAULT_VOICE_ID = VOICE_MODEL_IDS.LAURA;

export const VOICE_MODELS: VoiceModel[] = [
  {
    id: "NOpBlnGInO9m6vDvFkFC",
    gender: "male",
    name: "Grandpa Spuds Oxley",
    description: "A friendly grandpa who enthrall his audience with his stories and wisdom.",
  },
  {
    id: "FGY2WhTYpPnrIDTdsKH5",
    gender: "female",
    name: "Laura",
    description: "This young woman delivers sunny with a quirky attitude.",
  },
  {
    id: "Bj9UqZbhQsanLzgalpEG",
    gender: "male",
    name: "Austin",
    description:
      "Go ol' boy. Goes to the state fair every year, low, deep gravelly voice, proud of his state, can get intimate with a fireside talk, but can get loud when he's drinkin' with the boys. Served with heapin' side of STRONG texan accent and collard greens.",
  },
  {
    id: "kdmDKE6EkgrWrrykO9Qt",
    gender: "female",
    name: "Alexandra",
    description: "Youthful and authentic, with a conversational tone that is relatable and down-to-earth.",
  },
  {
    id: "Z3R5wn05IrDiVCyEkUrK",
    gender: "female",
    name: "Arabella",
    description: "A young, mature female narrator with mysterious and emotive tone.",
  },
  {
    id: "EkK5I93UQWFDigLMpZcX",
    gender: "male",
    name: "Husky",
    description: "A slightly husky and bassy voice with a standard American accent.",
  },
];

/**
 * Curated audio tags specifically for real estate marketing content
 * These tags are professional yet engaging, designed to work well with ElevenLabs v3
 */
export const MARKETING_AUDIO_TAGS = {
  // High-impact emotional tags perfect for real estate marketing
  emotional: [
    "[excited]", // For highlighting amazing features
    "[impressed]", // When showcasing standout elements
    "[whispers]", // For exclusivity and intimacy
    "[sighs]", // For emotional, dream-like moments
    "[curious]", // For engaging questions
    "[surprised]", // For unexpected delights
    "[relieved]", // For "finally found it" moments
    "[warm]", // For welcoming, homey feelings
    "[dreamy]", // For envisioning future life
  ],

  // Professional but engaging delivery styles
  professional: [
    "[thoughtful]", // For considered, expert observations
    "[reassuring]", // For addressing concerns confidently
    "[confident]", // For strong value propositions
    "[conversational]", // For natural, relatable delivery
    "[inviting]", // For welcoming prospects
    "[knowledgeable]", // For expert insights
  ],

  // Subtle emphasis and pacing for natural flow
  pacing: [
    "[pause]", // For dramatic effect before reveals
    "[exhales]", // For moments of appreciation
    "[inhales]", // For anticipation building
    "[slowly]", // For emphasizing luxury details
    "[gently]", // For intimate, personal moments
  ],

  // Engagement and interaction tags
  engagement: [
    "[questioning]", // For rhetorical questions
    "[wonderingly]", // For "imagine if..." moments
    "[enthusiastically]", // For high-energy features
    "[intimately]", // For personal, cozy descriptions
    "[proudly]", // For premium features
  ],

  // Voice-specific tag recommendations based on voice characteristics
  voiceCompatibility: {
    [VOICE_MODEL_IDS.GRANDPA_SPUDS_OXLEY]: ["[warm]", "[thoughtful]", "[reassuring]", "[conversational]", "[proudly]"],
    [VOICE_MODEL_IDS.LAURA]: ["[excited]", "[curious]", "[enthusiastically]", "[surprised]", "[conversational]"],
    [VOICE_MODEL_IDS.AUSTIN]: ["[confident]", "[impressed]", "[excited]", "[proudly]", "[enthusiastically]"],
    [VOICE_MODEL_IDS.ALEXANDRA]: ["[curious]", "[whispers]", "[reassuring]", "[conversational]", "[warm]"],
    [VOICE_MODEL_IDS.ARABELLA]: ["[whispers]", "[sighs]", "[dreamy]", "[intimately]", "[gently]"],
    [VOICE_MODEL_IDS.HUSKY]: ["[confident]", "[thoughtful]", "[reassuring]", "[knowledgeable]", "[warm]"],
  },
};

/**
 * Get recommended audio tags for a specific voice model
 */
export function getVoiceRecommendedTags(voiceId: string): string[] {
  return MARKETING_AUDIO_TAGS.voiceCompatibility[voiceId] || [];
}

/**
 * Get all approved marketing audio tags as a flat array
 */
export function getAllMarketingTags(): string[] {
  return [
    ...MARKETING_AUDIO_TAGS.emotional,
    ...MARKETING_AUDIO_TAGS.professional,
    ...MARKETING_AUDIO_TAGS.pacing,
    ...MARKETING_AUDIO_TAGS.engagement,
  ];
}

/**
 * Get a curated selection of tags for LLM prompt injection
 * Returns a balanced mix suitable for real estate marketing
 */
export function getPromptAudioTags(voiceId?: string): string[] {
  const voiceSpecific = voiceId ? getVoiceRecommendedTags(voiceId) : [];
  const generalSelection = [
    "[excited]",
    "[impressed]",
    "[whispers]",
    "[sighs]",
    "[curious]",
    "[thoughtful]",
    "[reassuring]",
    "[confident]",
    "[warm]",
    "[pause]",
  ];

  // Combine voice-specific tags with general selection, removing duplicates
  return [...new Set([...voiceSpecific, ...generalSelection])];
}
