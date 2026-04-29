import type { ActionRiskLevel, ActionType } from "../enums/action";

export interface ActionRequest<TPayload = Record<string, unknown>> {
  id: string;
  type: ActionType;
  riskLevel: ActionRiskLevel;
  mode: string;
  deviceId: string;
  requiresConfirmation: boolean;
  payload: TPayload;
}

export interface ActionResult<TData = unknown> {
  requestId: string;
  success: boolean;
  status: "accepted" | "blocked" | "pending_approval" | "completed" | "failed";
  message: string;
  data?: TData;
}
