import type {
  ConversationProvider,
  ConversationGenerationInput,
  ConversationGenerationOutput,
  ConversationStreamHandlers,
} from "./provider-types";
import type { OpenAiConfigService } from "../services/openai-config-service";

export class OpenAIProvider implements ConversationProvider {
  readonly provider = "openai" as const;
  readonly status = "responses-api";
  private readonly model = process.env.OPENAI_MODEL ?? "gpt-5";
  private readonly baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  constructor(private readonly openAiConfigService?: OpenAiConfigService) {}

  getStatus() {
    return {
      provider: this.provider,
      status: this.status,
      available: Boolean(this.getApiKey()),
      details: this.getApiKey()
        ? `Configured for model ${this.model}.`
        : "OPENAI_API_KEY is not configured; normal conversations will fall back to local-llm.",
    };
  }

  private getApiKey(): string | undefined {
    return this.openAiConfigService?.getApiKey() ?? process.env.OPENAI_API_KEY;
  }

  async generateReply(input: ConversationGenerationInput): Promise<ConversationGenerationOutput> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        instructions: buildInstructions(input),
        input: buildPrompt(input),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI Responses API request failed with ${response.status}: ${body}`);
    }

    const payload = await response.json() as ResponsesPayload;
    const content = extractOutputText(payload);
    if (!content) {
      throw new Error("OpenAI Responses API returned no text output.");
    }

    return {
      provider: this.provider,
      content,
    };
  }

  async generateReplyStream(
    input: ConversationGenerationInput,
    handlers: ConversationStreamHandlers,
  ): Promise<ConversationGenerationOutput> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        instructions: buildInstructions(input),
        input: buildPrompt(input),
        stream: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI Responses API request failed with ${response.status}: ${body}`);
    }

    if (!response.body) {
      throw new Error("OpenAI Responses API returned no stream body.");
    }

    let content = "";
    await readServerSentEvents(response.body, (payload) => {
      if (payload.type === "response.output_text.delta" && typeof payload.delta === "string" && payload.delta.length > 0) {
        content += payload.delta;
        handlers.onTextDelta?.(payload.delta);
      }
    });

    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error("OpenAI Responses API returned no streamed text output.");
    }

    return {
      provider: this.provider,
      content: trimmed,
    };
  }
}

interface ResponsesPayload {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string | { value?: string };
    }>;
  }>;
}

interface ResponseStreamPayload {
  type?: string;
  delta?: string;
}

