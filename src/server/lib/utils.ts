import Crypto from "node:crypto";

export async function fetchImage(url: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const filename = Crypto.createHash("md5").update(url).digest("hex");
  const file = new File([buffer], `${filename}.jpg`, {
    type: response.headers.get("content-type") ?? "image/jpeg",
  });
  return file;
}
