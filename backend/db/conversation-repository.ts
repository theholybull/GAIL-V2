import type { DatabaseSync } from "node:sqlite";
import type { ConversationSession } from "../../shared/contracts/index";
import { getSqliteDatabase } from "./sqlite";

type SqlValue = string | number | bigint | Uint8Array | null;
type SqlRow = Record<string, SqlValue>;

export interface ConversationStore {
  listByMode(mode: string): ConversationSession[];
  getById(id: string): ConversationSession | undefined;
  create(session: ConversationSession): ConversationSession;
  update(session: ConversationSession): ConversationSession;
}

export class SqliteConversationRepository implements ConversationStore {
  constructor(private readonly database: DatabaseSync = getSqliteDatabase()) {}

  listByMode(mode: string): ConversationSession[] {
    const rows = this.database
      .prepare("SELECT * FROM conversation_sessions WHERE mode = ? ORDER BY updated_at DESC")
      .all(mode) as SqlRow[];
    return rows.map((row) => this.fromRow(row));
  }

  getById(id: string): ConversationSession | undefined {
    const row = this.database
      .prepare("SELECT * FROM conversation_sessions WHERE id = ?")
      .get(id) as SqlRow | undefined;
    return row ? this.fromRow(row) : undefined;
  }

  create(session: ConversationSession): ConversationSession {
    this.database
      .prepare(
        `INSERT INTO conversation_sessions (
          id, device_id, mode, provider, title, messages_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        session.id,
        session.deviceId,
        session.mode,
        session.provider,
        session.title ?? null,
        JSON.stringify(session.messages),
        session.createdAt,
        session.updatedAt,
      );

    return session;
  }

  update(session: ConversationSession): ConversationSession {
    this.database
      .prepare(
        `UPDATE conversation_sessions
         SET device_id = ?, mode = ?, provider = ?, title = ?, messages_json = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        session.deviceId,
        session.mode,
        session.provider,
        session.title ?? null,
        JSON.stringify(session.messages),
        session.updatedAt,
        session.id,
      );

    return session;
  }

  private fromRow(row: SqlRow): ConversationSession {
    return {
      id: String(row.id),
      deviceId: String(row.device_id),
      mode: String(row.mode),
      provider: String(row.provider) as ConversationSession["provider"],
      title: row.title ? String(row.title) : undefined,
      messages: row.messages_json ? JSON.parse(String(row.messages_json)) : [],
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}
