import { parseMedia } from "@remotion/media-parser";
import { Composition } from "remotion";
import { FinalVideoComposition } from "./composition";

export default function RemotionRoot() {
  return (
    <>
      {/* Final video composition - combines auto-reel with voice-over */}
      <Composition
        id="FinalVideoVertical"
        component={FinalVideoComposition}
        durationInFrames={750} // 32 seconds at 25fps (30s + 2s padding)
        fps={25}
        width={1080}
        height={1920}
        defaultProps={{
          videoUrl: "",
          audioUrl: "",
          playbackRate: 1,
          audioPadding: 0,
        }}
        calculateMetadata={async ({ props }) => {
          const { slowDurationInSeconds } = await parseMedia({
            src: props.videoUrl as string,
            fields: { slowDurationInSeconds: true },
          });

          return {
            durationInFrames: Math.floor(slowDurationInSeconds * 25),
          };
        }}
      />

      {/* <Composition
        id="FinalVideoHorizontal"
        component={FinalVideoComposition}
        durationInFrames={750} // 32 seconds at 25fps (30s + 2s padding)
        fps={25}
        width={1920}
        height={1080}
        defaultProps={{
          videoUrl: "",
          audioUrl: "",
          playbackRate: 1,
          audioPadding: 0,
        }}
      /> */}
    </>
  );
}
