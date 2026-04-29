import type { RequestMeta } from "./request-meta";
import { HttpError } from "./http-error";

export function requirePrivateMode(meta: RequestMeta): void {
  if (meta.mode !== "private") {
    throw new HttpError(403, "This endpoint is only available while x-gail-mode: private is active.");
  }
}
