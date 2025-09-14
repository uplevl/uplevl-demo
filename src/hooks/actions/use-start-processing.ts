import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/use-api";
import { useProcessingStore } from "@/stores/processing.store";

const setPostId = useProcessingStore.getState().setPostId;
const setSnapshotId = useProcessingStore.getState().setSnapshotId;

export default function useStartProcessing() {
  const api = useApi();
  const router = useRouter();

  return useMutation({
    mutationFn: async (url: string) => {
      const response = await api.posts.create.$post({
        json: { url },
      });
      return response.json();
    },
    onSuccess: ({ postId, snapshotId }) => {
      setPostId(postId);
      setSnapshotId(snapshotId);
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
