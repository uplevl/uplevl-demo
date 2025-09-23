import {
  type AwsRegion,
  getRenderProgress as getRenderProgressBase,
  renderMediaOnLambda,
} from "@remotion/lambda/client";
import { parseMedia } from "@remotion/media-parser";
import * as Sentry from "@sentry/nextjs";
import { env } from "@/env";
import type { FinalVideoCompositionProps } from "@/remotion/composition";

export interface RenderVideoInput {
  compositionId: string;
  inputProps: FinalVideoCompositionProps;
  outName?: string;
  framesPerLambda?: number;
}

export interface RenderResult {
  renderId: string;
  bucketName: string;
  url?: string;
}

export interface RenderProgressResult {
  done: boolean;
  overallProgress: number;
  outputFile?: string;
  errors: string[];
  fatalErrorEncountered: boolean;
}

/**
 * Service for interacting with Remotion Lambda
 * Handles video rendering in AWS Lambda using the light client
 */

const region = env.REMOTION_AWS_REGION as AwsRegion;
const bucketName = env.REMOTION_BUCKET_NAME;
const functionName = env.REMOTION_FUNCTION_NAME;
const serveUrl = env.REMOTION_SERVE_URL;

/**
 * Ensure output name has proper video file extension for h264 codec
 */
function ensureVideoExtension(outName?: string): string | undefined {
  if (!outName) return undefined;

  // Check if outName already has a valid video extension
  // Using MP3 audio codec, so MP4 container is preferred
  const validExtensions = [".mp4", ".mkv", ".mov"];
  const hasValidExtension = validExtensions.some((ext) => outName.toLowerCase().endsWith(ext));

  if (hasValidExtension) {
    return outName;
  }

  // Add .mp4 extension if no valid extension exists
  return `${outName}.mp4`;
}

/**
 * Start a video render on Remotion Lambda
 */
export async function startRender(input: RenderVideoInput): Promise<RenderResult> {
  const { compositionId, inputProps, outName, framesPerLambda = 100 } = input;
  return Sentry.startSpan(
    {
      op: "remotion.render",
      name: `Remotion render: ${compositionId}`,
    },
    async (span) => {
      try {
        span.setAttribute("composition", compositionId);
        span.setAttribute("region", region);

        const result = await renderMediaOnLambda({
          region: region,
          functionName: functionName,
          serveUrl: serveUrl,
          composition: compositionId,
          inputProps: inputProps as Record<string, unknown>,
          codec: "h264",
          imageFormat: "jpeg",
          maxRetries: 3,
          privacy: "public",
          audioCodec: "mp3", // MP3 is faster to encode than AAC
          outName: ensureVideoExtension(outName),
          jpegQuality: 85,
          scale: 1,
          framesPerLambda: framesPerLambda,
          concurrencyPerLambda: 1, // Keep at 1 for stability with video input
        });

        span.setAttribute("renderId", result.renderId);

        return {
          renderId: result.renderId,
          bucketName: result.bucketName,
        };
      } catch (error) {
        Sentry.captureException(error);
        span.setAttribute("error", true);
        throw new Error(`Failed to start Remotion render: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
  );
}

/**
 * Get the progress of a render
 */
export async function getRenderProgress(renderId: string): Promise<RenderProgressResult> {
  return Sentry.startSpan(
    {
      op: "remotion.progress",
      name: `Remotion progress: ${renderId}`,
    },
    async (span) => {
      try {
        span.setAttribute("renderId", renderId);

        const progress = await getRenderProgressBase({
          renderId,
          bucketName: bucketName,
          functionName: functionName,
          region: region,
        });

        span.setAttribute("done", progress.done);
        span.setAttribute("progress", progress.overallProgress);

        return {
          done: progress.done,
          overallProgress: progress.overallProgress,
          outputFile: progress.outputFile || undefined,
          errors: progress.errors.map((e) => e.message || String(e)),
          fatalErrorEncountered: progress.fatalErrorEncountered,
        };
      } catch (error) {
        Sentry.captureException(error);
        span.setAttribute("error", true);
        throw new Error(`Failed to get render progress: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
  );
}

/**
 * Get the duration of a video file
 */
export async function getVideoDuration(videoUrl: string) {
  const result = await parseMedia({
    src: videoUrl,
    fields: {
      durationInSeconds: true,
    },
  });

  return result.durationInSeconds ?? 0;
}

/**
 * Get the duration of an audio file
 */
export async function getAudioDuration(audioUrl: string) {
  const result = await parseMedia({
    src: audioUrl,
    fields: {
      durationInSeconds: true,
    },
  });

  return result.durationInSeconds ?? 0;
}

/**
 * Calculate audio padding to center the audio within the video duration
 */
export function calculateAudioPadding(audioDuration: number, videoDuration: number) {
  return Math.max(0, (videoDuration - audioDuration) / 2);
}

/**
 * Calculate target duration based on audio duration
 */
export function calculateTargetDuration(audioDuration: number) {
  return audioDuration > 20 ? 30 : 20;
}

export function calculatePlaybackRate(videoDuration: number, targetDuration: number) {
  // Calculate playback rate to fit original video into target duration
  const playbackRate = videoDuration / targetDuration;

  return Math.max(0.5, Math.min(playbackRate, 2.0)); // Clamp between 0.5x and 2x
}
