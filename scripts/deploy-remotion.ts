#!/usr/bin/env tsx

import "dotenv/config";
import path from "node:path";
import { type AwsRegion, deployFunction, deploySite, getOrCreateBucket } from "@remotion/lambda";

const REMOTION_AWS_REGION = process.env.REMOTION_AWS_REGION as AwsRegion;

/**
 * Deploy Remotion Lambda infrastructure
 * This script sets up the necessary AWS Lambda function and S3 bucket for video rendering
 */
async function deployRemotionInfrastructure() {
  const region = REMOTION_AWS_REGION;

  console.log("🚀 Starting Remotion Lambda deployment...");
  console.log(`📍 Using region: ${region}`);

  try {
    // Step 1: Create or get S3 bucket
    console.log("📦 Setting up S3 bucket...");
    const { bucketName, alreadyExisted: bucketExisted } = await getOrCreateBucket({
      region,
    });

    console.log(`✅ S3 bucket: ${bucketName} ${bucketExisted ? "(existing)" : "(created)"}`);

    // Step 2: Deploy Lambda function
    console.log("⚡ Deploying Lambda function...");
    const { functionName, alreadyExisted: functionExisted } = await deployFunction({
      region,
      timeoutInSeconds: 300, // Increase to 5 minutes for complex renders
      memorySizeInMb: 3008, // 3GB RAM for better performance (gives 3 vCPUs)
      diskSizeInMb: 10240, // 10GB disk space
      createCloudWatchLogGroup: true,
      cloudWatchLogRetentionPeriodInDays: 14,
      enableLambdaInsights: true, // Enable monitoring
    });

    console.log(`✅ Lambda function: ${functionName} ${functionExisted ? "(existing)" : "(created)"}`);

    // Step 3: Deploy Remotion site (upload React components to S3)
    console.log("🎬 Deploying Remotion site...");
    const entryPoint = path.join(process.cwd(), "src/remotion/index.ts");

    const { serveUrl, siteName } = await deploySite({
      region,
      bucketName,
      entryPoint,
      siteName: "uplevl-video-reel", // Deterministic site name
    });

    console.log(`✅ Site deployed: ${siteName}`);
    console.log(`🔗 Serve URL: ${serveUrl}`);

    // Step 4: Save configuration for use in application
    const config = {
      region,
      bucketName,
      functionName,
      serveUrl,
      siteName,
    };

    console.log("\n🎯 Deployment complete! Your environment variables:");
    console.log(`✅ REMOTION_AWS_REGION=${region}`);
    console.log(`✅ REMOTION_BUCKET_NAME=${bucketName}`);
    console.log(`✅ REMOTION_FUNCTION_NAME=${functionName}`);
    console.log(`✅ REMOTION_SERVE_URL=${serveUrl}`);
    console.log(`📝 REMOTION_SITE_NAME=${siteName} (for reference)`);

    return config;
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployRemotionInfrastructure()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { deployRemotionInfrastructure };
