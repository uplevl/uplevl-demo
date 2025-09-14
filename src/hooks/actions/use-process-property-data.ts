import { useMutation } from "@tanstack/react-query";
import router from "next/router";
import { useProcessingStore } from "@/stores/processing.store";
import useApi from "../use-api";

export default function useProcessPropertyData() {
  const api = useApi();
  const postId = useProcessingStore((state) => state.postId);
  const snapshotId = useProcessingStore((state) => state.snapshotId);

  return useMutation({
    mutationFn: async () => {
      const response = await api.posts["store-property-data"][`:postId`][`:snapshotId`].$post({
        param: { snapshotId: snapshotId!, postId: postId! },
      });
      return response.json();
    },
    onSuccess: () => {
      router.push("/processing/images");
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
