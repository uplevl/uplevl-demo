import { z } from "zod";

import { PARSE_ZILLOW_PROPERTY_EVENT, PARSE_ZILLOW_PROPERTY_STEPS } from "@/constants/events";
import type { InsertPostMedia } from "@/database/schema";
import { inngest } from "@/inngest/client";
import { fetchImage } from "@/lib/helpers";
import * as ImageService from "@/services/image.service";
import * as JobService from "@/services/job.service";
import * as PostService from "@/services/post.service";
import * as PostMediaService from "@/services/post-media.service";
import * as PostMediaGroupService from "@/services/post-media-group.service";
import * as PropertyService from "@/services/property.service";

const parseZillowInputSchema = z.object({
  url: z.string().url(),
});

export default inngest.createFunction(
  { id: "parse-zillow-property", retries: 3 },
  { event: PARSE_ZILLOW_PROPERTY_EVENT },
  async ({ event, step }) => {
    // Tracks the status of the external parser service.
    let parserStatus: "running" | "ready" | "failed" = "running";
    const eventId = event.id ?? "";
    const eventName = event.name;

    // Setup the job and post
    const { jobId, url, postId } = await step.run(PARSE_ZILLOW_PROPERTY_STEPS.SETUP, async () => {
      const { url } = parseZillowInputSchema.parse(event.data);

      const post = await PostService.create();
      const { id: jobId } = await JobService.create({
        id: eventId,
        eventName: eventName,
        stepName: PARSE_ZILLOW_PROPERTY_STEPS.SETUP,
        entityId: post.id,
      });

      return { jobId, url, postId: post.id };
    });

    // Start scraping the property details
    const { snapshotId } = await step.run(PARSE_ZILLOW_PROPERTY_STEPS.START_SCRAPING, async () => {
      await JobService.update(jobId, { stepName: PARSE_ZILLOW_PROPERTY_STEPS.START_SCRAPING });
      const { snapshot_id } = await PropertyService.scrapeZillowPropertyDetails(url);
      return { snapshotId: snapshot_id };
    });

    // Wait for the snapshot to be ready
    while (parserStatus === "running") {
      const snapshotStatus = await step.run(PARSE_ZILLOW_PROPERTY_STEPS.GET_SNAPSHOT_STATUS, async () => {
        return await PropertyService.getZillowSnapshotStatus(snapshotId);
      });
      parserStatus = snapshotStatus.status;
    }

    // If the snapshot failed, update the job and throw an error
    if (parserStatus === "failed") {
      await JobService.update(jobId, { status: "failed", error: "Failed to scrape Zillow property details" });
      throw new Error("Failed to scrape Zillow property details");
    }

    // Retrieve the property data
    const snapshot = await step.run(PARSE_ZILLOW_PROPERTY_STEPS.RETRIEVE_PROPERTY_DATA, async () => {
      await JobService.update(jobId, { stepName: PARSE_ZILLOW_PROPERTY_STEPS.RETRIEVE_PROPERTY_DATA });
      return await PropertyService.getZillowSnapshot(snapshotId);
    });

    // Compile the property data
    const analyzePropertyDataPromise = step.run(PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PROPERTY_DATA, async () => {
      await JobService.update(jobId, { stepName: PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PROPERTY_DATA });
      const { location, propertyStats } = PropertyService.compilePropertyData(snapshot);
      await PostService.update(postId, { location, propertyStats });
    });

    // Analyze the photos and generate descriptions
    const analyzePhotosPromise = step.run(PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PHOTOS, async () => {
      await JobService.update(jobId, { stepName: PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PHOTOS });
      const descriptions = await ImageService.analyzeImages(
        snapshot.photos.map((photo) => photo.mixedSources.jpeg[photo.mixedSources.jpeg.length - 1]?.url ?? ""),
      );
      return descriptions;
    });

    const [, descriptions] = await Promise.all([analyzePropertyDataPromise, analyzePhotosPromise]);

    // Group the photos into groups and create the groups and media in the database
    const groups = await step.run(PARSE_ZILLOW_PROPERTY_STEPS.GROUP_PHOTOS, async () => {
      await JobService.update(jobId, { stepName: PARSE_ZILLOW_PROPERTY_STEPS.GROUP_PHOTOS });
      return await ImageService.groupImages(descriptions);
    });

    // Store the groups in the database
    await step.run(PARSE_ZILLOW_PROPERTY_STEPS.STORE_GROUPS, async () => {
      await JobService.update(jobId, { stepName: PARSE_ZILLOW_PROPERTY_STEPS.STORE_GROUPS });

      const postMediaData: InsertPostMedia[] = [];

      await Promise.all(
        groups.map(async (group) => {
          // Whether the group is an establishing shot (one of the images is marked as an establishing shot)
          const isEstablishingShot = group.describedImages.some((image) => image.isEstablishingShot);
          const groupName = group.groupName;
          // Create the group
          const postMediaGroup = await PostMediaGroupService.create({ postId, groupName, isEstablishingShot });
          // Fetch the images from Zillow.
          const files = await Promise.all(group.describedImages.map((data) => fetchImage(data.url)));
          // Upload the images to the storage.
          const uploadedImages = await ImageService.upload("usr_test1234", postId, files);

          // Loop through the images and add them to the post media data
          for (const image of group.describedImages) {
            const mediaUrl = uploadedImages.find((item) => item.originalUrl === image.url)?.url ?? "";

            if (!mediaUrl) {
              console.error("Media URL not found for image", image.url);
              return;
            }

            postMediaData.push({
              postId,
              mediaType: "image" as const,
              mediaUrl: mediaUrl,
              groupId: postMediaGroup.id,
              isEstablishingShot: image.isEstablishingShot,
              description: image.description,
            });
          }
        }),
      );

      await PostMediaService.createMany(postMediaData);
    });

    // Finish the job
    await step.run(PARSE_ZILLOW_PROPERTY_STEPS.FINISH, async () => {
      await JobService.update(jobId, { status: "ready", stepName: PARSE_ZILLOW_PROPERTY_STEPS.FINISH });
    });
  },
);
