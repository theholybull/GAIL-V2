import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, normalize, relative, resolve } from "node:path";
import type { FileReadResult, FileSystemEntry } from "../../shared/contracts/index";
import { HttpError } from "../api/http-error";

const TEXT_EXTENSIONS = new Set([
  ".ts", ".js", ".json", ".md", ".txt", ".html", ".css", ".scss",
  ".yaml", ".yml", ".xml", ".csv", ".env", ".ps1", ".bat", ".sh",
  ".log", ".cfg", ".ini", ".toml", ".gitignore", ".editorconfig", ".py",
]);

const DEFAULT_VIEWER_URL = process.env.GAIL_ANIMATION_VIEWER_URL ?? "http://127.0.0.1:8778/metadata/viewer_runtime.html";
const MAX_FILE_READ_BYTES = 512 * 1024;

export type AnimationWorkbenchCollectionType = "action_sequence" | "clothing_set" | "item_set";

export interface AnimationWorkbenchItem {
  id: string;
  label: string;
  sourcePath: string;
  sourceType: string;
  category?: string;
  slot?: string;
  gapAfterFrames?: number;
}

export interface AnimationWorkbenchCollection {
  id: string;
  name: string;
  type: AnimationWorkbenchCollectionType;
  avatarId?: string;
  avatarSystem?: string;
  wardrobePresetId?: string;
  blendPath?: string;
  outputBlendPath?: string;
  armatureName?: string;
  runtimeProfile?: "high" | "medium" | "low";
  actionPrefix?: string;
  gapFrames?: number;
  notes?: string;
  items: AnimationWorkbenchItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AnimationWorkbenchJob {
  id: string;
  collectionId: string;
  collectionName: string;
  mode: "compose_actions";
  status: "queued" | "running" | "completed" | "completed_with_errors" | "failed";
  createdAt: string;
  updatedAt: string;
  manifestPath: string;
  progressPath: string;
  reportPath: string;
  logPath: string;
  error?: string;
  exitCode?: number;
}

export interface AnimationWorkbenchRoot {
  id: string;
  label: string;
  basePath: string;
}

export interface AnimationWorkbenchLibraryItem {
  id: string;
  annotation: string;
  name?: string;
  fileName?: string;
  ext?: string;
  type?: string;
  resolvedPath?: string;
  filePath?: string;
  previewUrl?: string;
  category?: string;
  status?: string;
  files?: Record<string, string | undefined>;
}

const WORKBENCH_LIBRARY_SCAN_EXTENSIONS = new Set([".glb", ".gltf", ".fbx", ".anim", ".npz"]);

interface AnimationWorkbenchStore {
  collections: AnimationWorkbenchCollection[];
  latestJob: AnimationWorkbenchJob | null;
}

interface RunAnimationWorkbenchJobInput {
  collectionId: string;
}

interface UpsertAnimationWorkbenchCollectionInput {
  id?: string;
  name: string;
  type: AnimationWorkbenchCollectionType;
  avatarId?: string;
  avatarSystem?: string;
  wardrobePresetId?: string;
  blendPath?: string;
  outputBlendPath?: string;
  armatureName?: string;
  runtimeProfile?: "high" | "medium" | "low";
  actionPrefix?: string;
  gapFrames?: number;
  notes?: string;
  items: AnimationWorkbenchItem[];
}

export class AnimationWorkbenchService {
  private readonly repoRoot: string;
  private readonly storePath: string;
  private readonly jobsRoot: string;
  private readonly runnerScriptPath: string;
  private readonly animationIndexCandidates: string[];
  private readonly libraryRootCandidates: string[];
  private readonly roots: AnimationWorkbenchRoot[];

