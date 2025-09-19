#!/bin/bash

# Test script for PR Tweet Automation
# This script simulates a PR merge and tests the automation locally

echo "🧪 Testing PR Tweet Automation..."
echo ""

# Check if required environment variables are set
if [ -z "$OPEN_ROUTER_API_KEY" ]; then
    echo "❌ OPEN_ROUTER_API_KEY is not set"
    exit 1
fi

if [ -z "$IFTTT_PR_TWEET_URL" ]; then
    echo "❌ IFTTT_PR_TWEET_URL is not set"
    exit 1
fi

# Set up test PR data
export PR_NUMBER="123"
export PR_TITLE="feat: add awesome new user dashboard"
export PR_BODY="This PR introduces a completely redesigned user dashboard with improved performance and better UX. Users can now see their data visualized in real-time charts and customize their layout. The new dashboard loads 3x faster than the previous version."
export PR_URL="https://github.com/test-org/test-repo/pull/123"
export REPO_NAME="test-org/test-repo"

echo "📋 Test PR Data:"
echo "  Number: $PR_NUMBER"
echo "  Title: $PR_TITLE"
echo "  Repository: $REPO_NAME"
echo ""

# Run the automation
echo "🚀 Running PR Tweet Automation..."
echo "📁 All automation files are now organized in scripts/pr-tweet/ directory"
pnpm pr-tweet
