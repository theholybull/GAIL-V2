import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { createScaffoldId } from "../../shared/index";
import type {
  ApprovalRecord,
  ChangeLedgerEvent,
  ChangeRecord,
  DecideGovernanceChangeInput,
  SubmitGovernanceChangeInput,
} from "../../shared/contracts/index";
import { HttpError } from "../api/http-error";

const MAX_LEDGER_EVENTS = 5000;

export class ChangeGovernanceService {
  private readonly repoRoot: string;
  private readonly auditRoot: string;
  private readonly snapshotsRoot: string;
  private readonly ledgerPath: string;
  private readonly changesIndexPath: string;
  private readonly approvalsPath: string;

  constructor(repoRoot = resolve(process.cwd(), "..")) {
    this.repoRoot = repoRoot;
    this.auditRoot = resolve(this.repoRoot, "data", "audit");
    this.snapshotsRoot = resolve(this.auditRoot, "snapshots");
    this.ledgerPath = resolve(this.auditRoot, "change-ledger.jsonl");
    this.changesIndexPath = resolve(this.auditRoot, "changes.json");
    this.approvalsPath = resolve(this.auditRoot, "approvals.json");
  }

  listChanges(): ChangeRecord[] {
    return this.readChanges();
  }

  getChange(changeId: string): ChangeRecord | undefined {
    return this.readChanges().find((entry) => entry.changeId === changeId);
  }

  listPendingChanges(): ChangeRecord[] {
    return this.readChanges().filter((entry) => entry.approvalState === "pending");
  }

