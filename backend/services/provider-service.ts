import type { ProviderStatus } from "../../shared/contracts/index";
import type { ConversationProvider } from "../providers";
import { WeatherProvider } from "../providers";

interface ProviderTelemetry {
  attemptCount: number;
  successCount: number;
  failureCount: number;
  fallbackCount: number;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastFailureReason?: string;
  fallbackEventsRecent?: FallbackEvent[];
}

export interface FallbackEvent {
  reasonClass: "cloud_refusal" | "cloud_timeout" | "cloud_tool_failure" | "cloud_unavailable";
  cloudProfile: string;
  localProfile: string;
  retryLatencyMs: number;
  outcome: "fallback_success" | "fallback_failed";
  triggeredAt: string;
}

const MAX_FALLBACK_EVENTS = 20;

export class ProviderService {
  private readonly telemetry = new Map<string, ProviderTelemetry>();

  constructor(
    private readonly conversationProviders: ConversationProvider[],
    private readonly weatherProvider = new WeatherProvider(),
  ) {
    for (const provider of conversationProviders) {
      this.telemetry.set(provider.provider, {
        attemptCount: 0,
        successCount: 0,
        failureCount: 0,
        fallbackCount: 0,
      });
    }
  }

  list(): ProviderStatus[] {
    return [
      ...this.conversationProviders.map((provider) => {
        const telemetry = this.telemetry.get(provider.provider);
        return {
          ...provider.getStatus(),
          ...telemetry,
          lastFallbackEvent: telemetry?.fallbackEventsRecent?.[0],
        };
      }),
      {
        provider: "weather",
        status: this.weatherProvider.status,
        available: false,
        details: "Weather provider is scaffolded only.",
      },
    ];
  }

  recordAttempt(providerKey: string): void {
    const telemetry = this.getTelemetry(providerKey);
    telemetry.attemptCount += 1;
    telemetry.lastAttemptAt = new Date().toISOString();
  }

  recordSuccess(providerKey: string): void {
    const telemetry = this.getTelemetry(providerKey);
    telemetry.successCount += 1;
    telemetry.lastSuccessAt = new Date().toISOString();
  }

  recordFailure(providerKey: string, reason: string): void {
    const telemetry = this.getTelemetry(providerKey);
    telemetry.failureCount += 1;
    telemetry.lastFailureAt = new Date().toISOString();
    telemetry.lastFailureReason = reason;
  }

  recordFallback(providerKey: string): void {
    const telemetry = this.getTelemetry(providerKey);
    telemetry.fallbackCount += 1;
  }

  recordFallbackEvent(providerKey: string, event: FallbackEvent): void {
    const telemetry = this.getTelemetry(providerKey);
    const current = Array.isArray(telemetry.fallbackEventsRecent) ? telemetry.fallbackEventsRecent : [];
    telemetry.fallbackEventsRecent = [event, ...current].slice(0, MAX_FALLBACK_EVENTS);
  }

  private getTelemetry(providerKey: string): ProviderTelemetry {
    const existing = this.telemetry.get(providerKey);
    if (existing) {
      return existing;
    }

    const created: ProviderTelemetry = {
      attemptCount: 0,
      successCount: 0,
      failureCount: 0,
      fallbackCount: 0,
      fallbackEventsRecent: [],
    };
    this.telemetry.set(providerKey, created);
    return created;
  }
}
