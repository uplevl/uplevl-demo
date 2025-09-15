import { Redis } from "@upstash/redis";
import { env } from "@/env";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export function createCacheKey(props: (string | number)[]) {
  return props.map((prop) => String(prop)).join(":");
}

export async function addEntry<T>(cacheKey: string, entry: T, ex?: number) {
  const result = await redis.set(cacheKey, entry, ex ? { ex } : undefined);
  return result;
}

export async function getEntry<T>(cacheKey: string) {
  const entry = await redis.get<T>(cacheKey);
  return entry;
}