  getLastApprovedChange(): ChangeRecord | undefined {
    return this.readChanges()
      .filter((entry) => entry.approvalState === "approved" && Boolean(entry.lastApprovedSnapshotId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }

  submitChange(input: SubmitGovernanceChangeInput): {
    change: ChangeRecord;
    snapshotId: string;
    snapshotPath: string;
  } {
    this.ensureAuditRoots();
    const now = new Date().toISOString();
    const scope = dedupeStrings(input.scope);
    const relatedArtifacts = dedupeStrings(input.relatedArtifacts ?? []);
    const sourceKey = `${input.sourceType}:${input.sourceId}`;
    const changes = this.readChanges();
    const existing = changes.find((entry) => `${entry.sourceType}:${entry.sourceId}` === sourceKey && entry.approvalState === "pending");
    const changeId = existing?.changeId ?? createScaffoldId("change");
    const snapshotId = `snapshot_${Date.now()}`;
    const snapshotPath = this.createSnapshot(changeId, snapshotId, {
      ...input,
      scope,
      relatedArtifacts,
    });

    let change: ChangeRecord;
    if (existing) {
      change = {
        ...existing,
        title: input.title || existing.title,
        reason: input.reason || existing.reason,
        scope: dedupeStrings([...existing.scope, ...scope]),
        approvalState: "pending",
        latestSnapshotId: snapshotId,
        relatedArtifacts: dedupeStrings([...existing.relatedArtifacts, ...relatedArtifacts]),
        updatedAt: now,
      };
      this.replaceChange(change);
      this.appendLedgerEvent({
        changeId,
        action: "update",
        actor: input.actor ?? "agent",
        scope: change.scope,
        reason: `Updated pending change: ${input.reason}`,
        approvalState: "pending",
        snapshotId,
        relatedArtifacts: change.relatedArtifacts,
      });
    } else {
      change = {
        changeId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        title: input.title,
        reason: input.reason,
        scope,
        approvalState: "pending",
        latestSnapshotId: snapshotId,
        relatedArtifacts,
        createdAt: now,
        updatedAt: now,
      };
      this.writeChanges([change, ...changes]);
      this.appendLedgerEvent({
        changeId,
        action: "create",
        actor: input.actor ?? "agent",
        scope,
        reason: input.reason,
        approvalState: "pending",
        snapshotId,
        relatedArtifacts,
      });
    }

    this.appendLedgerEvent({
      changeId,
      action: "submit",
      actor: input.actor ?? "agent",
      scope: change.scope,
      reason: `Submitted for approval: ${change.title}`,
      approvalState: "pending",
      snapshotId,
      relatedArtifacts: change.relatedArtifacts,
    });

    return {
      change,
      snapshotId,
      snapshotPath,
    };
  }

  decideChange(changeId: string, input: DecideGovernanceChangeInput): ChangeRecord {
    const existing = this.getChange(changeId);
    if (!existing) {
      throw new HttpError(404, `Change ${changeId} not found.`);
    }
    const now = new Date().toISOString();
    const snapshotId = existing.latestSnapshotId;
    const nextState = input.decision === "approve" ? "approved" : "rejected";
    const updated: ChangeRecord = {
      ...existing,
      approvalState: nextState,
      lastApprovedSnapshotId: input.decision === "approve" ? snapshotId : existing.lastApprovedSnapshotId,
      updatedAt: now,
    };
    this.replaceChange(updated);
    this.appendApproval({
      id: createScaffoldId("change_approval"),
      changeId,
      reviewer: input.reviewer,
      decision: input.decision,
      reason: input.reason,
      timestamp: now,
      snapshotId,
    });
    this.appendLedgerEvent({
      changeId,
      action: input.decision === "approve" ? "approve" : "reject",
      actor: "user",
      scope: updated.scope,
      reason: input.reason ?? `${input.decision}d by ${input.reviewer}.`,
      approvalState: updated.approvalState,
      snapshotId,
      relatedArtifacts: updated.relatedArtifacts,
    });
    return updated;
  }

  rollbackToLastApproved(): {
    changeId: string;
    snapshotId: string;
    restoredFiles: string[];
  } {
    const change = this.getLastApprovedChange();
    if (!change || !change.lastApprovedSnapshotId) {
      throw new HttpError(409, "No approved snapshot is available for rollback.");
    }
    const snapshotFolder = resolve(this.snapshotsRoot, change.changeId, change.lastApprovedSnapshotId);
    const filesRoot = resolve(snapshotFolder, "files");
    if (!existsSync(filesRoot)) {
      throw new HttpError(409, `Snapshot ${change.lastApprovedSnapshotId} has no restorable files.`);
    }

    const restored: string[] = [];
    for (const relativePath of walkFiles(filesRoot)) {
      const source = resolve(filesRoot, relativePath);
      const target = resolve(this.repoRoot, relativePath);
      ensurePathInsideRoot(target, this.repoRoot, "Rollback target path is outside repository root.");
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(source, target);
      restored.push(relativePath.replaceAll("\\", "/"));
    }

    const now = new Date().toISOString();
    this.appendLedgerEvent({
      changeId: change.changeId,
      action: "revert",
      actor: "system",
      scope: change.scope,
      reason: "Rollback to last approved snapshot.",
      approvalState: "reverted",
      snapshotId: change.lastApprovedSnapshotId,
      relatedArtifacts: change.relatedArtifacts,
    });
    this.replaceChange({
      ...change,
      approvalState: "reverted",
      updatedAt: now,
    });

    return {
      changeId: change.changeId,
      snapshotId: change.lastApprovedSnapshotId,
      restoredFiles: restored,
    };
  }

  getHistory(limit = 200): ChangeLedgerEvent[] {
    if (!existsSync(this.ledgerPath)) {
      return [];
    }
    const rows = readFileSync(this.ledgerPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return rows
      .slice(Math.max(0, rows.length - limit))
      .map((line) => safeParse<ChangeLedgerEvent>(line))
      .filter((row): row is ChangeLedgerEvent => Boolean(row));
  }

  findPendingBySource(sourceType: ChangeRecord["sourceType"], sourceId: string): ChangeRecord | undefined {
    return this.readChanges().find((entry) => entry.sourceType === sourceType && entry.sourceId === sourceId && entry.approvalState === "pending");
  }

  private replaceChange(next: ChangeRecord): void {
    const changes = this.readChanges();
    const replaced = changes.map((entry) => entry.changeId === next.changeId ? next : entry);
    this.writeChanges(replaced);
  }

  private createSnapshot(
    changeId: string,
    snapshotId: string,
    input: SubmitGovernanceChangeInput & { scope: string[]; relatedArtifacts: string[] },
  ): string {
    const snapshotRoot = resolve(this.snapshotsRoot, changeId, snapshotId);
    const filesRoot = resolve(snapshotRoot, "files");
    mkdirSync(filesRoot, { recursive: true });

    const copiedFiles: string[] = [];
    const pathsToCopy = dedupeStrings([...input.scope, ...input.relatedArtifacts]);
    for (const relativePath of pathsToCopy) {
      if (!looksLikeRelativeFilePath(relativePath)) {
        continue;
      }
      const source = resolve(this.repoRoot, relativePath);
      if (!existsSync(source)) {
        continue;
      }
      ensurePathInsideRoot(source, this.repoRoot, "Snapshot source path is outside repository root.");
      const target = resolve(filesRoot, relativePath);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(source, target);
      copiedFiles.push(relativePath.replaceAll("\\", "/"));
    }

    writeFileSync(resolve(snapshotRoot, "snapshot-metadata.json"), JSON.stringify({
      changeId,
      snapshotId,
      createdAt: new Date().toISOString(),
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      title: input.title,
      reason: input.reason,
      scope: input.scope,
      relatedArtifacts: input.relatedArtifacts,
      copiedFiles,
    }, null, 2), "utf8");

    return snapshotRoot.replace(`${this.repoRoot}\\`, "").replaceAll("\\", "/");
  }

  private appendLedgerEvent(
    input: Omit<ChangeLedgerEvent, "eventId" | "timestamp" | "hash" | "prevHash">,
  ): ChangeLedgerEvent {
    this.ensureAuditRoots();
    const timestamp = new Date().toISOString();
    const prior = this.getHistory(1)[0];
    const draft = {
      eventId: createScaffoldId("change_event"),
      changeId: input.changeId,
      timestamp,
      actor: input.actor,
      action: input.action,
      scope: input.scope,
      reason: input.reason,
      approvalState: input.approvalState,
      snapshotId: input.snapshotId,
      relatedArtifacts: input.relatedArtifacts,
      prevHash: prior?.hash,
    };
    const hash = sha256(JSON.stringify(draft));
    const event: ChangeLedgerEvent = { ...draft, hash };
    writeFileSync(this.ledgerPath, `${JSON.stringify(event)}\n`, { encoding: "utf8", flag: "a" });
    const all = this.getHistory(MAX_LEDGER_EVENTS + 10);
    if (all.length > MAX_LEDGER_EVENTS) {
      const keep = all.slice(all.length - MAX_LEDGER_EVENTS);
      writeFileSync(this.ledgerPath, `${keep.map((entry) => JSON.stringify(entry)).join("\n")}\n`, "utf8");
    }
    return event;
  }

  private appendApproval(approval: ApprovalRecord): void {
    const approvals = this.readApprovals();
    const next = [approval, ...approvals];
    writeFileSync(this.approvalsPath, JSON.stringify(next, null, 2), "utf8");
  }

  private readChanges(): ChangeRecord[] {
    if (!existsSync(this.changesIndexPath)) {
      return [];
    }
    return safeParse<ChangeRecord[]>(readFileSync(this.changesIndexPath, "utf8")) ?? [];
  }

  private writeChanges(changes: ChangeRecord[]): void {
    this.ensureAuditRoots();
    writeFileSync(this.changesIndexPath, JSON.stringify(changes, null, 2), "utf8");
  }

  private readApprovals(): ApprovalRecord[] {
    if (!existsSync(this.approvalsPath)) {
      return [];
    }
    return safeParse<ApprovalRecord[]>(readFileSync(this.approvalsPath, "utf8")) ?? [];
  }

  private ensureAuditRoots(): void {
    mkdirSync(this.auditRoot, { recursive: true });
    mkdirSync(this.snapshotsRoot, { recursive: true });
  }
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function looksLikeRelativeFilePath(value: string): boolean {
  return !value.includes("://") && !value.startsWith("/") && !/^[a-zA-Z]:\\/.test(value);
}

function ensurePathInsideRoot(path: string, root: string, message: string): void {
  const normalizedPath = resolve(path).toLowerCase();
  const normalizedRoot = resolve(root).toLowerCase();
  if (!normalizedPath.startsWith(normalizedRoot)) {
    throw new HttpError(400, message);
  }
}

function walkFiles(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = resolve(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      out.push(full.replace(`${root}\\`, ""));
    }
  }
  return out;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeParse<T>(value: string): T | undefined {
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

