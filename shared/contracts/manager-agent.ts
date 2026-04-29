export type ManagerDirectiveStatus = "pending" | "dispatched" | "running" | "completed" | "failed" | "cancelled" | "awaiting_gail_approval";
export type ManagerDirectivePriority = "low" | "normal" | "high" | "critical";
export type GailApprovalStatus = "pending" | "approved" | "rejected";
export type AgentLogLevel = "info" | "warn" | "error" | "debug";

export interface CreateManagerDirectiveInput {
  instruction: string;
  priority?: ManagerDirectivePriority;
  assignee?: "ai" | "codex" | "human";
  context?: Record<string, unknown>;
}

export interface ManagerDirective {
  id: string;
  instruction: string;
  priority: ManagerDirectivePriority;
  status: ManagerDirectiveStatus;
  assignee: "ai" | "codex" | "human";
  workflowId?: string;
  result?: string;
  error?: string;
  context?: Record<string, unknown>;
  gailApproval?: GailApprovalStatus;
  gailApprovalNote?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AgentLogEntry {
  id?: number;
  timestamp: string;
  agentId: string;
  action: string;
  directiveId?: string;
  details: string;
  result?: string;
  level: AgentLogLevel;
}

export interface ManagerAgentStatus {
  agentId: string;
  role: "manager" | "builder";
  status: "idle" | "busy" | "offline";
  currentDirectiveId?: string;
  completedCount: number;
  failedCount: number;
  lastActiveAt?: string;
}

export interface ManagerReport {
  generatedAt: string;
  manager: ManagerAgentStatus;
  builders: ManagerAgentStatus[];
  directives: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  recentDirectives: ManagerDirective[];
  recentLogs: AgentLogEntry[];
}
