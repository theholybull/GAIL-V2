export type ControlIntentSource = "typed" | "voice";
export type ControlIntentAction = "command" | "workflow";

export interface ResolveControlIntentInput {
  text: string;
  source?: ControlIntentSource;
  autoPlan?: boolean;
}

export interface ControlIntentCommandSummary {
  key: string;
  action: string;
  description: string;
  brokerStatus: "accepted" | "blocked" | "pending_approval" | "completed" | "failed";
  success: boolean;
}

export interface ControlIntentWorkflowSummary {
  id: string;
  title: string;
  status: string;
  plannedStepCount: number;
  firstStepId?: string;
  firstStepTitle?: string;
  reviewRequired: boolean;
}

export interface ControlIntentResult {
  inputText: string;
  source: ControlIntentSource;
  action: ControlIntentAction;
  status: "accepted" | "planned" | "failed";
  summary: string;
  command?: ControlIntentCommandSummary;
  workflow?: ControlIntentWorkflowSummary;
}