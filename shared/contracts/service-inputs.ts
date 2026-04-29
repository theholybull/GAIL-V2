import type { PartSourceType, PartStatus } from "../enums/parts";
import type { PriorityLevel, TaskStatus } from "../enums/task";
import type { ReminderStatus } from "../enums/reminder";
import type {
  FeatureBacklogPriority,
  FeatureBacklogPromotionTarget,
  FeatureBacklogSource,
  FeatureBacklogStageTarget,
  FeatureBacklogStatus,
} from "./backlog";
import type { PrivatePersonaKind } from "./provider-status";
import type { VoiceRuntimeConfig } from "./voice";

export interface CreateProjectInput {
  title: string;
  summary?: string;
  tags?: string[];
}

export interface UpdateProjectInput {
  title?: string;
  summary?: string;
  status?: "active" | "paused" | "archived";
  tags?: string[];
}

export interface CreateNoteInput {
  title: string;
  body: string;
  projectId?: string;
  privateOnly?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  body?: string;
  projectId?: string;
  privateOnly?: boolean;
}

export interface CreateListInput {
  title: string;
  description?: string;
}

export interface UpdateListInput {
  title?: string;
  description?: string;
  archived?: boolean;
}

export interface AddListItemInput {
  text: string;
}

export interface UpdateListItemInput {
  text?: string;
  completed?: boolean;
}

export interface CreateTaskInput {
  title: string;
  details?: string;
  projectId?: string;
  dueAt?: string;
  sourceThreadId?: string;
  priority?: PriorityLevel;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  details?: string;
  projectId?: string;
  dueAt?: string;
  sourceThreadId?: string;
  priority?: PriorityLevel;
  status?: TaskStatus;
}

export interface CreateReminderInput {
  title: string;
  remindAt: string;
  details?: string;
  linkedTaskId?: string;
  status?: ReminderStatus;
}

export interface UpdateReminderInput {
  title?: string;
  remindAt?: string;
  details?: string;
  linkedTaskId?: string;
  status?: ReminderStatus;
}

export interface CreatePartRecordInput {
  title: string;
  sourceType: PartSourceType;
  projectId?: string;
  partNumber?: string;
  sourceUrl?: string;
  compatibilityNotes?: string;
  status?: PartStatus;
}

export interface UpdatePartRecordInput {
  title?: string;
  sourceType?: PartSourceType;
  projectId?: string;
  partNumber?: string;
  sourceUrl?: string;
  compatibilityNotes?: string;
  status?: PartStatus;
}

export interface CreateCartItemInput {
  title: string;
  sourceUrl: string;
  quantity?: number;
  partId?: string;
  notes?: string;
}

export interface UpdateCartItemInput {
  title?: string;
  sourceUrl?: string;
  quantity?: number;
  partId?: string;
  notes?: string;
  status?: "pending_review" | "saved_for_later" | "approved" | "removed";
}

export interface CreatePrivateSessionNoteInput {
  body: string;
  title?: string;
}

export interface CreateApprovalRequestInput {
  actionType: string;
  reason: string;
  requestedByDeviceId: string;
  expiresAt?: string;
}

export interface ResolveApprovalRequestInput {
  approvedByDeviceId: string;
  status: "approved" | "rejected";
}

export interface RegisterDeviceInput {
  id: string;
  type: "uconsole" | "kiosk" | "iphone" | "watch" | "web_admin" | "service";
  name: string;
  defaultMode: "work" | "home_shop" | "private" | "lightweight" | "focus";
  qualityTier: "low" | "medium" | "high";
  trusted?: boolean;
  supportsCamera?: boolean;
  supportsWatchApproval?: boolean;
  supportsRichAvatar?: boolean;
}

export interface UpdateDeviceTrustInput {
  trusted: boolean;
}

export interface UpdateDeviceSensitiveAccessInput {
  unlockForMinutes?: number;
  unlockUntil?: string;
  clear?: boolean;
}

export interface CreateConversationSessionInput {
  title?: string;
  providerPreference?: "openai" | "local-llm";
}

export interface CreateConversationMessageInput {
  content: string;
}

export interface CreateMemoryEntryInput {
  title: string;
  body: string;
  tags?: string[];
  source?: string;
}

