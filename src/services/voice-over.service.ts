import * as Sentry from "@sentry/nextjs";

import { AUDIO_OUTPUT_FORMAT, DEFAULT_VOICE_ID, MODEL_ID } from "@/constants/voice";
import { elevenlabs } from "@/lib/elevenlabs";
import { bucket } from "@/lib/supabase";

function getStoragePath(userId: string, postId: string) {
  return `${userId}/post_${postId}/uploads/voice-overs`;
}

export async function generateVoiceOver(script: string, voiceId: string = DEFAULT_VOICE_ID) {
  try {
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text: script,
      modelId: MODEL_ID,
      outputFormat: AUDIO_OUTPUT_FORMAT,
      voiceSettings: {
        stability: 0,
        speed: 1.2,
      },
    });

    // Convert ReadableStream to Buffer for Supabase upload
    const reader = audioStream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Combine all chunks into a single buffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    return buffer;
  } catch (error) {
    Sentry.captureException(error);
    throw new Error("Failed to generate voice over");
  }
}

interface UploadVoiceOverProps {
  userId: string;
  postId: string;
  groupId: string;
  audio: Uint8Array;
}

export async function uploadVoiceOver(props: UploadVoiceOverProps) {
  const { userId, postId, groupId, audio } = props;
  const path = getStoragePath(userId, postId);
  const filePath = `${path}/${groupId}.mp3`;

  try {
    const { error } = await bucket.upload(filePath, audio, {
      upsert: true,
      contentType: "audio/mpeg",
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

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = bucket.getPublicUrl(filePath);
    return publicUrlData.publicUrl;
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
