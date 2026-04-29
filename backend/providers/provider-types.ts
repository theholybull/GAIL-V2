import type {
  ConversationMemoryContext,
  ConversationMessage,
  ConversationProviderKind,
  PrivatePersonaKind,
  ProviderStatus,
} from "../../shared/contracts/index";

export interface ConversationGenerationInput {
  mode: string;
  sessionId: string;
  message: string;
  history: ConversationMessage[];
  memory: ConversationMemoryContext;
  privatePersona?: PrivatePersonaKind;
  personalityContext?: string;
  managerContext?: string;
  backstoryContext?: string;
}

export interface ConversationGenerationOutput {
  provider: ConversationProviderKind;
  content: string;
}

export interface ConversationStreamHandlers {
  onTextDelta?: (delta: string) => void;
}

export interface ConversationProvider {
  readonly provider: ConversationProviderKind;
  readonly status: string;
  generateReply(input: ConversationGenerationInput): Promise<ConversationGenerationOutput>;
  generateReplyStream?(
    input: ConversationGenerationInput,
    handlers: ConversationStreamHandlers,
  ): Promise<ConversationGenerationOutput>;
  getStatus(): ProviderStatus;
}
