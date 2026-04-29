import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { MemoryEntry } from "../../shared/contracts/index";
import type { PrivatePersonaKind } from "../../shared/contracts/provider-status";
import { createScaffoldId } from "../../shared/index";

export interface PersonalityTrait {
  key: string;
  value: string;
  learnedAt: string;
  updatedAt: string;
  /** Which persona owns this trait. */
  persona?: string;
}

interface PrivateMemoryFileState {
  entries: MemoryEntry[];
  traits: PersonalityTrait[];
}

const EMPTY_STATE: PrivateMemoryFileState = { entries: [], traits: [] };

export class PrivateMemoryService {
  private readonly memoryPath: string;

  constructor(
    memoryPath = process.env.GAIL_PRIVATE_MEMORY_PATH ??
      resolve(process.cwd(), "..", "data", "memory", "private-memory.json"),
  ) {
    this.memoryPath = memoryPath;
  }

  /* ── persona access rules ─────────────────────────────────── */

  /**
   * Returns the entries visible to a given persona:
   *  - Vera (counselor): only entries tagged "private_counselor"
   *  - Cherry (girlfriend): all entries EXCEPT those tagged "private_counselor"
   *  - hangout / undefined: all entries except counselor
   */
  private visibleEntries(persona: PrivatePersonaKind | undefined): MemoryEntry[] {
    const all = this.readState().entries;
    if (persona === "private_counselor") {
      return all.filter((e) => !e.persona || e.persona === "private_counselor");
    }
    // Cherry, hangout, or unscoped: see everything except Vera-only
    return all.filter((e) => e.persona !== "private_counselor");
  }

  private visibleTraits(persona: PrivatePersonaKind | undefined): PersonalityTrait[] {
    const all = this.readState().traits;
    if (persona === "private_counselor") {
      return all.filter((t) => !t.persona || t.persona === "private_counselor");
    }
    return all.filter((t) => t.persona !== "private_counselor");
  }

  /**
   * Cherry (girlfriend) cannot write unless the user explicitly asks her to remember.
   * Call this before any mutating operation when persona is private_girlfriend.
   */
  private assertCanWrite(persona: PrivatePersonaKind | undefined, explicitInstruction: boolean): void {
    if (persona === "private_girlfriend" && !explicitInstruction) {
      throw new Error("Cherry persona cannot write to memory unless explicitly instructed.");
    }
  }

  /* ── recall ───────────────────────────────────────────────── */

  recallRecent(limit = 5, persona?: PrivatePersonaKind): MemoryEntry[] {
    return this.visibleEntries(persona).slice(0, limit);
  }

