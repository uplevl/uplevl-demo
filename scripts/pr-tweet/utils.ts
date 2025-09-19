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
 * Validates that the generated tweet meets Twitter's requirements
 */
export function validateTweet(content: string): { isValid: boolean; reason?: string } {
  if (!content.trim()) {
    return { isValid: false, reason: "Tweet content is empty" };
  }

  if (content.length > 280) {
    return { isValid: false, reason: `Tweet is too long: ${content.length} characters` };
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
export function logPRAnalysis(prData: PullRequestData, shouldTweet: boolean, reasoning: string): void {
  console.log("\n📊 PR Analysis Results:");
  console.log(`PR #${prData.number}: ${prData.title}`);
  console.log(`Repository: ${prData.repoName}`);
  console.log(`Should Tweet: ${shouldTweet ? "✅ Yes" : "❌ No"}`);
  console.log(`Reasoning: ${reasoning}`);
  console.log(`PR URL: ${prData.url}\n`);
}
