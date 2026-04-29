import { createHash, randomBytes, randomInt } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type {
  AuthMode,
  AuthStatus,
  CompletePairingInput,
  CompletePairingResult,
  DeviceProfile,
  PairingSession,
} from "../../shared/contracts/index";
import { AUTH_MODES } from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type {
  DeviceCredentialStore,
  DeviceStore,
  PairingSessionStore,
} from "../db";
import {
  SqliteDeviceCredentialRepository,
  SqliteDeviceRepository,
  SqlitePairingSessionRepository,
} from "../db";
import { HttpError } from "../api/http-error";
import { DeviceService } from "./device-service";

interface AuthenticatedDeviceIdentity {
  device: DeviceProfile;
  authenticated: boolean;
  identitySource: "device_token";
}

export class AuthService {
  private readonly authMode: AuthMode;

  constructor(
    private readonly devices: DeviceStore = new SqliteDeviceRepository(),
    private readonly pairingSessions: PairingSessionStore = new SqlitePairingSessionRepository(),
    private readonly credentials: DeviceCredentialStore = new SqliteDeviceCredentialRepository(),
    private readonly deviceService = new DeviceService(devices),
  ) {
    const requestedMode = process.env.GAIL_AUTH_MODE?.trim() as AuthMode | undefined;
    this.authMode = requestedMode && AUTH_MODES.includes(requestedMode)
      ? requestedMode
      : "open";
  }

  getStatus(): AuthStatus {
    return {
      authMode: this.authMode,
      pairingRequired: this.authMode !== "open",
      pairingRequiredForSensitive: this.authMode === "paired_required_for_sensitive",
    };
  }

  createPairingSession(request: IncomingMessage): PairingSession {
    const address = getRequestAddress(request);
    ensurePairingAddressAllowed(address);
    this.expirePendingSessions();

    const now = new Date().toISOString();
    const session: PairingSession = {
      id: createScaffoldId("pairing_session"),
      pairingCode: String(randomInt(100000, 1000000)),
      requestedByAddress: address,
      status: "pending",
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    return this.pairingSessions.create(session);
  }

  completePairing(
    request: IncomingMessage,
    sessionId: string,
    input: CompletePairingInput,
  ): CompletePairingResult {
    const address = getRequestAddress(request);
    ensurePairingAddressAllowed(address);
    this.expirePendingSessions();

    const session = this.pairingSessions.getById(sessionId);
    if (!session) {
      throw new HttpError(404, `Pairing session ${sessionId} not found.`);
    }

    if (session.status !== "pending") {
      throw new HttpError(409, `Pairing session ${sessionId} is no longer pending.`);
    }

    if (session.expiresAt <= new Date().toISOString()) {
      const expired = this.pairingSessions.update({
        ...session,
        status: "expired",
        updatedAt: new Date().toISOString(),
      });
      throw new HttpError(410, `Pairing session ${expired.id} has expired.`);
    }

    if (session.pairingCode !== input.pairingCode.trim()) {
      throw new HttpError(403, "Pairing code did not match.");
    }

    const now = new Date().toISOString();
    const device = this.deviceService.registerPaired(input, {
      pairedAt: now,
      lastSeenAt: now,
      lastSeenAddress: address,
    });

    const rawToken = randomBytes(32).toString("hex");
    const credentialRecord = {
      id: createScaffoldId("device_credential"),
      deviceId: device.id,
      label: input.credentialLabel?.trim() || `${device.name} primary credential`,
      tokenHash: hashToken(rawToken),
      createdAt: now,
      lastUsedAt: now,
    };
    const credential = this.credentials.create(credentialRecord);
    this.pairingSessions.update({
      ...session,
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    return {
      device,
      credential,
      authToken: rawToken,
    };
  }

  resolveAuthenticatedDevice(request: IncomingMessage): AuthenticatedDeviceIdentity | undefined {
    const token = getDeviceToken(request);
    if (!token) {
      if (this.authMode === "open") {
        return undefined;
      }

      throw new HttpError(401, "A paired device token is required for this server.");
    }

    const credential = this.credentials.getByTokenHash(hashToken(token));
    if (!credential) {
      throw new HttpError(401, "Device token is invalid.");
    }

    const device = this.devices.getById(credential.deviceId);
    if (!device) {
      throw new HttpError(401, "Paired device no longer exists.");
    }

    const now = new Date().toISOString();
    const address = getRequestAddress(request);
    this.credentials.touchLastUsed(credential.id, now);
    this.deviceService.touchSeen(device.id, address);

    return {
      device,
      authenticated: true,
      identitySource: "device_token",
    };
  }

  private expirePendingSessions(): void {
    this.pairingSessions.expirePending(new Date().toISOString());
  }
}

function getDeviceToken(request: IncomingMessage): string | undefined {
  const authorization = request.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (token.length > 0) {
      return token;
    }
  }

  const headerToken = request.headers["x-gail-device-token"];
  return typeof headerToken === "string" && headerToken.trim().length > 0
    ? headerToken.trim()
    : undefined;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getRequestAddress(request: IncomingMessage): string {
  return request.socket.remoteAddress ?? "unknown";
}

function ensurePairingAddressAllowed(address: string): void {
  if (
    address === "127.0.0.1" ||
    address === "::1" ||
    address.startsWith("::ffff:127.") ||
    address.startsWith("10.") ||
    address.startsWith("192.168.") ||
    address.startsWith("172.16.") ||
    address.startsWith("172.17.") ||
    address.startsWith("172.18.") ||
    address.startsWith("172.19.") ||
    address.startsWith("172.2") ||
    address.startsWith("172.30.") ||
    address.startsWith("172.31.") ||
    address.startsWith("::ffff:10.") ||
    address.startsWith("::ffff:192.168.") ||
    address.startsWith("::ffff:172.")
  ) {
    return;
  }

  throw new HttpError(403, "Pairing is only allowed from localhost or a private LAN address.");
}
