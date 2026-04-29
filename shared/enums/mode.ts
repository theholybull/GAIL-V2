export const MODES = [
  "work",
  "home_shop",
  "private",
  "lightweight",
  "focus",
] as const;

export type Mode = (typeof MODES)[number];
