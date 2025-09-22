import { zValidator } from "@hono/zod-validator";
import * as Sentry from "@sentry/nextjs";
import { Hono } from "hono";
import { z } from "zod";

import * as JobService from "@/services/job.service";

export const jobRoute = new Hono()

  // GET /jobs/:id
  .get(
    "/:id/:entityType",
    zValidator("param", z.object({ id: z.string(), entityType: z.enum(["post", "group"]) })),
    async (c) => {
      return Sentry.startSpan(
        {
          op: "http.server",
          name: `GET /jobs/${c.req.param("id")}/${c.req.param("entityType")}`,
        },
        async () => {
          try {
            const { id, entityType } = c.req.valid("param");

            const job = await Sentry.startSpan(
              {
                op: "db.query",
                name: "JobService.getById",
              },
              async () => {
                return JobService.getById(id, entityType);
              },
            );

            return c.json({ error: null, data: job }, 200);
          } catch (error) {
            Sentry.captureException(error);
            console.error("Error getting job", error);

            // Check if it's a "not found" error
            if (error instanceof Error && error.message.includes("not found")) {
              return c.json({ error: "Job not found", data: null }, 404);
            }

            return c.json({ error: "Internal server error", data: null }, 500);
          }
        },
      );
    },
  );
