import { cva } from "class-variance-authority";
import { CheckCircleIcon, LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types/progress";

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

interface MilestoneCardIconProps {
  milestone: Milestone;
}

export default function MilestoneCardIcon({ milestone }: MilestoneCardIconProps) {
  const IconComponent = milestone.icon;

  return (
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
  );
}