  constructor(repoRoot = resolve(process.cwd(), "..")) {
    this.repoRoot = repoRoot;
    this.storePath = resolve(repoRoot, "data", "client", "animation-workbench.json");
    this.jobsRoot = resolve(repoRoot, "data", "runtime", "animation-workbench-jobs");
    this.runnerScriptPath = resolve(repoRoot, "tools", "run-animation-workbench-job.ps1");
    this.animationIndexCandidates = [
      process.env.GAIL_WORKBENCH_ANIMATION_INDEX_PATH ?? "",
      resolve(repoRoot, "data", "animation_viewer", "metadata", "library_index.json"),
      resolve("D:\\Gail", "data", "animation_viewer", "metadata", "library_index.json"),
    ].filter(Boolean);
    this.libraryRootCandidates = [
      process.env.GAIL_WORKBENCH_LIBRARY_ROOT ?? "",
      resolve(repoRoot, "data", "animation-library", "converted_animations_20260401"),
      resolve(repoRoot, "..", "converted_animations_20260401"),
      resolve(repoRoot, "converted_animations_20260401"),
      resolve(repoRoot, "data", "animation_viewer", "animations"),
    ].filter(Boolean);
    this.roots = [
      { id: "workspace", label: "Workspace", basePath: repoRoot },
      { id: "d_gail", label: "D Gail", basePath: resolve("D:\\Gail") },
      { id: "d_root", label: "D Root", basePath: resolve("D:\\") },
    ].filter((entry) => existsSync(entry.basePath));
  }

  getViewerUrl(): string {
    return DEFAULT_VIEWER_URL;
  }

  listRoots(): AnimationWorkbenchRoot[] {
    return this.roots.map((entry) => ({ ...entry }));
  }

  listFiles(rootId: string, requestedPath: string): FileSystemEntry[] {
    const root = this.getRoot(rootId);
    const target = this.resolveSafe(root, requestedPath);
    if (!existsSync(target)) {
      throw new HttpError(404, `Path not found: ${requestedPath}`);
    }
    const stats = statSync(target);
    if (!stats.isDirectory()) {
      throw new HttpError(400, `Path is not a directory: ${requestedPath}`);
    }

    return readdirSync(target, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => {
        const absolutePath = resolve(target, entry.name);
        const entryStats = statSync(absolutePath);
        return {
          name: entry.name,
          path: relative(root.basePath, absolutePath).replaceAll("\\", "/"),
          type: entry.isDirectory() ? "directory" : "file",
          size: entryStats.size,
          modifiedAt: entryStats.mtime.toISOString(),
        } satisfies FileSystemEntry;
      })
      .sort((left, right) => {
        if (left.type !== right.type) {
          return left.type === "directory" ? -1 : 1;
        }
        return left.name.localeCompare(right.name);
      });
  }

  readFile(rootId: string, requestedPath: string): FileReadResult {
    const root = this.getRoot(rootId);
    const target = this.resolveSafe(root, requestedPath);
    if (!existsSync(target)) {
      throw new HttpError(404, `File not found: ${requestedPath}`);
    }
    const stats = statSync(target);
    if (stats.isDirectory()) {
      throw new HttpError(400, `Path is a directory, not a file: ${requestedPath}`);
    }
    if (stats.size > MAX_FILE_READ_BYTES) {
      throw new HttpError(413, `File too large (${stats.size} bytes).`);
    }
    const extension = extname(target).toLowerCase();
    if (extension && !TEXT_EXTENSIONS.has(extension)) {
      throw new HttpError(415, `Unsupported file type: ${extension}`);
    }

    return {
      path: relative(root.basePath, target).replaceAll("\\", "/"),
      content: readFileSync(target, "utf8"),
      size: stats.size,
      encoding: "utf8",
    };
  }

