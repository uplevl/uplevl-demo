import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import * as z from "zod";

import * as JobService from "@/services/job.service";

export const jobRoute = new Hono()

  // GET /jobs/:id
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.string(), entityType: z.enum(["post", "group"]).optional() })),
    async (c) => {
      const { id, entityType } = c.req.valid("param");
      const job = await JobService.getById(id, entityType);
      return c.json(job);
    },
  );
