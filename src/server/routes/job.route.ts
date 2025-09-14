import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";

import * as JobService from "@/server/services/job.service";

export const jobRoute = new Hono().get("/:id", zValidator("param", z.object({ id: z.string() })), async (c) => {
  const { id } = c.req.valid("param");
  const job = await JobService.getById(id);
  return c.json(job);
});
