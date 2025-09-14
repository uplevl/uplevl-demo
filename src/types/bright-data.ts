export interface BrightDataTriggerResponse {
  snapshot_id: string;
}

export interface BrightDataSnapshotStatus {
  snapshot_id: string;
  dataset_id: string;
  status: "running" | "ready" | "failed";
}
