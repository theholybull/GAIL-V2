import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";

export type ExportRunner = "avatar-assets" | "playcanvas-pipeline";
export type ExportRuntimeProfile = "high" | "medium" | "low";

export interface RunExportInput {
  runner: ExportRunner;
  runtimeProfile: ExportRuntimeProfile;
  includeReview?: boolean;
}

interface ExportReportEntry {
  type?: string;
  path?: string;
}

interface ModuleExportReport {
  profile?: string;
  profile_label?: string;
  exports?: ExportReportEntry[];
}

interface RegularAvatarBuildReport {
  source_master_file?: string;
  output_regular_file?: string;
  removed?: string[];
}

export interface ExportReportSummary {
  exists: boolean;
  relativePath: string;
  updatedAt?: string;
  profile?: string;
  profileLabel?: string;
  exportCount?: number;
  exportsByType?: Record<string, number>;
  samplePaths?: string[];
  removedCount?: number;
  sourceMasterFile?: string;
  outputRegularFile?: string;
}

export interface ExportStatusResponse {
  scriptPaths: {
    avatarAssets: string;
    playcanvasPipeline: string;
    pipelineDoc: string;
  };
  reports: {
    moduleExport: ExportReportSummary;
    regularAvatarBuild: ExportReportSummary;
  };
}

export interface ExportRunResponse {
  runner: ExportRunner;
  runtimeProfile: ExportRuntimeProfile;
  command: string;
  durationMs: number;
  stdout: string;
  stderr: string;
  status: ExportStatusResponse;
}

interface CommandResult {
  stdout: string;
  stderr: string;
}

const MAX_CAPTURE_CHARS = 60000;

export class ExportService {
  private readonly repoRoot: string;
  private readonly toolsRoot: string;
  private readonly reportsRoot: string;

  constructor(repoRoot = resolve(process.cwd(), "..")) {
    this.repoRoot = repoRoot;
    this.toolsRoot = resolve(repoRoot, "tools");
    this.reportsRoot = resolve(repoRoot, "blender", "animation_master", "exports", "reports");
  }

  getStatus(): ExportStatusResponse {
    return {
      scriptPaths: {
        avatarAssets: this.relativeToRepo(this.getRunnerScriptPath("avatar-assets")),
        playcanvasPipeline: this.relativeToRepo(this.getRunnerScriptPath("playcanvas-pipeline")),
        pipelineDoc: this.relativeToRepo(resolve(this.repoRoot, "docs", "PLAYCANVAS_AVATAR_PIPELINE.md")),
      },
      reports: {
        moduleExport: this.summarizeModuleExportReport(),
        regularAvatarBuild: this.summarizeRegularAvatarBuildReport(),
      },
    };
  }

  async runExport(input: RunExportInput): Promise<ExportRunResponse> {
    const scriptPath = this.getRunnerScriptPath(input.runner);
    const args = [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-RuntimeProfile",
      input.runtimeProfile,
    ];
    if (input.runner === "playcanvas-pipeline" && input.includeReview) {
      args.push("-IncludeReview");
    }

    const startedAt = Date.now();
    const result = await this.runPowerShell(args);
    return {
      runner: input.runner,
      runtimeProfile: input.runtimeProfile,
      command: ["powershell.exe", ...args].join(" "),
      durationMs: Date.now() - startedAt,
      stdout: result.stdout,
      stderr: result.stderr,
      status: this.getStatus(),
    };
  }

  private getRunnerScriptPath(runner: ExportRunner): string {
    if (runner === "avatar-assets") {
      return resolve(this.toolsRoot, "export-avatar-assets.ps1");
    }
    return resolve(this.toolsRoot, "export-playcanvas-pipeline.ps1");
  }

  private summarizeModuleExportReport(): ExportReportSummary {
    const reportPath = resolve(this.reportsRoot, "playcanvas_asset_export_report.json");
    if (!existsSync(reportPath)) {
      return {
        exists: false,
        relativePath: this.relativeToRepo(reportPath),
      };
    }

    const payload = JSON.parse(readFileSync(reportPath, "utf8")) as ModuleExportReport;
    const exports = Array.isArray(payload.exports) ? payload.exports : [];
    const exportsByType: Record<string, number> = {};
    for (const entry of exports) {
      const key = String(entry.type ?? "unknown");
      exportsByType[key] = (exportsByType[key] ?? 0) + 1;
    }

    return {
      exists: true,
      relativePath: this.relativeToRepo(reportPath),
      updatedAt: statSync(reportPath).mtime.toISOString(),
      profile: payload.profile,
      profileLabel: payload.profile_label,
      exportCount: exports.length,
      exportsByType,
      samplePaths: exports
        .map((entry) => entry.path)
        .filter((entry): entry is string => Boolean(entry))
        .slice(0, 5)
        .map((entry) => this.normalizePath(entry)),
    };
  }

  private summarizeRegularAvatarBuildReport(): ExportReportSummary {
    const reportPath = resolve(this.reportsRoot, "regular_avatar_build_report.json");
    if (!existsSync(reportPath)) {
      return {
        exists: false,
        relativePath: this.relativeToRepo(reportPath),
      };
    }

    const payload = JSON.parse(readFileSync(reportPath, "utf8")) as RegularAvatarBuildReport;
    return {
      exists: true,
      relativePath: this.relativeToRepo(reportPath),
      updatedAt: statSync(reportPath).mtime.toISOString(),
      removedCount: Array.isArray(payload.removed) ? payload.removed.length : 0,
      sourceMasterFile: payload.source_master_file,
      outputRegularFile: payload.output_regular_file,
    };
  }

  private async runPowerShell(args: string[]): Promise<CommandResult> {
    return await new Promise<CommandResult>((resolvePromise, rejectPromise) => {
      const child = spawn("powershell.exe", args, {
        cwd: this.repoRoot,
        windowsHide: true,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout = this.appendCapturedText(stdout, String(chunk));
      });
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr = this.appendCapturedText(stderr, String(chunk));
      });
      child.on("error", (error) => {
        rejectPromise(error);
      });
      child.on("close", (code) => {
        if (code !== 0) {
          rejectPromise(
            new Error(
              (stderr.trim() || stdout.trim() || `Export runner failed with exit code ${code ?? -1}.`),
            ),
          );
          return;
        }
        resolvePromise({ stdout: stdout.trim(), stderr: stderr.trim() });
      });
    });
  }

  private appendCapturedText(current: string, nextChunk: string): string {
    const combined = current + nextChunk;
    if (combined.length <= MAX_CAPTURE_CHARS) {
      return combined;
    }
    return combined.slice(combined.length - MAX_CAPTURE_CHARS);
  }

  private relativeToRepo(absolutePath: string): string {
    return this.normalizePath(relative(this.repoRoot, absolutePath));
  }

  private normalizePath(value: string): string {
    return value.replaceAll("\\", "/");
  }
}