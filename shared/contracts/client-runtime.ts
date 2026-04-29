export type AvatarRuntimeSystem = "legacy_fallback" | "handoff_20260330" | "gail_primary";
export type DisplayInputMode = "wake_word" | "always_listening" | "typed";

export interface AvatarRuntimeSystemOption {
  key: AvatarRuntimeSystem;
  label: string;
  assetRoot?: string;
  description: string;
}

export interface ClientRuntimeSettings {
  activeAvatarSystem: AvatarRuntimeSystem;
  activeAssetRoot?: string;
  availableAvatarSystems: AvatarRuntimeSystemOption[];
  displayInputMode?: DisplayInputMode;
  bodyMorphControls?: {
    enabledDuringMotion?: boolean;
    overrides?: Record<string, number>;
  };
}

export interface DeviceDisplayResolution {
  width: number;
  height: number;
  renderScale: number;
  aspectRatio: string;
  safeFrame: number;
}

export interface DeviceDisplayMeshProfile {
  bodyQuality: "low" | "medium" | "high";
  clothingQuality: "low" | "medium" | "high";
  hairQuality: "low" | "medium" | "high";
  animationLod: "low" | "medium" | "high";
}

export interface DeviceDisplayTransform {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  target?: [number, number, number];
}

export interface DeviceDisplayStageProfile {
  sceneId: string;
  avatarTransform: DeviceDisplayTransform;
  cameraTransform: DeviceDisplayTransform;
}

export interface DeviceDisplayProfile {
  id: string;
  label: string;
  display: DeviceDisplayResolution;
  mesh: DeviceDisplayMeshProfile;
  staging: DeviceDisplayStageProfile;
}

export interface DeviceDisplayProfiles {
  selectedDeviceId: string;
  profiles: DeviceDisplayProfile[];
}
