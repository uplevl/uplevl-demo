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

      if (group.audioUrl !== null) {
        return group.audioUrl;
      }

      const voiceOverResponse = await api.voices["generate-voice-over"][":groupId"].$post({ param: { groupId } });
      const voiceOverData = await voiceOverResponse.json();

      if (voiceOverData.error) {
        throw new Error(voiceOverData.error);
      }

      if (!voiceOverData.data) {
        throw new Error("Voice over data not found");
      }

      return voiceOverData.data.audioUrl;
    },
  });
}
