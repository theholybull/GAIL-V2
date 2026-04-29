export const QUALITY_TIERS = ["low", "medium", "high"] as const;

export type QualityTier = (typeof QUALITY_TIERS)[number];
