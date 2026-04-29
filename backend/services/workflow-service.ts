import type {
  ConversationProviderKind,
  CreateWorkflowContextItemInput,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  UpdateWorkflowStepInput,
  BuildApprovalDecision,
  PlanWorkflowInput,
  Workflow,
  WorkflowArtifact,
  WorkflowContextItem,
  WorkflowExecutionResult,
  WorkflowStep,
  WorkflowStepKind,
  WorkflowStepStatus,
} from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { RequestMeta } from "../api/request-meta";
import { HttpError } from "../api/http-error";
import type { WorkflowStore } from "../db";
import { SqliteWorkflowRepository } from "../db";
import { MemoryService } from "./memory-service";
import { NoteService } from "./note-service";
import { ProjectService } from "./project-service";
import type { ConversationProvider, ConversationGenerationOutput } from "../providers";

export class WorkflowService {
  constructor(
    private readonly repository: WorkflowStore = new SqliteWorkflowRepository(),
    private readonly providers: Record<ConversationProviderKind, ConversationProvider>,
    private readonly memoryService = new MemoryService(),
    private readonly noteService = new NoteService(),
    private readonly projectService = new ProjectService(),
  ) {}

  list(): Workflow[] {
    return this.repository.list();
  }

  getById(id: string): Workflow | undefined {
    return this.repository.getById(id);
  }

