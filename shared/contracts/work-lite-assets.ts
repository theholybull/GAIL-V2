export type WorkLiteAssetKind =
  | "avatar"
  | "hair"
  | "clothing"
  | "accessory"
  | "animation"
  | "background"
  | "texture";

export interface WorkLiteAssetStatus {
  id: string;
  name: string;
  kind: WorkLiteAssetKind;
  slot?: string;
  autoLoad?: boolean;
  expectedPath: string;
  present: boolean;
  required?: boolean;
  resolvedPath?: string;
  fileSizeBytes?: number;
  loadRisk?: "normal" | "large" | "oversized";
}

export interface WorkLiteAssetManifest {
  avatarReady: boolean;
  backgroundThemes: string[];
  placeholders: string[];
  coreAssetIds?: string[];
  assets?: WorkLiteAssetStatus[];
  personaMap?: Record<string, {
    bodyAssetId: string;
    displayPrefix: string;
    presetId?: string;
    label?: string;
  }>;
  missingAssets?: string[];
  requiredDirectories?: string[];
  selectedAssetRoot?: string;
  availableAssetRoots?: string[];
  selectedBundleName?: string;
  manifestSource?: "catalog" | "integration_manifest";
  runtimeProfile?: {
    orientationAngles?: [number, number, number];
    skeletonRootHints?: string[];
    viewportDefaults?: {
      modelX?: number;
      modelY?: number;
      modelZ?: number;
      modelYaw?: number;
      modelPitch?: number;
      modelRoll?: number;
      modelScaleMultiplier?: number;
      cameraX?: number;
      cameraY?: number;
      cameraZ?: number;
      targetX?: number;
      targetY?: number;
      targetZ?: number;
    };
  };
  textureTiers?: {
    flatBase?: string;
    manifest?: string;
    low?: string;
    medium?: string;
    high?: string;
  };
}

export const workLiteAssetManifest: WorkLiteAssetManifest = {
  avatarReady: false,
  backgroundThemes: ["work", "home_shop", "private", "lightweight", "focus"],
  placeholders: [
    "base avatar glb",
    "meili hair",
    "urban action vest",
    "urban action pants",
    "urban action boots",
    "urban action bracelets",
    "idle animation",
    "work background",
    "private background",
  ],
};
