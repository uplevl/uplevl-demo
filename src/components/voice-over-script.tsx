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
      elements.push(<VoiceTag key={`audio-tag-${tagCounter++}-${part.slice(1, -1)}`}>{part}</VoiceTag>);
    } else {
      // Regular text
      elements.push(part);
    }
  }

  return elements;
}

function VoiceTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-brand-blue font-semibold bg-brand-blue/7 border border-brand-blue/10 rounded-lg px-1.5 py-0.25 text-xs tracking-wide"
      title="Audio expression tag"
    >
      {children}
    </span>
  );
}
