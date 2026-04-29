import type {
  ConversationMessage,
  ConversationProviderKind,
  ConversationReply,
  ConversationSession,
  CreateConversationMessageInput,
  CreateConversationSessionInput,
} from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import { MANAGER_KEYWORDS } from "../../shared/constants/app-constants";
import type { RequestMeta } from "../api/request-meta";
import { HttpError } from "../api/http-error";
import type { ConversationProvider } from "../providers";
import type { ConversationStore } from "../db";
import { SqliteConversationRepository } from "../db";
import { MemoryService } from "./memory-service";
import { PrivateMemoryService } from "./private-memory-service";
import { ProviderService } from "./provider-service";
import type { ManagerAgentService } from "./manager-agent-service";
import type { WorkflowService } from "./workflow-service";
import { BackstoryService } from "./backstory-service";
import type { LocalLlmConfigService } from "./local-llm-config-service";

const APPROVAL_KEYWORDS = /\b(approve that|approve it|approved|looks good|gail approve|accept it|sign off|lgtm)\b/i;
const REJECT_KEYWORDS = /\b(reject that|reject it|send that back|gail reject|not approved|send it back|redo that)\b/i;

export class ConversationService {
  private readonly privateSessions = new Map<string, ConversationSession>();
  private workflowService?: WorkflowService;
  private readonly backstoryService: BackstoryService;

  constructor(
    private readonly providers: Record<ConversationProviderKind, ConversationProvider>,
    private readonly sessions: ConversationStore = new SqliteConversationRepository(),
    private readonly memoryService = new MemoryService(),
    private readonly providerService?: ProviderService,
    private readonly privateMemoryService = new PrivateMemoryService(),
    private managerAgentService?: ManagerAgentService,
    private readonly localLlmConfigService?: LocalLlmConfigService,
    backstoryService: BackstoryService = new BackstoryService(),
  ) {
    this.backstoryService = backstoryService;
  }

  /**
   * Late-bind the manager agent service to avoid circular dependency in bootstrap.
   */
  setManagerAgentService(service: ManagerAgentService): void {
    this.managerAgentService = service;
  }

  /**
   * Late-bind the workflow service for step-level approvals from chat.
   */
  setWorkflowService(service: WorkflowService): void {
    this.workflowService = service;
  }

  /**
   * Handle approval/rejection commands from chat.
   * Checks directive-level Gail approval first, then workflow step-level review.
   */
  private handleApprovalCommand(content: string): string | undefined {
    const isApprove = APPROVAL_KEYWORDS.test(content);
    const isReject = REJECT_KEYWORDS.test(content);
    if (!isApprove && !isReject) return undefined;

    const decision = isApprove ? "approved" : "rejected";

    // 1. Check for directives awaiting Gail approval
    if (this.managerAgentService) {
      const awaiting = this.managerAgentService.listDirectives("awaiting_gail_approval", 1);
      if (awaiting.length > 0) {
        const directive = awaiting[0];
        const note = isApprove ? "Approved via chat." : "Rejected via chat.";
        const result = this.managerAgentService.gailApprove(directive.id, decision, note);
        if (result) {
          return `Gail ${decision} directive ${result.id} ("${result.instruction.slice(0, 60)}"). Status is now: ${result.status}.`;
        }
      }
    }

    // 2. Check for workflow steps awaiting review
    if (this.workflowService) {
      const workflows = this.workflowService.list();
      for (const workflow of workflows) {
        const reviewStep = workflow.steps.find((s) => s.status === "needs_review");
        if (reviewStep) {
          const stepDecision = isApprove ? "approve" : "request_changes";
          const notes = isApprove ? "Approved via chat." : "Rejected via chat — changes requested.";
          try {
            this.workflowService.decideSubmittedStep(workflow.id, reviewStep.id, stepDecision as any, notes);
          } catch {
            return `Failed to ${isApprove ? "approve" : "reject"} workflow step "${reviewStep.title}" — internal error.`;
          }
          return `${isApprove ? "Approved" : "Rejected"} workflow step "${reviewStep.title}" in workflow "${workflow.title}". ${isApprove ? "Remaining steps will now proceed." : "Step is blocked pending changes."}`;
        }
      }
    }

    return undefined; // nothing to approve/reject
  }

