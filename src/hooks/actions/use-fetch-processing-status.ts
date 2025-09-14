import { useQuery } from "@tanstack/react-query";
import useApi from "../use-api";

export default function useFetchProcessingStatus(jobId: string | null) {
  const api = useApi();

  return useQuery({
    queryKey: ["processing-status", jobId],
    enabled: !!jobId,
    queryFn: async ({ queryKey }) => {
      const [_key, jobId] = queryKey;
      if (!jobId) return;

      const status = await api.jobs[`:id`].$get({
        param: {
          id: jobId,
        },
      });

      return status.json();
    },
    refetchInterval: ({ state }) => {
      if (state.data && (state.data.status === "ready" || state.data.status === "failed")) {
        return false;
      }
      return 1500;
    },
  });
}
