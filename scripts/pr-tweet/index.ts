#!/usr/bin/env tsx

/**
 * PR Tweet Automation Script
 *
 * This script analyzes merged pull requests and automatically posts tweets
 * via IFTTT when the PR is deemed worthy of sharing as a "Build in Public" update.
 *
 * Usage: pnpm tsx scripts/pr-tweet-automation.ts
 *
 * Required Environment Variables:
 * - OPEN_ROUTER_API_KEY: API key for OpenRouter (LLM provider)
 * - IFTTT_PR_TWEET_URL: IFTTT webhook URL for posting tweets
 * - PR_NUMBER: Pull request number (provided by GitHub Actions)
 * - PR_TITLE: Pull request title (provided by GitHub Actions)
 * - PR_BODY: Pull request body (provided by GitHub Actions)
 * - PR_URL: Pull request URL (provided by GitHub Actions)
 * - REPO_NAME: Repository name (provided by GitHub Actions)
 *
 * Optional Environment Variables:
 * - PR_TWEET_DISABLED: When truthy, disables tweet posting while still running analysis
 */

import { analyzePRAndGenerateTweet } from "./agents";
import { extractPullRequestData, logPRAnalysis, postTweetViaIFTTT } from "./utils";

async function main(): Promise<void> {
  try {
    console.log("🚀 Starting PR Tweet Automation...\n");

    // Environment variable guards
    if (!process.env.OPEN_ROUTER_API_KEY) {
      console.error("❌ Error: OPEN_ROUTER_API_KEY environment variable is required but not set");
      console.error("   Please ensure the OpenRouter API key is properly configured.");
      process.exit(1);
    }

    // Check for kill-switch
    if (process.env.PR_TWEET_DISABLED) {
      console.log("⏹️  PR tweeting is disabled via PR_TWEET_DISABLED environment variable");
      console.log("   Analysis will still run but no tweet will be posted.");
    }

    // Extract PR data from environment variables
    const prData = extractPullRequestData();
    console.log(`📋 Processing PR #${prData.number}: "${prData.title}"`);
    console.log(`🔗 Repository: ${prData.repoName}\n`);

    // Analyze PR with LLM agents
    const result = await analyzePRAndGenerateTweet(prData);

    // Log the analysis results
    logPRAnalysis(prData, result.decision.shouldTweet, result.decision.reasoning);

    // If not worth tweeting, exit gracefully
    if (!result.decision.shouldTweet) {
      console.log("ℹ️  No tweet will be posted for this PR.");
      process.exit(0);
    }

    // Ensure we have a generated tweet
    if (!result.tweet) {
      throw new Error("Tweet was deemed worthy but no tweet content was generated");
    }

    // Check kill-switch before posting
    if (process.env.PR_TWEET_DISABLED) {
      console.log("🔇 Tweet posting skipped due to PR_TWEET_DISABLED environment variable");
      console.log(`📝 Generated tweet (not posted): "${result.tweet.content}"`);
      console.log("✅ Analysis completed successfully - tweeting disabled");
      process.exit(0);
    }

    // Post the tweet via IFTTT
    console.log("📤 Posting tweet via IFTTT...");
    if (result.tweet) {
      await postTweetViaIFTTT(result.tweet.content);
    }

    console.log("🎉 PR tweet automation completed successfully!");
    if (result.tweet) {
      console.log(`📝 Posted tweet: "${result.tweet.content}"`);
    }
  } catch (error) {
    console.error("❌ PR tweet automation failed:", error);

    // Exit with error code to fail the GitHub Action
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Run the main function
main();
