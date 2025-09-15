import "server-only";

import { Inngest } from "inngest";
import { env } from "@/env";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: env.INNGEST_APP_ID,
  name: "Uplevl Demo",
  signingKey: env.INNGEST_SIGNING_KEY,
  eventKey: env.INNGEST_EVENT_KEY,
});
