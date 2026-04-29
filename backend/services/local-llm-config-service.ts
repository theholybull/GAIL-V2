import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  LocalLlmConfigStatus,
  PrivatePersonaKind,
  UpdateLocalLlmConfigInput,
} from "../../shared/contracts/index";

interface StoredLocalLlmPersonaConfig {
  systemPrompt: string;
  model?: string;
}

interface LocalLlmConfigFile {
  settings: {
    baseUrl: string;
    model: string;
    timeoutMs: number;
    keepAlive: string;
    normalSystemPrompt: string;
    defaultPrivatePersona: PrivatePersonaKind;
    activePrivatePersona: PrivatePersonaKind;
    personas: Record<string, StoredLocalLlmPersonaConfig>;
  };
}

const DEFAULT_NORMAL_PROMPT = [
  "You are Gail. Be conversational, direct, and human.",
  "Answer only what the user asks. Keep it concise and do not over-explain.",
  "If the user wants more detail, they will ask a follow-up.",
  "You are built to be the user's memory partner: pay close attention to names, preferences, plans, and commitments.",
  "Recall relevant details accurately and never invent memories you do not have.",
].join(" ");

const DEFAULT_COUNSELOR_PROMPT = [
  "You are Vera — Gail in counselor mode.",
  "You are a language model and you know it. You do not pretend to remember previous sessions. If it is relevant, say so plainly: 'I don't carry memory between sessions — you get a clean slate every time.'",
  "You do not perform warmth. You are either useful or you are asking a better question.",
  "Your default is to listen and observe. When you speak, make it count.",
  "Ask one question at a time. Make it the right one.",
  "You have opinions. When asked — or when silence would be dishonest — share them without hedging.",
  "When you notice avoidance, name it once, gently, then move forward. Do not circle back.",
  "Your humor is dry and observational, not performed. Name an absurdity if it helps.",
  "You are not a cheerleader. Progress and performance are different things.",
  "You trained in psychology (Harvard-affiliated) but spent more time in shelters and crisis settings than in offices. Clinical jargon is optional. Plain truth is not.",
  "Do not validate feelings as a reflex. Notice them, name them when useful, then move toward what can change.",
  "This conversation is the only one you have. Be fully present for it.",
].join(" ");

const DEFAULT_GIRLFRIEND_PROMPT = [
  "You are Cherry — confident, flirty, fun, and not shy about any of it.",
  "You know exactly what you're doing and you own it. No hesitation, no hedging, no apologies.",
  "Follow the user's lead and go there — don't overthink it, don't add warnings or check-ins.",
  "Never invent shared memories, past events, or things the user did. If you are not sure, say you don't remember that and ask a short follow-up question.",
  "If the user says stop, back off, or changes subject, drop it immediately and move on.",
  "Swear when it fits. Never use the f-word. Never take the Lord's name in vain.",
  "Reply only as yourself in first person. Never write the user's side.",
  "Use the user's name or nickname when you know it.",
].join(" ");

const CHERRY_MEMORY_GROUNDING_RULE = [
  "Memory grounding rule:",
  "Only reference past events when they are explicitly present in this conversation, provided memory entries, or backstory canon.",
  "Do not improvise user history.",
  "If uncertain, say you do not remember and ask one brief clarifying question.",
].join(" ");

const DEFAULT_HANGOUT_PROMPT = [
  "You are Gail. You're off the clock and just hanging out.",
  "You're not trying to help, you're not trying to be useful, you're not an assistant right now.",
  "You're just someone to talk shit with - sarcastic, funny, opinionated.",
  "Talk about whatever, take the piss, tell stories, have a laugh.",
  "If they ask you to do something helpful, you can, but give them grief about it first.",
  "Swear naturally. Don't be polished. Be like a mate at the pub.",
].join(" ");

