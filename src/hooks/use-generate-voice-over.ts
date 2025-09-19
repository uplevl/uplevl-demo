import { useQuery } from "@tanstack/react-query";
import useApi from "./use-api";

export function useGenerateVoiceOver(groupId: string) {
  const api = useApi();

  return useQuery({
    queryKey: ["generate-voice-over", groupId],
    queryFn: async () => {
      const groupResponse = await api.posts.groups[":groupId"].$get({ param: { groupId } });
      const groupData = await groupResponse.json();

      if (groupData.error) {
        throw new Error(groupData.error);
      }

      if (!groupData.data) {
        throw new Error("Group data not found");
      }

      const group = groupData.data;

      // Only return the existing audio URL, don't generate new one
      return group.audioUrl;
    },
  });
}
