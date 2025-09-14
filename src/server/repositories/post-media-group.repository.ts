import { db } from "@/server/database";
import { type InsertPostMediaGroup, PostMediaGroupTable } from "@/server/database/schema";

export async function create(data: InsertPostMediaGroup) {
  return await db.insert(PostMediaGroupTable).values(data).returning({ id: PostMediaGroupTable.id });
}

export async function getByPostId(postId: string) {
  return await db.query.PostMediaGroupTable.findMany({
    where: (postMediaGroup, { eq }) => eq(postMediaGroup.postId, postId),
    orderBy: (postMediaGroup, { desc }) => desc(postMediaGroup.isEstablishingShot),
    with: {
      media: true,
    },
  });
}
