import { timestamp, uuid } from "drizzle-orm/pg-core";

export const id = uuid("id").primaryKey().defaultRandom();

export const createdAt = timestamp("created_at", { mode: "string" }).defaultNow().notNull();

export const updatedAt = timestamp("updated_at", { mode: "string" })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date().toISOString());
