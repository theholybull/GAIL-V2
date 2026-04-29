import type { AuditFields } from "../types/base";
import type { ConversationProviderKind } from "./conversation";

export const WORKFLOW_STATUSES = [
  "draft",
  "planned",
  "active",
  "waiting_review",
  "done",
  "archived",
] as const;

export const WORKFLOW_STEP_KINDS = [
  "document_summary",
  "data_compile",
  "draft_email",
  "fill_form",
  "codex_agent",
  "human_review",
] as const;

export const WORKFLOW_STEP_STATUSES = [
  "pending",
  "ready",
  "running",
  "completed",
  "needs_review",
  "blocked",
  "failed",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];
export type WorkflowStepKind = (typeof WORKFLOW_STEP_KINDS)[number];
export type WorkflowStepStatus = (typeof WORKFLOW_STEP_STATUSES)[number];

export interface WorkflowContextItem {
  id: string;
  title: string;
  body: string;
  sourceType: "manual" | "memory" | "note" | "conversation";
  sourceId?: string;
}

export interface WorkflowArtifact {
  id: string;
  kind:
    | "summary"
    | "report"
    | "email_subject"
    | "email_body"
    | "form_fields"
    | "agent_brief"
    | "review_checklist";
  title: string;
  content: string;
  mimeType: "text/plain" | "text/markdown" | "application/json";
}

export interface WorkflowStep {
  id: string;
  kind: WorkflowStepKind;
  title: string;
  instruction: string;
  status: WorkflowStepStatus;
  dependsOnStepIds: string[];
  assignee: "ai" | "codex" | "human";
  artifacts: WorkflowArtifact[];
  lastRunAt?: string;
  lastError?: string;
  requiresReview: boolean;
}

export interface Workflow extends AuditFields {
  id: string;
  title: string;
  objective: string;
  status: WorkflowStatus;
  projectId?: string;
  providerPreference: ConversationProviderKind;
  contextItems: WorkflowContextItem[];
  steps: WorkflowStep[];
}

export interface CreateWorkflowContextItemInput {
  title: string;
  body: string;
  sourceType?: WorkflowContextItem["sourceType"];
  sourceId?: string;
}

export interface CreateWorkflowInput {
  title: string;
  objective: string;
  projectId?: string;
  providerPreference?: ConversationProviderKind;
  contextItems?: CreateWorkflowContextItemInput[];
}

export interface UpdateWorkflowInput {
  title?: string;
  objective?: string;
  status?: WorkflowStatus;
  projectId?: string;
  providerPreference?: ConversationProviderKind;
  contextItems?: CreateWorkflowContextItemInput[];
}

export interface PlanWorkflowInput {
  replaceExistingSteps?: boolean;
}

export interface UpdateWorkflowStepInput {
  title?: string;
  instruction?: string;
  status?: WorkflowStepStatus;
  assignee?: WorkflowStep["assignee"];
  requiresReview?: boolean;
}

export interface WorkflowExecutionResult {
  workflow: Workflow;
  step: WorkflowStep;
  usedProvider: ConversationProviderKind | "heuristic";
  fellBack: boolean;
  fallbackReason?: string;
}
