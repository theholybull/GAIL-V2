import { spawn } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, resolve } from "node:path";
import type {
  BuildAgentLane,
  BuildOverview,
  BuildScriptRegistryEntry,
  BuildScriptRunInput,
  BuildScriptResultSummary,
  BuildScreenshotAnalyzeInput,
  BuildScreenshotCaptureInput,
  BuildStepApprovalInput,
  BuildStepSubmissionInput,
} from "../../shared/contracts/index";
import { HttpError } from "../api/http-error";
import { ChangeGovernanceService } from "./change-governance-service";
import { WorkflowService } from "./workflow-service";

interface ScreenshotEvidenceRecord {
  id: string;
  feature: string;
  screenshotPath: string;
  analysisPath: string;
  createdAt: string;
  stepId?: string;
}

interface ScreenshotAnalysisIssue {
  rule: "overflow" | "controls" | "text_clipping" | "contrast" | "alignment" | "interaction_targets";
  severity: "low" | "medium" | "high";
  message: string;
}

const MAX_CAPTURE_CHARS = 60000;

export class BuildControlService {
  private readonly repoRoot: string;
  private readonly screenshotRoot: string;
  private readonly analysisRoot: string;
  private readonly scriptsResultRoot: string;
  private readonly scriptRegistryPath: string;
  private readonly screenshotEvidenceIndexPath: string;

  constructor(
    private readonly workflowService: WorkflowService,
    private readonly governanceService: ChangeGovernanceService,
    repoRoot = resolve(process.cwd(), ".."),
  ) {
    this.repoRoot = repoRoot;
    this.screenshotRoot = resolve(this.repoRoot, "data", "reports", "ui-screenshots");
    this.analysisRoot = resolve(this.repoRoot, "data", "reports", "ui-analysis");
    this.scriptsResultRoot = resolve(this.repoRoot, "data", "reports", "build-scripts");
    this.scriptRegistryPath = resolve(this.repoRoot, "data", "build", "script-registry.json");
    this.screenshotEvidenceIndexPath = resolve(this.analysisRoot, "build-control-evidence-index.json");
  }

  getOverview(): BuildOverview {
    const workflows = this.workflowService.list();
    const steps = workflows.flatMap((workflow) => workflow.steps);
    const completedSteps = steps.filter((step) => step.status === "completed").length;
    const waitingReviewSteps = steps.filter((step) => step.status === "needs_review").length;
    const blockedSteps = steps.filter((step) => step.status === "blocked").length;
    const percentComplete = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
    const approvalQueue = workflows.flatMap((workflow) => workflow.steps
      .filter((step) => step.status === "needs_review")
      .map((step) => ({
        workflowId: workflow.id,
        workflowTitle: workflow.title,
        stepId: step.id,
        stepTitle: step.title,
        assignee: step.assignee,
        status: step.status,
        lastRunAt: step.lastRunAt,
        hasScreenshotEvidence: this.hasStepScreenshotEvidence(step.id),
      })));

    return {
      generatedAt: new Date().toISOString(),
      masterChecker: {
        status: workflows.length > 0 ? "active" : "idle",
        pendingApprovals: approvalQueue.length,
        blockedSteps,
      },
      progress: {
        workflowCount: workflows.length,
        stepCount: steps.length,
        completedSteps,
        percentComplete,
        waitingReviewSteps,
      },
      approvalQueue,
      workflows,
    };
  }

  getAgents(): BuildAgentLane[] {
    const workflows = this.workflowService.list();
    const lanes: BuildAgentLane[] = (["ai", "codex", "human"] as const).map((assignee) => {
      const assignedSteps = workflows.flatMap((workflow) => workflow.steps.map((step) => ({ workflow, step })))
        .filter((entry) => entry.step.assignee === assignee);
      const active = assignedSteps.find((entry) => ["running", "ready", "needs_review", "blocked"].includes(entry.step.status))
        ?? assignedSteps.find((entry) => entry.step.status !== "completed");
      const pendingApprovalCount = assignedSteps.filter((entry) => entry.step.status === "needs_review").length;
      const blocker = assignedSteps.find((entry) => entry.step.status === "blocked");
      return {
        laneId: `lane-${assignee}`,
        assignee,
        activeWorkflowId: active?.workflow.id,
        activeWorkflowTitle: active?.workflow.title,
        currentStepId: active?.step.id,
        currentStepTitle: active?.step.title,
        currentStepStatus: active?.step.status,
        pendingApprovalCount,
        blockerReason: blocker?.step.lastError,
      };
    });

    return lanes;
  }

