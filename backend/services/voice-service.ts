import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  AvatarVoiceProfile,
  CameraAccessProfile,
  VoiceEngineOption,
  VoiceSpeakInput,
  VoiceSpeakResult,
  VoiceTranscribeInput,
  VoiceTranscribeResult,
  VoiceRuntimeConfig,
  UpdateAvatarVoiceProfileInput,
  UpdateVoiceSettingsInput,
  VoiceSettings,
  VoiceStatus,
} from "../../shared/contracts/index";
import type { RequestMeta } from "../api/request-meta";
import type { OpenAiConfigService } from "./openai-config-service";

interface VoiceSettingsFile {
  settings: VoiceSettings;
}

const DEFAULT_OPENAI_INSTRUCTIONS = "Speak with a soft feminine voice and a light UK English accent. Sound warm, calm, and natural. Avoid American pronunciation. Keep delivery gentle, lightly expressive, and conversational. Do not sound robotic, flat, deep, or masculine.";

const DEFAULT_AVATAR_VOICE_PROFILES: Record<string, AvatarVoiceProfile> = {
  gail_workwear: {
    openAiVoice: process.env.OPENAI_TTS_VOICE ?? "nova",
    openAiInstructions: DEFAULT_OPENAI_INSTRUCTIONS,
  },
  vera_counselor: {
    openAiVoice: "shimmer",
    openAiInstructions: "Speak with a calming, gentle, professional voice. Sound measured, warm, and grounded.",
  },
  cherry_girlfriend: {
    openAiVoice: "alloy",
    openAiInstructions: "Speak with a warm, sweet, playful feminine voice. Sound affectionate, bright, and naturally expressive.",
  },
};

const DEFAULT_VOICE_RUNTIME_CONFIG: VoiceRuntimeConfig = {
  timing: {
    speechCooldownMs: 1200,
    thinkingFillerDelayMs: 650,
    followUpTimeoutMs: 9000,
    wakeWordFollowUpTimeoutMs: 7000,
    defaultSubmitTimeoutMs: 1400,
    followUpSubmitTimeoutMs: 850,
    wakeWordSubmitTimeoutMs: 850,
    minSubmitTimeoutMs: 450,
    maxSubmitTimeoutMs: 3500,
    ambientLowConfidenceThreshold: 0.48,
    ambientRepeatWindowMs: 10000,
  },
  phrases: {
    wakeWordAliases: ["gail", "gale", "gael", "gal"],
    wakePrefixes: ["hey", "hi", "hello", "okay", "ok", "yo"],
    wakeAcknowledgements: ["What's up?", "I'm here.", "Right here.", "Yep?", "Go ahead.", "I'm listening.", "Talk to me."],
    thinkingFillers: {
      question: ["Let me think that through.", "Good question. One second.", "I'm checking that.", "Let me sort that out.", "Give me a second on that."],
      command: ["On it.", "I'll take care of that.", "Working on it.", "Let me do that.", "Okay, I'm moving on it."],
      statement: ["I hear you.", "I'm with you.", "Got it. Let me think.", "Okay, tracking.", "Right, I follow."],
    },
    contextFillers: {
      followUp: ["Right, continuing from that.", "I'm tracking.", "Yep, still with you."],
      vision: ["I'll take a look.", "Let me check what I can see.", "Looking now."],
      persona: ["Okay, switching gears.", "I'll adjust that."],
      dance: ["Okay, cueing that up.", "I'll get that moving."],
      system: ["Okay, adjusting that.", "I'll update that."],
    },
    conversationClosers: [
      "Alright, I'll be here if you need me.",
      "Okay, just say hey gail if you need anything.",
      "I'm going quiet for now. Call me anytime.",
      "Standing by whenever you're ready.",
      "No worries, I'll be right here.",
    ],
    bootGreetings: [
      "Hey boss, I'm online and ready to go.",
      "Good to go. Just say hey gail when you need me.",
      "I'm up. Let me know what you need.",
      "All systems go. I'm listening for hey gail.",
    ],
    ambientSingleWordAllowlist: ["yes", "yeah", "yep", "no", "nope", "stop", "cancel", "quiet"],
  },
};

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  mode: "wake_word",
  wakeWord: "hey gail",
  silenceTimeoutMs: 6000,
  autoResumeAfterResponse: true,
  sttEngine: "browser-web-speech",
  preferredTtsEngine: "openai-gpt-4o-mini-tts",
  fallbackTtsEngine: "browser-speech-synthesis",
  preferLocalBrowserVoice: false,
  openAiVoice: process.env.OPENAI_TTS_VOICE ?? "nova",
  openAiInstructions: DEFAULT_OPENAI_INSTRUCTIONS,
  browserVoiceName: undefined,
  avatarVoiceProfiles: DEFAULT_AVATAR_VOICE_PROFILES,
  runtime: DEFAULT_VOICE_RUNTIME_CONFIG,
};

