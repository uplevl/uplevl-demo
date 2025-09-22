import type { IFTTTWebhookPayload, PullRequestData } from "./types";

/**
 * Extracts and validates pull request data from environment variables
 */
export function extractPullRequestData(): PullRequestData {
  const prNumber = process.env.PR_NUMBER;
  const prTitle = process.env.PR_TITLE;
  const prBody = process.env.PR_BODY;
  const prUrl = process.env.PR_URL;
  const repoName = process.env.REPO_NAME;

  if (!prNumber || !prTitle || !prUrl || !repoName) {
    throw new Error("Missing required PR environment variables");
  }

  return {
    number: Number.parseInt(prNumber, 10),
    title: prTitle,
    body: prBody || null,
    url: prUrl,
    repoName: repoName,
  };
}

/**
 * Validates that the generated tweet meets Twitter's requirements and formatting standards
 */
export function validateTweet(content: string): { isValid: boolean; reason?: string } {
  if (!content.trim()) {
    return { isValid: false, reason: "Tweet content is empty" };
  }

  if (content.length > 280) {
    return { isValid: false, reason: `Tweet is too long: ${content.length}/280 characters` };
  }

  // Check if tweet has proper paragraph structure with line breaks
  const lines = content.split("\n");
  if (lines.length < 2) {
    return { isValid: false, reason: "Tweet should have multiple paragraphs separated by line breaks" };
  }

  // Check if #buildinpublic hashtag is present
  if (!content.includes("#buildinpublic")) {
    return { isValid: false, reason: "Tweet must include #buildinpublic hashtag" };
  }

  // Check for excessively long single lines (should be broken into paragraphs)
  const hasLongLine = lines.some((line) => line.trim().length > 100);
  if (hasLongLine) {
    return { isValid: false, reason: "Individual paragraphs should be shorter and more punchy" };
  }

  return { isValid: true };
}

/**
 * Extracts hashtags from tweet content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = content.match(hashtagRegex);
  return matches || [];
}

/**
 * Posts a tweet via IFTTT webhook
 */
export async function postTweetViaIFTTT(tweetContent: string): Promise<void> {
  const webhookUrl = process.env.IFTTT_PR_TWEET_URL;

  if (!webhookUrl) {
    throw new Error("IFTTT_PR_TWEET_URL environment variable is not set");
  }

  const payload: IFTTTWebhookPayload = {
    value1: tweetContent,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`IFTTT webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log("✅ Successfully posted tweet via IFTTT");
  } catch (error) {
    console.error("❌ Failed to post tweet via IFTTT:", error);
    throw error;
  }
}

/**
 * Logs PR analysis results
 */
export function logPRAnalysis(prData: PullRequestData, shouldTweet: boolean): void {
  console.log("\n📊 PR Analysis Results:");
  console.log(`PR #${prData.number}: ${prData.title}`);
  console.log(`Repository: ${prData.repoName}`);
  console.log(`Should Tweet: ${shouldTweet ? "✅ Yes" : "❌ No"}`);
  console.log(`PR URL: ${prData.url}\n`);
}

/**
 * Interface for tweet formatting analysis results
 */
export interface TweetFormattingAnalysis {
  characterCount: number;
  lineCount: number;
  hasHashtagBuildinPublic: boolean;
  longestLine: number;
  avgLineLength: number;
  paragraphs: string[];
}

/**
 * Analyzes tweet formatting and provides detailed feedback
 */
export function analyzeTweetFormatting(content: string): TweetFormattingAnalysis {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Guard against empty filtered lines array to avoid Math.max on empty array and division by zero
  const longestLine = lines.length === 0 ? 0 : Math.max(...lines.map((line) => line.length));
  const avgLineLength =
    lines.length === 0 ? 0 : Math.round(lines.reduce((sum, line) => sum + line.length, 0) / lines.length);

  return {
    characterCount: content.length,
    lineCount: lines.length,
    hasHashtagBuildinPublic: content.includes("#buildinpublic"),
    longestLine,
    avgLineLength,
    paragraphs: lines,
  };
}

/**
 * Formats detailed tweet analysis for console output
 */
export function logTweetAnalysis(content: string): void {
  const analysis = analyzeTweetFormatting(content);

  console.log("\n📝 Tweet Analysis:");
  console.log(`📏 Characters: ${analysis.characterCount}/280 (${280 - analysis.characterCount} remaining)`);
  console.log(`📄 Paragraphs: ${analysis.lineCount}`);
  console.log(`📐 Longest paragraph: ${analysis.longestLine} chars`);
  console.log(`📊 Average paragraph length: ${analysis.avgLineLength} chars`);
  console.log(`🏷️  #buildinpublic present: ${analysis.hasHashtagBuildinPublic ? "✅" : "❌"}`);

  console.log("\n📖 Paragraph breakdown:");
  analysis.paragraphs.forEach((paragraph, index) => {
    console.log(`  ${index + 1}. (${paragraph.length} chars) "${paragraph}"`);
  });

  console.log(`\n📤 Full tweet preview:\n"${content}"\n`);
}