  submitStep(stepId: string, input: BuildStepSubmissionInput) {
    const location = this.workflowService.findStepById(stepId);
    if (!location) {
      throw new HttpError(404, `Workflow step ${stepId} not found.`);
    }
    const workflow = this.workflowService.submitStepForReview(location.workflow.id, stepId, input);
    const governance = this.governanceService.submitChange({
      sourceType: "build_step",
      sourceId: stepId,
      title: `Build step submission: ${location.step.title}`,
      reason: input.summary,
      scope: [
        `workflow:${location.workflow.id}`,
        `step:${stepId}`,
      ],
      relatedArtifacts: input.artifactPaths ?? [],
      actor: "agent",
    });
    return {
      workflowId: workflow.id,
      stepId,
      changeId: governance.change.changeId,
      snapshotId: governance.snapshotId,
      status: "submitted_for_review",
      submittedAt: new Date().toISOString(),
    };
  }

  approveStep(stepId: string, input: BuildStepApprovalInput) {
    const location = this.workflowService.findStepById(stepId);
    if (!location) {
      throw new HttpError(404, `Workflow step ${stepId} not found.`);
    }
    const requireEvidence = input.requireScreenshotEvidence ?? true;
    if (input.decision === "approve" && requireEvidence && !this.hasStepScreenshotEvidence(stepId)) {
      throw new HttpError(409, `Step ${stepId} requires screenshot analysis evidence before approval.`);
    }
    const workflow = this.workflowService.decideSubmittedStep(
      location.workflow.id,
      stepId,
      input.decision,
      input.notes,
    );
    const pendingChange = this.governanceService.findPendingBySource("build_step", stepId);
    if (pendingChange) {
      this.governanceService.decideChange(pendingChange.changeId, {
        reviewer: "master_checker",
        decision: input.decision === "approve" ? "approve" : "reject",
        reason: input.notes,
      });
    }
    return {
      workflowId: workflow.id,
      stepId,
      changeId: pendingChange?.changeId,
      decision: input.decision,
      decidedAt: new Date().toISOString(),
    };
  }

  captureScreenshot(input: BuildScreenshotCaptureInput) {
    const feature = normalizeFeature(input.feature);
    const stamp = compactStamp(new Date());
    const folder = resolve(this.screenshotRoot, feature, stamp);
    mkdirSync(folder, { recursive: true });
    const extension = input.sourcePath ? extname(input.sourcePath) || ".png" : ".txt";
    const screenshotFile = resolve(folder, `capture${extension}`);
    if (input.sourcePath) {
      const absoluteSourcePath = resolve(this.repoRoot, input.sourcePath);
      if (!existsSync(absoluteSourcePath)) {
        throw new HttpError(404, `Screenshot source path not found: ${input.sourcePath}`);
      }
      copyFileSync(absoluteSourcePath, screenshotFile);
    } else {
      writeFileSync(
        screenshotFile,
        [
          "No source screenshot was provided.",
          "This placeholder capture exists so the build flow can continue in code-only environments.",
          `Generated at: ${new Date().toISOString()}`,
        ].join("\n"),
        "utf8",
      );
    }

    return {
      feature,
      capturedAt: new Date().toISOString(),
      screenshotPath: this.toRepoRelative(screenshotFile),
      label: input.label,
      stepId: input.stepId,
    };
  }

  analyzeScreenshot(input: BuildScreenshotAnalyzeInput) {
    const feature = normalizeFeature(input.feature);
    const screenshotPath = resolve(this.repoRoot, input.screenshotPath);
    if (!existsSync(screenshotPath)) {
      throw new HttpError(404, `Screenshot file not found: ${input.screenshotPath}`);
    }
    const stats = statSync(screenshotPath);
    const issues: ScreenshotAnalysisIssue[] = [];
    if (stats.size < 2000) {
      issues.push({
        rule: "controls",
        severity: "medium",
        message: "Image/file is very small. Validate that primary controls are visible and not clipped.",
      });
    }
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(extname(screenshotPath).toLowerCase())) {
      issues.push({
        rule: "interaction_targets",
        severity: "medium",
        message: "Input is not an image file. Replace placeholder with a real screenshot before final acceptance.",
      });
    }
    if (issues.length === 0) {
      issues.push({
        rule: "alignment",
        severity: "low",
        message: "No obvious structural issues from static heuristics. Manual visual confirmation still required.",
      });
    }

