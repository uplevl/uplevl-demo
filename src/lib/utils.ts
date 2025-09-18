import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Milestone } from "@/types/progress";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

interface BuildMilestonesProps {
  milestone: Omit<Milestone, "outcomes">;
  buildOutcomes: () => string[];
}

/**
 * Builds a milestone with conditional outcomes based on completion status
 * @param milestone - The milestone data excluding outcomes
 * @param buildOutcomes - Function to generate outcomes when milestone is completed
 * @returns Complete milestone with outcomes populated if completed, empty otherwise
 */
export function buildMilestones({ milestone, buildOutcomes }: BuildMilestonesProps): Milestone {
  return {
    ...milestone,
    outcomes: milestone.isCompleted ? buildOutcomes() : [],
  } satisfies Milestone;
}
