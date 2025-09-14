import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import * as ImageService from "@/server/services/image.service";
import * as PostService from "@/server/services/post.service";
import * as PostMediaGroupService from "@/server/services/post-media-group.service";
import * as PropertyService from "@/server/services/property.service";

export const postRoute = new Hono()

  // POST /posts/create - Start creating a new post and start scraping Zillow property details
  .post("/create", zValidator("json", z.object({ url: z.string().url() })), async (c) => {
    const { url } = c.req.valid("json");
    const post = await PostService.create();
    const { snapshot_id } = await PropertyService.scrapeZillowPropertyDetails(url);

    return c.json({ postId: post.id, snapshotId: snapshot_id }, 201);
  })

  // GET /posts/status/:snapshotId - Get the status of the post
  .get("/status/:snapshotId", zValidator("param", z.object({ snapshotId: z.string() })), async (c) => {
    const { snapshotId } = c.req.valid("param");
    const status = await PropertyService.getZillowSnapshotStatus(snapshotId);
    return c.json(status);
  })

  .post(
    "/store-property-data/:postId/:snapshotId",
    zValidator("param", z.object({ snapshotId: z.string(), postId: z.string() })),
    async (c) => {
      const { snapshotId, postId } = c.req.valid("param");

      // Retrieve the snapshot
      const snapshot = await PropertyService.getZillowSnapshot(snapshotId);
      // Compile the property location and data
      const { location, propertyStats } = PropertyService.compilePropertyData(snapshot);
      // Retrieve the snapshot
      const photos = await PropertyService.getPropertyPhotos(snapshot);
      // Upload the photos
      await ImageService.upload("usr_test1234", postId, photos);
      // Update the post with the property details
      await PostService.update(postId, { location, imageCount: snapshot.photoCount, propertyStats });

      return c.json({ error: null, data: null, message: "Property data stored" }, 200);
    },
  )

  .get("/:postId/groups", zValidator("param", z.object({ postId: z.string() })), async (c) => {
    try {
      const { postId } = c.req.valid("param");

      const [post, groups] = await Promise.all([
        PostService.getById(postId),
        PostMediaGroupService.getByPostId(postId),
      ]);

      return c.json({ error: null, data: { post, groups } }, 200);
    } catch (error) {
      console.error("Error getting post media groups", error);
      return c.json({ error: error, data: null }, 500);
    }
  });
