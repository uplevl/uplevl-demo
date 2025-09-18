import { Typography } from "@/components/typography";
import VoiceOverScript from "@/components/voice-over-script";
import type { PostMediaGroup } from "@/repositories/post-media-group.repository";
import PropertyGroupImage from "./property-group-image";

// import VoiceOverPlayer from "./voice-over-player";

interface PropertyGroupCardProps {
  group: PostMediaGroup;
}

export default function PropertyGroupCard({ group }: PropertyGroupCardProps) {
  return (
    <div key={group.id} className="flex flex-col gap-2.5 bg-white rounded-xl p-2.5 shadow-exploration1">
      <Typography as="h3" weight="semibold" className="ml-0.5 leading-4">
        {group.groupName}
      </Typography>
      <div className="grid grid-cols-4 gap-1">
        {group.media.map((media) => (
          <PropertyGroupImage key={media.id} mediaUrl={media.mediaUrl} description={media.description ?? ""} />
        ))}
      </div>
      <VoiceOverScript script={group.script} />
      {/* {Boolean(group.script) && <VoiceOverPlayer groupId={group.id} />} */}
    </div>
  );
}
