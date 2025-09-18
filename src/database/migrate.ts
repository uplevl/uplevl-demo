import * as Sentry from "@sentry/nextjs";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { connection, db } from "@/database";

import { env } from "@/env";

import drizzleConfig from "../../drizzle.config";

(async () => {
  try {
    if (!env.DB_MIGRATING) {
      throw new Error("You must set DB_MIGRATING to true when running migrations");
    }

    console.log("[Uplevl]: ⚙️ Migrating database...");
    await migrate(db, { migrationsFolder: drizzleConfig.out });
    console.log("[Uplevl]: ✅ Database migrated successfully");
  } catch (error) {
    console.error("[Uplevl]: ❌ Error migrating database:", error);
    Sentry.captureException(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();
