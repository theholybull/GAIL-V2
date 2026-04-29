import type { ConversationProviderKind } from "./conversation";

export type PrivatePersonaKind = "normal" | "private_counselor" | "private_girlfriend" | "private_hangout";

export interface ProviderStatus {
  provider: ConversationProviderKind | "weather";
  status: string;
  available: boolean;
  details: string;
  attemptCount?: number;
  successCount?: number;
  failureCount?: number;
  fallbackCount?: number;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastFailureReason?: string;
  lastFallbackEvent?: {
    reasonClass: "cloud_refusal" | "cloud_timeout" | "cloud_tool_failure" | "cloud_unavailable";
    cloudProfile: string;
    localProfile: string;
    retryLatencyMs: number;
    outcome: "fallback_success" | "fallback_failed";
    triggeredAt: string;
  };
  fallbackEventsRecent?: Array<{
    reasonClass: "cloud_refusal" | "cloud_timeout" | "cloud_tool_failure" | "cloud_unavailable";
    cloudProfile: string;
    localProfile: string;
    retryLatencyMs: number;
    outcome: "fallback_success" | "fallback_failed";
    triggeredAt: string;
  }>;
}


export interface OpenAiConfigStatus {
  configured: boolean;
  source: "env" | "stored" | "none";
  hasStoredKey: boolean;
  model: string;
  baseUrl: string;
}

export interface PrivatePersonaAgentStatus {
  key: PrivatePersonaKind | "normal";
  label: string;
  summary: string;
  systemPrompt: string;
  model?: string;
}

export interface LocalLlmConfigStatus {
  configured: boolean;
  baseUrl: string;
  model: string;
  effectiveModel: string;
  timeoutMs: number;
  keepAlive: string;
  normalSystemPrompt: string;
  defaultPrivatePersona: PrivatePersonaKind;
  activePrivatePersona: PrivatePersonaKind;
  personas: PrivatePersonaAgentStatus[];
}
