import type { InsertPostMediaGroup } from "@/server/database/schema";
import * as PostMediaGroupRepository from "@/server/repositories/post-media-group.repository";

export async function create(data: InsertPostMediaGroup) {
  const [postMediaGroup] = await PostMediaGroupRepository.create(data);
  if (!postMediaGroup) {
    throw new Error("Failed to create post media group");
  }
  return postMediaGroup;
}

export async function getByPostId(postId: string) {
  const postMediaGroups = await PostMediaGroupRepository.getByPostId(postId);
  return postMediaGroups;
}
