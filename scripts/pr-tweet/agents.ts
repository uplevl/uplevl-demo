import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import type { GeneratedTweet, PullRequestData, TweetDecision } from "./types";
import { extractHashtags, logTweetAnalysis, validateTweet } from "./utils";

// Initialize OpenRouter with environment variable
const openRouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

const tweetDecisionSchema = z.object({
  shouldTweet: z.boolean(),
});

/**
 * LLM Agent 1: Decides if a PR is worth tweeting about
 */
export async function decideTweetWorthiness(prData: PullRequestData): Promise<TweetDecision> {
  try {
    const prompt = `You are a "Build in Public" content strategist. Analyze this pull request and decide if it's worth sharing on X.

PR Title: "${prData.title}"
PR Body: "${prData.body || "No description provided"}"
Repository: ${prData.repoName}

Context:
- Florian is the Co-Founder and Sole-Developer of uplevl.ai, a tool for real estate agents to automate high-quality social media content.
- Florian is sharing his "Build in Public" journey on X.

Consider these factors:
1. Is this user-facing? (new features, UI improvements, user experience)
2. Is this technically impressive? (performance improvements, architecture changes, interesting solutions)
3. Is this a milestone? (major releases, significant achievements, project updates)
4. Is this interesting to other developers? (learning opportunities, useful patterns)

AVOID tweeting about:
- Minor bug fixes
- Internal refactoring without user impact
- Dependency updates
- Documentation-only changes
- CI/CD tweaks
- Small typo fixes

Respond with ONLY a JSON object containing:
- shouldTweet: true/false

Be selective - only tweet about genuinely interesting or valuable updates. Return only the JSON object, no additional text or explanation.`;

    const { object } = await generateObject({
      model: openRouter("anthropic/claude-3.5-sonnet"),
      schema: tweetDecisionSchema,
      prompt,
      temperature: 0.3,
      mode: "json",
    });

    return object;
  } catch (error) {
    console.error("Error in tweet decision agent:", error);
    return {
      shouldTweet: false,
    };
  }
}

/**
 * LLM Agent 2: Generates a human-sounding tweet with retry logic for character limits
 */
export async function generateTweetContent(prData: PullRequestData): Promise<GeneratedTweet> {
  const maxRetries = 3;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const prompt = `You are Florian, the Co-Founder and Sole-Developer of uplevl.ai, a tool for real estate agents to automate high-quality social media content. You're sharing your "Build in Public" journey on X. Write a personal, engaging tweet about this pull request.

PR Title: "${prData.title}"
PR Body: "${prData.body || "No description provided"}"
Repository: ${prData.repoName}
PR URL: ${prData.url}

CRITICAL REQUIREMENTS:
- The tweet MUST be under 280 characters (aim for 250-270 to be safe)
- Use proper line breaks (\\n) between paragraphs for natural formatting
- Each paragraph should be short and punchy

Guidelines:
- Write as Florian posting personally - sound excited and authentic
- Structure with short paragraphs separated by line breaks
- Include relevant emojis naturally (don't overdo it)
- Always end with #buildinpublic on its own line
- Add other hashtags only if they fit naturally and space allows
- Focus on the value or interesting technical aspect
- Include uplevl.ai mention if appropriate (X converts to link)
- Avoid being promotional or salesy

Examples of good formatting:
"Just shipped a new feature that lets users customize their video thumbnails 🎯

The trickiest part was handling all the different aspect ratios.

#buildinpublic"

"Small but mighty update ⚡️

Improved loading times by 40% with some clever caching tricks.

Sometimes the best improvements are invisible to users.

#buildinpublic"

${attempt > 1 ? `\nPREVIOUS ATTEMPT FAILED: ${lastError}\nMake this tweet shorter and more concise.\n` : ""}

Write a tweet that's under 280 characters with proper line breaks between paragraphs.`;

      const { text } = await generateText({
        model: openRouter("anthropic/claude-sonnet-4"),
        prompt,
        temperature: 0.7,
      });

      const cleanedText = text.trim();
      const validation = validateTweet(cleanedText);

      if (!validation.isValid) {
        lastError = validation.reason || "Validation failed";
        console.log(`❌ Attempt ${attempt}/${maxRetries} failed: ${lastError}`);
        console.log(`📝 Generated content (${cleanedText.length} chars): "${cleanedText}"`);

        if (attempt === maxRetries) {
          throw new Error(`Failed to generate valid tweet after ${maxRetries} attempts. Last error: ${lastError}`);
        }
        continue;
      }

      console.log(`✅ Successfully generated tweet on attempt ${attempt}`);
      return {
        content: cleanedText,
        characterCount: cleanedText.length,
        hashtags: extractHashtags(cleanedText),
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error in tweet generation attempt ${attempt}:`, error);

      if (attempt === maxRetries) {
        throw new Error(`Failed to generate tweet after ${maxRetries} attempts: ${lastError}`);
      }
    }
  }

  throw new Error("Unexpected error in tweet generation");
}

/**
 * Main function that orchestrates both agents
 */
export async function analyzePRAndGenerateTweet(prData: PullRequestData): Promise<{
  decision: TweetDecision;
  tweet?: GeneratedTweet;
}> {
  console.log("🤖 Starting PR analysis with LLM agents...");

  // Agent 1: Decide if PR is worth tweeting
  const decision = await decideTweetWorthiness(prData);

  if (!decision.shouldTweet) {
    console.log("💭 Decision: Not worth tweeting");
    return { decision };
  }

  console.log("💭 Decision: Worth tweeting! Generating tweet...");

  // Agent 2: Generate the tweet
  const tweet = await generateTweetContent(prData);

  // Log detailed tweet analysis
  logTweetAnalysis(tweet.content);

  if (tweet.hashtags.length > 0) {
    console.log(`🏷️  All hashtags: ${tweet.hashtags.join(", ")}`);
  }

  return { decision, tweet };
}
