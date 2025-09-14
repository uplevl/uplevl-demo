import { Hono } from "hono";
import { serve } from "inngest/hono";
import { inngest } from "@/inngest/client";
import parseZillowProperty from "@/inngest/functions/parse-zillow-property";

export const inngestRoute = new Hono().on(
  ["GET", "PUT", "POST"],
  "/",
  serve({
    client: inngest,
    functions: [parseZillowProperty],
  }),
);
