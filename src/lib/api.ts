import { hc } from "hono/client";
import type { AppType } from "@/server/app";

export async function getApi() {
  const client = hc<AppType>("http://localhost:3000");

  return client.api;
}
