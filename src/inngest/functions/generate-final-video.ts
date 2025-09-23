import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { GENERATE_FINAL_VIDEO_EVENT, GENERATE_FINAL_VIDEO_STEPS } from "@/constants/events";
import { inngest } from "@/inngest/client";
import { fetchVideo } from "@/lib/helpers";
import * as JobService from "@/services/job.service";
import * as PostMediaGroupService from "@/services/post-media-group.service";
import * as RemotionService from "@/services/remotion.service";
import * as VideoService from "@/services/video.service";

const generateFinalVideoInputSchema = z.object({
  groupId: z.string(),
});

/**
 * Inngest function to generate final video combining auto-reel with voice-over
 * This function uses Remotion Lambda to render the final composition
 */
export default inngest.createFunction(
  { id: "generate-final-video" },
  { event: GENERATE_FINAL_VIDEO_EVENT },
  async ({ event, step }) => {
    if (!event.id) {
      throw new Error("Missing event id");
    }

    const eventId = event.id;
    const eventName = event.name;

    // Setup the job
    const { jobId, groupId, group, audioUrl, autoReelUrl } = await step.run(
      GENERATE_FINAL_VIDEO_STEPS.SETUP,
      async () => {
        const { groupId } = generateFinalVideoInputSchema.parse(event.data);

        const { id: jobId } = await JobService.create({
          id: eventId,
          eventName: eventName,
          stepName: GENERATE_FINAL_VIDEO_STEPS.SETUP,
          entityId: groupId,
        });

        // Validate that group has required data
        const group = await PostMediaGroupService.getById(groupId);

        if (!group.autoReelUrl) {
          const error = new Error(`Group ${groupId} does not have an auto-reel video`);
          Sentry.captureException(error);
          await JobService.update(jobId, { status: "failed", error: error.message });
          throw error;
        }

        if (!group.audioUrl) {
          const error = new Error(`Group ${groupId} does not have voice-over audio`);
          Sentry.captureException(error);
          await JobService.update(jobId, { status: "failed", error: error.message });
          throw error;
        }

        return { jobId, groupId, group, audioUrl: group.audioUrl, autoReelUrl: group.autoReelUrl };
      },
    );

    // Calculate timing and playback rate
    const { playbackRate, audioPadding, compositionId, framesPerLambda } = await step.run(
      GENERATE_FINAL_VIDEO_STEPS.CALCULATE_TIMING,
      async () => {
        await JobService.update(jobId, { stepName: GENERATE_FINAL_VIDEO_STEPS.CALCULATE_TIMING });

        const audioDuration = await RemotionService.getAudioDuration(audioUrl);
        const videoDuration = await RemotionService.getVideoDuration(autoReelUrl);

        const targetDuration = RemotionService.calculateTargetDuration(audioDuration);
        const audioPadding = RemotionService.calculateAudioPadding(audioDuration, targetDuration);
        const playbackRate = RemotionService.calculatePlaybackRate(videoDuration, targetDuration);

        const frames = Math.floor(targetDuration * 25);
        let framesPerLambda = Math.ceil(frames / 9);
        if (framesPerLambda < 100) {
          framesPerLambda = 100;
        }
        // Choose composition based on aspect ratio preference (default to vertical for social media)
        const compositionId = "FinalVideoVertical";

        return { playbackRate, audioPadding, compositionId, framesPerLambda };
      },
    );

    // Start Remotion render
    const { renderId } = await step.run(GENERATE_FINAL_VIDEO_STEPS.START_REMOTION_RENDER, async () => {
      await JobService.update(jobId, { stepName: GENERATE_FINAL_VIDEO_STEPS.START_REMOTION_RENDER });

      const renderResult = await RemotionService.startRender({
        compositionId,
        inputProps: {
          videoUrl: autoReelUrl,
          audioUrl: audioUrl,
          playbackRate,
          audioPadding, // Calculated padding to center audio
        },
        outName: `final-video-${groupId}`,
        framesPerLambda,
      });

      return { renderId: renderResult.renderId };
    });

    // Wait for the render to be ready - following the same pattern as generate-auto-reel
    await JobService.update(jobId, { stepName: GENERATE_FINAL_VIDEO_STEPS.WAIT_FOR_RENDER });

    let renderProgress: RemotionService.RenderProgressResult = {
      done: false,
      fatalErrorEncountered: false,
      errors: [],
      outputFile: undefined,
      overallProgress: 0,
    };

    while (!renderProgress.done && !renderProgress.fatalErrorEncountered) {
      await step.sleep("sleep-timeout", 10000);

      renderProgress = await step.run(GENERATE_FINAL_VIDEO_STEPS.WAIT_FOR_RENDER, async () => {
        return await RemotionService.getRenderProgress(renderId);
      });
    }

    // Check for fatal errors
    if (renderProgress.fatalErrorEncountered) {
      const errorMessage = renderProgress.errors.length > 0 ? renderProgress.errors.join(", ") : "Unknown render error";
      const error = new Error(`Render failed: ${errorMessage}`);
      Sentry.captureException(error);
      await JobService.update(jobId, { status: "failed", error: error.message });
      throw error;
    }

    const finalVideoUrl = renderProgress.outputFile;
    if (!finalVideoUrl) {
      const error = new Error("Render completed but no output file was generated");
      Sentry.captureException(error);
      await JobService.update(jobId, { status: "failed", error: error.message });
      throw error;
    }

    // Upload final video to our storage and update group
    await step.run(GENERATE_FINAL_VIDEO_STEPS.UPLOAD_FINAL_VIDEO, async () => {
      await JobService.update(jobId, { stepName: GENERATE_FINAL_VIDEO_STEPS.UPLOAD_FINAL_VIDEO });

      try {
        // Download the video from Remotion's S3
        const videoFile = await fetchVideo(finalVideoUrl);
        // Upload to our video service
        const uploadedVideoUrl = await VideoService.uploadVideo("usr_test1234", group.postId, videoFile);

        if (!uploadedVideoUrl) {
          throw new Error("Failed to upload final video to storage");
        }

        // Update the group with the final video URL
        await PostMediaGroupService.update(groupId, { reelUrl: uploadedVideoUrl });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to upload final video";
        Sentry.captureException(error);
        await JobService.update(jobId, { status: "failed", error: message });
        throw error;
      }
    });

    // Finish the job
    await step.run(GENERATE_FINAL_VIDEO_STEPS.FINISH, async () => {
      await JobService.update(jobId, { status: "ready", stepName: GENERATE_FINAL_VIDEO_STEPS.FINISH });
    });
  },
);
