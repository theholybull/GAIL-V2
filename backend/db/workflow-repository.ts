import type { DatabaseSync } from "node:sqlite";
import type { Workflow } from "../../shared/contracts/index";
import { getSqliteDatabase } from "./sqlite";

export interface WorkflowStore {
  list(): Workflow[];
  getById(id: string): Workflow | undefined;
  create(record: Workflow): Workflow;
  update(record: Workflow): Workflow;
}

type SqlValue = string | number | bigint | Uint8Array | null;
type SqlRow = Record<string, SqlValue>;

export class SqliteWorkflowRepository implements WorkflowStore {
  constructor(private readonly database: DatabaseSync = getSqliteDatabase()) {}

  list(): Workflow[] {
    const rows = this.database.prepare("SELECT * FROM workflows ORDER BY updated_at DESC").all();
    return rows.map((row) => this.fromRow(row as SqlRow));
  }

  getById(id: string): Workflow | undefined {
    const row = this.database.prepare("SELECT * FROM workflows WHERE id = ?").get(id) as SqlRow | undefined;
    return row ? this.fromRow(row) : undefined;
  }

  create(record: Workflow): Workflow {
    this.database.prepare(`
      INSERT INTO workflows (
        id,
        title,
        objective,
        status,
        project_id,
        provider_preference,
        context_items_json,
        steps_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.title,
      record.objective,
      record.status,
      record.projectId ?? null,
      record.providerPreference,
      JSON.stringify(record.contextItems),
      JSON.stringify(record.steps),
      record.createdAt,
      record.updatedAt,
    );

    return record;
  }

  update(record: Workflow): Workflow {
    this.database.prepare(`
      UPDATE workflows
      SET
        title = ?,
        objective = ?,
        status = ?,
        project_id = ?,
        provider_preference = ?,
        context_items_json = ?,
        steps_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      record.title,
      record.objective,
      record.status,
      record.projectId ?? null,
      record.providerPreference,
      JSON.stringify(record.contextItems),
      JSON.stringify(record.steps),
      record.updatedAt,
      record.id,
    );

    return record;
  }

  private fromRow(row: SqlRow): Workflow {
    return {
      id: String(row.id),
      title: String(row.title),
      objective: String(row.objective),
      status: row.status as Workflow["status"],
      projectId: row.project_id ? String(row.project_id) : undefined,
      providerPreference: row.provider_preference as Workflow["providerPreference"],
      contextItems: parseJson(row.context_items_json, []),
      steps: parseJson(row.steps_json, []),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
