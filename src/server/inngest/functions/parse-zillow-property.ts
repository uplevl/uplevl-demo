import z from "zod";

import { inngest } from "@/server/inngest/client";
import * as ImageService from "@/server/services/image.service";
import * as JobService from "@/server/services/job.service";
import * as PostService from "@/server/services/post.service";
import * as PostMediaService from "@/server/services/post-media.service";
import * as PostMediaGroupService from "@/server/services/post-media-group.service";
import * as PropertyService from "@/server/services/property.service";
import type { AnalyzedImage } from "@/types/image";

const parseZillowInputSchema = z.object({
  url: z.string().url(),
});

export default inngest.createFunction(
  { id: "parse-zillow-property" },
  { event: "zillow/parse.run" },
  async ({ event, step }) => {
    // Tracks the status of the external parser service.
    let parserStatus: "running" | "ready" | "failed" = "running";

    // Setup the job and post
    const { jobId, url, postId } = await step.run("setup", async () => {
      const { url } = parseZillowInputSchema.parse(event.data);

      const post = await PostService.create();
      const { id: jobId } = await JobService.create({
        id: event.id ?? "",
        eventName: event.name,
        stepName: "setup",
        postId: post.id,
      });

      return { jobId, url, postId: post.id };
    });

    // Start scraping the property details
    const { snapshotId } = await step.run("start-scraping", async () => {
      await JobService.update(jobId, { stepName: "start-scraping" });

      const { snapshot_id } = await PropertyService.scrapeZillowPropertyDetails(url);

      return { snapshotId: snapshot_id };
    });

    // Wait for the snapshot to be ready
    while (parserStatus === "running") {
      const snapshotStatus = await step.run("get-snapshot-status", async () => {
        return await PropertyService.getZillowSnapshotStatus(snapshotId);
      });
      console.log(snapshotStatus);
      parserStatus = snapshotStatus.status;
    }

    // If the snapshot failed, update the job and throw an error
    if (parserStatus === "failed") {
      await JobService.update(jobId, { status: "failed", error: "Failed to scrape Zillow property details" });
      throw new Error("Failed to scrape Zillow property details");
    }

    // Retrieve the property data
    const snapshot = await step.run("retrieve-property-data", async () => {
      await JobService.update(jobId, { stepName: "retrieve-property-data" });

      return await PropertyService.getZillowSnapshot(snapshotId);
    });

    // Compile the property data
    await step.run("analyze-property-data", async () => {
      await JobService.update(jobId, { stepName: "analyze-property-data" });

      const { location, propertyStats } = PropertyService.compilePropertyData(snapshot);
      await PostService.update(postId, { location, propertyStats });
    });

    // Extract the photos
    const imageUrls = await step.run("extract-photos", async () => {
      await JobService.update(jobId, { stepName: "extract-photos" });

      const photoFiles = await PropertyService.getPropertyPhotos(snapshot);
      await PostService.update(postId, { imageCount: photoFiles.length });

      const imageUrls = await ImageService.upload("usr_test1234", postId, photoFiles);

      return imageUrls;
    });

    // Analyze the photos and generate descriptions
    const descriptions = await step.run("analyze-photos", async () => {
      await JobService.update(jobId, { stepName: "analyze-photos" });

      const descriptions = await ImageService.analyzeImages(imageUrls);
      return descriptions;
    });

    // Group the photos into groups and create the groups and media in the database
    await step.run("group-photos", async () => {
      await JobService.update(jobId, { stepName: "group-photos" });

      const groups = await ImageService.groupImages(descriptions as unknown as AnalyzedImage[]);

      for (const group of groups) {
        // Whether the group is an establishing shot (one of the images is marked as an establishing shot)
        const isEstablishingShot = group.describedImages.some((image) => image.isEstablishingShot);

        // Create the group
        const postMediaGroup = await PostMediaGroupService.create({
          postId,
          groupName: group.groupName,
          isEstablishingShot,
        });

        // Create the images in the group
        await PostMediaService.createMany(
          group.describedImages.map((image) => ({
            postId,
            mediaType: "image",
            mediaUrl: image.url,
            groupId: postMediaGroup.id,
            isEstablishingShot: image.isEstablishingShot,
            description: image.description,
          })),
        );
      }
    });

    // Finish the job
    await step.run("finish", async () => {
      await JobService.update(jobId, { status: "ready", stepName: "finish" });
    });
  },
);
