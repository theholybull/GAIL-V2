import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, extname } from "node:path";
import type { ImportDocumentsInput, ImportDocumentItemInput } from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { RequestMeta } from "../api/request-meta";
import { HttpError } from "../api/http-error";
import { MemoryService } from "./memory-service";
import { NoteService } from "./note-service";
import { ProjectService } from "./project-service";

type ImportResultItem = {
  title: string;
  target: "memory" | "note";
  createdId: string;
  archivedPath?: string;
  extractedCharacters: number;
  warnings: string[];
};

export class ImportService {
  private readonly importRoot: string;

  constructor(
    private readonly memoryService = new MemoryService(),
    private readonly noteService = new NoteService(),
    private readonly projectService = new ProjectService(),
    importRoot = process.env.GAIL_IMPORTS_PATH ?? resolve(process.cwd(), "..", "data", "imports"),
  ) {
    this.importRoot = importRoot;
  }

  importDocuments(meta: RequestMeta, input: ImportDocumentsInput): {
    importedAt: string;
    itemCount: number;
    items: ImportResultItem[];
  } {
    const importedAt = new Date().toISOString();
    const items = input.items.map((item) => this.importSingle(meta, item, importedAt));
    return {
      importedAt,
      itemCount: items.length,
      items,
    };
  }

  private importSingle(meta: RequestMeta, item: ImportDocumentItemInput, importedAt: string): ImportResultItem {
    const warnings: string[] = [];
    const buffer = item.fileBase64 ? this.decodeBase64(item.fileBase64) : undefined;
    const fileName = item.fileName?.trim();
    const mimeType = item.mimeType?.trim();
    const isPdf = mimeType === "application/pdf" || extname(fileName ?? "").toLowerCase() === ".pdf";
    let archivedPath: string | undefined;

    if (buffer && item.archiveOriginal !== false) {
      archivedPath = this.archiveOriginalFile(fileName ?? "import.bin", buffer, importedAt);
    }

    let body = item.body?.trim();
    if (!body && buffer) {
      if (isPdf) {
        const pdfPath = archivedPath ?? this.archiveOriginalFile(fileName ?? "import.pdf", buffer, importedAt);
        const extracted = this.extractPdfText(pdfPath);
        warnings.push(...extracted.warnings);
        body = extracted.text || this.extractPdfTextHeuristic(buffer);
        if (!body) {
          warnings.push("No reliable PDF text was extracted; original file was archived for later review.");
        }
      } else {
        body = this.extractTextBuffer(buffer);
      }
    }

    if (!body && archivedPath) {
      body = [
        `Imported file: ${fileName ?? "uploaded document"}`,
        mimeType ? `Mime type: ${mimeType}` : undefined,
        `Archived path: ${archivedPath}`,
        "No readable text was extracted from the uploaded file.",
      ].filter(Boolean).join("\n");
    }

    if (!body) {
      throw new HttpError(400, `Import item ${fileName ?? "(untitled)"} did not include readable text or an archivable file.`);
    }

    const title = item.title?.trim() || this.deriveTitle(fileName, body);
    const source = item.source?.trim() || this.deriveSource(fileName, item.target);
    const tags = item.tags ?? [];
    const finalBody = archivedPath
      ? `${body}\n\n[Imported file]\n- name: ${fileName ?? "uploaded document"}\n- archivedPath: ${archivedPath}`
      : body;

    if (item.target === "memory") {
      const created = this.memoryService.addEntry(meta, {
        title,
        body: finalBody,
        tags,
        source,
      });
      return {
        title: created.title,
        target: "memory",
        createdId: created.id,
        archivedPath,
        extractedCharacters: body.length,
        warnings,
      };
    }

    if (item.projectId && !this.projectService.getById(item.projectId)) {
      throw new HttpError(404, `Project ${item.projectId} not found for imported note ${title}.`);
    }

    const created = this.noteService.createForMode(meta, {
      title,
      body: finalBody,
      projectId: item.projectId,
      privateOnly: false,
    });
    return {
      title: created.title,
      target: "note",
      createdId: created.id,
      archivedPath,
      extractedCharacters: body.length,
      warnings,
    };
  }