  searchEntries(query: string, persona?: PrivatePersonaKind): MemoryEntry[] {
    const needle = query.trim().toLowerCase();
    const entries = this.visibleEntries(persona);
    if (!needle) {
      return entries;
    }
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(needle) ||
        e.body.toLowerCase().includes(needle) ||
        e.tags.some((t) => t.toLowerCase().includes(needle)),
    );
  }

  /* ── store ────────────────────────────────────────────────── */

  addEntry(title: string, body: string, tags: string[] = [], source?: string, persona?: PrivatePersonaKind, explicitInstruction = false): MemoryEntry {
    this.assertCanWrite(persona, explicitInstruction);
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: createScaffoldId("priv_mem"),
      title,
      body,
      tags,
      source,
      persona,
      createdAt: now,
      updatedAt: now,
    };
    const state = this.readState();
    state.entries.unshift(entry);
    this.writeState(state);
    return entry;
  }

  deleteEntry(id: string): boolean {
    const state = this.readState();
    const before = state.entries.length;
    state.entries = state.entries.filter((e) => e.id !== id);
    if (state.entries.length === before) return false;
    this.writeState(state);
    return true;
  }

  /* ── personality traits ───────────────────────────────────── */

  getTraits(persona?: PrivatePersonaKind): PersonalityTrait[] {
    return this.visibleTraits(persona);
  }

  setTrait(key: string, value: string, persona?: PrivatePersonaKind, explicitInstruction = false): PersonalityTrait {
    this.assertCanWrite(persona, explicitInstruction);
    const state = this.readState();
    const now = new Date().toISOString();
    const existing = state.traits.find((t) => t.key === key && t.persona === persona);
    if (existing) {
      existing.value = value;
      existing.updatedAt = now;
    } else {
      state.traits.push({ key, value, learnedAt: now, updatedAt: now, persona });
    }
    this.writeState(state);
    return state.traits.find((t) => t.key === key && t.persona === persona)!;
  }

  removeTrait(key: string): boolean {
    const state = this.readState();
    const before = state.traits.length;
    state.traits = state.traits.filter((t) => t.key !== key);
    if (state.traits.length === before) return false;
    this.writeState(state);
    return true;
  }

  /* ── auto-extract ─────────────────────────────────────────── */

  /** Detect explicit "remember this" instructions in user message. */
  private static readonly REMEMBER_PATTERN = /\b(?:remember (?:that|this)|don'?t forget|keep in mind|make a note|note that)\b/i;

  static isExplicitRememberInstruction(text: string): boolean {
    return PrivateMemoryService.REMEMBER_PATTERN.test(text);
  }

  /**
   * Scans a user message + assistant reply for facts worth remembering.
   * Lightweight keyword heuristic — runs after every private reply.
   * Persona-scoped: entries are tagged with the active persona.
   */
  extractAndStore(userMessage: string, assistantReply: string, persona?: PrivatePersonaKind): MemoryEntry[] {
    const added: MemoryEntry[] = [];
    // Cherry can only write when user explicitly says "remember"
    const explicit = PrivateMemoryService.isExplicitRememberInstruction(userMessage);
    if (persona === "private_girlfriend" && !explicit) {
      return added; // Cherry auto-extract is off unless user says "remember"
    }

    // Preference patterns: "I like X", "I prefer X", "my favorite X is Y"
    const prefPatterns = [
      /\bi (?:like|love|enjoy|prefer)\s+(.{3,60}?)(?:\.|,|$)/gi,
      /\bmy (?:favorite|favourite)\s+\w+\s+is\s+(.{3,60}?)(?:\.|,|$)/gi,
    ];

    for (const pattern of prefPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(userMessage)) !== null) {
        const fact = match[1].trim();
        if (fact.length > 3 && !this.alreadyKnown(fact)) {
          added.push(
            this.addEntry("User preference", fact, ["preference", "auto-extracted"], "conversation", persona, true),
          );
        }
      }
    }

    // Name/identity: "my name is X", "call me X", "I'm X"
    const namePatterns = [
      /\bmy name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /\bcall me\s+([A-Z][a-z]+)/i,
    ];
    for (const pattern of namePatterns) {
      const match = pattern.exec(userMessage);
      if (match) {
        const name = match[1].trim();
        if (!this.alreadyKnown(name)) {
          this.setTrait("user_name", name, persona, true);
          added.push(
            this.addEntry("User name", name, ["identity", "auto-extracted"], "conversation", persona, true),
          );
        }
      }
    }

    // Important dates: "my birthday is X"
    const datePatterns = [
      /\bmy birthday is\s+(.{3,30}?)(?:\.|,|$)/i,
      /\bmy anniversary is\s+(.{3,30}?)(?:\.|,|$)/i,
    ];
    for (const pattern of datePatterns) {
      const match = pattern.exec(userMessage);
      if (match) {
        const dateVal = match[1].trim();
        const key = pattern.source.includes("birthday") ? "user_birthday" : "user_anniversary";
        if (!this.alreadyKnown(dateVal)) {
          this.setTrait(key, dateVal, persona, true);
          added.push(
            this.addEntry(key.replace("_", " "), dateVal, ["date", "auto-extracted"], "conversation", persona, true),
          );
        }
      }
    }

    return added;
  }

  /* ── build context for prompt ─────────────────────────────── */

  buildPersonalityContext(persona?: PrivatePersonaKind): string {
    const traits = this.getTraits(persona);
    if (traits.length === 0) return "";

    const lines = traits.map((t) => `- ${t.key}: ${t.value}`);
    return `Known facts about the user:\n${lines.join("\n")}`;
  }

  buildMemoryContext(limit = 8, persona?: PrivatePersonaKind): string {
    const entries = this.recallRecent(limit, persona);
    if (entries.length === 0) return "No private memories stored yet.";

    return `Private memory entries:\n${entries
      .map((e, i) => `${i + 1}. ${e.title}: ${e.body}`)
      .join("\n")}`;
  }

  /* ── internal ─────────────────────────────────────────────── */

  private alreadyKnown(fact: string): boolean {
    const needle = fact.toLowerCase();
    const state = this.readState();
    return (
      state.entries.some((e) => e.body.toLowerCase().includes(needle)) ||
      state.traits.some((t) => t.value.toLowerCase().includes(needle))
    );
  }

  private readState(): PrivateMemoryFileState {
    if (!existsSync(this.memoryPath)) {
      return { entries: [], traits: [] };
    }
    const raw = readFileSync(this.memoryPath, "utf8").trim();
    if (!raw) return { entries: [], traits: [] };

    const parsed = JSON.parse(raw) as Partial<PrivateMemoryFileState>;
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const traits = Array.isArray(parsed.traits) ? parsed.traits : [];
    return {
      entries: entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      traits,
    };
  }

  private writeState(state: PrivateMemoryFileState): void {
    mkdirSync(dirname(this.memoryPath), { recursive: true });
    writeFileSync(this.memoryPath, JSON.stringify(state, null, 2));
  }
}
