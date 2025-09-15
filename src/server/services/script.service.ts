import { generateText } from "ai";
import { openRouter } from "@/server/lib/open-router";
import type { Post } from "@/server/repositories/post.repository";
import type { PostMediaGroup } from "@/server/repositories/post-media-group.repository";
import type { VoiceSchema } from "@/types/voice";

export const DEFAULT_VOICE_SCHEMA: VoiceSchema = {
  tone: "friendly and confident",
  style: "short, vivid sentences that highlight real value",
  perspective: "spoken in second person, as if guiding a home buyer through the space",
} as const satisfies VoiceSchema;

interface GenerateScriptsProps {
  groups: PostMediaGroup[];
  propertyStats: Post["propertyStats"];
  location: Post["location"];
  voiceSchema: VoiceSchema;
}

export async function generateScripts(props: GenerateScriptsProps) {
  const { groups, propertyStats, location, voiceSchema } = props;
  const propertyContext = await generatePropertyContext({ groups, propertyStats, location });
  const scripts: { groupId: string; script: string }[] = [];

  for (const group of groups) {
    const prompt = generateScriptPrompt({
      groupName: group.groupName,
      media: group.media,
      voiceSchema,
      propertyContext,
      priorScripts: scripts.map((s) => s.script),
    });

    const { text } = await generateText({
      model: openRouter("anthropic/claude-4-sonnet"),
      prompt: [{ role: "user", content: prompt }],
    });

    const cleanedScript = text.trim().replace(/\n+/g, " ");
    scripts.push({ groupId: group.id, script: cleanedScript });
  }

  return scripts;
}

interface GenerateScriptPromptProps {
  groupName: string;
  media: PostMediaGroup["media"];
  voiceSchema: VoiceSchema;
  propertyContext: string;
  priorScripts: string[];
}

function generateScriptPrompt(props: GenerateScriptPromptProps) {
  const { groupName, media, voiceSchema, propertyContext, priorScripts } = props;
  return `
You are a real estate agent showing a property to a potential buyer. You are speaking to a real person, not an audience.

<PropertyContext>
${propertyContext}

<Images>
${media.map((img) => `- ${img.description}`).join("\n")}

<VoiceGuidelines>
- Tone: ${voiceSchema.tone}
- Style: ${voiceSchema.style}
- Perspective: ${voiceSchema.perspective}

${priorScripts.length > 0 ? `<PreviousScripts>\n${priorScripts.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n</PreviousScripts>\n` : ""}
<Instructions>
- We are looking at a ${groupName}.
${
  media.some((img) => img.isEstablishingShot)
    ? `- This is the establishing shot. Open with an emotional hook — a feeling, moment, or imagined scene.
- Be sure to reference the property's location and price as stated in the property context above. Use natural phrasing (e.g., "in the heart of Bastrop" or "priced around three-fifty"). Do not use digits or currency symbols. Never include the exact street address.
- Let the viewer imagine themselves arriving, walking up, or enjoying a quiet moment. Paint a vivid moment, not a headline.`
    : ``
}
- Write 1-2 natural, conversational sentences describing the room or area based on the image descriptions. Do not reference group titles like "Living Room" or "Exterior" in the script.
- Avoid sounding like an advertisement or scripted pitch.
- Imagine one friend showing a property to another — relaxed, human, informative.
- Use subtle, descriptive language, not buzzwords.
- Maintain a sense of flow and cohesion with previous sections.
- Do *not* start with "Step into..." or overly formal intros.
- Only return the script as plain text.
`;
}

interface GeneratePropertyContextProps {
  groups: PostMediaGroup[];
  propertyStats: Post["propertyStats"];
  location: Post["location"];
}

async function generatePropertyContext({ groups, propertyStats, location }: GeneratePropertyContextProps) {
  const propertyInfo = [
    propertyStats?.description ? `- Description: ${propertyStats.description}` : null,
    propertyStats?.homeType ? `- Home Type: ${propertyStats.homeType}` : null,
    location ? `- Location: ${location}` : null,
    propertyStats?.price ? `- Price: ${propertyStats.price}` : null,
    propertyStats?.bedrooms ? `- Bedrooms: ${propertyStats.bedrooms}` : null,
    propertyStats?.bathrooms ? `- Bathrooms: ${propertyStats.bathrooms}` : null,
    propertyStats?.squareFeet ? `- Square Feet: ${propertyStats.squareFeet}` : null,
    propertyStats?.lotSize ? `- Lot Size: ${propertyStats.lotSize}` : null,
    propertyStats?.yearBuilt ? `- Year Built: ${propertyStats.yearBuilt}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const contextPrompt = `

<PropertyInfo>${propertyInfo ? `\n${propertyInfo}\n` : ""}

<Instructions>
- Give a high-level summary of the property, its style, vibe, and selling points. 
- Be brief but helpful. 
- This will serve as shared context for generating scripts later.
  `;

  const { text } = await generateText({
    model: openRouter("openai/gpt-4o-mini"),
    prompt: [
      { role: "system", content: contextPrompt },
      {
        role: "user",
        content: groups
          .map(
            (group, i) =>
              `\n${i + 1}. ${group.groupName}:\n${group.media.map((img) => `   - ${img.description}`).join("\n")}`,
          )
          .join("\n"),
      },
    ],
  });

  return text;
}
