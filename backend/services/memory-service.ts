import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  CreateMemoryEntryInput,
  CreatePrivateSessionNoteInput,
  MemoryEntry,
  PrivateSessionNote,
  PrivateSessionState,
  UpdateMemoryEntryInput,
} from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { RequestMeta } from "../api/request-meta";
import { HttpError } from "../api/http-error";

interface MemoryFileState {
  entries: MemoryEntry[];
}

export class MemoryService {
  private readonly privateSessions = new Map<string, PrivateSessionState>();
  private readonly memoryPath: string;

  constructor(memoryPath = process.env.GAIL_MEMORY_PATH ?? resolve(process.cwd(), "..", "data", "memory", "gail-memory.json")) {
    this.memoryPath = memoryPath;
  }

  listEntries(meta: RequestMeta): MemoryEntry[] {
    this.ensureNormalMode(meta, "read shared memory");
    return this.readEntries();
  }

  searchEntries(meta: RequestMeta, query: string): MemoryEntry[] {
    this.ensureNormalMode(meta, "search shared memory");
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return this.readEntries();
    }

    return this.readEntries().filter((entry) =>
      entry.title.toLowerCase().includes(needle) ||
      entry.body.toLowerCase().includes(needle) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(needle)) ||
      (entry.source?.toLowerCase().includes(needle) ?? false),
    );
  }

  addEntry(meta: RequestMeta, input: CreateMemoryEntryInput): MemoryEntry {
    this.ensureNormalMode(meta, "write shared memory");

    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: createScaffoldId("memory_entry"),
      title: input.title,
      body: input.body,
      tags: input.tags ?? [],
      source: input.source,
      createdAt: now,
      updatedAt: now,
    };

    const next = [entry, ...this.readEntries()].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
    this.writeEntries(next);
    return entry;
  }

  getEntryById(meta: RequestMeta, id: string): MemoryEntry | undefined {
    this.ensureNormalMode(meta, "read shared memory");
    return this.readEntries().find((entry) => entry.id === id);
  }

  updateEntry(meta: RequestMeta, id: string, input: UpdateMemoryEntryInput): MemoryEntry | undefined {
    this.ensureNormalMode(meta, "write shared memory");
    const entries = this.readEntries();
    const index = entries.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return undefined;
    }

    const current = entries[index];
    const updated: MemoryEntry = {
      ...current,
      title: input.title ?? current.title,
      body: input.body ?? current.body,
      tags: input.tags ?? current.tags,
      source: input.source ?? current.source,
      updatedAt: new Date().toISOString(),
    };

    const next = [...entries];
    next[index] = updated;
    this.writeEntries(next);
    return updated;
  }

  deleteEntry(meta: RequestMeta, id: string): boolean {
    this.ensureNormalMode(meta, "write shared memory");
    const entries = this.readEntries();
    const next = entries.filter((entry) => entry.id !== id);
    if (next.length === entries.length) {
      return false;
    }

    this.writeEntries(next);
    return true;
  }

  recallRecent(limit = 5): MemoryEntry[] {
    return this.readEntries().slice(0, limit);
  }

  getPrivateSession(deviceId: string): PrivateSessionState {
    const existing = this.privateSessions.get(deviceId);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const created: PrivateSessionState = {
      id: createScaffoldId("private_session"),
      deviceId,
      mode: "private",
      notes: [],
      createdAt: now,
      updatedAt: now,
    };

    this.privateSessions.set(deviceId, created);
    return created;
  }

  addPrivateSessionNote(deviceId: string, input: CreatePrivateSessionNoteInput): PrivateSessionState {
    const session = this.getPrivateSession(deviceId);
    const now = new Date().toISOString();
    const note: PrivateSessionNote = {
      id: createScaffoldId("private_session_note"),
      title: input.title,
      body: input.body,
      createdAt: now,
      updatedAt: now,
    };

    const next: PrivateSessionState = {
      ...session,
      notes: [...session.notes, note],
      updatedAt: now,
    };

    this.privateSessions.set(deviceId, next);
    return next;
  }

  wipePrivateSession(deviceId: string): PrivateSessionState {
    const session = this.getPrivateSession(deviceId);
    const wiped: PrivateSessionState = {
      ...session,
      notes: [],
      updatedAt: new Date().toISOString(),
    };

    this.privateSessions.set(deviceId, wiped);
    return wiped;
  }

  private ensureNormalMode(meta: RequestMeta, action: string): void {
    if (meta.mode === "private") {
      throw new HttpError(403, `Private Mode cannot ${action}.`);
    }
  }

  private readEntries(): MemoryEntry[] {
    if (!existsSync(this.memoryPath)) {
      return [];
    }

    const raw = readFileSync(this.memoryPath, "utf8").trim();
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Partial<MemoryFileState>;
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    return entries.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  private writeEntries(entries: MemoryEntry[]): void {
    mkdirSync(dirname(this.memoryPath), { recursive: true });
    const payload: MemoryFileState = { entries };
    writeFileSync(this.memoryPath, JSON.stringify(payload, null, 2));
  }
}
