export const DEVICE_TYPES = [
  "uconsole",
  "kiosk",
  "iphone",
  "watch",
  "web_admin",
  "service",
] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];
