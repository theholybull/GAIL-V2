import type { Mode, QualityTier } from "../../../shared/contracts/index";

const CLIENT_PREFERENCES_STORAGE_KEY = "gail.work-lite.client-preferences.v9";

export interface WorkLiteClientState {
  sceneRole: "work-lite";
  qualityTier: QualityTier;
  bodyQualityTier: QualityTier;
  clothingQualityTier: QualityTier;
  hairQualityTier: QualityTier;
  mode: Mode;
  deviceLabel: string;
  assetRootMode: "server" | "custom";
  assetRoot?: string;
  lastServerAvatarSystem?: "legacy_fallback" | "handoff_20260330" | "gail_primary";
  lastViewportBundleSignature?: string;
  mouthMotionGain: number;
  matteStrength: number;
  blinkAmount: number;
  blinkRate: number;
  blinkTravel: number;
  visemeSmoothing: number;
  autoApplyAdjustments: boolean;
  controlsVisible: boolean;
  conversationSessionIds: Partial<Record<Mode, string>>;
  avatarState: "placeholder" | "ready";
  status: "booting" | "ready";
  viewport: {
    modelX: number;
    modelY: number;
    modelZ: number;
    modelYaw: number;
    modelPitch: number;
    modelRoll: number;
    modelScaleMultiplier: number;
    cameraX: number;
    cameraY: number;
    cameraZ: number;
    targetX: number;
    targetY: number;
    targetZ: number;
  };
}

type PersistedClientPreferences = Pick<WorkLiteClientState, "qualityTier" | "bodyQualityTier" | "clothingQualityTier" | "hairQualityTier" | "mode" | "deviceLabel" | "assetRootMode" | "assetRoot" | "lastServerAvatarSystem" | "lastViewportBundleSignature" | "mouthMotionGain" | "matteStrength" | "blinkAmount" | "blinkRate" | "blinkTravel" | "visemeSmoothing" | "autoApplyAdjustments" | "controlsVisible" | "conversationSessionIds" | "viewport">;

export const defaultViewportState: WorkLiteClientState["viewport"] = {
  // Exact values from avatar_stage PlayCanvas scene: Camera + Render entities.
  modelX: 0,
  modelY: -0.01323,
  modelZ: 0,
  modelYaw: 0,
  modelPitch: -0.02198,
  modelRoll: 0,
  modelScaleMultiplier: 1,
  cameraX: 0,
  cameraY: 1.2,
  cameraZ: 3,
  targetX: 0,
  targetY: 0.9902,
  targetZ: 0,
};

const defaultAppState: WorkLiteClientState = {
  sceneRole: "work-lite",
  qualityTier: "low",
  bodyQualityTier: "low",
  clothingQualityTier: "low",
  hairQualityTier: "low",
  mode: "work",
  deviceLabel: "uConsole / Work Terminal",
  assetRootMode: "server",
  assetRoot: undefined,
  mouthMotionGain: 2,
  matteStrength: 0.5,
  blinkAmount: 0.85,
  blinkRate: 1,
  blinkTravel: 1,
  visemeSmoothing: 1,
  autoApplyAdjustments: false,
  controlsVisible: false,
  conversationSessionIds: {},
  avatarState: "placeholder",
  status: "booting",
  viewport: { ...defaultViewportState },
};

function getBrowserStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function loadPersistedClientPreferences(): Partial<PersistedClientPreferences> {
  const storage = getBrowserStorage();
  if (!storage) {
    return {};
  }

  try {
    const raw = storage.getItem(CLIENT_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Partial<PersistedClientPreferences>;
    return {
      qualityTier: parsed.qualityTier,
      bodyQualityTier: parsed.bodyQualityTier,
      clothingQualityTier: parsed.clothingQualityTier,
      hairQualityTier: parsed.hairQualityTier,
      mode: parsed.mode,
      deviceLabel: typeof parsed.deviceLabel === "string" ? parsed.deviceLabel : undefined,
      assetRootMode: parsed.assetRootMode === "custom" ? "custom" : parsed.assetRoot ? "custom" : "server",
      assetRoot: typeof parsed.assetRoot === "string" ? parsed.assetRoot : undefined,
      lastServerAvatarSystem: parsed.lastServerAvatarSystem === "legacy_fallback" || parsed.lastServerAvatarSystem === "handoff_20260330" || parsed.lastServerAvatarSystem === "gail_primary"
        ? parsed.lastServerAvatarSystem
        : undefined,
      lastViewportBundleSignature: typeof parsed.lastViewportBundleSignature === "string" ? parsed.lastViewportBundleSignature : undefined,
      mouthMotionGain: typeof parsed.mouthMotionGain === "number" ? parsed.mouthMotionGain : undefined,
      matteStrength: typeof parsed.matteStrength === "number" ? parsed.matteStrength : undefined,
      blinkAmount: typeof parsed.blinkAmount === "number" ? parsed.blinkAmount : undefined,
      blinkRate: typeof parsed.blinkRate === "number" ? parsed.blinkRate : undefined,
      blinkTravel: typeof parsed.blinkTravel === "number" ? parsed.blinkTravel : undefined,
      visemeSmoothing: typeof parsed.visemeSmoothing === "number" ? parsed.visemeSmoothing : undefined,
      autoApplyAdjustments: typeof parsed.autoApplyAdjustments === "boolean" ? parsed.autoApplyAdjustments : undefined,
      controlsVisible: typeof parsed.controlsVisible === "boolean" ? parsed.controlsVisible : undefined,
      conversationSessionIds: parsed.conversationSessionIds && typeof parsed.conversationSessionIds === "object"
        ? parsed.conversationSessionIds
        : undefined,
      viewport: parsed.viewport && typeof parsed.viewport === "object"
        ? {
            ...defaultViewportState,
            ...parsed.viewport,
          }
        : undefined,
    };
  } catch {
    return {};
  }
}

export function persistClientPreferences(state: WorkLiteClientState): void {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  const persisted: PersistedClientPreferences = {
    qualityTier: state.qualityTier,
    bodyQualityTier: state.bodyQualityTier,
    clothingQualityTier: state.clothingQualityTier,
    hairQualityTier: state.hairQualityTier,
    mode: state.mode,
    deviceLabel: state.deviceLabel,
    assetRootMode: state.assetRootMode,
    assetRoot: state.assetRoot,
    lastServerAvatarSystem: state.lastServerAvatarSystem,
    lastViewportBundleSignature: state.lastViewportBundleSignature,
    mouthMotionGain: state.mouthMotionGain,
    matteStrength: state.matteStrength,
    blinkAmount: state.blinkAmount,
    blinkRate: state.blinkRate,
    blinkTravel: state.blinkTravel,
    visemeSmoothing: state.visemeSmoothing,
    autoApplyAdjustments: state.autoApplyAdjustments,
    controlsVisible: state.controlsVisible,
    conversationSessionIds: { ...state.conversationSessionIds },
    viewport: { ...state.viewport },
  };

  try {
    storage.setItem(CLIENT_PREFERENCES_STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    // Ignore storage failures and keep runtime state alive.
  }
}

const persistedClientPreferences = loadPersistedClientPreferences();

export const appState: WorkLiteClientState = {
  ...defaultAppState,
  qualityTier: persistedClientPreferences.qualityTier ?? defaultAppState.qualityTier,
  bodyQualityTier: persistedClientPreferences.bodyQualityTier ?? persistedClientPreferences.qualityTier ?? defaultAppState.bodyQualityTier,
  clothingQualityTier: persistedClientPreferences.clothingQualityTier ?? persistedClientPreferences.qualityTier ?? defaultAppState.clothingQualityTier,
  hairQualityTier: persistedClientPreferences.hairQualityTier ?? persistedClientPreferences.qualityTier ?? defaultAppState.hairQualityTier,
  mode: persistedClientPreferences.mode ?? defaultAppState.mode,
  deviceLabel: persistedClientPreferences.deviceLabel ?? defaultAppState.deviceLabel,
  assetRootMode: persistedClientPreferences.assetRootMode ?? defaultAppState.assetRootMode,
  assetRoot: persistedClientPreferences.assetRoot ?? defaultAppState.assetRoot,
  lastServerAvatarSystem: persistedClientPreferences.lastServerAvatarSystem,
  lastViewportBundleSignature: persistedClientPreferences.lastViewportBundleSignature,
  mouthMotionGain: persistedClientPreferences.mouthMotionGain ?? defaultAppState.mouthMotionGain,
  matteStrength: persistedClientPreferences.matteStrength ?? defaultAppState.matteStrength,
  blinkAmount: persistedClientPreferences.blinkAmount ?? defaultAppState.blinkAmount,
  blinkRate: persistedClientPreferences.blinkRate ?? defaultAppState.blinkRate,
  blinkTravel: persistedClientPreferences.blinkTravel ?? defaultAppState.blinkTravel,
  visemeSmoothing: persistedClientPreferences.visemeSmoothing ?? defaultAppState.visemeSmoothing,
  autoApplyAdjustments: persistedClientPreferences.autoApplyAdjustments ?? defaultAppState.autoApplyAdjustments,
  controlsVisible: persistedClientPreferences.controlsVisible ?? defaultAppState.controlsVisible,
  conversationSessionIds: {
    ...defaultAppState.conversationSessionIds,
    ...persistedClientPreferences.conversationSessionIds,
  },
  viewport: {
    ...defaultViewportState,
    ...persistedClientPreferences.viewport,
  },
};

