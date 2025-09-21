import "server-only";
import Crypto from "node:crypto";

export async function fetchImage(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText} for ${url}`);
  }

  const buffer = await response.arrayBuffer();
  const filename = Crypto.createHash("md5").update(url).digest("hex");
  const file = new File([buffer], `${filename}.jpg`, {
    type: response.headers.get("content-type") ?? "image/jpeg",
  });
  return { file, url };
}

export async function fetchVideo(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.status} ${response.statusText} for ${url}`);
  }

  const buffer = await response.arrayBuffer();
  const filename = Crypto.createHash("md5").update(url).digest("hex");
  const file = new File([buffer], `${filename}.mp4`, {
    type: response.headers.get("content-type") ?? "video/mp4",
  });
  return file;
}
