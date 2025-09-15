export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: { name: string; label: string }[];
  isActive: boolean;
  isCompleted: boolean;
}
