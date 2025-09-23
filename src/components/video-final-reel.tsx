import * as Sentry from "@sentry/nextjs";
import { useQuery } from "@tanstack/react-query";
import { FilmIcon, LoaderCircleIcon } from "lucide-react";

import Button from "@/components/button";
import VideoFrame from "@/components/video-frame";
import useApi from "@/hooks/use-api";
import { useAutoReelJob, useAutoReelJobStatus } from "@/providers/auto-reel-job.provider";
import { useGroup, useRefetchPostGroups } from "@/providers/post-provider";
import VideoPlayer from "./video-player";

interface VideoFinalReelProps {
  groupId: string;
}

/**
 * Video Final Reel Component
 * Shows the final video player or a button to generate the final video
 * Only shows if the group has both an auto-reel and voice-over audio
 */
export default function VideoFinalReel({ groupId }: VideoFinalReelProps) {
  const api = useApi();
  const group = useGroup(groupId);
  const [jobId, setJobId] = useAutoReelJob();
  const [jobStatus, setJobStatus] = useAutoReelJobStatus();
  const refetchPostGroups = useRefetchPostGroups();

  // Fetching job status for final video generation
  useQuery({
    queryKey: ["final-video-job", jobId],
    enabled: jobId !== null && jobStatus !== "ready" && jobStatus !== "failed",
    queryFn: async () => {
      try {
        const response = await api.jobs[":id"][":entityType"].$get({
          param: { id: jobId ?? "", entityType: "group" },
        });
        const result = await response.json();
        const data = result.data;

        if (!data?.job) return;

        setJobStatus(data.job.status);
        if (data.job.status === "ready") {
          refetchPostGroups();
        }

        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error fetching final video job", error);
        return null;
      }
    },
    refetchInterval: 15000, // Poll every 15 seconds to avoid rate limits
  });

  // Don't show if group doesn't have auto-reel
  if (!group.autoReelUrl) {
    return null;
  }

  const isLoading = jobStatus === "running";
  const hasAudioAndVideo = group.autoReelUrl && group.audioUrl;
  const canGenerateFinalVideo = hasAudioAndVideo && !group.reelUrl;

  async function handleGenerateFinalVideo() {
    try {
      Sentry.startSpan(
        {
          op: "ui.click",
          name: "Generate Final Video Button Click",
        },
        async (span) => {
          span.setAttribute("groupId", groupId);
          span.setAttribute("hasAutoReel", !!group.autoReelUrl);
          span.setAttribute("hasAudio", !!group.audioUrl);

          const response = await api.posts.groups[":groupId"]["generate-final-video"].$post({
            param: { groupId },
          });

          const result = await response.json();

          if (result.error) {
            throw new Error(result.error);
          }

          if (result.data?.eventId) {
            setJobId(result.data.eventId);
            setJobStatus("running");
          }
        },
      );
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error generating final video", error);
    }
  }

  return (
    <VideoFrame>
      {group.reelUrl ? (
        // Show final video if it exists
        <VideoPlayer videoUrl={group.reelUrl} controls={true} className="w-full aspect-[9/16]" />
      ) : canGenerateFinalVideo ? (
        // Show generation button if we have both auto-reel and audio
        <div className="flex items-center justify-center size-full">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <LoaderCircleIcon className="size-8 animate-spin" />
              <p className="text-sm text-gray-600">Generating final video...</p>
              <p className="text-xs text-gray-500 text-center max-w-40">This may take several minutes</p>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateFinalVideo}
              className="flex-col h-auto py-3 px-4"
            >
              <FilmIcon className="size-6 mb-1" />
              <span className="text-sm font-medium">Generate Final Video</span>
              <span className="text-xs opacity-75">with Voice-Over</span>
            </Button>
          )}
        </div>
      ) : !group.audioUrl ? (
        // Show message if missing audio
        <div className="flex items-center justify-center size-full">
          <div className="text-center text-gray-500">
            <FilmIcon className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Voice-over required</p>
            <p className="text-xs">Generate audio first</p>
          </div>
        </div>
      ) : null}
    </VideoFrame>
  );
}
