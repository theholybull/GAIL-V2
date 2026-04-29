import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, resolve, relative, normalize } from "node:path";
import type { FileSystemEntry, FileReadResult } from "../../shared/contracts/index";
import { HttpError } from "../api/http-error";

const TEXT_EXTENSIONS = new Set([
  ".ts", ".js", ".json", ".md", ".txt", ".html", ".css", ".scss",
  ".yaml", ".yml", ".xml", ".csv", ".env", ".ps1", ".bat", ".sh",
  ".log", ".cfg", ".ini", ".toml", ".gitignore", ".editorconfig",
]);

const MAX_FILE_READ_BYTES = 512 * 1024; // 512 KB

export class FileSystemService {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = resolve(rootDir);
  }

  listDirectory(requestedPath: string): FileSystemEntry[] {
    const target = this.resolveSafe(requestedPath);
    if (!existsSync(target)) {
      throw new HttpError(404, `Path not found: ${requestedPath}`);
    }
    const stats = statSync(target);
    if (!stats.isDirectory()) {
      throw new HttpError(400, `Path is not a directory: ${requestedPath}`);
    }

    const entries = readdirSync(target, { withFileTypes: true });
    return entries
      .filter((entry) => !entry.name.startsWith(".") && entry.name !== "node_modules")
      .map((entry) => {
        const fullPath = resolve(target, entry.name);
        const relativePath = relative(this.rootDir, fullPath).replace(/\\/g, "/");
        const result: FileSystemEntry = {
          name: entry.name,
          path: relativePath,
          type: entry.isDirectory() ? "directory" : "file",
        };
        try {
          const entryStats = statSync(fullPath);
          result.size = entryStats.size;
          result.modifiedAt = entryStats.mtime.toISOString();
        } catch {
          // stat failed — return entry without size/date
        }
        return result;
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }

  readFile(requestedPath: string): FileReadResult {
    const target = this.resolveSafe(requestedPath);
    if (!existsSync(target)) {
      throw new HttpError(404, `File not found: ${requestedPath}`);
    }
    const stats = statSync(target);
    if (stats.isDirectory()) {
      throw new HttpError(400, `Path is a directory, not a file: ${requestedPath}`);
    }
    if (stats.size > MAX_FILE_READ_BYTES) {
      throw new HttpError(413, `File too large (${stats.size} bytes). Maximum: ${MAX_FILE_READ_BYTES} bytes.`);
    }

    const ext = extname(target).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext) && ext !== "") {
      throw new HttpError(415, `Unsupported file type: ${ext}. Only text files can be read.`);
    }

    const content = readFileSync(target, "utf8");
    return {
      path: relative(this.rootDir, target).replace(/\\/g, "/"),
      content,
      size: stats.size,
      encoding: "utf8",
    };
  }

  private resolveSafe(requestedPath: string): string {
    const normalized = normalize(resolve(this.rootDir, requestedPath));
    if (!normalized.startsWith(this.rootDir)) {
      throw new HttpError(403, "Access denied: path is outside the allowed root directory.");
    }
    return normalized;
  }
}
