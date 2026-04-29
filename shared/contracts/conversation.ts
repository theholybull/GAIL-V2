import type { AuditFields } from "../types/base";
import type { MemoryEntry } from "./memory";

export type ConversationProviderKind = "openai" | "local-llm";
export type ConversationRole = "system" | "user" | "assistant";

export interface ConversationMessage extends AuditFields {
  id: string;
  role: ConversationRole;
  content: string;
  provider?: ConversationProviderKind;
}

export interface ConversationSession extends AuditFields {
  id: string;
  deviceId: string;
  mode: string;
  provider: ConversationProviderKind;
  title?: string;
  messages: ConversationMessage[];
}

export interface ConversationReply {
  session: ConversationSession;
  reply: ConversationMessage;
  requestedProvider: ConversationProviderKind;
  usedProvider: ConversationProviderKind;
  fellBack: boolean;
  fallbackReason?: string;
  memoriesUsed: number;
}

export interface ConversationMemoryContext {
  recent: MemoryEntry[];
}
