import { eq } from "drizzle-orm";

import { db } from "@/server/database";
import { type InsertJob, JobTable, type UpdateJob } from "@/server/database/schema";

export async function create(data: InsertJob) {
  return await db.insert(JobTable).values(data).returning({ id: JobTable.id });
}

export async function update(id: string, data: UpdateJob) {
  return await db.update(JobTable).set(data).where(eq(JobTable.id, id)).returning({ id: JobTable.id });
}

export async function getById(id: string) {
  return await db.select().from(JobTable).where(eq(JobTable.id, id));
}
