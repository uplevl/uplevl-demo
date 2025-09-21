import { autoReelClient } from "@/lib/auto-reel";
import { bucket } from "@/lib/supabase";

export type CameraMotion = "push-in" | "push-out" | "orbit-left" | "orbit-right" | "auto";
export type Orientation = "portrait" | "landscape";
type Resolution = "1080p" | "720p";
export type Status = "queued" | "in_progress" | "complete" | "error";
type AiEngine = "v24" | "v25";

const aiEngine: AiEngine = "v25";

export interface ImageInput {
  image_url: string;
  camera_motion?: CameraMotion;
}

export interface VideoClip {
  uuid: string;
  clip_url: string;
  camera_motion: CameraMotion;
  orientation: Orientation;
  resolution: Resolution;
  ai_engine: AiEngine;
}

interface CreateVideoInputs {
  image_inputs: ImageInput[];
  orientation?: Orientation;
}

interface CreateVideoResponse {
  uuid: string;
  status: Status;
  video_url: string;
  video_clips: VideoClip[];
  orientation: Orientation;
  resolution: Resolution;
  ai_engine: AiEngine;
}

function getStoragePath(userId: string, postId: string) {
  return `${userId}/post_${postId}/uploads/auto-reels`;
}

export async function createVideo(inputs: CreateVideoInputs) {
  try {
    const imageInputs = inputs.image_inputs.map((imageInput) => ({
      ...imageInput,
      camera_motion: imageInput.camera_motion ?? "auto",
    }));

    const { data } = await autoReelClient.post<CreateVideoResponse>("/create_video", {
      image_inputs: imageInputs,
      orientation: inputs.orientation ?? "portrait",
      resolution: "1080p",
      ai_engine: aiEngine,
    });

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

interface GetVideoResponse {
  uuid: string;
  status: Status;
  video_url: string;
  orientation: Orientation;
  resolution: Resolution;
  ai_engine: AiEngine;
  video_clips: VideoClip[];
}

export async function getReel(uuid: string) {
  try {
    const { data } = await autoReelClient.get<GetVideoResponse>(`/get_video/${uuid}`);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function uploadVideo(userId: string, postId: string, file: File) {
  const path = getStoragePath(userId, postId);

  try {
    // Upload original image
    const { data, error } = await bucket.upload(`${path}/${file.name}`, file, {
      upsert: true,
    });

    if (error) {
      console.error("Error uploading video", error);
      return null;
    }

    const videoUrl = bucket.getPublicUrl(data.path).data.publicUrl;

    return videoUrl;
  } catch (error) {
    console.error("Error in uploadVideo:", error);
    return null;
  }
}
