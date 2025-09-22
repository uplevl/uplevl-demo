import VideoAutoReel from "./video-auto-reel";

interface VideoElementsProps {
  groupId: string;
}

export default function VideoElements({ groupId }: VideoElementsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <VideoAutoReel groupId={groupId} />
      {/* <VideoFrame>{autoReelEventId && <div>Auto Reel Event ID: {autoReelEventId}</div>}</VideoFrame> */}
    </div>
  );
}
