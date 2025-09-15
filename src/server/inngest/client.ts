import "server-only";

import { Inngest } from "inngest";
import { env } from "@/env";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: env.INNGEST_APP_ID,
  signingKey: env.INNGEST_SIGNING_KEY,
});
