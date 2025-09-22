import { eq } from "drizzle-orm";

import { db } from "@/database";
import { type InsertJob, JobTable, type UpdateJob } from "@/database/schema";

import * as PostRepository from "./post.repository";
import * as PostMediaGroupRepository from "./post-media-group.repository";

export async function create(data: InsertJob) {
  // Use onConflictDoNothing to make the insert idempotent
  const result = await db
    .insert(JobTable)
    .values(data)
    .onConflictDoNothing({ target: JobTable.id })
    .returning({ id: JobTable.id });

  if (result.length > 0) {
    // Successfully inserted new record
    return result;
  }

  // Record already exists due to conflict, fetch it
  const existingJob = await db.query.JobTable.findFirst({
    where: (job, { eq }) => eq(job.id, data.id),
    columns: { id: true },
  });

  if (!existingJob) {
    throw new Error("Failed to create or retrieve job");
  }

  return [existingJob];
}

export async function update(id: string, data: UpdateJob) {
  return await db.update(JobTable).set(data).where(eq(JobTable.id, id)).returning({ id: JobTable.id });
}

export async function getById(id: string, entityType?: "post" | "group") {
  const job = await db.query.JobTable.findFirst({
    where: (job, { eq }) => eq(job.id, id),
  });

  let entity: PostRepository.Post | PostMediaGroupRepository.PostMediaGroup | undefined;

  if (job) {
    if (entityType === "post") {
      entity = await PostRepository.getById(job.entityId);
    } else if (entityType === "group") {
      entity = await PostMediaGroupRepository.getById(job.entityId);
    }
  }

  return { job, entity };
}

export type Job = NonNullable<Awaited<ReturnType<typeof getById>>>;
