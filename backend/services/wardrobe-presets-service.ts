import { AvatarRuntimeConfigService } from "./avatar-runtime-config-service";

export interface WardrobeSlotMap {
  base?: string | null;
  hair?: string | null;
  upper?: string | null;
  lower?: string | null;
  footwear?: string | null;
  accessories?: string | null;
}

export interface WardrobePreset {
  id: string;
  name: string;
  persona: string;
  slots: WardrobeSlotMap;
}

export interface WardrobePresetsFile {
  activePresetId: string;
  presets: WardrobePreset[];
}

export interface UpdateWardrobeActivePresetInput {
  activePresetId: string;
}

export interface CreateWardrobePresetInput {
  id: string;
  name: string;
  persona: string;
  slots: WardrobeSlotMap;
}

export interface UpdateWardrobePresetInput {
  name?: string;
  persona?: string;
  slots?: Partial<WardrobeSlotMap>;
}

const DEFAULT_DATA: WardrobePresetsFile = {
  activePresetId: "gail_workwear",
  presets: [],
};

export class WardrobePresetsService {
  private readonly avatarRuntimeConfigService: AvatarRuntimeConfigService;

  constructor(
    avatarRuntimeConfigService = new AvatarRuntimeConfigService(),
  ) {
    this.avatarRuntimeConfigService = avatarRuntimeConfigService;
  }

  getPresets(): WardrobePresetsFile {
    return this.readData();
  }

  setActivePreset(input: UpdateWardrobeActivePresetInput): WardrobePresetsFile {
    const data = this.readData();
    const found = data.presets.find((p) => p.id === input.activePresetId);
    if (!found) {
      throw new Error(`Wardrobe preset not found: ${input.activePresetId}`);
    }
    data.activePresetId = input.activePresetId;
    this.writeData(data);
    return data;
  }

  createPreset(input: CreateWardrobePresetInput): WardrobePresetsFile {
    const data = this.readData();
    if (data.presets.some((p) => p.id === input.id)) {
      throw new Error(`Wardrobe preset already exists: ${input.id}`);
    }
    data.presets.push({
      id: input.id,
      name: input.name,
      persona: input.persona,
      slots: { ...input.slots },
    });
    this.writeData(data);
    return data;
  }

  updatePreset(presetId: string, input: UpdateWardrobePresetInput): WardrobePresetsFile {
    const data = this.readData();
    const preset = data.presets.find((p) => p.id === presetId);
    if (!preset) {
      throw new Error(`Wardrobe preset not found: ${presetId}`);
    }
    if (input.name !== undefined) preset.name = input.name;
    if (input.persona !== undefined) preset.persona = input.persona;
    if (input.slots) {
      preset.slots = { ...preset.slots, ...input.slots };
    }
    this.writeData(data);
    return data;
  }

  deletePreset(presetId: string): WardrobePresetsFile {
    const data = this.readData();
    const index = data.presets.findIndex((p) => p.id === presetId);
    if (index === -1) {
      throw new Error(`Wardrobe preset not found: ${presetId}`);
    }
    data.presets.splice(index, 1);
    if (data.activePresetId === presetId && data.presets.length > 0) {
      data.activePresetId = data.presets[0].id;
    }
    this.writeData(data);
    return data;
  }

  private readData(): WardrobePresetsFile {
    const data = this.avatarRuntimeConfigService.getWardrobe();
    return {
      activePresetId: data.activePresetId || DEFAULT_DATA.activePresetId,
      presets: Array.isArray(data.presets) ? data.presets : [],
    };
  }

  private writeData(data: WardrobePresetsFile): void {
    this.avatarRuntimeConfigService.updateWardrobe(() => data);
  }
}
