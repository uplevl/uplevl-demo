import { Inngest } from "inngest";
import { env } from "@/env";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "uplevl-demo", signingKey: env.INNGEST_SIGNING_KEY });