  private archiveOriginalFile(fileName: string, buffer: Buffer, importedAt: string): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const stamp = importedAt.slice(0, 10).replace(/-/g, "");
    const archiveDir = resolve(this.importRoot, stamp);
    mkdirSync(archiveDir, { recursive: true });
    const archiveName = `${createScaffoldId("import_file")}_${safeName}`;
    const fullPath = resolve(archiveDir, archiveName);
    writeFileSync(fullPath, buffer);
    return fullPath;
  }

  private decodeBase64(value: string): Buffer {
    try {
      return Buffer.from(value, "base64");
    } catch {
      throw new HttpError(400, "fileBase64 must be valid base64 data.");
    }
  }

  private extractTextBuffer(buffer: Buffer): string {
    const utf8 = buffer.toString("utf8").replace(/\u0000/g, "").trim();
    if (utf8) {
      return utf8;
    }
    return buffer.toString("latin1").replace(/\u0000/g, "").trim();
  }

  private extractPdfTextHeuristic(buffer: Buffer): string {
    const raw = buffer.toString("latin1");
    const fragments: string[] = [];

    for (const match of raw.matchAll(/\(([^()]{2,400})\)\s*T[Jj]/g)) {
      const cleaned = this.cleanPdfTextFragment(match[1] ?? "");
      if (cleaned) {
        fragments.push(cleaned);
      }
    }

    for (const match of raw.matchAll(/<([0-9A-Fa-f\s]{8,800})>\s*T[Jj]/g)) {
      const decoded = this.decodePdfHex(match[1] ?? "");
      if (decoded) {
        fragments.push(decoded);
      }
    }

    for (const match of raw.matchAll(/[A-Za-z0-9][A-Za-z0-9 ,.;:'"()\/_-]{24,240}/g)) {
      const cleaned = this.cleanPdfTextFragment(match[0] ?? "");
      if (cleaned) {
        fragments.push(cleaned);
      }
    }

    const unique = [...new Set(fragments)]
      .filter((fragment) => !/^(obj|endobj|stream|endstream|Type|Font|Length|Filter)$/i.test(fragment))
      .slice(0, 200);

    return unique.join("\n").trim();
  }

  private extractPdfText(pdfPath: string): { text: string; warnings: string[] } {
    try {
      const scriptPath = resolve(process.cwd(), "..", "tools", "extract_pdf_text.py");
      const raw = execFileSync("python", [scriptPath, pdfPath], {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 30_000,
        maxBuffer: 2 * 1024 * 1024,
      }).trim();
      const parsed = JSON.parse(raw) as { text?: string; warnings?: string[] };
      return {
        text: parsed.text?.trim() ?? "",
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      };
    } catch (error) {
      return {
        text: "",
        warnings: [
          `Python PDF extraction failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  private decodePdfHex(hex: string): string {
    const normalized = hex.replace(/\s+/g, "");
    if (!normalized || normalized.length % 2 !== 0) {
      return "";
    }

    try {
      return this.cleanPdfTextFragment(Buffer.from(normalized, "hex").toString("utf8"));
    } catch {
      return "";
    }
  }

  private cleanPdfTextFragment(value: string): string {
    return value
      .replace(/\\[nrtbf()\\]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[^\x20-\x7E]+/g, " ")
      .trim();
  }

  private deriveTitle(fileName: string | undefined, body: string): string {
    const fromFile = fileName?.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    if (fromFile) {
      return fromFile;
    }
    const collapsed = body.replace(/\s+/g, " ").trim();
    return collapsed.length > 72 ? `${collapsed.slice(0, 69)}...` : collapsed;
  }

  private deriveSource(fileName: string | undefined, target: "memory" | "note"): string {
    return fileName ? `import:${target}:${fileName}` : `import:${target}`;
  }
}
