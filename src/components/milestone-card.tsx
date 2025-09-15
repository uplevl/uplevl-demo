import { cva } from "class-variance-authority";
import { LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types/progress";
import MilestoneCardIcon from "./milestone-card-icon";
import { Typography } from "./typography";

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

interface MilestoneCardProps {
  milestone: Milestone;
  currentStep: string;
}

export default function MilestoneCard({ milestone, currentStep }: MilestoneCardProps) {
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
        <MilestoneCardIcon milestone={milestone} />
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
