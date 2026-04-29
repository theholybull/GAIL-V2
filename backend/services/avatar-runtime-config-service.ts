import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  AvatarRuntimeSystem,
  AvatarRuntimeSystemOption,
  DisplayInputMode,
} from "../../shared/contracts/client-runtime";
import type { WorkLiteAssetKind } from "../../shared/contracts/work-lite-assets";
import type { WardrobePresetsFile } from "./wardrobe-presets-service";

export interface AvatarRuntimeAssetCatalogEntry {
  id: string;
  name: string;
  kind: WorkLiteAssetKind;
  slot?: string;
  required?: boolean;
  autoLoad?: boolean;
  expectedPath: string;
  searchDirectories?: string[];
  extensions: string[];
}

export interface AvatarRuntimeAssetCatalog {
  coreAssetIds?: string[];
  assets: AvatarRuntimeAssetCatalogEntry[];
}

export interface AvatarRuntimeConfigFile {
  schemaVersion: number;
  updatedAt?: string;
  note?: string;
  runtime: {
    settings: {
      activeAvatarSystem: AvatarRuntimeSystem;
      displayInputMode: DisplayInputMode;
      bodyMorphControls?: {
        enabledDuringMotion?: boolean;
        overrides?: Record<string, number>;
      };
    };
    availableAvatarSystems: AvatarRuntimeSystemOption[];
  };
  assetCatalog: AvatarRuntimeAssetCatalog;
  wardrobe: WardrobePresetsFile;
  personaMap?: Record<string, {
    bodyAssetId: string;
    displayPrefix: string;
    presetId: string;
    label: string;
  }>;
}

const DEFAULT_CONFIG: AvatarRuntimeConfigFile = {
  schemaVersion: 1,
  note: "Single shell-managed avatar runtime source of truth.",
  runtime: {
    settings: {
      activeAvatarSystem: "gail_primary",
      displayInputMode: "wake_word",
      bodyMorphControls: {
        enabledDuringMotion: true,
        overrides: {},
      },
    },
    availableAvatarSystems: [
      {
        key: "gail_primary",
        label: "Gail Primary",
        assetRoot: "gail",
        description: "Primary Gail runtime stack with modular outfit and private-mode asset separation.",
      },
      {
        key: "handoff_20260330",
        label: "New Handoff Bundle",
        assetRoot: "handoffs/playcanvas_handoff_20260330",
        description: "Modular body, hair, clothing, accessories, and starter idle/listen/ack/gesture clips.",
      },
      {
        key: "legacy_fallback",
        label: "Legacy Fallback",
        assetRoot: undefined,
        description: "Current legacy catalog and fallback animation path.",
      },
    ],
  },
  assetCatalog: {
    coreAssetIds: [],
    assets: [],
  },
  wardrobe: {
    activePresetId: "gail_workwear",
    presets: [],
  },
};

export class AvatarRuntimeConfigService {
  private readonly configPath: string;

  constructor(
    configPath = process.env.GAIL_AVATAR_RUNTIME_CONFIG_PATH
      ?? resolve(process.cwd(), "..", "data", "client", "avatar-runtime.json"),
  ) {
    this.configPath = configPath;
  }

  getConfig(): AvatarRuntimeConfigFile {
    return this.readConfig();
  }

  getRuntime() {
    return this.readConfig().runtime;
  }

  updateRuntimeSettings(settings: Partial<AvatarRuntimeConfigFile["runtime"]["settings"]>): AvatarRuntimeConfigFile {
    const config = this.readConfig();
    config.runtime.settings = {
      ...config.runtime.settings,
      ...settings,
    };
    this.writeConfig(config);
    return config;
  }

  getAssetCatalog(): AvatarRuntimeAssetCatalog {
    return this.readConfig().assetCatalog;
  }

  getWardrobe(): WardrobePresetsFile {
    return this.readConfig().wardrobe;
  }

  updateWardrobe(updater: (wardrobe: WardrobePresetsFile) => WardrobePresetsFile): WardrobePresetsFile {
    const config = this.readConfig();
    config.wardrobe = updater({
      activePresetId: config.wardrobe.activePresetId,
      presets: config.wardrobe.presets.map((preset) => ({
        ...preset,
        slots: { ...preset.slots },
      })),
    });
    this.writeConfig(config);
    return config.wardrobe;
  }

  private readConfig(): AvatarRuntimeConfigFile {
    if (!existsSync(this.configPath)) {
      this.writeConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    const raw = readFileSync(this.configPath, "utf8").replace(/^\uFEFF/, "").trim();
    if (!raw) {
      this.writeConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw) as Partial<AvatarRuntimeConfigFile>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      runtime: {
        ...DEFAULT_CONFIG.runtime,
        ...(parsed.runtime ?? {}),
        settings: {
          ...DEFAULT_CONFIG.runtime.settings,
          ...(parsed.runtime?.settings ?? {}),
        },
        availableAvatarSystems: parsed.runtime?.availableAvatarSystems?.length
          ? parsed.runtime.availableAvatarSystems
          : DEFAULT_CONFIG.runtime.availableAvatarSystems,
      },
      assetCatalog: {
        ...DEFAULT_CONFIG.assetCatalog,
        ...(parsed.assetCatalog ?? {}),
        assets: parsed.assetCatalog?.assets ?? DEFAULT_CONFIG.assetCatalog.assets,
      },
      wardrobe: {
        ...DEFAULT_CONFIG.wardrobe,
        ...(parsed.wardrobe ?? {}),
        presets: parsed.wardrobe?.presets ?? DEFAULT_CONFIG.wardrobe.presets,
      },
    };
  }

  private writeConfig(config: AvatarRuntimeConfigFile): void {
    mkdirSync(dirname(this.configPath), { recursive: true });
    writeFileSync(this.configPath, JSON.stringify({
      ...config,
      updatedAt: new Date().toISOString(),
    }, null, 2));
  }
}
