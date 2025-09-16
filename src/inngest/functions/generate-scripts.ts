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
    const { postId } = generateScriptsInputSchema.parse(event.data);
    const jobId = event.id ?? "";

    await step.run(GENERATE_SCRIPTS_STEPS.SETUP, async () => {
      await JobService.update(jobId, { stepName: GENERATE_SCRIPTS_STEPS.SETUP, postId });
    });

    const scripts = await step.run(GENERATE_SCRIPTS_STEPS.GENERATE_SCRIPTS, async () => {
      await JobService.update(jobId, { stepName: GENERATE_SCRIPTS_STEPS.GENERATE_SCRIPTS });

      const [post, groups] = await Promise.all([
        PostService.getById(postId),
        PostMediaGroupService.getByPostId(postId),
      ]);

      return await ScriptService.generateScripts({
        groups,
        propertyStats: post.propertyStats,
        location: post.location,
        voiceSchema: ScriptService.DEFAULT_VOICE_SCHEMA,
      });
    });

    await step.run(GENERATE_SCRIPTS_STEPS.UPDATE_POST_MEDIA_GROUPS, async () => {
      await JobService.update(jobId, { stepName: GENERATE_SCRIPTS_STEPS.UPDATE_POST_MEDIA_GROUPS });
      await Promise.all(scripts.map((item) => PostMediaGroupService.update(item.groupId, { script: item.script })));
    });

    await step.run(GENERATE_SCRIPTS_STEPS.FINISH, async () => {
      await JobService.update(jobId, { status: "ready", stepName: GENERATE_SCRIPTS_STEPS.FINISH });
    });
  },
);
