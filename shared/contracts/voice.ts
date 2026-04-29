import type { DeviceType } from "../enums/device";
import type { Mode } from "../enums/mode";

export type VoiceInteractionMode = "push_to_talk" | "wake_word" | "always_listening" | "typed";
export type VoiceTtsEngine =
  | "browser-speech-synthesis"
  | "openai-gpt-4o-mini-tts"
  | "openai-tts-1"
  | "openai-tts-1-hd";

export interface AvatarVoiceProfile {
  openAiVoice?: string;
  openAiInstructions?: string;
  browserVoiceName?: string;
}

export interface VoiceRuntimeTiming {
  speechCooldownMs: number;
  thinkingFillerDelayMs: number;
  followUpTimeoutMs: number;
  wakeWordFollowUpTimeoutMs: number;
  defaultSubmitTimeoutMs: number;
  followUpSubmitTimeoutMs: number;
  wakeWordSubmitTimeoutMs: number;
  minSubmitTimeoutMs: number;
  maxSubmitTimeoutMs: number;
  ambientLowConfidenceThreshold: number;
  ambientRepeatWindowMs: number;
}

export interface VoiceRuntimePhrases {
  wakeWordAliases: string[];
  wakePrefixes: string[];
  wakeAcknowledgements: string[];
  thinkingFillers: {
    question: string[];
    command: string[];
    statement: string[];
  };
  contextFillers: {
    followUp: string[];
    vision: string[];
    persona: string[];
    dance: string[];
    system: string[];
  };
  conversationClosers: string[];
  bootGreetings: string[];
  ambientSingleWordAllowlist: string[];
}

export interface VoiceRuntimeConfig {
  timing: VoiceRuntimeTiming;
  phrases: VoiceRuntimePhrases;
}

export interface VoiceSettings {
  mode: VoiceInteractionMode;
  wakeWord: string;
  silenceTimeoutMs: number;
  autoResumeAfterResponse: boolean;
  sttEngine: "browser-web-speech";
  preferredTtsEngine: VoiceTtsEngine;
  fallbackTtsEngine: "browser-speech-synthesis";
  preferLocalBrowserVoice: boolean;
  openAiVoice: string;
  openAiInstructions?: string;
  browserVoiceName?: string;
  avatarVoiceProfiles?: Record<string, AvatarVoiceProfile>;
  runtime?: VoiceRuntimeConfig;
}

export interface VoiceStatus extends VoiceSettings {
  deviceType: DeviceType;
  modeContext: Mode;
  sttSupported: boolean;
  ttsSupported: boolean;
  cameraSupported: boolean;
}

export interface CameraAccessProfile {
  deviceType: DeviceType;
  cameraSupported: boolean;
  intendedUsage: string;
}

export interface VoiceEngineOption {
  key: VoiceTtsEngine;
  label: string;
  networkRequired: boolean;
  offlineCapable: boolean;
  available: boolean;
  details: string;
}

export interface VoiceSpeakResult {
  engineUsed: VoiceTtsEngine;
  fallbackUsed: boolean;
  offlineCapable: boolean;
  mimeType?: string;
  audioBase64?: string;
  details: string;
}

export interface VoiceTranscribeResult {
  engineUsed: "gpt-4o-mini-transcribe" | "gpt-4o-transcribe" | "whisper-1";
  text: string;
  details: string;
}
