import { hc } from "hono/client";
import type { AppType } from "@/server/app";

export default function useApi() {
  const client = hc<AppType>("http://localhost:3000");

  return client.api;
}
