import type { Workflow, WorkflowStep } from "./workflow";

export type BuildApprovalDecision = "approve" | "request_changes" | "block";
export type BuildScreenshotIssueSeverity = "low" | "medium" | "high";

export interface BuildStepSubmissionInput {
  summary: string;
  artifactPaths?: string[];
}

export interface BuildStepApprovalInput {
  decision: BuildApprovalDecision;
  notes?: string;
  requireScreenshotEvidence?: boolean;
}

export interface BuildScreenshotCaptureInput {
  feature: string;
  sourcePath?: string;
  label?: string;
  stepId?: string;
}

export interface BuildScreenshotAnalyzeInput {
  feature: string;
  screenshotPath: string;
  stepId?: string;
}

export interface BuildScriptRunInput {
  id: string;
  args?: string[];
}

export interface BuildScriptResultSummary {
  id: string;
  scriptId: string;
  status: "completed" | "failed";
  startedAt: string;
  endedAt: string;
  durationMs: number;
  command: string;
  outputPath: string;
}

export interface BuildScriptRegistryEntry {
  id: string;
  name: string;
  path: string;
  type: "powershell";
  purpose: string;
  owner: string;
  inputs: string[];
  outputs: string[];
  lastStatus?: "never_run" | "completed" | "failed";
  lastRunAt?: string;
  lastResultId?: string;
}

export interface BuildAgentLane {
  laneId: string;
  assignee: WorkflowStep["assignee"];
  activeWorkflowId?: string;
  activeWorkflowTitle?: string;
  currentStepId?: string;
  currentStepTitle?: string;
  currentStepStatus?: WorkflowStep["status"];
  pendingApprovalCount: number;
  blockerReason?: string;
}

export interface BuildOverview {
  generatedAt: string;
  masterChecker: {
    status: "active" | "idle";
    pendingApprovals: number;
    blockedSteps: number;
  };
  progress: {
    workflowCount: number;
    stepCount: number;
    completedSteps: number;
    percentComplete: number;
    waitingReviewSteps: number;
  };
  approvalQueue: Array<{
    workflowId: string;
    workflowTitle: string;
    stepId: string;
    stepTitle: string;
    assignee: WorkflowStep["assignee"];
    status: WorkflowStep["status"];
    lastRunAt?: string;
    hasScreenshotEvidence: boolean;
  }>;
  workflows: Workflow[];
}
