import z from "zod";
import { GENERATE_SCRIPTS_EVENT, GENERATE_SCRIPTS_STEPS } from "@/constants/events";
import { inngest } from "@/inngest/client";
import * as JobService from "@/services/job.service";
import * as PostService from "@/services/post.service";
import * as PostMediaGroupService from "@/services/post-media-group.service";
import * as ScriptService from "@/services/script.service";

const generateScriptsInputSchema = z.object({
  postId: z.string(),
});

export default inngest.createFunction(
  { id: "generate-scripts" },
  { event: GENERATE_SCRIPTS_EVENT },
  async ({ event, step }) => {
    if (!event.id) {
      throw new Error("Missing event id");
    }
    const eventId = event.id;
    const eventName = event.name;

    // Setup the job
    const { jobId, postId } = await step.run(GENERATE_SCRIPTS_STEPS.SETUP, async () => {
      const { postId } = generateScriptsInputSchema.parse(event.data);
      const { id: jobId } = await JobService.create({
        id: eventId,
        eventName: eventName,
        stepName: GENERATE_SCRIPTS_STEPS.SETUP,
        postId: postId,
      });

      return { jobId, postId };
    });

    // Generate the scripts
    const scripts = await step.run(GENERATE_SCRIPTS_STEPS.GENERATE_SCRIPTS, async () => {
      await JobService.update(jobId, { stepName: GENERATE_SCRIPTS_STEPS.GENERATE_SCRIPTS });

      const [post, groups] = await Promise.all([
        PostService.getById(postId),
        PostMediaGroupService.getByPostId(postId),
      ]);

      return await ScriptService.generateScripts({
        groups,
        propertyContext: post.propertyContext ?? "",
        voiceSchema: ScriptService.DEFAULT_VOICE_SCHEMA,
      });
    });

    // Update the post media groups with the scripts
    await step.run(GENERATE_SCRIPTS_STEPS.UPDATE_POST_MEDIA_GROUPS, async () => {
      await JobService.update(jobId, { stepName: GENERATE_SCRIPTS_STEPS.UPDATE_POST_MEDIA_GROUPS });
      await Promise.all(scripts.map((item) => PostMediaGroupService.update(item.groupId, { script: item.script })));
      await PostService.update(postId, { hasScripts: true });
    });

    await step.run(GENERATE_SCRIPTS_STEPS.FINISH, async () => {
      await JobService.update(jobId, { status: "ready", stepName: GENERATE_SCRIPTS_STEPS.FINISH });
    });
  },
);