    const stamp = compactStamp(new Date());
    const folder = resolve(this.analysisRoot, feature);
    mkdirSync(folder, { recursive: true });
    const analysisPath = resolve(folder, `${stamp}.json`);
    const payload = {
      feature,
      createdAt: new Date().toISOString(),
      screenshotPath: this.toRepoRelative(screenshotPath),
      checks: {
        overflow: "manual_required",
        controls: "manual_required",
        text_clipping: "manual_required",
        contrast: "manual_required",
        alignment: "manual_required",
        interaction_targets: "manual_required",
      },
      issues,
      stepId: input.stepId,
    };
    writeFileSync(analysisPath, JSON.stringify(payload, null, 2), "utf8");
    this.recordScreenshotEvidence({
      id: `evidence-${stamp}`,
      feature,
      screenshotPath: payload.screenshotPath,
      analysisPath: this.toRepoRelative(analysisPath),
      createdAt: payload.createdAt,
      stepId: input.stepId,
    });
    return payload;
  }

  listScripts(): BuildScriptRegistryEntry[] {
    return this.loadScriptRegistry();
  }

  async runScript(input: BuildScriptRunInput): Promise<BuildScriptResultSummary> {
    const registry = this.loadScriptRegistry();
    const entry = registry.find((candidate) => candidate.id === input.id);
    if (!entry) {
      throw new HttpError(404, `Script ${input.id} not found in registry.`);
    }
    const scriptPath = resolve(this.repoRoot, entry.path);
    if (!existsSync(scriptPath)) {
      throw new HttpError(404, `Script file not found: ${entry.path}`);
    }
    const args = Array.isArray(input.args) ? input.args.filter((value) => value.trim().length > 0) : [];
    const commandArgs = ["-ExecutionPolicy", "Bypass", "-File", scriptPath, ...args];
    const startedAt = new Date().toISOString();
    const timer = Date.now();

    let result: { stdout: string; stderr: string; status: "completed" | "failed" };
    try {
      const commandResult = await this.runPowerShell(commandArgs);
      result = { ...commandResult, status: "completed" };
    } catch (error) {
      result = {
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        status: "failed",
      };
    }
    const endedAt = new Date().toISOString();
    const durationMs = Date.now() - timer;
    const resultId = `script-result-${Date.now()}`;
    const resultFolder = resolve(this.scriptsResultRoot, entry.id);
    mkdirSync(resultFolder, { recursive: true });
    const resultPath = resolve(resultFolder, `${compactStamp(new Date())}.json`);
    const payload = {
      id: resultId,
      scriptId: entry.id,
      scriptPath: entry.path,
      startedAt,
      endedAt,
      durationMs,
      status: result.status,
      command: ["powershell.exe", ...commandArgs].join(" "),
      stdout: result.stdout,
      stderr: result.stderr,
    };
    writeFileSync(resultPath, JSON.stringify(payload, null, 2), "utf8");
    this.updateScriptRegistryAfterRun(entry.id, payload.status, endedAt, resultId);
    return {
      id: resultId,
      scriptId: entry.id,
      status: payload.status,
      startedAt,
      endedAt,
      durationMs,
      command: payload.command,
      outputPath: this.toRepoRelative(resultPath),
    };
  }

  getScriptResults(scriptId: string): { scriptId: string; latest?: BuildScriptResultSummary; history: BuildScriptResultSummary[] } {
    const resultFolder = resolve(this.scriptsResultRoot, scriptId);
    if (!existsSync(resultFolder)) {
      return { scriptId, history: [] };
    }
    const files = readdirSync(resultFolder).filter((name) => name.endsWith(".json")).sort((a, b) => b.localeCompare(a));
    const history = files.slice(0, 20).map((fileName) => {
      const payload = JSON.parse(readFileSync(resolve(resultFolder, fileName), "utf8")) as {
        id: string;
        scriptId: string;
        status: "completed" | "failed";
        startedAt: string;
        endedAt: string;
        durationMs: number;
        command: string;
      };
      return {
        id: payload.id,
        scriptId: payload.scriptId,
        status: payload.status,
        startedAt: payload.startedAt,
        endedAt: payload.endedAt,
        durationMs: payload.durationMs,
        command: payload.command,
        outputPath: this.toRepoRelative(resolve(resultFolder, fileName)),
      };
    });
    return {
      scriptId,
      latest: history[0],
      history,
    };
  }

  private hasStepScreenshotEvidence(stepId: string): boolean {
    const records = this.readScreenshotEvidenceIndex();
    return records.some((entry) => entry.stepId === stepId);
  }

  private recordScreenshotEvidence(record: ScreenshotEvidenceRecord): void {
    const records = this.readScreenshotEvidenceIndex();
    const next = [record, ...records].slice(0, 500);
    mkdirSync(resolve(this.analysisRoot), { recursive: true });
    writeFileSync(this.screenshotEvidenceIndexPath, JSON.stringify(next, null, 2), "utf8");
  }

  private readScreenshotEvidenceIndex(): ScreenshotEvidenceRecord[] {
    if (!existsSync(this.screenshotEvidenceIndexPath)) {
      return [];
    }
    try {
      const payload = JSON.parse(readFileSync(this.screenshotEvidenceIndexPath, "utf8")) as ScreenshotEvidenceRecord[];
      return Array.isArray(payload) ? payload : [];
    } catch {
      return [];
    }
  }

  private loadScriptRegistry(): BuildScriptRegistryEntry[] {
    if (!existsSync(this.scriptRegistryPath)) {
      const seeded = this.defaultScriptRegistry();
      mkdirSync(dirname(this.scriptRegistryPath), { recursive: true });
      writeFileSync(this.scriptRegistryPath, JSON.stringify(seeded, null, 2), "utf8");
      return seeded;
    }
    try {
      const payload = JSON.parse(readFileSync(this.scriptRegistryPath, "utf8")) as BuildScriptRegistryEntry[];
      if (Array.isArray(payload) && payload.length > 0) {
        return payload;
      }
    } catch {
      // fall through
    }
    const seeded = this.defaultScriptRegistry();
    writeFileSync(this.scriptRegistryPath, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }

  private defaultScriptRegistry(): BuildScriptRegistryEntry[] {
    return [
      {
        id: "avatar-assets",
        name: "Avatar Assets Export",
        path: "tools/export-avatar-assets.ps1",
        type: "powershell",
        purpose: "Run modular avatar export and publish reports.",
        owner: "asset-pipeline",
        inputs: ["RuntimeProfile"],
        outputs: ["blender/animation_master/exports/reports/playcanvas_asset_export_report.json"],
        lastStatus: "never_run",
      },
      {
        id: "playcanvas-pipeline",
        name: "PlayCanvas Pipeline Export",
        path: "tools/export-playcanvas-pipeline.ps1",
        type: "powershell",
        purpose: "Run full pipeline export for runtime delivery.",
        owner: "asset-pipeline",
        inputs: ["RuntimeProfile", "IncludeReview"],
        outputs: ["blender/animation_master/exports/reports/regular_avatar_build_report.json"],
        lastStatus: "never_run",
      },
      {
        id: "animoxtend-check",
        name: "AnimoXTend Readiness Check",
        path: "tools/check-animoxtend-setup.ps1",
        type: "powershell",
        purpose: "Validate AnimoXTend local setup readiness.",
        owner: "pipeline-ops",
        inputs: [],
        outputs: ["console"],
        lastStatus: "never_run",
      },
    ];
  }

  private updateScriptRegistryAfterRun(scriptId: string, status: "completed" | "failed", runAt: string, resultId: string): void {
    const registry = this.loadScriptRegistry().map((entry) => entry.id === scriptId
      ? {
        ...entry,
        lastStatus: status,
        lastRunAt: runAt,
        lastResultId: resultId,
      }
      : entry);
    writeFileSync(this.scriptRegistryPath, JSON.stringify(registry, null, 2), "utf8");
  }

  private async runPowerShell(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return await new Promise<{ stdout: string; stderr: string }>((resolvePromise, rejectPromise) => {
      const child = spawn("powershell.exe", args, {
        cwd: this.repoRoot,
        windowsHide: true,
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout = appendCapturedText(stdout, String(chunk));
      });
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr = appendCapturedText(stderr, String(chunk));
      });
      child.on("error", (error) => rejectPromise(error));
      child.on("close", (code) => {
        if (code !== 0) {
          rejectPromise(new Error(stderr.trim() || stdout.trim() || `Script failed with exit code ${code ?? -1}.`));
          return;
        }
        resolvePromise({ stdout: stdout.trim(), stderr: stderr.trim() });
      });
    });
  }

  private toRepoRelative(absolutePath: string): string {
    return absolutePath.replace(`${this.repoRoot}\\`, "").replaceAll("\\", "/");
  }
}

function appendCapturedText(current: string, nextChunk: string): string {
  const combined = current + nextChunk;
  if (combined.length <= MAX_CAPTURE_CHARS) {
    return combined;
  }
  return combined.slice(combined.length - MAX_CAPTURE_CHARS);
}

function normalizeFeature(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  return normalized.length > 0 ? normalized : "general";
}

function compactStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}
