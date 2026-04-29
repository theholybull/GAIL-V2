import type {
  CreateManagerDirectiveInput,
  ManagerDirective,
  ManagerAgentStatus,
  ManagerReport,
  AgentLogEntry,
} from "../../shared/contracts/index";
import type { RequestMeta } from "../api/request-meta";
import type { BuildControlService } from "./build-control-service";
import type { WorkflowService } from "./workflow-service";
import type { SystemStatusService } from "./system-status-service";
import type { AgentLogService } from "./agent-log-service";
import type { DirectiveStore } from "../db/directive-repository";
import { SqliteDirectiveRepository } from "../db/directive-repository";

const REFRESH_INTERVAL_MS = 30_000;
const MAX_RETRIES = 3;

interface CompletionCallback {
  (directive: ManagerDirective): void;
}

export class ManagerAgentService {
  private readonly directiveStore: DirectiveStore;
  private readonly managerStatus: ManagerAgentStatus = {
    agentId: "manager-alpha",
    role: "manager",
    status: "idle",
    completedCount: 0,
    failedCount: 0,
  };
  private readonly builderStatuses: ManagerAgentStatus[] = [
    {
      agentId: "builder-a",
      role: "builder",
      status: "idle",
      completedCount: 0,
      failedCount: 0,
    },
    {
      agentId: "builder-b",
      role: "builder",
      status: "idle",
      completedCount: 0,
      failedCount: 0,
    },
  ];
  private refreshTimer: ReturnType<typeof setInterval> | undefined;
  private readonly completionCallbacks: CompletionCallback[] = [];
  private readonly retryCounters = new Map<string, number>();

  constructor(
    private readonly buildControlService: BuildControlService,
    private readonly workflowService: WorkflowService,
    private readonly systemStatusService: SystemStatusService,
    private readonly agentLogService?: AgentLogService,
    directiveStore?: DirectiveStore,
  ) {
    this.directiveStore = directiveStore ?? new SqliteDirectiveRepository();
    this.startRefreshLoop();

    this.log("manager-alpha", "startup", "Manager agent service initialized with SQLite persistence and periodic refresh.");
  }

  /**
   * Register a callback to be called when a directive completes or fails.
   */
  onDirectiveComplete(callback: CompletionCallback): void {
    this.completionCallbacks.push(callback);
  }

