import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText } from "ai";
import * as z from "zod";
import type { GeneratedTweet, PullRequestData, TweetDecision } from "./types";
import { extractHashtags, validateTweet } from "./utils";

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
 * LLM Agent 2: Generates a human-sounding tweet
 */
export async function generateTweetContent(prData: PullRequestData): Promise<GeneratedTweet> {
  try {
    const prompt = `You are a Florian, the Co-Founder and Sole-Developer of uplevl.ai, a tool for real estate agents to automate high-quality social media content, sharing your "Build in Public" journey on X. Write a personal, engaging tweet about this pull request.

PR Title: "${prData.title}"
PR Body: "${prData.body || "No description provided"}"
Repository: ${prData.repoName}
PR URL: ${prData.url}

Guidelines:
- Write the tweet *as if Florian is posting it personally*
- Sound personal and authentic, like you're excited to share this
- Feel free to mention why this update matters, how it felt, or what's coming next.
- Keep it under 280 characters
- Structure the tweet in short paragraphs with line breaks to mimic a real person reflecting on their progress.
- Include relevant emojis if they feel natural (don't overdo it)
- Conclude with a strong statement, insight, or call to curiosity (e.g., “More soon.” or “Loving the momentum lately.”)
- Always include the hashtag #buildinpublic in a new paragraph.
- Add special hashtags only if they fit the vibe of the tweet.
- Don't be overly promotional or salesy
- Focus on the value or interesting aspect
- You can include the PR link if space allows
- Mention uplevl.ai naturally if appropriate; X will convert this to a link, so we can generate some traffic.

Examples of good tweet styles:
"Just shipped a new feature that lets users... 🚀

The trickiest part was figuring out how to... 

#buildinpublic"

"Small but mighty update ⚡️

Improved loading times by 40% with some clever caching tricks.

Sometimes the best improvements are invisible to users but make everything feel snappier."

Write a tweet that matches this style and energy.`;

    const { text } = await generateText({
      model: openRouter("anthropic/claude-sonnet-4"),
      prompt,
      temperature: 0.7,
    });

    const validation = validateTweet(text);
    if (!validation.isValid) {
      throw new Error(`Generated tweet failed validation: ${validation.reason}`);
    }

    return {
      content: text.trim(),
      characterCount: text.length,
      hashtags: extractHashtags(text),
    };
  } catch (error) {
    console.error("Error in tweet generation agent:", error);
    throw new Error(`Failed to generate tweet: ${error}`);
  }
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

  console.log("📝 Generated tweet:");
  console.log(`"${tweet.content}"`);
  console.log(`Characters: ${tweet.characterCount}/280`);
  if (tweet.hashtags.length > 0) {
    console.log(`Hashtags: ${tweet.hashtags.join(", ")}`);
  }

  return { decision, tweet };
}