export interface UpdateMemoryEntryInput {
  title?: string;
  body?: string;
  tags?: string[];
  source?: string;
}

export interface ImportDocumentItemInput {
  target: "memory" | "note";
  title?: string;
  body?: string;
  tags?: string[];
  source?: string;
  projectId?: string;
  fileName?: string;
  mimeType?: string;
  fileBase64?: string;
  archiveOriginal?: boolean;
}

export interface ImportDocumentsInput {
  items: ImportDocumentItemInput[];
}

export interface ExecuteCommandInput {
  phrase: string;
}

export interface CreateCommandMappingInput {
  commandKey: string;
  phrase: string;
}

export interface CreateFeatureBacklogInput {
  title: string;
  details: string;
  source: FeatureBacklogSource;
  stageTarget: FeatureBacklogStageTarget;
  priority: FeatureBacklogPriority;
  capturedBy: string;
}

export interface UpdateFeatureBacklogInput {
  title?: string;
  details?: string;
  stageTarget?: FeatureBacklogStageTarget;
  priority?: FeatureBacklogPriority;
  status?: FeatureBacklogStatus;
}

export interface PromoteFeatureBacklogInput {
  target: FeatureBacklogPromotionTarget;
  reviewer?: string;
}

export interface UpdateVoiceSettingsInput {
  mode?: "push_to_talk" | "wake_word" | "always_listening" | "typed";
  wakeWord?: string;
  silenceTimeoutMs?: number;
  autoResumeAfterResponse?: boolean;
  preferredTtsEngine?: "browser-speech-synthesis" | "openai-gpt-4o-mini-tts" | "openai-tts-1" | "openai-tts-1-hd";
  fallbackTtsEngine?: "browser-speech-synthesis";
  preferLocalBrowserVoice?: boolean;
  openAiVoice?: string;
  openAiInstructions?: string;
  browserVoiceName?: string;
  runtime?: VoiceRuntimeConfig;
}

export interface UpdateAvatarVoiceProfileInput {
  openAiVoice?: string;
  openAiInstructions?: string;
  browserVoiceName?: string;
}

export interface UpdateLocalLlmConfigInput {
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  keepAlive?: string;
  normalSystemPrompt?: string;
  defaultPrivatePersona?: PrivatePersonaKind;
  activePrivatePersona?: PrivatePersonaKind;
  counselorModel?: string;
  girlfriendModel?: string;
  hangoutModel?: string;
  counselorSystemPrompt?: string;
  girlfriendSystemPrompt?: string;
  hangoutSystemPrompt?: string;
}

export interface UpdateClientRuntimeSettingsInput {
  activeAvatarSystem?: "legacy_fallback" | "handoff_20260330" | "gail_primary";
  displayInputMode?: "wake_word" | "always_listening" | "typed";
  bodyMorphControls?: {
    enabledDuringMotion?: boolean;
    overrides?: Record<string, number>;
  };
}

export interface UpdateDeviceDisplayProfilesInput {
  selectedDeviceId?: string;
  profiles?: Array<{
    id: string;
    label: string;
    display: {
      width: number;
      height: number;
      renderScale: number;
      aspectRatio: string;
      safeFrame: number;
    };
    mesh: {
      bodyQuality: "low" | "medium" | "high";
      clothingQuality: "low" | "medium" | "high";
      hairQuality: "low" | "medium" | "high";
      animationLod: "low" | "medium" | "high";
    };
    staging: {
      sceneId: string;
      avatarTransform: {
        position: [number, number, number];
        rotation?: [number, number, number];
        scale?: [number, number, number];
      };
      cameraTransform: {
        position: [number, number, number];
        target?: [number, number, number];
      };
    };
  }>;
}

export interface VoiceSpeakInput {
  text: string;
  engineOverride?: "browser-speech-synthesis" | "openai-gpt-4o-mini-tts" | "openai-tts-1" | "openai-tts-1-hd";
  voiceOverride?: string;
  instructionsOverride?: string;
}

export interface VoiceTranscribeInput {
  audioBase64: string;
  mimeType: string;
  language?: string;
  prompt?: string;
}



export interface UpdateOpenAiConfigInput {
  apiKey?: string;
  clear?: boolean;
}
