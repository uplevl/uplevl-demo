"use client";

import {
  BrainIcon,
  CheckCircleIcon,
  DatabaseIcon,
  ImageIcon,
  LayersIcon,
  ScanEyeIcon,
  SparklesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

import Button from "@/components/button";
import Logo from "@/components/logo";
import MilestoneCard from "@/components/milestone-card";
import Spinner from "@/components/spinner";
import { Typography } from "@/components/typography";
import View from "@/components/view";
import useJobProgress from "@/hooks/use-job-progress";

export default function ProcessingPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const data = useJobProgress(jobId);

  const isDone = data?.status === "ready";

  if (!data) {
    return <Spinner />;
  }

  const milestones = [
    {
      id: "data-collection",
      title: "Data Collection",
      description: "Gathering property information from Zillow",
      icon: DatabaseIcon,
      steps: [
        { name: "setup", label: "Initializing scraper" },
        { name: "start-scraping", label: "Connecting to Zillow" },
        { name: "retrieve-property-data", label: "Extracting property details" },
      ],
      isActive: data.stepName ? ["setup", "start-scraping", "retrieve-property-data"].includes(data.stepName) : false,
      isCompleted: data.stepName
        ? !["setup", "start-scraping", "retrieve-property-data"].includes(data.stepName) && data.stepName !== "ready"
        : false,
    },
    {
      id: "data-analysis",
      title: "Property Analysis",
      description: "Understanding and processing property details",
      icon: BrainIcon,
      steps: [{ name: "analyze-property-data", label: "Analyzing property features and details" }],
      isActive: data.stepName === "analyze-property-data",
      isCompleted: data.stepName
        ? ["extract-photos", "analyze-photos", "group-photos", "ready"].includes(data.stepName) ||
          data.status === "ready"
        : false,
    },
    {
      id: "image-processing",
      title: "Image Processing",
      description: "Extracting and analyzing property photos",
      icon: ImageIcon,
      steps: [{ name: "extract-photos", label: "Downloading property images" }],
      isActive: data.stepName === "extract-photos",
      isCompleted: data.stepName
        ? ["analyze-photos", "group-photos", "ready"].includes(data.stepName) || data.status === "ready"
        : false,
    },
    {
      id: "visual-analysis",
      title: "Visual Intelligence",
      description: "Understanding what's in each photo",
      icon: ScanEyeIcon,
      steps: [{ name: "analyze-photos", label: "Identifying rooms, features, and details" }],
      isActive: data.stepName === "analyze-photos",
      isCompleted: data.stepName ? ["group-photos", "ready"].includes(data.stepName) || data.status === "ready" : false,
    },
    {
      id: "content-generation",
      title: "Content Organization",
      description: "Creating strategic photo groupings for social media",
      icon: LayersIcon,
      steps: [{ name: "group-photos", label: "Organizing photos by themes and appeal" }],
      isActive: data.stepName === "group-photos",
      isCompleted: data.stepName === "ready" || data.status === "ready",
    },
  ];

  return (
    <View className="items-center gap-8 max-w-4xl mx-auto">
      <Logo />
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <Typography size="xl" weight="bold" className="flex items-center justify-center gap-2">
            <SparklesIcon className="size-5 text-brand-yellow" />
            Generating Your Content
          </Typography>
          <Typography className="text-gray-600 text-balance">
            Our system is analyzing the listing details to prepare your content for social media.
          </Typography>
        </div>
      </div>

      <div className="w-full space-y-4">
        {milestones.map((milestone) => (
          <MilestoneCard milestone={milestone} key={milestone.id} currentStep={data.stepName || ""} />
        ))}
      </div>

      {isDone && (
        <div className="w-full max-w-md space-y-6">
          <div className="text-center p-6 bg-gradient-to-r from-brand-green/10 to-brand-blue/10 rounded-xl shadow-exploration2 z-0">
            <CheckCircleIcon className="size-8 text-brand-green mx-auto mb-3" />
            <Typography size="lg" weight="semibold" className="text-brand-green mb-2">
              Property Data Ready!
            </Typography>
            <Typography className="text-gray-600 text-balance">
              We successfully gathered all the information we needed to create your content.
            </Typography>
          </div>
          <Button
            variant="primary"
            size="xl"
            className="w-full z-10"
            onClick={() => router.push(`/processing/prep-results/${data.postId}`)}
          >
            View Your Content
          </Button>
        </div>
      )}
    </View>
  );
}
