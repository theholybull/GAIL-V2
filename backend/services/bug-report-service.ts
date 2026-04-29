import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { createScaffoldId } from "../../shared/index";
import { HttpError } from "../api/http-error";

export type BugStatus = "open" | "in_progress" | "blocked" | "done";

export interface BugReportRecord {
  id: string;
  title: string;
  details?: string;
  status: BugStatus;
  createdAt: string;
  updatedAt: string;
  workspace: string;
  pageId: string;
  mode: string;
  runtimeProfile: string;
  screenshotPaths: string[];
  notes: string[];
}

interface BugReportFile {
  items: BugReportRecord[];
}

export interface CreateBugReportInput {
  title: string;
  details?: string;
  status?: BugStatus;
  workspace: string;
  pageId: string;
  mode: string;
  runtimeProfile: string;
  screenshotPaths?: string[];
}

export interface UpdateBugReportInput {
  title?: string;
  details?: string;
  status?: BugStatus;
  note?: string;
}

export interface AddBugScreenshotInput {
  pageId?: string;
  sourcePath?: string;
  imageBase64?: string;
}

export class BugReportService {
  private readonly logPath: string;
  private readonly screenshotsDir: string;

  constructor(
    logPath = process.env.GAIL_BUG_REPORT_LOG_PATH ?? resolve(process.cwd(), "..", "data", "reports", "bug-log.json"),
    screenshotsDir = process.env.GAIL_BUG_REPORT_SCREENSHOTS_DIR ?? resolve(process.cwd(), "..", "data", "reports", "screenshots"),
  ) {
    this.logPath = logPath;
    this.screenshotsDir = screenshotsDir;
  }

  list(status?: BugStatus): BugReportRecord[] {
    const all = this.read().items;
    const filtered = status ? all.filter((entry) => entry.status === status) : all;
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  create(input: CreateBugReportInput): BugReportRecord {
    const now = new Date().toISOString();
    const current = this.read();
    const record: BugReportRecord = {
      id: createScaffoldId("bug_report"),
      title: input.title,
      details: input.details,
      status: input.status ?? "open",
      createdAt: now,
      updatedAt: now,
      workspace: input.workspace,
      pageId: input.pageId,
      mode: input.mode,
      runtimeProfile: input.runtimeProfile,
      screenshotPaths: [...(input.screenshotPaths ?? [])],
      notes: [],
    };
    const next: BugReportFile = {
      items: [record, ...current.items].slice(0, 5000),
    };
    this.write(next);
    return record;
  }

  update(id: string, input: UpdateBugReportInput): BugReportRecord {
    const current = this.read();
    const index = current.items.findIndex((entry) => entry.id === id);
    if (index === -1) {
      throw new HttpError(404, "Bug report not found.");
    }
    const existing = current.items[index];
    const updated: BugReportRecord = {
      ...existing,
      title: input.title ?? existing.title,
      details: input.details ?? existing.details,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
      notes: input.note ? [...existing.notes, input.note] : existing.notes,
    };
    current.items[index] = updated;
    this.write(current);
    return updated;
  }

  addScreenshot(id: string, input: AddBugScreenshotInput): BugReportRecord {
    const current = this.read();
    const index = current.items.findIndex((entry) => entry.id === id);
    if (index === -1) {
      throw new HttpError(404, "Bug report not found.");
    }

    const record = current.items[index];
    const stamp = timestampStamp();
    const pageKey = sanitizeToken(input.pageId ?? record.pageId ?? "unknown");
    const fileName = `bug_${stamp}_${pageKey}.png`;
    const destination = join(this.screenshotsDir, fileName);
    mkdirSync(dirname(destination), { recursive: true });

    if (input.imageBase64) {
      const raw = normalizeBase64(input.imageBase64);
      writeFileSync(destination, Buffer.from(raw, "base64"));
    } else if (input.sourcePath && existsSync(input.sourcePath)) {
      const sourceExt = extname(input.sourcePath).toLowerCase();
      if (sourceExt === ".png") {
        copyFileSync(input.sourcePath, destination);
      } else {
        // Store known data with deterministic PNG naming when non-png source is provided.
        writeFileSync(destination, Buffer.from(ONE_BY_ONE_PNG_BASE64, "base64"));
      }
    } else {
      writeFileSync(destination, Buffer.from(ONE_BY_ONE_PNG_BASE64, "base64"));
    }

    const relativePath = normalizeSlashes(destination);
    const updated: BugReportRecord = {
      ...record,
      updatedAt: new Date().toISOString(),
      screenshotPaths: [...record.screenshotPaths, relativePath],
    };
    current.items[index] = updated;
    this.write(current);
    return updated;
  }

  private read(): BugReportFile {
    this.ensureStorage();
    if (!existsSync(this.logPath)) {
      return { items: [] };
    }
    const raw = readFileSync(this.logPath, "utf8").trim();
    if (!raw) {
      return { items: [] };
    }
    const parsed = JSON.parse(raw) as Partial<BugReportFile>;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  }

  private write(data: BugReportFile): void {
    this.ensureStorage();
    writeFileSync(this.logPath, JSON.stringify(data, null, 2));
  }

  private ensureStorage(): void {
    mkdirSync(dirname(this.logPath), { recursive: true });
    mkdirSync(this.screenshotsDir, { recursive: true });
    if (!existsSync(this.logPath)) {
      writeFileSync(this.logPath, JSON.stringify({ items: [] }, null, 2));
    }
  }
}

function normalizeBase64(input: string): string {
  const marker = "base64,";
  const idx = input.indexOf(marker);
  if (idx >= 0) {
    return input.slice(idx + marker.length);
  }
  return input;
}

function timestampStamp(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${MM}${dd}_${HH}${mm}${ss}`;
}

function sanitizeToken(value: string): string {
  const token = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return token || "unknown";
}

function normalizeSlashes(pathValue: string): string {
  return pathValue.replaceAll("\\", "/");
}

const ONE_BY_ONE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8d0f0AAAAASUVORK5CYII=";
