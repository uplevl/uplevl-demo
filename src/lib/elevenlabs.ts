import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { env } from "@/env";

export const elevenlabs = new ElevenLabsClient({
  apiKey: env.ELEVENLABS_API_KEY,
});