  createDirective(input: CreateManagerDirectiveInput): ManagerDirective {
    const id = `dir-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const directive: ManagerDirective = {
      id,
      instruction: input.instruction,
      priority: input.priority ?? "normal",
      status: "pending",
      assignee: input.assignee ?? this.pickAssignee(),
      context: input.context,
      createdAt: now,
      updatedAt: now,
    };

    this.directiveStore.create(directive);

    this.log("manager-alpha", "directive_created", `Created directive ${id}: "${input.instruction.slice(0, 120)}"`, {
      directiveId: id,
      result: `priority=${directive.priority}, assignee=${directive.assignee}`,
    });

    // Dispatch immediately
    this.dispatch(directive);
    return directive;
  }

  getDirective(id: string): ManagerDirective | undefined {
    return this.directiveStore.getById(id);
  }

  listDirectives(status?: string, limit = 50): ManagerDirective[] {
    return this.directiveStore.list(status, limit);
  }

  cancelDirective(id: string): ManagerDirective | undefined {
    const directive = this.directiveStore.getById(id);
    if (!directive || directive.status === "completed" || directive.status === "failed") {
      return directive;
    }
    directive.status = "cancelled";
    directive.updatedAt = new Date().toISOString();
    this.directiveStore.update(directive);
    this.freeBuilder(directive.assignee);

    this.log("manager-alpha", "directive_cancelled", `Cancelled directive ${id}.`, { directiveId: id });
    return directive;
  }

  retryDirective(id: string): ManagerDirective | undefined {
    const directive = this.directiveStore.getById(id);
    if (!directive || directive.status !== "failed") {
      return directive;
    }

    const retryCount = (this.retryCounters.get(id) ?? 0) + 1;
    if (retryCount > MAX_RETRIES) {
      this.log("manager-alpha", "retry_exhausted", `Directive ${id} exceeded max retries (${MAX_RETRIES}).`, {
        directiveId: id,
        level: "warn",
      });
      return directive;
    }
    this.retryCounters.set(id, retryCount);

    directive.status = "pending";
    directive.error = undefined;
    directive.updatedAt = new Date().toISOString();
    this.directiveStore.update(directive);

    this.log("manager-alpha", "directive_retried", `Retrying directive ${id} (attempt ${retryCount}/${MAX_RETRIES}).`, {
      directiveId: id,
    });

    this.dispatch(directive);
    return directive;
  }

  getReport(): ManagerReport {
    const counts = (this.directiveStore as SqliteDirectiveRepository).countByStatus();
    const recentDirectives = this.directiveStore.list(undefined, 20);
    const recentLogs = this.agentLogService?.getRecentLogs(undefined, 20) ?? [];

    return {
      generatedAt: new Date().toISOString(),
      manager: { ...this.managerStatus },
      builders: this.builderStatuses.map((b) => ({ ...b })),
      directives: counts,
      recentDirectives,
      recentLogs,
    };
  }

  getManagerStatus(): ManagerAgentStatus {
    return { ...this.managerStatus };
  }

  getBuilderStatuses(): ManagerAgentStatus[] {
    return this.builderStatuses.map((b) => ({ ...b }));
  }

  getLogs(agentId?: string, limit = 50): AgentLogEntry[] {
    return this.agentLogService?.getRecentLogs(agentId, limit) ?? [];
  }

  getDirectiveLogs(directiveId: string, limit = 50): AgentLogEntry[] {
    return this.agentLogService?.getLogsByDirective(directiveId, limit) ?? [];
  }

  /**
   * Called by the avatar conversation bridge when the avatar detects
   * a build/task request in user speech. Returns a summary for the avatar
   * to speak back.
   */
  async handleAvatarRequest(instruction: string): Promise<string> {
    const directive = this.createDirective({ instruction, priority: "normal" });
    this.log("manager-alpha", "avatar_request", `Gail dispatched: "${instruction.slice(0, 100)}"`, {
      directiveId: directive.id,
    });
    return `I've dispatched that to the manager. Directive ${directive.id} is ${directive.status} and assigned to ${directive.assignee}. I'll review the result before it reaches you.`;
  }

  /**
   * Gail (the primary AI) submits approval or rejection for a completed directive.
   * Nothing reaches the operator without Gail's sign-off.
   */
  gailApprove(directiveId: string, decision: "approved" | "rejected", note?: string): ManagerDirective | undefined {
    const directive = this.directiveStore.getById(directiveId);
    if (!directive) return undefined;

    directive.gailApproval = decision;
    directive.gailApprovalNote = note;
    directive.updatedAt = new Date().toISOString();

    if (decision === "approved" && directive.status === "awaiting_gail_approval") {
      directive.status = "completed";
      directive.completedAt = directive.updatedAt;
      this.managerStatus.completedCount++;
      this.incrementBuilderCompleted(directive.assignee);
      this.freeBuilder(directive.assignee);
    } else if (decision === "rejected" && directive.status === "awaiting_gail_approval") {
      directive.status = "failed";
      directive.error = `Rejected by Gail: ${note ?? "no reason given"}`;
      this.managerStatus.failedCount++;
      this.incrementBuilderFailed(directive.assignee);
      this.freeBuilder(directive.assignee);
    }

    this.directiveStore.update(directive);
    this.log("manager-alpha", `gail_${decision}`, `Gail ${decision} directive ${directiveId}${note ? `: ${note}` : ""}`, {
      directiveId,
      result: decision,
    });
    this.notifyCompletion(directive);
    return directive;
  }

  /**
   * Move a directive into the awaiting_gail_approval state after agent work finishes.
   * Called by the refresh loop when a directive's workflow completes.
   */
  private markAwaitingGailApproval(directive: ManagerDirective, result: string): void {
    directive.status = "awaiting_gail_approval";
    directive.result = result;
    directive.gailApproval = "pending";
    directive.updatedAt = new Date().toISOString();
    this.directiveStore.update(directive);
    this.freeBuilder(directive.assignee);

    this.log("manager-alpha", "awaiting_gail_approval", `Directive ${directive.id} awaiting Gail's approval: ${result.slice(0, 120)}`, {
      directiveId: directive.id,
      result: result.slice(0, 200),
    });
  }

  /**
   * Returns a brief context string for Gail's system prompt — always kept up to date.
   */
  getGailContext(): string {
    const counts = (this.directiveStore as SqliteDirectiveRepository).countByStatus();
    const awaitingApproval = this.directiveStore.list("awaiting_gail_approval", 10);
    const parts = [
      `Directives: ${counts.total} total, ${counts.pending} pending, ${counts.running} running, ${counts.completed} done, ${counts.failed} failed`,
      `Manager: ${this.managerStatus.status}`,
    ];
    for (const b of this.builderStatuses) {
      parts.push(`${b.agentId}: ${b.status}`);
    }
    if (awaitingApproval.length > 0) {
      parts.push(`AWAITING YOUR APPROVAL: ${awaitingApproval.map(d => `[${d.id}] "${d.instruction.slice(0, 50)}"`).join(", ")}`);
    }
    return parts.join(". ");
  }

  /**
   * Use OpenAI to generate an intelligent plan summary for a directive.
   */
  async generatePlanSummary(directiveId: string): Promise<string> {
    const directive = this.directiveStore.getById(directiveId);
    if (!directive) return "Directive not found.";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.log("manager-alpha", "openai_unavailable", "OpenAI API key not configured, using heuristic summary.", {
        directiveId,
        level: "warn",
      });
      return `Directive "${directive.instruction}" assigned to ${directive.assignee}, status: ${directive.status}.`;
    }

    try {
      const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
      const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
      const response = await fetch(`${baseUrl}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions: [
            "You are Gail's manager agent. Analyze the directive and produce a concise execution plan.",
            "Include: priority assessment, recommended steps, estimated complexity, risks.",
            "Be direct and practical. Keep it under 200 words.",
          ].join(" "),
          input: [
            `Directive: ${directive.instruction}`,
            `Priority: ${directive.priority}`,
            `Assignee: ${directive.assignee}`,
            `Status: ${directive.status}`,
            directive.context ? `Context: ${JSON.stringify(directive.context)}` : "",
          ].filter(Boolean).join("\n"),
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenAI request failed (${response.status}): ${body}`);
      }

      const payload = await response.json() as { output?: Array<{ content?: Array<{ text?: string }> }> };
      const text = payload.output?.[0]?.content?.[0]?.text ?? "";

      this.log("manager-alpha", "plan_generated", `OpenAI plan generated for directive ${directiveId}.`, {
        directiveId,
        result: text.slice(0, 200),
      });

      return text || "Plan generation returned empty result.";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log("manager-alpha", "plan_generation_failed", `OpenAI plan failed for ${directiveId}: ${message}`, {
        directiveId,
        level: "error",
      });
      return `Plan generation failed: ${message}`;
    }
  }

  /**
   * Use OpenAI to summarize recent agent activity for the operator.
   */
  async generateActivitySummary(): Promise<string> {
    const recentLogs = this.agentLogService?.getRecentLogs(undefined, 30) ?? [];
    const recentDirectives = this.directiveStore.list(undefined, 10);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || recentLogs.length === 0) {
      const counts = (this.directiveStore as SqliteDirectiveRepository).countByStatus();
      return `Manager report: ${counts.total} total directives — ${counts.completed} completed, ${counts.running} running, ${counts.pending} pending, ${counts.failed} failed.`;
    }

    try {
      const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
      const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
      const response = await fetch(`${baseUrl}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions: "You are Gail's manager agent. Summarize recent agent activity for the operator. Be concise, highlight completions, failures, and blockers. Under 150 words.",
          input: [
            "Recent log entries:",
            ...recentLogs.slice(0, 15).map((l) => `[${l.timestamp}] ${l.agentId}: ${l.action} — ${l.details}`),
            "",
            "Recent directives:",
            ...recentDirectives.map((d) => `${d.id} (${d.status}): ${d.instruction.slice(0, 80)}`),
          ].join("\n"),
        }),
      });

      if (!response.ok) return `Activity summary unavailable (API error ${response.status}).`;

      const payload = await response.json() as { output?: Array<{ content?: Array<{ text?: string }> }> };
      return payload.output?.[0]?.content?.[0]?.text ?? "No summary available.";
    } catch {
      return "Activity summary generation failed.";
    }
  }

  /**
   * Polls running directives and updates their status from linked workflows.
   */
  refreshDirectiveStatuses(): void {
    const active = this.directiveStore.list("dispatched", 100)
      .concat(this.directiveStore.list("running", 100));

    let completedInRefresh = 0;
    let failedInRefresh = 0;

    for (const directive of active) {
      if (!directive.workflowId) continue;

      const workflow = this.workflowService.getById(directive.workflowId);
      if (!workflow) continue;

      const allSteps = workflow.steps;
      const completed = allSteps.length > 0 && allSteps.every((s) => s.status === "completed");
      const failed = allSteps.some((s) => s.status === "blocked");
      const hasReadySteps = allSteps.some((s) => s.status === "ready");

      if (completed) {
        const result = `Workflow '${workflow.title}' completed — all ${allSteps.length} steps done.`;
        this.markAwaitingGailApproval(directive, result);
        completedInRefresh++;
      } else if (failed) {
        const blockedStep = allSteps.find((s) => s.status === "blocked");
        directive.status = "failed";
        directive.error = `Step '${blockedStep?.title}' blocked: ${blockedStep?.lastError ?? "unknown reason"}`;
        directive.updatedAt = new Date().toISOString();
        this.directiveStore.update(directive);
        this.managerStatus.failedCount++;
        this.incrementBuilderFailed(directive.assignee);
        this.freeBuilder(directive.assignee);
        failedInRefresh++;

        this.log("manager-alpha", "directive_failed", `Directive ${directive.id} failed: ${directive.error}`, {
          directiveId: directive.id,
          level: "error",
        });
        this.systemStatusService.recordError(
          "manager-agent",
          `Directive ${directive.id} failed: ${directive.error}`,
        );
        this.notifyCompletion(directive);
      } else if (hasReadySteps) {
        // Auto-resume: there are ready steps that haven't been picked up yet
        if (directive.status === "dispatched") {
          directive.status = "running";
          directive.updatedAt = new Date().toISOString();
          this.directiveStore.update(directive);
        }

        const syntheticMeta: RequestMeta = {
          authMode: "open",
          mode: "work",
          deviceType: "service",
          explicitLocalSave: false,
          authenticated: true,
          identitySource: "headers",
        };

        // Fire-and-forget: run steps in background, next refresh cycle will capture completion
        this.autoRunWorkflowSteps(directive, syntheticMeta).catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.systemStatusService.recordError("manager-agent", `Refresh auto-run error for ${directive.id}: ${msg}`);
        });
      } else if (directive.status === "dispatched") {
        directive.status = "running";
        directive.updatedAt = new Date().toISOString();
        this.directiveStore.update(directive);

        this.log("manager-alpha", "directive_running", `Directive ${directive.id} now running.`, {
          directiveId: directive.id,
        });
      }
    }

    if (completedInRefresh > 0 || failedInRefresh > 0) {
      this.log("manager-alpha", "refresh_cycle", `Refresh completed: ${completedInRefresh} completed, ${failedInRefresh} failed.`);
    }

    // Update manager idle state
    const stillActive = this.directiveStore.list("dispatched", 1).length > 0
      || this.directiveStore.list("running", 1).length > 0
      || this.directiveStore.list("pending", 1).length > 0;
    if (!stillActive) {
      this.managerStatus.status = "idle";
      this.managerStatus.currentDirectiveId = undefined;
    }
  }

  /**
   * Stop the periodic refresh loop (for clean shutdown).
   */
  stopRefreshLoop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
      this.log("manager-alpha", "refresh_stopped", "Periodic refresh loop stopped.");
    }
  }

  private startRefreshLoop(): void {
    this.refreshTimer = setInterval(() => {
      try {
        this.refreshDirectiveStatuses();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.systemStatusService.recordError("manager-agent", `Refresh cycle error: ${msg}`);
      }
    }, REFRESH_INTERVAL_MS);

    // Prevent the timer from keeping Node alive if this is the last reference
    if (this.refreshTimer && typeof this.refreshTimer === "object" && "unref" in this.refreshTimer) {
      (this.refreshTimer as { unref: () => void }).unref();
    }
  }

  private dispatch(directive: ManagerDirective): void {
    this.managerStatus.status = "busy";
    this.managerStatus.currentDirectiveId = directive.id;
    this.managerStatus.lastActiveAt = new Date().toISOString();

    // Mark builder busy
    this.markBuilderBusy(directive.assignee, directive.id);

    // Create a workflow for this directive
    try {
      const workflow = this.workflowService.create({
        title: `Manager Directive: ${directive.instruction.slice(0, 80)}`,
        objective: directive.instruction,
      });
      directive.workflowId = workflow.id;
      directive.status = "dispatched";
      directive.updatedAt = new Date().toISOString();
      this.directiveStore.update(directive);

      this.log("manager-alpha", "directive_dispatched", `Dispatched directive ${directive.id} → workflow ${workflow.id}, assignee: ${directive.assignee}.`, {
        directiveId: directive.id,
        result: `workflow=${workflow.id}`,
      });

      // Auto-plan the workflow and begin executing steps
      const syntheticMeta: RequestMeta = {
        authMode: "open",
        mode: "work",
        deviceType: "service",
        explicitLocalSave: false,
        authenticated: true,
        identitySource: "headers",
      };

      try {
        const planResult = this.workflowService.planWorkflow(workflow.id, syntheticMeta);
        directive.status = "running";
        directive.updatedAt = new Date().toISOString();
        this.directiveStore.update(directive);

        this.log("manager-alpha", "workflow_planned", `Planned ${planResult.workflow.steps.length} step(s) for workflow ${workflow.id}.`, {
          directiveId: directive.id,
          result: `steps=${planResult.workflow.steps.length}`,
        });

        // Auto-execute ready steps in the background
        this.autoRunWorkflowSteps(directive, syntheticMeta).catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.log("manager-alpha", "auto_run_error", `Auto-run error for directive ${directive.id}: ${msg}`, {
            directiveId: directive.id,
            level: "error",
          });
        });
      } catch (planError) {
        const msg = planError instanceof Error ? planError.message : String(planError);
        this.log("manager-alpha", "plan_failed", `Failed to plan workflow ${workflow.id}: ${msg}`, {
          directiveId: directive.id,
          level: "error",
        });
        // Workflow created but planning failed — leave as dispatched so refresh loop can retry
      }
    } catch (error) {
      directive.status = "failed";
      directive.error = error instanceof Error ? error.message : String(error);
      directive.updatedAt = new Date().toISOString();
      this.directiveStore.update(directive);
      this.managerStatus.failedCount++;
      this.freeBuilder(directive.assignee);

      this.log("manager-alpha", "dispatch_failed", `Failed to dispatch directive ${directive.id}: ${directive.error}`, {
        directiveId: directive.id,
        level: "error",
      });
      this.systemStatusService.recordError(
        "manager-agent",
        `Failed to dispatch directive ${directive.id}: ${directive.error}`,
      );
      this.notifyCompletion(directive);
    }

    // Update manager status
    const stillActive = this.directiveStore.list("dispatched", 1).length > 0
      || this.directiveStore.list("running", 1).length > 0
      || this.directiveStore.list("pending", 1).length > 0;
    if (!stillActive) {
      this.managerStatus.status = "idle";
      this.managerStatus.currentDirectiveId = undefined;
    }
  }

  /**
   * Sequentially execute all ready steps in a directive's workflow.
   * Runs asynchronously after dispatch planning.
   */
  private async autoRunWorkflowSteps(directive: ManagerDirective, meta: RequestMeta): Promise<void> {
    if (!directive.workflowId) return;

    let workflow = this.workflowService.getById(directive.workflowId);
    if (!workflow) return;

    let safetyCounter = 0;
    const maxSteps = 50; // prevent infinite loops

    while (safetyCounter < maxSteps) {
      workflow = this.workflowService.getById(directive.workflowId);
      if (!workflow) break;

      const readyStep = workflow.steps.find((s) => s.status === "ready");
      if (!readyStep) break; // no more ready steps

      safetyCounter++;
      try {
        this.log("manager-alpha", "auto_step_start", `Auto-running step "${readyStep.title}" (${readyStep.id}) for directive ${directive.id}.`, {
          directiveId: directive.id,
        });

        const result = await this.workflowService.runStep(directive.workflowId, readyStep.id, meta);

        this.log("manager-alpha", "auto_step_done", `Step "${readyStep.title}" completed → ${result.step?.status ?? "unknown"}.`, {
          directiveId: directive.id,
          result: result.step?.status ?? "unknown",
        });
      } catch (stepError) {
        const msg = stepError instanceof Error ? stepError.message : String(stepError);
        this.log("manager-alpha", "auto_step_failed", `Step "${readyStep.title}" failed: ${msg}`, {
          directiveId: directive.id,
          level: "error",
        });
        // Step marked as failed inside runStep — break so refresh loop handles the directive failure
        break;
      }
    }

    // After running steps, trigger a refresh to update directive status (completed, awaiting_gail_approval, etc.)
    this.refreshDirectiveStatuses();
  }

  private pickAssignee(): "ai" | "codex" | "human" {
    const agents = this.buildControlService.getAgents();
    const sorted = agents
      .filter((a) => a.assignee !== "human")
      .sort((a, b) => a.pendingApprovalCount - b.pendingApprovalCount);
    return (sorted[0]?.assignee as "ai" | "codex") ?? "ai";
  }

  private markBuilderBusy(assignee: "ai" | "codex" | "human", directiveId: string): void {
    const builder = this.builderStatuses.find((b) =>
      (assignee === "ai" && b.agentId === "builder-a") ||
      (assignee === "codex" && b.agentId === "builder-b") ||
      (assignee === "human" && b.agentId === "builder-a"),
    );
    if (builder) {
      builder.status = "busy";
      builder.currentDirectiveId = directiveId;
      builder.lastActiveAt = new Date().toISOString();
    }
  }

  private freeBuilder(assignee: "ai" | "codex" | "human"): void {
    const builder = this.builderStatuses.find((b) =>
      (assignee === "ai" && b.agentId === "builder-a") ||
      (assignee === "codex" && b.agentId === "builder-b") ||
      (assignee === "human" && b.agentId === "builder-a"),
    );
    if (builder) {
      builder.status = "idle";
      builder.currentDirectiveId = undefined;
    }
  }

  private incrementBuilderCompleted(assignee: "ai" | "codex" | "human"): void {
    const builder = this.builderStatuses.find((b) =>
      (assignee === "ai" && b.agentId === "builder-a") ||
      (assignee === "codex" && b.agentId === "builder-b"),
    );
    if (builder) builder.completedCount++;
  }

  private incrementBuilderFailed(assignee: "ai" | "codex" | "human"): void {
    const builder = this.builderStatuses.find((b) =>
      (assignee === "ai" && b.agentId === "builder-a") ||
      (assignee === "codex" && b.agentId === "builder-b"),
    );
    if (builder) builder.failedCount++;
  }

  private notifyCompletion(directive: ManagerDirective): void {
    for (const callback of this.completionCallbacks) {
      try {
        callback(directive);
      } catch {
        // swallow callback errors
      }
    }
  }

  private log(
    agentId: string,
    action: string,
    details: string,
    options: { directiveId?: string; result?: string; level?: "info" | "warn" | "error" | "debug" } = {},
  ): void {
    this.agentLogService?.log(agentId, action, details, options);
  }
}
