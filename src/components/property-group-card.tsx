import { Typography } from "@/components/typography";
import VoiceOverScript from "@/components/voice-over-script";
import AutoReelJobProvider from "@/providers/auto-reel-job.provider";
import { useGroup } from "@/providers/post-provider";
import PropertyGroupImage from "./property-group-image";
import VideoElements from "./video-elements";
import VoiceOverPlayer from "./voice-over-player";

interface PropertyGroupCardProps {
  groupId: string;
}

export default function PropertyGroupCard({ groupId }: PropertyGroupCardProps) {
  const group = useGroup(groupId);

  return (
    <AutoReelJobProvider>
      <div key={group.id} className="flex flex-col gap-3 bg-white rounded-xl p-3 shadow-exploration1">
        <Typography as="h3" weight="semibold" className="ml-0.5 leading-4">
          {group.groupName}
        </Typography>
        <div className="grid grid-cols-4 gap-1">
          {group.media.map((media) => (
            <PropertyGroupImage key={media.id} mediaUrl={media.mediaUrl} description={media.description ?? ""} />
          ))}
        </div>
        <VoiceOverScript script={group.script} />
        {group.script !== null && <VoiceOverPlayer groupId={group.id} />}
        {group.audioUrl !== null && <VideoElements groupId={group.id} />}
      </div>
    </AutoReelJobProvider>
  );
}
