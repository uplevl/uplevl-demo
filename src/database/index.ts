import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/database/schema";
import { env } from "@/env";

export const connection = postgres(env.DATABASE_URL, {
  max: env.DB_MIGRATING || env.DB_SEEDING ? 1 : undefined,
  onnotice: env.DB_SEEDING ? () => null : undefined,
  prepare: false,
});

export const db = drizzle(connection, {
  schema,
  logger: env.NODE_ENV === "development",
});