export class VoiceService {
  private readonly settingsPath: string;
  private readonly openAiBaseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  constructor(
    private readonly openAiConfigService?: OpenAiConfigService,
    settingsPath = process.env.GAIL_VOICE_SETTINGS_PATH ?? resolve(process.cwd(), "..", "data", "voice", "voice-settings.json"),
  ) {
    this.settingsPath = settingsPath;
  }

  getSettings(): VoiceSettings {
    return this.readSettings();
  }

  getAvatarVoiceProfiles(): Record<string, AvatarVoiceProfile> {
    return this.readSettings().avatarVoiceProfiles ?? { ...DEFAULT_AVATAR_VOICE_PROFILES };
  }

  updateSettings(input: UpdateVoiceSettingsInput): VoiceSettings {
    const current = this.readSettings();
    const next: VoiceSettings = {
      ...current,
      ...input,
      browserVoiceName: input.browserVoiceName === "" ? undefined : input.browserVoiceName ?? current.browserVoiceName,
      avatarVoiceProfiles: {
        ...DEFAULT_AVATAR_VOICE_PROFILES,
        ...(current.avatarVoiceProfiles ?? {}),
      },
      runtime: normalizeVoiceRuntimeConfig(input.runtime, current.runtime),
    };
    this.writeSettings(next);
    return next;
  }

  updateAvatarVoiceProfile(presetId: string, input: UpdateAvatarVoiceProfileInput): Record<string, AvatarVoiceProfile> {
    const normalizedPresetId = String(presetId || "").trim();
    if (!normalizedPresetId) {
      throw new Error("presetId is required.");
    }

    const current = this.readSettings();
    const currentProfiles = {
      ...DEFAULT_AVATAR_VOICE_PROFILES,
      ...(current.avatarVoiceProfiles ?? {}),
    };
    const existingProfile = currentProfiles[normalizedPresetId] ?? {};
    const nextProfile: AvatarVoiceProfile = {
      ...existingProfile,
      ...input,
      browserVoiceName: input.browserVoiceName === "" ? undefined : input.browserVoiceName ?? existingProfile.browserVoiceName,
    };
    const nextSettings: VoiceSettings = {
      ...current,
      avatarVoiceProfiles: {
        ...currentProfiles,
        [normalizedPresetId]: nextProfile,
      },
    };
    this.writeSettings(nextSettings);
    return nextSettings.avatarVoiceProfiles ?? {};
  }

  getStatus(meta: RequestMeta): VoiceStatus {
    const settings = this.readSettings();
    const sttSupported = ["uconsole", "kiosk", "iphone", "web_admin"].includes(meta.deviceType);
    const ttsSupported = ["uconsole", "kiosk", "iphone", "web_admin"].includes(meta.deviceType);
    const cameraSupported = ["uconsole", "kiosk", "iphone"].includes(meta.deviceType);

    return {
      ...settings,
      deviceType: meta.deviceType,
      modeContext: meta.mode,
      sttSupported,
      ttsSupported,
      cameraSupported,
    };
  }

