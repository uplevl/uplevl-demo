import { Hono } from "hono";
import { serve } from "inngest/hono";

import { inngest } from "@/server/inngest/client";
import parseZillowProperty from "@/server/inngest/functions/parse-zillow-property";

export const inngestRoute = new Hono().on(
  ["GET", "PUT", "POST"],
  "/",
  serve({
    client: inngest,
    functions: [parseZillowProperty],
  }),
);
