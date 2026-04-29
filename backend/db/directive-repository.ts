import type { DatabaseSync } from "node:sqlite";
import type { ManagerDirective } from "../../shared/contracts/index";
import { getSqliteDatabase } from "./sqlite";

type SqlRow = Record<string, unknown>;

export interface DirectiveStore {
  list(status?: string, limit?: number): ManagerDirective[];
  getById(id: string): ManagerDirective | undefined;
  create(record: ManagerDirective): ManagerDirective;
  update(record: ManagerDirective): ManagerDirective;
}

export class SqliteDirectiveRepository implements DirectiveStore {
  constructor(private readonly database: DatabaseSync = getSqliteDatabase()) {}

  list(status?: string, limit = 50): ManagerDirective[] {
    if (status) {
      const rows = this.database
        .prepare("SELECT * FROM manager_directives WHERE status = ? ORDER BY created_at DESC LIMIT ?")
        .all(status, limit) as SqlRow[];
      return rows.map((row) => this.fromRow(row));
    }
    const rows = this.database
      .prepare("SELECT * FROM manager_directives ORDER BY created_at DESC LIMIT ?")
      .all(limit) as SqlRow[];
    return rows.map((row) => this.fromRow(row));
  }

  getById(id: string): ManagerDirective | undefined {
    const row = this.database
      .prepare("SELECT * FROM manager_directives WHERE id = ?")
      .get(id) as SqlRow | undefined;
    return row ? this.fromRow(row) : undefined;
  }

  create(record: ManagerDirective): ManagerDirective {
    this.database
      .prepare(`
        INSERT INTO manager_directives (
          id, instruction, priority, status, assignee,
          workflow_id, result, error, context_json,
          gail_approval, gail_approval_note,
          created_at, updated_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        record.id,
        record.instruction,
        record.priority,
        record.status,
        record.assignee,
        record.workflowId ?? null,
        record.result ?? null,
        record.error ?? null,
        record.context ? JSON.stringify(record.context) : null,
        record.gailApproval ?? null,
        record.gailApprovalNote ?? null,
        record.createdAt,
        record.updatedAt,
        record.completedAt ?? null,
      );
    return record;
  }

  update(record: ManagerDirective): ManagerDirective {
    this.database
      .prepare(`
        UPDATE manager_directives
        SET instruction = ?, priority = ?, status = ?, assignee = ?,
            workflow_id = ?, result = ?, error = ?, context_json = ?,
            gail_approval = ?, gail_approval_note = ?,
            updated_at = ?, completed_at = ?
        WHERE id = ?
      `)
      .run(
        record.instruction,
        record.priority,
        record.status,
        record.assignee,
        record.workflowId ?? null,
        record.result ?? null,
        record.error ?? null,
        record.context ? JSON.stringify(record.context) : null,
        record.gailApproval ?? null,
        record.gailApprovalNote ?? null,
        record.updatedAt,
        record.completedAt ?? null,
        record.id,
      );
    return record;
  }

  countByStatus(): { total: number; pending: number; running: number; completed: number; failed: number } {
    const rows = this.database
      .prepare("SELECT status, COUNT(*) as cnt FROM manager_directives GROUP BY status")
      .all() as Array<{ status: string; cnt: number }>;
    const counts = { total: 0, pending: 0, running: 0, completed: 0, failed: 0 };
    for (const row of rows) {
      const c = Number(row.cnt);
      counts.total += c;
      if (row.status === "pending") counts.pending = c;
      else if (row.status === "running" || row.status === "dispatched") counts.running += c;
      else if (row.status === "completed") counts.completed = c;
      else if (row.status === "failed") counts.failed = c;
    }
    return counts;
  }

  private fromRow(row: SqlRow): ManagerDirective {
    return {
      id: String(row.id),
      instruction: String(row.instruction),
      priority: String(row.priority) as ManagerDirective["priority"],
      status: String(row.status) as ManagerDirective["status"],
      assignee: String(row.assignee) as ManagerDirective["assignee"],
      workflowId: row.workflow_id ? String(row.workflow_id) : undefined,
      result: row.result ? String(row.result) : undefined,
      error: row.error ? String(row.error) : undefined,
      context: row.context_json ? parseJson(row.context_json, undefined) : undefined,
      gailApproval: row.gail_approval ? String(row.gail_approval) as ManagerDirective["gailApproval"] : undefined,
      gailApprovalNote: row.gail_approval_note ? String(row.gail_approval_note) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      completedAt: row.completed_at ? String(row.completed_at) : undefined,
    };
  }
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value.trim().length === 0) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
