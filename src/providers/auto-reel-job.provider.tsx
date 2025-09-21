import { createContext, use, useState } from "react";
import type { Job } from "@/repositories/job.repository";

type Status = NonNullable<Job["job"]>["status"];

interface AutoReelJobContextType {
  jobId: string | null;
  setJobId(jobId: string): void;
  status: Status;
  setStatus(status: Status): void;
}

export const AutoReelJobContext = createContext<AutoReelJobContextType>({} as AutoReelJobContextType);

export default function AutoReelJobProvider({ children }: { children: React.ReactNode }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);

  return (
    <AutoReelJobContext.Provider value={{ jobId, setJobId, status, setStatus }}>{children}</AutoReelJobContext.Provider>
  );
}

function useAutoReelJobContext() {
  const context = use(AutoReelJobContext);
  if (!context) {
    throw new Error("useAutoReelJobContext must be used within a AutoReelJobProvider");
  }
  return context;
}

export function useAutoReelJob() {
  const { setJobId, jobId } = useAutoReelJobContext();
  return [jobId, setJobId] as const;
}

export function useAutoReelJobStatus() {
  const { status, setStatus } = useAutoReelJobContext();
  return [status, setStatus] as const;
}
