export const PART_STATUSES = [
  "needed",
  "researching",
  "in_cart",
  "ordered",
  "received",
  "installed",
  "returned",
  "incompatible",
] as const;

export const PART_SOURCE_TYPES = [
  "search",
  "marketplace",
  "catalog",
  "reference_manual",
] as const;

export type PartStatus = (typeof PART_STATUSES)[number];
export type PartSourceType = (typeof PART_SOURCE_TYPES)[number];
