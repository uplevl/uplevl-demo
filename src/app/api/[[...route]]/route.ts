import { handle } from "hono/vercel";
import { env } from "@/env";

import app from "@/server/app";

const IS_DEV = env.NODE_ENV === "development";

export const runtime = IS_DEV ? "nodejs" : "edge";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
