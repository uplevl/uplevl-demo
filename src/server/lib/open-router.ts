import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "@/env";

export const openRouter = createOpenRouter({
  apiKey: env.OPEN_ROUTER_API_KEY,
});
