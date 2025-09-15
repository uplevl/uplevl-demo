// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { env } from "@/env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  environment: env.NEXT_PUBLIC_NODE_ENV,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: env.NEXT_PUBLIC_NODE_ENV === "production" ? 1 : 0,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: env.NEXT_PUBLIC_NODE_ENV === "production" ? 0.1 : 1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: env.NEXT_PUBLIC_NODE_ENV === "production" ? 1.0 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Initialize PostHog
posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: "/ingest",
  ui_host: env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2025-05-24",
  capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
  debug: env.NEXT_PUBLIC_NODE_ENV === "development",
});
