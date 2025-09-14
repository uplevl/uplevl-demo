import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { PropertyStats } from "@/types/post";
import { createdAt, id, updatedAt } from "./schema-helpers";

export const JobTable = pgTable("jobs", {
  id: varchar("id").primaryKey(), // Using varchar instead of uuid because we're using inngest ID as the primary key
  postId: uuid("post_id").references(() => PostTable.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["running", "ready", "failed"],
  }).default("running"),
  error: text("error"),
  eventName: text("event_name").notNull(),
  stepName: text("step_name"),
  createdAt,
  updatedAt,
});

export type InsertJob = typeof JobTable.$inferInsert;
export type UpdateJob = Partial<InsertJob>;
export type Job = typeof JobTable.$inferSelect;

export const jobRelations = relations(JobTable, ({ one }) => ({
  post: one(PostTable, {
    fields: [JobTable.postId],
    references: [PostTable.id],
  }),
}));

export const PostTable = pgTable("posts", {
  id,

  status: text("status", {
    enum: ["draft", "processing", "published", "failed"],
  }).default("draft"),

  location: text("location"),
  imageCount: integer("image_count"),
  propertyStats: jsonb("property_stats").$type<PropertyStats>(),

  createdAt,
  updatedAt,
});

export type InsertPost = typeof PostTable.$inferInsert;
export type UpdatePost = Partial<InsertPost>;
export type Post = typeof PostTable.$inferSelect;

export const postRelations = relations(PostTable, ({ many }) => ({
  media: many(PostMediaTable),
  jobs: many(JobTable),
}));

export const PostMediaTable = pgTable("post_media", {
  id,
  postId: uuid("post_id")
    .references(() => PostTable.id, { onDelete: "cascade" })
    .notNull(),
  mediaType: text("media_type", {
    enum: ["image", "video"],
  }).notNull(),
  mediaUrl: text("media_url").notNull(),
  description: text("description"),
  groupId: uuid("group_id").references(() => PostMediaGroupTable.id, { onDelete: "cascade" }),
  isEstablishingShot: boolean("is_establishing_shot").default(false),
  createdAt,
  updatedAt,
});

export type InsertPostMedia = typeof PostMediaTable.$inferInsert;
export type UpdatePostMedia = Partial<InsertPostMedia>;
export type PostMedia = typeof PostMediaTable.$inferSelect;

export const postMediaRelations = relations(PostMediaTable, ({ one }) => ({
  post: one(PostTable, {
    fields: [PostMediaTable.postId],
    references: [PostTable.id],
  }),
  group: one(PostMediaGroupTable, {
    fields: [PostMediaTable.groupId],
    references: [PostMediaGroupTable.id],
  }),
}));

export const PostMediaGroupTable = pgTable("post_media_groups", {
  id,
  postId: uuid("post_id")
    .references(() => PostTable.id, { onDelete: "cascade" })
    .notNull(),
  groupName: text("group_name").notNull(),
  isEstablishingShot: boolean("is_establishing_shot").default(false),
  script: text("script"),
  createdAt,
  updatedAt,
});

export type InsertPostMediaGroup = typeof PostMediaGroupTable.$inferInsert;
export type UpdatePostMediaGroup = Partial<InsertPostMediaGroup>;
export type PostMediaGroup = typeof PostMediaGroupTable.$inferSelect;

export const postMediaGroupRelations = relations(PostMediaGroupTable, ({ one, many }) => ({
  post: one(PostTable, {
    fields: [PostMediaGroupTable.postId],
    references: [PostTable.id],
  }),
  media: many(PostMediaTable),
}));
