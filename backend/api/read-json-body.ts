import type { IncomingMessage } from "node:http";
import { HttpError } from "./http-error";

const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalSize = 0;

  for await (const chunk of request) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalSize += buf.length;
    if (totalSize > MAX_BODY_BYTES) {
      throw new HttpError(413, `Request body exceeds ${MAX_BODY_BYTES} bytes.`);
    }
    chunks.push(buf);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (rawBody.length === 0) {
    return undefined;
  }

  return JSON.parse(rawBody);
}
