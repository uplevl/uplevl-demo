import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { GENERATE_AUTO_REEL_EVENT, GENERATE_AUTO_REEL_STEPS } from "@/constants/events";
import { inngest } from "@/inngest/client";
import { fetchVideo } from "@/lib/helpers";
import * as JobService from "@/services/job.service";
import * as PostMediaGroupService from "@/services/post-media-group.service";
import * as VideoService from "@/services/video.service";

const generateAutoReelInputSchema = z.object({
  groupId: z.string(),
});

export default inngest.createFunction(
  { id: "generate-auto-reel" },
  { event: GENERATE_AUTO_REEL_EVENT },
  async ({ event, step }) => {
    if (!event.id) {
      throw new Error("Missing event id");
    }
    const eventId = event.id;
    const eventName = event.name;
    let videoStatus: VideoService.Status = "queued";

    // Setup the job
    const { jobId, groupId } = await step.run(GENERATE_AUTO_REEL_STEPS.SETUP, async () => {
      const { groupId } = generateAutoReelInputSchema.parse(event.data);

      const { id: jobId } = await JobService.create({
        id: eventId,
        eventName: eventName,
        stepName: GENERATE_AUTO_REEL_STEPS.SETUP,
        entityId: groupId,
      });

      // Validate group media
      const group = await PostMediaGroupService.getById(groupId);
      const images = Array.isArray(group.media) ? group.media.map((m) => m.mediaUrl).filter(Boolean) : [];
      if (images.length === 0) {
        const error = new Error(`generate-auto-reel: Group ${groupId} has no images`);
        Sentry.captureException(error);
        await JobService.update(jobId, { status: "failed", error: error.message });
        throw error;
      }

      return { jobId, groupId };
    });

    // Start generating the auto reel
    const { videoJobId } = await step.run(GENERATE_AUTO_REEL_STEPS.START_GENERATING, async () => {
      await JobService.update(jobId, { stepName: GENERATE_AUTO_REEL_STEPS.START_GENERATING });

      // Re-fetch and validate that the group still exists
      const group = await PostMediaGroupService.getById(groupId);
      if (!group) {
        const error = new Error(`generate-auto-reel: PostMediaGroup ${groupId} no longer exists`);
        Sentry.captureException(error);
        await JobService.update(jobId, { status: "failed", error: error.message });
        throw error;
      }

      // Filter out deleted media and any media with undefined/null/empty mediaUrl
      const images = Array.isArray(group.media)
        ? group.media.filter((media) => media?.mediaUrl && media.mediaUrl.trim() !== "").map((media) => media.mediaUrl)
        : [];

      // Only proceed if we have valid images
      if (images.length === 0) {
        const error = new Error(`generate-auto-reel: Group ${groupId} has no valid images after filtering`);
        Sentry.captureException(error);
        await JobService.update(jobId, { status: "failed", error: error.message });
        throw error;
      }

      const imageInputs = images.map<VideoService.ImageInput>((image) => ({ image_url: image }));
      const { uuid: videoJobId, status } = await VideoService.createVideo({ image_inputs: imageInputs });

      videoStatus = status;
      return { videoJobId };
    });

    // Wait for the video to be ready
    while (videoStatus === "queued" || videoStatus === "in_progress") {
      const reel = await step.run(GENERATE_AUTO_REEL_STEPS.GET_VIDEO_STATUS, async () => {
        return await VideoService.getReel(videoJobId);
      });
      // Add sleep to avoid hammering the provider
      videoStatus = reel.status;

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (videoStatus === "error") {
      const error = new Error("Failed to generate auto reel");
      Sentry.captureException(error);
      await JobService.update(jobId, { status: "failed", error: error.message });
      throw error;
    }

    const reel = await step.run(GENERATE_AUTO_REEL_STEPS.GET_VIDEO_REEL, async () => {
      return await VideoService.getReel(videoJobId);
    });

    // Upload the video to the storage
    await step.run(GENERATE_AUTO_REEL_STEPS.UPLOAD_VIDEO, async () => {
      const file = await fetchVideo(reel.video_url);
      const group = await PostMediaGroupService.getById(groupId);
      const uploadedVideo = await VideoService.uploadVideo("usr_test1234", group.postId, file);

      if (!uploadedVideo) {
        const error = new Error("Failed to upload video");
        Sentry.captureException(error);
        await JobService.update(jobId, { status: "failed", error: error.message });
        throw error;
      }

      await PostMediaGroupService.update(groupId, { autoReelUrl: uploadedVideo });
    });

    // Finish the job
    await step.run(GENERATE_AUTO_REEL_STEPS.FINISH, async () => {
      await JobService.update(jobId, { status: "ready", stepName: GENERATE_AUTO_REEL_STEPS.FINISH });
    });
  },
);
