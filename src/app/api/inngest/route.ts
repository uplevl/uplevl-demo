import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import parseZillowProperty from "@/inngest/functions/parse-zillow-property";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [parseZillowProperty],
});

// This is needed to run a long running task on Netlify.
// The default timeout is 30 seconds.
// @see https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/legacy-runtime/advanced-api-routes/#background-api-routes
export const config = {
  type: "experimental-background",
};
