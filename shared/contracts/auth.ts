import type { DeviceProfile } from "../types/device-profile";

export const AUTH_MODES = [
  "open",
  "paired",
  "paired_required_for_sensitive",
] as const;

export type AuthMode = typeof AUTH_MODES[number];

export interface PairingSession {
  id: string;
  pairingCode: string;
  requestedByAddress: string;
  status: "pending" | "completed" | "expired";
  expiresAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCredential {
  id: string;
  deviceId: string;
  label: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface AuthStatus {
  authMode: AuthMode;
  pairingRequired: boolean;
  pairingRequiredForSensitive: boolean;
}

export interface CompletePairingInput {
  pairingCode: string;
  id: string;
  type: "uconsole" | "kiosk" | "iphone" | "watch" | "web_admin" | "service";
  name: string;
  defaultMode: "work" | "home_shop" | "private" | "lightweight" | "focus";
  qualityTier: "low" | "medium" | "high";
  trusted?: boolean;
  supportsCamera?: boolean;
  supportsWatchApproval?: boolean;
  supportsRichAvatar?: boolean;
  credentialLabel?: string;
}

export interface CompletePairingResult {
  device: DeviceProfile;
  credential: DeviceCredential;
  authToken: string;
}
