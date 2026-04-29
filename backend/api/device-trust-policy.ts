import type { DeviceService } from "../services";
import type { RequestMeta } from "./request-meta";
import { HttpError } from "./http-error";

export function requireTrustedRegisteredDevice(
  deviceService: DeviceService,
  meta: RequestMeta,
): void {
  const deviceId = meta.deviceId;
  if (!deviceId) {
    throw new HttpError(403, "Trusted action requires x-gail-device-id.");
  }

  const device = deviceService.getById(deviceId);
  if (!device) {
    throw new HttpError(403, `Device ${deviceId} is not registered.`);
  }

  if (device.type !== meta.deviceType) {
    throw new HttpError(403, `Registered device ${deviceId} type does not match request device type.`);
  }

  if (!device.trusted) {
    throw new HttpError(403, `Device ${deviceId} is not trusted for this action.`);
  }

  const unlockedUntil = device.sensitiveActionsUnlockedUntil
    ? Date.parse(device.sensitiveActionsUnlockedUntil)
    : Number.NaN;

  if (!Number.isFinite(unlockedUntil) || unlockedUntil <= Date.now()) {
    throw new HttpError(
      403,
      `Device ${deviceId} is not currently unlocked for sensitive actions.`,
    );
  }
}
