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

/**
 * Sanitizes a URL by removing query parameters to prevent exposure of sensitive tokens
 * @param url - The URL to sanitize
 * @returns The URL without query parameters
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.search = "";
    return urlObj.toString();
  } catch {
    // If URL parsing fails, just remove everything after '?' as fallback
    const questionMarkIndex = url.indexOf("?");
    return questionMarkIndex !== -1 ? url.substring(0, questionMarkIndex) : url;
  }
}
