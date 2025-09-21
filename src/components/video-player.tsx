"use client";

import { Player } from "@remotion/player";
import { useCallback, useEffect, useState } from "react";
import Spinner from "./spinner";
import VideoComposition from "./video-composition";

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
}

interface VideoPlayerProps {
  videoUrl: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  style?: React.CSSProperties;
}

/**
 * A reusable video player component that uses Remotion to play videos.
 * Automatically detects video duration and metadata from the provided URL.
 *
 * @param videoUrl - The URL of the video to play
 * @param className - Optional CSS class name
 * @param controls - Whether to show video controls (default: true)
 * @param autoPlay - Whether to auto-play the video (default: false)
 * @param loop - Whether to loop the video (default: false)
 * @param style - Optional inline styles
 */
export default function VideoPlayer({
  videoUrl,
  className,
  controls = true,
  autoPlay = false,
  loop = false,
  style,
}: VideoPlayerProps) {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const detectVideoMetadata = useCallback(async (url: string): Promise<VideoMetadata> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const width = video.videoWidth;
        const height = video.videoHeight;

        // Default to 30 FPS - in a real application, you might want to
        // detect this more accurately or allow it to be configured
        const fps = 30;

        resolve({
          duration,
          width,
          height,
          fps,
        });
      };

      video.onerror = () => {
        reject(new Error("Failed to load video metadata"));
      };

      video.src = url;
    });
  }, []);

  useEffect(() => {
    if (!videoUrl) {
      setError("No video URL provided");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    detectVideoMetadata(videoUrl)
      .then((meta) => {
        setMetadata(meta);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load video");
        setIsLoading(false);
      });
  }, [videoUrl, detectVideoMetadata]);

  const renderLoading = useCallback(
    ({ height, width }: { height: number; width: number }) => (
      <div className="flex items-center justify-center bg-gray-100" style={{ height, width }}>
        <Spinner />
      </div>
    ),
    [],
  );

  const renderError = useCallback(
    ({ error: playerError }: { error: Error }) => (
      <div className="flex items-center justify-center bg-red-50 text-red-600 p-4 w-full h-full min-h-[200px]">
        <div className="text-center">
          <p className="font-medium">Error playing video</p>
          <p className="text-sm mt-1">{playerError.message}</p>
        </div>
      </div>
    ),
    [],
  );

  if (isLoading) {
    return (
      <div className={className} style={style}>
        <div className="flex items-center justify-center bg-gray-100 rounded-lg min-h-[200px]">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div className={className} style={style}>
        <div className="flex items-center justify-center bg-red-50 text-red-600 p-4 rounded-lg min-h-[200px]">
          <div className="text-center">
            <p className="font-medium">Error loading video</p>
            <p className="text-sm mt-1">{error || "Unknown error"}</p>
          </div>
        </div>
      </div>
    );
  }

  const durationInFrames = Math.ceil(metadata.duration * metadata.fps);

  return (
    <div className={className} style={style}>
      <Player
        component={VideoComposition}
        durationInFrames={durationInFrames}
        compositionWidth={metadata.width}
        compositionHeight={metadata.height}
        fps={metadata.fps}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        inputProps={{
          videoUrl,
        }}
        renderLoading={renderLoading}
        errorFallback={renderError}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
