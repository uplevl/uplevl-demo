import type { InsertPostMedia, UpdatePostMedia } from "@/server/database/schema";
import * as PostMediaRepository from "@/server/repositories/post-media.repository";

export async function create(data: InsertPostMedia) {
  const [postMedia] = await PostMediaRepository.create(data);
  if (!postMedia) {
    throw new Error("Failed to create post media");
  }
  return postMedia;
}

export async function createMany(data: InsertPostMedia[]) {
  const postMedias = await PostMediaRepository.createMany(data);
  if (postMedias.length === 0) {
    throw new Error("Failed to create post media");
  }
  return postMedias;
}

export async function update(id: string, data: UpdatePostMedia) {
  const [postMedia] = await PostMediaRepository.update(id, data);
  if (!postMedia) {
    throw new Error("Failed to update post media");
  }
  return postMedia;
}

export async function updateByUrl(url: string, data: UpdatePostMedia) {
  const [postMedia] = await PostMediaRepository.updateByUrl(url, data);
  if (!postMedia) {
    throw new Error("Failed to update post media");
  }
  return postMedia;
}
