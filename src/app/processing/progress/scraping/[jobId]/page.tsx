"use client";

import { BrainIcon, CheckCircleIcon, DatabaseIcon, LayersIcon, ScanEyeIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

import Button from "@/components/button";
import Logo from "@/components/logo";
import MilestoneCard from "@/components/milestone-card";
import Spinner from "@/components/spinner";
import { Typography } from "@/components/typography";
import View from "@/components/view";
import { PARSE_ZILLOW_PROPERTY_STEPS } from "@/constants/events";
import useJobProgress from "@/hooks/use-job-progress";
import { buildMilestones, formatPrice } from "@/lib/utils";
import type { Post } from "@/repositories/post.repository";
import type { PropertyStats } from "@/types/post";
import type { Milestone } from "@/types/progress";

function getPropertyStatsSummary(propertyStats: PropertyStats): string {
  return [
    propertyStats.bedrooms ? `${propertyStats.bedrooms} Beds` : null,
    propertyStats.bathrooms ? `${propertyStats.bathrooms} Baths` : null,
    propertyStats.squareFeet ? `${propertyStats.squareFeet} Sqft` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

export default function ScrapingProcessingPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const data = useJobProgress<Post>(jobId);

  const isDone = data?.job?.status === "ready";

  if (!data || !data.job) {
    return <Spinner />;
  }

  const { job, entity: post } = data;

  const milestones: Milestone[] = [
    buildMilestones({
      milestone: {
        id: "data-collection",
        title: "Data Collection",
        description: "Gathering property information from Zillow",
        icon: DatabaseIcon,
        steps: [
          { name: PARSE_ZILLOW_PROPERTY_STEPS.SETUP, label: "Initializing scraper" },
          { name: PARSE_ZILLOW_PROPERTY_STEPS.START_SCRAPING, label: "Connecting to Zillow" },
          { name: PARSE_ZILLOW_PROPERTY_STEPS.RETRIEVE_PROPERTY_DATA, label: "Extracting property details" },
        ],
        isActive:
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.SETUP ||
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.START_SCRAPING ||
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.RETRIEVE_PROPERTY_DATA,
        isCompleted:
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PROPERTY_DATA ||
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PHOTOS ||
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.GROUP_PHOTOS ||
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.FINISH,
      },
      buildOutcomes: () => ["Collected property details from Zillow."],
    }),
    buildMilestones({
      milestone: {
        id: "data-analysis",
        title: "Property Analysis",
        description: "Understanding and processing property details",
        icon: BrainIcon,
        steps: [
          { name: PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PROPERTY_DATA, label: "Analyzing property features and details" },
        ],
        isActive:
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PROPERTY_DATA ||
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PHOTOS,
        isCompleted:
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.GROUP_PHOTOS ||
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.FINISH,
      },
      buildOutcomes: () =>
        [
          post?.propertyStats ? formatPrice(post.propertyStats.price) : null,
          post?.location,
          post?.propertyStats ? getPropertyStatsSummary(post?.propertyStats) : null,
        ].filter(Boolean) as string[],
    }),
    buildMilestones({
      milestone: {
        id: "visual-analysis",
        title: "Visual Intelligence",
        description: "Understanding what's in each photo",
        icon: ScanEyeIcon,
        steps: [
          { name: PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PHOTOS, label: "Identifying rooms, features, and details" },
        ],
        isActive:
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PROPERTY_DATA ||
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.ANALYZE_PHOTOS,
        isCompleted:
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.GROUP_PHOTOS ||
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.FINISH,
      },
      buildOutcomes: () => ["Looked at each photo and noted down a short description."],
    }),
    buildMilestones({
      milestone: {
        id: "content-generation",
        title: "Content Organization",
        description: "Creating strategic photo groupings for social media",
        icon: LayersIcon,
        steps: [
          { name: PARSE_ZILLOW_PROPERTY_STEPS.GROUP_PHOTOS, label: "Organizing photos by themes and appeal" },
          { name: PARSE_ZILLOW_PROPERTY_STEPS.STORE_GROUPS, label: "Storing grouped photos in the database" },
        ],
        isActive:
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.GROUP_PHOTOS ||
          job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.STORE_GROUPS,
        isCompleted: job.stepName === PARSE_ZILLOW_PROPERTY_STEPS.FINISH,
      },
      buildOutcomes: () => [
        post?.groups.length && post.groups.length > 0
          ? `Identified ${post.groups.length} logical groups of photos.`
          : "No logical groups of photos identified for this property",
      ],
    }),
  ] satisfies Milestone[];

  return (
    <View className="items-center gap-8 max-w-4xl mx-auto">
      <Logo />
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <Typography size="lg" weight="bold" className="flex items-center justify-center gap-2">
            <SparklesIcon className="size-4 text-brand-yellow" />
            Generating Your Content
          </Typography>
          <Typography className="text-gray-600 text-balance">
            We are analyzing the listing details to prepare your content for social media.
          </Typography>
        </div>
      </div>

      <div className="w-full space-y-2">
        {milestones.map((milestone) => (
          <MilestoneCard milestone={milestone} key={milestone.id} currentStep={job.stepName || ""} />
        ))}
      </div>

      {isDone && (
        <>
          <div className="w-full space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-brand-green/10 to-brand-blue/10 rounded-xl shadow-exploration2 z-0">
              <div className="flex gap-2 items-center mb-2 justify-center">
                <CheckCircleIcon className="size-6 text-brand-green" />
                <Typography size="lg" weight="semibold" className="text-brand-green">
                  Property Data Ready!
                </Typography>
              </div>
              <Typography className="text-gray-600 text-balance">
                We successfully gathered all the information we needed to create your content.
              </Typography>
            </div>
          </div>
          <Button
            variant="primary"
            size="xl"
            className="w-full z-10"
            onClick={() => router.push(`/processing/prep-results/${post?.id}`)}
          >
            View The Results
          </Button>
        </>
      )}
    </View>
  );
}
