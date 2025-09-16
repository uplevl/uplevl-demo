import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import useApi from "./use-api";

/** Fetches the progress of a job. */
export default function useJobProgress(jobId: string) {
  const [enabled, setEnabled] = useState(true);
  const api = useApi();

  const { data } = useQuery({
    queryKey: ["processing", jobId],
    queryFn: async () => {
      const result = await api.jobs[":id"].$get({ param: { id: jobId } });
      return result.json();
    },
    refetchInterval: 1000,
    enabled,
  });

  const hasData = data !== undefined;

  useEffect(() => {
    setEnabled(!hasData || (data?.status !== "ready" && data?.status !== "failed"));
  }, [data?.status, hasData]);

  return data;
}
