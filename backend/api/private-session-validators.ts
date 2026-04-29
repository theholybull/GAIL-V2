import type { CreatePrivateSessionNoteInput } from "../../shared/contracts/index";
import { HttpError } from "./http-error";

export function validateCreatePrivateSessionNoteInput(body: unknown): CreatePrivateSessionNoteInput {
  if (body === undefined || body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }

  const record = body as Record<string, unknown>;

  if (typeof record.body !== "string" || record.body.trim().length === 0) {
    throw new HttpError(400, "body must be a non-empty string.");
  }

  if (record.title !== undefined && typeof record.title !== "string") {
    throw new HttpError(400, "title must be a string.");
  }

  return {
    body: record.body,
    title: typeof record.title === "string" ? record.title : undefined,
  };
}
