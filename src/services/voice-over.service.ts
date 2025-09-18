import * as Sentry from "@sentry/nextjs";

import { AUDIO_OUTPUT_FORMAT, MODEL_ID, VOICE_MODEL_IDS } from "@/constants/voice";
import { elevenlabs } from "@/lib/elevenlabs";
import { bucket } from "@/lib/supabase";

function getStoragePath(userId: string, postId: string) {
  return `${userId}/post_${postId}/uploads/voice-overs`;
}

export async function generateVoiceOver(script: string) {
  try {
    return await elevenlabs.textToSpeech.convert(VOICE_MODEL_IDS.ARABELLA, {
      text: script,
      modelId: MODEL_ID,
      outputFormat: AUDIO_OUTPUT_FORMAT,
    });
  } catch (error) {
    Sentry.captureException(error);
    throw new Error("Failed to generate voice over");
  }
}

interface UploadVoiceOverProps {
  userId: string;
  postId: string;
  groupId: string;
  audio: ReadableStream<Uint8Array>;
}

export async function uploadVoiceOver(props: UploadVoiceOverProps) {
  const { userId, postId, groupId, audio } = props;
  const path = getStoragePath(userId, postId);
  const filePath = `${path}/${groupId}.mp3`;

  try {
    const { data, error } = await bucket.upload(filePath, audio, {
      upsert: true,
    });

    if (error) {
      Sentry.captureException(error, {
        tags: { userId, postId, groupId },
        extra: { path: filePath },
      });

      Sentry.logger.error("Failed to upload voice over", {
        userId,
        postId,
        groupId,
        path: filePath,
        error: error.message,
      });

      return null;
    }

    return data.path;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { userId, postId, groupId },
      extra: { path: filePath },
    });

    Sentry.logger.error("Failed to upload voice over", {
      userId,
      postId,
      groupId,
      path: filePath,
      error: error instanceof Error ? error.message : String(error),
    });

    return null;
  }
}
