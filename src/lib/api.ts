import { hc } from "hono/client";
import { env } from "@/env";
import type { AppType } from "@/server/app";

export async function getApi() {
  const client = hc<AppType>(env.NEXT_PUBLIC_URL);

  return client.api;
}