  private buildManagerContext(): string | undefined {
    if (!this.managerAgentService) return undefined;
    try {
      const report = this.managerAgentService.getReport();
      const parts = [
        `Manager: ${report.manager.status}, ${report.directives.total} directives (${report.directives.pending} pending, ${report.directives.running} running, ${report.directives.completed} completed, ${report.directives.failed} failed)`,
      ];
      for (const builder of report.builders) {
        parts.push(`${builder.agentId}: ${builder.status}, completed=${builder.completedCount}, failed=${builder.failedCount}`);
      }
      const pending = report.recentDirectives.filter(d => d.status === "pending" || d.status === "running");
      if (pending.length > 0) {
        parts.push(`Active work: ${pending.map(d => `[${d.id}] "${d.instruction.slice(0, 60)}" (${d.status})`).join("; ")}`);
      }
      return parts.join(". ");
    } catch {
      return undefined;
    }
  }

  list(meta: RequestMeta): ConversationSession[] {
    if (meta.mode === "private") {
      return this.listPrivateSessions(meta);
    }

    return this.sessions.listByMode(meta.mode);
  }

  getById(id: string, meta?: RequestMeta): ConversationSession | undefined {
    if (meta) {
      return this.getSessionForMeta(id, meta);
    }

    return this.sessions.getById(id);
  }

