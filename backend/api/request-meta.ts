import type { IncomingMessage } from "node:http";
import type { AuthMode, DeviceProfile, DeviceType, Mode, PrivatePersonaKind } from "../../shared/contracts/index";
import { DEVICE_TYPES, MODES } from "../../shared/contracts/index";
import { HttpError } from "./http-error";

export interface RequestMeta {
  authMode: AuthMode;
  mode: Mode;
  deviceType: DeviceType;
  deviceId?: string;
  privatePersona?: PrivatePersonaKind;
  explicitLocalSave: boolean;
  authenticated: boolean;
  identitySource: "headers" | "device_token";
}

export interface ResolvedRequestIdentity {
  authMode: AuthMode;
  device?: DeviceProfile;
  authenticated: boolean;
  identitySource: "headers" | "device_token";
}

export function getRequestMeta(
  request: IncomingMessage,
  resolvedIdentity?: ResolvedRequestIdentity,
): RequestMeta {
  const modeHeader = request.headers["x-gail-mode"];
  const mode = normalizeMode(modeHeader);
  const deviceTypeHeader = request.headers["x-gail-device-type"];
  const deviceType = resolvedIdentity?.device?.type ?? normalizeDeviceType(deviceTypeHeader);
  const explicitLocalSave = request.headers["x-gail-explicit-local-save"] === "true";
  const deviceIdHeader = request.headers["x-gail-device-id"];
  const privatePersonaHeader = request.headers["x-gail-private-persona"];
  const deviceId = resolvedIdentity?.device?.id
    ?? (typeof deviceIdHeader === "string" ? deviceIdHeader : undefined);

  return {
    authMode: resolvedIdentity?.authMode ?? "open",
    mode,
    deviceType,
    explicitLocalSave,
    deviceId,
    privatePersona: normalizePrivatePersona(privatePersonaHeader),
    authenticated: resolvedIdentity?.authenticated ?? false,
    identitySource: resolvedIdentity?.identitySource ?? "headers",
  };
}

function normalizeMode(header: string | string[] | undefined): Mode {
  if (header === undefined) {
    return "work";
  }

  const value = Array.isArray(header) ? header[0] : header;
  if (MODES.includes(value as Mode)) {
    return value as Mode;
  }

  throw new HttpError(400, `Unsupported x-gail-mode header: ${value}`);
}

function normalizeDeviceType(header: string | string[] | undefined): DeviceType {
  if (header === undefined) {
    return "uconsole";
  }

  const value = Array.isArray(header) ? header[0] : header;
  if (DEVICE_TYPES.includes(value as DeviceType)) {
    return value as DeviceType;
  }

  throw new HttpError(400, `Unsupported x-gail-device-type header: ${value}`);
}

function normalizePrivatePersona(header: string | string[] | undefined): PrivatePersonaKind | undefined {
  if (header === undefined) {
    return undefined;
  }

  const value = Array.isArray(header) ? header[0] : header;
  if (value === "normal" || value === "private_counselor" || value === "private_girlfriend" || value === "private_hangout") {
    return value;
  }

  throw new HttpError(400, `Unsupported x-gail-private-persona header: ${value}`);
}
