import VideoAutoReel from "./video-auto-reel";
import VideoFinalReel from "./video-final-reel";

interface VideoElementsProps {
  groupId: string;
}

export default function VideoElements({ groupId }: VideoElementsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <VideoAutoReel groupId={groupId} />
      <VideoFinalReel groupId={groupId} />
    </div>
  );
}
