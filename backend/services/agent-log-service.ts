import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import type { AgentLogEntry, AgentLogLevel } from "../../shared/contracts/index";
import { getSqliteDatabase } from "../db/sqlite";

const MAX_LOG_QUERY = 200;

export class AgentLogService {
  private readonly logDir: string;
  private readonly database: DatabaseSync;

  constructor(
    logDir = resolve(process.cwd(), "..", "data", "agent-logs"),
    database: DatabaseSync = getSqliteDatabase(),
  ) {
    this.logDir = logDir;
    this.database = database;
    mkdirSync(this.logDir, { recursive: true });
  }

  log(
    agentId: string,
    action: string,
    details: string,
    options: { directiveId?: string; result?: string; level?: AgentLogLevel } = {},
  ): AgentLogEntry {
    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      agentId,
      action,
      directiveId: options.directiveId,
      details,
      result: options.result,
      level: options.level ?? "info",
    };

    // Persist to SQLite
    this.database
      .prepare(`
        INSERT INTO agent_log_entries (timestamp, agent_id, action, directive_id, details, result, level, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        entry.timestamp,
        entry.agentId,
        entry.action,
        entry.directiveId ?? null,
        entry.details,
        entry.result ?? null,
        entry.level,
        entry.timestamp,
      );

    // Append to JSONL file for the specific agent
    const logFile = resolve(this.logDir, `${agentId}-log.jsonl`);
    mkdirSync(dirname(logFile), { recursive: true });
    appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf-8");

    return entry;
  }

  getRecentLogs(agentId?: string, limit = 50): AgentLogEntry[] {
    const safeLimit = Math.min(limit, MAX_LOG_QUERY);
    if (agentId) {
      const rows = this.database
        .prepare("SELECT * FROM agent_log_entries WHERE agent_id = ? ORDER BY id DESC LIMIT ?")
        .all(agentId, safeLimit) as Array<Record<string, unknown>>;
      return rows.map((row) => this.fromRow(row));
    }
    const rows = this.database
      .prepare("SELECT * FROM agent_log_entries ORDER BY id DESC LIMIT ?")
      .all(safeLimit) as Array<Record<string, unknown>>;
    return rows.map((row) => this.fromRow(row));
  }

  getLogsByDirective(directiveId: string, limit = 50): AgentLogEntry[] {
    const rows = this.database
      .prepare("SELECT * FROM agent_log_entries WHERE directive_id = ? ORDER BY id DESC LIMIT ?")
      .all(directiveId, Math.min(limit, MAX_LOG_QUERY)) as Array<Record<string, unknown>>;
    return rows.map((row) => this.fromRow(row));
  }

  getLogFilePath(agentId: string): string {
    return resolve(this.logDir, `${agentId}-log.jsonl`);
  }

  readLogFile(agentId: string, tailLines = 100): string[] {
    const logFile = this.getLogFilePath(agentId);
    if (!existsSync(logFile)) return [];
    const content = readFileSync(logFile, "utf-8");
    const lines = content.trim().split("\n").filter((l) => l.length > 0);
    return lines.slice(-tailLines);
  }

  private fromRow(row: Record<string, unknown>): AgentLogEntry {
    return {
      id: Number(row.id),
      timestamp: String(row.timestamp),
      agentId: String(row.agent_id),
      action: String(row.action),
      directiveId: row.directive_id ? String(row.directive_id) : undefined,
      details: String(row.details),
      result: row.result ? String(row.result) : undefined,
      level: (row.level as AgentLogLevel) ?? "info",
    };
  }
}
