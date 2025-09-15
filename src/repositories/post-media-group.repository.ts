import { eq } from "drizzle-orm";

import { db } from "@/database";
import { type InsertPostMediaGroup, PostMediaGroupTable, type UpdatePostMediaGroup } from "@/database/schema";

export async function getByPostId(postId: string) {
  return await db.query.PostMediaGroupTable.findMany({
    where: (postMediaGroup, { eq }) => eq(postMediaGroup.postId, postId),
    orderBy: (postMediaGroup, { desc }) => desc(postMediaGroup.isEstablishingShot),
    with: {
      media: true,
    },
  });
}

export async function create(data: InsertPostMediaGroup) {
  return await db.insert(PostMediaGroupTable).values(data).returning({ id: PostMediaGroupTable.id });
}

export async function update(id: string, data: UpdatePostMediaGroup) {
  return await db
    .update(PostMediaGroupTable)
    .set(data)
    .where(eq(PostMediaGroupTable.id, id))
    .returning({ id: PostMediaGroupTable.id });
}

export type PostMediaGroup = NonNullable<Awaited<ReturnType<typeof getByPostId>>>[number];
