import type { DatabaseSync } from "node:sqlite";
import { getSqliteDatabase } from "../db/sqlite";
import type { MemoryService } from "./memory-service";
import type { PrivateMemoryService } from "./private-memory-service";

type SqlValue = string | number | bigint | Uint8Array | null;
type SqlRow = Record<string, SqlValue>;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Generates a daily summary of system activity and stores important findings
 * in working memory. Runs once per day via a timer.
 */
export class DailySummaryService {
  private timer: ReturnType<typeof setInterval> | undefined;
  private lastRunDate: string | undefined;
  private readonly database: DatabaseSync;

  constructor(
    private readonly memoryService: MemoryService,
    private readonly privateMemoryService: PrivateMemoryService,
    database?: DatabaseSync,
  ) {
    this.database = database ?? getSqliteDatabase();
  }

  /** Start the daily summary loop. Checks every hour, runs once per calendar day. */
  start(): void {
    // Run on startup if we haven't run today
    this.runIfNeeded();

    // Check hourly whether a new day has arrived
    this.timer = setInterval(() => {
      this.runIfNeeded();
    }, 60 * 60 * 1000); // every hour

    if (this.timer && typeof this.timer === "object" && "unref" in this.timer) {
      (this.timer as { unref: () => void }).unref();
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /** Run the daily summary if we haven't already run today. */
  private runIfNeeded(): void {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (this.lastRunDate === today) return;

    // Check if we already wrote a summary for today
    const existing = this.memoryService.recallRecent(50);
    const alreadyDone = existing.some(
      (e) => e.tags.includes("daily-summary") && e.body.includes(today),
    );
    if (alreadyDone) {
      this.lastRunDate = today;
      return;
    }

    try {
      this.generateDailySummary(today);
      this.lastRunDate = today;
    } catch (error) {
      console.error("[DailySummaryService] Failed to generate daily summary:", error);
    }
  }

  /** Build and store the daily summary in working memory. */
  private generateDailySummary(date: string): void {
    const yesterday = new Date(Date.now() - ONE_DAY_MS).toISOString().slice(0, 10);
    const parts: string[] = [`Daily Summary for ${date}`];

    // ── Conversation stats ──
    const convStats = this.getConversationStats(yesterday);
    if (convStats.totalSessions > 0 || convStats.totalMessages > 0) {
      parts.push(
        `Conversations: ${convStats.totalSessions} sessions, ${convStats.totalMessages} messages` +
          (convStats.privateSessions > 0
            ? ` (${convStats.privateSessions} private)`
            : ""),
      );
    } else {
      parts.push("Conversations: none yesterday");
    }

    // ── Workflow stats ──
    const wfStats = this.getWorkflowStats(yesterday);
    if (wfStats.created > 0 || wfStats.completed > 0) {
      parts.push(
        `Workflows: ${wfStats.created} created, ${wfStats.completed} completed, ${wfStats.failed} failed`,
      );
    }

    // ── New private memory entries from yesterday ──
    const privateEntries = this.privateMemoryService.recallRecent(100);
    const yesterdayEntries = privateEntries.filter(
      (e) => e.createdAt.startsWith(yesterday),
    );
    if (yesterdayEntries.length > 0) {
      parts.push(
        `Private memories added: ${yesterdayEntries.length} new entries`,
      );
      // Promote important private facts to working memory
      for (const entry of yesterdayEntries) {
        if (
          entry.tags.includes("identity") ||
          entry.tags.includes("date") ||
          entry.title.toLowerCase().includes("important")
        ) {
          this.promoteToWorkingMemory(entry.title, entry.body, date);
        }
      }
    }

    // ── Private personality traits learned ──
    const traits = this.privateMemoryService.getTraits();
    const newTraits = traits.filter(
      (t) => t.learnedAt.startsWith(yesterday) || t.updatedAt.startsWith(yesterday),
    );
    if (newTraits.length > 0) {
      parts.push(
        `Personality traits updated: ${newTraits.map((t) => `${t.key}=${t.value}`).join(", ")}`,
      );
    }

    // ── Notes/tasks created ──
    const noteCount = this.countRowsSince("notes", yesterday);
    const taskCount = this.countRowsSince("tasks", yesterday);
    if (noteCount > 0) parts.push(`Notes created: ${noteCount}`);
    if (taskCount > 0) parts.push(`Tasks created: ${taskCount}`);

    // ── Write to working memory ──
    const dummyMeta = {
      authMode: "open" as const,
      mode: "work" as const,
      deviceType: "service" as const,
      explicitLocalSave: false,
      authenticated: true,
      identitySource: "headers" as const,
    };
    this.memoryService.addEntry(dummyMeta, {
      title: `Daily Summary — ${date}`,
      body: parts.join("\n"),
      tags: ["daily-summary", "auto-generated"],
      source: "daily-summary-service",
    });

    console.log(`[DailySummaryService] Generated summary for ${date}`);
  }

  /** Promote an important private fact to shared working memory. */
  private promoteToWorkingMemory(title: string, body: string, date: string): void {
    const dummyMeta = {
      authMode: "open" as const,
      mode: "work" as const,
      deviceType: "service" as const,
      explicitLocalSave: false,
      authenticated: true,
      identitySource: "headers" as const,
    };
    // Check if already promoted
    const existing = this.memoryService.recallRecent(200);
    if (existing.some((e) => e.body === body && e.tags.includes("promoted"))) {
      return;
    }
    this.memoryService.addEntry(dummyMeta, {
      title: `[Remembered] ${title}`,
      body,
      tags: ["promoted", "auto-generated", "important"],
      source: "daily-summary-service",
    });
  }

  /* ── database queries ─────────────────────────────────────── */

  private getConversationStats(sinceDate: string): {
    totalSessions: number;
    totalMessages: number;
    privateSessions: number;
  } {
    try {
      const sessions = this.database
        .prepare(
          "SELECT mode, messages_json FROM conversation_sessions WHERE updated_at >= ?",
        )
        .all(sinceDate) as SqlRow[];

      let totalMessages = 0;
      let privateSessions = 0;
      for (const row of sessions) {
        if (String(row.mode) === "private") privateSessions++;
        try {
          const msgs = JSON.parse(String(row.messages_json ?? "[]"));
          totalMessages += Array.isArray(msgs) ? msgs.length : 0;
        } catch {
          // skip malformed
        }
      }
      return {
        totalSessions: sessions.length,
        totalMessages,
        privateSessions,
      };
    } catch {
      return { totalSessions: 0, totalMessages: 0, privateSessions: 0 };
    }
  }

  private getWorkflowStats(sinceDate: string): {
    created: number;
    completed: number;
    failed: number;
  } {
    try {
      const created = this.database
        .prepare("SELECT COUNT(*) as c FROM workflows WHERE created_at >= ?")
        .get(sinceDate) as SqlRow | undefined;
      const completed = this.database
        .prepare(
          "SELECT COUNT(*) as c FROM workflows WHERE status = 'completed' AND updated_at >= ?",
        )
        .get(sinceDate) as SqlRow | undefined;
      const failed = this.database
        .prepare(
          "SELECT COUNT(*) as c FROM workflows WHERE status IN ('failed','blocked') AND updated_at >= ?",
        )
        .get(sinceDate) as SqlRow | undefined;
      return {
        created: Number(created?.c ?? 0),
        completed: Number(completed?.c ?? 0),
        failed: Number(failed?.c ?? 0),
      };
    } catch {
      return { created: 0, completed: 0, failed: 0 };
    }
  }

  private countRowsSince(table: string, sinceDate: string): number {
    try {
      // Only allow known table names to prevent injection
      const allowed = ["notes", "tasks", "reminders", "lists", "projects"];
      if (!allowed.includes(table)) return 0;
      const row = this.database
        .prepare(`SELECT COUNT(*) as c FROM ${table} WHERE created_at >= ?`)
        .get(sinceDate) as SqlRow | undefined;
      return Number(row?.c ?? 0);
    } catch {
      return 0;
    }
  }
}
