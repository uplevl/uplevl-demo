import type { Config } from "drizzle-kit";

import { env } from "./src/env";

export default {
  schema: "./src/server/database/schema.ts",
  out: "./src/server/database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config;
