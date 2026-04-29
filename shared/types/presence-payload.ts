import type { DeviceType } from "../enums/device";
import type { Mode } from "../enums/mode";
import type { QualityTier } from "../enums/quality-tier";

export interface PresencePayload {
  deviceId: string;
  deviceType: DeviceType;
  mode: Mode;
  qualityTier: QualityTier;
  watchPresent: boolean;
  motionDetected: boolean;
  manualWake: boolean;
  themeKey: string;
  timestamp: string;
}