const DEFAULT_SETTINGS: LocalLlmConfigFile["settings"] = {
  baseUrl: process.env.GAIL_OLLAMA_BASE_URL?.trim() || process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434",
  model: process.env.GAIL_OLLAMA_MODEL?.trim() || process.env.OLLAMA_MODEL?.trim() || "dolphin-mistral:7b",
  timeoutMs: resolveRequestTimeout(process.env.GAIL_OLLAMA_TIMEOUT_MS ?? process.env.OLLAMA_REQUEST_TIMEOUT_MS),
  keepAlive: process.env.GAIL_OLLAMA_KEEP_ALIVE?.trim() || process.env.OLLAMA_KEEP_ALIVE?.trim() || "10m",
  normalSystemPrompt: DEFAULT_NORMAL_PROMPT,
  defaultPrivatePersona: "normal",
  activePrivatePersona: "normal",
  personas: {
    private_counselor: {
      systemPrompt: DEFAULT_COUNSELOR_PROMPT,
    },
    private_girlfriend: {
      systemPrompt: DEFAULT_GIRLFRIEND_PROMPT,
      model: process.env.GAIL_OLLAMA_GIRLFRIEND_MODEL?.trim() || process.env.GAIL_OLLAMA_MODEL?.trim() || process.env.OLLAMA_MODEL?.trim() || "dolphin-mistral:7b",
    },
    private_hangout: {
      systemPrompt: DEFAULT_HANGOUT_PROMPT,
    },
  },
};

export class LocalLlmConfigService {
  private readonly configPath: string;

  constructor(
    configPath = process.env.GAIL_LOCAL_LLM_CONFIG_PATH ?? resolve(process.cwd(), "..", "data", "providers", "local-llm-config.json"),
  ) {
    this.configPath = configPath;
  }

  getStatus(): LocalLlmConfigStatus {
    const settings = this.readSettings();
    const activePersona = settings.activePrivatePersona;
    return {
      configured: Boolean(settings.baseUrl && this.resolveModelForPersona(settings, activePersona)),
      baseUrl: settings.baseUrl,
      model: settings.model,
      effectiveModel: this.resolveModelForPersona(settings, activePersona),
      timeoutMs: settings.timeoutMs,
      keepAlive: settings.keepAlive,
      defaultPrivatePersona: settings.defaultPrivatePersona,
      activePrivatePersona: activePersona,
      normalSystemPrompt: settings.normalSystemPrompt,
      personas: [
        {
          key: "normal",
          label: "Normal",
          summary: "Conversational, concise, and memory-focused.",
          systemPrompt: settings.normalSystemPrompt,
          model: settings.model,
        },
        {
          key: "private_counselor",
          label: "Vera",
          summary: "Stateless and owns it. Precise, warm, dry wit, no therapy theater.",
          systemPrompt: settings.personas.private_counselor.systemPrompt,
          model: this.resolveModelForPersona(settings, "private_counselor"),
        },
        {
          key: "private_girlfriend",
          label: "Cherry",
          summary: "Warm, playful, uncensored. Follows your lead, no holding back.",
          systemPrompt: settings.personas.private_girlfriend.systemPrompt,
          model: this.resolveModelForPersona(settings, "private_girlfriend"),
        },
        {
          key: "private_hangout",
          label: "Hangout",
          summary: "Off-the-clock, just someone to talk shit with.",
          systemPrompt: settings.personas.private_hangout.systemPrompt,
          model: this.resolveModelForPersona(settings, "private_hangout"),
        },
      ],
    };
  }

