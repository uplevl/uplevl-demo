import z from "zod";

import { inngest } from "@/server/inngest/client";
import * as JobService from "@/server/services/job.service";
import * as PostService from "@/server/services/post.service";
import * as PostMediaGroupService from "@/server/services/post-media-group.service";
import * as ScriptService from "@/server/services/script.service";

const generateScriptsInputSchema = z.object({
  postId: z.string(),
});

export default inngest.createFunction(
  { id: "generate-scripts" },
  { event: "post/generate-scripts.run" },
  async ({ event, step }) => {
    const { postId } = generateScriptsInputSchema.parse(event.data);
    const jobId = event.id ?? "";

    await step.run("setup", async () => {
      await JobService.update(jobId, { stepName: "setup", postId });
    });

    const scripts = await step.run("generate-scripts", async () => {
      await JobService.update(jobId, { stepName: "generate-scripts" });

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

    await step.run("update-post-media-groups", async () => {
      await JobService.update(jobId, { stepName: "update-post-media-groups" });
      await Promise.all(scripts.map((item) => PostMediaGroupService.update(item.groupId, { script: item.script })));
    });

    await step.run("finish", async () => {
      await JobService.update(jobId, { status: "ready", stepName: "finish" });
    });
  },
);
