import type { InsertJob, UpdateJob } from "@/server/database/schema";
import * as JobRepository from "@/server/repositories/job.repository";

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

export async function getById(id: string) {
  const [job] = await JobRepository.getById(id);
  if (!job) {
    throw new Error("Post job not found");
  }
  return job;
}