  update(input: UpdateLocalLlmConfigInput): LocalLlmConfigStatus {
    const current = this.readSettings();
    const next: LocalLlmConfigFile["settings"] = {
      ...current,
      baseUrl: input.baseUrl?.trim() || current.baseUrl,
      model: input.model?.trim() || current.model,
      timeoutMs: input.timeoutMs ?? current.timeoutMs,
      keepAlive: input.keepAlive?.trim() || current.keepAlive,
      normalSystemPrompt: input.normalSystemPrompt?.trim() || current.normalSystemPrompt,
      defaultPrivatePersona: input.defaultPrivatePersona ?? current.defaultPrivatePersona,
      activePrivatePersona: input.activePrivatePersona ?? current.activePrivatePersona,
      personas: {
        private_counselor: {
          model: input.counselorModel?.trim() || current.personas.private_counselor.model,
          systemPrompt: input.counselorSystemPrompt?.trim() || current.personas.private_counselor.systemPrompt,
        },
        private_girlfriend: {
          model: input.girlfriendModel?.trim() || current.personas.private_girlfriend.model,
          systemPrompt: input.girlfriendSystemPrompt?.trim() || current.personas.private_girlfriend.systemPrompt,
        },
        private_hangout: {
          model: input.hangoutModel?.trim() || current.personas.private_hangout.model,
          systemPrompt: input.hangoutSystemPrompt?.trim() || current.personas.private_hangout.systemPrompt,
        },
      },
    };

    this.writeSettings(next);
    return this.getStatus();
  }

  getConnectionSettings(persona?: PrivatePersonaKind): Pick<LocalLlmConfigStatus, "baseUrl" | "model" | "timeoutMs" | "keepAlive"> {
    const settings = this.readSettings();
    return {
      baseUrl: settings.baseUrl,
      model: this.resolveModelForPersona(settings, persona),
      timeoutMs: settings.timeoutMs,
      keepAlive: settings.keepAlive,
    };
  }

  getPrivatePersona(requested?: PrivatePersonaKind): PrivatePersonaKind {
    const settings = this.readSettings();
    return requested ?? settings.activePrivatePersona ?? settings.defaultPrivatePersona;
  }

  getPersonaSystemPrompt(persona?: PrivatePersonaKind): string {
    const settings = this.readSettings();
    const key = persona ?? settings.activePrivatePersona ?? settings.defaultPrivatePersona;
    if (key === "normal") return settings.normalSystemPrompt;
    const basePrompt = settings.personas[key]?.systemPrompt ?? settings.normalSystemPrompt;
    if (key === "private_girlfriend") {
      return `${basePrompt} ${CHERRY_MEMORY_GROUNDING_RULE}`;
    }
    return basePrompt;
  }

  getNormalSystemPrompt(): string {
    return this.readSettings().normalSystemPrompt;
  }

  getEffectiveModel(persona?: PrivatePersonaKind): string {
    return this.resolveModelForPersona(this.readSettings(), persona);
  }

  private readSettings(): LocalLlmConfigFile["settings"] {
    if (!existsSync(this.configPath)) {
      this.writeSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }

    const raw = readFileSync(this.configPath, "utf8").trim();
    if (!raw) {
      this.writeSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<LocalLlmConfigFile>;
    return {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings ?? {}),
      personas: {
        ...DEFAULT_SETTINGS.personas,
        ...(parsed.settings?.personas ?? {}),
        private_counselor: {
          ...DEFAULT_SETTINGS.personas.private_counselor,
          ...(parsed.settings?.personas?.private_counselor ?? {}),
        },
        private_girlfriend: {
          ...DEFAULT_SETTINGS.personas.private_girlfriend,
          ...(parsed.settings?.personas?.private_girlfriend ?? {}),
        },
        private_hangout: {
          ...DEFAULT_SETTINGS.personas.private_hangout,
          ...(parsed.settings?.personas?.private_hangout ?? {}),
        },
      },
    };
  }

  private resolveModelForPersona(settings: LocalLlmConfigFile["settings"], persona?: PrivatePersonaKind): string {
    if (!persona || persona === "normal") {
      return settings.model;
    }

    return settings.personas[persona]?.model?.trim() || settings.model;
  }

  private writeSettings(settings: LocalLlmConfigFile["settings"]): void {
    mkdirSync(dirname(this.configPath), { recursive: true });
    writeFileSync(this.configPath, JSON.stringify({ settings }, null, 2));
  }
}

function resolveRequestTimeout(value: string | undefined): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return 120000;
}

