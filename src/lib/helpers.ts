import "server-only";
import Crypto from "node:crypto";
import { sanitizeUrl } from "@/lib/utils";

// Default timeout for fetch operations (30 seconds)
const DEFAULT_FETCH_TIMEOUT_MS = 30000;

export async function fetchImage(
  url: string,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<{ file: File; url: string }> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    // Set up timeout
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const sanitizedUrl = sanitizeUrl(url);
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText} for ${sanitizedUrl}`);
    }

    const buffer = await response.arrayBuffer();
    const filename = Crypto.createHash("md5").update(url).digest("hex");
    const file = new File([buffer], `${filename}.jpg`, {
      type: response.headers.get("content-type") ?? "image/jpeg",
    });
    return { file, url };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const sanitizedUrl = sanitizeUrl(url);
      throw new Error(`Fetch timeout after ${timeoutMs}ms for image: ${sanitizedUrl}`);
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function fetchVideo(url: string, timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS): Promise<File> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    // Set up timeout
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const sanitizedUrl = sanitizeUrl(url);
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText} for ${sanitizedUrl}`);
    }

    const buffer = await response.arrayBuffer();
    const filename = Crypto.createHash("md5").update(url).digest("hex");
    const file = new File([buffer], `${filename}.mp4`, {
      type: response.headers.get("content-type") ?? "video/mp4",
    });
    return file;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const sanitizedUrl = sanitizeUrl(url);
      throw new Error(`Fetch timeout after ${timeoutMs}ms for video: ${sanitizedUrl}`);
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