  listLibraryItems(): AnimationWorkbenchLibraryItem[] {
    const indexPath = this.resolveAnimationIndexPath();
    if (indexPath) {
      const raw = readFileSync(indexPath, "utf8").replace(/^\uFEFF/, "").trim();
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const indexedItems = parsed
            .map((entry) => entry as Record<string, unknown>)
            .map((entry) => {
              const files = this.normalizeFiles(entry.files, indexPath);
              const primaryFile = files?.glb ?? files?.gltf ?? files?.fbx ?? files?.anim ?? files?.npz ?? Object.values(files ?? {}).find(Boolean);
              return {
                id: String(entry.id ?? ""),
                annotation: String(entry.annotation ?? ""),
                name: String(entry.annotation ?? entry.id ?? ""),
                fileName: typeof entry.fileName === "string" ? entry.fileName : undefined,
                ext: typeof entry.ext === "string" ? entry.ext : undefined,
                type: typeof entry.type === "string" ? entry.type : undefined,
                resolvedPath: primaryFile,
                filePath: primaryFile,
                previewUrl: this.toLibraryPreviewUrl(primaryFile),
                category: typeof entry.category === "string" ? entry.category : undefined,
                status: typeof entry.status === "string" ? entry.status : undefined,
                files,
              } satisfies AnimationWorkbenchLibraryItem;
            })
            .filter((entry) => entry.id || entry.annotation)
            .slice(0, 5000);
          if (indexedItems.length > 0) {
            return indexedItems;
          }
        }
      }
    }

