import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { inngest } from "@/inngest/client";

export const eventsRoute = new Hono()

  // POST /events/inngest
  .post("/inngest", zValidator("json", z.object({ eventName: z.string(), data: z.any() })), async (c) => {
    const { eventName, data } = c.req.valid("json");
    const eventResult = await inngest.send({
      name: eventName,
      data,
    });
    const eventId = eventResult.ids[0];

    return c.json({ eventId });
  });
