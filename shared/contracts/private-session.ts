import type { AuditFields } from "../types/base";

export interface PrivateSessionNote extends AuditFields {
  id: string;
  title?: string;
  body: string;
}

export interface PrivateSessionState extends AuditFields {
  id: string;
  deviceId: string;
  mode: "private";
  notes: PrivateSessionNote[];
}
