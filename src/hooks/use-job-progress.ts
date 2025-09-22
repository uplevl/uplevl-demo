import * as Sentry from "@sentry/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Post } from "@/repositories/post.repository";
import type { PostMediaGroup } from "@/repositories/post-media-group.repository";
import useApi from "./use-api";

/** Fetches the progress of a job. */
export default function useJobProgress<P = Post | PostMediaGroup>(jobId: string, entityType: "post" | "group") {
  const [enabled, setEnabled] = useState(true);
  const api = useApi();

  const { data: result } = useQuery({
    queryKey: ["processing", jobId, entityType],
    queryFn: async () => {
      try {
        const result = await api.jobs[":id"][":entityType"].$get({ param: { id: jobId, entityType } });
        return result.json();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    refetchInterval: 1000,
    enabled,
  });

  const data = result?.data;

  const hasData = result !== undefined && data !== undefined;
  const job = data?.job;

  useEffect(() => {
    setEnabled(!hasData || (job?.status !== "ready" && job?.status !== "failed"));
  }, [job?.status, hasData]);

  return { job, entity: data?.entity as P | undefined };
}