  create(input: CreateWorkflowInput): Workflow {
    if (input.projectId && !this.projectService.getById(input.projectId)) {
      throw new HttpError(404, `Project ${input.projectId} not found for workflow creation.`);
    }

    const now = new Date().toISOString();
    const workflow: Workflow = {
      id: createScaffoldId("workflow"),
      title: input.title,
      objective: input.objective,
      status: "draft",
      projectId: input.projectId,
      providerPreference: input.providerPreference ?? "openai",
      contextItems: (input.contextItems ?? []).map((item) => this.createContextItem(item)),
      steps: [],
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.create(workflow);
  }

  update(id: string, input: UpdateWorkflowInput): Workflow | undefined {
    const current = this.repository.getById(id);
    if (!current) {
      return undefined;
    }

    if (input.projectId && !this.projectService.getById(input.projectId)) {
      throw new HttpError(404, `Project ${input.projectId} not found for workflow update.`);
    }

    const next: Workflow = {
      ...current,
      title: input.title ?? current.title,
      objective: input.objective ?? current.objective,
      status: input.status ?? current.status,
      projectId: input.projectId ?? current.projectId,
      providerPreference: input.providerPreference ?? current.providerPreference,
      contextItems: input.contextItems ? input.contextItems.map((item) => this.createContextItem(item)) : current.contextItems,
      updatedAt: new Date().toISOString(),
    };

    return this.repository.update(next);
  }

  planWorkflow(id: string, meta: RequestMeta, input: PlanWorkflowInput = {}): WorkflowExecutionResult {
    const workflow = this.requireWorkflow(id);
    const plannedSteps = this.generatePlan(workflow, meta);
    const nextWorkflow: Workflow = {
      ...workflow,
      steps: input.replaceExistingSteps === false ? [...workflow.steps, ...plannedSteps] : plannedSteps,
      status: plannedSteps.length > 0 ? "planned" : workflow.status,
      updatedAt: new Date().toISOString(),
    };
    const saved = this.repository.update(nextWorkflow);
    const step = saved.steps[0];
    return {
      workflow: saved,
      step,
      usedProvider: this.canUseOpenAi(saved) ? saved.providerPreference : "heuristic",
      fellBack: !this.canUseOpenAi(saved),
      fallbackReason: this.canUseOpenAi(saved) ? undefined : "Workflow planning used the built-in heuristic planner because OpenAI is unavailable or local-llm was requested.",
    };
  }

  updateStep(workflowId: string, stepId: string, input: UpdateWorkflowStepInput): Workflow | undefined {
    const workflow = this.repository.getById(workflowId);
    if (!workflow) {
      return undefined;
    }

    const stepIndex = workflow.steps.findIndex((step) => step.id === stepId);
    if (stepIndex < 0) {
      throw new HttpError(404, `Workflow step ${stepId} not found.`);
    }

    const nextStep: WorkflowStep = {
      ...workflow.steps[stepIndex],
      title: input.title ?? workflow.steps[stepIndex].title,
      instruction: input.instruction ?? workflow.steps[stepIndex].instruction,
      status: input.status ?? workflow.steps[stepIndex].status,
      assignee: input.assignee ?? workflow.steps[stepIndex].assignee,
      requiresReview: input.requiresReview ?? workflow.steps[stepIndex].requiresReview,
      lastError: input.status === "failed" ? workflow.steps[stepIndex].lastError : undefined,
    };

    const nextSteps = syncReadyStatuses(workflow.steps.map((step, index) => (index === stepIndex ? nextStep : step)));
    const nextWorkflow: Workflow = {
      ...workflow,
      steps: nextSteps,
      status: deriveWorkflowStatus(nextSteps),
      updatedAt: new Date().toISOString(),
    };

    return this.repository.update(nextWorkflow);
  }

  submitStepForReview(
    workflowId: string,
    stepId: string,
    submission: {
      summary: string;
      artifactPaths?: string[];
    },
  ): Workflow {
    const workflow = this.requireWorkflow(workflowId);
    const stepIndex = workflow.steps.findIndex((step) => step.id === stepId);
    if (stepIndex < 0) {
      throw new HttpError(404, `Workflow step ${stepId} not found.`);
    }

    const currentStep = workflow.steps[stepIndex];
    const evidenceLines = [
      `Submission summary: ${submission.summary.trim() || "No summary provided."}`,
      "",
      "Evidence paths:",
      ...(submission.artifactPaths && submission.artifactPaths.length > 0
        ? submission.artifactPaths.map((path) => `- ${path}`)
        : ["- none"]),
    ];
    const submissionArtifact: WorkflowArtifact = {
      id: createScaffoldId("workflow_artifact"),
      kind: "report",
      title: "Step Submission",
      content: evidenceLines.join("\n"),
      mimeType: "text/markdown",
    };
    const nextStep: WorkflowStep = {
      ...currentStep,
      status: "needs_review",
      requiresReview: true,
      artifacts: [...currentStep.artifacts, submissionArtifact],
      lastError: undefined,
    };
    const nextSteps = syncReadyStatuses(replaceStep(workflow.steps, stepIndex, nextStep));
    const nextWorkflow: Workflow = {
      ...workflow,
      steps: nextSteps,
      status: deriveWorkflowStatus(nextSteps),
      updatedAt: new Date().toISOString(),
    };
    return this.repository.update(nextWorkflow);
  }

  decideSubmittedStep(
    workflowId: string,
    stepId: string,
    decision: BuildApprovalDecision,
    notes?: string,
  ): Workflow {
    const workflow = this.requireWorkflow(workflowId);
    const stepIndex = workflow.steps.findIndex((step) => step.id === stepId);
    if (stepIndex < 0) {
      throw new HttpError(404, `Workflow step ${stepId} not found.`);
    }

    const currentStep = workflow.steps[stepIndex];
    const decisionArtifact: WorkflowArtifact = {
      id: createScaffoldId("workflow_artifact"),
      kind: "review_checklist",
      title: "Approval Decision",
      content: [
        `Decision: ${decision}`,
        notes?.trim() ? `Notes: ${notes.trim()}` : "Notes: none",
      ].join("\n"),
      mimeType: "text/markdown",
    };
    const nextStatus: WorkflowStepStatus = decision === "approve"
      ? "completed"
      : decision === "request_changes"
        ? "blocked"
        : "blocked";
    const nextStep: WorkflowStep = {
      ...currentStep,
      status: nextStatus,
      artifacts: [...currentStep.artifacts, decisionArtifact],
      lastError: decision === "approve" ? undefined : (notes?.trim() || "Blocked by reviewer."),
      requiresReview: decision !== "approve",
    };
    const nextSteps = syncReadyStatuses(replaceStep(workflow.steps, stepIndex, nextStep));
    const nextWorkflow: Workflow = {
      ...workflow,
      steps: nextSteps,
      status: deriveWorkflowStatus(nextSteps),
      updatedAt: new Date().toISOString(),
    };
    return this.repository.update(nextWorkflow);
  }

  findStepById(stepId: string): { workflow: Workflow; step: WorkflowStep } | undefined {
    const workflow = this.repository.list().find((entry) => entry.steps.some((step) => step.id === stepId));
    if (!workflow) {
      return undefined;
    }
    const step = workflow.steps.find((candidate) => candidate.id === stepId);
    if (!step) {
      return undefined;
    }
    return { workflow, step };
  }

  async runStep(workflowId: string, stepId: string, meta: RequestMeta): Promise<WorkflowExecutionResult> {
    const workflow = this.requireWorkflow(workflowId);
    const stepIndex = workflow.steps.findIndex((entry) => entry.id === stepId);
    if (stepIndex < 0) {
      throw new HttpError(404, `Workflow step ${stepId} not found.`);
    }

    const currentStep = workflow.steps[stepIndex];
    const blockedDependency = currentStep.dependsOnStepIds.find((dependencyId) => {
      const dependency = workflow.steps.find((candidate) => candidate.id === dependencyId);
      return dependency && dependency.status !== "completed";
    });
    if (blockedDependency) {
      throw new HttpError(409, `Workflow step ${stepId} is blocked by dependency ${blockedDependency}.`);
    }

    const runningStep: WorkflowStep = {
      ...currentStep,
      status: "running",
      lastError: undefined,
    };
    this.repository.update({
      ...workflow,
      steps: replaceStep(workflow.steps, stepIndex, runningStep),
      status: "active",
      updatedAt: new Date().toISOString(),
    });

    try {
      const contextText = this.buildContextText(workflow, meta);
      const result = await this.generateStepArtifacts(workflow, currentStep, contextText, meta);
      const nextStep: WorkflowStep = {
        ...currentStep,
        artifacts: result.artifacts,
        status: result.status,
        requiresReview: result.requiresReview,
        lastRunAt: new Date().toISOString(),
        lastError: undefined,
      };
      const nextSteps = syncReadyStatuses(replaceStep(workflow.steps, stepIndex, nextStep));
      const nextWorkflow: Workflow = {
        ...workflow,
        steps: nextSteps,
        status: deriveWorkflowStatus(nextSteps),
        updatedAt: new Date().toISOString(),
      };
      const saved = this.repository.update(nextWorkflow);
      return {
        workflow: saved,
        step: saved.steps[stepIndex],
        usedProvider: result.usedProvider,
        fellBack: result.fellBack,
        fallbackReason: result.fallbackReason,
      };
    } catch (error) {
      const nextStep: WorkflowStep = {
        ...currentStep,
        status: "failed",
        lastError: error instanceof Error ? error.message : String(error),
        lastRunAt: new Date().toISOString(),
      };
      this.repository.update({
        ...workflow,
        steps: replaceStep(workflow.steps, stepIndex, nextStep),
        status: "active",
        updatedAt: new Date().toISOString(),
      });
      throw error;
    }
  }

  private createContextItem(input: CreateWorkflowContextItemInput): WorkflowContextItem {
    return {
      id: createScaffoldId("workflow_context"),
      title: input.title,
      body: input.body,
      sourceType: input.sourceType ?? "manual",
      sourceId: input.sourceId,
    };
  }

  private requireWorkflow(id: string): Workflow {
    const workflow = this.repository.getById(id);
    if (!workflow) {
      throw new HttpError(404, `Workflow ${id} not found.`);
    }

    return workflow;
  }

  private generatePlan(workflow: Workflow, meta: RequestMeta): WorkflowStep[] {
    const contextSummary = this.buildContextText(workflow, meta);
    const preferShellBuildPlan = isShellBuildWorkflow(workflow, contextSummary);
    if (!this.canUseOpenAi(workflow)) {
      return preferShellBuildPlan ? createShellBuildPlan(workflow, contextSummary) : createHeuristicPlan(workflow, contextSummary);
    }

    return preferShellBuildPlan ? createShellBuildPlan(workflow, contextSummary) : createHeuristicPlan(workflow, contextSummary);
  }

  private canUseOpenAi(workflow: Workflow): boolean {
    return workflow.providerPreference === "openai" && this.providers.openai.getStatus().available;
  }

  private buildContextText(workflow: Workflow, meta: RequestMeta): string {
    const itemSections = workflow.contextItems
      .map((item, index) => `${index + 1}. ${item.title}\n${item.body}`)
      .join("\n\n");
    const memorySections = meta.mode === "private"
      ? ""
      : this.memoryService.recallRecent(3).map((entry, index) => `Memory ${index + 1}: ${entry.title}\n${entry.body}`).join("\n\n");
    const noteSections = workflow.projectId
      ? this.noteService.listForMode(meta)
        .filter((note) => note.projectId === workflow.projectId)
        .slice(0, 3)
        .map((note, index) => `Project note ${index + 1}: ${note.title}\n${note.body}`)
        .join("\n\n")
      : "";

    return [itemSections, memorySections, noteSections].filter((value) => value.trim().length > 0).join("\n\n");
  }

  private async generateStepArtifacts(
    workflow: Workflow,
    step: WorkflowStep,
    contextText: string,
    meta: RequestMeta,
  ): Promise<{
    artifacts: WorkflowArtifact[];
    status: WorkflowStepStatus;
    requiresReview: boolean;
    usedProvider: ConversationProviderKind | "heuristic";
    fellBack: boolean;
    fallbackReason?: string;
  }> {
    if (!this.canUseOpenAi(workflow)) {
      return createHeuristicArtifacts(workflow, step, contextText);
    }

    const prompt = buildExecutionPrompt(workflow, step, contextText);
    try {
      const output = await this.providers.openai.generateReply({
        mode: meta.mode,
        sessionId: workflow.id,
        message: prompt,
        history: [],
        memory: { recent: meta.mode === "private" ? [] : this.memoryService.recallRecent(3) },
      });
      const artifacts = parseExecutionArtifacts(step.kind, output);
      return {
        artifacts,
        status: step.kind === "human_review" ? "completed" : (requiresReview(step.kind) ? "needs_review" : "completed"),
        requiresReview: requiresReview(step.kind),
        usedProvider: output.provider,
        fellBack: false,
      };
    } catch (error) {
      const heuristic = createHeuristicArtifacts(workflow, step, contextText);
      return {
        ...heuristic,
        fellBack: true,
        fallbackReason: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

function replaceStep(steps: WorkflowStep[], index: number, nextStep: WorkflowStep): WorkflowStep[] {
  return steps.map((step, currentIndex) => (currentIndex === index ? nextStep : step));
}

function syncReadyStatuses(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((step) => {
    const dependenciesResolved = step.dependsOnStepIds.every((dependencyId) => {
      const dependency = steps.find((candidate) => candidate.id === dependencyId);
      return dependency && dependency.status === "completed";
    });

    if (step.status === "pending" && dependenciesResolved) {
      return {
        ...step,
        status: "ready",
      };
    }

    return step;
  });
}

function isShellBuildWorkflow(workflow: Workflow, contextText: string): boolean {
  const haystack = [workflow.title, workflow.objective, contextText].join("\n").toLowerCase();
  const strongSignals = [
    "professional shell",
    "shell build",
    "operator shell",
    "avatar system",
    "animation viewer",
    "talk animation",
    "listen animation",
    "idle animation",
    "playcanvas",
    "workflow interface",
  ];
  return strongSignals.some((signal) => haystack.includes(signal));
}

function deriveWorkflowStatus(steps: WorkflowStep[]): Workflow["status"] {
  if (steps.length === 0) {
    return "draft";
  }
  if (steps.some((step) => step.status === "needs_review")) {
    return "waiting_review";
  }
  if (steps.every((step) => step.status === "completed")) {
    return "done";
  }
  if (steps.some((step) => step.status === "running" || step.status === "completed")) {
    return "active";
  }
  return "planned";
}

function createShellBuildPlan(workflow: Workflow, contextText: string): WorkflowStep[] {
  const hasContext = contextText.trim().length > 0;
  const stepTemplates: Array<{
    kind: WorkflowStepKind;
    title: string;
    instruction: string;
    assignee: WorkflowStep["assignee"];
    requiresReview: boolean;
  }> = [
    {
      kind: "document_summary",
      title: "Phase 1 - Baseline and Constraints",
      instruction: hasContext
        ? "Summarize the current shell state, animation mappings, blockers, and hard requirements from the supplied context."
        : "Summarize current shell status from objective only, and list missing technical constraints that must be confirmed.",
      assignee: "ai",
      requiresReview: false,
    },
    {
      kind: "data_compile",
      title: "Phase 2 - Implementation Backlog",
      instruction: "Compile a concrete build backlog with prioritized tasks for interface polish, animation wiring, and runtime stability.",
      assignee: "ai",
      requiresReview: false,
    },
    {
      kind: "codex_agent",
      title: "Phase 3 - Shell Interface Build",
      instruction: "Generate the execution brief for implementing shell interface updates with acceptance criteria and verification steps.",
      assignee: "codex",
      requiresReview: true,
    },
    {
      kind: "codex_agent",
      title: "Phase 4 - Animation Runtime Integration",
      instruction: "Generate the execution brief for integrating idle/listen/talk mappings while preserving facial morph and viseme behavior.",
      assignee: "codex",
      requiresReview: true,
    },
    {
      kind: "data_compile",
      title: "Phase 5 - QA and Regression Pass",
      instruction: "Compile verification results, defects, and remaining risk. Include viewer, runtime, and workflow-tracking checks.",
      assignee: "ai",
      requiresReview: false,
    },
    {
      kind: "draft_email",
      title: "Phase 6 - Operator Hand-off Report",
      instruction: "Draft a concise operator-ready completion report with what shipped, what changed, and immediate next actions.",
      assignee: "ai",
      requiresReview: true,
    },
    {
      kind: "human_review",
      title: "Phase 7 - Final Approval Gate",
      instruction: "Review completion evidence, outstanding risks, and approve the workflow as the active interface for ongoing shell delivery.",
      assignee: "human",
      requiresReview: true,
    },
  ];

  const generatedIds = stepTemplates.map(() => createScaffoldId("workflow_step"));
  return stepTemplates.map((template, index) => ({
    id: generatedIds[index],
    kind: template.kind,
    title: template.title,
    instruction: template.instruction,
    status: index === 0 ? "ready" : "pending",
    dependsOnStepIds: index === 0 ? [] : [generatedIds[index - 1]],
    assignee: template.assignee,
    artifacts: [],
    requiresReview: template.requiresReview,
  }));
}

function createHeuristicPlan(workflow: Workflow, contextText: string): WorkflowStep[] {
  const hasContext = contextText.trim().length > 0;
  const stepTemplates: Array<{
    kind: WorkflowStepKind;
    title: string;
    instruction: string;
    assignee: WorkflowStep["assignee"];
    requiresReview: boolean;
  }> = [
    {
      kind: "document_summary",
      title: "Summarize working context",
      instruction: hasContext
        ? "Read the workflow context and extract the core facts, constraints, dates, and open questions."
        : "No supporting documents were attached, so summarize the objective and identify missing information.",
      assignee: "ai",
      requiresReview: false,
    },
    {
      kind: "data_compile",
      title: "Compile structured findings",
      instruction: "Turn the workflow context into a compact factual brief with bullet evidence and recommended next actions.",
      assignee: "ai",
      requiresReview: false,
    },
    {
      kind: "draft_email",
      title: "Prepare email reply",
      instruction: "Draft a crisp reply email that advances the workflow objective and calls out any decisions or approvals needed.",
      assignee: "ai",
      requiresReview: true,
    },
    {
      kind: "fill_form",
      title: "Prepare form answers",
      instruction: "Prepare field-by-field form answers from the available context and mark assumptions clearly.",
      assignee: "ai",
      requiresReview: true,
    },
    {
      kind: "codex_agent",
      title: "Create Codex agent brief",
      instruction: "Write a handoff prompt for a Codex agent with clear scope, inputs, deliverables, and completion criteria.",
      assignee: "codex",
      requiresReview: true,
    },
    {
      kind: "human_review",
      title: "Operator review gate",
      instruction: "Review the compiled findings, email draft, form answers, and agent brief before executing anything externally.",
      assignee: "human",
      requiresReview: true,
    },
  ];

  const generatedIds = stepTemplates.map(() => createScaffoldId("workflow_step"));
  return stepTemplates.map((template, index) => ({
    id: generatedIds[index],
    kind: template.kind,
    title: template.title,
    instruction: template.instruction,
    status: index === 0 ? "ready" : "pending",
    dependsOnStepIds: index === 0 ? [] : [generatedIds[index - 1]],
    assignee: template.assignee,
    artifacts: [],
    requiresReview: template.requiresReview,
  }));
}

function createHeuristicArtifacts(
  workflow: Workflow,
  step: WorkflowStep,
  contextText: string,
): {
  artifacts: WorkflowArtifact[];
  status: WorkflowStepStatus;
  requiresReview: boolean;
  usedProvider: "heuristic";
  fellBack: boolean;
} {
  const objective = workflow.objective.trim();
  const excerpt = contextText.trim().slice(0, 1200) || "No additional context was attached.";
  switch (step.kind) {
    case "document_summary":
      return {
        artifacts: [createArtifact("summary", "Context Summary", [
          `Objective: ${objective}`,
          "",
          "Working context:",
          excerpt,
        ].join("\n"), "text/markdown")],
        status: "completed",
        requiresReview: false,
        usedProvider: "heuristic",
        fellBack: true,
      };
    case "data_compile":
      return {
        artifacts: [createArtifact("report", "Compiled Findings", [
          `Workflow: ${workflow.title}`,
          `Objective: ${objective}`,
          "",
          "Evidence digest:",
          `- Context items attached: ${workflow.contextItems.length}`,
          `- Existing workflow steps: ${workflow.steps.length}`,
          `- Main need: ${objective}`,
          "",
          "Recommended next actions:",
          "- Review summary for missing facts.",
          "- Confirm external recipients and destinations before sending email or submitting forms.",
          "- Run the Codex agent brief for implementation or research tasks.",
        ].join("\n"), "text/markdown")],
        status: "completed",
        requiresReview: false,
        usedProvider: "heuristic",
        fellBack: true,
      };
    case "draft_email":
      return {
        artifacts: [
          createArtifact("email_subject", "Email Subject", `Re: ${workflow.title}`, "text/plain"),
          createArtifact("email_body", "Email Body", [
            "Hello,",
            "",
            `I reviewed the current material for "${workflow.title}".`,
            `The main objective is: ${objective}`,
            "",
            "Current summary:",
            excerpt.slice(0, 600),
            "",
            "Next proposed step:",
            "Please confirm the missing details or approvals so I can complete the workflow cleanly.",
            "",
            "Thanks,",
            "Gail",
          ].join("\n"), "text/markdown"),
        ],
        status: "needs_review",
        requiresReview: true,
        usedProvider: "heuristic",
        fellBack: true,
      };
    case "fill_form":
      return {
        artifacts: [createArtifact("form_fields", "Form Field Draft", JSON.stringify({
          workflowTitle: workflow.title,
          objective,
          summary: excerpt.slice(0, 500),
          assumptions: [
            "Confirm recipient organization and final submission target.",
            "Confirm any required dates, IDs, and attachments before submission.",
          ],
        }, null, 2), "application/json")],
        status: "needs_review",
        requiresReview: true,
        usedProvider: "heuristic",
        fellBack: true,
      };
    case "codex_agent":
      return {
        artifacts: [createArtifact("agent_brief", "Codex Agent Brief", [
          `Goal: ${objective}`,
          "",
          "Context:",
          excerpt.slice(0, 700),
          "",
          "Instructions for Codex:",
          "- Read the attached workflow context first.",
          "- Produce the minimal code, research, or structured output needed to advance the workflow.",
          "- Keep generated changes isolated and explain assumptions.",
          "- Return any missing information required from the operator before final execution.",
          "",
          "Definition of done:",
          "- Deliver a concrete result, not just analysis.",
          "- List files changed or artifacts produced.",
          "- Note any blockers or remaining review items.",
        ].join("\n"), "text/markdown")],
        status: "needs_review",
        requiresReview: true,
        usedProvider: "heuristic",
        fellBack: true,
      };
    case "human_review":
      return {
        artifacts: [createArtifact("review_checklist", "Review Checklist", [
          "- Confirm the summary is factually correct.",
          "- Confirm the compiled findings match the source material.",
          "- Confirm the email draft has the right audience and tone.",
          "- Confirm the form answers do not contain fabricated values.",
          "- Confirm the Codex agent brief has clear scope and acceptance criteria.",
        ].join("\n"), "text/markdown")],
        status: "completed",
        requiresReview: true,
        usedProvider: "heuristic",
        fellBack: true,
      };
  }
}

function createArtifact(
  kind: WorkflowArtifact["kind"],
  title: string,
  content: string,
  mimeType: WorkflowArtifact["mimeType"],
): WorkflowArtifact {
  return {
    id: createScaffoldId("workflow_artifact"),
    kind,
    title,
    content,
    mimeType,
  };
}

function buildExecutionPrompt(workflow: Workflow, step: WorkflowStep, contextText: string): string {
  return [
    "You are helping Gail run a structured workflow.",
    `Workflow title: ${workflow.title}`,
    `Workflow objective: ${workflow.objective}`,
    `Workflow step kind: ${step.kind}`,
    `Workflow step title: ${step.title}`,
    `Workflow step instruction: ${step.instruction}`,
    "",
    "Context:",
    contextText || "No context items were attached.",
    "",
    "Return a concise output suitable for an operator workflow. Use clear headings and avoid filler.",
  ].join("\n");
}

function parseExecutionArtifacts(kind: WorkflowStepKind, output: ConversationGenerationOutput): WorkflowArtifact[] {
  if (kind === "draft_email") {
    const [firstLine, ...rest] = output.content.split(/\r?\n/);
    const subject = firstLine.replace(/^subject:\s*/i, "").trim() || "Draft email";
    const body = rest.join("\n").trim() || output.content;
    return [
      createArtifact("email_subject", "Email Subject", subject, "text/plain"),
      createArtifact("email_body", "Email Body", body, "text/markdown"),
    ];
  }

  if (kind === "fill_form") {
    return [createArtifact("form_fields", "Form Field Draft", output.content, "text/markdown")];
  }

  if (kind === "codex_agent") {
    return [createArtifact("agent_brief", "Codex Agent Brief", output.content, "text/markdown")];
  }

  if (kind === "human_review") {
    return [createArtifact("review_checklist", "Review Checklist", output.content, "text/markdown")];
  }

  return [
    createArtifact(kind === "data_compile" ? "report" : "summary", "Workflow Output", output.content, "text/markdown"),
  ];
}

function requiresReview(kind: WorkflowStepKind): boolean {
  return ["draft_email", "fill_form", "codex_agent", "human_review"].includes(kind);
}
