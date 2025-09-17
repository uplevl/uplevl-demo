export interface VoiceSchema {
  tone: string;
  style: string;
  perspective: string;
}

export type VoiceModelId = string;

export interface VoiceModel {
  id: VoiceModelId;
  name: string;
  gender: "female" | "male";
  description: string;
}
