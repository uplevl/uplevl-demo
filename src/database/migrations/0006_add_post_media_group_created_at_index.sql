-- Add composite index on post_media (group_id, created_at) for optimal ordering performance
CREATE INDEX CONCURRENTLY "idx_post_media_group_id_created_at" ON "post_media" ("group_id", "created_at");
