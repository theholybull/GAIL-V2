import type { CreateNoteInput, UpdateNoteInput } from "../../shared/contracts/index";
import type { RequestMeta } from "./request-meta";
import { HttpError } from "./http-error";

type ResourceKind =
  | "project"
  | "note"
  | "list"
  | "task"
  | "reminder"
  | "part"
  | "cart";

export function enforceWritePolicy(
  resource: ResourceKind,
  meta: RequestMeta,
  payload?: unknown,
): void {
  if (meta.mode !== "private") {
    return;
  }

  if (resource === "note") {
    validatePrivateNoteWrite(meta, payload);
    return;
  }

  throw new HttpError(
    403,
    `Private Mode blocks persistent ${resource} writes. Exit Private Mode or use an explicitly local private note.`,
  );
}

function validatePrivateNoteWrite(meta: RequestMeta, payload?: unknown): void {
  const note = payload as CreateNoteInput | UpdateNoteInput | undefined;

  if (!meta.explicitLocalSave) {
    throw new HttpError(
      403,
      "Private Mode note writes require explicit local save confirmation via x-gail-explicit-local-save: true.",
    );
  }

  if (note?.privateOnly !== true) {
    throw new HttpError(
      403,
      "Private Mode note writes must set privateOnly=true so they remain explicitly marked as private.",
    );
  }
}

export function enforceNonPrivateSensitiveAction(meta: RequestMeta, action: string): void {
  if (meta.mode === "private") {
    throw new HttpError(
      403,
      `Private Mode blocks ${action}. Exit Private Mode before performing sensitive automation.`,
    );
  }
}

export function enforceSensitiveAuthPolicy(meta: RequestMeta, action: string): void {
  if (meta.authMode !== "paired_required_for_sensitive") {
    return;
  }

  if (!meta.authenticated || meta.identitySource !== "device_token" || !meta.deviceId) {
    throw new HttpError(
      403,
      `This server requires a paired device token for sensitive action: ${action}.`,
    );
  }
}
