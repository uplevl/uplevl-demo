import { generateText } from "ai";
import { LLM_MODELS } from "@/constants/llm";
import { DEFAULT_VOICE_ID, getAllMarketingTags, getPromptAudioTags, VOICE_MODELS } from "@/constants/voice";
import { openRouter } from "@/lib/open-router";
import type { PostMediaGroup } from "@/repositories/post-media-group.repository";
import type { VoiceSchema } from "@/types/voice";

// Estimated speaking rate: ~250 words per minute for natural speech
// For 20-30 second marketing video: 120-175 words optimal for persuasive content
const TARGET_SCRIPT_WORDS = 175; // Optimized for marketing drip campaigns
const MIN_SCRIPT_WORDS = 120; // Minimum for effective marketing content

export const DEFAULT_VOICE_SCHEMA: VoiceSchema = {
  tone: "persuasive, emotional, yet professional - perfect for real estate marketing",
  style: "compelling storytelling that builds desire and urgency",
  perspective: "spoken in second person, as if personally inviting a buyer to envision their future",
} as const satisfies VoiceSchema;

/**
 * Count words in a script text
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Clean script text while preserving approved audio tags
 */
function cleanScriptText(text: string): string {
  const approvedTags = getAllMarketingTags();

  return (
    text
      .trim()
      .replace(/\n+/g, " ")
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove **bold**
      .replace(/\*(.*?)\*/g, "$1") // Remove *italics*
      .replace(/_(.*)_/g, "$1") // Remove _underline_
      // Remove word count annotations
      .replace(/\*\[.*?\]\*/g, "") // Remove *[18 words exactly]*
      // Remove brackets that are NOT approved audio tags
      .replace(/\[([^\]]*)\]/g, (_, content) => {
        const fullTag = `[${content}]`;
        // Preserve if it's an approved marketing audio tag
        if (approvedTags.includes(fullTag)) {
          return fullTag;
        }
        // Remove if it's not an approved tag
        return "";
      })
      // Clean up extra spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Estimate speaking time in seconds based on word count
 */
function estimateSpeakingTime(wordCount: number): number {
  // Assuming ~150 words per minute for natural speech
  return Math.round((wordCount / 150) * 60);
}

/**
 * Calculate target words per group based on total groups
 */
function calculateWordsPerGroup(totalGroups: number): number {
  // Distribute target words across groups, ensuring we stay within optimal marketing range
  const wordsPerGroup = Math.floor(TARGET_SCRIPT_WORDS / totalGroups);
  return Math.max(15, Math.min(wordsPerGroup, 40)); // Min 15, max 40 words per group for marketing content
}

interface GenerateScriptsProps {
  groups: PostMediaGroup[];
  propertyContext: string;
  voiceSchema: VoiceSchema;
  voiceId?: string;
}

export async function generateScripts(props: GenerateScriptsProps) {
  const { groups, propertyContext, voiceSchema, voiceId } = props;
  const scripts: { groupId: string; script: string }[] = [];
  const targetWordsPerGroup = calculateWordsPerGroup(groups.length);

  for (const group of groups) {
    const prompt = generateScriptPrompt({
      groupName: group.groupName,
      media: group.media,
      voiceSchema,
      propertyContext,
      priorScripts: scripts.map((s) => s.script),
      targetWords: targetWordsPerGroup,
      isEstablishingShot: group.media.some((img) => img.isEstablishingShot),
      voiceId,
    });

    const { text } = await generateText({
      model: openRouter(LLM_MODELS.ANTHROPIC_CLAUDE_SONNET_4),
      prompt: [{ role: "user", content: prompt }],
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    });

    let cleanedScript = cleanScriptText(text);

    // Validate and adjust if necessary
    const wordCount = countWords(cleanedScript);
    if (wordCount > targetWordsPerGroup + 10) {
      // If significantly over target, try to regenerate with stricter constraints
      const stricterPrompt = generateScriptPrompt({
        groupName: group.groupName,
        media: group.media,
        voiceSchema,
        propertyContext,
        priorScripts: scripts.map((s) => s.script),
        targetWords: targetWordsPerGroup,
        isEstablishingShot: group.media.some((img) => img.isEstablishingShot),
        isStrict: true,
        voiceId,
      });

      const { text: stricterText } = await generateText({
        model: openRouter(LLM_MODELS.ANTHROPIC_CLAUDE_SONNET_4),
        prompt: [{ role: "user", content: stricterPrompt }],
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      });

      cleanedScript = cleanScriptText(stricterText);
    }

    scripts.push({ groupId: group.id, script: cleanedScript });
  }

  // Final validation
  const totalWords = scripts.reduce((sum, script) => sum + countWords(script.script), 0);
  const estimatedTime = estimateSpeakingTime(totalWords);

  console.log(`Generated ${scripts.length} scripts with ${totalWords} total words (estimated ${estimatedTime}s)`);

  return scripts;
}

interface GenerateScriptPromptProps {
  groupName: string;
  media: PostMediaGroup["media"];
  voiceSchema: VoiceSchema;
  propertyContext: string;
  priorScripts: string[];
  targetWords: number;
  isEstablishingShot: boolean;
  isStrict?: boolean;
  voiceId?: string;
}

function generateScriptPrompt(props: GenerateScriptPromptProps) {
  const {
    groupName,
    media,
    voiceSchema,
    propertyContext,
    priorScripts,
    targetWords,
    isEstablishingShot,
    isStrict,
    voiceId = DEFAULT_VOICE_ID,
  } = props;

  const strictnessNote = isStrict
    ? "\n⚠️ CRITICAL: This script was too long. Make it even more concise. Every word counts."
    : "";

  const availableAudioTags = getPromptAudioTags(voiceId);
  const voiceModel = VOICE_MODELS.find((voice) => voice.id === voiceId);
  const voicePersonality = voiceModel
    ? `\n<VoicePersonality>\nSpeaker: ${voiceModel.name} (${voiceModel.gender})\nPersonality: ${voiceModel.description}\nAdapt your language, tone, and expressions to match this speaker's natural way of speaking while maintaining marketing effectiveness.\n</VoicePersonality>\n`
    : "";

  return `
You are creating a voiceover script for a ${targetWords}-word segment of a marketing video for a real estate drip campaign.

CRITICAL: Your output must be PLAIN TEXT with optional audio tags - no markdown, no formatting, no annotations, no word counts in brackets.

<PropertyContext>
${propertyContext}

<ImageDescriptions>
${media.map((img, index) => `- ${index + 1}: ${img.description}`).join("\n")}

${voicePersonality}<VoiceGuidelines>
- Tone: ${voiceSchema.tone}
- Style: ${voiceSchema.style}
- Perspective: ${voiceSchema.perspective}

<AudioExpressionTags>
You can enhance emotional delivery using these audio tags at natural points in the script:
${availableAudioTags.join(", ")}

Usage Guidelines:
- Use strategically (2-4 tags per script segment) at key emotional moments
- Place tags at NATURAL STOPS and EMOTIONAL HOOKS for maximum impact:
  • Before emotional reveals: "[excited] This stunning kitchen" 
  • After emotional statements: "Your dream home awaits [sighs]"
  • At natural pauses: "Picture this... [pause] your morning coffee ritual"
  • During emotional transitions: "But wait [whispers] there's something even more special"
- Choose tags that amplify the emotional journey and marketing message
- Perfect for: emotional reveals, exclusive features, dream-like descriptions, confident assertions, natural breathing points
- Examples: 
  • "[impressed] Look at these soaring ceilings that command attention [pause] this is luxury living"
  • "Finally, the peace you've been seeking [sighs] in your own private sanctuary"  
  • "This kitchen becomes the heart of your home [excited] where memories are made daily"
  • "Imagine coming home to this [whispers] your personal retreat from the world"

${priorScripts.length > 0 ? `<PreviousScripts>\n${priorScripts.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n</PreviousScripts>\n` : ""}

<CriticalConstraints>
- TARGET: ${targetWords} words (aim for this target, can go ±5 words if needed for flow)
- PURPOSE: Marketing video for ${isEstablishingShot ? "opening hook with property introduction" : "feature highlight that builds desire"}
- CAMPAIGN: Part of a real estate drip campaign designed to generate leads and schedule showings
- TIMING: This segment should fill its portion of a 20-30 second marketing video${strictnessNote}

<Instructions>
${
  isEstablishingShot
    ? `- OPENING HOOK: Start with powerful emotional impact - paint the dream lifestyle this property offers
- Include location naturally to establish desirability (e.g., "in prestigious Bastrop" not the address)  
- Reference price range or value proposition if significant (e.g., "under four hundred" not "$399,000")
- Create urgency and desire from the first sentence
- Paint the vision of their future life here`
    : `- Focus on the most compelling, desire-building aspect of this ${groupName.toLowerCase()}
- Use emotionally charged, sensory language that makes viewers crave this space
- Connect to lifestyle benefits - how will this space transform their daily life?
- Build on the emotional momentum from previous segments
- Use emotional pacing: setup → reveal → emotional punctuation with audio tags`
}

<MarketingRequirements>
- Write in persuasive, marketing-focused language that builds desire and urgency
- Include specific details that make this property irresistible and memorable
- Use emotional triggers: comfort, luxury, peace, achievement, belonging, security
- Create a sense of scarcity or exclusivity where appropriate
- Don't mention room names directly ("living room", "kitchen") - describe the lifestyle experience instead
- Use language that helps prospects envision their ideal life in this space
- Include subtle social proof or desirability indicators
- Weave the call-to-action naturally INTO the narrative flow - don't tack it on at the end
- CTAs should feel like natural conclusions: "before someone else calls it home" or "while this rare opportunity lasts" or "opportunities like this don't wait" or "your dream home is calling"
- Examples of natural integration: "This is where your story begins" / "Don't let this sanctuary slip away" / "Your perfect retreat awaits your call"
- Make every word count toward the sale

<OutputFormat>
- Return ONLY plain text with strategic audio expression tags - no markdown formatting, no bold, no italics
- Audio tags should be in square brackets and only from the approved list above
- Do NOT include word counts, annotations, or meta-information in brackets
- Do NOT use ** for bold or * for italics or any other markdown
- Write as natural, flowing sentences that sound conversational when spoken BY THIS SPECIFIC VOICE
- Match the speaking style, vocabulary, and natural expressions of the voice personality
- STRATEGICALLY place audio tags at emotional hooks, natural pauses, and key reveals for maximum impact
- Use tags both BEFORE phrases (for setup) and AFTER statements (for emotional punctuation)
- Create emotional rhythm: build anticipation, deliver the hook, then let it breathe with a tag
- Integrate any urgency or CTA language seamlessly into the narrative while staying true to the speaker's character

WORD COUNT TARGET: ${targetWords} words (aim to reach this target for maximum marketing impact)`;
}

/**
 * Utility function to analyze and provide feedback on script generation results
 */
export function analyzeScriptResults(scripts: { groupId: string; script: string }[]) {
  const totalWords = scripts.reduce((sum, script) => sum + countWords(script.script), 0);
  const estimatedTime = estimateSpeakingTime(totalWords);
  const averageWordsPerGroup = Math.round(totalWords / scripts.length);

  const analysis = {
    totalScripts: scripts.length,
    totalWords,
    estimatedTime,
    averageWordsPerGroup,
    isWithinTarget: totalWords >= MIN_SCRIPT_WORDS && totalWords <= TARGET_SCRIPT_WORDS + 30,
    recommendations: [] as string[],
  };

  if (totalWords < MIN_SCRIPT_WORDS) {
    analysis.recommendations.push(
      `Scripts are ${MIN_SCRIPT_WORDS - totalWords} words under minimum. Add more persuasive content and CTAs.`,
    );
  }

  if (totalWords > TARGET_SCRIPT_WORDS + 30) {
    analysis.recommendations.push(
      `Scripts are ${totalWords - TARGET_SCRIPT_WORDS} words over target. Consider tightening marketing message.`,
    );
  }

  if (estimatedTime < 20) {
    analysis.recommendations.push(
      `Estimated ${estimatedTime}s is too short for effective marketing. Add more compelling content.`,
    );
  }

  if (estimatedTime > 35) {
    analysis.recommendations.push(
      `Estimated ${estimatedTime}s exceeds optimal attention span for social media marketing.`,
    );
  }

  if (averageWordsPerGroup < 12) {
    analysis.recommendations.push(
      `Average ${averageWordsPerGroup} words per group is low for marketing. Aim for 15-40 words per segment.`,
    );
  }

  if (averageWordsPerGroup > 40) {
    analysis.recommendations.push(
      `Average ${averageWordsPerGroup} words per group is high. Aim for 15-40 words per segment.`,
    );
  }

  return analysis;
}
