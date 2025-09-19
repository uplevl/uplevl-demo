import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import type { GenerateScriptsStep, ParseZillowPropertyStep } from "@/constants/events";
import { createdAt, id, updatedAt } from "@/database/schema-helpers";
import type { PropertyStats } from "@/types/post";

// -- Models --

export const PostTable = pgTable("posts", {
  id,

  status: text("status", {
    enum: ["draft", "processing", "published", "failed"],
  }).default("draft"),

  location: text("location"),
  imageCount: integer("image_count"),
  propertyStats: jsonb("property_stats").$type<PropertyStats>(),
  propertyContext: text("property_context"),

  hasScripts: boolean("has_scripts").default(false),
  hasVideoReels: boolean("has_video_reels").default(false),
  isPublished: boolean("is_published").default(false),

  createdAt,
  updatedAt,
});

export const PostMediaTable = pgTable("post_media", {
  id,
  postId: uuid("post_id")
    .references(() => PostTable.id, { onDelete: "cascade" })
    .notNull(),
  groupId: uuid("group_id").references(() => PostMediaGroupTable.id, { onDelete: "cascade" }),

  mediaType: text("media_type", {
    enum: ["image", "video", "audio"],
  }).notNull(),
  mediaUrl: text("media_url").notNull(),
  description: text("description"),

  isEstablishingShot: boolean("is_establishing_shot").default(false),

  createdAt,
  updatedAt,
});

export const PostMediaGroupTable = pgTable("post_media_groups", {
  id,
  postId: uuid("post_id")
    .references(() => PostTable.id, { onDelete: "cascade" })
    .notNull(),

  groupName: text("group_name").notNull(),
  script: text("script"),
  audioUrl: text("audio_url"),

  isEstablishingShot: boolean("is_establishing_shot").default(false),

  createdAt,
  updatedAt,
});

export const JobTable = pgTable("jobs", {
  id: varchar("id").primaryKey(), // Using varchar instead of uuid because we're using inngest ID as the primary key
  postId: uuid("post_id").references(() => PostTable.id, { onDelete: "cascade" }),

  status: text("status", {
    enum: ["running", "ready", "failed"],
  }).default("running"),
  error: text("error"),
  eventName: text("event_name").notNull(),
  stepName: text("step_name").$type<ParseZillowPropertyStep | GenerateScriptsStep>(),

  createdAt,
  updatedAt,
});

// -- Relations --

export const postRelations = relations(PostTable, ({ many }) => ({
  media: many(PostMediaTable),
  groups: many(PostMediaGroupTable),
  jobs: many(JobTable),
}));

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

export const postMediaGroupRelations = relations(PostMediaGroupTable, ({ one, many }) => ({
  post: one(PostTable, {
    fields: [PostMediaGroupTable.postId],
    references: [PostTable.id],
  }),
  media: many(PostMediaTable),
}));

export const jobRelations = relations(JobTable, ({ one }) => ({
  post: one(PostTable, {
    fields: [JobTable.postId],
    references: [PostTable.id],
  }),
}));

// -- Types --

export type InsertPost = typeof PostTable.$inferInsert;
export type UpdatePost = Partial<InsertPost>;

export type InsertPostMedia = typeof PostMediaTable.$inferInsert;
export type UpdatePostMedia = Partial<InsertPostMedia>;

export type InsertPostMediaGroup = typeof PostMediaGroupTable.$inferInsert;
export type UpdatePostMediaGroup = Partial<InsertPostMediaGroup>;

export type InsertJob = typeof JobTable.$inferInsert;
export type UpdateJob = Partial<InsertJob>;
