import { useQuery } from "@tanstack/react-query";
import useApi from "./use-api";

export default function usePostGroups(postId: string) {
  const api = useApi();

  const { data, isLoading } = useQuery({
    queryKey: ["post-results", postId],
    queryFn: async () => {
      const response = await api.posts[`:postId`].groups.$get({
        param: { postId },
      });

      return response.json();
    },
  });

  return { data, isLoading };
}
