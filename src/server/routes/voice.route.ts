import { zValidator } from "@hono/zod-validator";
import * as Sentry from "@sentry/nextjs";
import { Hono } from "hono";
import z from "zod";
import * as PostMediaGroupService from "@/services/post-media-group.service";
import * as VoiceService from "@/services/voice-over.service";

/**
 * Voice over generation route
 * Generates and uploads voice over audio from PostMediaGroup scripts
 */
export const voiceRoute = new Hono()

  // POST /voices/generate-voice-over/:groupId
  .post("/generate-voice-over/:groupId", zValidator("param", z.object({ groupId: z.string() })), async (c) => {
    try {
      const { groupId } = c.req.valid("param");
      const postMediaGroup = await PostMediaGroupService.getById(groupId);

      if (!postMediaGroup) {
        return c.json({ error: "Post media group not found", data: null }, 404);
      }

      if (!postMediaGroup.script) {
        return c.json({ error: "Post media group script not found", data: null }, 400);
      }

      const audio = await VoiceService.generateVoiceOver(postMediaGroup.script);
      const audioUrl = await VoiceService.uploadVoiceOver({
        userId: "usr_test1234",
        postId: postMediaGroup.post.id,
        groupId: postMediaGroup.id,
        audio,
      });

      if (!audioUrl) {
        console.error("Failed to upload voice over", audioUrl);
        return c.json({ error: "Failed to upload voice over", data: null }, 500);
      }

      await PostMediaGroupService.update(groupId, { audioUrl });

      return c.json({ error: null, data: { audioUrl } }, 200);
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error generating voice over", error);
      return c.json({ error: "Internal server error", data: null }, 500);
    }
  });
