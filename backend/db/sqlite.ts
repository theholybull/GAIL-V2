import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const defaultSqlitePath = resolve(process.cwd(), "..", "data", "gail.sqlite");
const defaultPrivateSqlitePath = resolve(process.cwd(), "..", "data", "private", "gail-private.sqlite");

export const sqliteConfig = {
  role: "primary-working-store",
  engine: "sqlite",
  path: process.env.GAIL_SQLITE_PATH ?? defaultSqlitePath,
  privatePath: process.env.GAIL_PRIVATE_SQLITE_PATH ?? defaultPrivateSqlitePath,
};

let database: DatabaseSync | undefined;
let privateDatabase: DatabaseSync | undefined;

export function getSqliteDatabase(): DatabaseSync {
  if (database) {
    return database;
  }

  database = initializeDatabase(sqliteConfig.path);
  return database;
}

export function getPrivateSqliteDatabase(): DatabaseSync {
  if (privateDatabase) {
    return privateDatabase;
  }

  privateDatabase = initializeDatabase(sqliteConfig.privatePath);
  return privateDatabase;
}

function initializeDatabase(path: string): DatabaseSync {
  mkdirSync(dirname(path), { recursive: true });

  const nextDatabase = new DatabaseSync(path);
  nextDatabase.exec("PRAGMA journal_mode = WAL;");
  nextDatabase.exec("PRAGMA foreign_keys = ON;");

  nextDatabase.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      private_only INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      items_json TEXT NOT NULL,
      archived INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      due_at TEXT,
      source_thread_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      details TEXT,
      remind_at TEXT NOT NULL,
      status TEXT NOT NULL,
      linked_task_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      part_number TEXT,
      source_url TEXT,
      status TEXT NOT NULL,
      source_type TEXT NOT NULL,
      compatibility_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      part_id TEXT,
      title TEXT NOT NULL,
      source_url TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approval_requests (
      id TEXT PRIMARY KEY,
      action_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      requested_by_device_id TEXT NOT NULL,
      approved_by_device_id TEXT,
      status TEXT NOT NULL,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS device_profiles (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      default_mode TEXT NOT NULL,
      quality_tier TEXT NOT NULL,
      trusted INTEGER NOT NULL,
      is_paired INTEGER NOT NULL DEFAULT 0,
      paired_at TEXT,
      last_seen_at TEXT,
      last_seen_address TEXT,
      sensitive_actions_unlocked_until TEXT,
      supports_camera INTEGER NOT NULL,
      supports_watch_approval INTEGER NOT NULL,
      supports_rich_avatar INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pairing_sessions (
      id TEXT PRIMARY KEY,
      pairing_code TEXT NOT NULL,
      requested_by_address TEXT NOT NULL,
      status TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS device_credentials (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      label TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      last_used_at TEXT,
      FOREIGN KEY (device_id) REFERENCES device_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversation_sessions (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      provider TEXT NOT NULL,
      title TEXT,
      messages_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      objective TEXT NOT NULL,
      status TEXT NOT NULL,
      project_id TEXT,
      provider_preference TEXT NOT NULL,
      context_items_json TEXT NOT NULL,
      steps_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS manager_directives (
      id TEXT PRIMARY KEY,
      instruction TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      assignee TEXT NOT NULL,
      workflow_id TEXT,
      result TEXT,
      error TEXT,
      context_json TEXT,
      gail_approval TEXT,
      gail_approval_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_log_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      action TEXT NOT NULL,
      directive_id TEXT,
      details TEXT NOT NULL,
      result TEXT,
      level TEXT NOT NULL DEFAULT 'info',
      created_at TEXT NOT NULL
    );
  `);

  ensureColumn(
    nextDatabase,
    "device_profiles",
    "is_paired",
    "INTEGER NOT NULL DEFAULT 0",
  );

  ensureColumn(
    nextDatabase,
    "device_profiles",
    "paired_at",
    "TEXT",
  );

  ensureColumn(
    nextDatabase,
    "device_profiles",
    "last_seen_at",
    "TEXT",
  );

  ensureColumn(
    nextDatabase,
    "device_profiles",
    "last_seen_address",
    "TEXT",
  );

  ensureColumn(
    nextDatabase,
    "device_profiles",
    "sensitive_actions_unlocked_until",
    "TEXT",
  );

  ensureColumn(
    nextDatabase,
    "manager_directives",
    "gail_approval",
    "TEXT",
  );

  ensureColumn(
    nextDatabase,
    "manager_directives",
    "gail_approval_note",
    "TEXT",
  );

  return nextDatabase;
}

function ensureColumn(
  database: DatabaseSync,
  tableName: string,
  columnName: string,
  definition: string,
): void {
  const rows = database
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name?: string }>;

  if (rows.some((row) => row.name === columnName)) {
    return;
  }

  database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
}
