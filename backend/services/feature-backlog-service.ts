import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createScaffoldId,
  type CreateFeatureBacklogInput,
  type FeatureBacklogEntry,
  type FeatureBacklogPriority,
  type FeatureBacklogPromotionTarget,
  type FeatureBacklogStageTarget,
  type PromoteFeatureBacklogInput,
  type UpdateFeatureBacklogInput,
} from "../../shared/index";
import { HttpError } from "../api/http-error";
import { ChangeGovernanceService } from "./change-governance-service";
import { TaskService } from "./task-service";
import { WorkflowService } from "./workflow-service";

interface FeatureBacklogFile {
  items: FeatureBacklogEntry[];
}

export class FeatureBacklogService {
  private readonly backlogPath: string;

  constructor(
    private readonly taskService: TaskService,
    private readonly workflowService: WorkflowService,
    private readonly changeGovernanceService: ChangeGovernanceService,
    backlogPath = process.env.GAIL_FEATURE_BACKLOG_PATH ?? resolve(process.cwd(), "..", "data", "backlog", "feature-upgrade-backlog.json"),
  ) {
    this.backlogPath = backlogPath;
  }

  list(filters: {
    stageTarget?: FeatureBacklogStageTarget;
    priority?: FeatureBacklogPriority;
    status?: FeatureBacklogEntry["status"];
  } = {}): FeatureBacklogEntry[] {
    const items = this.readBacklog();
    return items.filter((item) => {
      if (filters.stageTarget && item.stageTarget !== filters.stageTarget) return false;
      if (filters.priority && item.priority !== filters.priority) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });
  }

  create(input: CreateFeatureBacklogInput): FeatureBacklogEntry {
    const now = new Date().toISOString();
    const entry: FeatureBacklogEntry = {
      id: createScaffoldId("feature_request"),
      title: input.title.trim(),
      details: input.details.trim(),
      source: input.source,
      stageTarget: input.stageTarget,
      priority: input.priority,
      status: "pending",
      timestamp: now,
      capturedBy: input.capturedBy.trim(),
      promotions: [],
      updatedAt: now,
    };
    const items = this.readBacklog();
    const next = [entry, ...items].slice(0, 2000);
    this.writeBacklog(next);
    return entry;
  }

  update(id: string, input: UpdateFeatureBacklogInput): FeatureBacklogEntry {
    const items = this.readBacklog();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new HttpError(404, `Feature backlog item not found: ${id}`);
    }
    const current = items[index];
    const updated: FeatureBacklogEntry = {
      ...current,
      ...input,
      title: input.title?.trim() || current.title,
      details: input.details?.trim() || current.details,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    this.writeBacklog(items);
    return updated;
  }

  promote(id: string, input: PromoteFeatureBacklogInput): FeatureBacklogEntry {
    const items = this.readBacklog();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new HttpError(404, `Feature backlog item not found: ${id}`);
    }
    const item = items[index];
    const promotedAt = new Date().toISOString();
    const entry = { ...item };

    if (input.target === "task") {
      const task = this.taskService.create({
        title: item.title,
        details: item.details,
        priority: this.mapTaskPriority(item.priority),
        status: "inbox",
      });
      entry.linkedTaskId = task.id;
    } else if (input.target === "workflow") {
      const workflow = this.workflowService.create({
        title: `Feature: ${item.title}`,
        objective: item.details,
        providerPreference: "local-llm",
      });
      entry.linkedWorkflowId = workflow.id;
    } else if (input.target === "change_request") {
      const submitted = this.changeGovernanceService.submitChange({
        sourceType: "manual",
        sourceId: item.id,
        title: `Feature Request: ${item.title}`,
        reason: item.details,
        scope: ["docs/Build plan 4_4", "web-control-panel", "backend"],
        relatedArtifacts: [],
        actor: "user",
      });
      entry.linkedChangeId = submitted.change.changeId;
    } else {
      throw new HttpError(400, `Unsupported promotion target: ${(input as { target?: string }).target ?? "unknown"}`);
    }

    entry.status = "planned";
    entry.promotions = [
      ...entry.promotions,
      {
        target: input.target as FeatureBacklogPromotionTarget,
        linkedTaskId: entry.linkedTaskId,
        linkedWorkflowId: entry.linkedWorkflowId,
        linkedChangeId: entry.linkedChangeId,
        promotedAt,
      },
    ];
    entry.updatedAt = promotedAt;
    items[index] = entry;
    this.writeBacklog(items);
    return entry;
  }

  private readBacklog(): FeatureBacklogEntry[] {
    if (!existsSync(this.backlogPath)) {
      this.writeBacklog([]);
      return [];
    }
    const raw = readFileSync(this.backlogPath, "utf8").trim();
    if (!raw) {
      this.writeBacklog([]);
      return [];
    }
    const parsed = JSON.parse(raw) as Partial<FeatureBacklogFile>;
    return Array.isArray(parsed.items) ? parsed.items : [];
  }

  private writeBacklog(items: FeatureBacklogEntry[]): void {
    mkdirSync(dirname(this.backlogPath), { recursive: true });
    writeFileSync(this.backlogPath, JSON.stringify({ items }, null, 2));
  }

  private mapTaskPriority(priority: FeatureBacklogPriority): "low" | "normal" | "high" | "urgent" {
    if (priority === "critical") return "urgent";
    return priority;
  }
}