    return this.scanLibraryRoots();
  }

  getStore(): AnimationWorkbenchStore {
    return this.readStore();
  }

  createCollection(input: UpsertAnimationWorkbenchCollectionInput): AnimationWorkbenchStore {
    const now = new Date().toISOString();
    const store = this.readStore();
    const id = input.id?.trim() || this.slugify(input.name || `collection-${Date.now()}`);
    if (store.collections.some((entry) => entry.id === id)) {
      throw new HttpError(400, `Collection already exists: ${id}`);
    }

    store.collections.push({
      id,
      name: input.name,
      type: input.type,
      avatarId: input.avatarId,
      avatarSystem: input.avatarSystem,
      wardrobePresetId: input.wardrobePresetId,
      blendPath: input.blendPath,
      outputBlendPath: input.outputBlendPath,
      armatureName: input.armatureName,
      runtimeProfile: input.runtimeProfile,
      actionPrefix: input.actionPrefix,
      gapFrames: input.gapFrames,
      notes: input.notes,
      items: input.items.map((entry) => ({ ...entry })),
      createdAt: now,
      updatedAt: now,
    });

    this.writeStore(store);
    return store;
  }

  updateCollection(collectionId: string, input: UpsertAnimationWorkbenchCollectionInput): AnimationWorkbenchStore {
    const store = this.readStore();
    const collection = store.collections.find((entry) => entry.id === collectionId);
    if (!collection) {
      throw new HttpError(404, `Collection not found: ${collectionId}`);
    }

    collection.name = input.name;
    collection.type = input.type;
    collection.avatarId = input.avatarId;
    collection.avatarSystem = input.avatarSystem;
    collection.wardrobePresetId = input.wardrobePresetId;
    collection.blendPath = input.blendPath;
    collection.outputBlendPath = input.outputBlendPath;
    collection.armatureName = input.armatureName;
    collection.runtimeProfile = input.runtimeProfile;
    collection.actionPrefix = input.actionPrefix;
    collection.gapFrames = input.gapFrames;
    collection.notes = input.notes;
    collection.items = input.items.map((entry) => ({ ...entry }));
    collection.updatedAt = new Date().toISOString();

    this.writeStore(store);
    return store;
  }

  deleteCollection(collectionId: string): AnimationWorkbenchStore {
    const store = this.readStore();
    const before = store.collections.length;
    store.collections = store.collections.filter((entry) => entry.id !== collectionId);
    if (before === store.collections.length) {
      throw new HttpError(404, `Collection not found: ${collectionId}`);
    }
    this.writeStore(store);
    return store;
  }

  getLatestJob(): AnimationWorkbenchJob | null {
    const store = this.readStore();
    return this.refreshJobFromDisk(store.latestJob);
  }

  runJob(input: RunAnimationWorkbenchJobInput): AnimationWorkbenchJob {
    const store = this.readStore();
    const collection = store.collections.find((entry) => entry.id === input.collectionId);
    if (!collection) {
      throw new HttpError(404, `Collection not found: ${input.collectionId}`);
    }
    if (!collection.blendPath) {
      throw new HttpError(400, "Collection is missing blendPath.");
    }
    if (!collection.armatureName) {
      throw new HttpError(400, "Collection is missing armatureName.");
    }
    if (collection.items.length === 0) {
      throw new HttpError(400, "Collection has no items.");
    }
    if (collection.type !== "action_sequence") {
      throw new HttpError(400, "Only action_sequence collections can run compose jobs.");
    }
    if (!existsSync(this.runnerScriptPath)) {
      throw new HttpError(500, `Missing runner script: ${this.runnerScriptPath}`);
    }

    const jobId = `awb_${Date.now()}`;
    const jobRoot = resolve(this.jobsRoot, jobId);
    mkdirSync(jobRoot, { recursive: true });
    const manifestPath = resolve(jobRoot, "job-manifest.json");
    const reportPath = resolve(jobRoot, "job-report.json");
    const progressPath = resolve(jobRoot, "job-progress.json");
    const logPath = resolve(jobRoot, "job-output.log");

    const manifest = {
      job_id: jobId,
      created_at: new Date().toISOString(),
      blend_path: collection.blendPath,
      output_blend_path: collection.outputBlendPath || collection.blendPath,
      addon_root_parent: process.env.GAIL_ANIMOXTEND_ADDON_ROOT ?? resolve(this.repoRoot, "tools", "_animoxtend_1_2_2_unpack"),
      api_key_file: process.env.GAIL_ANIMOXTEND_API_KEY_FILE ?? resolve(this.repoRoot, "tools", "animoxtend_api_key.txt"),
      target_mapping_path: process.env.GAIL_ANIMOXTEND_TARGET_MAPPING ?? resolve(this.repoRoot, "tools", "mapping_profiles", "animo_target_victoria8_test_v2.json"),
      source_armature_name: process.env.GAIL_ANIMOXTEND_SOURCE_ARMATURE ?? "BufferArmature",
      target_armature_name: collection.armatureName,
      sequence_name: collection.actionPrefix?.trim() || collection.name,
      gap_frames: Number.isFinite(collection.gapFrames) ? collection.gapFrames : 12,
      report_path: reportPath,
      progress_path: progressPath,
      clips: collection.items.map((entry, index) => ({
        id: entry.id,
        label: entry.label,
        source_path: entry.sourcePath,
        source_type: entry.sourceType,
        category: entry.category,
        action_name: this.buildActionName(collection, entry, index),
        gap_after_frames: Number.isFinite(entry.gapAfterFrames) ? entry.gapAfterFrames : undefined,
      })),
    };

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    writeFileSync(progressPath, JSON.stringify({
      status: "queued",
      total: collection.items.length,
      completed: 0,
      failed: 0,
      current_clip: null,
      percent: 0,
      report_path: reportPath,
    }, null, 2));

    const job: AnimationWorkbenchJob = {
      id: jobId,
      collectionId: collection.id,
      collectionName: collection.name,
      mode: "compose_actions",
      status: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      manifestPath,
      progressPath,
      reportPath,
      logPath,
    };

    store.latestJob = job;
    this.writeStore(store);

    const child = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      this.runnerScriptPath,
      "-ManifestPath",
      manifestPath,
    ], {
      cwd: this.repoRoot,
      windowsHide: true,
    });

    let captured = "";
    const append = (chunk: Buffer | string): void => {
      captured += String(chunk);
      writeFileSync(logPath, captured, "utf8");
    };

    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", (error) => {
      this.updateLatestJob((current) => current && current.id === jobId
        ? {
            ...current,
            status: "failed",
            error: error.message,
            updatedAt: new Date().toISOString(),
          }
        : current);
    });
    child.on("spawn", () => {
      this.updateLatestJob((current) => current && current.id === jobId
        ? {
            ...current,
            status: "running",
            updatedAt: new Date().toISOString(),
          }
        : current);
    });
    child.on("close", (code) => {
      const refreshed = this.refreshJobFromDisk({ ...job, exitCode: code ?? undefined });
      this.updateLatestJob((current) => current && current.id === jobId
        ? {
            ...(refreshed ?? current),
            exitCode: code ?? undefined,
            status: code === 0 ? (refreshed?.status ?? "completed") : (refreshed?.status ?? "failed"),
            updatedAt: new Date().toISOString(),
            error: code === 0 ? refreshed?.error : (refreshed?.error ?? `Runner exited with code ${code ?? -1}`),
          }
        : current);
    });

    return job;
  }

  private readStore(): AnimationWorkbenchStore {
    if (!existsSync(this.storePath)) {
      const initial: AnimationWorkbenchStore = { collections: [], latestJob: null };
      this.writeStore(initial);
      return initial;
    }
    const raw = readFileSync(this.storePath, "utf8").replace(/^\uFEFF/, "").trim();
    if (!raw) {
      return { collections: [], latestJob: null };
    }
    const parsed = JSON.parse(raw) as Partial<AnimationWorkbenchStore>;
    return {
      collections: Array.isArray(parsed.collections) ? parsed.collections as AnimationWorkbenchCollection[] : [],
      latestJob: parsed.latestJob ? parsed.latestJob as AnimationWorkbenchJob : null,
    };
  }

  private writeStore(store: AnimationWorkbenchStore): void {
    mkdirSync(dirname(this.storePath), { recursive: true });
    writeFileSync(this.storePath, JSON.stringify(store, null, 2));
  }

  private updateLatestJob(mutator: (job: AnimationWorkbenchJob | null) => AnimationWorkbenchJob | null): void {
    const store = this.readStore();
    store.latestJob = mutator(store.latestJob);
    this.writeStore(store);
  }

  private refreshJobFromDisk(job: AnimationWorkbenchJob | null): AnimationWorkbenchJob | null {
    if (!job) {
      return null;
    }
    const next: AnimationWorkbenchJob = { ...job };
    if (existsSync(next.progressPath)) {
      try {
        const progress = JSON.parse(readFileSync(next.progressPath, "utf8")) as Record<string, unknown>;
        const progressStatus = typeof progress.status === "string" ? progress.status : undefined;
        if (progressStatus === "completed" || progressStatus === "completed_with_errors" || progressStatus === "failed") {
          next.status = progressStatus;
        }
      } catch {
      }
    }
    if (existsSync(next.reportPath)) {
      try {
        const report = JSON.parse(readFileSync(next.reportPath, "utf8")) as Record<string, unknown>;
        if (Array.isArray(report.errors) && report.errors.length > 0 && next.status === "completed") {
          next.status = "completed_with_errors";
        }
        if (typeof report.fatal_error === "string") {
          next.status = "failed";
          next.error = report.fatal_error;
        }
      } catch {
      }
    }
    return next;
  }

  private resolveAnimationIndexPath(): string | null {
    for (const candidate of this.animationIndexCandidates) {
      if (candidate && existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private scanLibraryRoots(): AnimationWorkbenchLibraryItem[] {
    const root = this.resolveLibraryRootPath();
    if (!root) {
      return [];
    }

    const allFiles: string[] = [];
    const walk = (dir: string): void => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".")) {
          continue;
        }
        const absolutePath = resolve(dir, entry.name);
        if (entry.isDirectory()) {
          walk(absolutePath);
          continue;
        }
        if (!entry.isFile()) {
          continue;
        }
        const extension = extname(entry.name).toLowerCase();
        if (!WORKBENCH_LIBRARY_SCAN_EXTENSIONS.has(extension)) {
          continue;
        }
        allFiles.push(absolutePath);
      }
    };

    walk(root);

    return allFiles
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 5000)
      .map((absolutePath) => {
        const relPath = relative(root, absolutePath).replaceAll("\\", "/");
        const name = basename(absolutePath, extname(absolutePath));
        const ext = extname(absolutePath).replace(/^\./, "").toLowerCase();
        const category = relPath.split("/")[0] || "other";
        const previewUrl = `/library-assets/${relPath}`;

        return {
          id: relPath,
          annotation: name,
          name,
          fileName: basename(absolutePath),
          ext,
          type: "extend_library",
          resolvedPath: previewUrl,
          filePath: previewUrl,
          previewUrl,
          category,
          status: "available",
          files: { [ext]: previewUrl },
        } satisfies AnimationWorkbenchLibraryItem;
      });
  }

  private resolveLibraryRootPath(): string | null {
    for (const candidate of this.libraryRootCandidates) {
      if (candidate && existsSync(candidate) && this.hasLibraryFiles(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private hasLibraryFiles(root: string): boolean {
    const pending = [root];
    while (pending.length > 0) {
      const current = pending.pop();
      if (!current) {
        continue;
      }
      const entries = readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".")) {
          continue;
        }
        const absolutePath = resolve(current, entry.name);
        if (entry.isDirectory()) {
          pending.push(absolutePath);
          continue;
        }
        if (!entry.isFile()) {
          continue;
        }
        if (WORKBENCH_LIBRARY_SCAN_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
          return true;
        }
      }
    }
    return false;
  }

  private toLibraryPreviewUrl(entry: string | undefined): string | undefined {
    if (!entry) {
      return undefined;
    }
    const normalized = entry.replaceAll("\\", "/");
    if (normalized.startsWith("/library-assets/") || normalized.startsWith("/client-assets/")) {
      return normalized;
    }
    for (const root of this.libraryRootCandidates) {
      const rootNormalized = root.replaceAll("\\", "/");
      if (normalized.toLowerCase().startsWith(rootNormalized.toLowerCase() + "/")) {
        const rel = normalized.slice(rootNormalized.length + 1);
        return `/library-assets/${rel}`;
      }
    }
    return undefined;
  }

  private normalizeFiles(value: unknown, indexPath: string): Record<string, string | undefined> | undefined {
    if (!value || typeof value !== "object") {
      return undefined;
    }
    const record = value as Record<string, unknown>;
    const output: Record<string, string | undefined> = {};
    for (const [key, entry] of Object.entries(record)) {
      output[key] = typeof entry === "string" ? this.normalizeIndexedPath(entry, indexPath) : undefined;
    }
    return output;
  }

  private normalizeIndexedPath(entry: string, indexPath: string): string {
    if (!entry) {
      return entry;
    }
    if (/^[a-z]+:\/\//i.test(entry)) {
      return entry;
    }
    if (isAbsolute(entry)) {
      return entry;
    }

    const sanitized = entry.replace(/^\/+/, "").replaceAll("/", "\\");
    const metadataRootResolved = resolve(dirname(indexPath), sanitized);
    if (existsSync(metadataRootResolved)) {
      return metadataRootResolved;
    }

    const repoResolved = resolve(this.repoRoot, sanitized);
    if (existsSync(repoResolved)) {
      return repoResolved;
    }

    return repoResolved;
  }

  private getRoot(rootId: string): AnimationWorkbenchRoot {
    const root = this.roots.find((entry) => entry.id === rootId);
    if (!root) {
      throw new HttpError(404, `Unknown root: ${rootId}`);
    }
    return root;
  }

  private resolveSafe(root: AnimationWorkbenchRoot, requestedPath: string): string {
    const normalized = normalize(resolve(root.basePath, requestedPath || "."));
    if (!normalized.toLowerCase().startsWith(root.basePath.toLowerCase())) {
      throw new HttpError(403, "Access denied: path is outside the allowed root directory.");
    }
    return normalized;
  }

  private buildActionName(collection: AnimationWorkbenchCollection, entry: AnimationWorkbenchItem, index: number): string {
    const prefix = this.slugify(collection.actionPrefix?.trim() || collection.name || "sequence");
    const label = this.slugify(entry.label || entry.id || basename(entry.sourcePath, extname(entry.sourcePath)) || `clip_${index + 1}`);
    return `${prefix}_${String(index + 1).padStart(2, "0")}_${label}`;
  }

  private slugify(value: string): string {
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return normalized || `item_${Date.now()}`;
  }
}
