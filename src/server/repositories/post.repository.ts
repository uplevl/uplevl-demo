import { eq } from "drizzle-orm";

import { db } from "@/server/database";
import { type InsertPost, PostTable, type UpdatePost } from "@/server/database/schema";

export async function create(data: InsertPost = {}) {
  return await db.insert(PostTable).values(data).returning({ id: PostTable.id });
}

export async function update(postId: string, data: UpdatePost) {
  return await db.update(PostTable).set(data).where(eq(PostTable.id, postId)).returning({ id: PostTable.id });
}

export async function getById(postId: string) {
  return await db.query.PostTable.findFirst({
    where: (post, { eq }) => eq(post.id, postId),
  });
}
