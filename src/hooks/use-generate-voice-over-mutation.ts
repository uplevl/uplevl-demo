import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useVoiceGeneration } from "@/contexts/voice-generation-context";
import useApi from "./use-api";

export function useGenerateVoiceOverMutation(groupId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { setGenerating } = useVoiceGeneration();

  return useMutation({
    mutationFn: async () => {
      const response = await api.voices["generate-voice-over"][":groupId"].$post({
        param: { groupId },
      });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.data) {
        throw new Error("Voice over data not found");
      }

      return data.data.audioUrl;
    },
    onMutate: () => {
      // Set this group as currently generating
      setGenerating(groupId);
    },
    onSuccess: () => {
      // Clear generating state
      setGenerating(null);
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["posts", "groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["generate-voice-over", groupId] });
    },
    onError: () => {
      // Clear generating state on error
      setGenerating(null);
    },
  });
}