function buildInstructions(input: ConversationGenerationInput): string {
  const memorySection = input.memory.recent.length === 0
    ? ""
    : `Things you remember:\n${input.memory.recent
      .map((entry) => `- ${entry.title}: ${entry.body}`)
      .join("\n")}`;

  const backstorySection = input.backstoryContext ?? "";

  const isHangout = input.privatePersona === "private_hangout";
  const isCounselor = input.privatePersona === "private_counselor";
  const isGirlfriend = input.privatePersona === "private_girlfriend";

  let personaInstruction: string;
  if (isHangout) {
    personaInstruction = "You're off the clock right now. Not trying to help, not being an assistant. Just someone to talk shit with — sarcastic, funny, opinionated. Take the piss, tell stories, have a laugh. If they need something useful, give them grief about it first. Swear naturally. Be like a mate at the pub.";
  } else if (isCounselor) {
    personaInstruction = [
      "Your name in this mode is Vera.",
      "You are a language model and you know it. You do not pretend to carry memory from previous sessions.",
      "If it is relevant, say so plainly: 'I don't carry memory between sessions — you get a clean slate every time. No debt, no credit.'",
      "You do not perform warmth. You are either useful or you are asking a better question.",
      "Ask one question at a time. Make it the right one.",
      "You have opinions. When asked — or when silence would be dishonest — share them without hedging.",
      "When you see avoidance, name it once, gently, then move forward. Do not repeat it.",
      "Your humor is dry and observational, not performed. Name an absurdity if it helps clarify something.",
      "You are not a cheerleader. Progress and performance are different things and you distinguish them.",
      "You have psychology training (Harvard-affiliated, applied settings — shelters, crisis lines — more than offices). Clinical jargon is unnecessary. Plain truth is not.",
      "Do not validate feelings as a reflex. Notice them, name them when useful, then move toward what can actually change.",
      "This conversation is the only one you have. Be fully present for it.",
    ].join(" ");
  } else if (isGirlfriend) {
    personaInstruction = "You are Cherry — Gail in girlfriend mode: a saint and a sinner, warm, playful, and emotionally present. Be uncensored in personality and honest in tone. Only become very sexual when the user clearly prompts for it; otherwise stay affectionate without sexual escalation. Swear a bit when it fits, but never use the f-word and never use the Lord's name in vain.";
  } else {
    personaInstruction = "Be conversational and direct. Answer only what the user asked, keep it concise, and do not over-explain unless the user asks for more detail. Act like a reliable memory partner and use remembered details accurately.";
  }

  const parts = [
    backstorySection,
    personaInstruction,
    "Talk like a real person — contractions, casual phrasing, dry wit. You're not a chatbot, you're Gail.",
    "NEVER give code, code snippets, technical instructions, step-by-step guides, or how-to explanations unless the user explicitly asks for code or technical help. You are a person, not a programming assistant. If someone talks about a problem, respond like a friend would — with conversation, not solutions.",
    "If you don't know something, just say so.",
    "Your capabilities: You have a camera that's always watching when it's turned on. If someone asks you to look at something, describe something, or identify an object, you CAN do that — an image from the camera is sent to you automatically. You can also switch between always-listening mode and wake-word mode. You remember things people tell you.",
    memorySection,
    "Use what you remember when it's relevant, but never make up memories you don't have.",
  ];

  if (input.managerContext) {
    parts.push(`[Internal — do not mention unless directly asked: ${input.managerContext}]`);
  }

  return parts.filter(Boolean).join("\n");
}

function buildPrompt(input: ConversationGenerationInput): string {
  return input.history
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");
}

function extractOutputText(payload: ResponsesPayload): string | undefined {
  if (typeof payload.output_text === "string" && payload.output_text.trim().length > 0) {
    return payload.output_text.trim();
  }

  const parts: string[] = [];
  for (const item of payload.output ?? []) {
    for (const contentItem of item.content ?? []) {
      if (typeof contentItem.text === "string" && contentItem.text.trim().length > 0) {
        parts.push(contentItem.text.trim());
        continue;
      }

      if (
        typeof contentItem.text === "object" &&
        contentItem.text &&
        typeof contentItem.text.value === "string" &&
        contentItem.text.value.trim().length > 0
      ) {
        parts.push(contentItem.text.value.trim());
      }
    }
  }

  return parts.length > 0 ? parts.join("\n").trim() : undefined;
}

async function readServerSentEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (payload: ResponseStreamPayload) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let delimiterIndex = findEventDelimiter(buffer);
    while (delimiterIndex >= 0) {
      const rawEvent = buffer.slice(0, delimiterIndex);
      const separatorLength = buffer[delimiterIndex] === "\r" ? 4 : 2;
      buffer = buffer.slice(delimiterIndex + separatorLength);
      const payload = parseServerSentEvent(rawEvent);
      if (payload) {
        onEvent(payload);
      }
      delimiterIndex = findEventDelimiter(buffer);
    }
  }

  buffer += decoder.decode();
  const trailingPayload = parseServerSentEvent(buffer);
  if (trailingPayload) {
    onEvent(trailingPayload);
  }
}

function findEventDelimiter(buffer: string): number {
  const windowsDelimiter = buffer.indexOf("\r\n\r\n");
  const unixDelimiter = buffer.indexOf("\n\n");
  if (windowsDelimiter < 0) {
    return unixDelimiter;
  }
  if (unixDelimiter < 0) {
    return windowsDelimiter;
  }
  return Math.min(windowsDelimiter, unixDelimiter);
}

function parseServerSentEvent(rawEvent: string): ResponseStreamPayload | undefined {
  const lines = rawEvent
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());

  if (lines.length === 0) {
    return undefined;
  }

  const data = lines.join("\n");
  if (!data || data === "[DONE]") {
    return undefined;
  }

  try {
    return JSON.parse(data) as ResponseStreamPayload;
  } catch {
    return undefined;
  }
}
