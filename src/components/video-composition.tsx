"use client";

import { AbsoluteFill, OffthreadVideo } from "remotion";

interface VideoCompositionProps {
  videoUrl: string;
}

/**
 * A Remotion composition component that renders a video from a URL.
 * This component is used within the Remotion Player to display video content.
 */
export default function VideoComposition({ videoUrl }: VideoCompositionProps) {
  return (
    <AbsoluteFill>
      <OffthreadVideo src={videoUrl} />
    </AbsoluteFill>
  );
}
