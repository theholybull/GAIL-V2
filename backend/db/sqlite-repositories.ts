import type {
  CartItem,
  ListItem,
  ListRecord,
  Note,
  PartRecord,
  Project,
  Reminder,
  Task,
} from "../../shared/contracts/index";
import type { DatabaseSync } from "node:sqlite";
import type { EntityRepositoryLike } from "./entity-repository";
import { getPrivateSqliteDatabase, getSqliteDatabase } from "./sqlite";

type PersistedEntity = { id: string; createdAt: string; updatedAt: string };
type SqlValue = string | number | bigint | Uint8Array | null;
type SqlRow = Record<string, SqlValue>;

abstract class SqliteEntityRepository<T extends PersistedEntity>
  implements EntityRepositoryLike<T>
{
  protected readonly database: DatabaseSync;

  protected constructor(
    private readonly tableName: string,
    private readonly columns: Record<string, string>,
    database: DatabaseSync = getSqliteDatabase(),
  ) {
    this.database = database;
  }

  list(): T[] {
    const rows = this.database.prepare(`SELECT * FROM ${this.tableName} ORDER BY updated_at DESC`).all();
    return rows.map((row) => this.fromRow(row as SqlRow));
  }

  getById(id: string): T | undefined {
    const row = this.database
      .prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`)
      .get(id) as SqlRow | undefined;

    return row ? this.fromRow(row) : undefined;
  }

  create(record: T): T {
    const serialized = this.toRow(record);
    const columnKeys = Object.keys(serialized);
    const sqlColumns = columnKeys.map((key) => this.columns[key] ?? key).join(", ");
    const placeholders = columnKeys.map(() => "?").join(", ");
    const values = columnKeys.map((key) => serialized[key] as SqlValue);

    this.database
      .prepare(`INSERT INTO ${this.tableName} (${sqlColumns}) VALUES (${placeholders})`)
      .run(...values);

    return record;
  }

  update(id: string, patch: Partial<Omit<T, "id" | "createdAt">>): T | undefined {
    const current = this.getById(id);
    if (!current) {
      return undefined;
    }

    const normalizedPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as Partial<Omit<T, "id" | "createdAt">>;

    const next = {
      ...current,
      ...normalizedPatch,
      updatedAt: new Date().toISOString(),
    } as T;

    const serialized = this.toRow(next);
    const entries = Object.entries(serialized).filter(([key]) => key !== "id" && key !== "createdAt");
    const assignments = entries
      .map(([key]) => `${this.columns[key] ?? key} = ?`)
      .join(", ");
    const values = entries.map(([, value]) => value as SqlValue);

    this.database.prepare(`UPDATE ${this.tableName} SET ${assignments} WHERE id = ?`).run(...values, id);
    return next;
  }

  protected abstract toRow(record: T): SqlRow;
  protected abstract fromRow(row: SqlRow): T;
}

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  return JSON.parse(value) as T[];
}

function toBoolean(value: unknown): boolean {
  return Number(value) === 1;
}

export class SqliteProjectRepository extends SqliteEntityRepository<Project> {
  constructor() {
    super("projects", {
      createdAt: "created_at",
      updatedAt: "updated_at",
      tags: "tags_json",
    });
  }

  protected toRow(record: Project): SqlRow {
    return {
      id: record.id,
      title: record.title,
      summary: record.summary,
      status: record.status,
      tags: JSON.stringify(record.tags),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected fromRow(row: SqlRow): Project {
    return {
      id: String(row.id),
      title: String(row.title),
      summary: String(row.summary),
      status: row.status as Project["status"],
      tags: parseJsonArray<string>(row.tags_json, []),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}

export class SqliteNoteRepository extends SqliteEntityRepository<Note> {
  constructor(database: DatabaseSync = getSqliteDatabase()) {
    super(
      "notes",
      {
        projectId: "project_id",
        privateOnly: "private_only",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      database,
    );
  }

  protected toRow(record: Note): SqlRow {
    return {
      id: record.id,
      projectId: record.projectId ?? null,
      title: record.title,
      body: record.body,
      privateOnly: record.privateOnly ? 1 : 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected fromRow(row: SqlRow): Note {
    return {
      id: String(row.id),
      projectId: row.project_id ? String(row.project_id) : undefined,
      title: String(row.title),
      body: String(row.body),
      privateOnly: toBoolean(row.private_only),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}

export class SqlitePrivateNoteRepository extends SqliteNoteRepository {
  constructor() {
    super(getPrivateSqliteDatabase());
  }
}

export class SqliteListRepository extends SqliteEntityRepository<ListRecord> {
  constructor() {
    super("lists", {
      items: "items_json",
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
  }

  protected toRow(record: ListRecord): SqlRow {
    return {
      id: record.id,
      title: record.title,
      description: record.description ?? null,
      items: JSON.stringify(record.items),
      archived: record.archived ? 1 : 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected fromRow(row: SqlRow): ListRecord {
    return {
      id: String(row.id),
      title: String(row.title),
      description: row.description ? String(row.description) : undefined,
      items: parseJsonArray<ListItem>(row.items_json, []),
      archived: toBoolean(row.archived),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}

export class SqliteTaskRepository extends SqliteEntityRepository<Task> {
  constructor() {
    super("tasks", {
      projectId: "project_id",
      dueAt: "due_at",
      sourceThreadId: "source_thread_id",
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
  }

  protected toRow(record: Task): SqlRow {
    return {
      id: record.id,
      projectId: record.projectId ?? null,
      title: record.title,
      details: record.details ?? null,
      status: record.status,
      priority: record.priority,
      dueAt: record.dueAt ?? null,
      sourceThreadId: record.sourceThreadId ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected fromRow(row: SqlRow): Task {
    return {
      id: String(row.id),
      projectId: row.project_id ? String(row.project_id) : undefined,
      title: String(row.title),
      details: row.details ? String(row.details) : undefined,
      status: row.status as Task["status"],
      priority: row.priority as Task["priority"],
      dueAt: row.due_at ? String(row.due_at) : undefined,
      sourceThreadId: row.source_thread_id ? String(row.source_thread_id) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}

export class SqliteReminderRepository extends SqliteEntityRepository<Reminder> {
  constructor() {
    super("reminders", {
      remindAt: "remind_at",
      linkedTaskId: "linked_task_id",
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
  }

  protected toRow(record: Reminder): SqlRow {
    return {
      id: record.id,
      title: record.title,
      details: record.details ?? null,
      remindAt: record.remindAt,
      status: record.status,
      linkedTaskId: record.linkedTaskId ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected fromRow(row: SqlRow): Reminder {
    return {
      id: String(row.id),
      title: String(row.title),
      details: row.details ? String(row.details) : undefined,
      remindAt: String(row.remind_at),
      status: row.status as Reminder["status"],
      linkedTaskId: row.linked_task_id ? String(row.linked_task_id) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}

export class SqlitePartRepository extends SqliteEntityRepository<PartRecord> {
  constructor() {
    super("parts", {
      projectId: "project_id",
      partNumber: "part_number",
      sourceUrl: "source_url",
      sourceType: "source_type",
      compatibilityNotes: "compatibility_notes",
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
  }

  protected toRow(record: PartRecord): SqlRow {
    return {
      id: record.id,
      projectId: record.projectId ?? null,
      title: record.title,
      partNumber: record.partNumber ?? null,
      sourceUrl: record.sourceUrl ?? null,
      status: record.status,
      sourceType: record.sourceType,
      compatibilityNotes: record.compatibilityNotes ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected fromRow(row: SqlRow): PartRecord {
    return {
      id: String(row.id),
      projectId: row.project_id ? String(row.project_id) : undefined,
      title: String(row.title),
      partNumber: row.part_number ? String(row.part_number) : undefined,
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
      status: row.status as PartRecord["status"],
      sourceType: row.source_type as PartRecord["sourceType"],
      compatibilityNotes: row.compatibility_notes ? String(row.compatibility_notes) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}

export class SqliteCartRepository extends SqliteEntityRepository<CartItem> {
  constructor() {
    super("cart_items", {
      partId: "part_id",
      sourceUrl: "source_url",
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
  }

  protected toRow(record: CartItem): SqlRow {
    return {
      id: record.id,
      partId: record.partId ?? null,
      title: record.title,
      sourceUrl: record.sourceUrl,
      quantity: record.quantity,
      status: record.status,
      notes: record.notes ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected fromRow(row: SqlRow): CartItem {
    return {
      id: String(row.id),
      partId: row.part_id ? String(row.part_id) : undefined,
      title: String(row.title),
      sourceUrl: String(row.source_url),
      quantity: Number(row.quantity),
      status: row.status as CartItem["status"],
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}
