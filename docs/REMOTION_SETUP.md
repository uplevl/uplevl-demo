# Remotion Lambda Integration Setup Guide

This guide walks you through setting up Remotion Lambda for video composition in your Next.js application.

## Overview

The integration allows you to:

- Generate final videos combining auto-reel footage with voice-over audio  
- Use AWS Lambda for serverless video rendering
- Automatically adjust video speed based on audio length (20-30 second target)
- Upload results to your existing Supabase storage

## Prerequisites

1. **AWS Account** with proper permissions
2. **AWS CLI** configured with your credentials
3. **Environment Variables** properly set

## Step 1: Deploy Remotion Infrastructure

Run the deployment script to set up AWS Lambda function and S3 bucket:

```bash
pnpm remotion:deploy
```

This will:

- Create/find an S3 bucket for Remotion
- Deploy a Lambda function for rendering
- Upload your Remotion compositions to S3
- Output environment variables to add

## Step 2: Add Environment Variables

Add the outputted environment variables to your `.env.local`:

```env
REMOTION_AWS_REGION=us-east-1
REMOTION_BUCKET_NAME=remotionlambda-xxxxx
REMOTION_FUNCTION_NAME=remotion-render-xxxxx
REMOTION_SERVE_URL=https://remotionlambda-xxxxx.s3.us-east-1.amazonaws.com/sites/uplevl-video-reel/index.html
```

## Step 3: Verify Deployment

Check that your functions and sites are deployed:

```bash
# List deployed functions
pnpm remotion:functions

# List deployed sites  
pnpm remotion:sites
```

## Step 4: Test the Integration

1. Navigate to a property group that has:
   - ✅ Auto-reel video (`autoReelUrl`)
   - ✅ Voice-over audio (`audioUrl`)

2. You should see a "Generate Final Video" button in the video elements section

3. Click the button to trigger video composition

4. The system will:
   - Calculate video timing based on audio length
   - Render the composition on AWS Lambda
   - Upload the final video to Supabase
   - Update the group with `reelUrl`

## How It Works

### Video Timing Logic

Based on the number of photos and audio length:

- **Auto-reel duration**: 3 seconds per photo
- **Target duration**: 30s if audio > 20s, otherwise 20s  
- **Playback rate**: Calculated to fit auto-reel into target duration
- **Audio padding**: 2 seconds before audio starts

### Remotion Compositions

- `FinalVideoVertical`: 1080x1920 (social media)
- `FinalVideoHorizontal`: 1920x1080 (traditional)

### Architecture Flow

```sh
UI Button Click → API Route → Inngest Function → Remotion Lambda → S3 → Supabase
```

## Troubleshooting

### Common Issues

1. **Missing AWS Permissions**
   - Ensure your AWS user has Lambda and S3 permissions
   - Check the Remotion Lambda permissions guide

2. **Environment Variables Not Set**
   - Make sure all `REMOTION_*` variables are in your `.env.local`
   - Restart your development server after adding them

3. **Function Not Found**
   - Run `pnpm remotion:deploy` to ensure function is deployed
   - Check the function exists in AWS Lambda console

4. **Site Not Found**
   - Redeploy with: `pnpm remotion:deploy-site`
   - Verify the serve URL is accessible

### Monitoring

- Check Inngest dashboard for job progress
- Monitor AWS Lambda logs in CloudWatch
- Use Sentry for error tracking

## Manual Commands

Deploy just the site (after code changes):

```bash
pnpm remotion:deploy-site
```

Full infrastructure deployment:

```bash
pnpm remotion:deploy
```

## Cost Considerations

- AWS Lambda charges per execution time
- S3 storage for temporary renders
- Typical cost: $0.01-0.05 per video render
- Videos auto-delete after 7 days (configurable)

## Next Steps

1. **Deploy to production**: Set up environment variables in your hosting platform
2. **Monitor usage**: Set up CloudWatch alarms for costs
3. **Optimize**: Adjust Lambda memory/timeout based on your video complexity
4. **Scale**: Consider multiple regions for global users