  listTtsEngines(): VoiceEngineOption[] {
    const openAiAvailable = Boolean(this.getOpenAiApiKey());
    return [
      {
        key: "browser-speech-synthesis",
        label: "Browser / OS Voice",
        networkRequired: false,
        offlineCapable: true,
        available: true,
        details: "Uses local browser and operating-system voices.",
      },
      {
        key: "openai-gpt-4o-mini-tts",
        label: "OpenAI GPT-4o mini TTS",
        networkRequired: true,
        offlineCapable: false,
        available: openAiAvailable,
        details: openAiAvailable ? "Fast cloud TTS." : "Requires an OpenAI API key.",
      },
      {
        key: "openai-tts-1",
        label: "OpenAI TTS-1",
        networkRequired: true,
        offlineCapable: false,
        available: openAiAvailable,
        details: openAiAvailable ? "Cloud TTS optimized for speed." : "Requires an OpenAI API key.",
      },
      {
        key: "openai-tts-1-hd",
        label: "OpenAI TTS-1 HD",
        networkRequired: true,
        offlineCapable: false,
        available: openAiAvailable,
        details: openAiAvailable ? "Cloud TTS optimized for quality." : "Requires an OpenAI API key.",
      },
    ];
  }

  async synthesizeSpeech(input: VoiceSpeakInput): Promise<VoiceSpeakResult> {
    const settings = this.readSettings();
    const preferred = input.engineOverride ?? settings.preferredTtsEngine;
    const voice = input.voiceOverride ?? settings.openAiVoice;
    const instructions = input.instructionsOverride ?? settings.openAiInstructions;
    if (preferred === "browser-speech-synthesis") {
      return this.browserFallback("Browser speech synthesis selected as primary.");
    }

    try {
      return await this.openAiSpeech(preferred, voice, instructions, input.text);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown TTS error.";
      return this.browserFallback(`OpenAI TTS unavailable, using browser fallback: ${reason}`);
    }
  }

  async transcribeSpeech(input: VoiceTranscribeInput): Promise<VoiceTranscribeResult> {
    const apiKey = this.getOpenAiApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const model = (process.env.OPENAI_STT_MODEL ?? "gpt-4o-mini-transcribe") as VoiceTranscribeResult["engineUsed"];
    return await this.openAiTranscription(model, input);
  }

  async warmupPreferredTts(): Promise<{
    preferredEngine: VoiceSettings["preferredTtsEngine"];
    ready: boolean;
    details: string;
  }> {
    const settings = this.readSettings();
    const preferred = settings.preferredTtsEngine;
    if (preferred === "browser-speech-synthesis") {
      return {
        preferredEngine: preferred,
        ready: true,
        details: "Browser speech synthesis is configured as the preferred engine.",
      };
    }

    if (!this.getOpenAiApiKey()) {
      return {
        preferredEngine: preferred,
        ready: false,
        details: "OpenAI API key is not configured for preferred TTS startup warmup.",
      };
    }

    try {
      await this.openAiSpeech(preferred, settings.openAiVoice, settings.openAiInstructions, ".");
      return {
        preferredEngine: preferred,
        ready: true,
        details: `Preferred engine ${preferred} warmed successfully.`,
      };
    } catch (error) {
      return {
        preferredEngine: preferred,
        ready: false,
        details: error instanceof Error ? error.message : "Unknown TTS warmup error.",
      };
    }
  }

  getCameraMatrix(): CameraAccessProfile[] {
    return [
      {
        deviceType: "uconsole",
        cameraSupported: true,
        intendedUsage: "optional webcam presence and work-terminal visual tasks",
      },
      {
        deviceType: "kiosk",
        cameraSupported: true,
        intendedUsage: "presence, framing, and wake behavior",
      },
      {
        deviceType: "iphone",
        cameraSupported: true,
        intendedUsage: "camera-assisted mobile tasks and uploads",
      },
      {
        deviceType: "watch",
        cameraSupported: false,
        intendedUsage: "no camera support",
      },
      {
        deviceType: "web_admin",
        cameraSupported: false,
        intendedUsage: "browser admin surface only",
      },
      {
        deviceType: "service",
        cameraSupported: false,
        intendedUsage: "server-side service only",
      },
    ];
  }

