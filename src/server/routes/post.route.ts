import { zValidator } from "@hono/zod-validator";
import * as Sentry from "@sentry/nextjs";
import { Hono } from "hono";
import { z } from "zod";
import { GENERATE_FINAL_VIDEO_EVENT } from "@/constants/events";
import { inngest } from "@/inngest/client";
import * as PostService from "@/services/post.service";
import * as PostMediaGroupService from "@/services/post-media-group.service";

export const postRoute = new Hono()

  // GET /posts/:postId/groups - Get the groups for a post
  .get("/:postId/groups", zValidator("param", z.object({ postId: z.string() })), async (c) => {
    try {
      const { postId } = c.req.valid("param");

      const [post, groups] = await Promise.all([
        PostService.getById(postId),
        PostMediaGroupService.getByPostId(postId),
      ]);

      return c.json({ error: null, data: { post, groups } }, 200);
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error getting post media groups", error);
      return c.json({ error: error, data: null }, 500);
    }
  })

  // GET /posts/groups/:groupId
  .get("/groups/:groupId", zValidator("param", z.object({ groupId: z.string() })), async (c) => {
    try {
      const { groupId } = c.req.valid("param");
      const group = await PostMediaGroupService.getById(groupId);
      return c.json({ error: null, data: group }, 200);
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error getting post media group", error);
      return c.json({ error: error, data: null }, 500);
    }
  })

  // POST /posts/groups/:groupId/generate-final-video - Generate final video with voice-over
  .post("/groups/:groupId/generate-final-video", zValidator("param", z.object({ groupId: z.string() })), async (c) => {
    try {
      const { groupId } = c.req.valid("param");

      // Validate that the group exists and has required data
      const group = await PostMediaGroupService.getById(groupId);
      if (!group) {
        return c.json({ error: "Group not found", data: null }, 404);
      }

      if (!group.autoReelUrl) {
        return c.json({ error: "Group does not have an auto-reel video", data: null }, 400);
      }

      if (!group.audioUrl) {
        return c.json({ error: "Group does not have voice-over audio", data: null }, 400);
      }

      if (group.reelUrl) {
        return c.json({ error: "Final video already exists for this group", data: null }, 400);
      }

      // Trigger the Inngest function
      const event = await inngest.send({
        name: GENERATE_FINAL_VIDEO_EVENT,
        data: { groupId },
      });

      return c.json({
        error: null,
        data: {
          eventId: event.ids[0],
          message: "Final video generation started",
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error starting final video generation", error);
      return c.json({ error: "Failed to start video generation", data: null }, 500);
    }
  });
