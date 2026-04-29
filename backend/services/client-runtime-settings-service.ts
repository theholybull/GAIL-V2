import type {
  AvatarRuntimeSystem,
  ClientRuntimeSettings,
  UpdateClientRuntimeSettingsInput,
} from "../../shared/contracts/index";
import { AvatarRuntimeConfigService } from "./avatar-runtime-config-service";

export class ClientRuntimeSettingsService {
  private readonly avatarRuntimeConfigService: AvatarRuntimeConfigService;

  constructor(
    avatarRuntimeConfigService = new AvatarRuntimeConfigService(),
  ) {
    this.avatarRuntimeConfigService = avatarRuntimeConfigService;
  }

  getSettings(): ClientRuntimeSettings {
    const runtime = this.avatarRuntimeConfigService.getRuntime();
    const stored = runtime.settings;
    const activeSystem = this.resolveSystem(stored.activeAvatarSystem);
    return {
      activeAvatarSystem: activeSystem.key,
      activeAssetRoot: activeSystem.assetRoot,
      availableAvatarSystems: runtime.availableAvatarSystems,
      displayInputMode: stored.displayInputMode,
      bodyMorphControls: {
        enabledDuringMotion: stored.bodyMorphControls?.enabledDuringMotion ?? true,
        overrides: {
          ...(stored.bodyMorphControls?.overrides ?? {}),
        },
      },
    };
  }

  updateSettings(input: UpdateClientRuntimeSettingsInput): ClientRuntimeSettings {
    const current = this.avatarRuntimeConfigService.getRuntime().settings;
    const nextSystem = input.activeAvatarSystem ?? current.activeAvatarSystem;
    const nextDisplayInputMode = input.displayInputMode ?? current.displayInputMode;
    const nextBodyMorphControls = {
      enabledDuringMotion: input.bodyMorphControls?.enabledDuringMotion
        ?? current.bodyMorphControls?.enabledDuringMotion
        ?? true,
      overrides: {
        ...(current.bodyMorphControls?.overrides ?? {}),
        ...(input.bodyMorphControls?.overrides ?? {}),
      },
    };
    this.avatarRuntimeConfigService.updateRuntimeSettings({
      activeAvatarSystem: this.resolveSystem(nextSystem).key,
      displayInputMode: nextDisplayInputMode,
      bodyMorphControls: nextBodyMorphControls,
    });
    return this.getSettings();
  }

  private resolveSystem(system: AvatarRuntimeSystem) {
    const systems = this.avatarRuntimeConfigService.getRuntime().availableAvatarSystems;
    return systems.find((option) => option.key === system) ?? systems[0];
  }
}
