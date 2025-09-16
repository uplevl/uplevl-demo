import type { GenerateScriptsStep, ParseZillowPropertyStep } from "@/constants/events";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: { name: ParseZillowPropertyStep | GenerateScriptsStep; label: string }[];
  outcomes: string[];
  isActive: boolean;
  isCompleted: boolean;
}
