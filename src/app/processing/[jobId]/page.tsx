"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Button from "@/components/button";
import Logo from "@/components/logo";
import Spinner from "@/components/spinner";
import { Typography } from "@/components/typography";
import View from "@/components/view";
import useApi from "@/hooks/use-api";

interface ProcessingPageProps {
  params: Promise<{ jobId: string }>;
}

export default function ProcessingPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["processing", jobId],
    queryFn: async () => {
      const response = await api.jobs[`:id`].$get({
        param: { id: jobId },
      });
      const data = await response.json();
      return data;
    },
    refetchInterval: ({ state }) => {
      if (state.data && (state.data.status === "ready" || state.data.status === "failed")) {
        return false;
      }
      return 2000;
    },
    refetchIntervalInBackground: true,
  });

  const isDone = data?.status === "ready";
  console.log(data);

  useEffect(() => {
    if (data?.status === "ready") {
      setLoading(false);
    }
  }, [data?.status]);

  if (!data) {
    return <Spinner />;
  }

  return (
    <View className="items-center gap-12">
      <Logo />
      <Typography>Generating Post...</Typography>
      <ul>
        <li className="flex gap-4">
          <StatusIndicator
            isLoading={
              data.stepName === "setup" ||
              data.stepName === "start-scraping" ||
              data.stepName === "retrieve-property-data"
            }
            isDone={
              data.stepName === "analyze-property-data" ||
              data.stepName === "extract-photos" ||
              data.stepName === "analyze-photos" ||
              data.stepName === "group-photos" ||
              data.stepName === "ready" ||
              data.status === "ready"
            }
          />
          <Typography>Loading Property Data</Typography>
        </li>
        <li className="flex gap-4">
          <StatusIndicator
            isLoading={data.stepName === "analyze-property-data"}
            isDone={
              data.stepName === "extract-photos" ||
              data.stepName === "analyze-photos" ||
              data.stepName === "group-photos" ||
              data.stepName === "ready" ||
              data.status === "ready"
            }
          />
          <Typography>Analyzing Property Data</Typography>
        </li>
        <li className="flex gap-4">
          <StatusIndicator
            isLoading={data.stepName === "extract-photos"}
            isDone={
              data.stepName === "analyze-photos" ||
              data.stepName === "group-photos" ||
              data.stepName === "ready" ||
              data.status === "ready"
            }
          />
          <Typography>Extracting Photos</Typography>
        </li>
        <li className="flex gap-4">
          <StatusIndicator
            isLoading={data.stepName === "analyze-photos"}
            isDone={data.stepName === "group-photos" || data.stepName === "ready" || data.status === "ready"}
          />
          <Typography>Analyzing Photos</Typography>
        </li>
        <li className="flex gap-4">
          <StatusIndicator
            isLoading={data.stepName === "group-photos"}
            isDone={data.stepName === "ready" || data.status === "ready"}
          />
          <Typography>Grouping Photos</Typography>
        </li>
      </ul>
      {loading && <Spinner />}
      {isDone && (
        <Button
          variant="primary"
          size="xl"
          className="w-full"
          onClick={() => router.push(`/processing/results/${data.postId}`)}
        >
          See Results
        </Button>
      )}
    </View>
  );
}

function StatusIndicator({ isLoading = false, isDone = false }: { isLoading?: boolean; isDone?: boolean }) {
  if (isLoading) {
    return <span>⚙️</span>;
  }

  if (isDone) {
    return <span>✅</span>;
  }

  return <span>🌐</span>;
}
