"use client";

import { useQuery } from "@tanstack/react-query";
import { cva } from "class-variance-authority";
import {
  BrainIcon,
  CheckCircleIcon,
  DatabaseIcon,
  ImageIcon,
  LayersIcon,
  LoaderIcon,
  ScanEyeIcon,
  SparklesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

import getJobById from "@/actions/get-job-by-id";
import Button from "@/components/button";
import Logo from "@/components/logo";
import Spinner from "@/components/spinner";
import { Typography } from "@/components/typography";
import View from "@/components/view";
import { cn } from "@/lib/utils";

export default function ProcessingPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["processing", jobId],
    queryFn: async () => getJobById(jobId),
    refetchInterval: ({ state }) => {
      if (state.data && (state.data.status === "ready" || state.data.status === "failed")) {
        return false;
      }
      return 2000;
    },
    refetchIntervalInBackground: true,
  });

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
            onClick={() => router.push(`/processing/results/${data.postId}`)}
          >
            View Your Content
          </Button>
        </div>
      )}
    </View>
  );
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: { name: string; label: string }[];
  isActive: boolean;
  isCompleted: boolean;
}

const milestoneCardVariants = cva("relative p-4 rounded-xl border-1 transition-all duration-500 shadow-exploration3", {
  variants: {
    isActive: {
      true: "border-brand-blue/20 bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 shadow-exploration1",
    },
    isCompleted: {
      true: "border-brand-green/20 bg-gradient-to-r from-brand-green/5 to-brand-green/10",
    },
    isInactive: {
      true: "border-gray-200 bg-white",
    },
  },
});

const milestoneCardIconVariants = cva("p-1.5 rounded-lg transition-colors duration-300 ease-out", {
  variants: {
    isActive: {
      true: "bg-brand-blue text-white",
    },
    isCompleted: {
      true: "bg-brand-green text-white",
    },
    isInactive: {
      true: "bg-gray-100 text-gray-400",
    },
  },
});

function MilestoneCard({ milestone, currentStep }: { milestone: Milestone; currentStep: string }) {
  const IconComponent = milestone.icon;
  const currentStepInMilestone = milestone.steps.find((step) => step.name === currentStep);

  return (
    <div
      className={cn(
        milestoneCardVariants({
          isActive: milestone.isActive,
          isCompleted: milestone.isCompleted,
          isInactive: !milestone.isActive && !milestone.isCompleted,
        }),
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            milestoneCardIconVariants({
              isActive: milestone.isActive,
              isCompleted: milestone.isCompleted,
              isInactive: !milestone.isActive && !milestone.isCompleted,
            }),
          )}
        >
          {milestone.isActive ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : milestone.isCompleted ? (
            <CheckCircleIcon className="size-4" />
          ) : (
            <IconComponent className="size-4" />
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <Typography
              weight="semibold"
              className={`
              transition-colors duration-300
              ${milestone.isActive ? "text-brand-blue" : milestone.isCompleted ? "text-brand-green" : "text-gray-700"}
            `}
            >
              {milestone.title}
            </Typography>
            <Typography size="sm" className="text-gray-600 mt-1">
              {milestone.description}
            </Typography>
          </div>

          {milestone.isActive && currentStepInMilestone && (
            <div className="mt-3 p-3 bg-white/80 rounded-lg border border-brand-blue/20">
              <div className="flex items-center gap-2">
                <LoaderIcon className="size-4 animate-spin text-brand-blue" />
                <Typography size="sm" weight="medium" className="text-brand-blue">
                  {currentStepInMilestone.label}
                </Typography>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
