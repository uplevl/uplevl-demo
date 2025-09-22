import "server-only";
import Crypto from "node:crypto";
import { sanitizeUrl } from "@/lib/utils";

export async function fetchImage(url: string): Promise<{ file: File; url: string }> {
  const response = await fetch(url);

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
}

export async function fetchVideo(url: string): Promise<File> {
  const response = await fetch(url);

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
}
