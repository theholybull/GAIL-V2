import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DeviceDisplayProfiles, UpdateDeviceDisplayProfilesInput } from "../../shared/contracts/index";

const DEFAULT_PROFILES: DeviceDisplayProfiles = {
  selectedDeviceId: "laptop",
  profiles: [
    {
      id: "phone",
      label: "Phone",
      display: { width: 1080, height: 1920, renderScale: 1, aspectRatio: "9:16", safeFrame: 0.92 },
      mesh: { bodyQuality: "medium", clothingQuality: "medium", hairQuality: "medium", animationLod: "medium" },
      staging: {
        sceneId: "studio_soft",
        avatarTransform: { position: [0, 0, 0], rotation: [0, 180, 0], scale: [1, 1, 1] },
        cameraTransform: { position: [0, 1.4, 2.4], target: [0, 1.25, 0] },
      },
    },
    {
      id: "shop_kiosk",
      label: "Shop Kiosk",
      display: { width: 1920, height: 1080, renderScale: 1, aspectRatio: "16:9", safeFrame: 0.94 },
      mesh: { bodyQuality: "high", clothingQuality: "high", hairQuality: "high", animationLod: "high" },
      staging: {
        sceneId: "kiosk_clean",
        avatarTransform: { position: [0, 0, 0], rotation: [0, 180, 0], scale: [1, 1, 1] },
        cameraTransform: { position: [0, 1.45, 2.8], target: [0, 1.25, 0] },
      },
    },
    {
      id: "laptop",
      label: "Laptop",
      display: { width: 1920, height: 1200, renderScale: 1, aspectRatio: "16:10", safeFrame: 0.95 },
      mesh: { bodyQuality: "high", clothingQuality: "high", hairQuality: "medium", animationLod: "high" },
      staging: {
        sceneId: "studio_default",
        avatarTransform: { position: [0, 0, 0], rotation: [0, 180, 0], scale: [1, 1, 1] },
        cameraTransform: { position: [0, 1.4, 2.6], target: [0, 1.2, 0] },
      },
    },
    {
      id: "watch",
      label: "Watch",
      display: { width: 390, height: 390, renderScale: 1, aspectRatio: "1:1", safeFrame: 0.88 },
      mesh: { bodyQuality: "low", clothingQuality: "low", hairQuality: "low", animationLod: "low" },
      staging: {
        sceneId: "minimal_ui",
        avatarTransform: { position: [0, 0, 0], rotation: [0, 180, 0], scale: [0.92, 0.92, 0.92] },
        cameraTransform: { position: [0, 1.35, 2.2], target: [0, 1.18, 0] },
      },
    },
  ],
};

export class DeviceDisplayProfileService {
  private readonly profilesPath: string;

  constructor(
    profilesPath = process.env.GAIL_DEVICE_DISPLAY_PROFILES_PATH ?? resolve(process.cwd(), "..", "data", "client", "device-display-profiles.json"),
  ) {
    this.profilesPath = profilesPath;
  }

  getProfiles(): DeviceDisplayProfiles {
    return this.readProfiles();
  }

  updateProfiles(input: UpdateDeviceDisplayProfilesInput): DeviceDisplayProfiles {
    const current = this.readProfiles();
    const nextProfiles = Array.isArray(input.profiles) && input.profiles.length > 0
      ? input.profiles
      : current.profiles;
    const selectedDeviceId = input.selectedDeviceId && input.selectedDeviceId.trim().length > 0
      ? input.selectedDeviceId.trim()
      : current.selectedDeviceId;
    const normalized = this.normalize({
      selectedDeviceId,
      profiles: nextProfiles,
    });
    this.writeProfiles(normalized);
    return normalized;
  }

  private readProfiles(): DeviceDisplayProfiles {
    if (!existsSync(this.profilesPath)) {
      this.writeProfiles(DEFAULT_PROFILES);
      return DEFAULT_PROFILES;
    }
    const raw = readFileSync(this.profilesPath, "utf8").trim();
    if (!raw) {
      this.writeProfiles(DEFAULT_PROFILES);
      return DEFAULT_PROFILES;
    }
    const parsed = JSON.parse(raw) as Partial<DeviceDisplayProfiles>;
    return this.normalize({
      selectedDeviceId: parsed.selectedDeviceId,
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : undefined,
    });
  }

  private writeProfiles(data: DeviceDisplayProfiles): void {
    mkdirSync(dirname(this.profilesPath), { recursive: true });
    writeFileSync(this.profilesPath, JSON.stringify(data, null, 2));
  }

  private normalize(data: Partial<DeviceDisplayProfiles>): DeviceDisplayProfiles {
    const profiles = Array.isArray(data.profiles) && data.profiles.length > 0
      ? data.profiles
      : DEFAULT_PROFILES.profiles;
    const profileIds = new Set(profiles.map((entry) => entry.id));
    const selected = data.selectedDeviceId && profileIds.has(data.selectedDeviceId)
      ? data.selectedDeviceId
      : profiles[0]?.id ?? DEFAULT_PROFILES.selectedDeviceId;
    return {
      selectedDeviceId: selected,
      profiles,
    };
  }
}

