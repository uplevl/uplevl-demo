"use client";

import { BrainIcon, CheckCircleIcon, SaveIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Button from "@/components/button";
import Logo from "@/components/logo";
import MilestoneCard from "@/components/milestone-card";
import Spinner from "@/components/spinner";
import { Typography } from "@/components/typography";
import View from "@/components/view";
import { GENERATE_SCRIPTS_STEPS } from "@/constants/events";
import useJobProgress from "@/hooks/use-job-progress";
import { buildMilestones } from "@/lib/utils";
import type { Milestone } from "@/types/progress";

export default function ScriptingProgressPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const data = useJobProgress(jobId, "group");

  if (!data || !data.job) {
    return <Spinner />;
  }

  const { job } = data;

  const isDone = job.status === "ready";

  const milestones: Milestone[] = [
    buildMilestones({
      milestone: {
        id: "scripting",
        title: "Scripting",
        description: "Looking at the groups and writing the scripts",
        icon: BrainIcon,
        steps: [
          { name: GENERATE_SCRIPTS_STEPS.SETUP, label: "Sharpening my pencil" },
          { name: GENERATE_SCRIPTS_STEPS.GENERATE_SCRIPTS, label: "Writing the script" },
        ],
        isActive:
          job.stepName === GENERATE_SCRIPTS_STEPS.SETUP || job.stepName === GENERATE_SCRIPTS_STEPS.GENERATE_SCRIPTS,
        isCompleted:
          job.stepName === GENERATE_SCRIPTS_STEPS.UPDATE_POST_MEDIA_GROUPS ||
          job.stepName === GENERATE_SCRIPTS_STEPS.FINISH,
      },
      buildOutcomes: () => ["Generated scripts for the property."],
    }),
    buildMilestones({
      milestone: {
        id: "storing",
        title: "Saving the scripts",
        description: "Adding the scripts to the property groups",
        icon: SaveIcon,
        steps: [
          { name: GENERATE_SCRIPTS_STEPS.UPDATE_POST_MEDIA_GROUPS, label: "Adding the scripts to the property groups" },
        ],
        isActive: job.stepName === GENERATE_SCRIPTS_STEPS.UPDATE_POST_MEDIA_GROUPS,
        isCompleted: job.stepName === GENERATE_SCRIPTS_STEPS.FINISH,
      },
      buildOutcomes: () => ["Saved the scripts to the property groups."],
    }),
  ] satisfies Milestone[];

  return (
    <View className="items-center gap-8 max-w-4xl mx-auto">
      <Logo />
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <Typography size="lg" weight="bold" className="flex items-center justify-center gap-2">
            <SparklesIcon className="size-4 text-brand-yellow" />
            Writing Your Scripts
          </Typography>
          <Typography className="text-gray-600 text-balance">
            We are now generating the scripts that will be used to create the voice over for your video reels.
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
                  Voice Over Scripts Ready!
                </Typography>
              </div>
              <Typography className="text-gray-600 text-balance">
                We successfully wrote up voice over scripts for each group of the property.
              </Typography>
            </div>
          </div>
          <Button
            variant="primary"
            size="xl"
            className="w-full z-10"
            onClick={() => router.push(`/processing/prep-results/${job.entityId}`)}
          >
            View The Results
          </Button>
        </>
      )}
    </View>
  );
}
