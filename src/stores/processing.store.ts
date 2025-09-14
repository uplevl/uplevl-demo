import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ProcessingStore {
  postId: string | null;
  setPostId: (postId: string | null) => void;
  snapshotId: string | null;
  setSnapshotId: (snapshotId: string | null) => void;
}

export const useProcessingStore = create<ProcessingStore>()(
  immer((set) => ({
    postId: null,
    setPostId: (postId) =>
      set((state) => {
        state.postId = postId;
      }),
    snapshotId: null,
    setSnapshotId: (snapshotId) =>
      set((state) => {
        state.snapshotId = snapshotId;
      }),
  })),
);
