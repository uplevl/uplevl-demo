import type { InsertPostMediaGroup, UpdatePostMediaGroup } from "@/database/schema";
import * as PostMediaGroupRepository from "@/repositories/post-media-group.repository";

export async function create(data: InsertPostMediaGroup) {
  const [postMediaGroup] = await PostMediaGroupRepository.create(data);
  if (!postMediaGroup) {
    throw new Error("Failed to create post media group");
  }
  return postMediaGroup;
}

export async function getByPostId(postId: string) {
  const postMediaGroups = await PostMediaGroupRepository.getByPostId(postId);
  if (!postMediaGroups.length) {
    throw new Error("Post media groups not found");
  }
  return postMediaGroups;
}

export async function getById(id: string) {
  const postMediaGroup = await PostMediaGroupRepository.getById(id);
  if (!postMediaGroup) {
    throw new Error("Post media group not found");
  }
  return postMediaGroup;
}

export async function update(id: string, data: UpdatePostMediaGroup) {
  const [postMediaGroup] = await PostMediaGroupRepository.update(id, data);
  if (!postMediaGroup) {
    throw new Error("Failed to update post media group");
  }
  return postMediaGroup;
}
