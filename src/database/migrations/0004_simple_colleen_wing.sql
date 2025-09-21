ALTER TABLE "jobs" RENAME COLUMN "post_id" TO "entity_id";--> statement-breakpoint
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_post_id_posts_id_fk";
