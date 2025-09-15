import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]).default("development"),

    DATABASE_URL: z.string().min(1),
    DB_MIGRATING: z.coerce.boolean().default(false),
    DB_SEEDING: z.coerce.boolean().default(false),

    OPEN_ROUTER_API_KEY: z.string().min(1),

    UPSTASH_REDIS_REST_URL: z.string().min(1),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    BRIGHT_DATA_API_KEY: z.string().min(1),

    SUPABASE_URL: z.string().min(1),
    SUPABASE_ANON_KEY: z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_URL: z.string().min(1),
    NEXT_PUBLIC_INNGEST_SIGNING_KEY: z.string().min(1),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DB_MIGRATING: process.env.DB_MIGRATING,
    DB_SEEDING: process.env.DB_SEEDING,
    NEXT_PUBLIC_INNGEST_SIGNING_KEY: process.env.NEXT_PUBLIC_INNGEST_SIGNING_KEY,
    OPEN_ROUTER_API_KEY: process.env.OPEN_ROUTER_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    BRIGHT_DATA_API_KEY: process.env.BRIGHT_DATA_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },

  emptyStringAsUndefined: true,
});
