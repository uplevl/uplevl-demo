import { useQuery } from "@tanstack/react-query";
import useApi from "./use-api";

export default function useJobProgress(jobId: string) {
  const api = useApi();

  const { data } = useQuery({
    queryKey: ["processing", jobId],
    queryFn: async () => {
      const result = await api.jobs[":id"].$get({ param: { id: jobId } });
      return result.json();
    },
    refetchInterval: ({ state }) => {
      if (state.data && (state.data.status === "ready" || state.data.status === "failed")) {
        return false;
      }
      return 2000;
    },
    refetchIntervalInBackground: true,
  });

  return data;
}
