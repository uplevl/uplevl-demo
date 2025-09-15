import { eq } from "drizzle-orm";

import { db } from "@/database";
import { type InsertPostMedia, PostMediaTable, type UpdatePostMedia } from "@/database/schema";

export async function create(data: InsertPostMedia) {
  return await db.insert(PostMediaTable).values(data).returning({ id: PostMediaTable.id });
}

export async function createMany(data: InsertPostMedia[]) {
  return await db.insert(PostMediaTable).values(data).returning({ id: PostMediaTable.id });
}

export async function update(id: string, data: UpdatePostMedia) {
  return await db
    .update(PostMediaTable)
    .set(data)
    .where(eq(PostMediaTable.id, id))
    .returning({ id: PostMediaTable.id });
}

export async function updateByUrl(url: string, data: UpdatePostMedia) {
  return await db
    .update(PostMediaTable)
    .set(data)
    .where(eq(PostMediaTable.mediaUrl, url))
    .returning({ id: PostMediaTable.id });
}
