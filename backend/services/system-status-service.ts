import type {
  SystemStatus,
  SystemHealthEntry,
  SystemErrorEntry,
} from "../../shared/contracts/index";
import type { BuildControlService } from "./build-control-service";
import type { ProviderService } from "./provider-service";
import type { VoiceService } from "./voice-service";

const MAX_ERROR_HISTORY = 100;
const startTime = Date.now();

export class SystemStatusService {
  private readonly errors: SystemErrorEntry[] = [];

  constructor(
    private readonly buildControlService: BuildControlService,
    private readonly providerService: ProviderService,
    private readonly voiceService: VoiceService,
  ) {}

  getStatus(): SystemStatus {
    const now = new Date().toISOString();
    const health = this.checkHealth(now);
    const providers = this.providerService.list();
    const activeProvider = providers.find((p) => p.status === "ready" || p.status === "connected");
    const voiceSettings = this.voiceService.getSettings();
    const ttsEngines = this.voiceService.listTtsEngines();
    const buildOverview = this.buildControlService.getOverview();
    const agents = this.buildControlService.getAgents();

    return {
      generatedAt: now,
      uptime: Math.round((Date.now() - startTime) / 1000),
      health,
      providers: {
        active: activeProvider?.provider ?? "none",
        available: providers.filter((p) => p.available !== false).map((p) => p.provider),
        lastFallbackReason: (providers.find((p) => p.lastFallbackEvent) as { lastFallbackEvent?: { reasonClass?: string } } | undefined)?.lastFallbackEvent?.reasonClass,
      },
      voice: {
        ttsReady: ttsEngines.some((e) => e.key === voiceSettings.preferredTtsEngine && e.available),
        sttReady: voiceSettings.sttEngine === "browser-web-speech",
      },
      build: buildOverview,
      agents,
      recentErrors: this.errors.slice(0, 20),
    };
  }

  recordError(source: string, message: string, level: "error" | "warning" = "error"): void {
    this.errors.unshift({
      timestamp: new Date().toISOString(),
      source,
      message,
      level,
    });
    if (this.errors.length > MAX_ERROR_HISTORY) {
      this.errors.length = MAX_ERROR_HISTORY;
    }
  }

  getErrors(limit = 20): SystemErrorEntry[] {
    return this.errors.slice(0, limit);
  }

  private checkHealth(now: string): SystemHealthEntry[] {
    const entries: SystemHealthEntry[] = [];

    // Backend process
    entries.push({
      component: "backend",
      status: "healthy",
      detail: `Uptime ${Math.round((Date.now() - startTime) / 1000)}s`,
      checkedAt: now,
    });

    // Provider health
    try {
      const providers = this.providerService.list();
      const anyReady = providers.some((p) => p.status === "ready" || p.status === "connected");
      entries.push({
        component: "llm-providers",
        status: anyReady ? "healthy" : "degraded",
        detail: anyReady
          ? `${providers.filter((p) => p.status === "ready" || p.status === "connected").length} providers ready`
          : "No providers ready",
        checkedAt: now,
      });
    } catch {
      entries.push({
        component: "llm-providers",
        status: "unknown",
        detail: "Unable to check provider status",
        checkedAt: now,
      });
    }

    // Voice health
    try {
      const ttsEngines = this.voiceService.listTtsEngines();
      const anyAvailable = ttsEngines.some((e) => e.available);
      entries.push({
        component: "voice",
        status: anyAvailable ? "healthy" : "degraded",
        detail: `${ttsEngines.filter((e) => e.available).length}/${ttsEngines.length} TTS engines available`,
        checkedAt: now,
      });
    } catch {
      entries.push({
        component: "voice",
        status: "unknown",
        detail: "Unable to check voice status",
        checkedAt: now,
      });
    }

    // Build control
    try {
      const overview = this.buildControlService.getOverview();
      const blocked = overview.masterChecker.blockedSteps;
      entries.push({
        component: "build-control",
        status: blocked > 0 ? "degraded" : "healthy",
        detail: `${overview.progress.percentComplete}% complete, ${blocked} blocked`,
        checkedAt: now,
      });
    } catch {
      entries.push({
        component: "build-control",
        status: "unknown",
        detail: "Unable to check build status",
        checkedAt: now,
      });
    }

    return entries;
  }
}
