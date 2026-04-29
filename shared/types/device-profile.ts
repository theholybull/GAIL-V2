import type { DeviceType } from "../enums/device";
import type { Mode } from "../enums/mode";
import type { QualityTier } from "../enums/quality-tier";

export interface DeviceProfile {
  id: string;
  type: DeviceType;
  name: string;
  defaultMode: Mode;
  qualityTier: QualityTier;
  trusted: boolean;
  isPaired?: boolean;
  pairedAt?: string;
  lastSeenAt?: string;
  lastSeenAddress?: string;
  sensitiveActionsUnlockedUntil?: string;
  supportsCamera: boolean;
  supportsWatchApproval: boolean;
  supportsRichAvatar: boolean;
}
