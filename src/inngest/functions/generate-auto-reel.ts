import * as z from "zod";
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
    const eventId = event.id ?? "";
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

      return { jobId, groupId };
    });

    // Start generating the auto reel
    const { videoJobId } = await step.run(GENERATE_AUTO_REEL_STEPS.START_GENERATING, async () => {
      await JobService.update(jobId, { stepName: GENERATE_AUTO_REEL_STEPS.START_GENERATING });
      const group = await PostMediaGroupService.getById(groupId);
      const images = group.media.map((media) => media.mediaUrl);

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
      videoStatus = reel.status;
    }

    if (videoStatus === "error") {
      await JobService.update(jobId, { status: "failed", error: "Failed to generate auto reel" });
      throw new Error("Failed to generate auto reel");
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
        await JobService.update(jobId, { status: "failed", error: "Failed to upload video" });
        throw new Error("Failed to upload video");
      }

      await PostMediaGroupService.update(groupId, { autoReelUrl: uploadedVideo });
    });

    // Finish the job
    await step.run(GENERATE_AUTO_REEL_STEPS.FINISH, async () => {
      await JobService.update(jobId, { status: "ready", stepName: GENERATE_AUTO_REEL_STEPS.FINISH });
    });
  },
);
