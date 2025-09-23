import { AbsoluteFill, Audio, Sequence, useVideoConfig, Video } from "remotion";

/**
 * Property Reel Composition
 * Creates a video compilation from property images with optional voice-over and music
 */
export interface FinalVideoCompositionProps {
  videoUrl?: string;
  audioUrl?: string;
  playbackRate?: number; // Speed adjustment for video
  audioPadding?: number; // Padding before audio starts (in seconds)
}

/**
 * Final Video Composition
 * Combines the auto-reel video with voice-over audio at adjusted speed
 */
export function FinalVideoComposition(props: FinalVideoCompositionProps) {
  const { videoUrl = "", audioUrl = "", playbackRate = 1, audioPadding = 0 } = props;
  const { fps } = useVideoConfig();

  if (!videoUrl || !audioUrl) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: "white", fontSize: 32, textAlign: "center" }}>Missing video or audio URL</div>
      </AbsoluteFill>
    );
  }

  // Calculate the frame when audio should start (padding converted to frames)
  const audioPaddingFrames = Math.floor(audioPadding * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Video
        src={videoUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        playbackRate={playbackRate}
      />

      {/* Voice-over audio - starts after padding delay using Sequence */}
      <Sequence from={audioPaddingFrames}>
        <Audio src={audioUrl} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
}
