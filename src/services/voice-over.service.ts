import { AUDIO_OUTPUT_FORMAT, MODEL_ID, VOICE_MODEL_IDS } from "@/constants/voice";
import { elevenlabs } from "@/lib/elevenlabs";
import { bucket } from "@/lib/supabase";

function getStoragePath(userId: string, postId: string) {
  return `${userId}/post_${postId}/uploads/voice-overs`;
}

export async function generateVoiceOver(script: string) {
  return await elevenlabs.textToSpeech.convert(VOICE_MODEL_IDS.ARABELLA, {
    text: script,
    modelId: MODEL_ID,
    outputFormat: AUDIO_OUTPUT_FORMAT,
  });
}

interface UploadVoiceOverProps {
  userId: string;
  postId: string;
  groupId: string;
  audio: ReadableStream<Uint8Array<ArrayBufferLike>>;
}

export async function uploadVoiceOver(props: UploadVoiceOverProps) {
  const { userId, postId, groupId, audio } = props;
  const path = getStoragePath(userId, postId);
  const { data, error } = await bucket.upload(`${path}/${groupId}.mp3`, audio, {
    upsert: true,
  });

  if (error) {
    console.error("Error uploading voice over", error);
    return null;
  }

  return data.path;
}