  private readSettings(): VoiceSettings {
    if (!existsSync(this.settingsPath)) {
      this.writeSettings(DEFAULT_VOICE_SETTINGS);
      return DEFAULT_VOICE_SETTINGS;
    }

    const raw = readFileSync(this.settingsPath, "utf8").trim();
    if (!raw) {
      this.writeSettings(DEFAULT_VOICE_SETTINGS);
      return DEFAULT_VOICE_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<VoiceSettingsFile>;
    return {
      ...DEFAULT_VOICE_SETTINGS,
      ...(parsed.settings ?? {}),
      avatarVoiceProfiles: {
        ...DEFAULT_AVATAR_VOICE_PROFILES,
        ...(parsed.settings?.avatarVoiceProfiles ?? {}),
      },
      runtime: normalizeVoiceRuntimeConfig(parsed.settings?.runtime, DEFAULT_VOICE_RUNTIME_CONFIG),
    };
  }

  private writeSettings(settings: VoiceSettings): void {
    mkdirSync(dirname(this.settingsPath), { recursive: true });
    const payload: VoiceSettingsFile = { settings };
    writeFileSync(this.settingsPath, JSON.stringify(payload, null, 2), { mode: 0o600 });
  }

  private getOpenAiApiKey(): string | undefined {
    return this.openAiConfigService?.getApiKey() ?? process.env.OPENAI_API_KEY;
  }

  private browserFallback(details: string): VoiceSpeakResult {
    return {
      engineUsed: "browser-speech-synthesis",
      fallbackUsed: true,
      offlineCapable: true,
      details,
    };
  }

  private async openAiSpeech(
    engine: "openai-gpt-4o-mini-tts" | "openai-tts-1" | "openai-tts-1-hd",
    voice: string,
    instructions: string | undefined,
    text: string,
  ): Promise<VoiceSpeakResult> {
    const apiKey = this.getOpenAiApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const model = engine === "openai-gpt-4o-mini-tts"
      ? "gpt-4o-mini-tts"
      : engine === "openai-tts-1"
        ? "tts-1"
        : "tts-1-hd";

    const body: Record<string, unknown> = {
      model,
      voice,
      input: text,
      format: "mp3",
    };
    if (engine === "openai-gpt-4o-mini-tts" && instructions) {
      body.instructions = instructions;
    }

    const response = await fetch(`${this.openAiBaseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI speech request failed with ${response.status}: ${body}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      engineUsed: engine,
      fallbackUsed: false,
      offlineCapable: false,
      mimeType: "audio/mpeg",
      audioBase64: buffer.toString("base64"),
      details: `Speech synthesized with ${model}.`,
    };
  }

  private async openAiTranscription(
    model: VoiceTranscribeResult["engineUsed"],
    input: VoiceTranscribeInput,
  ): Promise<VoiceTranscribeResult> {
    const apiKey = this.getOpenAiApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const buffer = Buffer.from(input.audioBase64, "base64");
    if (buffer.length < 256) {
      return {
        engineUsed: model,
        text: "",
        details: "Audio clip was too small to transcribe.",
      };
    }
    const uploadMimeType = this.baseMimeType(input.mimeType);
    const fileName = `mobile-speech.${this.extensionForMimeType(uploadMimeType)}`;
    const form = new FormData();
    form.append("model", model);
    form.append("file", new Blob([buffer], { type: uploadMimeType }), fileName);
    form.append("response_format", "json");
    form.append("language", input.language || "en");
    if (input.prompt) {
      form.append("prompt", input.prompt);
    }

    const response = await fetch(`${this.openAiBaseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI transcription request failed with ${response.status}: ${body}`);
    }

    const payload = await response.json() as { text?: unknown };
    return {
      engineUsed: model,
      text: typeof payload.text === "string" ? payload.text.trim() : "",
      details: `Audio transcribed with ${model}.`,
    };
  }

  private extensionForMimeType(mimeType: string): string {
    const normalized = this.baseMimeType(mimeType);
    if (normalized.includes("webm")) return "webm";
    if (normalized.includes("mp4")) return "m4a";
    if (normalized.includes("mpeg") || normalized.includes("mp3")) return "mp3";
    if (normalized.includes("wav")) return "wav";
    if (normalized.includes("aac")) return "aac";
    if (normalized.includes("ogg")) return "ogg";
    return "webm";
  }

  private baseMimeType(mimeType: string): string {
    return mimeType.toLowerCase().split(";")[0]?.trim() || "audio/webm";
  }
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const cleaned = value.map((item) => String(item ?? "").trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [...fallback];
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, numeric));
}

function normalizeVoiceRuntimeConfig(
  incoming: Partial<VoiceRuntimeConfig> | undefined,
  fallback: VoiceRuntimeConfig | undefined,
): VoiceRuntimeConfig {
  const base = fallback ?? DEFAULT_VOICE_RUNTIME_CONFIG;
  const timing = (incoming?.timing ?? {}) as Partial<VoiceRuntimeConfig["timing"]>;
  const phrases = (incoming?.phrases ?? {}) as Partial<VoiceRuntimeConfig["phrases"]>;
  const thinkingFillers = (phrases.thinkingFillers ?? {}) as Partial<VoiceRuntimeConfig["phrases"]["thinkingFillers"]>;
  const contextFillers = (phrases.contextFillers ?? {}) as Partial<VoiceRuntimeConfig["phrases"]["contextFillers"]>;
  return {
    timing: {
      speechCooldownMs: normalizeNumber(timing.speechCooldownMs, base.timing.speechCooldownMs, 0, 10000),
      thinkingFillerDelayMs: normalizeNumber(timing.thinkingFillerDelayMs, base.timing.thinkingFillerDelayMs, 0, 5000),
      followUpTimeoutMs: normalizeNumber(timing.followUpTimeoutMs, base.timing.followUpTimeoutMs, 1000, 30000),
      wakeWordFollowUpTimeoutMs: normalizeNumber(timing.wakeWordFollowUpTimeoutMs, base.timing.wakeWordFollowUpTimeoutMs, 1000, 30000),
      defaultSubmitTimeoutMs: normalizeNumber(timing.defaultSubmitTimeoutMs, base.timing.defaultSubmitTimeoutMs, 250, 10000),
      followUpSubmitTimeoutMs: normalizeNumber(timing.followUpSubmitTimeoutMs, base.timing.followUpSubmitTimeoutMs, 250, 10000),
      wakeWordSubmitTimeoutMs: normalizeNumber(timing.wakeWordSubmitTimeoutMs, base.timing.wakeWordSubmitTimeoutMs, 250, 10000),
      minSubmitTimeoutMs: normalizeNumber(timing.minSubmitTimeoutMs, base.timing.minSubmitTimeoutMs, 100, 5000),
      maxSubmitTimeoutMs: normalizeNumber(timing.maxSubmitTimeoutMs, base.timing.maxSubmitTimeoutMs, 500, 20000),
      ambientLowConfidenceThreshold: normalizeNumber(timing.ambientLowConfidenceThreshold, base.timing.ambientLowConfidenceThreshold, 0, 1),
      ambientRepeatWindowMs: normalizeNumber(timing.ambientRepeatWindowMs, base.timing.ambientRepeatWindowMs, 0, 60000),
    },
    phrases: {
      wakeWordAliases: normalizeStringArray(phrases.wakeWordAliases, base.phrases.wakeWordAliases),
      wakePrefixes: normalizeStringArray(phrases.wakePrefixes, base.phrases.wakePrefixes),
      wakeAcknowledgements: normalizeStringArray(phrases.wakeAcknowledgements, base.phrases.wakeAcknowledgements),
      thinkingFillers: {
        question: normalizeStringArray(thinkingFillers.question, base.phrases.thinkingFillers.question),
        command: normalizeStringArray(thinkingFillers.command, base.phrases.thinkingFillers.command),
        statement: normalizeStringArray(thinkingFillers.statement, base.phrases.thinkingFillers.statement),
      },
      contextFillers: {
        followUp: normalizeStringArray(contextFillers.followUp, base.phrases.contextFillers.followUp),
        vision: normalizeStringArray(contextFillers.vision, base.phrases.contextFillers.vision),
        persona: normalizeStringArray(contextFillers.persona, base.phrases.contextFillers.persona),
        dance: normalizeStringArray(contextFillers.dance, base.phrases.contextFillers.dance),
        system: normalizeStringArray(contextFillers.system, base.phrases.contextFillers.system),
      },
      conversationClosers: normalizeStringArray(phrases.conversationClosers, base.phrases.conversationClosers),
      bootGreetings: normalizeStringArray(phrases.bootGreetings, base.phrases.bootGreetings),
      ambientSingleWordAllowlist: normalizeStringArray(phrases.ambientSingleWordAllowlist, base.phrases.ambientSingleWordAllowlist),
    },
  };
}
