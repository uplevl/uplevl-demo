import type { InsertPost, UpdatePost } from "@/database/schema";
import * as PostRepository from "@/repositories/post.repository";

export async function getById(postId: string) {
  const post = await PostRepository.getById(postId);
  if (!post) {
    throw new Error("Post not found");
  }
  return post;
}

export async function create(data: InsertPost = {}) {
  const [post] = await PostRepository.create(data);
  if (!post) {
    throw new Error("Failed to create post");
  }
  return post;
}

export async function update(postId: string, data: UpdatePost) {
  const [post] = await PostRepository.update(postId, data);
  if (!post) {
    throw new Error("Failed to update post");
  }
  return post;
}
