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
 * - SENTRY_DSN: Sentry DSN for error tracking and performance monitoring
 */

import * as Sentry from "@sentry/nextjs";
import { analyzePRAndGenerateTweet } from "./agents";
import { extractPullRequestData, logPRAnalysis, postTweetViaIFTTT } from "./utils";

// Initialize Sentry for error tracking with special tagging for automation
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
});

// Set global tags and context for marketing automation
Sentry.setTags({
  service: "pr-tweet-automation",
  category: "marketing-automation",
  external: "true",
});

Sentry.setExtra("automationType", "pr-tweet");
Sentry.setExtra("description", "External marketing automation for PR announcements");

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

    // Analyze PR with LLM agents wrapped in Sentry instrumentation
    const result = await Sentry.startSpan(
      {
        op: "ai.analysis",
        name: "Analyze PR and Generate Tweet",
      },
      async (span) => {
        // Add relevant attributes for tracing
        span.setAttribute("pr.number", prData.number);
        span.setAttribute("pr.title", prData.title);
        span.setAttribute("repo.name", prData.repoName);
        span.setAttribute("service", "pr-tweet-automation");
        span.setAttribute("category", "marketing-automation");
        span.setAttribute("external", "true");
        span.setAttribute("automation.type", "pr-tweet");

        // Add breadcrumb for analysis start
        Sentry.addBreadcrumb({
          message: "Starting PR analysis",
          category: "marketing-automation.pr-analysis",
          level: "info",
          data: {
            prNumber: prData.number,
            prTitle: prData.title,
            repoName: prData.repoName,
            automationType: "pr-tweet",
            external: true,
          },
        });

        try {
          const analysisResult = await analyzePRAndGenerateTweet(prData);

          // Add breadcrumb for successful analysis
          Sentry.addBreadcrumb({
            message: "PR analysis completed successfully",
            category: "marketing-automation.pr-analysis",
            level: "info",
            data: {
              shouldTweet: analysisResult.decision.shouldTweet,
              reasoning: analysisResult.decision.reasoning,
              automationType: "pr-tweet",
              external: true,
            },
          });

          return analysisResult;
        } catch (error) {
          // Add breadcrumb for analysis failure
          Sentry.addBreadcrumb({
            message: "PR analysis failed",
            category: "marketing-automation.pr-analysis",
            level: "error",
            data: {
              error: error instanceof Error ? error.message : String(error),
              automationType: "pr-tweet",
              external: true,
            },
          });

          // Capture the exception with additional context
          Sentry.captureException(error, {
            tags: {
              operation: "pr-analysis",
              prNumber: prData.number,
              service: "pr-tweet-automation",
              category: "marketing-automation",
              external: "true",
            },
            extra: {
              prData,
              automationType: "pr-tweet",
              description: "External marketing automation for PR announcements",
            },
          });

          throw error;
        }
      },
    );

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
    await Sentry.startSpan(
      {
        op: "marketing-automation.http.client",
        name: "Post Tweet via IFTTT",
      },
      async (span) => {
        // Mark this span as external marketing automation
        span.setAttribute("service", "pr-tweet-automation");
        span.setAttribute("category", "marketing-automation");
        span.setAttribute("external", "true");
        span.setAttribute("automation.type", "pr-tweet");

        if (result.tweet) {
          await postTweetViaIFTTT(result.tweet.content);
        }
      },
    );

    console.log("🎉 PR tweet automation completed successfully!");
    if (result.tweet) {
      console.log(`📝 Posted tweet: "${result.tweet.content}"`);
    }
  } catch (error) {
    console.error("❌ PR tweet automation failed:", error);

    // Report error to Sentry with marketing automation context
    Sentry.captureException(error, {
      tags: {
        service: "pr-tweet-automation",
        category: "marketing-automation",
        external: "true",
        operation: "main-function",
      },
      extra: {
        automationType: "pr-tweet",
        description: "External marketing automation for PR announcements",
      },
    });

    // Exit with error code to fail the GitHub Action
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  Sentry.captureException(reason, {
    tags: {
      service: "pr-tweet-automation",
      category: "marketing-automation",
      external: "true",
      operation: "unhandled-rejection",
    },
    extra: {
      automationType: "pr-tweet",
      description: "External marketing automation for PR announcements",
    },
  });
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  Sentry.captureException(error, {
    tags: {
      service: "pr-tweet-automation",
      category: "marketing-automation",
      external: "true",
      operation: "uncaught-exception",
    },
    extra: {
      automationType: "pr-tweet",
      description: "External marketing automation for PR announcements",
    },
  });
  process.exit(1);
});

// Run the main function
main();