  createSession(meta: RequestMeta, input: CreateConversationSessionInput): ConversationSession {
    const now = new Date().toISOString();
    const provider = this.resolveProvider(meta, input.providerPreference);
    const session: ConversationSession = {
      id: createScaffoldId("conversation_session"),
      deviceId: meta.deviceId ?? `${meta.deviceType}-anonymous`,
      mode: meta.mode,
      provider,
      title: input.title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    if (meta.mode === "private") {
      this.privateSessions.set(session.id, session);
      return session;
    }

    return this.sessions.create(session);
  }

  async addMessage(
    sessionId: string,
    meta: RequestMeta,
    input: CreateConversationMessageInput,
  ): Promise<ConversationReply> {
    const session = this.getSessionForMeta(sessionId, meta);
    if (!session) {
      throw new HttpError(404, `Conversation session ${sessionId} not found.`);
    }

    if (session.mode !== meta.mode) {
      throw new HttpError(403, "Conversation session mode does not match request mode.");
    }

    const now = new Date().toISOString();
    const userMessage: ConversationMessage = {
      id: createScaffoldId("conversation_message"),
      role: "user",
      content: input.content,
      createdAt: now,
      updatedAt: now,
    };

    const requestedProvider = session.provider;
    const memory = {
      recent: meta.mode === "private"
        ? this.privateMemoryService.recallRecent(8, meta.privatePersona)
        : this.memoryService.recallRecent(5),
    };
    const personalityContext = meta.mode === "private"
      ? this.privateMemoryService.buildPersonalityContext(meta.privatePersona)
      : undefined;

    // Auto-detect approval/rejection commands from chat
    let directiveNote: string | undefined;
    if (meta.mode !== "private") {
      const approvalResult = this.handleApprovalCommand(input.content);
      if (approvalResult) {
        directiveNote = approvalResult;
      }
    }

    // Auto-detect manager intent keywords and dispatch through the pipeline
    if (!directiveNote && this.managerAgentService && meta.mode !== "private" && MANAGER_KEYWORDS.test(input.content)) {
      try {
        directiveNote = await this.managerAgentService.handleAvatarRequest(input.content);
      } catch {
        directiveNote = undefined; // If dispatch fails, still respond conversationally
      }
    }

    const managerContext = this.buildManagerContext();
    const backstoryContext = this.backstoryService.buildPromptSection(this.resolveBackstoryPersona(meta));
    const augmentedMessage = directiveNote
      ? `${input.content}\n\n[System: ${directiveNote}]`
      : input.content;

    const generation = await this.generateReplyWithFallback(requestedProvider, {
      mode: session.mode,
      sessionId: session.id,
      message: augmentedMessage,
      history: [...session.messages, userMessage],
      memory,
      privatePersona: meta.privatePersona,
      personalityContext,
      managerContext,
      backstoryContext,
    });

    if (meta.mode === "private") {
      this.privateMemoryService.extractAndStore(input.content, generation.output.content, meta.privatePersona);
    }

    const reply: ConversationMessage = {
      id: createScaffoldId("conversation_message"),
      role: "assistant",
      content: generation.output.content,
      provider: generation.output.provider,
      createdAt: now,
      updatedAt: now,
    };

    const nextSession: ConversationSession = {
      ...session,
      messages: [...session.messages, userMessage, reply],
      updatedAt: now,
    };

    if (meta.mode === "private") {
      this.privateSessions.set(sessionId, nextSession);
      return {
        session: nextSession,
        reply,
        requestedProvider,
        usedProvider: generation.output.provider,
        fellBack: generation.fellBack,
        fallbackReason: generation.fallbackReason,
        memoriesUsed: memory.recent.length,
      };
    }

    return {
      session: this.sessions.update(nextSession),
      reply,
      requestedProvider,
      usedProvider: generation.output.provider,
      fellBack: generation.fellBack,
      fallbackReason: generation.fallbackReason,
      memoriesUsed: memory.recent.length,
    };
  }

  async addMessageStream(
    sessionId: string,
    meta: RequestMeta,
    input: CreateConversationMessageInput,
    handlers: { onTextDelta?: (delta: string) => void },
  ): Promise<ConversationReply> {
    const session = this.getSessionForMeta(sessionId, meta);
    if (!session) {
      throw new HttpError(404, `Conversation session ${sessionId} not found.`);
    }

    if (session.mode !== meta.mode) {
      throw new HttpError(403, "Conversation session mode does not match request mode.");
    }

    const now = new Date().toISOString();
    const userMessage: ConversationMessage = {
      id: createScaffoldId("conversation_message"),
      role: "user",
      content: input.content,
      createdAt: now,
      updatedAt: now,
    };

    const requestedProvider = session.provider;
    const memory = {
      recent: meta.mode === "private"
        ? this.privateMemoryService.recallRecent(8, meta.privatePersona)
        : this.memoryService.recallRecent(5),
    };
    const personalityContext = meta.mode === "private"
      ? this.privateMemoryService.buildPersonalityContext(meta.privatePersona)
      : undefined;

    // Auto-detect approval/rejection commands from chat
    let directiveNote: string | undefined;
    if (meta.mode !== "private") {
      const approvalResult = this.handleApprovalCommand(input.content);
      if (approvalResult) {
        directiveNote = approvalResult;
      }
    }

    // Auto-detect manager intent keywords and dispatch through the pipeline
    if (!directiveNote && this.managerAgentService && meta.mode !== "private" && MANAGER_KEYWORDS.test(input.content)) {
      try {
        directiveNote = await this.managerAgentService.handleAvatarRequest(input.content);
      } catch {
        directiveNote = undefined;
      }
    }

    const managerContext = this.buildManagerContext();
    const backstoryContext = this.backstoryService.buildPromptSection(this.resolveBackstoryPersona(meta));
    const augmentedMessage = directiveNote
      ? `${input.content}\n\n[System: ${directiveNote}]`
      : input.content;

    const generation = await this.generateReplyStreamWithFallback(requestedProvider, {
      mode: session.mode,
      sessionId: session.id,
      message: augmentedMessage,
      history: [...session.messages, userMessage],
      memory,
      privatePersona: meta.privatePersona,
      personalityContext,
      managerContext,
      backstoryContext,
    }, handlers);

    if (meta.mode === "private") {
      this.privateMemoryService.extractAndStore(input.content, generation.output.content, meta.privatePersona);
    }

    const reply: ConversationMessage = {
      id: createScaffoldId("conversation_message"),
      role: "assistant",
      content: generation.output.content,
      provider: generation.output.provider,
      createdAt: now,
      updatedAt: now,
    };

    const nextSession: ConversationSession = {
      ...session,
      messages: [...session.messages, userMessage, reply],
      updatedAt: now,
    };

    if (meta.mode === "private") {
      this.privateSessions.set(sessionId, nextSession);
      return {
        session: nextSession,
        reply,
        requestedProvider,
        usedProvider: generation.output.provider,
        fellBack: generation.fellBack,
        fallbackReason: generation.fallbackReason,
        memoriesUsed: memory.recent.length,
      };
    }

    return {
      session: this.sessions.update(nextSession),
      reply,
      requestedProvider,
      usedProvider: generation.output.provider,
      fellBack: generation.fellBack,
      fallbackReason: generation.fallbackReason,
      memoriesUsed: memory.recent.length,
    };
  }

  private listPrivateSessions(meta: RequestMeta): ConversationSession[] {
    const deviceId = meta.deviceId ?? `${meta.deviceType}-anonymous`;
    return [...this.privateSessions.values()].filter((session) => session.deviceId === deviceId);
  }

  private getSessionForMeta(id: string, meta: RequestMeta): ConversationSession | undefined {
    if (meta.mode === "private") {
      const privateSession = this.getPrivateSessionById(id, meta);
      if (privateSession) {
        return privateSession;
      }

      const persistentSession = this.sessions.getById(id);
      if (persistentSession) {
        throw new HttpError(403, "Conversation session mode does not match request mode.");
      }

      return undefined;
    }

    const persistentSession = this.sessions.getById(id);
    if (persistentSession) {
      if (persistentSession.mode !== meta.mode) {
        throw new HttpError(403, "Conversation session mode does not match request mode.");
      }

      return persistentSession;
    }

    const privateSession = this.privateSessions.get(id);
    if (privateSession) {
      throw new HttpError(403, "Conversation session mode does not match request mode.");
    }

    return undefined;
  }

  private getPrivateSessionById(id: string, meta: RequestMeta): ConversationSession | undefined {
    const session = this.privateSessions.get(id);
    if (!session) {
      return undefined;
    }

    const deviceId = meta.deviceId ?? `${meta.deviceType}-anonymous`;
    if (session.deviceId !== deviceId) {
      throw new HttpError(403, "Private conversation sessions are bound to the originating device.");
    }

    return session;
  }

  private resolveBackstoryPersona(meta: RequestMeta): "normal" | "private_counselor" | "private_girlfriend" | "private_hangout" {
    if (meta.mode !== "private") {
      return "normal";
    }

    if (
      meta.privatePersona === "private_counselor"
      || meta.privatePersona === "private_girlfriend"
      || meta.privatePersona === "private_hangout"
      || meta.privatePersona === "normal"
    ) {
      return meta.privatePersona;
    }

    const resolved = this.localLlmConfigService?.getPrivatePersona();
    if (
      resolved === "private_counselor"
      || resolved === "private_girlfriend"
      || resolved === "private_hangout"
      || resolved === "normal"
    ) {
      return resolved;
    }

    return "private_counselor";
  }

  private resolveProvider(
    meta: RequestMeta,
    preferred?: ConversationProviderKind,
  ): ConversationProviderKind {
    if (meta.mode === "private") {
      if (preferred && preferred !== "local-llm") {
        throw new HttpError(403, "Private Mode requires the local-llm provider.");
      }

      return "local-llm";
    }

    return preferred ?? "openai";
  }

  private async generateReplyWithFallback(
    requestedProvider: ConversationProviderKind,
    input: Parameters<ConversationProvider["generateReply"]>[0],
  ): Promise<{
    output: Awaited<ReturnType<ConversationProvider["generateReply"]>>;
    fellBack: boolean;
    fallbackReason?: string;
  }> {
    const provider = this.providers[requestedProvider];
    try {
      this.providerService?.recordAttempt(requestedProvider);
      const output = await provider.generateReply(input);
      this.providerService?.recordSuccess(requestedProvider);
      return {
        output,
        fellBack: false,
      };
    } catch (error) {
      const fallbackReason = error instanceof Error ? error.message : "Unknown provider error.";
      this.providerService?.recordFailure(requestedProvider, fallbackReason);
      if (requestedProvider === "local-llm" || input.mode === "private") {
        throw error;
      }

      const fallbackProvider = this.providers["local-llm"];
      const reasonClass = classifyCloudFallbackReason(fallbackReason);
      const startedAt = Date.now();
      this.providerService?.recordFallback(requestedProvider);
      this.providerService?.recordAttempt("local-llm");
      try {
        const output = await fallbackProvider.generateReply(input);
        this.providerService?.recordSuccess("local-llm");
        this.providerService?.recordFallbackEvent(requestedProvider, {
          reasonClass,
          cloudProfile: provider.getStatus().details,
          localProfile: fallbackProvider.getStatus().details,
          retryLatencyMs: Date.now() - startedAt,
          outcome: "fallback_success",
          triggeredAt: new Date().toISOString(),
        });
        return {
          output,
          fellBack: true,
          fallbackReason,
        };
      } catch (fallbackError) {
        const fallbackFailureReason = fallbackError instanceof Error ? fallbackError.message : "Unknown fallback provider error.";
        this.providerService?.recordFailure("local-llm", fallbackFailureReason);
        this.providerService?.recordFallbackEvent(requestedProvider, {
          reasonClass,
          cloudProfile: provider.getStatus().details,
          localProfile: fallbackProvider.getStatus().details,
          retryLatencyMs: Date.now() - startedAt,
          outcome: "fallback_failed",
          triggeredAt: new Date().toISOString(),
        });
        throw new HttpError(
          503,
          `Cloud provider failed (${reasonClass}) and local fallback also failed. Primary: ${fallbackReason}. Local: ${fallbackFailureReason}.`,
        );
      }
    }
  }

  private async generateReplyStreamWithFallback(
    requestedProvider: ConversationProviderKind,
    input: Parameters<ConversationProvider["generateReply"]>[0],
    handlers: { onTextDelta?: (delta: string) => void },
  ): Promise<{
    output: Awaited<ReturnType<ConversationProvider["generateReply"]>>;
    fellBack: boolean;
    fallbackReason?: string;
  }> {
    const provider = this.providers[requestedProvider];
    try {
      this.providerService?.recordAttempt(requestedProvider);
      const output = provider.generateReplyStream
        ? await provider.generateReplyStream(input, handlers)
        : await provider.generateReply(input);
      if (!provider.generateReplyStream) {
        handlers.onTextDelta?.(output.content);
      }
      this.providerService?.recordSuccess(requestedProvider);
      return {
        output,
        fellBack: false,
      };
    } catch (error) {
      const fallbackReason = error instanceof Error ? error.message : "Unknown provider error.";
      this.providerService?.recordFailure(requestedProvider, fallbackReason);
      if (requestedProvider === "local-llm" || input.mode === "private") {
        throw error;
      }

      const fallbackProvider = this.providers["local-llm"];
      const reasonClass = classifyCloudFallbackReason(fallbackReason);
      const startedAt = Date.now();
      this.providerService?.recordFallback(requestedProvider);
      this.providerService?.recordAttempt("local-llm");
      try {
        const output = await fallbackProvider.generateReply(input);
        handlers.onTextDelta?.(output.content);
        this.providerService?.recordSuccess("local-llm");
        this.providerService?.recordFallbackEvent(requestedProvider, {
          reasonClass,
          cloudProfile: provider.getStatus().details,
          localProfile: fallbackProvider.getStatus().details,
          retryLatencyMs: Date.now() - startedAt,
          outcome: "fallback_success",
          triggeredAt: new Date().toISOString(),
        });
        return {
          output,
          fellBack: true,
          fallbackReason,
        };
      } catch (fallbackError) {
        const fallbackFailureReason = fallbackError instanceof Error ? fallbackError.message : "Unknown fallback provider error.";
        this.providerService?.recordFailure("local-llm", fallbackFailureReason);
        this.providerService?.recordFallbackEvent(requestedProvider, {
          reasonClass,
          cloudProfile: provider.getStatus().details,
          localProfile: fallbackProvider.getStatus().details,
          retryLatencyMs: Date.now() - startedAt,
          outcome: "fallback_failed",
          triggeredAt: new Date().toISOString(),
        });
        throw new HttpError(
          503,
          `Cloud provider failed (${reasonClass}) and local fallback also failed. Primary: ${fallbackReason}. Local: ${fallbackFailureReason}.`,
        );
      }
    }
  }
}

function classifyCloudFallbackReason(reason: string): "cloud_refusal" | "cloud_timeout" | "cloud_tool_failure" | "cloud_unavailable" {
  const normalized = reason.toLowerCase();
  if (
    normalized.includes("refus")
    || normalized.includes("policy")
    || normalized.includes("blocked")
    || normalized.includes("moderation")
    || normalized.includes("unsupported")
  ) {
    return "cloud_refusal";
  }
  if (normalized.includes("timeout") || normalized.includes("timed out") || normalized.includes("abort")) {
    return "cloud_timeout";
  }
  if (normalized.includes("tool") || normalized.includes("function") || normalized.includes("schema")) {
    return "cloud_tool_failure";
  }
  return "cloud_unavailable";
}
