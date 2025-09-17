import { Typography } from "./typography";

interface VoiceOverScriptProps {
  script: string | null;
}

export default function VoiceOverScript({ script }: VoiceOverScriptProps) {
  if (!script) return null;

  const parsedContent = parseScriptWithTags(script);

  return (
    <Typography size="sm" className="leading-relaxed">
      {parsedContent}
    </Typography>
  );
}

/**
 * Parse script text and highlight audio tags in a different color
 */
function parseScriptWithTags(script: string) {
  // Split the script by audio tags while preserving the tags
  const parts = script.split(/(\[[^\]]+\])/g);
  const elements: React.ReactNode[] = [];
  let tagCounter = 0;

  for (const part of parts) {
    if (!part) continue;

    // Check if this part is an audio tag (enclosed in square brackets)
    const isAudioTag = part.startsWith("[") && part.endsWith("]");

    if (isAudioTag) {
      elements.push(
        <span
          key={`audio-tag-${tagCounter++}-${part.slice(1, -1)}`}
          className="text-brand-blue font-semibold "
          title="Audio expression tag"
        >
          {part}
        </span>,
      );
    } else {
      // Regular text
      elements.push(part);
    }
  }

  return elements;
}
