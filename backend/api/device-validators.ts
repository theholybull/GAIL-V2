import type {
  RegisterDeviceInput,
  UpdateDeviceSensitiveAccessInput,
  UpdateDeviceTrustInput,
} from "../../shared/contracts/index";
import {
  DEVICE_TYPES,
  MODES,
  QUALITY_TIERS,
} from "../../shared/contracts/index";
import { HttpError } from "./http-error";

export function validateRegisterDeviceInput(body: unknown): RegisterDeviceInput {
  const record = asRecord(body);
  const type = requireString(record, "type");
  const defaultMode = requireString(record, "defaultMode");
  const qualityTier = requireString(record, "qualityTier");

  assertIn(type, DEVICE_TYPES, "type");
  assertIn(defaultMode, MODES, "defaultMode");
  assertIn(qualityTier, QUALITY_TIERS, "qualityTier");

  return {
    id: requireString(record, "id"),
    type: type as RegisterDeviceInput["type"],
    name: requireString(record, "name"),
    defaultMode: defaultMode as RegisterDeviceInput["defaultMode"],
    qualityTier: qualityTier as RegisterDeviceInput["qualityTier"],
    trusted: optionalBoolean(record, "trusted"),
    supportsCamera: optionalBoolean(record, "supportsCamera"),
    supportsWatchApproval: optionalBoolean(record, "supportsWatchApproval"),
    supportsRichAvatar: optionalBoolean(record, "supportsRichAvatar"),
  };
}

export function validateUpdateDeviceTrustInput(body: unknown): UpdateDeviceTrustInput {
  const record = asRecord(body);
  const trusted = optionalBoolean(record, "trusted");
  if (trusted === undefined) {
    throw new HttpError(400, "trusted must be provided.");
  }

  return { trusted };
}

export function validateUpdateDeviceSensitiveAccessInput(
  body: unknown,
): UpdateDeviceSensitiveAccessInput {
  const record = asRecord(body);
  const unlockForMinutes = optionalNumber(record, "unlockForMinutes");
  const unlockUntil = optionalString(record, "unlockUntil");
  const clear = optionalBoolean(record, "clear");

  if (unlockForMinutes === undefined && unlockUntil === undefined && clear !== true) {
    throw new HttpError(400, "Provide unlockForMinutes, unlockUntil, or clear=true.");
  }

  if (unlockForMinutes !== undefined && unlockForMinutes <= 0) {
    throw new HttpError(400, "unlockForMinutes must be greater than zero.");
  }

  return {
    unlockForMinutes,
    unlockUntil,
    clear,
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

function optionalBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new HttpError(400, `${key} must be a boolean.`);
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

function optionalNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpError(400, `${key} must be a finite number.`);
  }

  return value;
}

function assertIn(value: string, allowed: readonly string[], key: string): void {
  if (!allowed.includes(value)) {
    throw new HttpError(400, `${key} must be one of: ${allowed.join(", ")}.`);
  }
}
