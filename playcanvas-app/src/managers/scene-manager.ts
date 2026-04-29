import type { QualityTier } from "../../../shared/contracts/index";

export class SceneManager {
  constructor(
    private readonly sceneRole: string,
    private qualityTier: QualityTier,
  ) {}

  getSceneSummary(): string {
    return `${this.sceneRole} / ${this.qualityTier}`;
  }

  setQualityTier(qualityTier: QualityTier): QualityTier {
    this.qualityTier = qualityTier;
    return this.qualityTier;
  }
}
