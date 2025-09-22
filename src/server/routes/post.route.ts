import { zValidator } from "@hono/zod-validator";
import * as Sentry from "@sentry/nextjs";
import { Hono } from "hono";
import { z } from "zod";

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
  });
