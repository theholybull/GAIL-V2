export const CONTROL_PANEL_TABS = [
  "General",
  "Modes",
  "Avatar",
  "Clothes",
  "Hair",
  "Environment",
  "Personality",
  "Devices",
  "Permissions",
  "Privacy",
  "Memory",
  "Parts Sources",
  "Cart",
  "Tasks",
  "Voice",
  "Commands",
  "Tools",
  "Cameras",
  "Backup/Sync",
  "Debug",
] as const;

export type ControlPanelTab = (typeof CONTROL_PANEL_TABS)[number];
