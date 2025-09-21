import type { InsertJob, UpdateJob } from "@/database/schema";
import * as JobRepository from "@/repositories/job.repository";

export async function create(data: InsertJob) {
  const [job] = await JobRepository.create(data);
  if (!job) {
    throw new Error("Failed to create post job");
  }
  return job;
}

export async function update(id: string, data: UpdateJob) {
  const [job] = await JobRepository.update(id, data);
  if (!job) {
    throw new Error("Failed to update post job");
  }
  return job;
}

export async function getById(id: string, entityType?: "post" | "group") {
  const job = await JobRepository.getById(id, entityType);
  if (!job) {
    throw new Error("Post job not found");
  }
  return job;
}
