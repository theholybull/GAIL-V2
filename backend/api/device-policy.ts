import type { DeviceType } from "../../shared/contracts/index";
import type { RequestMeta } from "./request-meta";
import { HttpError } from "./http-error";

export type CapabilityKey =
  | "health"
  | "dashboard_read"
  | "private_session"
  | "devices_read"
  | "devices_write"
  | "approvals_read"
  | "approvals_write"
  | "projects_read"
  | "projects_write"
  | "notes_read"
  | "notes_write"
  | "commands_read"
  | "commands_write"
  | "providers_read"
  | "providers_write"
  | "voice_read"
  | "voice_write"
  | "camera_read"
  | "lists_read"
  | "lists_write"
  | "tasks_read"
  | "tasks_write"
  | "reminders_read"
  | "reminders_write"
  | "parts_read"
  | "parts_write"
  | "cart_read"
  | "cart_write";

const DEVICE_CAPABILITIES: Record<DeviceType, readonly CapabilityKey[]> = {
  uconsole: [
    "health",
    "dashboard_read",
    "private_session",
    "devices_read",
    "devices_write",
    "approvals_read",
    "approvals_write",
    "projects_read",
    "projects_write",
    "notes_read",
    "notes_write",
    "commands_read",
    "commands_write",
    "providers_read",
    "providers_write",
    "voice_read",
    "voice_write",
    "camera_read",
    "lists_read",
    "lists_write",
    "tasks_read",
    "tasks_write",
    "reminders_read",
    "reminders_write",
    "parts_read",
    "parts_write",
    "cart_read",
    "cart_write",
  ],
  kiosk: [
    "health",
    "dashboard_read",
    "private_session",
    "devices_read",
    "devices_write",
    "approvals_read",
    "approvals_write",
    "projects_read",
    "projects_write",
    "notes_read",
    "notes_write",
    "commands_read",
    "commands_write",
    "providers_read",
    "providers_write",
    "voice_read",
    "voice_write",
    "camera_read",
    "lists_read",
    "lists_write",
    "tasks_read",
    "tasks_write",
    "reminders_read",
    "reminders_write",
    "parts_read",
    "parts_write",
    "cart_read",
    "cart_write",
  ],
  iphone: [
    "health",
    "dashboard_read",
    "private_session",
    "devices_read",
    "approvals_read",
    "approvals_write",
    "projects_read",
    "projects_write",
    "notes_read",
    "notes_write",
    "commands_read",
    "commands_write",
    "providers_read",
    "providers_write",
    "voice_read",
    "voice_write",
    "camera_read",
    "lists_read",
    "lists_write",
    "tasks_read",
    "tasks_write",
    "reminders_read",
    "reminders_write",
    "parts_read",
    "parts_write",
    "cart_read",
    "cart_write",
  ],
  watch: [
    "health",
    "dashboard_read",
    "private_session",
    "devices_read",
    "approvals_read",
    "approvals_write",
    "commands_read",
    "providers_read",
    "providers_write",
    "voice_read",
  ],
  web_admin: [
    "health",
    "dashboard_read",
    "private_session",
    "devices_read",
    "devices_write",
    "approvals_read",
    "approvals_write",
    "projects_read",
    "projects_write",
    "notes_read",
    "notes_write",
    "commands_read",
    "commands_write",
    "providers_read",
    "providers_write",
    "voice_read",
    "voice_write",
    "camera_read",
    "lists_read",
    "lists_write",
    "tasks_read",
    "tasks_write",
    "reminders_read",
    "reminders_write",
    "parts_read",
    "parts_write",
    "cart_read",
    "cart_write",
  ],
  service: [
    "health",
    "dashboard_read",
    "devices_read",
    "devices_write",
    "approvals_read",
    "projects_read",
    "projects_write",
    "notes_read",
    "notes_write",
    "commands_read",
    "commands_write",
    "providers_read",
    "providers_write",
    "voice_read",
    "voice_write",
    "camera_read",
    "lists_read",
    "lists_write",
    "tasks_read",
    "tasks_write",
    "reminders_read",
    "reminders_write",
    "parts_read",
    "parts_write",
    "cart_read",
    "cart_write",
  ],
};

export function requireCapability(meta: RequestMeta, capability: CapabilityKey): void {
  const allowed = DEVICE_CAPABILITIES[meta.deviceType];
  if (allowed.includes(capability)) {
    return;
  }

  throw new HttpError(
    403,
    `Device type ${meta.deviceType} is not allowed to use capability ${capability}.`,
  );
}
