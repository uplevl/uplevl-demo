import { useQuery } from "@tanstack/react-query";
import { CogIcon, LoaderCircleIcon } from "lucide-react";

import Button from "@/components/button";
import VideoFrame from "@/components/video-frame";
import { GENERATE_AUTO_REEL_EVENT } from "@/constants/events";
import useApi from "@/hooks/use-api";
import useTriggerInngestEvent from "@/hooks/use-trigger-inngest-event";
import { useAutoReelJob, useAutoReelJobStatus } from "@/providers/auto-reel-job.provider";
import { useGroup, useRefetchPostGroups } from "@/providers/post-provider";
import VideoPlayer from "./video-player";

interface VideoAutoReelProps {
  groupId: string;
}

export default function VideoAutoReel({ groupId }: VideoAutoReelProps) {
  const api = useApi();
  const group = useGroup(groupId);
  const [jobId, setJobId] = useAutoReelJob();
  const [jobStatus, setJobStatus] = useAutoReelJobStatus();
  const triggerInngestEvent = useTriggerInngestEvent();
  const refetchPostGroups = useRefetchPostGroups();

  // Fetching job status
  useQuery({
    queryKey: ["auto-reel-job", jobId],
    enabled: jobId !== null && jobStatus !== "ready" && jobStatus !== "failed",
    queryFn: async () => {
      const response = await api.jobs[":id"].$get({ param: { id: jobId ?? "" } });
      const data = await response.json();

      if (!data.job) return;

      setJobStatus(data.job.status);
      if (data.job.status === "ready") {
        refetchPostGroups();
      }

      return data;
    },
    refetchInterval: 1000,
  });

  const isLoading = jobStatus === "running";

  async function handleGenerateAutoReel() {
    const { eventId } = await triggerInngestEvent(GENERATE_AUTO_REEL_EVENT, { groupId });
    setJobId(eventId);
  }

  return (
    <VideoFrame>
      {group.autoReelUrl ? (
        <VideoPlayer videoUrl={group.autoReelUrl} controls={true} className="w-full aspect-[9/16]" />
      ) : (
        <div className="flex items-center justify-center size-full">
          {isLoading ? (
            <LoaderCircleIcon className="size-6 animate-spin mr-2" />
          ) : (
            <Button variant="primary" size="sm" onClick={handleGenerateAutoReel} className="flex-col h-auto py-2 ">
              <CogIcon className="size-6" />
              Generate Auto Reel
            </Button>
          )}
        </div>
      )}
    </VideoFrame>
  );
}
