import type {
  DeviceProfile,
  RegisterDeviceInput,
  UpdateDeviceSensitiveAccessInput,
  UpdateDeviceTrustInput,
} from "../../shared/contracts/index";
import type { DeviceStore } from "../db";
import { SqliteDeviceRepository } from "../db";

export class DeviceService {
  constructor(private readonly devices: DeviceStore = new SqliteDeviceRepository()) {}

  list(): DeviceProfile[] {
    return this.devices.list();
  }

  getById(id: string): DeviceProfile | undefined {
    return this.devices.getById(id);
  }

  register(input: RegisterDeviceInput): DeviceProfile {
    return this.devices.upsert(this.buildProfile(input));
  }

  registerPaired(
    input: RegisterDeviceInput,
    context: {
      pairedAt: string;
      lastSeenAt: string;
      lastSeenAddress?: string;
    },
  ): DeviceProfile {
    return this.devices.upsert(this.buildProfile(input, {
      trusted: input.trusted ?? true,
      isPaired: true,
      pairedAt: context.pairedAt,
      lastSeenAt: context.lastSeenAt,
      lastSeenAddress: context.lastSeenAddress,
    }));
  }

  touchSeen(id: string, lastSeenAddress?: string): DeviceProfile | undefined {
    return this.devices.touchSeen(id, new Date().toISOString(), lastSeenAddress);
  }

  private buildProfile(
    input: RegisterDeviceInput,
    overrides?: Partial<DeviceProfile>,
  ): DeviceProfile {
    return {
      id: input.id,
      type: input.type,
      name: input.name,
      defaultMode: input.defaultMode,
      qualityTier: input.qualityTier,
      trusted: input.trusted ?? false,
      sensitiveActionsUnlockedUntil: undefined,
      supportsCamera: input.supportsCamera ?? false,
      supportsWatchApproval: input.supportsWatchApproval ?? false,
      supportsRichAvatar: input.supportsRichAvatar ?? false,
      ...overrides,
    };
  }

  updateTrust(id: string, input: UpdateDeviceTrustInput): DeviceProfile | undefined {
    return this.devices.updateTrust(id, input.trusted);
  }

  updateSensitiveAccess(
    id: string,
    input: UpdateDeviceSensitiveAccessInput,
  ): DeviceProfile | undefined {
    if (input.clear) {
      return this.devices.updateSensitiveAccess(id, undefined);
    }

    const unlockUntil = input.unlockUntil
      ?? (input.unlockForMinutes !== undefined
        ? new Date(Date.now() + input.unlockForMinutes * 60_000).toISOString()
        : undefined);

    return this.devices.updateSensitiveAccess(id, unlockUntil);
  }
}
