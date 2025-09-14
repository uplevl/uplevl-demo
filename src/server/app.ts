import { Hono } from "hono";
import { compress } from "hono/compress";
import { logger } from "hono/logger";

import { inngestRoute } from "@/server/routes/inngest.route";
import { jobRoute } from "@/server/routes/job.route";
import { postRoute } from "@/server/routes/post.route";

const app = new Hono()
  // Middleware
  .use(compress())
  .use(logger())
  // Routes
  .basePath("/api");

const routes = app
  .get("/healthcheck", (c) => c.json({ error: null, data: "OK" }))
  .route("/posts", postRoute)
  .route("/inngest", inngestRoute)
  .route("/jobs", jobRoute);

export type AppType = typeof routes;

export default app;
