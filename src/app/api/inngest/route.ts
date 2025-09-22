import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import generateAutoReel from "@/inngest/functions/generate-auto-reel";
import generateScripts from "@/inngest/functions/generate-scripts";
import parseZillowProperty from "@/inngest/functions/parse-zillow-property";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [parseZillowProperty, generateScripts, generateAutoReel],
});
