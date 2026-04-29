import type {
  CreateApprovalRequestInput,
  ResolveApprovalRequestInput,
} from "../../shared/contracts/index";
import { HttpError } from "./http-error";

export function validateCreateApprovalRequestInput(body: unknown): CreateApprovalRequestInput {
  const record = asRecord(body);
  return {
    actionType: requireString(record, "actionType"),
    reason: requireString(record, "reason"),
    requestedByDeviceId: requireString(record, "requestedByDeviceId"),
    expiresAt: optionalString(record, "expiresAt"),
  };
}

export function validateResolveApprovalRequestInput(body: unknown): ResolveApprovalRequestInput {
  const record = asRecord(body);
  const status = requireString(record, "status");
  if (status !== "approved" && status !== "rejected") {
    throw new HttpError(400, "status must be approved or rejected.");
  }

  return {
    approvedByDeviceId: requireString(record, "approvedByDeviceId"),
    status,
  };
}

function asRecord(body: unknown): Record<string, unknown> {
  if (body === undefined || body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }

  return body as Record<string, unknown>;
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `${key} must be a non-empty string.`);
  }

  return value;
}

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `${key} must be a string.`);
  }

  return value;
}
