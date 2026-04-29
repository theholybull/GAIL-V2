export {};

type ManifestAsset = {
  id: string;  
  kind?: string;
  slot?: string;
  name: string;
  autoLoad?: boolean;
  present?: boolean;
  required?: boolean;
  resolvedPath?: string;
  fileSizeBytes?: number;
  loadRisk?: "normal" | "large" | "oversized";
};

type AssetManifestResponse = {
  avatarReady?: boolean;
  coreAssetIds?: string[];
  assets?: ManifestAsset[];
  personaMap?: Record<string, {
    bodyAssetId: string;
    displayPrefix: string;
    presetId?: string;
    label?: string;
  }>;
  manifestSource?: "catalog" | "integration_manifest";
  selectedAssetRoot?: string;
};

type RuntimeSettingsResponse = {
  activeAvatarSystem?: string;
  activeAssetRoot?: string;
  displayInputMode?: "wake_word" | "always_listening" | "typed";
  bodyMorphControls?: {
    enabledDuringMotion?: boolean;
    overrides?: Record<string, number>;
  };
};

type VoiceSettingsResponse = {
  mode?: "push_to_talk" | "wake_word" | "always_listening" | "typed";
  silenceTimeoutMs?: number;
  wakeWord?: string;
  autoResumeAfterResponse?: boolean;
  preferredTtsEngine?: string;
  fallbackTtsEngine?: string;
  openAiVoice?: string;
  openAiInstructions?: string;
  preferLocalBrowserVoice?: boolean;
  browserVoiceName?: string;
  avatarVoiceProfiles?: Record<string, {
    openAiVoice?: string;
    openAiInstructions?: string;
    browserVoiceName?: string;
  }>;
  runtime?: VoiceRuntimeConfig;
};

type VoiceRuntimeConfig = {
  timing: {
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
  };
  phrases: {
    wakeWordAliases: string[];
    wakePrefixes: string[];
    wakeAcknowledgements: string[];
    thinkingFillers: Record<VoiceIntentKind, string[]>;
    contextFillers: Record<"followUp" | "vision" | "persona" | "dance" | "system", string[]>;
    conversationClosers: string[];
    bootGreetings: string[];
    ambientSingleWordAllowlist: string[];
  };
};

type ProviderStatusResponse = Array<{
  provider: string;
  available?: boolean;
}>;

type LocalLlmConfigResponse = {
  model?: string;
  effectiveModel?: string;
  timeoutMs?: number;
  activePrivatePersona?: string;
};

type DeviceDisplayProfile = {
  id: string;
  label?: string;
  display?: { aspectRatio?: string };
  mesh?: { bodyQuality?: string; clothingQuality?: string; hairQuality?: string; animationLod?: string };
  staging?: {
    sceneId?: string;
    avatarTransform?: {
      position?: number[];
      rotation?: number[];
      scale?: number[];
    };
    cameraTransform?: {
      position?: number[];
      target?: number[];
    };
  };
};

type DeviceDisplayProfilesResponse = {
  selectedDeviceId?: string;
  profiles?: DeviceDisplayProfile[];
};

type EnvironmentProfile = {
  id: string;
  label?: string;
  assetPath: string;
  dayBackdropImagePath?: string;
  hideGeneratedFloor?: boolean;
  boundsIgnoreEntityNames?: string[];
  boundsIgnoreParentNames?: string[];
  avatarStandEntityNames?: string[];
  tuningStorageVersion?: string;
};

type EnvironmentProfilesResponse = {
  profiles?: EnvironmentProfile[];
};

type EnvironmentTransformTuning = {
  offset: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
};

type TimeOfDayLightingMode = "day" | "night";

type CameraStageTuning = {
  positionOffset: Vector3Tuple;
  targetOffset: Vector3Tuple;
};

type PersonaPlacement = {
  avatarPosition: Vector3Tuple;
  avatarRotation: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  cameraTarget: Vector3Tuple;
};

type ConversationMessageResponse = {
  session?: {
    messages?: Array<{ role: string; content: string }>;
  };
  reply?: {
    content?: string;
  };
};

type SpeechMorphTarget = {
  instance: any;
  mouthOpen?: string;
  aa?: string;
  ow?: string;
  ee?: string;
  ih?: string;
  fv?: string;
  l?: string;
  th?: string;
  m?: string;
  lowerLip?: string[];
  chin?: string[];
  smileLeft?: string[];
  smileRight?: string[];
};

type EyeMorphTarget = {
  instance: any;
  blinkLeft?: string[];
  blinkRight?: string[];
  squintLeft?: string[];
  squintRight?: string[];
};

type BodyMorphTarget = {
  instance: any;
  keys: string[];
};

type EyelidRigNode = {
  entity: any;
  direction: "upper" | "lower";
  basePosition: { x: number; y: number; z: number };
};

type VisemeWeights = {
  mouthOpen: number;
  aa: number;
  ow: number;
  ee: number;
  ih: number;
  fv: number;
  l: number;
  th: number;
  m: number;
  lowerLip: number;
  chin: number;
  smileLeft: number;
  smileRight: number;
};

type FacialMicroMotionState = {
  retargetIn: number;
  mouthOpenCurrent: number;
  mouthOpenTarget: number;
  lowerLipCurrent: number;
  lowerLipTarget: number;
  chinCurrent: number;
  chinTarget: number;
  smileBaseCurrent: number;
  smileBaseTarget: number;
  smileAsymCurrent: number;
  smileAsymTarget: number;
  squintBaseCurrent: number;
  squintBaseTarget: number;
  squintAsymCurrent: number;
  squintAsymTarget: number;
  jawOpenCurrent: number;
  jawOpenTarget: number;
  jawSwayCurrent: number;
  jawSwayTarget: number;
};

type BodyAliveMotionState = {
  breathPhase: number;
  breathRateCurrent: number;
  breathRateTarget: number;
  breathDepthCurrent: number;
  breathDepthTarget: number;
  breathRetargetIn: number;
  inhaleHold: number;
  weightRetargetIn: number;
  weightShiftCurrent: number;
  weightShiftTarget: number;
  hipSwayCurrent: number;
  hipSwayTarget: number;
  shoulderEaseCurrent: number;
  shoulderEaseTarget: number;
  settleCurrent: number;
  settleTarget: number;
};

type AvatarAnimationState = "idle" | "talk" | "listen" | "ack" | "dance";

type BrowserSpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string; confidence?: number };
};

type BrowserSpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<BrowserSpeechRecognitionResultLike>;
};

type BrowserSpeechRecognitionErrorEventLike = Event & {
  error?: string;
  message?: string;
};

type BrowserSpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEventLike) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognitionInstance;

type AvatarMechanicsController = {
  setListening: (active: boolean) => void;
  speakText: (text: string) => Promise<void>;
  pulseAck: () => void;
  stopSpeech: () => void;
  runMotionTest: () => void;
};

type WorkLiteVoiceRuntime = {
  supported: boolean;
  active: boolean;
  recognition?: BrowserSpeechRecognitionInstance;
  conversationBuffer: string;
  /** Tracks the highest result index already committed to the buffer (for continuous accumulation). */
  lastCommittedResultIndex: number;
  silenceTimer?: number;
  lastTranscript: string;
  lastError?: string;
  retryBlocked: boolean;
  awaitingAssistant: boolean;
  followUpListening: boolean;
  followUpTimer?: number;
  followUpTimeoutMs?: number;
};

type WorkLiteSpeechState = {
  audio?: HTMLAudioElement;
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
  sourceNode?: MediaElementAudioSourceNode;
  utterance?: SpeechSynthesisUtterance;
  audioQueue: Array<{ audioBase64: string; mimeType: string; sourceText: string }>;
  browserQueue: string[];
  processingAudioQueue: boolean;
  playbackGeneration: number;
  raf?: number;
  speaking: boolean;
  talkLevel: number;
  breathPauseUntil: number;
  lastBreathPauseAt: number;
  engineLabel: string;
};

type VoiceIntentKind = "question" | "command" | "statement";
type VoiceFillerContext = "general" | "follow_up" | "vision" | "persona" | "dance" | "system";

type VoiceIntentClassification = {
  kind: VoiceIntentKind;
  context: VoiceFillerContext;
};

type WakeWordMatch = {
  matchedText: string;
  afterWakeWord: string;
};

type VoiceSubmissionOptions = {
  timeoutMs?: number;
  ambientGuard?: boolean;
  confidenceSamples?: number[];
};

type Vector3Tuple = [number, number, number];

type ViewportGizmoTarget = "avatar" | "environment" | "camera";
type ViewportGizmoMode = "move" | "rotate" | "scale";
type ViewportGizmoStepId = "fine" | "medium" | "coarse";

type StageBounds = {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  width: number;
  height: number;
  depth: number;
};

const DEFAULT_ASSET_ROOT = "gail";
const OPTIMIZED_GAIL_ASSET_ROOT = "gail_lite";
const CLIENT_ASSET_VERSION_SALT = "20260424-env-backdrop33";
const DEFAULT_BROWSER_VOICE = "Microsoft Sonia Online (Natural) - English (United Kingdom)";
const DEFAULT_OPENAI_INSTRUCTIONS = "Speak with a soft feminine voice and a light UK English accent. Sound warm, calm, and natural. Avoid American pronunciation. Keep delivery gentle, lightly expressive, and conversational. Do not sound robotic, flat, deep, or masculine.";
const CLIENT_QUERY = new URLSearchParams(window.location.search);
const ALLOW_PERSISTED_PRIVATE_PERSONA = CLIENT_QUERY.get("allowPersistedPersona") === "1";
const EXPLICIT_ASSET_ROOT = CLIENT_QUERY.get("assetRoot")?.trim() || "";
const DISABLE_LITE_ASSET_ROOT = CLIENT_QUERY.get("disableLiteAssetRoot") === "1";
const AUTO_FULLSCREEN = CLIENT_QUERY.get("fs") === "1";
const LARGE_ASSET_BYTES = 150 * 1024 * 1024;
const OVERSIZED_ASSET_BYTES = 250 * 1024 * 1024;
const OVERSIZED_STAGE_MODULE_KINDS = new Set(["hair", "clothing", "accessory", "background"]);
const APPLY_CLIENT_MATTE = true;
const FORCE_BODY_VISIBLE_FALLBACK = false;
const WORK_LITE_SKELETAL_ANIMATION_ENABLED = true;
const WORK_LITE_ANIMATION_PLAYBACK_SPEED = 0.86;
const WORK_LITE_ANIMATION_HOLD_SECONDS: Record<AvatarAnimationState, number> = {
  idle: 0.38,
  talk: 0.42,
  listen: 0.42,
  ack: 0,
  dance: 0,
};
const FACIAL_MICRO_MOVEMENT_ENABLED = true;
const BODY_ALIVE_MOTION_ENABLED = true;
const STAGE_CAMERA_POSITION = [0, 1.2, 3] as const;
const STAGE_CAMERA_EULER = [-4, 0, 0] as const;
const STAGE_CAMERA_TARGET = [0, 1.2, 0] as const;
const STAGE_AVATAR_POSITION = [0, 0, 0] as const;
const STAGE_AVATAR_ROTATION = [0, 180, 0] as const;
const STAGE_AVATAR_SCALE = [1, 1, 1] as const;

/**
 * Per-persona stage placement. These are the STARTING values when a persona
 * first loads. All values are applied before bootStage runs so they override
 * anything the device-display-profile sets.
 *
 * avatarPosition  — world offset of the avatar root (x, y, z)
 * avatarRotation  — base avatar rotation (x, y, z)
 * cameraPosition  — where the camera sits (x, y, z)
 * cameraTarget    — where the camera looks (x, y, z)
 *
 * Adjust these while the app is running (using the viewport gizmo) and copy
 * the logged values here once you're happy with the placement.
 */
const PERSONA_STAGE_PLACEMENT: Record<string, {
  avatarPosition: Vector3Tuple;
  avatarRotation: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  cameraTarget: Vector3Tuple;
}> = {
  normal: {
    avatarPosition: [0, 0, 0],
    avatarRotation: [...STAGE_AVATAR_ROTATION],
    cameraPosition: [0, 1.55, 2.8],
    cameraTarget:   [0, 1.3,  0],
  },
  private_counselor: {
    avatarPosition: [0, 0, 0],
    avatarRotation: [...STAGE_AVATAR_ROTATION],
    cameraPosition: [0, 1.55, 2.8],
    cameraTarget:   [0, 1.3,  0],
  },
  private_girlfriend: {
    // Cherry — open floor space, camera framing her full body with room to move
    avatarPosition: [0, 0, 0.5],
    avatarRotation: [...STAGE_AVATAR_ROTATION],
    cameraPosition: [0, 1.5, 3.2],
    cameraTarget:   [0, 1.1, 0.5],
  },
  private_hangout: {
    avatarPosition: [0, 0, 0],
    avatarRotation: [...STAGE_AVATAR_ROTATION],
    cameraPosition: [0, 1.55, 2.8],
    cameraTarget:   [0, 1.3,  0],
  },
};

const STAGE_CLEAR_COLOR = [0.118, 0.118, 0.118, 1] as const;
const DAY_STAGE_CLEAR_COLOR = [0.72, 0.76, 0.8, 1] as const;
const STAGE_AMBIENT_COLOR = [0.72, 0.68, 0.62] as const;
const DAY_STAGE_AMBIENT_COLOR = [0.78, 0.76, 0.72] as const;
const KEY_LIGHT_POSITION = [-0.03046, 2.61912, 4.78987] as const;
const KEY_LIGHT_EULER = [91.7, -29.75, 180] as const;
const KEY_LIGHT_DAY_COLOR = [1, 0.92, 0.84] as const;
const KEY_LIGHT_NIGHT_COLOR = [1, 0.84, 0.72] as const;
const KEY_LIGHT_INTENSITY = 1.5;
const ENV_KEY_LIGHT_DAY_INTENSITY = 0.9;
const ENV_KEY_LIGHT_NIGHT_INTENSITY = 0.82;
const FILL_LIGHT_POSITION = [0.11058, 4.56518, -0.87433] as const;
const FILL_LIGHT_EULER = [51.9718, 0, 0] as const;
const FILL_LIGHT_DAY_COLOR = [0.92, 0.86, 0.78] as const;
const FILL_LIGHT_NIGHT_COLOR = [0.84, 0.74, 0.64] as const;
const FILL_LIGHT_INTENSITY = 1.8;
const ENV_FILL_LIGHT_DAY_INTENSITY = 1.05;
const ENV_FILL_LIGHT_NIGHT_INTENSITY = 0.95;
const FILL_LIGHT_RANGE = 12;
const INTERIOR_LIGHT_COLOR = [1, 0.95, 0.88] as const;
const INTERIOR_LIGHT_INTENSITY = 2.4;
const DAY_INTERIOR_LIGHT_COLOR = [1, 0.94, 0.88] as const;
const DAY_INTERIOR_LIGHT_INTENSITY = 2.7;
const CEILING_FLOOD_LIGHT_DAY_COLOR = [1, 0.98, 0.94] as const;
const CEILING_FLOOD_LIGHT_NIGHT_COLOR = [1, 0.9, 0.78] as const;
const CEILING_FLOOD_LIGHT_DAY_INTENSITY = 1.8;
const CEILING_FLOOD_LIGHT_NIGHT_INTENSITY = 2.1;
const ROOF_DOWNLIGHT_DAY_COLOR = [1, 0.985, 0.95] as const;
const ROOF_DOWNLIGHT_NIGHT_COLOR = [1, 0.86, 0.7] as const;
const ROOF_DOWNLIGHT_DAY_INTENSITY = 1.65;
const ROOF_DOWNLIGHT_NIGHT_INTENSITY = 1.9;
const WALL_FILL_LIGHT_DAY_COLOR = [1, 0.97, 0.93] as const;
const WALL_FILL_LIGHT_NIGHT_COLOR = [1, 0.88, 0.74] as const;
const WALL_FILL_LIGHT_DAY_INTENSITY = 1.5;
const WALL_FILL_LIGHT_NIGHT_INTENSITY = 1.35;
const ROOM_WASH_LIGHT_DAY_COLOR = [1, 0.93, 0.86] as const;
const ROOM_WASH_LIGHT_NIGHT_COLOR = [1, 0.84, 0.72] as const;
const ROOM_WASH_LIGHT_DAY_INTENSITY = 1.1;
const ROOM_WASH_LIGHT_NIGHT_INTENSITY = 0.95;
const ROOM_WASH_LIGHT_EULERS = [
  [58, -32, 0],
  [58, 32, 0],
] as const;
const CENTER_WASH_LIGHT_DAY_COLOR = [1, 0.94, 0.88] as const;
const CENTER_WASH_LIGHT_NIGHT_COLOR = [1, 0.86, 0.76] as const;
const CENTER_WASH_LIGHT_DAY_INTENSITY = 1.8;
const CENTER_WASH_LIGHT_NIGHT_INTENSITY = 1.6;
const LOCALIZED_ROOM_LIGHT_MULTIPLIER = 0.42;
const DAY_INTERIOR_BOUNCE_LIGHT_COLOR = [0.99, 0.94, 0.88] as const;
const DAY_INTERIOR_BOUNCE_LIGHT_INTENSITY = 2.1;
const DAY_SUN_LIGHT_COLOR = [1, 0.94, 0.86] as const;
const DAY_SUN_LIGHT_EULER = [48, 32, 0] as const;
const DAY_SUN_LIGHT_INTENSITY = 1.6;
const DAY_SKY_LIGHT_COLOR = [0.8, 0.83, 0.87] as const;
const DAY_SKY_LIGHT_EULER = [26, 142, 0] as const;
const DAY_SKY_LIGHT_INTENSITY = 0.72;
const DAY_FLOOD_LIGHT_COLOR = [1, 0.98, 0.95] as const;
const DAY_FLOOD_LIGHT_INTENSITY = 2.85;
const DAY_FILL_FLOOD_LIGHT_COLOR = [0.95, 0.91, 0.85] as const;
const DAY_FILL_FLOOD_LIGHT_INTENSITY = 2.1;
const DAY_ROOF_FLOOD_LIGHT_COLOR = [0.98, 0.95, 0.9] as const;
const DAY_ROOF_FLOOD_LIGHT_INTENSITY = 2.1;
const DAY_BACKDROP_SHELL_SCALE_MULTIPLIER = 7.5;
const DAY_BACKDROP_EMISSIVE_COLOR = [1, 1, 1] as const;
const DAY_BACKDROP_EMISSIVE_INTENSITY = 0.58;
const NIGHT_BACKDROP_EMISSIVE_COLOR = [0.78, 0.68, 0.56] as const;
const NIGHT_BACKDROP_EMISSIVE_INTENSITY = 0.4;
const BACKDROP_TEXTURE_ANISOTROPY = 16;
const ENVIRONMENT_GLASS_OPACITY = 0.04;
const DAYLIGHT_START_HOUR = 7;
const NIGHTLIGHT_START_HOUR = 19;
const FLOOR_SCALE = [8, 1, 8] as const;
const VIEWPORT_GIZMO_STEP_CONFIG: Record<ViewportGizmoStepId, { move: number; rotate: number; scale: number }> = {
  fine: { move: 0.05, rotate: 1, scale: 0.01 },
  medium: { move: 0.1, rotate: 5, scale: 0.05 },
  coarse: { move: 0.25, rotate: 15, scale: 0.1 },
};
const VIEWPORT_GIZMO_TARGET_LABELS: Record<ViewportGizmoTarget, string> = {
  avatar: "Avatar",
  environment: "Environment",
  camera: "Camera",
};
const VIEWPORT_GIZMO_MODE_LABELS: Record<ViewportGizmoMode, string> = {
  move: "Move",
  rotate: "Rotate",
  scale: "Scale",
};
const VIEWPORT_GIZMO_STEP_LABELS: Record<ViewportGizmoStepId, string> = {
  fine: "Fine",
  medium: "Medium",
  coarse: "Coarse",
};
const DEFAULT_ENVIRONMENT_TUNING: EnvironmentTransformTuning = {
  offset: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};
const DEFAULT_CAMERA_STAGE_TUNING: CameraStageTuning = {
  positionOffset: [0, 0, 0],
  targetOffset: [0, 0, 0],
};
const BODY_SKIN_MATERIALS = new Set([
  "Torso",
  "Face",
  "Lips",
  "Ears",
  "Legs",
  "Arms",
  "Fingernails",
  "Toenails",
  "Genitalia",
]);
const BODY_VISIBLE_TINT = { r: 0.7, g: 0.59, b: 0.53 };
const AVATAR_LIGHT_WASHOUT_GUARD = 0.86;
const NIGHT_MODE_LIGHT_LEVEL = 10;
const SENSITIVE_FACE_MATERIAL_NAME_PATTERN = /eye|cornea|moisture|iris|sclera|pupil|socket|lash|brow/i;

const MATERIAL_PROFILE_BY_USAGE = {
  body: {
    glossCap: 0.01,
    shininessCap: 5,
    specularityCap: 0.02,
    specularColor: 0.02,
    allowNormalMap: false,
  },
  clothing: {
    glossCap: 0.035,
    shininessCap: 18,
    specularityCap: 0.05,
    specularColor: 0.045,
    allowNormalMap: true,
  },
  accessory: {
    glossCap: 0.05,
    shininessCap: 22,
    specularityCap: 0.055,
    specularColor: 0.05,
    allowNormalMap: true,
  },
  hair: {
    glossCap: 0.04,
    shininessCap: 14,
    specularityCap: 0.03,
    specularColor: 0.03,
    allowNormalMap: true,
  },
} as const;

const state = {
  status: "Loading scene...",
  sceneReady: false,
  conversationPending: false,
  conversationSessionId: undefined as string | undefined,
  cameraStream: undefined as MediaStream | undefined,
  activeAvatarSystem: "unknown",
  activeAssetRoot: "gail",
  displayInputMode: "wake_word" as "wake_word" | "always_listening" | "typed",
  bodyMorphsEnabledDuringMotion: true,
  bodyMorphOverrides: {} as Record<string, number>,
  voiceMode: "wake_word" as "push_to_talk" | "wake_word" | "always_listening" | "typed",
  silenceTimeoutMs: 6000,
  wakeWord: "hey gail",
  autoResumeAfterResponse: true,
  preferredTtsEngine: "openai-gpt-4o-mini-tts",
  fallbackTtsEngine: "browser-speech-synthesis",
  openAiVoice: "nova",
  openAiInstructions: DEFAULT_OPENAI_INSTRUCTIONS,
  preferLocalVoice: false,
  browserVoiceName: DEFAULT_BROWSER_VOICE,
  avatarVoiceProfiles: {} as Record<string, { openAiVoice?: string; openAiInstructions?: string; browserVoiceName?: string }>,
  speechRate: 1.05,
  speechPitch: 1.05,
  lightLevel: 27,
  controlsHidden: true,
  selectedDeviceId: "unknown",
  selectedDeviceLabel: "unknown",
  selectedSceneId: "none",
  selectedDeviceAspectRatio: "unknown",
  selectedDeviceMeshSummary: "unknown",
  selectedAvatarPosition: [...STAGE_AVATAR_POSITION] as Vector3Tuple,
  selectedAvatarRotation: [...STAGE_AVATAR_ROTATION] as Vector3Tuple,
  selectedAvatarScale: [...STAGE_AVATAR_SCALE] as Vector3Tuple,
  selectedCameraPosition: [...STAGE_CAMERA_POSITION] as Vector3Tuple,
  selectedCameraTarget: [...STAGE_CAMERA_TARGET] as Vector3Tuple,
  viewportGizmoTarget: "avatar" as ViewportGizmoTarget,
  viewportGizmoMode: "move" as ViewportGizmoMode,
  viewportGizmoStep: "medium" as ViewportGizmoStepId,
  environmentTuningSummary: "no environment loaded",
  providerSummary: "loading",
  localModel: "dolphin-mistral:7b",
  localTimeoutMs: 120000,
  activePrivatePersona: "normal",
  avatarMotionSummary: "loading",
};

type StageRuntime = {
  pc: any;
  app: any;
  camera: any;
  canvas: HTMLCanvasElement;
  align: { x: number; y: number; z: number };
  environmentProfileId?: string;
  environmentStorageScope?: string;
  environmentEntity?: any;
  environmentBounds?: StageBounds;
  environmentBasePosition?: Vector3Tuple;
  environmentTuning?: EnvironmentTransformTuning;
  keyLight?: any;
  fillLight?: any;
  interiorLight?: any;
  ceilingFloodLight?: any;
  roofDownFloodLights?: any[];
  wallFillLights?: any[];
  roomWashLights?: any[];
  centerWashLights?: any[];
  cornerFillLights?: any[];
  dayInteriorBounceLight?: any;
  daySunLight?: any;
  daySkyLight?: any;
  dayFloodLight?: any;
  dayFillFloodLight?: any;
  dayRoofFloodLight?: any;
  dayBackdropShell?: any;
  lightingMode?: TimeOfDayLightingMode;
  avatarRoot?: any;
  avatarBasePosition?: Vector3Tuple;
  avatarBaseRotation?: Vector3Tuple;
  avatarBaseScale?: Vector3Tuple;
  avatarTuning?: EnvironmentTransformTuning;
  cameraBasePosition?: Vector3Tuple;
  cameraBaseTarget?: Vector3Tuple;
  cameraTuning?: CameraStageTuning;
  mechanics?: AvatarMechanicsController;
  garmentEntities?: Array<{ entity: any; kind: string; id?: string; slot?: string; name?: string }>;
  bodyMorphTargets?: BodyMorphTarget[];
  bodyMorphKeys?: string[];
  bodyEntity?: any;
  animComponent?: any;
  animationAssigned?: Record<AvatarAnimationState, boolean>;
  animationTracks?: Partial<Record<AvatarAnimationState, any>>;
};

let stageRuntime: StageRuntime | undefined;
let voiceSettingsSyncHandle: number | undefined;
let timeOfDayLightingSyncHandle: number | undefined;
let viewportGizmoRepeatHandle: number | undefined;
let viewportGizmoRepeatDelayHandle: number | undefined;
let speechEndedAt = 0;
let gailSpeechActive = false;
let activeSpeechState: WorkLiteSpeechState | undefined;
let thinkingFillerTimerHandle: number | undefined;
let thinkingFillerActive = false;
let lastThinkingFiller = "";
let lastWakeWordAcknowledgement = "";
let lastAmbientAcceptedTranscript = "";
let lastAmbientAcceptedAt = 0;

function isBrowserSpeechBusy(): boolean {
  return "speechSynthesis" in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending);
}

function isWorkLiteSpeechBusy(speechState?: WorkLiteSpeechState): boolean {
  if (!speechState) {
    return false;
  }
  return Boolean(
    speechState.audio
    || speechState.utterance
    || speechState.audioQueue.length > 0
    || speechState.browserQueue.length > 0
    || speechState.speaking
  );
}

function markGailOutputStarted(): void {
  gailSpeechActive = true;
}

function markGailOutputEndedIfIdle(speechState?: WorkLiteSpeechState): void {
  speechEndedAt = performance.now();
  const activeState = speechState ?? activeSpeechState;
  if (!isBrowserSpeechBusy() && !isWorkLiteSpeechBusy(activeState)) {
    gailSpeechActive = false;
  }
}

// â”€â”€ Persona â†’ avatar mapping â”€â”€
const PERSONA_AVATAR_MAP: Record<string, { bodyAssetId: string; displayPrefix: string; presetId?: string; label?: string }> = {
  normal:              { bodyAssetId: "base_avatar",            displayPrefix: "" },
  private_counselor:   { bodyAssetId: "private_base_avatar",    displayPrefix: "private_" },
  private_girlfriend:  { bodyAssetId: "girlfriend_base_avatar", displayPrefix: "girlfriend_" },
};
const PERSONA_LABELS: Record<string, string> = {
  normal: "Normal (Gail)",
  private_counselor: "Vera",
  private_girlfriend: "Cherry",
};
const PERSONA_PRESET_MAP: Record<string, string> = {
  normal: "gail_workwear",
  private_counselor: "vera_counselor",
  private_girlfriend: "cherry_girlfriend",
};
const DANCE_START_COMMAND = /\b(cherry.*danc(?:e|ing)|danc(?:e|ing).*cherry|gail.*let'?s?\s*danc(?:e|ing)|let'?s?\s*danc(?:e|ing)\s*gail|let'?s?\s*danc(?:e|ing)|dance for me|do a dance|start danc(?:e|ing))\b/;
const DANCE_STOP_COMMAND = /\b(stop danc(?:e|ing)|done danc(?:e|ing)|stop the dance|enough danc(?:e|ing))\b/;
const DANCE_NEXT_COMMAND = /\b(next dance|do another|another dance|another one|next one|switch dance|change dance)\b/i;
const DANCE_PREV_COMMAND = /\b(last dance|previous dance|go back(?: a dance)?|back(?: a dance)?|prior dance)\b/i;
const DANCE_DELETE_COMMAND = /\b(delete this dance|remove this dance|skip this dance|ditch this dance|drop this dance|get rid of this dance|forget this dance|forget that dance|forget a dance)\b/i;
const DANCE_RESTORE_COMMAND = /\b(restore (?:all )?dances|reset (?:all )?dances|bring back (?:all )?dances)\b/i;

const _savedDanceBlacklist: string[] = (() => {
  try { return JSON.parse(localStorage.getItem("dance_blacklist") || "[]") as string[]; } catch { return []; }
})();
let danceBlacklist = new Set<string>(_savedDanceBlacklist);

function saveDanceBlacklist(): void {
  try { localStorage.setItem("dance_blacklist", JSON.stringify([...danceBlacklist])); } catch { /* storage unavailable */ }
}

// â”€â”€ Inactivity auto-revert â”€â”€
const INACTIVITY_REVERT_MS = 5 * 60 * 1000; // 5 minutes
let inactivityTimerHandle: number | undefined;
let personaSwitchInProgress = false;

// â”€â”€ Vision frame cache â€” background capture every 10s â”€â”€
const FRAME_CAPTURE_INTERVAL_MS = 10_000;
let cachedFrameBase64: string | undefined;
let cachedFrameTimestamp = 0;
let frameCaptureTimer: number | undefined;
let frameLocked = false; // true while vision analysis is in-flight

const voiceRuntime: WorkLiteVoiceRuntime = {
  supported: Boolean(getSpeechRecognitionConstructor()),
  active: false,
  recognition: undefined,
  conversationBuffer: "",
  lastCommittedResultIndex: 0,
  silenceTimer: undefined,
  lastTranscript: "",
  lastError: undefined,
  retryBlocked: false,
  awaitingAssistant: false,
  followUpListening: false,
  followUpTimer: undefined,
  followUpTimeoutMs: undefined,
};

void boot().catch((error) => {
  console.error("work-lite rebuild boot failed", error);
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) {
    return;
  }
  root.innerHTML = `<div class="boot-error"><h1>Client Boot Error</h1><pre>${escapeHtml(String(error instanceof Error ? `${error.message}\n\n${error.stack ?? ""}` : error))}</pre></div>`;
});

async function boot(): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) {
    throw new Error("Missing #app root.");
  }

  await initializePersonaOnLoad();
  await loadVoiceSettings();
  root.innerHTML = render();
  wireUi(root);
  window.addEventListener("message", handleShellMorphMessage as EventListener);
  startVoiceSettingsSync();
  syncVoiceRuntimeUi();
  void ensureWorkLiteVoiceLoopState("boot");
  await bootStage(root);

  // Apply saved (or built-in default) placement for the initial persona
  const initialRuntime = stageRuntime as StageRuntime | undefined;
  if (initialRuntime) {
    const initialPlacement = loadPersonaPlacement(state.activePrivatePersona)
      ?? PERSONA_STAGE_PLACEMENT[state.activePrivatePersona]
      ?? PERSONA_STAGE_PLACEMENT["normal"];
    if (initialPlacement) {
      applyPersonaPlacementToRuntime(initialRuntime, initialPlacement);
    }
  }
}

function handleShellMorphMessage(event: MessageEvent): void {
  if (!event.data || typeof event.data !== "object") {
    return;
  }
  const payload = event.data as {
    type?: string;
    enabledDuringMotion?: unknown;
    overrides?: unknown;
  };
  if (!payload.type) {
    return;
  }

  if (payload.type === "gail:morph:request-body-catalog") {
    const allKeys = stageRuntime?.bodyMorphKeys ?? [];
    // Include which keys matched breast detection so the shell can show them separately.
    const breastKeys = allKeys.filter((k) =>
      /breast|chest|boob|bust|pJCMBreast|MHBreast|dForceBreast|BreastPhysics|BreastDynamic|BreastNatural/i.test(k)
    );
    console.log("[morph-catalog] catalog requested. All body keys:", allKeys, "Breast keys:", breastKeys);
    const response = {
      type: "gail:morph:body-catalog",
      keys: allKeys,
      breastKeys,
      enabledDuringMotion: state.bodyMorphsEnabledDuringMotion,
      overrides: { ...state.bodyMorphOverrides },
    };
    const source = event.source as Window | null;
    source?.postMessage(response, "*");
    return;
  }

  if (payload.type === "gail:morph:set-body-overrides") {
    if (typeof payload.enabledDuringMotion === "boolean") {
      state.bodyMorphsEnabledDuringMotion = payload.enabledDuringMotion;
    }
    state.bodyMorphOverrides = normalizeBodyMorphOverrides(payload.overrides);
    syncShellStatePanel();
  }
}

async function initializePersonaOnLoad(): Promise<void> {
  if (!ALLOW_PERSISTED_PRIVATE_PERSONA) {
    await ensureNormalPersonaOnLoad();
    return;
  }

  try {
    const localLlmConfig = await fetchJson<LocalLlmConfigResponse>("/providers/local-llm-config");
    const incomingPersona = localLlmConfig.activePrivatePersona?.trim() || "normal";
    state.activePrivatePersona = incomingPersona;
    state.conversationSessionId = undefined;
    state.localModel = localLlmConfig.effectiveModel?.trim() || localLlmConfig.model?.trim() || state.localModel || "dolphin-mistral:7b";
    state.localTimeoutMs = localLlmConfig.timeoutMs ?? state.localTimeoutMs ?? 120000;
    console.info(`[persona] Honoring persisted startup persona: ${incomingPersona}`);
  } catch (err) {
    console.warn("[persona] Failed to load persisted startup persona; falling back to normal mode.", err);
    await ensureNormalPersonaOnLoad();
  }
}

function render(): string {
  return `
    <div class="worklite-shell">
      <header class="worklite-header card">
        <div>
          <div class="eyebrow">GAIL</div>
          <h1>Work-Lite Client</h1>
          <p>Zip-based rebuild using the avatar_stage scene as the stage baseline.</p>
          <div id="voice-follow-note" class="voice-follow-note">${escapeHtml(formatVoiceFollowNote())}</div>
        </div>
        <div class="header-actions">
          <label class="voice-toggle-chip" for="local-voice-toggle">
            <span>Local Voice</span>
            <input id="local-voice-toggle" type="checkbox"${state.preferLocalVoice ? " checked" : ""} />
            <strong id="local-voice-toggle-state">${state.preferLocalVoice ? "On" : "Off"}</strong>
          </label>
          <button id="voice-loop-restart" type="button" class="secondary">Restart Voice</button>
          <button id="controls-toggle" type="button" class="secondary">Hide Controls</button>
          <button id="camera-toggle" type="button" class="secondary">Camera</button>
          <button id="fullscreen-toggle" type="button" class="secondary">Fullscreen</button>
          <div class="status-pill">${escapeHtml(state.status)}</div>
        </div>
      </header>
      <section class="card voice-config-bar">
        <div class="voice-config-row">
          <label for="voice-select">Voice</label>
          <select id="voice-select"></select>
          <button id="voice-test" type="button" class="secondary">Test</button>
        </div>
        <div class="voice-config-row">
          <label for="voice-rate">Speed <strong id="voice-rate-label">${state.speechRate.toFixed(2)}</strong></label>
          <input id="voice-rate" type="range" min="0.5" max="2" step="0.05" value="${state.speechRate}" />
          <label for="voice-pitch">Pitch <strong id="voice-pitch-label">${state.speechPitch.toFixed(2)}</strong></label>
          <input id="voice-pitch" type="range" min="0.5" max="2" step="0.05" value="${state.speechPitch}" />
        </div>
        <div class="voice-config-row">
          <label for="light-level">Light Level <strong id="light-level-label">${Math.round(state.lightLevel)}%</strong></label>
          <input id="light-level" type="range" min="0" max="100" step="1" value="${Math.round(state.lightLevel)}" />
        </div>
      </section>
      <div class="worklite-grid">
        <section class="stage-column card">
          <div class="panel-head">
            <div>
              <div class="eyebrow">Avatar Stage</div>
              <h2>Live Stage</h2>
            </div>
            <div class="stage-tools">
              <button id="run-motion-test" type="button" class="secondary">Run Motion Test</button>
            </div>
          </div>
          <div class="stage-shell">
            <div id="persona-badge" class="persona-badge">${escapeHtml(getPersonaBadgeText())}</div>
            <canvas id="stage-canvas" class="stage-canvas"></canvas>
            <div id="viewport-gizmo-overlay" class="viewport-gizmo-overlay">
              ${renderViewportGizmoOverlay()}
            </div>
            <div id="avatar-motion-overlay" class="avatar-motion-overlay">${escapeHtml(state.avatarMotionSummary)}</div>
            <div id="stage-loading" class="stage-loading${state.sceneReady ? " hidden" : ""}">
              <div class="stage-loading-label">${escapeHtml(state.status)}</div>
            </div>
          </div>
          <div id="stage-status" class="stage-status">${escapeHtml(state.status)}</div>
        </section>
        <div id="fs-overlay" class="fs-overlay hidden">
          <div id="fs-status-bar" class="fs-status-bar">
            <div class="fs-status-left">
              <span class="fs-brand">GAIL</span>
              <span id="fs-status-text" class="fs-status-text">${escapeHtml(state.status)}</span>
            </div>
            <div class="fs-status-right">
              <span id="fs-provider-status" class="fs-pill">${escapeHtml(state.providerSummary)}</span>
              <span id="fs-voice-mode" class="fs-pill">${escapeHtml(state.voiceMode)}</span>
              <span id="fs-voice-name" class="fs-pill fs-voice-name">${escapeHtml(state.browserVoiceName)}</span>
              <button id="fs-exit" type="button" class="secondary fs-exit-btn">Exit Fullscreen</button>
            </div>
          </div>
          <div id="fs-chat-panel" class="fs-chat-panel card">
            <div id="fs-chat-log" class="fs-chat-log"></div>
            <form id="fs-chat-form" class="chat-form">
              <textarea id="fs-chat-input" rows="3" placeholder="Talk to Gail..."></textarea>
              <div class="chat-actions">
                <button id="fs-chat-send" type="submit">Send</button>
              </div>
            </form>
          </div>
          <div id="fs-camera-pip" class="fs-camera-pip">
            <video id="fs-camera-video" autoplay playsinline muted></video>
          </div>
        </div>
        <aside class="side-column">
          <section class="card panel-block">
            <div class="panel-head">
              <div>
                <div class="eyebrow">Persona</div>
                <h2 id="persona-label">${escapeHtml(PERSONA_LABELS[state.activePrivatePersona ?? "normal"] ?? "Normal (Gail)")}</h2>
              </div>
            </div>
            <div class="persona-selector" style="padding:0.5rem;">
              <select id="persona-select" style="width:100%;padding:0.4rem;font-size:0.95rem;">
                ${Object.entries(PERSONA_LABELS).map(([k, v]) => `<option value="${k}"${k === (state.activePrivatePersona ?? "normal") ? " selected" : ""}>${escapeHtml(v)}</option>`).join("")}
              </select>
            </div>
          </section>
          <section class="card panel-block">
            <div class="panel-head">
              <div>
                <div class="eyebrow">Shell State</div>
                <h2>Preview Sync</h2>
              </div>
            </div>
            <div id="shell-state-panel" class="shell-state-panel">
              ${renderShellStateItems()}
            </div>
          </section>
          <section class="card panel-block">
            <div class="panel-head">
              <div>
                <div class="eyebrow">Stage Tune</div>
                <h2>Environment</h2>
              </div>
            </div>
            <div id="environment-tuning-panel">
              ${renderEnvironmentTuningPanel()}
            </div>
          </section>
          <section class="card panel-block">
            <div class="panel-head">
              <div>
                <div class="eyebrow">Chat</div>
                <h2>Conversation</h2>
              </div>
            </div>
            <div id="voice-runtime-note" class="voice-follow-note">${escapeHtml(formatVoiceRuntimeNote())}</div>
            <div id="chat-log" class="chat-log"></div>
            <form id="chat-form" class="chat-form">
              <textarea id="chat-input" rows="5" placeholder="Type a message for Gail."></textarea>
              <div class="chat-actions">
                <button id="chat-send" type="submit">Send</button>
                <button id="chat-new-session" type="button" class="secondary">New Session</button>
              </div>
            </form>
          </section>
          <section class="card panel-block">
            <div class="panel-head">
              <div>
                <div class="eyebrow">Camera</div>
                <h2>Preview</h2>
              </div>
            </div>
            <video id="camera-preview" class="camera-preview" autoplay playsinline muted></video>
            <div class="chat-actions">
              <button id="vision-look" type="button">What Do You See?</button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  `;
}

function wireUi(root: HTMLElement): void {
  const chatForm = root.querySelector<HTMLFormElement>("#chat-form");
  const chatInput = root.querySelector<HTMLTextAreaElement>("#chat-input");
  const newSessionButton = root.querySelector<HTMLButtonElement>("#chat-new-session");
  const visionLookButton = root.querySelector<HTMLButtonElement>("#vision-look");
  const cameraPreview = root.querySelector<HTMLVideoElement>("#camera-preview");
  const localVoiceToggle = root.querySelector<HTMLInputElement>("#local-voice-toggle");
  const voiceLoopRestartButton = root.querySelector<HTMLButtonElement>("#voice-loop-restart");
  const runMotionTestButton = root.querySelector<HTMLButtonElement>("#run-motion-test");
  const voiceSelect = root.querySelector<HTMLSelectElement>("#voice-select");
  const voiceRateSlider = root.querySelector<HTMLInputElement>("#voice-rate");
  const voicePitchSlider = root.querySelector<HTMLInputElement>("#voice-pitch");
  const lightLevelSlider = root.querySelector<HTMLInputElement>("#light-level");
  const voiceTestButton = root.querySelector<HTMLButtonElement>("#voice-test");
  const controlsToggleButton = root.querySelector<HTMLButtonElement>("#controls-toggle");
  const fullscreenToggle = root.querySelector<HTMLButtonElement>("#fullscreen-toggle");
  const fsExitButton = root.querySelector<HTMLButtonElement>("#fs-exit");
  const fsOverlay = root.querySelector<HTMLElement>("#fs-overlay");
  const fsChatForm = root.querySelector<HTMLFormElement>("#fs-chat-form");
  const fsChatInput = root.querySelector<HTMLTextAreaElement>("#fs-chat-input");
  const fsChatLog = root.querySelector<HTMLElement>("#fs-chat-log");
  const fsCameraVideo = root.querySelector<HTMLVideoElement>("#fs-camera-video");
  const personaSelect = root.querySelector<HTMLSelectElement>("#persona-select");
  const environmentTuningPanel = root.querySelector<HTMLElement>("#environment-tuning-panel");
  const viewportGizmoOverlay = root.querySelector<HTMLElement>("#viewport-gizmo-overlay");

  const syncControlsVisibility = (): void => {
    const voiceConfigBar = root.querySelector<HTMLElement>(".voice-config-bar");
    const environmentTuningCard = environmentTuningPanel?.closest<HTMLElement>("section.card.panel-block");
    const shouldHide = state.controlsHidden;
    voiceConfigBar?.classList.toggle("hidden", shouldHide);
    viewportGizmoOverlay?.classList.toggle("hidden", shouldHide);
    environmentTuningCard?.classList.toggle("hidden", shouldHide);
    if (controlsToggleButton) {
      controlsToggleButton.textContent = shouldHide ? "Show Controls" : "Hide Controls";
    }
  };

  // â”€â”€ Persona selector â”€â”€
  personaSelect?.addEventListener("change", () => {
    const newPersona = personaSelect.value;
    if (newPersona && newPersona !== state.activePrivatePersona) {
      void switchToPersona(newPersona);
    }
  });

  chatForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.conversationPending || !chatInput) {
      return;
    }
    const message = chatInput.value.trim();
    if (!message) {
      return;
    }
    chatInput.value = "";
    bumpInactivityTimer();
    await sendWorkLiteMessage(message, "typed");
  });

  newSessionButton?.addEventListener("click", () => {
    stageRuntime?.mechanics?.stopSpeech();
    state.conversationSessionId = undefined;
    const log = root.querySelector<HTMLElement>("#chat-log");
    if (log) {
      log.innerHTML = "";
    }
    console.log("[system] Started a new conversation session.");
  });

  visionLookButton?.addEventListener("click", () => {
    void captureAndAnalyzeFrame();
  });

  runMotionTestButton?.addEventListener("click", () => {
    stageRuntime?.mechanics?.runMotionTest();
    console.log("[system] Running avatar motion test.");
  });

  voiceLoopRestartButton?.addEventListener("click", () => {
    voiceRuntime.retryBlocked = false;
    voiceRuntime.lastError = undefined;
    stopWorkLiteVoiceLoop();
    void ensureWorkLiteVoiceLoopState("manual restart");
  });

  const cameraToggleButton = root.querySelector<HTMLButtonElement>("#camera-toggle");
  cameraToggleButton?.addEventListener("click", async () => {
    if (state.cameraStream) {
      console.log("[camera] Stopping camera and frame capture loop.");
      stopFrameCaptureLoop();
      for (const track of state.cameraStream.getTracks()) { track.stop(); }
      state.cameraStream = undefined;
      if (cameraPreview) { cameraPreview.srcObject = null; }
      if (fsCameraVideo) { fsCameraVideo.srcObject = null; }
      cameraToggleButton.textContent = "Camera";
      console.log("[camera] Camera stopped. Cached frame cleared.");
    } else {
      try {
        console.log("[camera] Requesting camera access...");
        state.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (cameraPreview) { cameraPreview.srcObject = state.cameraStream; }
        if (fsCameraVideo) { fsCameraVideo.srcObject = state.cameraStream; }
        cameraToggleButton.textContent = "Camera Off";
        console.log("[camera] Camera started. Starting background frame capture.");
        // Small delay to let the video element settle before first grab
        window.setTimeout(() => startFrameCaptureLoop(), 500);
      } catch (err) {
        console.warn("[camera] Failed to start camera:", err);
        speakQuickBrowserPhrase("Couldn't get camera access. Check your permissions.");
      }
    }
  });

  populateVoiceSelect(voiceSelect);
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      populateVoiceSelect(voiceSelect);
      // If mobile fullscreen mode, re-select Sonia after the list is rebuilt
      if (AUTO_FULLSCREEN && voiceSelect && voiceSelect.value !== DEFAULT_BROWSER_VOICE) {
        const sonia = Array.from(voiceSelect.options).find((o) => o.value === DEFAULT_BROWSER_VOICE);
        if (sonia) {
          voiceSelect.value = DEFAULT_BROWSER_VOICE;
          state.browserVoiceName = DEFAULT_BROWSER_VOICE;
        }
      }
    };
  }

  voiceSelect?.addEventListener("change", () => {
    state.browserVoiceName = voiceSelect.value;
    void updateVoiceSettings({ browserVoiceName: voiceSelect.value });
    syncShellStatePanel();
  });

  voiceRateSlider?.addEventListener("input", () => {
    state.speechRate = parseFloat(voiceRateSlider.value);
    const label = root.querySelector<HTMLElement>("#voice-rate-label");
    if (label) { label.textContent = state.speechRate.toFixed(2); }
  });

  voicePitchSlider?.addEventListener("input", () => {
    state.speechPitch = parseFloat(voicePitchSlider.value);
    const label = root.querySelector<HTMLElement>("#voice-pitch-label");
    if (label) { label.textContent = state.speechPitch.toFixed(2); }
  });

  lightLevelSlider?.addEventListener("input", () => {
    const parsedValue = parseFloat(lightLevelSlider.value);
    const nextLevel = Number.isFinite(parsedValue) ? Math.min(100, Math.max(0, parsedValue)) : 100;
    state.lightLevel = nextLevel;
    const label = root.querySelector<HTMLElement>("#light-level-label");
    if (label) {
      label.textContent = `${Math.round(nextLevel)}%`;
    }
    syncTimeOfDayLighting();
  });

  controlsToggleButton?.addEventListener("click", () => {
    state.controlsHidden = !state.controlsHidden;
    syncControlsVisibility();
  });

  syncControlsVisibility();

  voiceTestButton?.addEventListener("click", () => {
    speakQuickBrowserPhrase("This is how I sound with the current settings.");
  });

  localVoiceToggle?.addEventListener("change", async () => {
    localVoiceToggle.disabled = true;
    try {
      await updateVoiceSettings({
        preferLocalBrowserVoice: localVoiceToggle.checked,
        browserVoiceName: state.browserVoiceName || DEFAULT_BROWSER_VOICE,
      });
      syncVoiceToggleUi(localVoiceToggle.checked);
      console.log("[system]", localVoiceToggle.checked
        ? `Local voice enabled${state.browserVoiceName ? ` for ${state.browserVoiceName}` : ""}.`
        : "Local voice disabled. Cloud voice path remains available.");
    } catch (error) {
      localVoiceToggle.checked = state.preferLocalVoice;
      console.warn("[system] Voice toggle error:", error);
    } finally {
      localVoiceToggle.disabled = false;
    }
  });

  // â€” Fullscreen mode â€”
  const enterFullscreen = () => {
    root.classList.add("fs-active");
    fsOverlay?.classList.remove("hidden");
    // Mirror camera stream to PIP
    if (state.cameraStream && fsCameraVideo) {
      fsCameraVideo.srcObject = state.cameraStream;
    }
    syncFullscreenStatus();
    // Trigger canvas resize
    window.dispatchEvent(new Event("resize"));
  };

  const exitFullscreen = () => {
    root.classList.remove("fs-active");
    fsOverlay?.classList.add("hidden");
    if (fsCameraVideo) { fsCameraVideo.srcObject = null; }
    // Exit browser fullscreen if active
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    window.dispatchEvent(new Event("resize"));
  };

  fullscreenToggle?.addEventListener("click", () => {
    if (root.classList.contains("fs-active")) {
      exitFullscreen();
    } else {
      enterFullscreen();
      // Also request browser fullscreen (not available in all browsers/contexts)
      if (typeof document.documentElement.requestFullscreen === "function") {
        void document.documentElement.requestFullscreen().catch(() => undefined);
      }
    }
  });

  fsExitButton?.addEventListener("click", () => {
    exitFullscreen();
  });

  // Exit on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("fs-active")) {
      exitFullscreen();
    }
  });

  // Handle browser fullscreen exit (e.g. pressing Escape via browser)
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && root.classList.contains("fs-active")) {
      exitFullscreen();
    }
  });

  // Auto-enter fullscreen when ?fs=1 is set (e.g. /gail-mobile/ redirect)
  if (AUTO_FULLSCREEN) {
    root.classList.add("fs-mobile-layout");
    // Pin voice to Sonia immediately — voices may not be loaded yet so we set state
    // unconditionally; populateVoiceSelect (called on voiceschanged) will use state.browserVoiceName
    state.browserVoiceName = DEFAULT_BROWSER_VOICE;
    void updateVoiceSettings({
      browserVoiceName: DEFAULT_BROWSER_VOICE,
      preferLocalBrowserVoice: true,
    });
    enterFullscreen();
    if (typeof document.documentElement.requestFullscreen === "function") {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }

  // Fullscreen chat form
  fsChatForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.conversationPending || !fsChatInput) { return; }
    const message = fsChatInput.value.trim();
    if (!message) { return; }
    fsChatInput.value = "";
    await sendWorkLiteMessage(message, "typed");
  });

  environmentTuningPanel?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const action = target.closest<HTMLElement>("[data-stage-action]")?.dataset.stageAction;
    if (!action) {
      return;
    }
    if (action === "reset-selected") {
      resetSelectedViewportGizmoTarget(root);
      return;
    }
    if (action === "copy") {
      await copyStageTuning();
    }
  });

  viewportGizmoOverlay?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const targetButton = target.closest<HTMLElement>("[data-gizmo-target]");
    if (targetButton?.dataset.gizmoTarget) {
      state.viewportGizmoTarget = targetButton.dataset.gizmoTarget as ViewportGizmoTarget;
      if (state.viewportGizmoTarget === "camera") {
        state.viewportGizmoMode = "move";
      }
      syncViewportGizmoUi();
      return;
    }
    const modeButton = target.closest<HTMLElement>("[data-gizmo-mode]");
    if (modeButton?.dataset.gizmoMode) {
      state.viewportGizmoMode = modeButton.dataset.gizmoMode as ViewportGizmoMode;
      syncViewportGizmoUi();
      return;
    }
    const stepButton = target.closest<HTMLElement>("[data-gizmo-step]");
    if (stepButton?.dataset.gizmoStep) {
      state.viewportGizmoStep = stepButton.dataset.gizmoStep as ViewportGizmoStepId;
      syncViewportGizmoUi();
      return;
    }
    const action = target.closest<HTMLElement>("[data-gizmo-action]")?.dataset.gizmoAction;
    if (action === "reset-selected") {
      resetSelectedViewportGizmoTarget(root);
      return;
    }
    if (action === "copy") {
      await copyStageTuning();
    }
  });

  viewportGizmoOverlay?.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest<HTMLElement>("[data-gizmo-axis][data-gizmo-direction]");
    if (!button) {
      return;
    }
    const axis = button.dataset.gizmoAxis as "x" | "y" | "z" | undefined;
    const direction = button.dataset.gizmoDirection as "negative" | "positive" | undefined;
    if (!axis || !direction) {
      return;
    }
    event.preventDefault();
    nudgeViewportGizmo(axis, direction);
    stopViewportGizmoRepeat();
    viewportGizmoRepeatDelayHandle = window.setTimeout(() => {
      viewportGizmoRepeatHandle = window.setInterval(() => {
        nudgeViewportGizmo(axis, direction);
      }, 70);
    }, 250);
  });

  window.addEventListener("pointerup", stopViewportGizmoRepeat);
  viewportGizmoOverlay?.addEventListener("pointercancel", stopViewportGizmoRepeat);
  viewportGizmoOverlay?.addEventListener("pointerleave", stopViewportGizmoRepeat);
}

async function loadVoiceSettings(): Promise<void> {
  try {
    const settings = await fetchJson<VoiceSettingsResponse>("/voice/settings");
    applyVoiceSettingsState(settings);
  } catch {
    state.voiceMode = "wake_word";
    state.silenceTimeoutMs = 6000;
    state.wakeWord = "hey gail";
    state.openAiInstructions = DEFAULT_OPENAI_INSTRUCTIONS;
    state.preferLocalVoice = false;
    state.browserVoiceName = DEFAULT_BROWSER_VOICE;
  }
}

async function updateVoiceSettings(input: VoiceSettingsResponse): Promise<void> {
  const response = await fetch("/voice/settings", {
    method: "PATCH",
    headers: buildGailHeaders(true),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Voice settings update failed (${response.status}).`);
  }
  const settings = await response.json() as VoiceSettingsResponse;
  applyVoiceSettingsState(settings);
}

function syncVoiceToggleUi(enabled: boolean): void {
  state.preferLocalVoice = enabled;
  const toggle = document.querySelector<HTMLInputElement>("#local-voice-toggle");
  const label = document.querySelector<HTMLElement>("#local-voice-toggle-state");
  const note = document.querySelector<HTMLElement>("#voice-follow-note");
  if (toggle) {
    toggle.checked = enabled;
  }
  if (label) {
    label.textContent = enabled ? "On" : "Off";
  }
  if (note) {
    note.textContent = formatVoiceFollowNote();
  }
  syncShellStatePanel();
}

function applyVoiceSettingsState(settings: VoiceSettingsResponse): void {
  state.voiceMode = settings.mode ?? state.voiceMode ?? "wake_word";
  state.silenceTimeoutMs = settings.silenceTimeoutMs ?? state.silenceTimeoutMs ?? 4200;
  state.wakeWord = settings.wakeWord?.trim() || state.wakeWord || "hey gail";
  state.autoResumeAfterResponse = settings.autoResumeAfterResponse ?? state.autoResumeAfterResponse ?? true;
  state.preferredTtsEngine = settings.preferredTtsEngine ?? state.preferredTtsEngine ?? "openai-gpt-4o-mini-tts";
  state.fallbackTtsEngine = settings.fallbackTtsEngine ?? state.fallbackTtsEngine ?? "browser-speech-synthesis";
  state.openAiVoice = settings.openAiVoice?.trim() || state.openAiVoice || "nova";
  state.openAiInstructions = settings.openAiInstructions?.trim() || state.openAiInstructions || DEFAULT_OPENAI_INSTRUCTIONS;
  state.preferLocalVoice = settings.preferLocalBrowserVoice === true;
  state.browserVoiceName = settings.browserVoiceName?.trim() || state.browserVoiceName || DEFAULT_BROWSER_VOICE;
  state.avatarVoiceProfiles = settings.avatarVoiceProfiles ?? state.avatarVoiceProfiles ?? {};
  activeVoiceRuntimeConfig = normalizeVoiceRuntimeConfig(settings.runtime, DEFAULT_VOICE_RUNTIME_CONFIG);
  applyAvatarVoiceProfile(state.activePrivatePersona ?? "normal");
}

function applyAvatarVoiceProfile(persona: string): void {
  const presetId = PERSONA_PRESET_MAP[persona];
  if (!presetId) {
    return;
  }
  const profile = state.avatarVoiceProfiles?.[presetId];
  if (!profile) {
    return;
  }
  state.openAiVoice = profile.openAiVoice?.trim() || state.openAiVoice || "nova";
  state.openAiInstructions = profile.openAiInstructions?.trim() || state.openAiInstructions || DEFAULT_OPENAI_INSTRUCTIONS;
  if (profile.browserVoiceName !== undefined) {
    state.browserVoiceName = profile.browserVoiceName?.trim() || DEFAULT_BROWSER_VOICE;
  }
}

function renderShellStateItems(): string {
  const voiceModeText = state.voiceMode === "wake_word"
    ? `${state.voiceMode} | wake word ${state.wakeWord} | timeout ${state.silenceTimeoutMs}ms`
    : `${state.voiceMode} | timeout ${state.silenceTimeoutMs}ms`;
  const rows: Array<[string, string]> = [
    ["Avatar system", state.activeAvatarSystem],
    ["Asset root", state.activeAssetRoot],
    ["Display input", state.displayInputMode],
    ["Avatar motion", state.avatarMotionSummary],
    ["Voice mode", voiceModeText],
    ["Auto resume", String(state.autoResumeAfterResponse)],
    ["TTS", `${state.preferredTtsEngine} | fallback ${state.fallbackTtsEngine}`],
    ["OpenAI voice", state.openAiVoice],
    ["Voice style", state.openAiInstructions],
    ["Local voice", `${state.preferLocalVoice ? "on" : "off"} | ${state.browserVoiceName}`],
    ["Selected device", `${state.selectedDeviceLabel} (${state.selectedDeviceId}) | ${state.selectedDeviceAspectRatio}`],
    ["Scene", state.selectedSceneId],
    ["Mesh profile", state.selectedDeviceMeshSummary],
    ["Providers", state.providerSummary],
    ["Local model", `${state.localModel} | timeout ${state.localTimeoutMs}ms`],
    ["Private persona", state.activePrivatePersona],
    [
      "Body morphs",
      `${state.bodyMorphsEnabledDuringMotion ? "motion-only" : "always"} | ${Object.keys(state.bodyMorphOverrides).length} overrides`,
    ],
  ];
  return rows.map(([label, value]) => `
    <div class="shell-state-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");
}

function getViewportGizmoControlSet(): {
  modeLabel: string;
  x: { negative: string; positive: string; };
  y: { negative: string; positive: string; };
  z: { negative: string; positive: string; };
} {
  if (state.viewportGizmoTarget === "camera" && state.viewportGizmoMode === "rotate") {
    return {
      modeLabel: "Aim",
      x: { negative: "Aim Left", positive: "Aim Right" },
      y: { negative: "Aim Down", positive: "Aim Up" },
      z: { negative: "Aim Out", positive: "Aim In" },
    };
  }
  if (state.viewportGizmoMode === "rotate") {
    return {
      modeLabel: "Rotate",
      x: { negative: "Tilt Down", positive: "Tilt Up" },
      y: { negative: "Turn Left", positive: "Turn Right" },
      z: { negative: "Roll Left", positive: "Roll Right" },
    };
  }
  if (state.viewportGizmoMode === "scale") {
    return {
      modeLabel: "Scale",
      x: { negative: "Narrower", positive: "Wider" },
      y: { negative: "Shorter", positive: "Taller" },
      z: { negative: "Shallower", positive: "Deeper" },
    };
  }
  return {
    modeLabel: "Move",
    x: { negative: "Left", positive: "Right" },
    y: { negative: "Down", positive: "Up" },
    z: { negative: "Out", positive: "In" },
  };
}

function renderViewportGizmoOverlay(): string {
  const controls = getViewportGizmoControlSet();
  const currentModeLabel = state.viewportGizmoTarget === "camera" && state.viewportGizmoMode === "rotate"
    ? "Aim"
    : VIEWPORT_GIZMO_MODE_LABELS[state.viewportGizmoMode];
  return `
    <div class="viewport-gizmo-toolbar">
      <div class="viewport-gizmo-group">
        ${(["avatar", "environment", "camera"] as const).map((target) => `
          <button
            type="button"
            class="secondary${state.viewportGizmoTarget === target ? " is-active" : ""}"
            data-gizmo-target="${target}"
          >${escapeHtml(VIEWPORT_GIZMO_TARGET_LABELS[target])}</button>
        `).join("")}
      </div>
      <div class="viewport-gizmo-group">
        ${(["move", "rotate", "scale"] as const)
          .filter((mode) => !(state.viewportGizmoTarget === "camera" && mode === "scale"))
          .map((mode) => {
            const label = state.viewportGizmoTarget === "camera" && mode === "rotate" ? "Aim" : VIEWPORT_GIZMO_MODE_LABELS[mode];
            return `
              <button
                type="button"
                class="secondary${state.viewportGizmoMode === mode ? " is-active" : ""}"
                data-gizmo-mode="${mode}"
              >${escapeHtml(label)}</button>
            `;
          }).join("")}
      </div>
      <div class="viewport-gizmo-group">
        ${(["fine", "medium", "coarse"] as const).map((stepId) => `
          <button
            type="button"
            class="secondary${state.viewportGizmoStep === stepId ? " is-active" : ""}"
            data-gizmo-step="${stepId}"
          >${escapeHtml(VIEWPORT_GIZMO_STEP_LABELS[stepId])}</button>
        `).join("")}
      </div>
      <div class="viewport-gizmo-group">
        <button type="button" class="secondary" data-gizmo-action="reset-selected">Reset Selected</button>
        <button type="button" class="secondary" data-gizmo-action="copy">Copy Values</button>
      </div>
    </div>
    <div class="viewport-gizmo-dock">
      <div class="viewport-gizmo-anchor-label">
        ${escapeHtml(VIEWPORT_GIZMO_TARGET_LABELS[state.viewportGizmoTarget])} • ${escapeHtml(currentModeLabel)} • ${escapeHtml(VIEWPORT_GIZMO_STEP_LABELS[state.viewportGizmoStep])}
      </div>
      <div class="viewport-gizmo-pad">
        <div></div>
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="y" data-gizmo-direction="positive">${escapeHtml(controls.y.positive)}</button>
        <div></div>
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="x" data-gizmo-direction="negative">${escapeHtml(controls.x.negative)}</button>
        <div class="viewport-gizmo-center">${escapeHtml(controls.modeLabel)}</div>
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="x" data-gizmo-direction="positive">${escapeHtml(controls.x.positive)}</button>
        <div></div>
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="y" data-gizmo-direction="negative">${escapeHtml(controls.y.negative)}</button>
        <div></div>
      </div>
      <div class="viewport-gizmo-depth">
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="z" data-gizmo-direction="negative">${escapeHtml(controls.z.negative)}</button>
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="z" data-gizmo-direction="positive">${escapeHtml(controls.z.positive)}</button>
      </div>
    </div>
    <div id="viewport-gizmo-anchor" class="viewport-gizmo-anchor hidden">
      <div class="viewport-gizmo-anchor-label">
        ${escapeHtml(VIEWPORT_GIZMO_TARGET_LABELS[state.viewportGizmoTarget])} • ${escapeHtml(currentModeLabel)} • ${escapeHtml(VIEWPORT_GIZMO_STEP_LABELS[state.viewportGizmoStep])}
      </div>
      <div class="viewport-gizmo-pad">
        <div></div>
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="y" data-gizmo-direction="positive">${escapeHtml(controls.y.positive)}</button>
        <div></div>
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="x" data-gizmo-direction="negative">${escapeHtml(controls.x.negative)}</button>
        <div class="viewport-gizmo-center">${escapeHtml(controls.modeLabel)}</div>
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="x" data-gizmo-direction="positive">${escapeHtml(controls.x.positive)}</button>
        <div></div>
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="y" data-gizmo-direction="negative">${escapeHtml(controls.y.negative)}</button>
        <div></div>
      </div>
      <div class="viewport-gizmo-depth">
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="z" data-gizmo-direction="negative">${escapeHtml(controls.z.negative)}</button>
        <button type="button" class="secondary viewport-gizmo-button" data-gizmo-axis="z" data-gizmo-direction="positive">${escapeHtml(controls.z.positive)}</button>
      </div>
    </div>
  `;
}

function renderEnvironmentTuningPanel(): string {
  const sceneId = stageRuntime?.environmentProfileId ?? state.selectedSceneId;
  const modeLabel = state.viewportGizmoTarget === "camera" && state.viewportGizmoMode === "rotate"
    ? "Aim"
    : VIEWPORT_GIZMO_MODE_LABELS[state.viewportGizmoMode];
  return `
    <div class="env-tune-panel">
      <div class="env-tune-meta">
        <strong>Scene</strong>
        <span>${escapeHtml(sceneId || "none")}</span>
      </div>
      <div class="env-tune-section">
        <div class="env-tune-meta">
          <strong>Viewport Staging</strong>
          <span>${escapeHtml(`${VIEWPORT_GIZMO_TARGET_LABELS[state.viewportGizmoTarget]} • ${modeLabel} • ${VIEWPORT_GIZMO_STEP_LABELS[state.viewportGizmoStep]}`)}</span>
        </div>
        <div class="env-tune-note">Use the in-scene gizmo on the stage. The toolbar stays on the canvas and the controls stay attached to the selected target so you can place things while watching the result.</div>
        <div class="env-tune-actions">
          <button type="button" class="secondary" data-stage-action="reset-selected">Reset Selected</button>
          <button type="button" class="secondary" data-stage-action="copy">Copy Values</button>
        </div>
      </div>
    </div>
  `;
}

function syncShellStatePanel(): void {
  const panel = document.querySelector<HTMLElement>("#shell-state-panel");
  if (panel) {
    panel.innerHTML = renderShellStateItems();
  }
  syncFullscreenStatus();
}

function syncEnvironmentTuningPanel(): void {
  const panel = document.querySelector<HTMLElement>("#environment-tuning-panel");
  if (panel) {
    panel.innerHTML = renderEnvironmentTuningPanel();
  }
}

function syncViewportGizmoOverlay(): void {
  const overlay = document.querySelector<HTMLElement>("#viewport-gizmo-overlay");
  if (overlay) {
    overlay.innerHTML = renderViewportGizmoOverlay();
  }
}

function syncViewportGizmoUi(): void {
  syncEnvironmentTuningPanel();
  syncViewportGizmoOverlay();
}

function stopViewportGizmoRepeat(): void {
  if (viewportGizmoRepeatDelayHandle !== undefined) {
    window.clearTimeout(viewportGizmoRepeatDelayHandle);
    viewportGizmoRepeatDelayHandle = undefined;
  }
  if (viewportGizmoRepeatHandle !== undefined) {
    window.clearInterval(viewportGizmoRepeatHandle);
    viewportGizmoRepeatHandle = undefined;
  }
}

function getViewportGizmoFieldForCurrentSelection(): { scope: "environment" | "avatar" | "camera"; field: keyof EnvironmentTransformTuning | keyof CameraStageTuning; step: number } | undefined {
  if (state.viewportGizmoTarget === "camera") {
    if (state.viewportGizmoMode === "scale") {
      return undefined;
    }
    const cameraStep = state.viewportGizmoMode === "move"
      ? VIEWPORT_GIZMO_STEP_CONFIG[state.viewportGizmoStep].move
      : VIEWPORT_GIZMO_STEP_CONFIG[state.viewportGizmoStep].rotate;
    return {
      scope: "camera",
      field: state.viewportGizmoMode === "move" ? "positionOffset" : "targetOffset",
      step: cameraStep,
    };
  }
  return {
    scope: state.viewportGizmoTarget,
    field: state.viewportGizmoMode === "move" ? "offset" : state.viewportGizmoMode === "rotate" ? "rotation" : "scale",
    step: VIEWPORT_GIZMO_STEP_CONFIG[state.viewportGizmoStep][state.viewportGizmoMode],
  };
}

function normalizeVec3(value: Vector3Tuple): Vector3Tuple {
  const length = Math.hypot(value[0], value[1], value[2]);
  if (length < 1e-6) {
    return [0, 0, 0];
  }
  return [value[0] / length, value[1] / length, value[2] / length];
}

function crossVec3(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function rotateVec3AroundAxis(vec: Vector3Tuple, axis: Vector3Tuple, angleRad: number): Vector3Tuple {
  const normalizedAxis = normalizeVec3(axis);
  const ux = normalizedAxis[0];
  const uy = normalizedAxis[1];
  const uz = normalizedAxis[2];
  const cosTheta = Math.cos(angleRad);
  const sinTheta = Math.sin(angleRad);
  return [
    (cosTheta + (ux * ux * (1 - cosTheta))) * vec[0] + ((ux * uy * (1 - cosTheta)) - (uz * sinTheta)) * vec[1] + ((ux * uz * (1 - cosTheta)) + (uy * sinTheta)) * vec[2],
    ((uy * ux * (1 - cosTheta)) + (uz * sinTheta)) * vec[0] + (cosTheta + (uy * uy * (1 - cosTheta))) * vec[1] + ((uy * uz * (1 - cosTheta)) - (ux * sinTheta)) * vec[2],
    ((uz * ux * (1 - cosTheta)) - (uy * sinTheta)) * vec[0] + ((uz * uy * (1 - cosTheta)) + (ux * sinTheta)) * vec[1] + (cosTheta + (uz * uz * (1 - cosTheta))) * vec[2],
  ];
}

function nudgeViewportGizmo(axis: "x" | "y" | "z", direction: "negative" | "positive"): void {
  const config = getViewportGizmoFieldForCurrentSelection();
  if (!config || !stageRuntime?.environmentProfileId) {
    return;
  }
  const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2;
  const delta = config.step * (direction === "negative" ? -1 : 1);

  if (config.scope === "environment" && stageRuntime.environmentTuning) {
    const next = cloneEnvironmentTuning(stageRuntime.environmentTuning);
    next[config.field as keyof EnvironmentTransformTuning][axisIndex] += delta;
    if (config.field === "scale") {
      next.scale[axisIndex] = Math.max(0.05, next.scale[axisIndex]);
    }
    stageRuntime.environmentTuning = next;
    saveEnvironmentTuning(stageRuntime.environmentStorageScope ?? stageRuntime.environmentProfileId, next);
    applyEnvironmentTuning();
    return;
  }

  if (config.scope === "avatar" && stageRuntime.avatarTuning) {
    const next = cloneEnvironmentTuning(stageRuntime.avatarTuning);
    next[config.field as keyof EnvironmentTransformTuning][axisIndex] += delta;
    if (config.field === "scale") {
      next.scale[axisIndex] = Math.max(0.05, next.scale[axisIndex]);
    }
    stageRuntime.avatarTuning = next;
    saveAvatarTuning(stageRuntime.environmentStorageScope ?? stageRuntime.environmentProfileId, next);
    applyAvatarTuning();
    savePersonaPlacementFromRuntime();
    return;
  }

  if (config.scope === "camera" && stageRuntime.cameraTuning) {
    const next = cloneCameraStageTuning(stageRuntime.cameraTuning);
    if (config.field === "positionOffset") {
      // Linear camera move: keep view direction by translating position and target together.
      next.positionOffset[axisIndex] += delta;
      next.targetOffset[axisIndex] += delta;
    } else {
      // Aim: rotate the view around the current camera position (pivot in place).
      const activeRuntime = stageRuntime;
      if (!activeRuntime.cameraBasePosition || !activeRuntime.cameraBaseTarget) {
        return;
      }
      const position: Vector3Tuple = [
        activeRuntime.cameraBasePosition[0] + next.positionOffset[0],
        activeRuntime.cameraBasePosition[1] + next.positionOffset[1],
        activeRuntime.cameraBasePosition[2] + next.positionOffset[2],
      ];
      const target: Vector3Tuple = [
        activeRuntime.cameraBaseTarget[0] + next.targetOffset[0],
        activeRuntime.cameraBaseTarget[1] + next.targetOffset[1],
        activeRuntime.cameraBaseTarget[2] + next.targetOffset[2],
      ];
      const toTarget: Vector3Tuple = [
        target[0] - position[0],
        target[1] - position[1],
        target[2] - position[2],
      ];
      const distance = Math.max(0.05, Math.hypot(toTarget[0], toTarget[1], toTarget[2]));
      let forward = normalizeVec3(toTarget);
      if (Math.hypot(forward[0], forward[1], forward[2]) < 1e-6) {
        forward = [0, 0, -1];
      }
      const worldUp: Vector3Tuple = [0, 1, 0];
      const right = normalizeVec3(crossVec3(forward, worldUp));
      const angleRad = (Math.abs(delta) * Math.PI) / 180;
      const signedAngle = direction === "negative" ? -angleRad : angleRad;

      let nextForward = forward;
      if (axis === "x") {
        nextForward = rotateVec3AroundAxis(forward, worldUp, signedAngle);
      } else if (axis === "y") {
        const pitchAxis = Math.hypot(right[0], right[1], right[2]) < 1e-6 ? [1, 0, 0] as Vector3Tuple : right;
        nextForward = rotateVec3AroundAxis(forward, pitchAxis, signedAngle);
      } else {
        const distanceDelta = Math.max(0.05, distance * 0.12);
        const nextDistance = Math.max(0.05, distance + (direction === "negative" ? distanceDelta : -distanceDelta));
        const nextTarget: Vector3Tuple = [
          position[0] + (forward[0] * nextDistance),
          position[1] + (forward[1] * nextDistance),
          position[2] + (forward[2] * nextDistance),
        ];
        next.targetOffset = [
          nextTarget[0] - activeRuntime.cameraBaseTarget[0],
          nextTarget[1] - activeRuntime.cameraBaseTarget[1],
          nextTarget[2] - activeRuntime.cameraBaseTarget[2],
        ];
        stageRuntime.cameraTuning = next;
        saveCameraTuning(stageRuntime.environmentStorageScope ?? stageRuntime.environmentProfileId, next);
        applyCameraTuning();
        savePersonaPlacementFromRuntime();
        return;
      }

      nextForward = normalizeVec3(nextForward);
      const pivotTarget: Vector3Tuple = [
        position[0] + (nextForward[0] * distance),
        position[1] + (nextForward[1] * distance),
        position[2] + (nextForward[2] * distance),
      ];
      next.targetOffset = [
        pivotTarget[0] - activeRuntime.cameraBaseTarget[0],
        pivotTarget[1] - activeRuntime.cameraBaseTarget[1],
        pivotTarget[2] - activeRuntime.cameraBaseTarget[2],
      ];
    }
    stageRuntime.cameraTuning = next;
    saveCameraTuning(stageRuntime.environmentStorageScope ?? stageRuntime.environmentProfileId, next);
    applyCameraTuning();
    savePersonaPlacementFromRuntime();
  }
}

function resetSelectedViewportGizmoTarget(root: ParentNode): void {
  if (state.viewportGizmoTarget === "environment") {
    resetEnvironmentTuning(root);
    return;
  }
  if (state.viewportGizmoTarget === "avatar") {
    resetAvatarTuning(root);
    return;
  }
  resetCameraTuning(root);
}

function getViewportGizmoWorldPoint(runtime?: StageRuntime): Vector3Tuple | undefined {
  const activeRuntime = runtime ?? stageRuntime;
  if (!activeRuntime) {
    return undefined;
  }
  if (state.viewportGizmoTarget === "environment" && activeRuntime.environmentEntity) {
    const bounds = measureRenderBounds(activeRuntime.environmentEntity);
    return [
      (bounds.minX + bounds.maxX) * 0.5,
      bounds.minY + Math.min(1.25, Math.max(0.5, (bounds.maxY - bounds.minY) * 0.3)),
      (bounds.minZ + bounds.maxZ) * 0.5,
    ];
  }
  if (state.viewportGizmoTarget === "avatar" && activeRuntime.avatarRoot) {
    const bounds = measureRenderBounds(activeRuntime.avatarRoot);
    return [
      (bounds.minX + bounds.maxX) * 0.5,
      bounds.minY + Math.min(1.4, Math.max(0.85, (bounds.maxY - bounds.minY) * 0.65)),
      (bounds.minZ + bounds.maxZ) * 0.5,
    ];
  }
  if (state.viewportGizmoTarget === "camera" && activeRuntime.cameraBaseTarget && activeRuntime.cameraTuning) {
    return [
      activeRuntime.cameraBaseTarget[0] + activeRuntime.cameraTuning.targetOffset[0],
      activeRuntime.cameraBaseTarget[1] + activeRuntime.cameraTuning.targetOffset[1],
      activeRuntime.cameraBaseTarget[2] + activeRuntime.cameraTuning.targetOffset[2],
    ];
  }
  return undefined;
}

function updateViewportGizmoAnchor(runtime?: StageRuntime): void {
  const activeRuntime = runtime ?? stageRuntime;
  const anchor = document.querySelector<HTMLElement>("#viewport-gizmo-anchor");
  if (!anchor || !activeRuntime?.camera?.camera || !activeRuntime.canvas || !activeRuntime.app) {
    anchor?.classList.add("hidden");
    return;
  }
  const worldPoint = getViewportGizmoWorldPoint(activeRuntime);
  if (!worldPoint) {
    anchor.classList.add("hidden");
    return;
  }
  const screen = activeRuntime.camera.camera.worldToScreen(
    new activeRuntime.pc.Vec3(worldPoint[0], worldPoint[1], worldPoint[2]),
    new activeRuntime.pc.Vec3(),
  );
  const canvasWidth = Math.max(1, activeRuntime.app.graphicsDevice.width);
  const canvasHeight = Math.max(1, activeRuntime.app.graphicsDevice.height);
  const x = (screen.x / canvasWidth) * activeRuntime.canvas.clientWidth;
  const y = activeRuntime.canvas.clientHeight - ((screen.y / canvasHeight) * activeRuntime.canvas.clientHeight);
  const onScreen = Number.isFinite(x) && Number.isFinite(y) && screen.z > 0 && x >= 0 && y >= 0 && x <= activeRuntime.canvas.clientWidth && y <= activeRuntime.canvas.clientHeight;
  if (!onScreen) {
    anchor.classList.add("hidden");
    return;
  }
  anchor.classList.remove("hidden");
  anchor.style.left = `${x}px`;
  anchor.style.top = `${y}px`;
}

function syncVoiceRuntimeUi(): void {
  const note = document.querySelector<HTMLElement>("#voice-runtime-note");
  if (note) {
    note.textContent = formatVoiceRuntimeNote();
  }
  const button = document.querySelector<HTMLButtonElement>("#voice-loop-restart");
  if (button) {
    button.disabled = !voiceRuntime.supported || state.conversationPending;
  }
  syncShellStatePanel();
  syncViewportGizmoUi();
}

function syncAvatarMotionOverlay(): void {
  const overlay = document.querySelector<HTMLElement>("#avatar-motion-overlay");
  if (overlay) {
    overlay.textContent = state.avatarMotionSummary;
  }
}

function formatVoiceFollowNote(): string {
  const mode = state.voiceMode;
  const timeout = `${state.silenceTimeoutMs}ms`;
  if (mode === "wake_word") {
    return `Following shell voice settings: ${mode} | wake word ${state.wakeWord} | timeout ${timeout}`;
  }
  return `Following shell voice settings: ${mode} | timeout ${timeout}`;
}

function formatVoiceRuntimeNote(): string {
  if (!voiceRuntime.supported) {
    return "Wake word is unavailable in this browser because SpeechRecognition is not exposed.";
  }
  if (voiceRuntime.awaitingAssistant) {
    return "Wake word is paused while Gail speaks. It will resume after the reply if auto resume is enabled.";
  }
  if (!isContinuousVoiceMode()) {
    return `Wake word is idle because the shell voice mode is ${state.voiceMode}.`;
  }
  if (voiceRuntime.active) {
    if (voiceRuntime.followUpListening) {
      return "Listening... go ahead, no wake word needed.";
    }
    return state.voiceMode === "wake_word"
      ? `Wake word listening for "${state.wakeWord}".`
      : "Voice loop is listening continuously.";
  }
  if (voiceRuntime.retryBlocked) {
    return `Wake word could not start: ${voiceRuntime.lastError ?? "microphone access was blocked"}. Use Restart Voice after allowing mic access.`;
  }
  if (voiceRuntime.lastTranscript) {
    return `Wake word is idle. Last transcript: ${voiceRuntime.lastTranscript}`;
  }
  return "Wake word is configured from shell settings. Use Restart Voice if the browser blocked microphone startup.";
}

function isContinuousVoiceMode(): boolean {
  return state.voiceMode === "wake_word" || state.voiceMode === "always_listening";
}

function clearWorkLiteVoiceSilenceTimer(): void {
  if (voiceRuntime.silenceTimer !== undefined) {
    window.clearTimeout(voiceRuntime.silenceTimer);
    voiceRuntime.silenceTimer = undefined;
  }
}

function shouldBlockVoiceRetry(detail: string | undefined): boolean {
  const normalized = detail?.trim().toLowerCase();
  return normalized === "not-allowed"
    || normalized === "service-not-allowed"
    || normalized === "audio-capture";
}

async function ensureWorkLiteVoiceLoopState(reason: string): Promise<void> {
  voiceRuntime.supported = Boolean(getSpeechRecognitionConstructor());
  if (!voiceRuntime.supported) {
    stopWorkLiteVoiceLoop();
    syncVoiceRuntimeUi();
    return;
  }
  if (!isContinuousVoiceMode()) {
    stopWorkLiteVoiceLoop();
    syncVoiceRuntimeUi();
    return;
  }
  if (state.conversationPending || voiceRuntime.awaitingAssistant || voiceRuntime.retryBlocked) {
    syncVoiceRuntimeUi();
    return;
  }
  if (voiceRuntime.active || voiceRuntime.recognition) {
    syncVoiceRuntimeUi();
    return;
  }
  startWorkLiteVoiceLoop(reason);
}

function startWorkLiteVoiceLoop(reason: string): void {
  const Recognition = getSpeechRecognitionConstructor();
  if (!Recognition) {
    voiceRuntime.supported = false;
    syncVoiceRuntimeUi();
    return;
  }

  const recognition = new Recognition();
  voiceRuntime.recognition = recognition;
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.onstart = () => {
    if (voiceRuntime.recognition !== recognition) {
      return;
    }
    voiceRuntime.active = true;
    voiceRuntime.lastError = undefined;
    voiceRuntime.retryBlocked = false;
    stageRuntime?.mechanics?.setListening(true);
    syncVoiceRuntimeUi();
  };
  recognition.onresult = (event) => {
    // â”€â”€ Build full transcript: committed finals + current results (final + interim) â”€â”€
    // Accumulate any newly-finalized results into the conversation buffer so
    // multi-phrase speech ("Hello [pause] how are you") is never lost. Only
    // start the silence-submission timer once the browser marks a result as
    // final (meaning the user actually paused) â€” interim results just reset
    // the timer to prevent premature submission while the user is mid-word.
    if (event.resultIndex === 0 && voiceRuntime.lastCommittedResultIndex > event.results.length) {
      // Some engines reset result indexes; reset our watermark so fresh finals are accepted.
      voiceRuntime.lastCommittedResultIndex = 0;
    }

    let newFinals = "";
    let currentInterim = "";
    let hasFinalResult = false;
    const finalConfidenceSamples: number[] = [];
    const parseStartIndex = Math.max(0, event.resultIndex);
    for (let index = parseStartIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const alternative = result[0];
      const text = alternative?.transcript ?? "";
      if (!text) { continue; }
      if (result.isFinal) {
        if (index < voiceRuntime.lastCommittedResultIndex) {
          continue;
        }
        newFinals += `${text} `;
        if (Number.isFinite(alternative?.confidence)) {
          finalConfidenceSamples.push(Number(alternative.confidence));
        }
        hasFinalResult = true;
        voiceRuntime.lastCommittedResultIndex = Math.max(voiceRuntime.lastCommittedResultIndex, index + 1);
      } else {
        if (index < voiceRuntime.lastCommittedResultIndex) {
          continue;
        }
        currentInterim += `${text} `;
      }
    }

    // Full visible transcript = previously committed buffer + new finals + interim
    const fullTranscript = `${voiceRuntime.conversationBuffer}${newFinals}${currentInterim}`.trim();
    if (!fullTranscript) { return; }
    const lowerFull = fullTranscript.toLowerCase();

    // â”€â”€ Interrupt commands â€” always honoured, even while Gail is speaking â”€â”€
    if (/\b(shut up|stop talking|be quiet|enough|stop it|hush|silence)\b/.test(lowerFull)) {
      stageRuntime?.mechanics?.stopSpeech();
      if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); }
      gailSpeechActive = false;
      speechEndedAt = performance.now();
      cancelFollowUpTimeout();
      voiceRuntime.followUpListening = false;
      voiceRuntime.conversationBuffer = "";
      voiceRuntime.lastCommittedResultIndex = event.results.length;
      clearWorkLiteVoiceSilenceTimer();
      console.log("[voice] speech interrupted by user command:", lowerFull);
      syncVoiceRuntimeUi();
      return;
    }

    // â”€â”€ Self-hearing guard â€” block everything else while Gail is speaking â”€â”€
    if (gailSpeechActive) {
      console.log("[voice:guard] Blocked transcript (gailSpeechActive=true):", fullTranscript.slice(0, 60));
      return;
    }
    const speechCooldownMs = activeVoiceRuntimeConfig.timing.speechCooldownMs;
    const msSinceSpeechEnd = performance.now() - speechEndedAt;
    if (msSinceSpeechEnd < speechCooldownMs) {
      console.log(`[voice:guard] Blocked transcript (cooldown ${Math.round(msSinceSpeechEnd)}ms < ${speechCooldownMs}ms):`, fullTranscript.slice(0, 60));
      return;
    }

    // Also guard against browser-synthesis still active (belt-and-suspenders)
    if (isBrowserSpeechBusy()) {
      console.log("[voice:guard] Blocked transcript (speechSynthesis still active):", fullTranscript.slice(0, 60));
      return;
    }

    // Commit newly-finalized text into the persistent buffer
    if (newFinals.trim()) {
      const separator = voiceRuntime.conversationBuffer ? " " : "";
      voiceRuntime.conversationBuffer = `${voiceRuntime.conversationBuffer}${separator}${newFinals}`.trim();
    }

    // For display / command matching, use the full transcript including interim
    const displayTranscript = currentInterim.trim()
      ? `${voiceRuntime.conversationBuffer} ${currentInterim}`.trim()
      : voiceRuntime.conversationBuffer;

    voiceRuntime.lastTranscript = displayTranscript;
    console.log("[voice] Accepted transcript:", displayTranscript, hasFinalResult ? "(final)" : "(interim)");

    // Voice command: switch to always-listening mode
    if (/\b(always listen|listen always|keep listening|stay listening|continuous listening|always on)\b/.test(lowerFull)) {
      if (state.voiceMode !== "always_listening") {
        state.voiceMode = "always_listening";
        void updateVoiceSettings({ mode: "always_listening" } as VoiceSettingsResponse).catch(() => {});
        speakQuickBrowserPhrase("Always listening now. Just talk to me.");
        console.log("[voice] switched to always_listening by voice command");
      } else {
        speakQuickBrowserPhrase("I'm already listening.");
      }
      voiceRuntime.conversationBuffer = "";
      voiceRuntime.lastCommittedResultIndex = event.results.length;
      clearWorkLiteVoiceSilenceTimer();
      syncVoiceRuntimeUi();
      return;
    }

    // Voice command: switch back to wake-word mode
    if (/\b(wake word only|wake word mode|stop always listening|stop listening)\b/.test(lowerFull)) {
      if (state.voiceMode !== "wake_word") {
        state.voiceMode = "wake_word";
        void updateVoiceSettings({ mode: "wake_word" } as VoiceSettingsResponse).catch(() => {});
        speakQuickBrowserPhrase(`Back to wake word mode. Say ${state.wakeWord} to get my attention.`);
        console.log("[voice] switched to wake_word by voice command");
      } else {
        speakQuickBrowserPhrase("I'm already on wake word mode.");
      }
      voiceRuntime.conversationBuffer = "";
      voiceRuntime.lastCommittedResultIndex = event.results.length;
      clearWorkLiteVoiceSilenceTimer();
      syncVoiceRuntimeUi();
      return;
    }

    // Voice command: vision / camera look (require longer phrases to avoid false positives)
    if (/\b(what do you see|look at this|what am i holding|describe what you see|what are you looking at|what can you see)\b/.test(lowerFull)) {
      console.log("[voice] Vision command matched:", lowerFull);
      voiceRuntime.conversationBuffer = "";
      voiceRuntime.lastCommittedResultIndex = event.results.length;
      clearWorkLiteVoiceSilenceTimer();
      void captureAndAnalyzeFrame(displayTranscript);
      syncVoiceRuntimeUi();
      return;
    }

    // Voice command: persona switching
    const personaVoiceMatch = resolvePersonaVoiceCommand(lowerFull);
    if (personaVoiceMatch) {
      console.log("[voice] Persona switch command:", lowerFull, "â†’", personaVoiceMatch);
      voiceRuntime.conversationBuffer = "";
      voiceRuntime.lastCommittedResultIndex = event.results.length;
      clearWorkLiteVoiceSilenceTimer();
      void switchToPersona(personaVoiceMatch);
      syncVoiceRuntimeUi();
      return;
    }

    // Voice command: dance start
    if (DANCE_START_COMMAND.test(lowerFull)) {
      console.log("[voice] Dance command matched:", lowerFull);
      voiceRuntime.conversationBuffer = "";
      voiceRuntime.lastCommittedResultIndex = event.results.length;
      clearWorkLiteVoiceSilenceTimer();
      void (async () => {
        if (state.activePrivatePersona !== "private_girlfriend") {
          await switchToPersona("private_girlfriend");
        }
        await handleDanceCommand();
      })();
      syncVoiceRuntimeUi();
      return;
    }

    // Voice command: "stop dancing" â€” restore clothing and idle
    if (DANCE_STOP_COMMAND.test(lowerFull) && danceActive) {
      console.log("[voice] Stop dance command matched:", lowerFull);
      voiceRuntime.conversationBuffer = "";
      voiceRuntime.lastCommittedResultIndex = event.results.length;
      clearWorkLiteVoiceSilenceTimer();
      stopDance();
      speakQuickBrowserPhrase("Okay, back to normal.");
      syncVoiceRuntimeUi();
      return;
    }

    bumpInactivityTimer();

    if (voiceRuntime.followUpListening) {
      console.log("[voice] Follow-up listening â€” buffering for submission:", displayTranscript.slice(0, 80));
      refreshFollowUpTimeout();
      // Only schedule submission when browser finalizes a phrase (user actually paused).
      // Interim results just keep the timer alive so we don't cut off mid-word.
      if (hasFinalResult) {
        scheduleWorkLiteVoiceSubmission({
          timeoutMs: activeVoiceRuntimeConfig.timing.followUpSubmitTimeoutMs,
        });
      } else {
        clearWorkLiteVoiceSilenceTimer();
      }
    } else if (state.voiceMode === "wake_word") {
      console.log("[voice] Wake-word mode â€” checking for wake word in:", displayTranscript.slice(0, 80));
      handleWorkLiteWakeWordTranscript(displayTranscript.toLowerCase(), hasFinalResult);
    } else {
      // Always-listening or push-to-talk: schedule submission only on final results.
      // Interim results clear the timer so we don't submit mid-sentence.
      if (hasFinalResult) {
        scheduleWorkLiteVoiceSubmission({
          timeoutMs: activeVoiceRuntimeConfig.timing.defaultSubmitTimeoutMs,
          ambientGuard: state.voiceMode === "always_listening",
          confidenceSamples: finalConfidenceSamples,
        });
      } else {
        clearWorkLiteVoiceSilenceTimer();
      }
    }
    syncVoiceRuntimeUi();
  };
  recognition.onerror = (event) => {
    if (voiceRuntime.recognition !== recognition) {
      return;
    }
    voiceRuntime.lastError = event.error ?? event.message ?? "speech recognition failed";
    voiceRuntime.retryBlocked = shouldBlockVoiceRetry(voiceRuntime.lastError);
    syncVoiceRuntimeUi();
  };
  recognition.onend = () => {
    if (voiceRuntime.recognition === recognition) {
      voiceRuntime.recognition = undefined;
    }
    voiceRuntime.active = false;
    stageRuntime?.mechanics?.setListening(false);
    syncVoiceRuntimeUi();
    if (isContinuousVoiceMode() && state.autoResumeAfterResponse && !voiceRuntime.awaitingAssistant && !state.conversationPending && !voiceRuntime.retryBlocked) {
      window.setTimeout(() => {
        void ensureWorkLiteVoiceLoopState("recognition ended");
      }, 250);
    }
  };

  try {
    recognition.start();
  } catch (error) {
    if (voiceRuntime.recognition === recognition) {
      voiceRuntime.recognition = undefined;
    }
    voiceRuntime.active = false;
    voiceRuntime.lastError = error instanceof Error ? error.message : String(error);
    voiceRuntime.retryBlocked = shouldBlockVoiceRetry(voiceRuntime.lastError);
    stageRuntime?.mechanics?.setListening(false);
    console.warn(`work-lite voice loop failed to start during ${reason}`, error);
    syncVoiceRuntimeUi();
    // Retry once after a short delay if the error isn't a permanent blocker
    if (!voiceRuntime.retryBlocked) {
      window.setTimeout(() => {
        console.log("[voice] Retrying recognition start after transient error");
        void ensureWorkLiteVoiceLoopState("retry after error");
      }, 1000);
    }
  }
}

function stopWorkLiteVoiceLoop(): void {
  clearWorkLiteVoiceSilenceTimer();
  voiceRuntime.conversationBuffer = "";
  voiceRuntime.lastCommittedResultIndex = 0;
  const recognition = voiceRuntime.recognition;
  voiceRuntime.recognition = undefined;
  voiceRuntime.active = false;
  if (recognition) {
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.abort();
  }
  stageRuntime?.mechanics?.setListening(false);
  syncVoiceRuntimeUi();
}

const WAKE_WORD_ACKNOWLEDGEMENTS = [
  "What's up?",
  "I'm here.",
  "Right here.",
  "Yep?",
  "Go ahead.",
  "I'm listening.",
  "Talk to me.",
];

const THINKING_FILLERS_BY_KIND: Record<VoiceIntentKind, string[]> = {
  question: [
    "Let me think that through.",
    "Good question. One second.",
    "I'm checking that.",
    "Let me sort that out.",
    "Give me a second on that.",
  ],
  command: [
    "On it.",
    "I'll take care of that.",
    "Working on it.",
    "Let me do that.",
    "Okay, I'm moving on it.",
  ],
  statement: [
    "I hear you.",
    "I'm with you.",
    "Got it. Let me think.",
    "Okay, tracking.",
    "Right, I follow.",
  ],
};

const THINKING_FILLERS_BY_CONTEXT: Partial<Record<VoiceFillerContext, string[]>> = {
  follow_up: [
    "Right, continuing from that.",
    "I'm tracking.",
    "Yep, still with you.",
  ],
  vision: [
    "I'll take a look.",
    "Let me check what I can see.",
    "Looking now.",
  ],
  persona: [
    "Okay, switching gears.",
    "I'll adjust that.",
  ],
  dance: [
    "Okay, cueing that up.",
    "I'll get that moving.",
  ],
  system: [
    "Okay, adjusting that.",
    "I'll update that.",
  ],
};

const CONVERSATION_CLOSERS = [
  "Alright, I'll be here if you need me.",
  "Okay, just say hey gail if you need anything.",
  "I'm going quiet for now. Call me anytime.",
  "Standing by whenever you're ready.",
  "No worries, I'll be right here.",
];

const BOOT_GREETINGS = [
  "Hey boss, I'm online and ready to go.",
  "Good to go. Just say hey gail when you need me.",
  "I'm up. Let me know what you need.",
  "All systems go. I'm listening for hey gail.",
];

const FOLLOW_UP_TIMEOUT_MS = 9000;
const WAKE_WORD_FOLLOW_UP_TIMEOUT_MS = 7000;
const VOICE_SUBMIT_TIMEOUT_DEFAULT_MS = 1400;
const VOICE_SUBMIT_TIMEOUT_FOLLOW_UP_MS = 850;
const VOICE_SUBMIT_TIMEOUT_WAKE_WORD_MS = 850;
const VOICE_SUBMIT_TIMEOUT_MIN_MS = 450;
const VOICE_SUBMIT_TIMEOUT_MAX_MS = 3500;
const THINKING_FILLER_DELAY_MS = 650;
const AMBIENT_LOW_CONFIDENCE_THRESHOLD = 0.48;
const AMBIENT_REPEAT_WINDOW_MS = 10_000;
const STREAM_REQUEST_TIMEOUT_MS = 120000;
const FALLBACK_REQUEST_TIMEOUT_MS = 120000;

const DEFAULT_VOICE_RUNTIME_CONFIG: VoiceRuntimeConfig = {
  timing: {
    speechCooldownMs: 1200,
    thinkingFillerDelayMs: THINKING_FILLER_DELAY_MS,
    followUpTimeoutMs: FOLLOW_UP_TIMEOUT_MS,
    wakeWordFollowUpTimeoutMs: WAKE_WORD_FOLLOW_UP_TIMEOUT_MS,
    defaultSubmitTimeoutMs: VOICE_SUBMIT_TIMEOUT_DEFAULT_MS,
    followUpSubmitTimeoutMs: VOICE_SUBMIT_TIMEOUT_FOLLOW_UP_MS,
    wakeWordSubmitTimeoutMs: VOICE_SUBMIT_TIMEOUT_WAKE_WORD_MS,
    minSubmitTimeoutMs: VOICE_SUBMIT_TIMEOUT_MIN_MS,
    maxSubmitTimeoutMs: VOICE_SUBMIT_TIMEOUT_MAX_MS,
    ambientLowConfidenceThreshold: AMBIENT_LOW_CONFIDENCE_THRESHOLD,
    ambientRepeatWindowMs: AMBIENT_REPEAT_WINDOW_MS,
  },
  phrases: {
    wakeWordAliases: ["gail", "gale", "gael", "gal"],
    wakePrefixes: ["hey", "hi", "hello", "okay", "ok", "yo"],
    wakeAcknowledgements: WAKE_WORD_ACKNOWLEDGEMENTS,
    thinkingFillers: THINKING_FILLERS_BY_KIND,
    contextFillers: {
      followUp: THINKING_FILLERS_BY_CONTEXT.follow_up ?? [],
      vision: THINKING_FILLERS_BY_CONTEXT.vision ?? [],
      persona: THINKING_FILLERS_BY_CONTEXT.persona ?? [],
      dance: THINKING_FILLERS_BY_CONTEXT.dance ?? [],
      system: THINKING_FILLERS_BY_CONTEXT.system ?? [],
    },
    conversationClosers: CONVERSATION_CLOSERS,
    bootGreetings: BOOT_GREETINGS,
    ambientSingleWordAllowlist: ["yes", "yeah", "yep", "no", "nope", "stop", "cancel", "quiet"],
  },
};

let activeVoiceRuntimeConfig = DEFAULT_VOICE_RUNTIME_CONFIG;

function pickRandom(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function pickNonRepeatingRandom(phrases: string[], lastPhrase: string): string {
  if (phrases.length <= 1) {
    return phrases[0] ?? "";
  }
  const candidates = phrases.filter((phrase) => phrase !== lastPhrase);
  return pickRandom(candidates.length > 0 ? candidates : phrases);
}

function normalizeStringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const cleaned = value.map((item) => String(item ?? "").trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [...fallback];
}

function normalizeNumberSetting(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, numeric));
}

function normalizeVoiceRuntimeConfig(
  incoming: Partial<VoiceRuntimeConfig> | undefined,
  fallback: VoiceRuntimeConfig,
): VoiceRuntimeConfig {
  const timing = (incoming?.timing ?? {}) as Partial<VoiceRuntimeConfig["timing"]>;
  const phrases = (incoming?.phrases ?? {}) as Partial<VoiceRuntimeConfig["phrases"]>;
  const thinkingFillers = (phrases.thinkingFillers ?? {}) as Partial<VoiceRuntimeConfig["phrases"]["thinkingFillers"]>;
  const contextFillers = (phrases.contextFillers ?? {}) as Partial<VoiceRuntimeConfig["phrases"]["contextFillers"]>;
  return {
    timing: {
      speechCooldownMs: normalizeNumberSetting(timing.speechCooldownMs, fallback.timing.speechCooldownMs, 0, 10000),
      thinkingFillerDelayMs: normalizeNumberSetting(timing.thinkingFillerDelayMs, fallback.timing.thinkingFillerDelayMs, 0, 5000),
      followUpTimeoutMs: normalizeNumberSetting(timing.followUpTimeoutMs, fallback.timing.followUpTimeoutMs, 1000, 30000),
      wakeWordFollowUpTimeoutMs: normalizeNumberSetting(timing.wakeWordFollowUpTimeoutMs, fallback.timing.wakeWordFollowUpTimeoutMs, 1000, 30000),
      defaultSubmitTimeoutMs: normalizeNumberSetting(timing.defaultSubmitTimeoutMs, fallback.timing.defaultSubmitTimeoutMs, 250, 10000),
      followUpSubmitTimeoutMs: normalizeNumberSetting(timing.followUpSubmitTimeoutMs, fallback.timing.followUpSubmitTimeoutMs, 250, 10000),
      wakeWordSubmitTimeoutMs: normalizeNumberSetting(timing.wakeWordSubmitTimeoutMs, fallback.timing.wakeWordSubmitTimeoutMs, 250, 10000),
      minSubmitTimeoutMs: normalizeNumberSetting(timing.minSubmitTimeoutMs, fallback.timing.minSubmitTimeoutMs, 100, 5000),
      maxSubmitTimeoutMs: normalizeNumberSetting(timing.maxSubmitTimeoutMs, fallback.timing.maxSubmitTimeoutMs, 500, 20000),
      ambientLowConfidenceThreshold: normalizeNumberSetting(timing.ambientLowConfidenceThreshold, fallback.timing.ambientLowConfidenceThreshold, 0, 1),
      ambientRepeatWindowMs: normalizeNumberSetting(timing.ambientRepeatWindowMs, fallback.timing.ambientRepeatWindowMs, 0, 60000),
    },
    phrases: {
      wakeWordAliases: normalizeStringList(phrases.wakeWordAliases, fallback.phrases.wakeWordAliases),
      wakePrefixes: normalizeStringList(phrases.wakePrefixes, fallback.phrases.wakePrefixes),
      wakeAcknowledgements: normalizeStringList(phrases.wakeAcknowledgements, fallback.phrases.wakeAcknowledgements),
      thinkingFillers: {
        question: normalizeStringList(thinkingFillers.question, fallback.phrases.thinkingFillers.question),
        command: normalizeStringList(thinkingFillers.command, fallback.phrases.thinkingFillers.command),
        statement: normalizeStringList(thinkingFillers.statement, fallback.phrases.thinkingFillers.statement),
      },
      contextFillers: {
        followUp: normalizeStringList(contextFillers.followUp, fallback.phrases.contextFillers.followUp),
        vision: normalizeStringList(contextFillers.vision, fallback.phrases.contextFillers.vision),
        persona: normalizeStringList(contextFillers.persona, fallback.phrases.contextFillers.persona),
        dance: normalizeStringList(contextFillers.dance, fallback.phrases.contextFillers.dance),
        system: normalizeStringList(contextFillers.system, fallback.phrases.contextFillers.system),
      },
      conversationClosers: normalizeStringList(phrases.conversationClosers, fallback.phrases.conversationClosers),
      bootGreetings: normalizeStringList(phrases.bootGreetings, fallback.phrases.bootGreetings),
      ambientSingleWordAllowlist: normalizeStringList(phrases.ambientSingleWordAllowlist, fallback.phrases.ambientSingleWordAllowlist),
    },
  };
}

function clearThinkingFillerTimer(): void {
  if (thinkingFillerTimerHandle !== undefined) {
    window.clearTimeout(thinkingFillerTimerHandle);
    thinkingFillerTimerHandle = undefined;
  }
}

function queueThinkingFiller(message: string): void {
  clearThinkingFillerTimer();
  const intent = classifyVoiceIntent(message);
  thinkingFillerTimerHandle = window.setTimeout(() => {
    thinkingFillerTimerHandle = undefined;
    if (!state.conversationPending || thinkingFillerActive) {
      return;
    }
    thinkingFillerActive = true;
    const phrase = selectThinkingFiller(intent);
    speakQuickBrowserPhrase(phrase, () => {
      thinkingFillerActive = false;
    });
  }, activeVoiceRuntimeConfig.timing.thinkingFillerDelayMs);
}

function selectThinkingFiller(intent: VoiceIntentClassification): string {
  const runtimePhrases = activeVoiceRuntimeConfig.phrases;
  const contextKey = intent.context === "follow_up" ? "followUp" : intent.context;
  const contextPhrases = contextKey === "general" ? [] : runtimePhrases.contextFillers[contextKey] ?? [];
  const kindPhrases = runtimePhrases.thinkingFillers[intent.kind] ?? runtimePhrases.thinkingFillers.statement;
  const phrasePool = contextPhrases.length > 0
    ? [...contextPhrases, ...kindPhrases]
    : kindPhrases;
  const phrase = pickNonRepeatingRandom(phrasePool, lastThinkingFiller);
  lastThinkingFiller = phrase;
  return phrase;
}

function classifyVoiceIntent(message: string): VoiceIntentClassification {
  const lower = normalizeVoiceText(message);
  const words = lower.split(/\s+/).filter(Boolean);
  const first = words[0] ?? "";
  const startsWithQuestion = /^(who|what|when|where|why|how|can|could|would|should|do|does|did|is|are|am|will|was|were|have|has|had)\b/.test(lower);
  const startsWithCommand = /^(show|open|switch|change|start|stop|turn|look|find|search|remind|set|make|build|fix|run|go|call|tell|explain|read|check|update|move|delete|save|bring|load|import)\b/.test(lower);
  const commandPhrase = /\b(switch to|turn on|turn off|look at|pull up|bring up|set up|wake word|always listen|stop listening|start dancing|stop dancing|dance for me)\b/.test(lower);
  const kind: VoiceIntentKind = message.trim().endsWith("?") || startsWithQuestion
    ? "question"
    : startsWithCommand || commandPhrase
      ? "command"
      : "statement";

  let context: VoiceFillerContext = "general";
  if (voiceRuntime.followUpListening) {
    context = "follow_up";
  } else if (/\b(see|look|camera|holding|watching|picture|image|describe)\b/.test(lower)) {
    context = "vision";
  } else if (/\b(gail|vera|cherry|persona|counselor|girlfriend|normal mode)\b/.test(lower)) {
    context = "persona";
  } else if (/\b(dance|dancing)\b/.test(lower)) {
    context = "dance";
  } else if (/\b(wake word|always listen|voice mode|microphone|listening|volume|settings)\b/.test(lower)) {
    context = "system";
  }

  if (words.length === 0 || !first) {
    return { kind: "statement", context };
  }
  return { kind, context };
}

function shouldRejectAmbientTranscript(content: string, confidenceSamples?: number[]): string | undefined {
  const normalized = normalizeVoiceText(content);
  if (!normalized) {
    return "empty transcript";
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  const shortAllowed = new Set(activeVoiceRuntimeConfig.phrases.ambientSingleWordAllowlist.map((item) => normalizeVoiceText(item)).filter(Boolean));
  if (words.length === 1 && !shortAllowed.has(words[0])) {
    return "single-word ambient transcript";
  }

  const usableConfidence = (confidenceSamples ?? []).filter((value) => Number.isFinite(value) && value > 0);
  if (usableConfidence.length > 0 && Math.max(...usableConfidence) < activeVoiceRuntimeConfig.timing.ambientLowConfidenceThreshold && words.length < 6) {
    return `low confidence ambient transcript (${Math.max(...usableConfidence).toFixed(2)})`;
  }

  const now = performance.now();
  if (normalized === lastAmbientAcceptedTranscript && now - lastAmbientAcceptedAt < activeVoiceRuntimeConfig.timing.ambientRepeatWindowMs) {
    return "repeated ambient transcript";
  }

  const intent = classifyVoiceIntent(content);
  if (intent.kind !== "statement") {
    return undefined;
  }

  const directedAtGail = /\b(gail|gale|gael|gal|you|your|you're|youre|please)\b/.test(normalized);
  const personalSpeech = /^(i|i'm|im|i've|ive|i'll|ill|my|we|we're|were|we've|weve|this|that|these|those)\b/.test(normalized);
  const commandLike = /\b(look|show|switch|change|start|stop|open|close|turn|set|find|search|remind|tell|explain|check|update|fix|make|build|run|load|import)\b/.test(normalized);
  if (!directedAtGail && !personalSpeech && !commandLike && words.length >= 8) {
    return "long ambient statement not directed at Gail";
  }

  lastAmbientAcceptedTranscript = normalized;
  lastAmbientAcceptedAt = now;
  return undefined;
}

// â”€â”€ Background frame capture â€” grabs a JPEG every 10s and caches it â”€â”€
function grabFrameFromStream(): string | undefined {
  if (!state.cameraStream) {
    return undefined;
  }
  const track = state.cameraStream.getVideoTracks()[0];
  if (!track || track.readyState !== "live") {
    console.log("[vision:frame] No live video track available â€” skipping grab.");
    return undefined;
  }
  try {
    const settings = track.getSettings();
    const w = settings.width ?? 640;
    const h = settings.height ?? 480;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    // Draw from the live video element if we have one, otherwise try ImageCapture
    const videoEl = document.querySelector<HTMLVideoElement>("#camera-preview");
    if (videoEl && videoEl.readyState >= 2) {
      ctx.drawImage(videoEl, 0, 0, w, h);
    } else {
      console.log("[vision:frame] Camera preview not ready for drawing â€” skipping.");
      return undefined;
    }
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    console.log(`[vision:frame] Grabbed frame ${w}x${h}, base64 length=${base64.length}`);
    return base64;
  } catch (err) {
    console.warn("[vision:frame] grabFrameFromStream error:", err);
    return undefined;
  }
}

function tickFrameCapture(): void {
  if (frameLocked) {
    console.log("[vision:frame] Frame is locked (analysis in-flight) â€” skipping capture tick.");
    return;
  }
  const frame = grabFrameFromStream();
  if (frame) {
    cachedFrameBase64 = frame;
    cachedFrameTimestamp = Date.now();
    console.log(`[vision:frame] Cached new frame at ${new Date(cachedFrameTimestamp).toISOString()}`);
  }
}

function startFrameCaptureLoop(): void {
  stopFrameCaptureLoop();
  console.log(`[vision:frame] Starting background frame capture every ${FRAME_CAPTURE_INTERVAL_MS / 1000}s.`);
  // Grab one immediately
  tickFrameCapture();
  frameCaptureTimer = window.setInterval(tickFrameCapture, FRAME_CAPTURE_INTERVAL_MS);
}

function stopFrameCaptureLoop(): void {
  if (frameCaptureTimer !== undefined) {
    window.clearInterval(frameCaptureTimer);
    frameCaptureTimer = undefined;
    console.log("[vision:frame] Stopped background frame capture loop.");
  }
  cachedFrameBase64 = undefined;
  cachedFrameTimestamp = 0;
}

// â”€â”€ Vision analysis â€” uses cached frame if available, otherwise grabs one â”€â”€
async function captureAndAnalyzeFrame(prompt?: string): Promise<void> {
  if (!state.cameraStream) {
    console.log("[vision] captureAndAnalyzeFrame called but no camera stream.");
    speakQuickBrowserPhrase("Turn the camera on first so I can see something.");
    return;
  }
  const videoTrack = state.cameraStream.getVideoTracks()[0];
  if (!videoTrack) {
    console.log("[vision] captureAndAnalyzeFrame called but no video track.");
    speakQuickBrowserPhrase("Camera track isn't available right now.");
    return;
  }

  // Use cached frame if fresh enough, otherwise grab a new one
  let imageBase64 = cachedFrameBase64;
  const frameAge = Date.now() - cachedFrameTimestamp;
  if (imageBase64 && frameAge < FRAME_CAPTURE_INTERVAL_MS * 2) {
    console.log(`[vision] Using cached frame (age=${frameAge}ms).`);
  } else {
    console.log("[vision] No cached frame or too stale â€” grabbing fresh frame.");
    imageBase64 = grabFrameFromStream();
  }

  if (!imageBase64) {
    console.warn("[vision] Could not obtain a frame for analysis.");
    speakQuickBrowserPhrase("I can't see anything right now. Make sure the camera is pointed at something.");
    return;
  }

  // Lock the frame so the background loop doesn't replace it mid-analysis
  frameLocked = true;
  console.log(`[vision] Frame locked for analysis. base64 length=${imageBase64.length}, prompt="${prompt ?? "(default)"}"`);
  speakQuickBrowserPhrase("Let me take a lookâ€¦");

  try {
    const response = await fetch("/vision/analyze", {
      method: "POST",
      headers: buildGailHeaders(true),
      body: JSON.stringify({ imageBase64, mimeType: "image/jpeg", prompt }),
    });
    if (!response.ok) {
      console.warn("[vision] Analyze failed:", response.status, await response.text().catch(() => ""));
      speakQuickBrowserPhrase("Couldn't process that image. Something went wrong on my end.");
      return;
    }
    const result = await response.json() as { description: string };
    console.log("[vision] Analysis result:", result.description);
    speakQuickBrowserPhrase(result.description);
  } catch (err) {
    console.error("[vision] captureAndAnalyzeFrame error:", err);
    speakQuickBrowserPhrase("Something went wrong trying to look at the camera.");
  } finally {
    // Unlock and dump the used frame â€” next tick will grab a fresh one
    frameLocked = false;
    cachedFrameBase64 = undefined;
    cachedFrameTimestamp = 0;
    console.log("[vision] Frame unlocked and dumped after analysis.");
  }
}

function speakQuickBrowserPhrase(text: string, onEnd?: () => void): void {
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  console.log("[speech] speakQuickBrowserPhrase queued:", text.slice(0, 80));
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = state.speechRate;
  utterance.pitch = state.speechPitch;
  const selectedVoice = getSelectedBrowserVoice(state.browserVoiceName);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  markGailOutputStarted();
  const markEnd = () => {
    const synth = window.speechSynthesis;
    if (activeSpeechState) {
      scheduleSpeechBreathPause(text, activeSpeechState, { pauseQueuedBrowserSpeech: true });
    }
    if (!synth.speaking && !synth.pending) {
      if (activeSpeechState) {
        activeSpeechState.speaking = false;
        activeSpeechState.talkLevel = 0;
      }
      markGailOutputEndedIfIdle(activeSpeechState);
      console.log("[speech] All speech finished. gailSpeechActive=false, cooldown started.");
    } else {
      console.log("[speech] Utterance ended but queue still active (speaking=%s, pending=%s).", synth.speaking, synth.pending);
    }
    onEnd?.();
  };
  utterance.onstart = () => {
    markGailOutputStarted();
    console.log("[speech] Utterance started:", text.slice(0, 60));
    if (activeSpeechState) {
      activeSpeechState.speaking = true;
      activeSpeechState.talkLevel = 0.45;
    }
  };
  utterance.onboundary = () => {
    if (activeSpeechState) {
      activeSpeechState.talkLevel = 0.9;
    }
  };
  utterance.onend = markEnd;
  utterance.onerror = (ev) => {
    console.warn("[speech] Utterance error:", ev);
    markEnd();
  };
  window.speechSynthesis.speak(utterance);
}

function cancelFollowUpTimeout(): void {
  if (voiceRuntime.followUpTimer !== undefined) {
    window.clearTimeout(voiceRuntime.followUpTimer);
    voiceRuntime.followUpTimer = undefined;
  }
  voiceRuntime.followUpTimeoutMs = undefined;
}

function resolveFollowUpTimeoutMs(timeoutMs?: number): number {
  const fallbackFromVoiceSettings = Number.isFinite(state.silenceTimeoutMs)
    ? Number(state.silenceTimeoutMs) + 2500
    : activeVoiceRuntimeConfig.timing.followUpTimeoutMs;
  const selected = Number.isFinite(timeoutMs) ? Number(timeoutMs) : fallbackFromVoiceSettings;
  return Math.max(3000, Math.min(20000, Math.round(selected)));
}

function armFollowUpTimeout(timeoutMs: number, speakCloserOnTimeout: boolean): void {
  cancelFollowUpTimeout();
  voiceRuntime.followUpTimeoutMs = timeoutMs;
  voiceRuntime.followUpTimer = window.setTimeout(() => {
    voiceRuntime.followUpTimer = undefined;
    voiceRuntime.followUpTimeoutMs = undefined;
    voiceRuntime.followUpListening = false;
    if (speakCloserOnTimeout) {
      speakQuickBrowserPhrase(pickRandom(activeVoiceRuntimeConfig.phrases.conversationClosers));
    }
    syncVoiceRuntimeUi();
  }, timeoutMs);
}

function refreshFollowUpTimeout(): void {
  if (!voiceRuntime.followUpListening) {
    return;
  }
  const timeoutMs = resolveFollowUpTimeoutMs(voiceRuntime.followUpTimeoutMs);
  armFollowUpTimeout(timeoutMs, false);
}

function startFollowUpListening(options?: {
  timeoutMs?: number;
  speakCloserOnTimeout?: boolean;
}): void {
  cancelFollowUpTimeout();
  const followUpTimeoutMs = resolveFollowUpTimeoutMs(options?.timeoutMs);
  const speakCloserOnTimeout = options?.speakCloserOnTimeout === true;
  const beginFollowUp = () => {
    voiceRuntime.followUpListening = true;
    armFollowUpTimeout(followUpTimeoutMs, speakCloserOnTimeout);
    syncVoiceRuntimeUi();
    void ensureWorkLiteVoiceLoopState("follow-up listening");
  };
  const waitStart = performance.now();
  const MAX_SPEECH_WAIT_MS = 30_000;
  const waitForSpeechEnd = () => {
    const synth = "speechSynthesis" in window ? window.speechSynthesis : undefined;
    const elapsed = performance.now() - waitStart;
    if (elapsed > MAX_SPEECH_WAIT_MS) {
      console.warn("[voice] waitForSpeechEnd timed out after", Math.round(elapsed), "ms â€” forcing resume");
      gailSpeechActive = false;
      if (synth) { synth.cancel(); }
      window.setTimeout(beginFollowUp, 200);
    } else if (gailSpeechActive || isBrowserSpeechBusy() || isWorkLiteSpeechBusy(activeSpeechState)) {
      window.setTimeout(waitForSpeechEnd, 200);
    } else {
      window.setTimeout(beginFollowUp, activeVoiceRuntimeConfig.timing.speechCooldownMs);
    }
  };
  waitForSpeechEnd();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeVoiceText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findWakeWordMatch(transcript: string, configuredWakeWord: string): WakeWordMatch | undefined {
  const normalizedTranscript = normalizeVoiceText(transcript);
  const normalizedWakeWord = normalizeVoiceText(configuredWakeWord);
  if (!normalizedTranscript || !normalizedWakeWord) {
    return undefined;
  }

  const configuredTokens = normalizedWakeWord.split(/\s+/).filter(Boolean).map(escapeRegex);
  if (configuredTokens.length > 0) {
    const configuredPattern = new RegExp(`\\b${configuredTokens.join("\\s+")}\\b`, "i");
    const configuredMatch = configuredPattern.exec(normalizedTranscript);
    if (configuredMatch) {
      return {
        matchedText: configuredMatch[0],
        afterWakeWord: normalizedTranscript.slice(configuredMatch.index + configuredMatch[0].length).trim(),
      };
    }
  }

  const aliasPattern = activeVoiceRuntimeConfig.phrases.wakeWordAliases
    .map((alias) => normalizeVoiceText(alias))
    .filter(Boolean)
    .map(escapeRegex)
    .join("|") || "gail";
  const prefixPattern = activeVoiceRuntimeConfig.phrases.wakePrefixes
    .map((prefix) => normalizeVoiceText(prefix))
    .filter(Boolean)
    .map(escapeRegex)
    .join("|") || "hey";
  const gailAliases = `(?:${aliasPattern})`;
  const wakePrefixPattern = new RegExp(`\\b(?:${prefixPattern})\\s+${gailAliases}\\b`, "i");
  const wakePrefixMatch = wakePrefixPattern.exec(normalizedTranscript);
  if (wakePrefixMatch) {
    return {
      matchedText: wakePrefixMatch[0],
      afterWakeWord: normalizedTranscript.slice(wakePrefixMatch.index + wakePrefixMatch[0].length).trim(),
    };
  }

  const shortGailOnlyPattern = new RegExp(`^${gailAliases}(?:\\s+|$)`, "i");
  const shortGailOnlyMatch = shortGailOnlyPattern.exec(normalizedTranscript);
  if (shortGailOnlyMatch && normalizedTranscript.split(/\s+/).filter(Boolean).length <= 6) {
    return {
      matchedText: shortGailOnlyMatch[0].trim(),
      afterWakeWord: normalizedTranscript.slice(shortGailOnlyMatch[0].length).trim(),
    };
  }

  return undefined;
}

function handleWorkLiteWakeWordTranscript(transcript: string, hasFinalResult: boolean): void {
  const wakeWord = state.wakeWord.trim().toLowerCase();
  if (!wakeWord) {
    return;
  }
  const wakeWordMatch = findWakeWordMatch(transcript, wakeWord);
  if (!wakeWordMatch) {
    return;
  }

  const afterWakeWord = wakeWordMatch.afterWakeWord.trim();
  if (afterWakeWord) {
    voiceRuntime.conversationBuffer = afterWakeWord;
    if (hasFinalResult) {
      scheduleWorkLiteVoiceSubmission({
        timeoutMs: activeVoiceRuntimeConfig.timing.wakeWordSubmitTimeoutMs,
      });
    } else {
      clearWorkLiteVoiceSilenceTimer();
    }
    return;
  }

  if (!hasFinalResult || voiceRuntime.followUpListening || state.conversationPending) {
    return;
  }

  // Wake-word-only utterance: acknowledge and open a short follow-up window.
  const acknowledgement = pickNonRepeatingRandom(activeVoiceRuntimeConfig.phrases.wakeAcknowledgements, lastWakeWordAcknowledgement);
  lastWakeWordAcknowledgement = acknowledgement;
  speakQuickBrowserPhrase(acknowledgement, () => {
    startFollowUpListening({
      timeoutMs: activeVoiceRuntimeConfig.timing.wakeWordFollowUpTimeoutMs,
      speakCloserOnTimeout: false,
    });
  });
}

function resolveVoiceSubmissionTimeoutMs(timeoutMs?: number): number {
  const fallbackFromSettings = Number.isFinite(state.silenceTimeoutMs)
    ? Number(state.silenceTimeoutMs)
    : activeVoiceRuntimeConfig.timing.defaultSubmitTimeoutMs;
  const selected = Number.isFinite(timeoutMs) ? Number(timeoutMs) : fallbackFromSettings;
  return Math.max(
    activeVoiceRuntimeConfig.timing.minSubmitTimeoutMs,
    Math.min(activeVoiceRuntimeConfig.timing.maxSubmitTimeoutMs, Math.round(selected)),
  );
}

function scheduleWorkLiteVoiceSubmission(options?: VoiceSubmissionOptions): void {
  clearWorkLiteVoiceSilenceTimer();
  const timeout = resolveVoiceSubmissionTimeoutMs(options?.timeoutMs);
  voiceRuntime.silenceTimer = window.setTimeout(() => {
    const content = voiceRuntime.conversationBuffer.trim();
    voiceRuntime.conversationBuffer = "";
    voiceRuntime.lastCommittedResultIndex = 0;
    voiceRuntime.silenceTimer = undefined;
    if (!content || state.conversationPending) {
      syncVoiceRuntimeUi();
      return;
    }
    if (options?.ambientGuard) {
      const rejectionReason = shouldRejectAmbientTranscript(content, options.confidenceSamples);
      if (rejectionReason) {
        voiceRuntime.lastTranscript = `ignored ambient: ${content}`;
        console.log(`[voice:ambient] Ignored transcript: ${rejectionReason}`, content.slice(0, 100));
        syncVoiceRuntimeUi();
        return;
      }
    }
    void sendWorkLiteMessage(content, "voice");
  }, timeout);
}

async function sendWorkLiteMessage(content: string, origin: "typed" | "voice"): Promise<void> {
  const message = content.trim();
  if (!message || state.conversationPending) {
    return;
  }
  let streamingRow: { inline?: HTMLElement; fullscreen?: HTMLElement } | undefined;

  clearWorkLiteVoiceSilenceTimer();
  cancelFollowUpTimeout();
  voiceRuntime.followUpListening = false;
  voiceRuntime.awaitingAssistant = isContinuousVoiceMode() && state.autoResumeAfterResponse;
  stopWorkLiteVoiceLoop();
  appendChatMessage("user", message);
  state.conversationPending = true;
  syncVoiceRuntimeUi();
  syncStatus(origin === "voice" ? "Sending voice message..." : "Sending message...");

  if (origin === "voice") {
    queueThinkingFiller(message);
  }

  try {
    const commandResult = await handleInlineCommandMessage(message);
    if (commandResult.handled) {
      if (commandResult.chatReply) {
        appendChatMessage("assistant", commandResult.chatReply);
      }
      syncStatus(state.sceneReady ? "Scene ready" : state.status);
      return;
    }

    const sessionId = await ensureConversationSession();
    streamingRow = appendChatMessage("assistant", "...");
    const reply = await postConversationMessageStreaming(sessionId, message, (partial) => {
      const text = partial.trim();
      if (!text) {
        return;
      }
      thinkingFillerActive = false;
      if (streamingRow?.inline) {
        streamingRow.inline.textContent = text;
      }
      if (streamingRow?.fullscreen) {
        streamingRow.fullscreen.textContent = text;
      }
    });
    const finalReply = reply.trim() || "Response received with no assistant text.";
    if (streamingRow?.inline) {
      streamingRow.inline.textContent = finalReply;
    }
    if (streamingRow?.fullscreen) {
      streamingRow.fullscreen.textContent = finalReply;
    }
    stageRuntime?.mechanics?.pulseAck();
    syncStatus(state.sceneReady ? "Scene ready" : state.status);
  } catch (error) {
    state.conversationSessionId = undefined;
    if (streamingRow?.inline) {
      streamingRow.inline.textContent = "Request failed.";
    }
    if (streamingRow?.fullscreen) {
      streamingRow.fullscreen.textContent = "Request failed.";
    }
    appendChatMessage("system", `Chat error: ${error instanceof Error ? error.message : String(error)}`);
    syncStatus("Chat error");
  } finally {
    clearThinkingFillerTimer();
    thinkingFillerActive = false;
    state.conversationPending = false;
    voiceRuntime.awaitingAssistant = false;
    syncVoiceRuntimeUi();
    const shouldAutoResumeVoice = isContinuousVoiceMode() && state.autoResumeAfterResponse;
    if (shouldAutoResumeVoice && origin === "voice") {
      startFollowUpListening({
        speakCloserOnTimeout: false,
      });
    } else if (shouldAutoResumeVoice) {
      void ensureWorkLiteVoiceLoopState("post-response resume");
    }
    // Safety net: if recognition still hasn't restarted after speech + cooldown, force it
    window.setTimeout(() => {
      if (!voiceRuntime.active && !voiceRuntime.recognition && !state.conversationPending && isContinuousVoiceMode()) {
        console.log("[voice] Safety net: recognition not active after response â€” forcing restart");
        void ensureWorkLiteVoiceLoopState("post-response safety net");
      }
    }, 10_000);
  }
}

function resolvePersonaVoiceCommand(lowerFull: string): "normal" | "private_counselor" | "private_girlfriend" | null {
  if (/\b(switch to normal|normal mode|be gail|be yourself)\b/.test(lowerFull)) {
    return "normal";
  }

  if (/\b(switch to vera|be vera|talk to vera|vera mode|switch to counselor|counselor mode|be lucy|talk to lucy)\b/.test(lowerFull)) {
    return "private_counselor";
  }

  if (
    /\b(switch to cherry|be cherry|talk to cherry|cherry mode|switch to girlfriend|girlfriend mode)\b/.test(lowerFull)
    || /\b(switch(?:\s+to)?\s+explicit|explicit mode|go explicit|adult mode|nsfw mode)\b/.test(lowerFull)
  ) {
    return "private_girlfriend";
  }

  return null;
}

async function handleInlineCommandMessage(message: string): Promise<{ handled: boolean; chatReply?: string }> {
  const lowerFull = message.toLowerCase();

  if (/\b(shut up|stop talking|be quiet|enough|stop it|hush|silence)\b/.test(lowerFull)) {
    stageRuntime?.mechanics?.stopSpeech();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    gailSpeechActive = false;
    speechEndedAt = performance.now();
    return { handled: true, chatReply: "Okay, stopping." };
  }

  if (/\b(always listen|listen always|keep listening|stay listening|continuous listening|always on)\b/.test(lowerFull)) {
    if (state.voiceMode !== "always_listening") {
      state.voiceMode = "always_listening";
      void updateVoiceSettings({ mode: "always_listening" } as VoiceSettingsResponse).catch(() => {});
      speakQuickBrowserPhrase("Always listening now. Just talk to me.");
      syncVoiceRuntimeUi();
      return { handled: true, chatReply: "Always-listening mode enabled." };
    } else {
      speakQuickBrowserPhrase("I'm already listening.");
      syncVoiceRuntimeUi();
      return { handled: true, chatReply: "Already in always-listening mode." };
    }
  }

  if (/\b(wake word only|wake word mode|stop always listening|stop listening)\b/.test(lowerFull)) {
    if (state.voiceMode !== "wake_word") {
      state.voiceMode = "wake_word";
      void updateVoiceSettings({ mode: "wake_word" } as VoiceSettingsResponse).catch(() => {});
      speakQuickBrowserPhrase(`Back to wake word mode. Say ${state.wakeWord} to get my attention.`);
      syncVoiceRuntimeUi();
      return { handled: true, chatReply: "Wake-word mode enabled." };
    } else {
      speakQuickBrowserPhrase("I'm already on wake word mode.");
      syncVoiceRuntimeUi();
      return { handled: true, chatReply: "Already in wake-word mode." };
    }
  }

  if (/\b(what do you see|look at this|what am i holding|describe what you see|what are you looking at|what can you see)\b/.test(lowerFull)) {
    void captureAndAnalyzeFrame(message);
    return { handled: true, chatReply: "Looking now..." };
  }

  const personaVoiceMatch = resolvePersonaVoiceCommand(lowerFull);
  if (personaVoiceMatch) {
    await switchToPersona(personaVoiceMatch);
    return { handled: true, chatReply: `Switched to ${PERSONA_LABELS[personaVoiceMatch] ?? personaVoiceMatch}.` };
  }

  if (DANCE_START_COMMAND.test(lowerFull)) {
    if (state.activePrivatePersona !== "private_girlfriend") {
      await switchToPersona("private_girlfriend");
    }
    const started = await handleDanceCommand();
    return {
      handled: true,
      chatReply: started
        ? "Dance mode on."
        : "Dance setup is still loading. Try again in a moment.",
    };
  }

  if (DANCE_DELETE_COMMAND.test(lowerFull)) {
    if (danceActive && lastWorkingDanceFile) {
      const forgotten = lastWorkingDanceFile;
      danceBlacklist.add(forgotten);
      // Remove from current playlist so it won't come up again this session
      const idx = dancePlaylist.indexOf(forgotten);
      if (idx >= 0) {
        dancePlaylist.splice(idx, 1);
        if (dancePlaylistIndex >= dancePlaylist.length) dancePlaylistIndex = 0;
      }
      saveDanceBlacklist();
      const remaining = DANCE_ANIMATION_FILES.length - danceBlacklist.size;
      const changed = await changeDance("next");
      if (!changed) {
        stopDance();
        speakQuickBrowserPhrase("Okay, dropping that one.");
      } else {
        speakQuickBrowserPhrase("Got it, skipping that one.");
      }
      return { handled: true, chatReply: `Removed from playlist. ${remaining} dance${remaining !== 1 ? "s" : ""} remaining.` };
    }
    return { handled: true, chatReply: "No dance is currently active to remove." };
  }

  if (DANCE_NEXT_COMMAND.test(lowerFull)) {
    if (!danceActive) {
      return { handled: false };
    }
    const changed = await changeDance("next");
    if (changed) {
      speakQuickBrowserPhrase("Here we go.");
    }
    return { handled: true, chatReply: changed ? "Next dance." : "Couldn't load next dance — try again." };
  }

  if (DANCE_PREV_COMMAND.test(lowerFull)) {
    if (!danceActive) {
      return { handled: false };
    }
    const changed = await changeDance("prev");
    if (changed) {
      speakQuickBrowserPhrase("Going back.");
    }
    return { handled: true, chatReply: changed ? "Previous dance." : "Couldn't load previous dance — try again." };
  }

  if (DANCE_RESTORE_COMMAND.test(lowerFull)) {
    danceBlacklist.clear();
    saveDanceBlacklist();
    return { handled: true, chatReply: `Dance playlist restored — all ${DANCE_ANIMATION_FILES.length} dances available.` };
  }

  if (DANCE_STOP_COMMAND.test(lowerFull) && danceActive) {
    stopDance();
    speakQuickBrowserPhrase("Okay, back to normal.");
    return { handled: true, chatReply: "Stopped dancing." };
  }

  return { handled: false };
}

function startVoiceSettingsSync(): void {
  if (voiceSettingsSyncHandle !== undefined) {
    return;
  }
  const refresh = async () => {
    try {
      const [runtimeSettings, voiceSettings, providerStatus, localLlmConfig, deviceProfiles] = await Promise.all([
        fetchJson<RuntimeSettingsResponse>("/client/runtime-settings"),
        fetchJson<VoiceSettingsResponse>("/voice/settings"),
        fetchJson<ProviderStatusResponse>("/providers/status"),
        fetchJson<LocalLlmConfigResponse>("/providers/local-llm-config"),
        fetchJson<DeviceDisplayProfilesResponse>("/client/device-display-profiles"),
      ]);
      state.activeAvatarSystem = runtimeSettings.activeAvatarSystem?.trim() || state.activeAvatarSystem || "unknown";
      state.activeAssetRoot = resolveEffectiveAssetRoot(runtimeSettings.activeAssetRoot?.trim() || state.activeAssetRoot || DEFAULT_ASSET_ROOT);
      state.displayInputMode = runtimeSettings.displayInputMode ?? state.displayInputMode ?? "wake_word";
      applyBodyMorphControlSettings(runtimeSettings);
      applyVoiceSettingsState(voiceSettings);
      const providers = Array.isArray(providerStatus) ? providerStatus : [];
      state.providerSummary = providers.map((item) => `${item.provider}:${item.available === true ? "up" : "down"}`).join(" | ") || "unknown";
      state.localModel = localLlmConfig.effectiveModel?.trim() || localLlmConfig.model?.trim() || state.localModel || "dolphin-mistral:7b";
      state.localTimeoutMs = localLlmConfig.timeoutMs ?? state.localTimeoutMs ?? 120000;
      const incomingPersona = localLlmConfig.activePrivatePersona?.trim() || "normal";
      if (incomingPersona !== state.activePrivatePersona) {
        // Lock startup behavior: if this client is in normal mode, do not accept
        // an external non-normal persona push from persisted backend state.
        if (!ALLOW_PERSISTED_PRIVATE_PERSONA && state.activePrivatePersona === "normal" && incomingPersona !== "normal") {
          console.log("[persona] Ignoring external non-normal persona; enforcing normal mode on this client");
          await ensureNormalPersonaOnLoad();
          syncPersonaSelectorUi();
          return;
        }
        // Persona changed externally (e.g. from shell) â€” switch avatar
        state.conversationSessionId = undefined;
        void switchToPersona(incomingPersona);
        return; // switchToPersona will re-set state; skip the rest of this refresh
      }
      applyDeviceDisplayProfileState(deviceProfiles);
      syncVoiceToggleUi(state.preferLocalVoice);
      syncVoiceRuntimeUi();
      void ensureWorkLiteVoiceLoopState("settings sync");
    } catch (err) {
      console.warn("[settings-sync] refresh failed:", err);
    }
  };
  voiceSettingsSyncHandle = window.setInterval(() => {
    void refresh().catch((err) => console.warn("[settings-sync] interval refresh failed:", err));
  }, 15000);
  window.addEventListener("focus", () => {
    void refresh().catch((err) => console.warn("[settings-sync] focus refresh failed:", err));
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void refresh().catch((err) => console.warn("[settings-sync] visibility refresh failed:", err));
    }
  });
}

async function bootStage(root: HTMLElement): Promise<void> {
  syncStatus("Loading runtime settings...");
  const assetRoot = await resolveAssetRoot();
  syncStatus("Loading asset manifest...");
  const manifest = await fetchJson<AssetManifestResponse>(`/client/asset-manifest?assetRoot=${encodeURIComponent(assetRoot)}`);
  state.activeAssetRoot = manifest.selectedAssetRoot?.trim() || assetRoot || state.activeAssetRoot;
  try {
    const deviceProfiles = await fetchJson<DeviceDisplayProfilesResponse>("/client/device-display-profiles");
    applyDeviceDisplayProfileState(deviceProfiles);
  } catch (error) {
    console.warn("[stage] Device display profile fetch failed; using camera defaults", error);
  }
  let selectedEnvironmentProfile: EnvironmentProfile | undefined;
  try {
    const environmentProfiles = await fetchJson<EnvironmentProfilesResponse>(getEnvironmentProfilesUrl());
    selectedEnvironmentProfile = resolveEnvironmentProfile(environmentProfiles, state.selectedSceneId);
  } catch (error) {
    console.warn("[stage] Environment profile fetch failed; continuing without environment scene", error);
  }
  const environmentStorageScope = getEnvironmentStorageScope(
    selectedEnvironmentProfile?.id ?? state.selectedSceneId,
    selectedEnvironmentProfile?.tuningStorageVersion,
  );
  const canvas = root.querySelector<HTMLCanvasElement>("#stage-canvas");
  if (!canvas) {
    throw new Error("Missing stage canvas.");
  }

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    console.error("Work-lite WebGL context lost.");
    syncStatus("WebGL context lost while loading avatar.");
    state.avatarMotionSummary = "webgl context lost";
    syncAvatarMotionOverlay();
  });

  canvas.addEventListener("webglcontextrestored", () => {
    console.info("Work-lite WebGL context restored.");
    syncStatus("WebGL context restored. Reload may be required.");
  });

  const playcanvasUrl = "/vendor/playcanvas/build/playcanvas.mjs";
  const pc: any = await import(playcanvasUrl);
  const app = new pc.Application(canvas, {
    graphicsDeviceOptions: {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: false,
    },
  });
  app.setCanvasFillMode(pc.FILLMODE_NONE);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.start();
  app.scene.ambientLight = new pc.Color(...STAGE_AMBIENT_COLOR);

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth);
    const height = Math.max(1, canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    app.resizeCanvas(width, height);
  };
  resize();
  window.addEventListener("resize", resize);

  const camera = new pc.Entity("zip-camera");
  camera.addComponent("camera", {
    clearColor: new pc.Color(...STAGE_CLEAR_COLOR),
    fov: 45,
    nearClip: 0.1,
    farClip: 1000,
  });
  camera.setLocalPosition(...STAGE_CAMERA_POSITION);
  camera.setLocalEulerAngles(...STAGE_CAMERA_EULER);
  app.root.addChild(camera);

  const floor = new pc.Entity("zip-floor");
  floor.addComponent("render", {
    type: "plane",
    castShadows: true,
    castShadowsLightmap: true,
    receiveShadows: true,
  });
  floor.setLocalScale(...FLOOR_SCALE);
  app.root.addChild(floor);

  let environmentAvatarStandPosition: Vector3Tuple | undefined;

  const keyLight = new pc.Entity("zip-key-light");
  keyLight.addComponent("light", {
    type: "directional",
    color: new pc.Color(1, 1, 1),
    intensity: KEY_LIGHT_INTENSITY,
    affectSpecularity: false,
    castShadows: true,
    shadowUpdateMode: 2,
    vsmBlurSize: 11,
    normalOffsetBias: 0.05,
    shadowBias: 0.2,
    shadowResolution: 1024,
    shadowDistance: 16,
  });
  keyLight.setLocalPosition(...KEY_LIGHT_POSITION);
  keyLight.setLocalEulerAngles(...KEY_LIGHT_EULER);
  app.root.addChild(keyLight);

  const fillLight = new pc.Entity("zip-fill-light");
  fillLight.addComponent("light", {
    type: "point",
    color: new pc.Color(1, 1, 1),
    intensity: FILL_LIGHT_INTENSITY,
    affectSpecularity: false,
    range: FILL_LIGHT_RANGE,
    castShadows: false,
  });
  fillLight.setLocalPosition(...FILL_LIGHT_POSITION);
  fillLight.setLocalEulerAngles(...FILL_LIGHT_EULER);
  app.root.addChild(fillLight);

  const interiorLight = new pc.Entity("zip-interior-light");
  interiorLight.addComponent("light", {
    type: "point",
    color: new pc.Color(...INTERIOR_LIGHT_COLOR),
    intensity: 0,
    affectSpecularity: false,
    range: 10,
    castShadows: false,
  });
  interiorLight.enabled = false;
  app.root.addChild(interiorLight);

  const ceilingFloodLight = new pc.Entity("zip-ceiling-flood-light");
  ceilingFloodLight.addComponent("light", {
    type: "point",
    color: new pc.Color(...CEILING_FLOOD_LIGHT_NIGHT_COLOR),
    intensity: CEILING_FLOOD_LIGHT_NIGHT_INTENSITY,
    affectSpecularity: false,
    range: 24,
    castShadows: false,
  });
  ceilingFloodLight.enabled = false;
  app.root.addChild(ceilingFloodLight);

  const roofDownFloodLights: any[] = [];
  for (let index = 0; index < 12; index += 1) {
    const roofLight = new pc.Entity(`zip-roof-down-flood-${index + 1}`);
    roofLight.addComponent("light", {
      type: "point",
      color: new pc.Color(...ROOF_DOWNLIGHT_NIGHT_COLOR),
      intensity: ROOF_DOWNLIGHT_NIGHT_INTENSITY,
      affectSpecularity: false,
      range: 16,
      castShadows: false,
    });
    roofLight.enabled = false;
    roofDownFloodLights.push(roofLight);
    app.root.addChild(roofLight);
  }

  const wallFillLights: any[] = [];
  const wallFillNames = ["zip-wall-fill-left", "zip-wall-fill-right", "zip-wall-fill-front", "zip-wall-fill-back"];
  for (const wallName of wallFillNames) {
    const wallFill = new pc.Entity(wallName);
    wallFill.addComponent("light", {
      type: "point",
      color: new pc.Color(...WALL_FILL_LIGHT_NIGHT_COLOR),
      intensity: WALL_FILL_LIGHT_NIGHT_INTENSITY,
      affectSpecularity: false,
      range: 22,
      castShadows: false,
    });
    wallFill.enabled = false;
    wallFillLights.push(wallFill);
    app.root.addChild(wallFill);
  }

  const roomWashLights: any[] = [];
  ROOM_WASH_LIGHT_EULERS.forEach((euler, index) => {
    const roomWashLight = new pc.Entity(`zip-room-wash-${index + 1}`);
    roomWashLight.addComponent("light", {
      type: "directional",
      color: new pc.Color(...ROOM_WASH_LIGHT_NIGHT_COLOR),
      intensity: ROOM_WASH_LIGHT_NIGHT_INTENSITY,
      affectSpecularity: false,
      castShadows: false,
    });
    roomWashLight.setLocalEulerAngles(...euler);
    roomWashLight.enabled = false;
    roomWashLights.push(roomWashLight);
    app.root.addChild(roomWashLight);
  });

  const centerWashLights: any[] = [];
  for (let index = 0; index < 2; index += 1) {
    const centerWashLight = new pc.Entity(`zip-center-wash-${index + 1}`);
    centerWashLight.addComponent("light", {
      type: "point",
      color: new pc.Color(...CENTER_WASH_LIGHT_NIGHT_COLOR),
      intensity: CENTER_WASH_LIGHT_NIGHT_INTENSITY,
      falloffMode: 0,
      affectSpecularity: false,
      range: 50,
      castShadows: false,
    });
    centerWashLight.enabled = false;
    centerWashLights.push(centerWashLight);
    app.root.addChild(centerWashLight);
  }

  const cornerFillLights: any[] = [];
  for (let index = 0; index < 10; index += 1) {
    const cornerLight = new pc.Entity(`zip-corner-fill-${index + 1}`);
    cornerLight.addComponent("light", {
      type: "point",
      color: new pc.Color(...CENTER_WASH_LIGHT_NIGHT_COLOR),
      intensity: CENTER_WASH_LIGHT_NIGHT_INTENSITY * 0.9,
      falloffMode: 0,
      affectSpecularity: false,
      range: 40,
      castShadows: false,
    });
    cornerLight.enabled = false;
    cornerFillLights.push(cornerLight);
    app.root.addChild(cornerLight);
  }

  const dayInteriorBounceLight = new pc.Entity("zip-day-interior-bounce-light");
  dayInteriorBounceLight.addComponent("light", {
    type: "point",
    color: new pc.Color(...DAY_INTERIOR_BOUNCE_LIGHT_COLOR),
    intensity: DAY_INTERIOR_BOUNCE_LIGHT_INTENSITY,
    affectSpecularity: false,
    range: 22,
    castShadows: false,
  });
  dayInteriorBounceLight.enabled = false;
  app.root.addChild(dayInteriorBounceLight);

  const daySunLight = new pc.Entity("zip-day-sun-light");
  daySunLight.addComponent("light", {
    type: "directional",
    color: new pc.Color(...DAY_SUN_LIGHT_COLOR),
    intensity: DAY_SUN_LIGHT_INTENSITY,
    affectSpecularity: false,
    castShadows: true,
    shadowUpdateMode: 2,
    vsmBlurSize: 11,
    normalOffsetBias: 0.05,
    shadowBias: 0.2,
    shadowResolution: 1024,
    shadowDistance: 18,
  });
  daySunLight.setLocalEulerAngles(...DAY_SUN_LIGHT_EULER);
  daySunLight.enabled = false;
  app.root.addChild(daySunLight);

  const daySkyLight = new pc.Entity("zip-day-sky-light");
  daySkyLight.addComponent("light", {
    type: "directional",
    color: new pc.Color(...DAY_SKY_LIGHT_COLOR),
    intensity: DAY_SKY_LIGHT_INTENSITY,
    affectSpecularity: false,
    castShadows: false,
  });
  daySkyLight.setLocalEulerAngles(...DAY_SKY_LIGHT_EULER);
  daySkyLight.enabled = false;
  app.root.addChild(daySkyLight);

  const dayFloodLight = new pc.Entity("zip-day-flood-light");
  dayFloodLight.addComponent("light", {
    type: "point",
    color: new pc.Color(...DAY_FLOOD_LIGHT_COLOR),
    intensity: DAY_FLOOD_LIGHT_INTENSITY,
    affectSpecularity: false,
    castShadows: false,
    range: 20,
  });
  dayFloodLight.enabled = false;
  app.root.addChild(dayFloodLight);

  const dayFillFloodLight = new pc.Entity("zip-day-fill-flood-light");
  dayFillFloodLight.addComponent("light", {
    type: "point",
    color: new pc.Color(...DAY_FILL_FLOOD_LIGHT_COLOR),
    intensity: DAY_FILL_FLOOD_LIGHT_INTENSITY,
    affectSpecularity: false,
    castShadows: false,
    range: 18,
  });
  dayFillFloodLight.enabled = false;
  app.root.addChild(dayFillFloodLight);

  const dayRoofFloodLight = new pc.Entity("zip-day-roof-flood-light");
  dayRoofFloodLight.addComponent("light", {
    type: "point",
    color: new pc.Color(...DAY_ROOF_FLOOD_LIGHT_COLOR),
    intensity: DAY_ROOF_FLOOD_LIGHT_INTENSITY,
    affectSpecularity: false,
    castShadows: false,
    range: 18,
  });
  dayRoofFloodLight.enabled = false;
  app.root.addChild(dayRoofFloodLight);

  const stageRoot = new pc.Entity("avatar-stage-root");
  app.root.addChild(stageRoot);
  const avatarRoot = new pc.Entity("avatar-assembly-root");
  stageRoot.addChild(avatarRoot);
  let dayBackdropShell: any | undefined;

  if (selectedEnvironmentProfile?.dayBackdropImagePath) {
    try {
      dayBackdropShell = await createBackdropShellEntity(
        pc,
        app,
        `${selectedEnvironmentProfile.id}-day-backdrop-shell`,
        buildVersionedStaticClientAssetUrl(selectedEnvironmentProfile.dayBackdropImagePath, `${selectedEnvironmentProfile.id}-backdrop-shell`),
        45000,
      );
      stageRoot.addChild(dayBackdropShell);
    } catch (error) {
      console.warn(`[stage-env] Failed to load backdrop for ${selectedEnvironmentProfile.id}`, error);
    }
  }

  if (selectedEnvironmentProfile?.assetPath) {
    syncStatus(`Loading ${selectedEnvironmentProfile.label ?? selectedEnvironmentProfile.id}...`);
    try {
      const environmentEntity = await loadContainerEntityWithRetry(
        pc,
        app,
        selectedEnvironmentProfile.label?.trim() || selectedEnvironmentProfile.id,
        buildVersionedStaticClientAssetUrl(selectedEnvironmentProfile.assetPath, selectedEnvironmentProfile.id),
        180000,
        3,
      );
      environmentEntity.setLocalScale(1, 1, 1);
      environmentEntity.setLocalEulerAngles(0, 0, 0);
      tuneEnvironmentGlassMaterials(pc, environmentEntity);
      stageRoot.addChild(environmentEntity);
      const environmentBounds = measureFilteredRenderBounds(environmentEntity, {
        ignoreEntityNames: new Set(selectedEnvironmentProfile.boundsIgnoreEntityNames ?? []),
        ignoreParentNames: new Set(selectedEnvironmentProfile.boundsIgnoreParentNames ?? []),
      });
      if (environmentBounds) {
        const environmentAlign = getCenterFloorAlignment(environmentBounds);
        const environmentTuning = getSavedEnvironmentTuning(environmentStorageScope);
        const roomWidth = Math.max(0.001, environmentBounds.maxX - environmentBounds.minX);
        const roomHeight = Math.max(0.001, environmentBounds.maxY - environmentBounds.minY);
        const roomDepth = Math.max(0.001, environmentBounds.maxZ - environmentBounds.minZ);
        const interiorLightHeight = Math.min(4.6, Math.max(2.8, roomHeight * 0.35));
        const interiorLightRange = Math.min(18, Math.max(10, Math.max(roomWidth, roomDepth) * 0.85));
        interiorLight.setLocalPosition(0, interiorLightHeight, 0.75);
        interiorLight.light.intensity = INTERIOR_LIGHT_INTENSITY;
        interiorLight.light.range = interiorLightRange;
        interiorLight.enabled = true;
        console.info(`[stage-env] ${selectedEnvironmentProfile.id} bounds ${JSON.stringify(environmentBounds)}`);
        console.info(`[stage-env] ${selectedEnvironmentProfile.id} align ${JSON.stringify(environmentAlign)}`);
        console.info(`[stage-env] ${selectedEnvironmentProfile.id} interior light ${JSON.stringify({ height: interiorLightHeight, range: interiorLightRange })}`);
        stageRuntime = {
          ...(stageRuntime ?? { pc, app, camera, canvas, align: { x: 0, y: 0, z: 0 } }),
          environmentProfileId: selectedEnvironmentProfile.id,
          environmentStorageScope,
          environmentEntity,
          environmentBounds,
          environmentBasePosition: [environmentAlign.x, environmentAlign.y, environmentAlign.z],
          environmentTuning,
          keyLight,
          fillLight,
          interiorLight,
          ceilingFloodLight,
          roofDownFloodLights,
          wallFillLights,
          roomWashLights,
          centerWashLights,
          dayInteriorBounceLight,
          daySunLight,
          daySkyLight,
          dayFloodLight,
          dayFillFloodLight,
          dayRoofFloodLight,
          dayBackdropShell,
        };
        applyEnvironmentTuning(stageRuntime);
        syncTimeOfDayLighting(stageRuntime);
        const standNames = selectedEnvironmentProfile.avatarStandEntityNames;
        if (Array.isArray(standNames) && standNames.length > 0) {
          const standBounds = measureNamedRenderBounds(environmentEntity, new Set(standNames));
          if (standBounds) {
            environmentAvatarStandPosition = [
              (standBounds.minX + standBounds.maxX) * 0.5,
              standBounds.maxY,
              (standBounds.minZ + standBounds.maxZ) * 0.5,
            ];
            console.info(`[stage-env] ${selectedEnvironmentProfile.id} avatar stand ${JSON.stringify(environmentAvatarStandPosition)}`);
          } else {
            console.warn(`[stage-env] Avatar stand bounds not found for ${selectedEnvironmentProfile.id}: ${standNames.join(", ")}`);
          }
        }
        if (selectedEnvironmentProfile.hideGeneratedFloor) {
          floor.enabled = false;
        }
      } else {
        console.warn(`[stage-env] Unable to derive filtered bounds for ${selectedEnvironmentProfile.id}; leaving generated floor enabled.`);
      }
    } catch (error) {
      console.error(`[stage-env] Failed to load environment ${selectedEnvironmentProfile.id}`, error);
    }
  }

  const personaMapping = getPersonaAvatarMapping(manifest, state.activePrivatePersona ?? "normal");
  const bodyAsset = pickBundleAsset(manifest.assets ?? [], personaMapping.bodyAssetId, "avatar")
    ?? pickBundleAsset(manifest.assets ?? [], "base_avatar", "avatar", "base");
  if (!bodyAsset?.resolvedPath) {
    throw new Error("Base avatar bundle body is missing from the manifest.");
  }
  if ((bodyAsset.fileSizeBytes ?? 0) >= OVERSIZED_ASSET_BYTES) {
    const bodySizeMb = Math.round((bodyAsset.fileSizeBytes ?? 0) / (1024 * 1024));
    syncStatus(`Loading bundle body... large asset ${bodySizeMb} MB`);
  }

  const displayAssets = getDisplayAssets(assetRoot, manifest, bodyAsset.id, state.activePrivatePersona);

  syncStatus("Loading bundle body...");
  const bodyEntity = await loadContainerEntityWithRetry(
    pc,
    app,
    "bundle body",
    toVersionedClientAssetUrl(bodyAsset),
    getAssetLoadTimeoutMs(bodyAsset, 300000),
    3,
  );
  bodyEntity.setLocalEulerAngles(0, 0, 0);
  flattenEntityMaterials(pc, bodyEntity, "body");
  avatarRoot.addChild(bodyEntity);
  const skeletonRoot = resolveSkeletonRoot(bodyEntity);
  rebindEntityRenderRootBone(bodyEntity, skeletonRoot);

  const speechMorphTargets = collectSpeechMorphTargets(bodyEntity);
  const eyeMorphTargets = collectEyeMorphTargets(bodyEntity);
  const excludedFaceMorphKeys = collectFaceMorphKeys(speechMorphTargets, eyeMorphTargets);
  const bodyMorphTargets = collectBodyMorphTargets(bodyEntity, excludedFaceMorphKeys);
  const bodyMorphKeys = Array.from(new Set(bodyMorphTargets.flatMap((target) => target.keys))).sort((a, b) => a.localeCompare(b));

  // Log all discovered body morph keys so we can see exact names in the browser console.
  console.log(`[morph-scan] ${bodyMorphKeys.length} body morph keys discovered:`, bodyMorphKeys);

  // Breast morph keys: any body morph whose name matches common DAZ/Genesis breast physics naming.
  // Categorized by direction so each phase of the oscillation drives the right morph.
  // NOTE: If this array is empty after setup, check the console log above for the real key names.
  type BreastMorphEntry = { instance: any; key: string; phase: "bipolar-ud" | "side" | "inout" | "up" | "down" };
  const BREAST_RE = /pCTRLBreast|pCTRLrBreast|pCTRLlBreast|breast|boob|bust/i;
  // Deduplicate by (instance reference, key) — findComponents can traverse the same instance
  // multiple times through the entity hierarchy, producing ~18x duplicates per unique entry.
  const seenBreastEntries = new Set<string>();
  const breastMorphEntries: BreastMorphEntry[] = bodyMorphTargets.flatMap((target) =>
    target.keys
      .filter((k) => BREAST_RE.test(k))
      .flatMap((key): BreastMorphEntry[] => {
        // Use object identity index via a WeakMap to deduplicate instances.
        const dedupeKey = `${target.instance?._id ?? target.instance}::${key}`;
        if (seenBreastEntries.has(dedupeKey)) return [];
        seenBreastEntries.add(dedupeKey);
        const lower = key.toLowerCase();
        // Bipolar Up-Down: key contains both up and down (e.g. pCTRLBreastsUp-Down).
        // DAZ convention: 0.5 = rest, 1.0 = full up, 0.0 = full down. Oscillate around 0.5.
        const hasUp = /up/i.test(lower);
        const hasDown = /down/i.test(lower);
        const phase: BreastMorphEntry["phase"] =
          hasUp && hasDown ? "bipolar-ud"
          : hasUp ? "up"
          : hasDown ? "down"
          : /side/i.test(lower) ? "side"
          : /in.*out|out.*in/i.test(lower) ? "inout"
          : "bipolar-ud"; // fallback: treat as bipolar vertical
        return [{ instance: target.instance, key, phase }];
      })
  );

  if (breastMorphEntries.length === 0 && bodyMorphKeys.length > 0) {
    console.warn(
      `[morph-scan] No breast morphs matched. Check the key list above and update BREAST_RE if needed.\n` +
      `Hint: keys containing numbers or prefixes like pCTRL, CTRLBreast, BreastF, etc.`
    );
  } else {
    console.log(`[morph-scan] ${breastMorphEntries.length} breast morph entries (deduplicated):`,
      breastMorphEntries.map((e) => `${e.key} [${e.phase}]`));
  }
  const eyelidRigNodes = collectEyelidRigNodes(bodyEntity);
  const findAnyNamedEntity = (...names: string[]) => names.map((name) => findEntityByName(bodyEntity, name)).find(Boolean);
  const headBone = findEntityByName(bodyEntity, "head");
  const neckBone = findEntityByName(bodyEntity, "neckUpper") ?? findEntityByName(bodyEntity, "neckLower");
  const spineBone = findEntityByName(bodyEntity, "spine1") ?? findEntityByName(bodyEntity, "spineUpper") ?? findEntityByName(bodyEntity, "spine");
  const jawBone = findAnyNamedEntity("jaw", "Jaw", "jaw_master", "JawMaster");
  const lShoulderBone = findAnyNamedEntity("lShoulder", "LeftShoulder", "shoulder_l", "clavicle_l", "Clavicle_L");
  const rShoulderBone = findAnyNamedEntity("rShoulder", "RightShoulder", "shoulder_r", "clavicle_r", "Clavicle_R");
  const lUpperArmBone = findAnyNamedEntity("lUpperArm", "LeftArm", "upperarm_l", "UpperArm_L", "lArm");
  const rUpperArmBone = findAnyNamedEntity("rUpperArm", "RightArm", "upperarm_r", "UpperArm_R", "rArm");
  const lForeArmBone = findAnyNamedEntity("lForeArm", "lForearm", "LeftForeArm", "lowerarm_l", "ForeArm_L");
  const rForeArmBone = findAnyNamedEntity("rForeArm", "rForearm", "RightForeArm", "lowerarm_r", "ForeArm_R");
  const lEyeBone = findEntityByName(bodyEntity, "lEye") ?? findEntityByName(bodyEntity, "LeftEye") ?? findEntityByName(bodyEntity, "Eye_L");
  const rEyeBone = findEntityByName(bodyEntity, "rEye") ?? findEntityByName(bodyEntity, "RightEye") ?? findEntityByName(bodyEntity, "Eye_R");
  const headBaseAngles = headBone?.getLocalEulerAngles ? headBone.getLocalEulerAngles() : undefined;
  const neckBaseAngles = neckBone?.getLocalEulerAngles ? neckBone.getLocalEulerAngles() : undefined;
  const spineBaseAngles = spineBone?.getLocalEulerAngles ? { ...spineBone.getLocalEulerAngles() } : undefined;
  const jawBaseAngles = jawBone?.getLocalEulerAngles ? { ...jawBone.getLocalEulerAngles() } : undefined;
  const lShoulderBaseAngles = lShoulderBone?.getLocalEulerAngles ? { ...lShoulderBone.getLocalEulerAngles() } : undefined;
  const rShoulderBaseAngles = rShoulderBone?.getLocalEulerAngles ? { ...rShoulderBone.getLocalEulerAngles() } : undefined;
  const lUpperArmBaseAngles = lUpperArmBone?.getLocalEulerAngles ? { ...lUpperArmBone.getLocalEulerAngles() } : undefined;
  const rUpperArmBaseAngles = rUpperArmBone?.getLocalEulerAngles ? { ...rUpperArmBone.getLocalEulerAngles() } : undefined;
  const lForeArmBaseAngles = lForeArmBone?.getLocalEulerAngles ? { ...lForeArmBone.getLocalEulerAngles() } : undefined;
  const rForeArmBaseAngles = rForeArmBone?.getLocalEulerAngles ? { ...rForeArmBone.getLocalEulerAngles() } : undefined;

  // Fix cross-eyed default pose: rotate each eye outward
  const EYE_YAW_CORRECTION = 4.0;  // degrees outward per eye
  const lEyeBaseAngles = lEyeBone?.getLocalEulerAngles ? { ...lEyeBone.getLocalEulerAngles() } : undefined;
  const rEyeBaseAngles = rEyeBone?.getLocalEulerAngles ? { ...rEyeBone.getLocalEulerAngles() } : undefined;
  if (lEyeBone && lEyeBaseAngles) {
    lEyeBone.setLocalEulerAngles(lEyeBaseAngles.x, lEyeBaseAngles.y + EYE_YAW_CORRECTION, lEyeBaseAngles.z);
    console.info(`[eye-fix] lEye base angles: ${JSON.stringify(lEyeBaseAngles)} â†’ yaw +${EYE_YAW_CORRECTION}Â°`);
  }
  if (rEyeBone && rEyeBaseAngles) {
    rEyeBone.setLocalEulerAngles(rEyeBaseAngles.x, rEyeBaseAngles.y - EYE_YAW_CORRECTION, rEyeBaseAngles.z);
    console.info(`[eye-fix] rEye base angles: ${JSON.stringify(rEyeBaseAngles)} â†’ yaw -${EYE_YAW_CORRECTION}Â°`);
  }
  if (!lEyeBone && !rEyeBone) {
    console.warn("[eye-fix] No eye bones found (tried lEye, LeftEye, Eye_L / rEye, RightEye, Eye_R)");
  }
  const clipStatus: Record<AvatarAnimationState, string> = {
    idle: "pending",
    talk: "pending",
    listen: "pending",
    ack: "pending",
    dance: "pending",
  };
  const animationAssigned: Record<AvatarAnimationState, boolean> = {
    idle: false,
    talk: false,
    listen: false,
    ack: false,
    dance: false,
  };
  let activeAnimationState: AvatarAnimationState = "idle";
  let animComponent: any;
  let listeningActive = false;
  let pendingAck = false;
  let actionOneShotRemaining = 0;
  let pendingAnimationState: AvatarAnimationState = activeAnimationState;
  let pendingAnimationStateFor = 0;
  let activeAnimationStateFor = 0;
  let talkClock = 0;
  let talkAmount = 0;
  let blinkCooldown = 0.3;
  let blinkPhase = 0;
  let blinkAmountCurrent = 0;
  let idlePoseBlend = 0;
  let faceIdleClock = 0;
  let eyeDriftRetargetIn = 0.35 + Math.random() * 0.9;
  let eyeDriftXCurrent = 0;
  let eyeDriftYCurrent = 0;
  let eyeDriftXTarget = 0;
  let eyeDriftYTarget = 0;
  let headLookRetargetIn = 0.8 + Math.random() * 1.5;
  let headLookYCurrent = 0;
  let headLookYTarget = 0;
  let talkNodSmoother = 0;
  let armGestureRetargetIn = 1.8 + Math.random() * 2.8;
  let lArmForwardCurrent = 0;
  let lArmForwardTarget = 0;
  let lArmOutCurrent = 0;
  let lArmOutTarget = 0;
  let lForeArmBendCurrent = 0;
  let lForeArmBendTarget = 0;
  let rArmForwardCurrent = 0;
  let rArmForwardTarget = 0;
  let rArmOutCurrent = 0;
  let rArmOutTarget = 0;
  let rForeArmBendCurrent = 0;
  let rForeArmBendTarget = 0;
  const facialMicroMotion = createFacialMicroMotionState();
  const bodyAliveMotion = createBodyAliveMotionState();
  // Breast physics spring — drives a subtle bounce during motion states
  let breastBounceClock = 0;
  let breastBounceWeight = 0;    // smoothed output weight applied to breast morph keys
  let breastBounceVelocity = 0; // spring velocity
  let simulatedSpeechUntil = 0;
  let motionTestHandle: number | undefined;
  const skippedStageAssets: string[] = [];
  const visemeCurrent = createZeroViseme();
  const speechState: WorkLiteSpeechState = {
    audioQueue: [],
    browserQueue: [],
    processingAudioQueue: false,
    playbackGeneration: 0,
    speaking: false,
    talkLevel: 0,
    breathPauseUntil: 0,
    lastBreathPauseAt: 0,
    engineLabel: "idle",
  };
  activeSpeechState = speechState;

  const updateAvatarMotionSummary = () => {
    const skippedModulesText = skippedStageAssets.length > 0
      ? ` | skipped ${skippedStageAssets.join(", ")}`
      : "";
    const modeText = WORK_LITE_SKELETAL_ANIMATION_ENABLED ? activeAnimationState : "static";
    state.avatarMotionSummary = `${modeText} | voice ${speechState.engineLabel} ${speechState.speaking ? "speaking" : "idle"} | clips idle:${clipStatus.idle} talk:${clipStatus.talk} listen:${clipStatus.listen} ack:${clipStatus.ack} | morphs ${speechMorphTargets.length}/${eyeMorphTargets.length}/${bodyMorphKeys.length} lids ${eyelidRigNodes.length}${skippedModulesText}`;
    syncShellStatePanel();
    syncAvatarMotionOverlay();
  };

  const getAnimationTransitionDuration = (fromState: AvatarAnimationState, toState: AvatarAnimationState): number => {
    if (fromState === toState) {
      return 0;
    }
    if (toState === "dance" || fromState === "dance") {
      return 0.68;
    }
    if (toState === "ack" || fromState === "ack") {
      return 0.5;
    }
    if ((fromState === "idle" && toState === "talk") || (fromState === "talk" && toState === "idle")) {
      return 0.62;
    }
    if ((fromState === "idle" && toState === "listen") || (fromState === "listen" && toState === "idle")) {
      return 0.58;
    }
    if ((fromState === "talk" && toState === "listen") || (fromState === "listen" && toState === "talk")) {
      return 0.54;
    }
    return 0.5;
  };

  const getAnimationStateConfirmDelay = (nextState: AvatarAnimationState): number => {
    switch (nextState) {
      case "talk":
        return 0.14;
      case "listen":
        return 0.18;
      case "idle":
        return 0.26;
      case "dance":
      case "ack":
        return 0;
      default:
        return 0.12;
    }
  };

  const canTransitionToAnimationState = (stateName: AvatarAnimationState): boolean => {
    if (!WORK_LITE_SKELETAL_ANIMATION_ENABLED || !animComponent?.baseLayer) {
      return false;
    }
    if (!animationAssigned[stateName]) {
      return false;
    }
    const layer = animComponent.baseLayer as any;
    const stateNames = new Set<string>();
    const collectStateName = (candidate: any) => {
      if (!candidate) return;
      if (typeof candidate === "string") {
        stateNames.add(candidate);
        return;
      }
      if (typeof candidate.name === "string") {
        stateNames.add(candidate.name);
      }
    };

    const layerStates = layer?.states;
    if (Array.isArray(layerStates)) {
      for (const stateEntry of layerStates) {
        collectStateName(stateEntry);
      }
    } else if (layerStates && typeof layerStates === "object") {
      for (const [key, value] of Object.entries(layerStates as Record<string, any>)) {
        stateNames.add(key);
        collectStateName(value);
      }
    }

    const controllerStates = layer?._controller?.states ?? layer?.controller?.states;
    if (Array.isArray(controllerStates)) {
      for (const stateEntry of controllerStates) {
        collectStateName(stateEntry);
      }
    } else if (controllerStates && typeof controllerStates === "object") {
      for (const [key, value] of Object.entries(controllerStates as Record<string, any>)) {
        stateNames.add(key);
        collectStateName(value);
      }
    }

    // Some PlayCanvas builds do not expose state lists; trust assignment in that case.
    if (stateNames.size === 0) {
      return true;
    }
    return stateNames.has(stateName);
  };

  const resolveAnimationState = (requestedState: AvatarAnimationState): AvatarAnimationState => {
    if (canTransitionToAnimationState(requestedState)) {
      return requestedState;
    }
    if (requestedState !== "idle" && canTransitionToAnimationState("idle")) {
      return "idle";
    }
    return activeAnimationState;
  };

  const setAnimationState = (nextState: AvatarAnimationState) => {
    const previousState = activeAnimationState;
    const resolvedState = resolveAnimationState(nextState);
    activeAnimationState = resolvedState;
    pendingAnimationState = resolvedState;
    pendingAnimationStateFor = 0;
    activeAnimationStateFor = 0;
    if (WORK_LITE_SKELETAL_ANIMATION_ENABLED && animComponent?.baseLayer && resolvedState !== previousState) {
      try {
        animComponent.baseLayer.transition(
          resolvedState,
          getAnimationTransitionDuration(previousState, resolvedState),
        );
      } catch (err) {
        console.warn(`[anim] Transition ${previousState} -> ${resolvedState} failed`, err);
      }
    }
    if (resolvedState !== nextState) {
      console.warn(`[anim] Requested state ${nextState} unavailable; using ${resolvedState}`);
    }
    updateAvatarMotionSummary();
  };
  updateAvatarMotionSummary();

  const bounds = measureRenderBounds(bodyEntity);
  const align = {
    x: -((bounds.minX + bounds.maxX) * 0.5),
    y: -bounds.minY,
    z: -((bounds.minZ + bounds.maxZ) * 0.5),
  };
  console.info(`Rebuild body bounds ${JSON.stringify(bounds)}`);
  console.info(`Rebuild body align ${JSON.stringify(align)}`);
  bodyEntity.setLocalPosition(align.x, align.y, align.z);
  const framingBounds = measureSkeletonBounds(bodyEntity) ?? {
    minX: bounds.minX + align.x,
    minY: bounds.minY + align.y,
    minZ: bounds.minZ + align.z,
    maxX: bounds.maxX + align.x,
    maxY: bounds.maxY + align.y,
    maxZ: bounds.maxZ + align.z,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    depth: bounds.maxZ - bounds.minZ,
  };
  console.info(`Rebuild framing bounds ${JSON.stringify(framingBounds)}`);
  const initialCameraPose = fitCameraToBounds(camera, framingBounds);
  state.sceneReady = true;
  syncStatus("Body loaded, loading remaining bundle parts...");

  const garmentEntities: Array<{ entity: any; kind: string; id?: string; slot?: string; name?: string }> = [];
  for (const asset of displayAssets) {
    if (!asset.resolvedPath) {
      continue;
    }
    if (shouldSkipStageDisplayAsset(asset)) {
      skippedStageAssets.push(`${asset.name} (${formatAssetSizeMb(asset.fileSizeBytes)})`);
      console.warn(`Skipping oversized stage asset ${asset.name}`, {
        resolvedPath: asset.resolvedPath,
        fileSizeBytes: asset.fileSizeBytes,
        loadRisk: asset.loadRisk,
      });
      updateAvatarMotionSummary();
      continue;
    }
    syncStatus(`Loading ${asset.name}...`);
    try {
      const entity = await loadContainerEntityWithRetry(
        pc,
        app,
        asset.name,
        toVersionedClientAssetUrl(asset),
        getAssetLoadTimeoutMs(asset, 180000),
        3,
      );
      entity.setLocalEulerAngles(0, 0, 0);
      flattenEntityMaterials(pc, entity, getAssetUsage(asset));
      avatarRoot.addChild(entity);
      if (shouldUseReferenceAlignment(asset)) {
        alignEntityToReference(entity, framingBounds);
      } else {
        entity.setLocalPosition(align.x, align.y, align.z);
      }
      rebindEntityRenderRootBone(entity, skeletonRoot);
      garmentEntities.push({ entity, kind: asset.kind ?? "clothing", id: asset.id, slot: asset.slot, name: asset.name });
    } catch (error) {
      console.error(`Failed to load ${asset.name}`, error);
    }
  }

  // --- Load and wire skeletal animations ---
  const animationTracks: Partial<Record<AvatarAnimationState, any>> = {};
  if (WORK_LITE_SKELETAL_ANIMATION_ENABLED) {
    syncStatus("Loading animations...");
    const animationAssets = (manifest.assets ?? []).filter(
      (a) => a.kind === "animation" && a.resolvedPath && a.present !== false,
    );
    const slotToState: Record<string, AvatarAnimationState> = {
      idle: "idle",
      talk: "talk",
      listen: "listen",
      ack: "ack",
      dance: "dance",
    };
    for (const animAsset of animationAssets) {
      if (!animAsset.resolvedPath || !animAsset.slot) continue;
      const stateKey = slotToState[animAsset.slot];
      if (!stateKey) continue;
      try {
        const track = await loadAnimationTrack(
          pc, app, animAsset.name,
          toVersionedClientAssetUrl(animAsset),
          getAssetLoadTimeoutMs(animAsset, 60000),
        );
        if (track) {
          animationTracks[stateKey] = track;
          clipStatus[stateKey] = "loaded";
        } else {
          clipStatus[stateKey] = "empty";
        }
      } catch (err) {
        console.warn(`Failed to load animation ${animAsset.name}`, err);
        clipStatus[stateKey] = "error";
      }
    }
    // Fallback: if talk/listen/ack missing, reuse idle
    if (!animationTracks.talk) animationTracks.talk = animationTracks.idle;
    if (!animationTracks.listen) animationTracks.listen = animationTracks.idle;
    if (!animationTracks.ack) animationTracks.ack = animationTracks.idle;
    if (!animationTracks.dance) animationTracks.dance = animationTracks.ack ?? animationTracks.talk ?? animationTracks.listen ?? animationTracks.idle;

    if (animationTracks.idle) {
      bodyEntity.addComponent("anim", { activate: true, speed: WORK_LITE_ANIMATION_PLAYBACK_SPEED });
      animComponent = bodyEntity.anim;
      if (animComponent) {
        animComponent.rootBone = skeletonRoot;
        console.info(`[anim] Using skeleton root "${skeletonRoot?.name ?? "unknown"}" for persona ${state.activePrivatePersona}`);
        for (const [stateName, track] of Object.entries(animationTracks) as Array<[AvatarAnimationState, any]>) {
          if (!track) {
            animationAssigned[stateName] = false;
            continue;
          }
          try {
            animComponent.assignAnimation(stateName, track);
            animationAssigned[stateName] = true;
          } catch (err) {
            animationAssigned[stateName] = false;
            console.warn(`[anim] Failed to assign animation state ${stateName}`, err);
          }
        }
        if (canTransitionToAnimationState("idle")) {
          animComponent.baseLayer?.play("idle");
        } else {
          console.warn("[anim] Idle state unavailable after assignment; skipping play('idle').");
        }
        try {
          animComponent.rebind?.();
        } catch (err) {
          console.warn("[anim] Rebind failed; continuing without full skeletal binding", err);
        }
        console.info("Skeletal animation wired: idle playing.");

        // --- Bind clothing/hair skins to the body's animated skeleton ---
        for (const garment of garmentEntities) {
          try {
            bindGarmentToSkeleton(garment.entity, bodyEntity, skeletonRoot);
          } catch (err) {
            console.warn(`[anim] Garment skeleton bind failed for ${garment.name ?? garment.id ?? "unknown"}`, err);
          }
        }
      }
    } else {
      console.warn("No idle animation track loaded â€” skeletal animation skipped.");
    }
    updateAvatarMotionSummary();
  }

  // --- Build .001 duplicate bone mirror pairs ---
  // Blender auto-generates .001/.002 suffixed duplicates when joining armatures.
  // The animation only drives the real bones; vertices weighted to .001 bones stay
  // at bind-pose (T-pose). Fix: copy local position+rotation from each real bone
  // to its .001 counterpart every frame so garment/hair vertices follow correctly.
  const duplicateBonePairs: Array<{ real: any; dup: any }> = [];
  {
    const boneByName = new Map<string, any>();
    const collectBoneNames = (entity: any): void => {
      const name: string | undefined = entity?.name;
      if (name) boneByName.set(name, entity);
      for (const child of entity?.children ?? []) collectBoneNames(child);
    };
    collectBoneNames(bodyEntity);
    for (const [name, ent] of boneByName) {
      if (/\.\d{3}$/.test(name)) {
        const baseName = toCanonicalBoneName(name);
        const real = boneByName.get(baseName);
        if (real && real !== ent) {
          duplicateBonePairs.push({ real, dup: ent });
        }
      }
    }
    console.info(`[dupBones] Found ${duplicateBonePairs.length} .001-style duplicate bone pairs to mirror each frame.`);
  }

  const finalBounds = measureRenderBounds(avatarRoot);
  console.info(`Rebuild final bounds ${JSON.stringify(finalBounds)}`);
  const mechanics: AvatarMechanicsController = {
    setListening(active: boolean) {
      listeningActive = active;
      updateAvatarMotionSummary();
    },
    async speakText(text: string) {
      const normalized = text.replace(/\s+/g, " ").trim();
      if (!normalized) {
        return;
      }
      await speakWorkLiteText(normalized, speechState);
      updateAvatarMotionSummary();
    },
    pulseAck() {
      pendingAck = true;
      updateAvatarMotionSummary();
    },
    stopSpeech() {
      simulatedSpeechUntil = 0;
      if (motionTestHandle !== undefined) {
        window.clearTimeout(motionTestHandle);
        motionTestHandle = undefined;
      }
      stopWorkLiteSpeech(speechState);
      updateAvatarMotionSummary();
    },
    runMotionTest() {
      if (motionTestHandle !== undefined) {
        window.clearTimeout(motionTestHandle);
        motionTestHandle = undefined;
      }
      stopWorkLiteSpeech(speechState);
      listeningActive = true;
      pendingAck = false;
      simulatedSpeechUntil = 0;
      updateAvatarMotionSummary();
      window.setTimeout(() => {
        listeningActive = false;
        pendingAck = true;
        simulatedSpeechUntil = performance.now() + 2200;
        speechState.engineLabel = "motion test";
        speechState.speaking = true;
        speechState.talkLevel = 0.92;
        updateAvatarMotionSummary();
      }, 700);
      motionTestHandle = window.setTimeout(() => {
        simulatedSpeechUntil = 0;
        speechState.speaking = false;
        speechState.talkLevel = 0;
        speechState.engineLabel = "idle";
        motionTestHandle = undefined;
        updateAvatarMotionSummary();
      }, 3200);
    },
  };
  stageRuntime = {
    ...(stageRuntime ?? { pc, app, camera, canvas, align: { x: 0, y: 0, z: 0 } }),
    bodyMorphTargets,
    bodyMorphKeys,
  };
  app.systems.on("postUpdate", (dt: number) => {
    faceIdleClock += dt;
    talkClock += dt;
    activeAnimationStateFor += dt;

    // Dance clip ping-pong: play forward once, then immediately reverse to return to start pose.
    if (danceActive && dancePlaybackState && animComponent?.baseLayer) {
      if (dancePlaybackDuration <= 0) {
        dancePlaybackDuration = getTrackDurationSeconds(animationTracks?.[dancePlaybackState]);
      }
      if (dancePlaybackDuration > 0) {
        const playbackStep = dt * Math.abs(DANCE_PLAYBACK_SPEED);
        if (dancePlaybackDirection === "forward") {
          dancePlaybackTime = Math.min(dancePlaybackDuration, dancePlaybackTime + playbackStep);
          if (dancePlaybackTime >= dancePlaybackDuration) {
            dancePlaybackDirection = "reverse";
            setDanceLayerTimeIfSupported(animComponent.baseLayer as any, dancePlaybackDuration);
            animComponent.speed = -Math.abs(DANCE_PLAYBACK_SPEED);
          }
        } else {
          dancePlaybackTime = Math.max(0, dancePlaybackTime - playbackStep);
          if (dancePlaybackTime <= 0.0001) {
            setDanceLayerTimeIfSupported(animComponent.baseLayer as any, 0);
            dancePlaybackDirection = "forward";
            animComponent.speed = Math.abs(DANCE_PLAYBACK_SPEED);
          }
        }
      }
    }

    if (simulatedSpeechUntil > 0 && performance.now() >= simulatedSpeechUntil) {
      simulatedSpeechUntil = 0;
      if (!speechState.audio && !speechState.utterance) {
        speechState.speaking = false;
        speechState.talkLevel = 0;
        if (speechState.engineLabel === "motion test") {
          speechState.engineLabel = "idle";
        }
      }
    }
    const speaking = speechState.speaking || performance.now() < simulatedSpeechUntil;
    const desiredAnimationState: AvatarAnimationState = danceActive
      ? "dance"
      : speaking
        ? "talk"
        : listeningActive
          ? "listen"
          : "idle";
    const idlePoseTarget = desiredAnimationState === "idle" ? 1 : 0;
    idlePoseBlend += (idlePoseTarget - idlePoseBlend) * Math.min(1, dt * 2.2);

    if (actionOneShotRemaining > 0) {
      actionOneShotRemaining = Math.max(0, actionOneShotRemaining - dt);
    }
    pendingAck = false;
    if (desiredAnimationState === activeAnimationState) {
      pendingAnimationState = activeAnimationState;
      pendingAnimationStateFor = 0;
    } else if (
      actionOneShotRemaining <= 0 &&
      activeAnimationStateFor >= (WORK_LITE_ANIMATION_HOLD_SECONDS[activeAnimationState] ?? 0)
    ) {
      if (pendingAnimationState !== desiredAnimationState) {
        pendingAnimationState = desiredAnimationState;
        pendingAnimationStateFor = 0;
      } else {
        pendingAnimationStateFor += dt;
      }
      if (pendingAnimationStateFor >= getAnimationStateConfirmDelay(desiredAnimationState)) {
        setAnimationState(desiredAnimationState);
      }
    }

    if (!speechState.audio && speechState.speaking) {
      speechState.talkLevel += (0 - speechState.talkLevel) * Math.min(1, dt * 7);
    }
    const targetTalk = speaking ? Math.max(0.24, speechState.talkLevel) : 0;
    talkAmount += (targetTalk - talkAmount) * Math.min(1, dt * 6);
    const pulse = talkAmount > 0.001 ? (0.55 + 0.45 * Math.sin(talkClock * 16)) * talkAmount : 0;
    const aaPulse = talkAmount > 0.001 ? (0.5 + 0.5 * Math.sin(talkClock * 11)) * talkAmount : 0;
    const owPulse = talkAmount > 0.001 ? (0.5 + 0.5 * Math.sin(talkClock * 7 + 0.8)) * talkAmount : 0;
    updateFacialMicroMotion(facialMicroMotion, dt, {
      enabled: FACIAL_MICRO_MOVEMENT_ENABLED,
      idleBlend: idlePoseBlend,
      speaking,
      listening: listeningActive,
      dancing: danceActive,
      talkAmount,
    });
    const speakingSmile = speaking ? Math.min(0.1, 0.03 + talkAmount * 0.08) : 0;
    const targetViseme = {
      mouthOpen: speaking ? (pulse * 0.92) + (facialMicroMotion.mouthOpenCurrent * 0.32) : facialMicroMotion.mouthOpenCurrent,
      aa: speaking ? aaPulse * 0.72 : 0,
      ow: speaking ? owPulse * 0.52 : 0,
      ee: speaking ? aaPulse * 0.40 : 0,
      ih: speaking ? aaPulse * 0.32 : 0,
      fv: speaking ? pulse * 0.30 : 0,
      l: speaking ? pulse * 0.20 : 0,
      th: speaking ? pulse * 0.22 : 0,
      m: speaking ? Math.max(0, 0.06 - pulse * 0.10) : 0,
      lowerLip: speaking ? Math.min(0.24, (pulse * 0.14) + (aaPulse * 0.10) + (facialMicroMotion.lowerLipCurrent * 0.25)) : facialMicroMotion.lowerLipCurrent,
      chin: speaking ? Math.min(0.16, (pulse * 0.08) + (owPulse * 0.05) + (facialMicroMotion.chinCurrent * 0.25)) : facialMicroMotion.chinCurrent,
      smileLeft: Math.min(0.24, facialMicroMotion.smileBaseCurrent + speakingSmile + facialMicroMotion.smileAsymCurrent),
      smileRight: Math.min(0.24, facialMicroMotion.smileBaseCurrent + speakingSmile - facialMicroMotion.smileAsymCurrent),
    };
    const visemeBlend = Math.min(1, dt * (speaking ? 10 : 5.8));
    visemeCurrent.mouthOpen += (targetViseme.mouthOpen - visemeCurrent.mouthOpen) * visemeBlend;
    visemeCurrent.aa += (targetViseme.aa - visemeCurrent.aa) * visemeBlend;
    visemeCurrent.ow += (targetViseme.ow - visemeCurrent.ow) * visemeBlend;
    visemeCurrent.ee += (targetViseme.ee - visemeCurrent.ee) * visemeBlend;
    visemeCurrent.ih += (targetViseme.ih - visemeCurrent.ih) * visemeBlend;
    visemeCurrent.fv += (targetViseme.fv - visemeCurrent.fv) * visemeBlend;
    visemeCurrent.l += (targetViseme.l - visemeCurrent.l) * visemeBlend;
    visemeCurrent.th += (targetViseme.th - visemeCurrent.th) * visemeBlend;
    visemeCurrent.m += (targetViseme.m - visemeCurrent.m) * visemeBlend;
    visemeCurrent.lowerLip += (targetViseme.lowerLip - visemeCurrent.lowerLip) * visemeBlend;
    visemeCurrent.chin += (targetViseme.chin - visemeCurrent.chin) * visemeBlend;
    visemeCurrent.smileLeft += (targetViseme.smileLeft - visemeCurrent.smileLeft) * visemeBlend;
    visemeCurrent.smileRight += (targetViseme.smileRight - visemeCurrent.smileRight) * visemeBlend;

    for (const target of speechMorphTargets) {
      setMorphWeightIfPresent(target.instance, target.mouthOpen, visemeCurrent.mouthOpen);
      setMorphWeightIfPresent(target.instance, target.aa, visemeCurrent.aa);
      setMorphWeightIfPresent(target.instance, target.ow, visemeCurrent.ow);
      setMorphWeightIfPresent(target.instance, target.ee, visemeCurrent.ee);
      setMorphWeightIfPresent(target.instance, target.ih, visemeCurrent.ih);
      setMorphWeightIfPresent(target.instance, target.fv, visemeCurrent.fv);
      setMorphWeightIfPresent(target.instance, target.l, visemeCurrent.l);
      setMorphWeightIfPresent(target.instance, target.th, visemeCurrent.th);
      setMorphWeightIfPresent(target.instance, target.m, visemeCurrent.m);
      setMorphWeights(target.instance, target.lowerLip, visemeCurrent.lowerLip);
      setMorphWeights(target.instance, target.chin, visemeCurrent.chin);
      setMorphWeights(target.instance, target.smileLeft, visemeCurrent.smileLeft);
      setMorphWeights(target.instance, target.smileRight, visemeCurrent.smileRight);
    }

    if (blinkPhase > 0) {
      blinkPhase = Math.min(1, blinkPhase + (dt / 0.18));
      if (blinkPhase >= 1) {
        blinkPhase = 0;
        blinkCooldown = 1.55 + Math.random() * 2.05;
      }
    } else if (blinkCooldown > 0) {
      blinkCooldown = Math.max(0, blinkCooldown - dt);
    } else {
      blinkPhase = Number.EPSILON;
    }
    const blinkPulse = blinkPhase > 0
      ? (blinkPhase < 0.5 ? blinkPhase / 0.5 : 1 - ((blinkPhase - 0.5) / 0.5))
      : 0;
    const targetBlinkAmount = Math.min(0.86, blinkPulse * 1.55);
    blinkAmountCurrent += (targetBlinkAmount - blinkAmountCurrent) * Math.min(1, dt * 28);
    const microSquintLeft = Math.max(0, facialMicroMotion.squintBaseCurrent + facialMicroMotion.squintAsymCurrent);
    const microSquintRight = Math.max(0, facialMicroMotion.squintBaseCurrent - facialMicroMotion.squintAsymCurrent);
    const idleEyeClosure = idlePoseBlend * 0.085;

    for (const target of eyeMorphTargets) {
      setMorphWeights(target.instance, target.blinkLeft, blinkAmountCurrent);
      setMorphWeights(target.instance, target.blinkRight, blinkAmountCurrent);
      setMorphWeights(target.instance, target.squintLeft, Math.min(1, (blinkAmountCurrent * 0.34) + microSquintLeft + idleEyeClosure));
      setMorphWeights(target.instance, target.squintRight, Math.min(1, (blinkAmountCurrent * 0.34) + microSquintRight + idleEyeClosure));
    }

    // idlePoseBlend is 1 when idle, 0 when in motion — use (1-idlePoseBlend) so body morphs
    // fade in/out in perfect sync with the animation blend rather than snapping on/off.
    const motionMorphBlend = state.bodyMorphsEnabledDuringMotion
      ? (1 - idlePoseBlend)
      : 1;
    applyBodyMorphOverrides(bodyMorphTargets, state.bodyMorphOverrides, motionMorphBlend);

    // Breast physics: spring oscillator driven by motion blend.
    // Activates whenever the avatar is in any motion state (walk/talk/listen/dance).
    if (breastMorphEntries.length > 0) {
      const motionBlend = 1 - idlePoseBlend; // 0 = idle, 1 = full motion
      breastBounceClock += dt;

      // Per-state amplitude scale — dance gets full movement, talk/listen are subtle.
      const stateAmplitude =
        activeAnimationState === "dance" ? 1.0
        : activeAnimationState === "talk"   ? 0.25
        : activeAnimationState === "listen" ? 0.22
        : activeAnimationState === "ack"    ? 0.35
        : 0;
      const driveScale = motionBlend * stateAmplitude;

      // Vertical oscillation — two harmonics give natural, non-uniform bounce.
      // Max raw amplitude before spring: ±0.073
      const vertOsc = (Math.sin(breastBounceClock * 5.8) * 0.055 + Math.sin(breastBounceClock * 11.2 + 0.7) * 0.018) * driveScale;
      // Lateral oscillation at a different frequency, 90° phase offset.
      const lateralOsc = Math.sin(breastBounceClock * 4.1 + Math.PI * 0.5) * 0.04 * driveScale;
      // In/out: subtle, always positive.
      const inOutOsc = Math.abs(Math.sin(breastBounceClock * 6.3 + 0.4)) * 0.02 * driveScale;

      // High-frequency spring so it actually tracks the oscillation (natural freq >> drive freq).
      // K=280 → ω_n ≈ 16.7 rad/s, well above our 5.8 rad/s drive. Damping ≈ 0.45 (lightly underdamped).
      const springK = 280;
      const damping = 15;
      breastBounceVelocity += (vertOsc - breastBounceWeight) * springK * dt;
      breastBounceVelocity *= Math.max(0, 1 - damping * dt);
      breastBounceWeight = Math.max(-0.10, Math.min(0.10, breastBounceWeight + breastBounceVelocity * dt));

      for (const entry of breastMorphEntries) {
        const operatorBase = state.bodyMorphOverrides[entry.key] ?? 0;
        let weight: number;
        if (entry.phase === "bipolar-ud") {
          // 0 = natural mesh pose. Oscillate additively from operator base.
          weight = Math.max(0, Math.min(1, operatorBase + breastBounceWeight));
        } else if (entry.phase === "up") {
          weight = Math.max(0, Math.min(1, operatorBase + Math.max(0, breastBounceWeight)));
        } else if (entry.phase === "down") {
          weight = Math.max(0, Math.min(1, operatorBase + Math.max(0, -breastBounceWeight)));
        } else if (entry.phase === "side") {
          weight = Math.max(0, Math.min(1, operatorBase + lateralOsc));
        } else {
          // inout: always additive positive
          weight = Math.max(0, Math.min(1, operatorBase + inOutOsc));
        }
        entry.instance.setWeight(entry.key, weight);
      }
    }

    const useRigDrivenBlink = eyeMorphTargets.length === 0;
    for (const eyelid of eyelidRigNodes) {
      const idleRigClosure = useRigDrivenBlink ? idlePoseBlend * 0.012 : 0;
      const yOffset = useRigDrivenBlink
        ? (eyelid.direction === "upper" ? -0.06 : 0.004) * blinkAmountCurrent + (eyelid.direction === "upper" ? -idleRigClosure : idleRigClosure * 0.3)
        : 0;
      const zOffset = useRigDrivenBlink
        ? (eyelid.direction === "upper" ? -0.01 : 0.0015) * blinkAmountCurrent
        : 0;
      eyelid.entity.setLocalPosition(
        eyelid.basePosition.x,
        eyelid.basePosition.y + yOffset,
        eyelid.basePosition.z + zOffset,
      );
    }
    // Head look-around: smooth Y rotation shared across head + neck + spine as a group
    headLookRetargetIn -= dt;
    if (headLookRetargetIn <= 0) {
      headLookRetargetIn = 2.0 + Math.random() * 3.5;
      const mag = Math.random() < 0.35 ? 12 + Math.random() * 8 : 4 + Math.random() * 10;
      headLookYTarget = (Math.random() < 0.5 ? 1 : -1) * mag;
    }
    headLookYCurrent += (headLookYTarget - headLookYCurrent) * Math.min(1, dt * 1.2);

    // Speech nod: smooth forward-pitch oscillation while talking
    const rawNod = speaking ? Math.sin(faceIdleClock * 2.1) * (talkAmount * 2.2) : 0;
    talkNodSmoother += (rawNod - talkNodSmoother) * Math.min(1, dt * 3.5);
    const breathPauseActive = speechState.breathPauseUntil > performance.now();
    const bodyAlive = updateBodyAliveMotion(bodyAliveMotion, dt, {
      enabled: BODY_ALIVE_MOTION_ENABLED,
      idleBlend: idlePoseBlend,
      speaking,
      listening: listeningActive,
      dancing: danceActive,
      talkAmount,
      breathPauseActive,
    });
    const headForwardBias = 1.85;
    const neckForwardBias = 0.9;
    const spineForwardBias = 0.35;
    const armRestForwardBias = 4.8;
    const foreArmRestBendBias = 4.2;

    if (headBone?.setLocalEulerAngles && headBaseAngles) {
      const idleHeadForward = idlePoseBlend * 0.55;
      const headMicroX = (Math.sin(faceIdleClock * 0.8) * 0.18) + (bodyAlive.settle * 0.18);
      const headMicroZ = (Math.sin(faceIdleClock * 1.15 + 0.6) * 0.12) + (bodyAlive.weightShift * 0.045);
      headBone.setLocalEulerAngles(
        headBaseAngles.x + headForwardBias + idleHeadForward + talkNodSmoother + headMicroX - (bodyAlive.breath * 0.18),
        headBaseAngles.y + headLookYCurrent * 0.55,
        headBaseAngles.z + headMicroZ,
      );
    }
    if (neckBone?.setLocalEulerAngles && neckBaseAngles) {
      const idleNeckForward = idlePoseBlend * 0.24;
      const neckMicroX = Math.sin(faceIdleClock * 0.62 + 1.4) * 0.16;
      neckBone.setLocalEulerAngles(
        neckBaseAngles.x + neckForwardBias + idleNeckForward + (talkNodSmoother * 0.5) + neckMicroX,
        neckBaseAngles.y + headLookYCurrent * 0.35,
        neckBaseAngles.z,
      );
    }
    if (spineBone?.setLocalEulerAngles && spineBaseAngles) {
      const breathe = bodyAlive.chestLift;
      // Hip/torso sway overlay during dance — gentle figure-8 pattern on Y and Z
      const danceSwayY = danceActive ? Math.sin(faceIdleClock * 1.65) * 3.8 + Math.sin(faceIdleClock * 0.82 + 0.55) * 1.4 : 0;
      const danceSwayZ = danceActive ? Math.sin(faceIdleClock * 1.65 + Math.PI * 0.5) * 1.8 : 0;
      const danceRockX = danceActive ? Math.sin(faceIdleClock * 0.95 + 0.3) * 1.2 : 0;
      // Subtle idle micro-wobble — organic spring-back, ~1 degree at ~2.8Hz, fades out during dance
      const idleWobble = !danceActive ? (Math.sin(faceIdleClock * 2.82 + 1.3) * 0.52 * idlePoseBlend) + bodyAlive.settle : 0;
      spineBone.setLocalEulerAngles(
        spineBaseAngles.x + spineForwardBias + breathe + danceRockX,
        spineBaseAngles.y + headLookYCurrent * 0.12 + bodyAlive.weightShift + danceSwayY,
        spineBaseAngles.z + bodyAlive.hipSway + danceSwayZ + idleWobble,
      );
    }
    if (jawBone?.setLocalEulerAngles && jawBaseAngles) {
      const jawOpen = speaking
        ? (pulse * 8.2) + (aaPulse * 4.8) + (owPulse * 2.2)
        : facialMicroMotion.jawOpenCurrent;
      const jawSway = speaking
        ? Math.sin(talkClock * 5.6 + 0.3) * talkAmount * 0.55
        : facialMicroMotion.jawSwayCurrent;
      jawBone.setLocalEulerAngles(
        jawBaseAngles.x + jawOpen,
        jawBaseAngles.y + jawSway,
        jawBaseAngles.z,
      );
    }

    armGestureRetargetIn -= dt;
    if (armGestureRetargetIn <= 0) {
      armGestureRetargetIn = 2.8 + Math.random() * 4.8;
      const gestureRoll = Math.random();
      if (idlePoseBlend < 0.5 || danceActive || speaking) {
        lArmForwardTarget = 0;
        lArmOutTarget = 0;
        lForeArmBendTarget = 0;
        rArmForwardTarget = 0;
        rArmOutTarget = 0;
        rForeArmBendTarget = 0;
      } else if (gestureRoll < 0.4) {
        lArmForwardTarget = -10 - Math.random() * 7;
        lArmOutTarget = -1.5 - Math.random() * 2.5;
        lForeArmBendTarget = 6 + Math.random() * 8;
        rArmForwardTarget = -10 - Math.random() * 7;
        rArmOutTarget = 1.5 + Math.random() * 2.5;
        rForeArmBendTarget = 6 + Math.random() * 8;
      } else if (gestureRoll < 0.7) {
        lArmForwardTarget = -16 - Math.random() * 10;
        lArmOutTarget = -4 - Math.random() * 4;
        lForeArmBendTarget = 24 + Math.random() * 10;
        rArmForwardTarget = 0;
        rArmOutTarget = 0;
        rForeArmBendTarget = 0;
      } else if (gestureRoll < 0.9) {
        lArmForwardTarget = 0;
        lArmOutTarget = 0;
        lForeArmBendTarget = 0;
        rArmForwardTarget = -16 - Math.random() * 10;
        rArmOutTarget = 4 + Math.random() * 4;
        rForeArmBendTarget = 24 + Math.random() * 10;
      } else {
        lArmForwardTarget = 0;
        lArmOutTarget = 0;
        lForeArmBendTarget = 0;
        rArmForwardTarget = 0;
        rArmOutTarget = 0;
        rForeArmBendTarget = 0;
      }
    }
    const armBlend = Math.min(1, dt * 1.75);
    lArmForwardCurrent += (lArmForwardTarget - lArmForwardCurrent) * armBlend;
    lArmOutCurrent += (lArmOutTarget - lArmOutCurrent) * armBlend;
    lForeArmBendCurrent += (lForeArmBendTarget - lForeArmBendCurrent) * armBlend;
    rArmForwardCurrent += (rArmForwardTarget - rArmForwardCurrent) * armBlend;
    rArmOutCurrent += (rArmOutTarget - rArmOutCurrent) * armBlend;
    rForeArmBendCurrent += (rForeArmBendTarget - rForeArmBendCurrent) * armBlend;

    const breatheLift = bodyAlive.shoulderLift;
    const armCameraYawBias = 4.5;
    if (lShoulderBone?.setLocalEulerAngles && lShoulderBaseAngles) {
      lShoulderBone.setLocalEulerAngles(
        lShoulderBaseAngles.x + ((armRestForwardBias + lArmForwardCurrent) * 0.18) + breatheLift * 0.35,
        lShoulderBaseAngles.y,
        lShoulderBaseAngles.z + (lArmOutCurrent * 0.14) - breatheLift * 0.18,
      );
    }
    if (rShoulderBone?.setLocalEulerAngles && rShoulderBaseAngles) {
      rShoulderBone.setLocalEulerAngles(
        rShoulderBaseAngles.x + ((armRestForwardBias + rArmForwardCurrent) * 0.18) + breatheLift * 0.35,
        rShoulderBaseAngles.y,
        rShoulderBaseAngles.z + (rArmOutCurrent * 0.14) + breatheLift * 0.18,
      );
    }
    if (lUpperArmBone?.setLocalEulerAngles && lUpperArmBaseAngles) {
      lUpperArmBone.setLocalEulerAngles(
        lUpperArmBaseAngles.x + armRestForwardBias + lArmForwardCurrent + breatheLift * 0.8,
        lUpperArmBaseAngles.y + armCameraYawBias,
        lUpperArmBaseAngles.z + (lArmOutCurrent * 0.65),
      );
    }
    if (rUpperArmBone?.setLocalEulerAngles && rUpperArmBaseAngles) {
      rUpperArmBone.setLocalEulerAngles(
        rUpperArmBaseAngles.x + armRestForwardBias + rArmForwardCurrent + breatheLift * 0.8,
        rUpperArmBaseAngles.y - armCameraYawBias,
        rUpperArmBaseAngles.z + (rArmOutCurrent * 0.65),
      );
    }
    if (lForeArmBone?.setLocalEulerAngles && lForeArmBaseAngles) {
      lForeArmBone.setLocalEulerAngles(
        lForeArmBaseAngles.x + foreArmRestBendBias + lForeArmBendCurrent,
        lForeArmBaseAngles.y,
        lForeArmBaseAngles.z,
      );
    }
    if (rForeArmBone?.setLocalEulerAngles && rForeArmBaseAngles) {
      rForeArmBone.setLocalEulerAngles(
        rForeArmBaseAngles.x + foreArmRestBendBias + rForeArmBendCurrent,
        rForeArmBaseAngles.y,
        rForeArmBaseAngles.z,
      );
    }

    eyeDriftRetargetIn -= dt;
    if (eyeDriftRetargetIn <= 0) {
      eyeDriftRetargetIn = 0.28 + Math.random() * 0.85;
      eyeDriftXTarget = (Math.random() * 2 - 1) * 1.8;
      eyeDriftYTarget = (Math.random() * 2 - 1) * 1.0;
    }
    const eyeDriftBlend = Math.min(1, dt * 5.5);
    eyeDriftXCurrent += (eyeDriftXTarget - eyeDriftXCurrent) * eyeDriftBlend;
    eyeDriftYCurrent += (eyeDriftYTarget - eyeDriftYCurrent) * eyeDriftBlend;

    // Re-apply eye correction every frame (animations reset bone transforms)
    if (lEyeBone?.setLocalEulerAngles && lEyeBaseAngles) {
      lEyeBone.setLocalEulerAngles(lEyeBaseAngles.x + eyeDriftYCurrent, lEyeBaseAngles.y + EYE_YAW_CORRECTION + eyeDriftXCurrent, lEyeBaseAngles.z);
    }
    if (rEyeBone?.setLocalEulerAngles && rEyeBaseAngles) {
      rEyeBone.setLocalEulerAngles(rEyeBaseAngles.x + eyeDriftYCurrent, rEyeBaseAngles.y - EYE_YAW_CORRECTION + eyeDriftXCurrent, rEyeBaseAngles.z);
    }

    // Mirror .001 duplicate bone transforms so garment/hair vertices weighted to them follow animation
    for (const { real, dup } of duplicateBonePairs) {
      const wp = real.getPosition?.();
      const wr = real.getRotation?.();
      const ls = real.getLocalScale?.();
      if (wp) dup.setPosition?.(wp.x, wp.y, wp.z);
      if (wr) dup.setRotation?.(wr.x, wr.y, wr.z, wr.w);
      if (ls) dup.setLocalScale?.(ls.x, ls.y, ls.z);
    }
    updateViewportGizmoAnchor(stageRuntime);
  });

  const avatarBasePosition: Vector3Tuple = [
    (environmentAvatarStandPosition?.[0] ?? 0) + state.selectedAvatarPosition[0],
    (environmentAvatarStandPosition?.[1] ?? 0) + state.selectedAvatarPosition[1],
    (environmentAvatarStandPosition?.[2] ?? 0) + state.selectedAvatarPosition[2],
  ];
  const avatarBaseRotation: Vector3Tuple = [...state.selectedAvatarRotation] as Vector3Tuple;
  const avatarBaseScale: Vector3Tuple = [...state.selectedAvatarScale] as Vector3Tuple;

  stageRuntime = {
    ...(stageRuntime ?? {}),
    pc,
    app,
    camera,
    canvas,
    align,
    environmentProfileId: selectedEnvironmentProfile?.id,
    environmentStorageScope,
    keyLight,
    fillLight,
    interiorLight,
    ceilingFloodLight,
    roofDownFloodLights,
    wallFillLights,
    roomWashLights,
          centerWashLights,
          cornerFillLights,
          dayInteriorBounceLight,
    daySunLight,
    daySkyLight,
    dayFloodLight,
    dayFillFloodLight,
    dayRoofFloodLight,
    dayBackdropShell,
    avatarRoot,
    avatarBasePosition,
    avatarBaseRotation,
    avatarBaseScale,
    avatarTuning: getSavedAvatarTuning(environmentStorageScope),
    cameraBasePosition: initialCameraPose.position,
    cameraBaseTarget: initialCameraPose.target,
    cameraTuning: getSavedCameraTuning(environmentStorageScope),
    mechanics,
    garmentEntities,
    bodyEntity,
    animComponent,
    animationAssigned,
    animationTracks,
  };

  syncTimeOfDayLighting(stageRuntime);
  if (timeOfDayLightingSyncHandle !== undefined) {
    window.clearInterval(timeOfDayLightingSyncHandle);
  }
  timeOfDayLightingSyncHandle = window.setInterval(() => {
    syncTimeOfDayLighting();
  }, 60000);
  applyAvatarTuning(stageRuntime);
  applyCameraTuning(stageRuntime);
  syncStatus("Scene ready");
  syncViewportGizmoUi();
  speakQuickBrowserPhrase(pickRandom(activeVoiceRuntimeConfig.phrases.bootGreetings));
  resetInactivityTimer();
}

// â”€â”€ Persona switching â”€â”€

function resetInactivityTimer(): void {
  if (inactivityTimerHandle !== undefined) window.clearTimeout(inactivityTimerHandle);
  inactivityTimerHandle = undefined;
  if (state.activePrivatePersona !== "normal") {
    inactivityTimerHandle = window.setTimeout(() => {
      console.log("[persona] Inactivity timeout â€” reverting to normal mode");
      void switchToPersona("normal");
    }, INACTIVITY_REVERT_MS);
  }
}

async function ensureNormalPersonaOnLoad(): Promise<void> {
  state.activePrivatePersona = "normal";
  state.conversationSessionId = undefined;

  try {
    const response = await fetch("/providers/local-llm-config", {
      method: "PATCH",
      headers: buildGailHeaders(true),
      body: JSON.stringify({ activePrivatePersona: "normal" }),
    });
    if (!response.ok) {
      console.warn(`[persona] Failed to reset persona to normal on load (${response.status})`);
    }
  } catch (err) {
    console.warn("[persona] Failed to reset persona to normal on load:", err);
  }
}

function bumpInactivityTimer(): void {
  if (state.activePrivatePersona !== "normal") {
    resetInactivityTimer();
  }
}

async function switchToPersona(persona: string): Promise<void> {
  const previousPersona = state.activePrivatePersona;
  if (persona === state.activePrivatePersona) return;
  if (personaSwitchInProgress) return;
  personaSwitchInProgress = true;
  let resolvedPersona = persona;
  let label = PERSONA_LABELS[resolvedPersona] ?? resolvedPersona;
  console.log(`[persona] Switching to: ${label}`);

  try {
    // 0. Stop any active dance
    stopDance();

    // 1. Stop current speech
    stageRuntime?.mechanics?.stopSpeech();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    gailSpeechActive = false;

    // 2. Update backend persona
    syncStatus(`Switching to ${label}...`);
    const response = await fetch("/providers/local-llm-config", {
      method: "PATCH",
      headers: buildGailHeaders(true),
      body: JSON.stringify({ activePrivatePersona: resolvedPersona }),
    });
    if (!response.ok) {
      throw new Error(`Persona update failed (${response.status})`);
    }
    const payload = await response.json() as LocalLlmConfigResponse;
    const incomingPersona = payload.activePrivatePersona?.trim();
    if (incomingPersona) {
      resolvedPersona = incomingPersona;
      label = PERSONA_LABELS[resolvedPersona] ?? resolvedPersona;
    }
    const effectiveModel = payload.effectiveModel?.trim() || payload.model?.trim();
    if (effectiveModel) {
      state.localModel = effectiveModel;
    }
    if (typeof payload.timeoutMs === "number" && Number.isFinite(payload.timeoutMs) && payload.timeoutMs > 0) {
      state.localTimeoutMs = payload.timeoutMs;
    }

    // 3. Update local state
    state.activePrivatePersona = resolvedPersona;
    state.conversationSessionId = undefined;
    applyAvatarVoiceProfile(resolvedPersona);
    syncPersonaSelectorUi();
    syncShellStatePanel();

    // 4. Destroy current PlayCanvas app
    if (stageRuntime) {
      try { stageRuntime.app.destroy(); } catch (e) { console.warn("[persona] App destroy error:", e); }
      stageRuntime = undefined;
      activeSpeechState = undefined;
    }
    if (timeOfDayLightingSyncHandle !== undefined) {
      window.clearInterval(timeOfDayLightingSyncHandle);
      timeOfDayLightingSyncHandle = undefined;
    }

    // 5. Re-create the canvas (app.destroy removes it)
    const root = document.querySelector<HTMLElement>("#app");
    if (!root) throw new Error("Missing #app root");
    const stageShell = root.querySelector<HTMLElement>(".stage-shell");
    if (stageShell) {
      // Remove old canvas if present
      const oldCanvas = stageShell.querySelector<HTMLCanvasElement>("#stage-canvas");
      if (oldCanvas) oldCanvas.remove();
      // Insert fresh canvas
      const newCanvas = document.createElement("canvas");
      newCanvas.id = "stage-canvas";
      newCanvas.className = "stage-canvas";
      stageShell.prepend(newCanvas);
    }

    // 6. Apply per-persona placement before rebooting (pre-load avatar position)
    const savedPlacement = loadPersonaPlacement(resolvedPersona);
    const personaPlacement = savedPlacement ?? PERSONA_STAGE_PLACEMENT[resolvedPersona] ?? PERSONA_STAGE_PLACEMENT["normal"];
    if (personaPlacement) {
      state.selectedAvatarPosition = [...personaPlacement.avatarPosition] as Vector3Tuple;
      state.selectedAvatarRotation = [...personaPlacement.avatarRotation] as Vector3Tuple;
      state.selectedCameraPosition = [...personaPlacement.cameraPosition] as Vector3Tuple;
      state.selectedCameraTarget   = [...personaPlacement.cameraTarget] as Vector3Tuple;
    }

    // 7. Reboot the stage with new persona
    state.sceneReady = false;
    await bootStage(root);

    // 8. Override the auto-fitted camera base and avatar base with the persona placement,
    //    then reset tuning to zero so the gizmo starts clean at the saved position.
    const bootedRuntime = stageRuntime as StageRuntime | undefined;
    if (bootedRuntime && personaPlacement) {
      applyPersonaPlacementToRuntime(bootedRuntime, personaPlacement);
    }

    // 9. Refresh the visible persona indicator
    syncPersonaSelectorUi();
  } catch (err) {
    console.error("[persona] Switch failed:", err);
    syncStatus("Persona switch failed â€” recovering previous stage...");
    const root = document.querySelector<HTMLElement>("#app");
    if (!stageRuntime && root) {
      try {
        state.activePrivatePersona = previousPersona;
        applyAvatarVoiceProfile(previousPersona);
        state.sceneReady = false;
        await bootStage(root);
        syncPersonaSelectorUi();
        syncStatus("Recovered previous persona after failed switch.");
      } catch (recoveryErr) {
        console.error("[persona] Recovery failed:", recoveryErr);
        syncStatus("Persona switch failed â€” try reloading.");
      }
    } else {
      syncStatus("Persona switch failed â€” try reloading.");
    }
  } finally {
    personaSwitchInProgress = false;
  }
}

function syncPersonaSelectorUi(): void {
  const select = document.querySelector<HTMLSelectElement>("#persona-select");
  if (select) select.value = state.activePrivatePersona ?? "normal";
  const label = document.querySelector<HTMLElement>("#persona-label");
  if (label) label.textContent = PERSONA_LABELS[state.activePrivatePersona ?? "normal"] ?? state.activePrivatePersona ?? "normal";
  const badge = document.querySelector<HTMLElement>("#persona-badge");
  if (badge) badge.textContent = getPersonaBadgeText();
}

function getPersonaBadgeText(): string {
  return PERSONA_LABELS[state.activePrivatePersona ?? "normal"] ?? "Normal (Gail)";
}

// â”€â”€ "Gail, lets dance" â€” girlfriend-only dance command â”€â”€

const DANCE_ANIMATION_FILES = [
  "26533_dance_street_dance.glb",
  "26547_perform_a_belly_dance.glb",
  "26548_perform_a_belly_dance.glb",
  "26603_street_dance_dance_battle.glb",
  "26605_street_dance.glb",
  "26609_street_dance.glb",
  "26647_dance_wildly.glb",
  "26649_dance_wildly.glb",
  "26654_dance_ballroom_dances.glb",
  "26655_dance_samba.glb",
  "27188_perform_hip_hop_dance.glb",
  "27315_dance.glb",
  "27319_dance.glb",
  "27321_dance_hip_hop.glb",
  "27322_perform_hip_hop_dance.glb",
  "27323_perform_hip_hop_dance.glb",
  "27324_perform_hip_hop_dance.glb",
  "27325_perform_hip_hop_dance.glb",
  "27332_perform_hip_hop_dance.glb",
  "27333_dance_hip_hop.glb",
  "27354_dance.glb",
  "27370_dance_hip_hop.glb",
  "27371_dance_hip_hop.glb",
  "27516_swing_dance.glb",
  "27663_dance.glb",
  "27664_dance.glb",
  "27895_dance_hip_hop.glb",
  "28107_dance_in_circles.glb",
  "28108_dance_ballroom_dances.glb",
  "28112_dance.glb",
  "28114_dance.glb",
  "28115_dance.glb",
  "28116_dance.glb",
  "28117_dance.glb",
  "28118_dance.glb",
  "28119_dance_samba.glb",
  "28120_dance_samba.glb",
  "28122_dance_samba.glb",
  "28123_dance.glb",
  "28130_dance_samba.glb",
  "28174_dance.glb",
  "28251_twist_and_dance.glb",
  "28639_dance_the_zombie_dance.glb",
  "28643_dance_the_zombie_dance.glb",
  "28644_dance_the_zombie_dance.glb",
  "28647_dance_the_zombie_dance.glb",
  "28789_dance.glb",
  "29393_dance.glb",
  "29457_dance.glb",
  "29466_dance.glb",
  "29504_dance_the_ballroom_dance.glb",
  "29663_dance.glb",
  "29834_perform_a_belly_dance.glb",
  "30295_ask_to_dance.glb",
];
const DANCE_SMOOTH_ANIMATION_FILES = [
  "26547_perform_a_belly_dance.glb",
  "26548_perform_a_belly_dance.glb",
  "26654_dance_ballroom_dances.glb",
  "26655_dance_samba.glb",
  "27516_swing_dance.glb",
  "28108_dance_ballroom_dances.glb",
  "28119_dance_samba.glb",
  "28120_dance_samba.glb",
  "28122_dance_samba.glb",
  "28130_dance_samba.glb",
  "29504_dance_the_ballroom_dance.glb",
  "29834_perform_a_belly_dance.glb",
  "30295_ask_to_dance.glb",
];
const DANCE_PLAYBACK_SPEED = 0.68;

let danceActive = false;
let lastWorkingDanceFile: string | undefined;
let dancePlaybackState: AvatarAnimationState | undefined;
let dancePreviousStateTrack: any;
let dancePlaylist: string[] = [];
let dancePlaylistIndex = -1;
let dancePlaybackDirection: "forward" | "reverse" = "forward";
let dancePlaybackTime = 0;
let dancePlaybackDuration = 0;

function getTrackDurationSeconds(track: any): number {
  const duration = Number(track?.duration ?? 0);
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  return duration;
}

function primeDancePingPong(track: any, animComponent: any): void {
  dancePlaybackDuration = Math.max(0, getTrackDurationSeconds(track));
  dancePlaybackDirection = "forward";
  dancePlaybackTime = 0;
  if (animComponent) {
    animComponent.speed = Math.abs(DANCE_PLAYBACK_SPEED);
  }
}

function setDanceLayerTimeIfSupported(layer: any, timeSeconds: number): void {
  if (!layer || !Number.isFinite(timeSeconds)) {
    return;
  }
  if (typeof layer.activeStateCurrentTime === "number") {
    layer.activeStateCurrentTime = timeSeconds;
    return;
  }
  if (typeof layer._timeInState === "number") {
    layer._timeInState = timeSeconds;
  }
}

function isHairGarmentForDance(garment: { kind: string; id?: string; slot?: string; name?: string }): boolean {
  if (garment.kind === "hair") {
    return true;
  }
  const signature = `${garment.id ?? ""} ${garment.slot ?? ""} ${garment.name ?? ""}`.toLowerCase();
  return signature.includes("hair");
}

function pickDanceCandidates(maxCount = 12): string[] {
  const pool = DANCE_ANIMATION_FILES.filter((f) => !danceBlacklist.has(f));
  if (pool.length === 0) {
    return [...DANCE_ANIMATION_FILES].slice(0, Math.max(1, maxCount));
  }
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(1, maxCount));
}

function buildDancePlaylist(): string[] {
  const pool = DANCE_ANIMATION_FILES.filter((f) => !danceBlacklist.has(f));
  if (pool.length === 0) return [...DANCE_ANIMATION_FILES];
  // Shuffle
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

async function changeDance(direction: "next" | "prev"): Promise<boolean> {
  if (!danceActive || !stageRuntime) return false;
  const { pc, app, animComponent, animationTracks } = stageRuntime;
  if (!animComponent?.baseLayer || !dancePlaybackState) return false;

  if (dancePlaylist.length === 0) {
    dancePlaylist = buildDancePlaylist();
    dancePlaylistIndex = 0;
  }

  const total = dancePlaylist.length;
  if (total === 0) return false;

  for (let attempt = 0; attempt < total; attempt++) {
    if (direction === "next") {
      dancePlaylistIndex = (dancePlaylistIndex + 1) % total;
    } else {
      dancePlaylistIndex = (dancePlaylistIndex - 1 + total) % total;
    }
    const file = dancePlaylist[dancePlaylistIndex];
    if (danceBlacklist.has(file)) continue;
    const danceUrl = `/client-assets/animations/dance/${file}?v=20260414`;
    try {
      const track = await loadAnimationTrack(pc, app, `dance_${file}`, danceUrl, 30000);
      if (!track || Number((track as any).duration ?? 0) <= 0) continue;
      lastWorkingDanceFile = file;
      animComponent.assignAnimation(dancePlaybackState, track);
      if (animationTracks) animationTracks[dancePlaybackState] = track;
      primeDancePingPong(track, animComponent);
      animComponent.baseLayer.transition(dancePlaybackState, 0.5);
      syncStatus(`Dancing: ${file.replace(/^\d+_/, "").replace(/\.glb$/, "").replace(/_/g, " ")}`);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

async function waitForGirlfriendStageReady(timeoutMs = 300000): Promise<boolean> {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (state.activePrivatePersona === "private_girlfriend" && stageRuntime) {
      return true;
    }
    await wait(200);
  }
  return false;
}

async function handleDanceCommand(): Promise<boolean> {
  if (state.activePrivatePersona !== "private_girlfriend") {
    console.log("[dance] Ignored — not in girlfriend mode");
    return false;
  }
  if (danceActive) {
    console.log("[dance] Already dancing");
    return true;
  }
  if (!stageRuntime) {
    syncStatus("Preparing dance stage...");
    const stageReady = await waitForGirlfriendStageReady();
    if (!stageReady || !stageRuntime) {
      console.warn("[dance] No stage runtime");
      return false;
    }
  }
  if (danceActive) {
    console.log("[dance] Already dancing");
    return true;
  }

  const { pc, app, garmentEntities, animComponent, animationAssigned, animationTracks } = stageRuntime;
  if (!animComponent?.baseLayer) {
    console.warn("[dance] No anim component available");
    return false;
  }

  const canUseDanceState = (stateName: AvatarAnimationState): boolean => {
    if (!animationAssigned?.[stateName]) {
      return false;
    }
    const layer = animComponent.baseLayer as any;
    const states = layer?.states;
    if (Array.isArray(states) && states.length > 0) {
      return states.some((entry: any) => entry === stateName || entry?.name === stateName);
    }
    if (states && typeof states === "object") {
      if (stateName in states) {
        return true;
      }
      return Object.values(states).some((entry: any) => entry?.name === stateName);
    }
    return true;
  };

  const selectedDanceState = (["dance", "ack", "talk", "listen", "idle"] as AvatarAnimationState[])
    .find((stateName) => canUseDanceState(stateName));
  if (!selectedDanceState) {
    syncStatus("Dance state unavailable");
    console.warn("[dance] Aborting - no compatible animation state for dance.");
    return false;
  }

  const hideDuringDance = (garmentEntities ?? []).filter((garment) => !isHairGarmentForDance(garment));
  const restoreGarments = () => {
    for (const garment of hideDuringDance) {
      garment.entity.enabled = true;
    }
  };

  const candidates = pickDanceCandidates(12);
  let selectedTrack: any;
  let selectedFile: string | undefined;
  let loadFailureReason = "no compatible dance tracks";

  for (const danceFile of candidates) {
    const danceUrl = `/client-assets/animations/dance/${danceFile}?v=20260414`;
    console.log(`[dance] Trying dance animation: ${danceFile}`);
    syncStatus(`Loading dance: ${danceFile}...`);
    try {
      const track = await loadAnimationTrack(pc, app, `dance_${danceFile}`, danceUrl, 30000);
      if (!track || Number(track.duration ?? 0) <= 0) {
        console.warn(`[dance] Track empty for ${danceFile}`);
        loadFailureReason = `empty track ${danceFile}`;
        continue;
      }
      selectedTrack = track;
      selectedFile = danceFile;
      lastWorkingDanceFile = danceFile;
      break;
    } catch (err) {
      console.warn(`[dance] Failed candidate ${danceFile}:`, err);
      loadFailureReason = `${danceFile}: ${String(err)}`;
    }
  }

  if (!selectedTrack || !selectedFile) {
    restoreGarments();
    syncStatus("Dance animation unavailable");
    console.warn(`[dance] Aborting — ${loadFailureReason}`);
    return false;
  }

  if (danceActive) {
    console.log("[dance] Already active before start");
    return true;
  }

  danceActive = true;
  for (const garment of hideDuringDance) {
    garment.entity.enabled = false;
  }
  console.log(`[dance] Hid ${hideDuringDance.length} non-hair garments`);

  try {
    dancePlaybackState = selectedDanceState;
    dancePreviousStateTrack = selectedDanceState !== "dance" ? animationTracks?.[selectedDanceState] : undefined;

    animComponent.assignAnimation(selectedDanceState, selectedTrack);
    if (animationTracks) {
      animationTracks[selectedDanceState] = selectedTrack;
    }
    if (animationAssigned) {
      animationAssigned[selectedDanceState] = true;
      if (selectedDanceState === "dance") {
        animationAssigned.dance = true;
      }
    }

    primeDancePingPong(selectedTrack, animComponent);
    animComponent.baseLayer.transition(selectedDanceState, selectedDanceState === "dance" ? 0.78 : 0.62);
    // Build the full shuffled playlist for this session so next/prev can navigate it
    dancePlaylist = buildDancePlaylist();
    dancePlaylistIndex = dancePlaylist.indexOf(selectedFile);
    if (dancePlaylistIndex < 0) dancePlaylistIndex = 0;
    console.log(`[dance] Playing: ${selectedFile} @ ${DANCE_PLAYBACK_SPEED}x via ${selectedDanceState}`);
    syncStatus(`Dancing: ${selectedFile.replace(/^\d+_/, "").replace(/\.glb$/, "").replace(/_/g, " ")}`);
    speakQuickBrowserPhrase("Let's dance!");
    return true;
  } catch (err) {
    console.error("[dance] Failed to start dance animation:", err);
    danceActive = false;
    dancePlaybackState = undefined;
    dancePreviousStateTrack = undefined;
    restoreGarments();
    syncStatus("Scene ready");
    return false;
  }
}

function stopDance(): void {
  if (!danceActive) return;
  danceActive = false;
  dancePlaybackDirection = "forward";
  dancePlaybackTime = 0;
  dancePlaybackDuration = 0;
  if (!stageRuntime) {
    dancePlaybackState = undefined;
    dancePreviousStateTrack = undefined;
    return;
  }
  const { garmentEntities, animComponent, animationAssigned, animationTracks } = stageRuntime;

  // Restore clothing visibility
  if (garmentEntities) {
    for (const garment of garmentEntities) {
      garment.entity.enabled = true;
    }
    console.log(`[dance] Restored ${garmentEntities.length} garment entities`);
  }

  // Restore fallback state track if dance temporarily reused ack/talk/listen.
  if (
    animComponent &&
    dancePlaybackState &&
    dancePlaybackState !== "dance" &&
    dancePreviousStateTrack
  ) {
    try {
      animComponent.assignAnimation(dancePlaybackState, dancePreviousStateTrack);
      if (animationTracks) {
        animationTracks[dancePlaybackState] = dancePreviousStateTrack;
      }
    } catch (err) {
      console.warn(`[dance] Failed to restore ${dancePlaybackState} track`, err);
    }
  }
  dancePlaybackState = undefined;
  dancePreviousStateTrack = undefined;

  // Return to idle animation
  if (animComponent?.baseLayer && animationAssigned?.idle) {
    animComponent.baseLayer.transition("idle", 0.86);
    // Reset speed after crossfade settles
    window.setTimeout(() => { if (animComponent) animComponent.speed = WORK_LITE_ANIMATION_PLAYBACK_SPEED; }, 900);
    console.log("[dance] Returned to idle");
  } else if (animComponent?.baseLayer) {
    console.warn("[dance] Idle state unavailable during stopDance; skipping idle transition.");
    window.setTimeout(() => { if (animComponent) animComponent.speed = WORK_LITE_ANIMATION_PLAYBACK_SPEED; }, 300);
  }
  syncStatus("Scene ready");
}

async function resolveAssetRoot(): Promise<string> {
  if (EXPLICIT_ASSET_ROOT) {
    return EXPLICIT_ASSET_ROOT;
  }
  try {
    const settings = await fetchJson<RuntimeSettingsResponse>("/client/runtime-settings");
    applyBodyMorphControlSettings(settings);
    return resolveEffectiveAssetRoot(settings.activeAssetRoot?.trim() || DEFAULT_ASSET_ROOT);
  } catch {
    return resolveEffectiveAssetRoot(DEFAULT_ASSET_ROOT);
  }
}

function resolveEffectiveAssetRoot(serverAssetRoot: string): string {
  if (EXPLICIT_ASSET_ROOT) {
    return EXPLICIT_ASSET_ROOT;
  }
  if (!DISABLE_LITE_ASSET_ROOT && serverAssetRoot === DEFAULT_ASSET_ROOT) {
    return OPTIMIZED_GAIL_ASSET_ROOT;
  }
  return serverAssetRoot || DEFAULT_ASSET_ROOT;
}

async function ensureConversationSession(): Promise<string> {
  if (state.conversationSessionId) {
    return state.conversationSessionId;
  }

  const response = await fetch("/conversation/sessions", {
    method: "POST",
    headers: buildGailHeaders(true),
    body: JSON.stringify({
      title: "Work-Lite Rebuild Chat",
      providerPreference: "local-llm",
    }),
  });

  if (!response.ok) {
    throw new Error(`Session creation failed (${response.status}).`);
  }

  const payload = await response.json() as { id?: string };
  if (!payload.id) {
    throw new Error("Session creation response did not include an id.");
  }

  state.conversationSessionId = payload.id;
  return payload.id;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutHandle = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutHandle);
  }
}

async function postConversationMessage(sessionId: string, content: string): Promise<string> {
  const response = await fetchWithTimeout(`/conversation/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: buildGailHeaders(true),
    body: JSON.stringify({ content }),
  }, FALLBACK_REQUEST_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error(`Message send failed (${response.status}).`);
  }

  const payload = await response.json() as ConversationMessageResponse;
  const directReply = payload.reply?.content?.trim();
  if (directReply) {
    return directReply;
  }

  return payload.session?.messages
    ?.slice()
    .reverse()
    .find((message) => message.role === "assistant")
    ?.content
    ?.trim() || "Response received with no assistant text.";
}

async function postConversationMessageStreaming(sessionId: string, content: string, onPartial?: (text: string) => void): Promise<string> {
  let response: Response;
  try {
    response = await fetchWithTimeout(`/conversation/sessions/${sessionId}/messages/stream`, {
      method: "POST",
      headers: buildGailHeaders(true),
      body: JSON.stringify({ content }),
    }, STREAM_REQUEST_TIMEOUT_MS);
  } catch (error) {
    console.warn("[stream] Streaming request failed before response. Falling back to non-stream route.", error);
    const fallback = await postConversationMessage(sessionId, content);
    onPartial?.(fallback);
    return fallback;
  }

  if (!response.ok) {
    const fallback = await postConversationMessage(sessionId, content);
    onPartial?.(fallback);
    return fallback;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const fallback = await postConversationMessage(sessionId, content);
    onPartial?.(fallback);
    return fallback;
  }

  const decoder = new TextDecoder();
  const sentenceEndPattern = /[.!?]\s/;
  let fullReply = "";
  let sentenceBuffer = "";
  let firstSentenceSpoken = false;

  const emitSentence = (text: string) => {
    const sentence = text.trim();
    if (!sentence) {
      return;
    }
    if (!firstSentenceSpoken) {
      firstSentenceSpoken = true;
    }
    speakQuickBrowserPhrase(sentence);
  };

  const processSseDataLine = (line: string) => {
    if (!line.startsWith("data:")) {
      return;
    }
    const jsonStr = line.slice(5).trimStart();
    if (!jsonStr || jsonStr === "[DONE]") {
      return;
    }
    try {
      const parsed = JSON.parse(jsonStr) as { delta?: string };
      if (!parsed.delta) {
        return;
      }

      clearThinkingFillerTimer();
      fullReply += parsed.delta;
      onPartial?.(fullReply);
      sentenceBuffer += parsed.delta;

      while (true) {
        const match = sentenceEndPattern.exec(sentenceBuffer);
        if (!match) {
          break;
        }
        const splitAt = match.index + match[0].length;
        const sentence = sentenceBuffer.slice(0, splitAt).trim();
        sentenceBuffer = sentenceBuffer.slice(splitAt);
        emitSentence(sentence);
      }

      if (!firstSentenceSpoken && sentenceBuffer.length >= 64) {
        const softSplitAt = sentenceBuffer.lastIndexOf(" ");
        if (softSplitAt >= 24) {
          const chunk = sentenceBuffer.slice(0, softSplitAt).trim();
          sentenceBuffer = sentenceBuffer.slice(softSplitAt + 1);
          emitSentence(chunk);
        }
      }
    } catch (parseErr) {
      console.warn("[stream] SSE JSON parse error:", parseErr);
    }
  };

  try {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      clearThinkingFillerTimer();
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line) {
          continue;
        }
        processSseDataLine(line);
      }
    }

    const tail = buffer.trim();
    if (tail) {
      processSseDataLine(tail);
    }
  } catch (streamError) {
    console.warn("[stream] Reader failure. Falling back.", streamError);
    const partialReply = fullReply.trim();
    if (partialReply) {
      onPartial?.(partialReply);
      return partialReply;
    }
    const fallback = await postConversationMessage(sessionId, content);
    onPartial?.(fallback);
    return fallback;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // no-op
    }
  }

  emitSentence(sentenceBuffer);
  const finalReply = fullReply.trim();
  if (finalReply) {
    onPartial?.(finalReply);
    return finalReply;
  }

  const fallback = await postConversationMessage(sessionId, content);
  onPartial?.(fallback);
  return fallback;
}

function appendChatMessage(
  role: "user" | "assistant" | "system",
  text: string,
): { inline?: HTMLElement; fullscreen?: HTMLElement } {
  const log = document.querySelector<HTMLElement>("#chat-log");
  const fsLog = document.querySelector<HTMLElement>("#fs-chat-log");
  const row = document.createElement("div");
  row.className = `chat-row ${role}`;
  row.textContent = text;

  let inline: HTMLElement | undefined;
  let fullscreen: HTMLElement | undefined;

  if (log) {
    log.append(row);
    log.scrollTop = log.scrollHeight;
    inline = row;
  }
  if (fsLog) {
    const clone = row.cloneNode(true) as HTMLElement;
    fsLog.append(clone);
    fsLog.scrollTop = fsLog.scrollHeight;
    fullscreen = clone;
  }

  return { inline, fullscreen };
}

function syncFullscreenStatus(): void {
  const statusText = document.querySelector<HTMLElement>("#fs-status-text");
  const providerStatus = document.querySelector<HTMLElement>("#fs-provider-status");
  const voiceMode = document.querySelector<HTMLElement>("#fs-voice-mode");
  const voiceName = document.querySelector<HTMLElement>("#fs-voice-name");
  if (statusText) { statusText.textContent = state.status; }
  if (providerStatus) { providerStatus.textContent = state.providerSummary; }
  if (voiceMode) { voiceMode.textContent = state.voiceMode === "wake_word" ? `MIC ${state.wakeWord}` : state.voiceMode; }
  if (voiceName) { voiceName.textContent = state.browserVoiceName.replace(/\s*\(Natural\)\s*/g, " ").replace(/Microsoft\s+/i, ""); }
  // Mirror camera to PIP if active
  const fsCameraVideo = document.querySelector<HTMLVideoElement>("#fs-camera-video");
  if (fsCameraVideo && state.cameraStream && !fsCameraVideo.srcObject) {
    fsCameraVideo.srcObject = state.cameraStream;
  }
}

function pickBundleAsset(assets: ManifestAsset[], id: string, kind?: string, slot?: string): ManifestAsset | undefined {
  return assets.find((asset) => asset.id === id)
    ?? assets.find((asset) => asset.kind === kind && asset.slot === slot)
    ?? assets.find((asset) => asset.kind === kind);
}

function isPrivateManifestAsset(asset: ManifestAsset): boolean {
  const id = (asset.id ?? "").toLowerCase();
  const slot = (asset.slot ?? "").toLowerCase();
  return id.startsWith("private_") || id.startsWith("girlfriend_") || slot.startsWith("private") || slot.startsWith("girlfriend");
}

function isAssetForPersona(asset: ManifestAsset, persona: string): boolean {
  const id = (asset.id ?? "").toLowerCase();
  const slot = (asset.slot ?? "").toLowerCase();
  if (persona === "private_counselor") {
    return id.startsWith("private_") || slot.startsWith("private");
  }
  if (persona === "private_girlfriend") {
    return id.startsWith("girlfriend_") || slot.startsWith("girlfriend");
  }
  return false;
}

function getDisplayAssets(
  _assetRoot: string,
  manifest: AssetManifestResponse,
  bodyAssetId: string,
  activePrivatePersona?: string,
): ManifestAsset[] {
  const coreAssetIds = new Set(manifest.coreAssetIds ?? []);
  const preferPrivateModules = activePrivatePersona === "private_counselor" || activePrivatePersona === "private_girlfriend";
  const renderableAssets = (manifest.assets ?? []).filter((asset) => {
    if (!asset.resolvedPath || asset.id === bodyAssetId || asset.present === false) {
      return false;
    }
    if (!(asset.kind === "clothing" || asset.kind === "accessory" || asset.kind === "hair")) {
      return false;
    }
    // When in a persona mode, skip assets belonging to a DIFFERENT persona
    if (preferPrivateModules && isPrivateManifestAsset(asset) && !isAssetForPersona(asset, activePrivatePersona!)) {
      return false;
    }
    return asset.autoLoad === true || asset.required === true || coreAssetIds.has(asset.id);
  });
  const buckets = new Map<string, { private: ManifestAsset[]; standard: ManifestAsset[] }>();

  for (const asset of renderableAssets) {
    const kindKey = asset.kind ?? "other";
    const existing = buckets.get(kindKey) ?? { private: [], standard: [] };
    if (isPrivateManifestAsset(asset)) {
      existing.private.push(asset);
    } else {
      existing.standard.push(asset);
    }
    buckets.set(kindKey, existing);
  }

  const displayAssets: ManifestAsset[] = [];
  for (const bucket of buckets.values()) {
    if (preferPrivateModules) {
      if (bucket.private.length > 0) {
        displayAssets.push(...bucket.private);
      } else {
        displayAssets.push(...bucket.standard);
      }
      continue;
    }
    if (bucket.standard.length > 0) {
      displayAssets.push(...bucket.standard);
    } else {
      displayAssets.push(...bucket.private);
    }
  }

  const supplementalAssets: ManifestAsset[] = [];

  const byPriority = (asset: ManifestAsset): number => {
    if (asset.kind === "clothing") {
      return 0;
    }
    if (asset.kind === "accessory") {
      return 1;
    }
    if (asset.kind === "hair") {
      return 2;
    }
    return 3;
  };

  const deduped = new Map<string, ManifestAsset>();
  for (const asset of [...displayAssets, ...supplementalAssets]) {
    if (!asset.resolvedPath) {
      continue;
    }
    deduped.set(asset.resolvedPath, asset);
  }

  return [...deduped.values()].sort((left, right) => byPriority(left) - byPriority(right));
}

function getPersonaAvatarMapping(
  manifest: AssetManifestResponse,
  persona: string,
): { bodyAssetId: string; displayPrefix: string; presetId?: string; label?: string } {
  const map = manifest.personaMap ?? {};
  return map[persona] ?? PERSONA_AVATAR_MAP[persona] ?? PERSONA_AVATAR_MAP.normal;
}

function toClientAssetUrl(resolvedPath: string): string {
  const normalized = resolvedPath.replaceAll("\\", "/");
  const marker = "playcanvas-app/assets/";
  const index = normalized.indexOf(marker);
  if (index < 0) {
    throw new Error(`Unable to resolve client asset URL for ${resolvedPath}`);
  }
  return `/client-assets/${normalized.slice(index + marker.length)}`;
}

function toVersionedClientAssetUrl(asset: Pick<ManifestAsset, "resolvedPath" | "id" | "fileSizeBytes">): string {
  if (!asset.resolvedPath) {
    throw new Error("Missing resolvedPath for versioned client asset URL.");
  }

  const baseUrl = toClientAssetUrl(asset.resolvedPath);
  const version = encodeURIComponent(`${CLIENT_ASSET_VERSION_SALT}-${asset.id ?? "asset"}-${asset.fileSizeBytes ?? 0}`);
  return `${baseUrl}?v=${version}`;
}

function buildVersionedStaticClientAssetUrl(assetPath: string, versionKey: string): string {
  const normalizedPath = assetPath.replaceAll("\\", "/").replace(/^\/+/, "");
  const version = encodeURIComponent(`${CLIENT_ASSET_VERSION_SALT}-${versionKey}`);
  return `/client-assets/${normalizedPath}?v=${version}`;
}

function getEnvironmentProfilesUrl(): string {
  return buildVersionedStaticClientAssetUrl("environments/environment-profiles.json", "profiles");
}

function getEnvironmentStorageScope(profileId: string, tuningStorageVersion?: string): string {
  const normalizedId = profileId.trim();
  const normalizedVersion = tuningStorageVersion?.trim();
  return normalizedVersion ? `${normalizedId}.${normalizedVersion}` : normalizedId;
}

function getEnvironmentTuningStorageKey(storageScope: string): string {
  return `gail.worklite.environmentTuning.${storageScope}`;
}

function getAvatarTuningStorageKey(storageScope: string): string {
  return `gail.worklite.avatarTuning.${storageScope}`;
}

function getCameraTuningStorageKey(storageScope: string): string {
  return `gail.worklite.cameraTuning.${storageScope}`;
}

function getPersonaPlacementStorageKey(persona: string): string {
  return `gail.worklite.personaPlacement.${persona}`;
}

function loadPersonaPlacement(persona: string): PersonaPlacement | undefined {
  try {
    const raw = window.localStorage.getItem(getPersonaPlacementStorageKey(persona));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<PersonaPlacement>;
    if (!parsed.avatarPosition || !parsed.cameraPosition || !parsed.cameraTarget) return undefined;
    return {
      avatarPosition: normalizeVector3(parsed.avatarPosition, STAGE_AVATAR_POSITION),
      avatarRotation: normalizeVector3(parsed.avatarRotation, STAGE_AVATAR_ROTATION),
      cameraPosition: normalizeVector3(parsed.cameraPosition, STAGE_CAMERA_POSITION),
      cameraTarget:   normalizeVector3(parsed.cameraTarget,   STAGE_CAMERA_TARGET),
    };
  } catch {
    return undefined;
  }
}

function savePersonaPlacement(persona: string, placement: PersonaPlacement): void {
  try {
    window.localStorage.setItem(getPersonaPlacementStorageKey(persona), JSON.stringify(placement));
  } catch { /* storage unavailable */ }
}

/** Snapshot the current effective avatar + camera positions and persist them for the active persona. */
function savePersonaPlacementFromRuntime(): void {
  const r = stageRuntime;
  if (!r?.avatarBasePosition || !r.avatarBaseRotation || !r.cameraBasePosition || !r.cameraBaseTarget) return;
  const at = r.avatarTuning ?? DEFAULT_ENVIRONMENT_TUNING;
  const ct = r.cameraTuning ?? DEFAULT_CAMERA_STAGE_TUNING;
  savePersonaPlacement(state.activePrivatePersona, {
    avatarPosition: [
      r.avatarBasePosition[0] + at.offset[0],
      r.avatarBasePosition[1] + at.offset[1],
      r.avatarBasePosition[2] + at.offset[2],
    ],
    avatarRotation: [
      r.avatarBaseRotation[0] + at.rotation[0],
      r.avatarBaseRotation[1] + at.rotation[1],
      r.avatarBaseRotation[2] + at.rotation[2],
    ],
    cameraPosition: [
      r.cameraBasePosition[0] + ct.positionOffset[0],
      r.cameraBasePosition[1] + ct.positionOffset[1],
      r.cameraBasePosition[2] + ct.positionOffset[2],
    ],
    cameraTarget: [
      r.cameraBaseTarget[0] + ct.targetOffset[0],
      r.cameraBaseTarget[1] + ct.targetOffset[1],
      r.cameraBaseTarget[2] + ct.targetOffset[2],
    ],
  });
}

/**
 * Override the runtime's base positions with the given placement and reset
 * tuning offsets to zero so the gizmo starts clean at the new position.
 */
function applyPersonaPlacementToRuntime(runtime: StageRuntime, placement: PersonaPlacement): void {
  // Avatar: set new base position/rotation, zero out translation/rotation tuning.
  runtime.avatarBasePosition = [...placement.avatarPosition] as Vector3Tuple;
  runtime.avatarBaseRotation = [...placement.avatarRotation] as Vector3Tuple;
  if (runtime.avatarTuning) {
    runtime.avatarTuning.offset = [0, 0, 0];
    runtime.avatarTuning.rotation = [0, 0, 0];
  } else {
    runtime.avatarTuning = cloneEnvironmentTuning(DEFAULT_ENVIRONMENT_TUNING);
  }
  const avatarScope = runtime.environmentStorageScope ?? runtime.environmentProfileId;
  if (avatarScope) saveAvatarTuning(avatarScope, runtime.avatarTuning);
  applyAvatarTuning(runtime);

  // Camera: set new base, zero out position and target offsets
  runtime.cameraBasePosition = [...placement.cameraPosition] as Vector3Tuple;
  runtime.cameraBaseTarget   = [...placement.cameraTarget] as Vector3Tuple;
  runtime.cameraTuning = cloneCameraStageTuning(DEFAULT_CAMERA_STAGE_TUNING);
  const cameraScope = runtime.environmentStorageScope ?? runtime.environmentProfileId;
  if (cameraScope) saveCameraTuning(cameraScope, runtime.cameraTuning);
  applyCameraTuning(runtime);
}

function cloneEnvironmentTuning(source: EnvironmentTransformTuning): EnvironmentTransformTuning {
  return {
    offset: [...source.offset] as Vector3Tuple,
    rotation: [...source.rotation] as Vector3Tuple,
    scale: [...source.scale] as Vector3Tuple,
  };
}

function cloneCameraStageTuning(source: CameraStageTuning): CameraStageTuning {
  return {
    positionOffset: [...source.positionOffset] as Vector3Tuple,
    targetOffset: [...source.targetOffset] as Vector3Tuple,
  };
}

function getSavedTransformTuning(storageKey: string): EnvironmentTransformTuning {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return cloneEnvironmentTuning(DEFAULT_ENVIRONMENT_TUNING);
    }
    const parsed = JSON.parse(raw) as Partial<EnvironmentTransformTuning>;
    return {
      offset: normalizeVector3(parsed.offset, DEFAULT_ENVIRONMENT_TUNING.offset),
      rotation: normalizeVector3(parsed.rotation, DEFAULT_ENVIRONMENT_TUNING.rotation),
      scale: normalizeVector3(parsed.scale, DEFAULT_ENVIRONMENT_TUNING.scale),
    };
  } catch {
    return cloneEnvironmentTuning(DEFAULT_ENVIRONMENT_TUNING);
  }
}

function getSavedEnvironmentTuning(storageScope: string): EnvironmentTransformTuning {
  return getSavedTransformTuning(getEnvironmentTuningStorageKey(storageScope));
}

function getSavedAvatarTuning(storageScope: string): EnvironmentTransformTuning {
  return getSavedTransformTuning(getAvatarTuningStorageKey(storageScope));
}

function saveEnvironmentTuning(storageScope: string, tuning: EnvironmentTransformTuning): void {
  window.localStorage.setItem(getEnvironmentTuningStorageKey(storageScope), JSON.stringify(tuning));
}

function saveAvatarTuning(storageScope: string, tuning: EnvironmentTransformTuning): void {
  window.localStorage.setItem(getAvatarTuningStorageKey(storageScope), JSON.stringify(tuning));
}

function getSavedCameraTuning(storageScope: string): CameraStageTuning {
  try {
    const raw = window.localStorage.getItem(getCameraTuningStorageKey(storageScope));
    if (!raw) {
      return cloneCameraStageTuning(DEFAULT_CAMERA_STAGE_TUNING);
    }
    const parsed = JSON.parse(raw) as Partial<CameraStageTuning>;
    return {
      positionOffset: normalizeVector3(parsed.positionOffset, DEFAULT_CAMERA_STAGE_TUNING.positionOffset),
      targetOffset: normalizeVector3(parsed.targetOffset, DEFAULT_CAMERA_STAGE_TUNING.targetOffset),
    };
  } catch {
    return cloneCameraStageTuning(DEFAULT_CAMERA_STAGE_TUNING);
  }
}

function saveCameraTuning(storageScope: string, tuning: CameraStageTuning): void {
  window.localStorage.setItem(getCameraTuningStorageKey(storageScope), JSON.stringify(tuning));
}

function trimNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatVector3(values: readonly number[]): string {
  return values.map((value) => trimNumber(value)).join(", ");
}

function describeTransformTuning(tuning: EnvironmentTransformTuning): string {
  return `offset ${formatVector3(tuning.offset)} | rot ${formatVector3(tuning.rotation)} | scale ${formatVector3(tuning.scale)}`;
}

function describeCameraTuning(tuning: CameraStageTuning): string {
  return `pos ${formatVector3(tuning.positionOffset)} | target ${formatVector3(tuning.targetOffset)}`;
}

function setEnvironmentTuningSummary(tuning?: EnvironmentTransformTuning): void {
  if (!stageRuntime?.environmentEntity || !stageRuntime.environmentProfileId || !tuning) {
    state.environmentTuningSummary = "no environment loaded";
    return;
  }
  state.environmentTuningSummary = describeTransformTuning(tuning);
}

function applyEnvironmentTuning(runtime?: StageRuntime): void {
  const activeRuntime = runtime ?? stageRuntime;
  if (!activeRuntime?.environmentEntity || !activeRuntime.environmentBasePosition || !activeRuntime.environmentTuning) {
    setEnvironmentTuningSummary(undefined);
    syncShellStatePanel();
    return;
  }
  const tuning = activeRuntime.environmentTuning;
  activeRuntime.environmentEntity.setLocalPosition(
    activeRuntime.environmentBasePosition[0] + tuning.offset[0],
    activeRuntime.environmentBasePosition[1] + tuning.offset[1],
    activeRuntime.environmentBasePosition[2] + tuning.offset[2],
  );
  activeRuntime.environmentEntity.setLocalEulerAngles(...tuning.rotation);
  activeRuntime.environmentEntity.setLocalScale(...tuning.scale);
  syncExteriorFloodLights(activeRuntime);
  setEnvironmentTuningSummary(tuning);
  syncShellStatePanel();
}

function applyAvatarTuning(runtime?: StageRuntime): void {
  const activeRuntime = runtime ?? stageRuntime;
  if (
    !activeRuntime?.avatarRoot
    || !activeRuntime.avatarTuning
    || !activeRuntime.avatarBasePosition
    || !activeRuntime.avatarBaseRotation
    || !activeRuntime.avatarBaseScale
  ) {
    syncShellStatePanel();
    return;
  }
  const tuning = activeRuntime.avatarTuning;
  activeRuntime.avatarRoot.setLocalPosition(
    activeRuntime.avatarBasePosition[0] + tuning.offset[0],
    activeRuntime.avatarBasePosition[1] + tuning.offset[1],
    activeRuntime.avatarBasePosition[2] + tuning.offset[2],
  );
  activeRuntime.avatarRoot.setLocalEulerAngles(
    activeRuntime.avatarBaseRotation[0] + tuning.rotation[0],
    activeRuntime.avatarBaseRotation[1] + tuning.rotation[1],
    activeRuntime.avatarBaseRotation[2] + tuning.rotation[2],
  );
  activeRuntime.avatarRoot.setLocalScale(
    activeRuntime.avatarBaseScale[0] * tuning.scale[0],
    activeRuntime.avatarBaseScale[1] * tuning.scale[1],
    activeRuntime.avatarBaseScale[2] * tuning.scale[2],
  );
  syncExteriorFloodLights(activeRuntime);
  syncShellStatePanel();
}

function applyCameraTuning(runtime?: StageRuntime): void {
  const activeRuntime = runtime ?? stageRuntime;
  if (!activeRuntime?.camera || !activeRuntime.cameraBasePosition || !activeRuntime.cameraBaseTarget || !activeRuntime.cameraTuning) {
    syncShellStatePanel();
    return;
  }
  const tuning = activeRuntime.cameraTuning;
  const position: Vector3Tuple = [
    activeRuntime.cameraBasePosition[0] + tuning.positionOffset[0],
    activeRuntime.cameraBasePosition[1] + tuning.positionOffset[1],
    activeRuntime.cameraBasePosition[2] + tuning.positionOffset[2],
  ];
  const target: Vector3Tuple = [
    activeRuntime.cameraBaseTarget[0] + tuning.targetOffset[0],
    activeRuntime.cameraBaseTarget[1] + tuning.targetOffset[1],
    activeRuntime.cameraBaseTarget[2] + tuning.targetOffset[2],
  ];
  activeRuntime.camera.setLocalPosition(...position);
  activeRuntime.camera.lookAt(...target);
  syncShellStatePanel();
}

function readEnvironmentTuningInputs(root: ParentNode): EnvironmentTransformTuning | undefined {
  const readVector = (field: keyof EnvironmentTransformTuning, fallback: Vector3Tuple): Vector3Tuple => {
    const axes = ["x", "y", "z"] as const;
    return axes.map((axis, index) => {
      const input = root.querySelector<HTMLInputElement>(`input[data-stage-scope="environment"][data-stage-field="${field}"][data-stage-axis="${axis}"]`);
      const parsed = input ? Number.parseFloat(input.value) : NaN;
      return Number.isFinite(parsed) ? parsed : fallback[index];
    }) as Vector3Tuple;
  };
  const current = stageRuntime?.environmentTuning ?? DEFAULT_ENVIRONMENT_TUNING;
  if (!stageRuntime?.environmentEntity) {
    return undefined;
  }
  return {
    offset: readVector("offset", current.offset),
    rotation: readVector("rotation", current.rotation),
    scale: readVector("scale", current.scale),
  };
}

function readAvatarTuningInputs(root: ParentNode): EnvironmentTransformTuning | undefined {
  const readVector = (field: keyof EnvironmentTransformTuning, fallback: Vector3Tuple): Vector3Tuple => {
    const axes = ["x", "y", "z"] as const;
    return axes.map((axis, index) => {
      const input = root.querySelector<HTMLInputElement>(`input[data-stage-scope="avatar"][data-stage-field="${field}"][data-stage-axis="${axis}"]`);
      const parsed = input ? Number.parseFloat(input.value) : NaN;
      return Number.isFinite(parsed) ? parsed : fallback[index];
    }) as Vector3Tuple;
  };
  const current = stageRuntime?.avatarTuning ?? DEFAULT_ENVIRONMENT_TUNING;
  if (!stageRuntime?.avatarRoot) {
    return undefined;
  }
  return {
    offset: readVector("offset", current.offset),
    rotation: readVector("rotation", current.rotation),
    scale: readVector("scale", current.scale),
  };
}

function readCameraTuningInputs(root: ParentNode): CameraStageTuning | undefined {
  const readVector = (field: keyof CameraStageTuning, fallback: Vector3Tuple): Vector3Tuple => {
    const axes = ["x", "y", "z"] as const;
    return axes.map((axis, index) => {
      const input = root.querySelector<HTMLInputElement>(`input[data-stage-scope="camera"][data-stage-field="${field}"][data-stage-axis="${axis}"]`);
      const parsed = input ? Number.parseFloat(input.value) : NaN;
      return Number.isFinite(parsed) ? parsed : fallback[index];
    }) as Vector3Tuple;
  };
  const current = stageRuntime?.cameraTuning ?? DEFAULT_CAMERA_STAGE_TUNING;
  if (!stageRuntime?.camera) {
    return undefined;
  }
  return {
    positionOffset: readVector("positionOffset", current.positionOffset),
    targetOffset: readVector("targetOffset", current.targetOffset),
  };
}

function updateStageTuningFromPanel(root: ParentNode): void {
  if (!stageRuntime?.environmentProfileId) {
    return;
  }
  const environmentTuning = readEnvironmentTuningInputs(root);
  if (environmentTuning && stageRuntime.environmentEntity) {
    stageRuntime.environmentTuning = environmentTuning;
    saveEnvironmentTuning(stageRuntime.environmentStorageScope ?? stageRuntime.environmentProfileId, environmentTuning);
    applyEnvironmentTuning();
  }
  const avatarTuning = readAvatarTuningInputs(root);
  if (avatarTuning && stageRuntime.avatarRoot) {
    stageRuntime.avatarTuning = avatarTuning;
    saveAvatarTuning(stageRuntime.environmentStorageScope ?? stageRuntime.environmentProfileId, avatarTuning);
    applyAvatarTuning();
    savePersonaPlacementFromRuntime();
  }
  const cameraTuning = readCameraTuningInputs(root);
  if (cameraTuning && stageRuntime.camera) {
    stageRuntime.cameraTuning = cameraTuning;
    saveCameraTuning(stageRuntime.environmentStorageScope ?? stageRuntime.environmentProfileId, cameraTuning);
    applyCameraTuning();
    savePersonaPlacementFromRuntime();
  }
}

function resetEnvironmentTuning(root: ParentNode): void {
  if (!stageRuntime?.environmentEntity || !stageRuntime.environmentProfileId) {
    return;
  }
  stageRuntime.environmentTuning = cloneEnvironmentTuning(DEFAULT_ENVIRONMENT_TUNING);
  saveEnvironmentTuning(stageRuntime.environmentStorageScope ?? stageRuntime.environmentProfileId, stageRuntime.environmentTuning);
  applyEnvironmentTuning();
  syncViewportGizmoUi();
}

function resetAvatarTuning(root: ParentNode): void {
  if (!stageRuntime?.avatarRoot || !stageRuntime.environmentProfileId) {
    return;
  }
  stageRuntime.avatarTuning = cloneEnvironmentTuning(DEFAULT_ENVIRONMENT_TUNING);
  saveAvatarTuning(stageRuntime.environmentStorageScope ?? stageRuntime.environmentProfileId, stageRuntime.avatarTuning);
  applyAvatarTuning();
  syncViewportGizmoUi();
}

function resetCameraTuning(root: ParentNode): void {
  if (!stageRuntime?.camera || !stageRuntime.environmentProfileId) {
    return;
  }
  stageRuntime.cameraTuning = cloneCameraStageTuning(DEFAULT_CAMERA_STAGE_TUNING);
  saveCameraTuning(stageRuntime.environmentStorageScope ?? stageRuntime.environmentProfileId, stageRuntime.cameraTuning);
  applyCameraTuning();
  syncViewportGizmoUi();
}

async function copyStageTuning(): Promise<void> {
  if (!stageRuntime?.environmentProfileId || !stageRuntime.environmentTuning) {
    return;
  }
  const payload = JSON.stringify({
    sceneId: stageRuntime.environmentProfileId,
    environment: stageRuntime.environmentTuning,
    avatar: stageRuntime.avatarTuning ?? DEFAULT_ENVIRONMENT_TUNING,
    camera: stageRuntime.cameraTuning ?? DEFAULT_CAMERA_STAGE_TUNING,
  }, null, 2);
  try {
    await navigator.clipboard.writeText(payload);
    syncStatus("Environment values copied");
    window.setTimeout(() => syncStatus(state.sceneReady ? "Scene ready" : state.status), 1200);
  } catch (error) {
    console.warn("[env-tune] Failed to copy environment tuning", error);
  }
}

async function loadContainerEntity(pc: any, app: any, name: string, url: string, timeoutMs: number): Promise<any> {
  const asset = new pc.Asset(name, "container", { url });
  app.assets.add(asset);
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeoutHandle = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      app.assets.remove(asset);
      reject(new Error(`Timed out loading ${name}`));
    }, timeoutMs);
    asset.ready(() => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutHandle);
      resolve();
    });
    asset.once("error", (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutHandle);
      app.assets.remove(asset);
      reject(error);
    });
    app.assets.load(asset);
  });

  const entity = asset.resource.instantiateRenderEntity();
  entity.setLocalScale(1, 1, 1);
  entity.setLocalPosition(0, 0, 0);
  return entity;
}

async function loadContainerAsset(pc: any, app: any, name: string, url: string, timeoutMs: number): Promise<any> {
  const asset = new pc.Asset(name, "container", { url });
  app.assets.add(asset);
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeoutHandle = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      app.assets.remove(asset);
      reject(new Error(`Timed out loading ${name}`));
    }, timeoutMs);
    asset.ready(() => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutHandle);
      resolve();
    });
    asset.once("error", (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutHandle);
      app.assets.remove(asset);
      reject(error);
    });
    app.assets.load(asset);
  });
  return asset;
}

async function loadTextureAsset(pc: any, app: any, name: string, url: string, timeoutMs: number): Promise<any> {
  const asset = new pc.Asset(name, "texture", { url }, { encoding: "srgb" });
  app.assets.add(asset);
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeoutHandle = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      app.assets.remove(asset);
      reject(new Error(`Timed out loading ${name}`));
    }, timeoutMs);
    asset.ready(() => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutHandle);
      resolve();
    });
    asset.once("error", (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutHandle);
      app.assets.remove(asset);
      reject(error);
    });
    app.assets.load(asset);
  });
  return asset;
}

async function createBackdropEntity(pc: any, app: any, name: string, url: string, timeoutMs: number): Promise<any> {
  const textureAsset = await loadTextureAsset(pc, app, `${name}-texture`, url, timeoutMs);
  if (textureAsset?.resource) {
    textureAsset.resource.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
    textureAsset.resource.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
  }

  const material = new pc.StandardMaterial();
  material.useLighting = false;
  material.useFog = false;
  material.useSkybox = false;
  material.useTonemap = false;
  material.diffuse = new pc.Color(0, 0, 0);
  material.emissive = new pc.Color(1, 1, 1);
  material.emissiveIntensity = 1;
  material.emissiveMap = textureAsset.resource;
  material.cull = pc.CULLFACE_NONE;
  material.update();

  const entity = new pc.Entity(name);
  entity.addComponent("render", {
    type: "plane",
    castShadows: false,
    castShadowsLightmap: false,
    receiveShadows: false,
  });
  entity.render.material = material;
  entity.enabled = false;
  return entity;
}

async function createBackdropShellEntity(pc: any, app: any, name: string, url: string, timeoutMs: number): Promise<any> {
  const textureAsset = await loadTextureAsset(pc, app, `${name}-texture`, url, timeoutMs);
  if (textureAsset?.resource) {
    textureAsset.resource.addressU = pc.ADDRESS_REPEAT;
    textureAsset.resource.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
    textureAsset.resource.minFilter = pc.FILTER_LINEAR_MIPMAP_LINEAR;
    textureAsset.resource.magFilter = pc.FILTER_LINEAR;
    textureAsset.resource.anisotropy = BACKDROP_TEXTURE_ANISOTROPY;
  }

  const material = new pc.StandardMaterial();
  material.useLighting = false;
  material.useFog = false;
  material.useSkybox = false;
  material.useTonemap = false;
  material.diffuse = new pc.Color(0, 0, 0);
  material.emissive = new pc.Color(1, 1, 1);
  material.emissiveIntensity = 0.92;
  material.emissiveMap = textureAsset.resource;
  material.cull = pc.CULLFACE_NONE;
  material.update();

  const entity = new pc.Entity(name);
  entity.addComponent("render", {
    type: "cylinder",
    castShadows: false,
    castShadowsLightmap: false,
    receiveShadows: false,
  });
  entity.render.material = material;
  entity.enabled = false;
  return entity;
}

async function loadAnimationTrack(pc: any, app: any, name: string, url: string, timeoutMs: number): Promise<any | undefined> {
  const asset = await loadContainerAsset(pc, app, name, url, timeoutMs);
  return asset?.resource?.animations?.[0]?.resource;
}

async function loadContainerEntityWithRetry(
  pc: any,
  app: any,
  name: string,
  url: string,
  timeoutMs: number,
  maxAttempts: number,
): Promise<any> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await loadContainerEntity(pc, app, name, url, timeoutMs);
    } catch (error) {
      lastError = error;
      console.warn(`Asset load attempt ${attempt}/${maxAttempts} failed for ${name}`, error);
      if (attempt < maxAttempts) {
        await wait(400 * attempt);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to load ${name}`);
}

function measureRenderBounds(target: {
  findComponents: (type: string) => Array<{ meshInstances?: Array<{ aabb: { center: { x: number; y: number; z: number }; halfExtents: { x: number; y: number; z: number } } }> }>;
}): {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
} {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const renderComponent of target.findComponents("render")) {
    for (const meshInstance of renderComponent.meshInstances ?? []) {
      const { center, halfExtents } = meshInstance.aabb;
      minX = Math.min(minX, center.x - halfExtents.x);
      minY = Math.min(minY, center.y - halfExtents.y);
      minZ = Math.min(minZ, center.z - halfExtents.z);
      maxX = Math.max(maxX, center.x + halfExtents.x);
      maxY = Math.max(maxY, center.y + halfExtents.y);
      maxZ = Math.max(maxZ, center.z + halfExtents.z);
    }
  }

  return { minX, minY, minZ, maxX, maxY, maxZ };
}

function fitCameraToBounds(
  camera: { setLocalPosition: (x: number, y: number, z: number) => void; lookAt: (x: number, y: number, z: number) => void; camera?: { fov?: number } },
  bounds: StageBounds,
): { position: Vector3Tuple; target: Vector3Tuple } {
  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const centerZ = (bounds.minZ + bounds.maxZ) * 0.5;
  const targetY = bounds.minY + bounds.height * 0.56;
  const fov = ((camera.camera?.fov ?? 45) * Math.PI) / 180;
  const distance = Math.max(
    (bounds.height * 1.02) / Math.max(0.12, Math.tan(fov * 0.5)),
    bounds.width * 3.2,
    bounds.depth * 6,
  );
  const zoomedDistance = distance * 0.68;
  const cameraX = centerX;
  const cameraY = targetY + bounds.height * 0.18;
  const cameraZ = centerZ + zoomedDistance + 0.2;
  camera.setLocalPosition(cameraX, cameraY, cameraZ);
  camera.lookAt(centerX, targetY, centerZ);
  console.info(`Rebuild fitted camera ${JSON.stringify({ cameraX, cameraY, cameraZ, targetX: centerX, targetY, targetZ: centerZ, distance, zoomedDistance })}`);
  return {
    position: [cameraX, cameraY, cameraZ],
    target: [centerX, targetY, centerZ],
  };
}

function alignEntityToReference(
  entity: { setLocalPosition: (x: number, y: number, z: number) => void; setLocalScale: (x: number, y: number, z: number) => void },
  referenceBounds: StageBounds,
): void {
  const initialBounds = measureSkeletonBounds(entity);
  if (!initialBounds) {
    return;
  }

  const scale = Math.max(0.5, Math.min(1.5, referenceBounds.height / Math.max(0.001, initialBounds.height)));
  entity.setLocalScale(scale, scale, scale);

  const scaledBounds = measureSkeletonBounds(entity);
  if (!scaledBounds) {
    return;
  }

  const referenceCenterX = (referenceBounds.minX + referenceBounds.maxX) * 0.5;
  const referenceCenterZ = (referenceBounds.minZ + referenceBounds.maxZ) * 0.5;
  const entityCenterX = (scaledBounds.minX + scaledBounds.maxX) * 0.5;
  const entityCenterZ = (scaledBounds.minZ + scaledBounds.maxZ) * 0.5;
  entity.setLocalPosition(
    referenceCenterX - entityCenterX,
    referenceBounds.minY - scaledBounds.minY,
    referenceCenterZ - entityCenterZ,
  );
}

function tuneEnvironmentGlassMaterials(pc: any, entity: any): void {
  for (const renderComponent of entity.findComponents?.("render") ?? []) {
    for (const meshInstance of renderComponent.meshInstances ?? []) {
      const sourceMaterial = meshInstance.material;
      const materialName = String(sourceMaterial?.name ?? "").toLowerCase();
      if (!materialName.includes("glass")) {
        continue;
      }
      const material = sourceMaterial?.clone ? sourceMaterial.clone() : sourceMaterial;
      if (!material) {
        continue;
      }
      material.cull = pc.CULLFACE_NONE;
      material.blendType = pc.BLEND_NORMAL;
      material.alphaTest = 0;
      if (typeof material.opacity === "number") {
        material.opacity = ENVIRONMENT_GLASS_OPACITY;
      }
      if ("depthWrite" in material) {
        material.depthWrite = false;
      }
      material.update?.();
      meshInstance.material = material;
    }
  }
}

function flattenEntityMaterials(pc: any, entity: any, usage: string): void {
  if (!APPLY_CLIENT_MATTE) {
    return;
  }

  if (usage === "body" && FORCE_BODY_VISIBLE_FALLBACK) {
    applyVisibleBodyFallback(pc, entity);
    return;
  }

  const profile = MATERIAL_PROFILE_BY_USAGE[usage as keyof typeof MATERIAL_PROFILE_BY_USAGE];
  if (!profile) {
    return;
  }

  for (const renderComponent of entity.findComponents?.("render") ?? []) {
    for (const meshInstance of renderComponent.meshInstances ?? []) {
      const sourceMaterial = meshInstance.material;
      if (!sourceMaterial?.clone) {
        continue;
      }

      const materialName = String(sourceMaterial.name ?? "");
      const blendType = typeof sourceMaterial.blendType === "number" ? sourceMaterial.blendType : undefined;
      if (SENSITIVE_FACE_MATERIAL_NAME_PATTERN.test(materialName)) {
        continue;
      }
      const isAlphaMaterial = typeof blendType === "number" && blendType !== pc.BLEND_NONE;

      const material = sourceMaterial.clone();
      if (typeof material.gloss === "number") {
        material.gloss = Math.min(material.gloss, profile.glossCap);
      }
      if (typeof material.shininess === "number") {
        material.shininess = Math.min(material.shininess, profile.shininessCap);
      }
      if (typeof material.metalness === "number") {
        material.metalness = 0;
      }
      if (typeof material.useMetalness === "boolean") {
        material.useMetalness = false;
      }
      if (typeof material.specularityFactor === "number") {
        material.specularityFactor = Math.min(material.specularityFactor, profile.specularityCap);
      }
      if (pc?.Color && "specular" in material) {
        material.specular = new pc.Color(profile.specularColor, profile.specularColor, profile.specularColor);
      }
      if (typeof material.reflectivity === "number") {
        material.reflectivity = 0;
      }
      if (typeof material.clearCoat === "number") {
        material.clearCoat = 0;
      }
      if (typeof material.clearCoatGloss === "number") {
        material.clearCoatGloss = 0;
      }
      if (typeof material.sheen === "number") {
        material.sheen = 0;
      }
      if (typeof material.sheenGloss === "number") {
        material.sheenGloss = 0;
      }
      if (!profile.allowNormalMap && "normalMap" in material) {
        material.normalMap = null;
      }
      if (usage === "hair") {
        // Alpha-cutout mode: eliminates Z-sorting artifacts and angle-dependent disappearing.
        // Hair strand textures carry per-pixel alpha — blendType=NONE + alphaTest lets the
        // texture mask control visibility without the depth-write and back-face issues of
        // alpha-blend mode.  Culling both sides ensures interior hair planes stay visible
        // from every camera angle.
        material.blendType = pc.BLEND_NONE;
        material.alphaTest = 0.08;
        material.opacity = 1.0;
        material.depthWrite = true;
        material.cull = pc.CULLFACE_BACK;
      } else if (isAlphaMaterial && typeof material.opacity === "number") {
        material.opacity = sourceMaterial.opacity;
      }
      if ("emissive" in material && pc?.Color) {
        material.emissive = new pc.Color(0, 0, 0);
      }
      material.update?.();
      meshInstance.material = material;
    }
  }
}

function applyVisibleBodyFallback(pc: any, entity: any): void {
  for (const renderComponent of entity.findComponents?.("render") ?? []) {
    for (const meshInstance of renderComponent.meshInstances ?? []) {
      const sourceMaterial = meshInstance.material;
      if (!sourceMaterial?.clone) {
        continue;
      }

      const materialName = String(sourceMaterial.name ?? "");
      if (SENSITIVE_FACE_MATERIAL_NAME_PATTERN.test(materialName)) {
        continue;
      }

      const material = sourceMaterial.clone();
      if ("diffuseMap" in material) {
        material.diffuseMap = null;
      }
      if ("opacityMap" in material) {
        material.opacityMap = null;
      }
      if ("emissiveMap" in material) {
        material.emissiveMap = null;
      }
      if ("metalnessMap" in material) {
        material.metalnessMap = null;
      }
      if ("glossMap" in material) {
        material.glossMap = null;
      }
      if ("specularMap" in material) {
        material.specularMap = null;
      }
      if (pc?.Color && "diffuse" in material) {
        material.diffuse = new pc.Color(BODY_VISIBLE_TINT.r, BODY_VISIBLE_TINT.g, BODY_VISIBLE_TINT.b);
      }
      if (pc?.Color && "emissive" in material) {
        material.emissive = new pc.Color(0, 0, 0);
      }
      if (typeof material.reflectivity === "number") {
        material.reflectivity = 0;
      }
      if (typeof material.specularityFactor === "number") {
        material.specularityFactor = Math.min(material.specularityFactor, 0.005);
      }
      if (typeof material.gloss === "number") {
        material.gloss = Math.min(material.gloss, 0.004);
      }
      if (typeof material.shininess === "number") {
        material.shininess = Math.min(material.shininess, 1);
      }
      if (typeof material.opacity === "number") {
        material.opacity = 1;
      }
      if (typeof material.blendType === "number") {
        material.blendType = pc.BLEND_NONE;
      }
      if (typeof material.useMetalness === "boolean") {
        material.useMetalness = false;
      }
      if (typeof material.metalness === "number") {
        material.metalness = 0;
      }
      material.update?.();
      meshInstance.material = material;
    }
  }
}

function measureSkeletonBounds(root: any): StageBounds | undefined {
  const nodeNames = [
    "head",
    "neckLower",
    "neckUpper",
    "hip",
    "pelvis",
    "lHand",
    "rHand",
    "lFoot",
    "rFoot",
    "lToe",
    "rToe",
  ];
  const points = nodeNames
    .map((name) => findEntityByName(root, name))
    .filter((node): node is any => Boolean(node?.getPosition))
    .map((node) => node.getPosition());

  if (points.length < 4) {
    return undefined;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    minZ = Math.min(minZ, point.z);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
    maxZ = Math.max(maxZ, point.z);
  }

  return createStageBounds({ minX, minY, minZ, maxX, maxY, maxZ });
}

function createStageBounds(bounds: {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}): StageBounds {
  return {
    ...bounds,
    width: Math.max(0.001, bounds.maxX - bounds.minX),
    height: Math.max(0.001, bounds.maxY - bounds.minY),
    depth: Math.max(0.001, bounds.maxZ - bounds.minZ),
  };
}

function getCenterFloorAlignment(bounds: StageBounds): { x: number; y: number; z: number } {
  return {
    x: -((bounds.minX + bounds.maxX) * 0.5),
    y: -bounds.minY,
    z: -((bounds.minZ + bounds.maxZ) * 0.5),
  };
}

function getClockLightingMode(now = new Date()): TimeOfDayLightingMode {
  const hour = now.getHours() + (now.getMinutes() / 60);
  return hour >= DAYLIGHT_START_HOUR && hour < NIGHTLIGHT_START_HOUR ? "day" : "night";
}

function syncExteriorFloodLights(runtime?: StageRuntime): void {
  const activeRuntime = runtime ?? stageRuntime;
  if (
    !activeRuntime?.environmentBounds
    || !activeRuntime.environmentEntity?.getLocalPosition
    || !activeRuntime.dayFloodLight
    || !activeRuntime.dayFillFloodLight
    || !activeRuntime.dayRoofFloodLight
  ) {
    return;
  }

  const roomPosition = activeRuntime.environmentEntity.getLocalPosition();
  const bounds = activeRuntime.environmentBounds;
  const roomWidth = Math.max(0.001, bounds.maxX - bounds.minX);
  const roomHeight = Math.max(0.001, bounds.maxY - bounds.minY);
  const roomDepth = Math.max(0.001, bounds.maxZ - bounds.minZ);
  const avatarPosition = activeRuntime.avatarRoot?.getLocalPosition?.() ?? {
    x: roomPosition.x,
    y: roomPosition.y + roomHeight * 0.5,
    z: roomPosition.z,
  };
  const centerX = roomPosition.x;
  const centerY = roomPosition.y + roomHeight * 0.48;
  const centerZ = roomPosition.z;
  const leftX = roomPosition.x - (roomWidth * 0.56) - 1.8;
  const rightX = Math.max(roomPosition.x + (roomWidth * 0.56) + 2.4, avatarPosition.x + 4.5);
  const primaryZ = avatarPosition.z + roomDepth * 0.14;
  const secondaryZ = roomPosition.z - roomDepth * 0.18;
  const sideY = roomPosition.y + Math.max(2.8, roomHeight * 0.68);
  const roofY = roomPosition.y + roomHeight + 1.9;
  const primaryRange = Math.max(18, Math.max(roomWidth, roomDepth) * 1.95);
  const secondaryRange = Math.max(16, Math.max(roomWidth, roomDepth) * 1.7);

  activeRuntime.dayFloodLight.setLocalPosition(rightX, sideY, primaryZ);
  activeRuntime.dayFloodLight.light.range = primaryRange;

  activeRuntime.dayFillFloodLight.setLocalPosition(leftX, sideY - 0.2, secondaryZ);
  activeRuntime.dayFillFloodLight.light.range = secondaryRange;

  activeRuntime.dayRoofFloodLight.setLocalPosition(centerX, roofY, centerZ + roomDepth * 0.18);
  activeRuntime.dayRoofFloodLight.light.range = Math.max(16, Math.max(roomWidth, roomDepth) * 1.55);

  if (activeRuntime.dayInteriorBounceLight) {
    activeRuntime.dayInteriorBounceLight.setLocalPosition(centerX, centerY + roomHeight * 0.08, centerZ + roomDepth * 0.08);
    activeRuntime.dayInteriorBounceLight.light.range = Math.max(14, Math.max(roomWidth, roomDepth) * 1.1);
  }

  if (activeRuntime.ceilingFloodLight) {
    activeRuntime.ceilingFloodLight.setLocalPosition(centerX, roomPosition.y + roomHeight * 0.87, centerZ + roomDepth * 0.06);
    activeRuntime.ceilingFloodLight.light.range = Math.max(22, Math.max(roomWidth, roomDepth) * 1.6);
  }

  if (Array.isArray(activeRuntime.roofDownFloodLights) && activeRuntime.roofDownFloodLights.length > 0) {
    const roofThickness = Math.max(0.16, Math.min(0.58, roomHeight * 0.07));
    const roofLightY = roomPosition.y + roomHeight - roofThickness - 0.06;
    const sideOffsetX = roomWidth * 0.24;
    const centerOffsetX = roomWidth * 0.075;
    const frontOffsetZ = roomDepth * 0.19;
    const backOffsetZ = roomDepth * 0.19;
    const slots = [
      { x: -sideOffsetX, z: frontOffsetZ },
      { x: centerOffsetX, z: frontOffsetZ },
      { x: sideOffsetX, z: frontOffsetZ },
      { x: 0, z: frontOffsetZ },
      { x: -sideOffsetX, z: -backOffsetZ },
      { x: -centerOffsetX, z: -backOffsetZ },
      { x: sideOffsetX, z: -backOffsetZ },
      { x: 0, z: -backOffsetZ },
      { x: -sideOffsetX, z: 0 },
      { x: 0, z: 0 },
      { x: sideOffsetX, z: 0 },
      { x: centerOffsetX, z: 0 },
    ];
    const roomSpan = Math.max(roomWidth, roomDepth);
    const roofLightRange = Math.max(18, roomSpan * 1.3);
    activeRuntime.roofDownFloodLights.forEach((roofLight, index) => {
      const slot = slots[index % slots.length];
      roofLight.setLocalPosition(centerX + slot.x, roofLightY, centerZ + slot.z);
      roofLight.light.range = roofLightRange;
    });
  }

  if (Array.isArray(activeRuntime.wallFillLights) && activeRuntime.wallFillLights.length === 4) {
    const wallY = roomPosition.y + roomHeight * 0.48;
    const wallRange = Math.max(22, Math.max(roomWidth, roomDepth) * 1.8);
    const insetX = roomWidth * 0.44;
    const insetZ = roomDepth * 0.44;
    // left, right, front, back
    activeRuntime.wallFillLights[0].setLocalPosition(centerX - insetX, wallY, centerZ);
    activeRuntime.wallFillLights[0].light.range = wallRange;
    activeRuntime.wallFillLights[1].setLocalPosition(centerX + insetX, wallY, centerZ);
    activeRuntime.wallFillLights[1].light.range = wallRange;
    activeRuntime.wallFillLights[2].setLocalPosition(centerX, wallY, centerZ + insetZ);
    activeRuntime.wallFillLights[2].light.range = wallRange;
    activeRuntime.wallFillLights[3].setLocalPosition(centerX, wallY, centerZ - insetZ);
    activeRuntime.wallFillLights[3].light.range = wallRange;
  }

  if (Array.isArray(activeRuntime.centerWashLights) && activeRuntime.centerWashLights.length === 2) {
    // Place both lights at mid-room height so they flood up AND down equally
    const washY = roomPosition.y + roomHeight * 0.5;
    const washOffsetZ = roomDepth * 0.35;
    const washRange = Math.max(50, Math.max(roomWidth, roomDepth) * 3.5);
    // Spread along Z to cover main room and the room behind
    activeRuntime.centerWashLights[0].setLocalPosition(centerX, washY, centerZ + washOffsetZ);
    activeRuntime.centerWashLights[0].light.range = washRange;
    activeRuntime.centerWashLights[1].setLocalPosition(centerX, washY, centerZ - washOffsetZ);
    activeRuntime.centerWashLights[1].light.range = washRange;
  }

  if (Array.isArray(activeRuntime.cornerFillLights) && activeRuntime.cornerFillLights.length === 10) {
    const cornerY = roomPosition.y + roomHeight * 0.5;
    const cornerRange = Math.max(38, Math.max(roomWidth, roomDepth) * 2.4);
    const cx = roomWidth * 0.42;
    const cz = roomDepth * 0.42;
    const mx = roomWidth * 0.22;
    const mz = roomDepth * 0.24;
    const sideX = roomWidth * 0.46;
    activeRuntime.cornerFillLights[0].setLocalPosition(centerX - cx, cornerY, centerZ + cz);
    activeRuntime.cornerFillLights[1].setLocalPosition(centerX + cx, cornerY, centerZ + cz);
    activeRuntime.cornerFillLights[2].setLocalPosition(centerX - cx, cornerY, centerZ - cz);
    activeRuntime.cornerFillLights[3].setLocalPosition(centerX + cx, cornerY, centerZ - cz);
    activeRuntime.cornerFillLights[4].setLocalPosition(centerX - sideX - roomWidth * 0.15, cornerY, centerZ + mz);
    activeRuntime.cornerFillLights[5].setLocalPosition(centerX + sideX + roomWidth * 0.15, cornerY, centerZ + mz);
    activeRuntime.cornerFillLights[6].setLocalPosition(centerX - sideX - roomWidth * 0.15, cornerY, centerZ - mz);
    activeRuntime.cornerFillLights[7].setLocalPosition(centerX + sideX + roomWidth * 0.15, cornerY, centerZ - mz);
    activeRuntime.cornerFillLights[8].setLocalPosition(centerX - mx, cornerY, centerZ);
    activeRuntime.cornerFillLights[9].setLocalPosition(centerX + mx, cornerY, centerZ);
    activeRuntime.cornerFillLights.forEach((cl) => { cl.light.range = cornerRange; });
  }

  if (activeRuntime.dayBackdropShell) {
    const shellDiameter = Math.max(roomWidth, roomDepth) * DAY_BACKDROP_SHELL_SCALE_MULTIPLIER;
    const shellHeight = Math.max(roomHeight * 2.45, shellDiameter * 0.42);
    activeRuntime.dayBackdropShell.setLocalPosition(centerX, roomPosition.y + roomHeight * 0.45, centerZ);
    activeRuntime.dayBackdropShell.setLocalEulerAngles(0, 135, 0);
    activeRuntime.dayBackdropShell.setLocalScale(shellDiameter, shellHeight, shellDiameter);
  }
}

function scaleRgbColor(color: readonly [number, number, number], factor: number): [number, number, number] {
  return [
    Math.min(1, color[0] * factor),
    Math.min(1, color[1] * factor),
    Math.min(1, color[2] * factor),
  ];
}

function syncTimeOfDayLighting(runtime?: StageRuntime): void {
  const activeRuntime = runtime ?? stageRuntime;
  if (
    !activeRuntime?.pc
    || !activeRuntime.app?.scene
    || !activeRuntime.camera?.camera
    || !activeRuntime.keyLight
    || !activeRuntime.fillLight
    || !activeRuntime.interiorLight
    || !activeRuntime.daySunLight
    || !activeRuntime.daySkyLight
    || !activeRuntime.dayFloodLight
    || !activeRuntime.dayFillFloodLight
    || !activeRuntime.dayRoofFloodLight
  ) {
    return;
  }

  const mode = getClockLightingMode();
  const hasEnvironment = Boolean(activeRuntime.environmentEntity);
  const sliderLightScale = Math.min(1.0, Math.max(0, (Number.isFinite(state.lightLevel) ? state.lightLevel : 100) / 100));
  // Night mode keeps a dark baseline but still responds across the full slider range.
  const nightFloor = NIGHT_MODE_LIGHT_LEVEL / 100;
  const lightScale = mode === "night"
    ? Math.min(1, nightFloor + ((1 - nightFloor) * sliderLightScale))
    : sliderLightScale;
  const avatarLightScale = lightScale * AVATAR_LIGHT_WASHOUT_GUARD;
  activeRuntime.lightingMode = mode;
  syncExteriorFloodLights(activeRuntime);

  if (mode === "day") {
    activeRuntime.app.scene.ambientLight = new activeRuntime.pc.Color(...scaleRgbColor(DAY_STAGE_AMBIENT_COLOR, lightScale));
    activeRuntime.camera.camera.clearColor = new activeRuntime.pc.Color(...DAY_STAGE_CLEAR_COLOR);
    activeRuntime.keyLight.enabled = true;
    activeRuntime.fillLight.enabled = true;
    activeRuntime.keyLight.light.color = new activeRuntime.pc.Color(...KEY_LIGHT_DAY_COLOR);
    activeRuntime.fillLight.light.color = new activeRuntime.pc.Color(...FILL_LIGHT_DAY_COLOR);
    activeRuntime.keyLight.light.intensity = (hasEnvironment ? ENV_KEY_LIGHT_DAY_INTENSITY : KEY_LIGHT_INTENSITY) * avatarLightScale;
    activeRuntime.fillLight.light.intensity = (hasEnvironment ? ENV_FILL_LIGHT_DAY_INTENSITY : FILL_LIGHT_INTENSITY) * avatarLightScale;
    activeRuntime.interiorLight.light.color = new activeRuntime.pc.Color(...DAY_INTERIOR_LIGHT_COLOR);
    activeRuntime.interiorLight.light.intensity = DAY_INTERIOR_LIGHT_INTENSITY * avatarLightScale;
    activeRuntime.interiorLight.enabled = Boolean(activeRuntime.environmentEntity);
    if (Array.isArray(activeRuntime.roomWashLights)) {
      activeRuntime.roomWashLights.forEach((roomWashLight) => {
        roomWashLight.enabled = false;
      });
    }
    if (Array.isArray(activeRuntime.centerWashLights)) {
      activeRuntime.centerWashLights.forEach((centerWashLight) => {
        centerWashLight.light.color = new activeRuntime.pc.Color(...CENTER_WASH_LIGHT_DAY_COLOR);
        centerWashLight.light.intensity = CENTER_WASH_LIGHT_DAY_INTENSITY * lightScale;
        centerWashLight.enabled = Boolean(activeRuntime.environmentEntity);
      });
    }
    if (Array.isArray(activeRuntime.cornerFillLights)) {
      activeRuntime.cornerFillLights.forEach((cl) => {
        cl.light.color = new activeRuntime.pc.Color(...CENTER_WASH_LIGHT_DAY_COLOR);
        cl.light.intensity = CENTER_WASH_LIGHT_DAY_INTENSITY * 0.9 * lightScale;
        cl.enabled = Boolean(activeRuntime.environmentEntity);
      });
    }
    if (activeRuntime.ceilingFloodLight) {
      activeRuntime.ceilingFloodLight.enabled = false;
    }
    if (Array.isArray(activeRuntime.roofDownFloodLights)) {
      activeRuntime.roofDownFloodLights.forEach((roofLight) => {
        roofLight.enabled = false;
      });
    }
    if (activeRuntime.dayInteriorBounceLight) {
      activeRuntime.dayInteriorBounceLight.enabled = false;
    }
    if (Array.isArray(activeRuntime.wallFillLights)) {
      activeRuntime.wallFillLights.forEach((wfl) => {
        wfl.enabled = false;
      });
    }
    activeRuntime.daySunLight.light.intensity = DAY_SUN_LIGHT_INTENSITY * avatarLightScale;
    activeRuntime.daySkyLight.light.intensity = DAY_SKY_LIGHT_INTENSITY * avatarLightScale;
    activeRuntime.dayFloodLight.light.intensity = DAY_FLOOD_LIGHT_INTENSITY * lightScale;
    activeRuntime.dayFillFloodLight.light.intensity = DAY_FILL_FLOOD_LIGHT_INTENSITY * lightScale;
    activeRuntime.dayRoofFloodLight.light.intensity = DAY_ROOF_FLOOD_LIGHT_INTENSITY * lightScale;
    activeRuntime.daySunLight.enabled = true;
    activeRuntime.daySkyLight.enabled = true;
    activeRuntime.dayFloodLight.enabled = Boolean(activeRuntime.environmentEntity);
    activeRuntime.dayFillFloodLight.enabled = Boolean(activeRuntime.environmentEntity);
    activeRuntime.dayRoofFloodLight.enabled = Boolean(activeRuntime.environmentEntity);
    if (activeRuntime.dayBackdropShell) {
      const backdropMaterial = activeRuntime.dayBackdropShell.render?.material;
      if (backdropMaterial) {
        backdropMaterial.emissive = new activeRuntime.pc.Color(...DAY_BACKDROP_EMISSIVE_COLOR);
        backdropMaterial.emissiveIntensity = DAY_BACKDROP_EMISSIVE_INTENSITY * lightScale;
        backdropMaterial.update();
      }
      activeRuntime.dayBackdropShell.enabled = Boolean(activeRuntime.environmentEntity);
    }
    return;
  }

  activeRuntime.app.scene.ambientLight = new activeRuntime.pc.Color(...scaleRgbColor(STAGE_AMBIENT_COLOR, lightScale));
  activeRuntime.camera.camera.clearColor = new activeRuntime.pc.Color(...STAGE_CLEAR_COLOR);
  activeRuntime.keyLight.enabled = true;
  activeRuntime.fillLight.enabled = true;
  activeRuntime.keyLight.light.color = new activeRuntime.pc.Color(...KEY_LIGHT_NIGHT_COLOR);
  activeRuntime.fillLight.light.color = new activeRuntime.pc.Color(...FILL_LIGHT_NIGHT_COLOR);
  activeRuntime.keyLight.light.intensity = (hasEnvironment ? ENV_KEY_LIGHT_NIGHT_INTENSITY : KEY_LIGHT_INTENSITY) * avatarLightScale;
  activeRuntime.fillLight.light.intensity = (hasEnvironment ? ENV_FILL_LIGHT_NIGHT_INTENSITY : FILL_LIGHT_INTENSITY) * avatarLightScale;
  activeRuntime.interiorLight.light.color = new activeRuntime.pc.Color(...INTERIOR_LIGHT_COLOR);
  activeRuntime.interiorLight.light.intensity = INTERIOR_LIGHT_INTENSITY * avatarLightScale;
  activeRuntime.interiorLight.enabled = Boolean(activeRuntime.environmentEntity);
  if (Array.isArray(activeRuntime.roomWashLights)) {
    activeRuntime.roomWashLights.forEach((roomWashLight) => {
      roomWashLight.enabled = false;
    });
  }
  if (Array.isArray(activeRuntime.centerWashLights)) {
    activeRuntime.centerWashLights.forEach((centerWashLight) => {
      centerWashLight.light.color = new activeRuntime.pc.Color(...CENTER_WASH_LIGHT_NIGHT_COLOR);
      centerWashLight.light.intensity = CENTER_WASH_LIGHT_NIGHT_INTENSITY * lightScale;
      centerWashLight.enabled = Boolean(activeRuntime.environmentEntity);
    });
  }
  if (Array.isArray(activeRuntime.cornerFillLights)) {
    activeRuntime.cornerFillLights.forEach((cl) => {
      cl.light.color = new activeRuntime.pc.Color(...CENTER_WASH_LIGHT_NIGHT_COLOR);
      cl.light.intensity = CENTER_WASH_LIGHT_NIGHT_INTENSITY * 0.9 * lightScale;
      cl.enabled = Boolean(activeRuntime.environmentEntity);
    });
  }
  if (activeRuntime.ceilingFloodLight) {
    activeRuntime.ceilingFloodLight.enabled = false;
  }
  if (Array.isArray(activeRuntime.roofDownFloodLights)) {
    activeRuntime.roofDownFloodLights.forEach((roofLight) => {
      roofLight.enabled = false;
    });
  }
  if (activeRuntime.dayInteriorBounceLight) {
    activeRuntime.dayInteriorBounceLight.enabled = false;
  }
  if (Array.isArray(activeRuntime.wallFillLights)) {
    activeRuntime.wallFillLights.forEach((wfl) => {
      wfl.enabled = false;
    });
  }
  activeRuntime.daySunLight.enabled = false;
  activeRuntime.daySkyLight.enabled = false;
  activeRuntime.dayFloodLight.enabled = false;
  activeRuntime.dayFillFloodLight.enabled = false;
  activeRuntime.dayRoofFloodLight.enabled = false;
  if (activeRuntime.dayBackdropShell) {
    const backdropMaterial = activeRuntime.dayBackdropShell.render?.material;
    if (backdropMaterial) {
      backdropMaterial.emissive = new activeRuntime.pc.Color(...NIGHT_BACKDROP_EMISSIVE_COLOR);
      backdropMaterial.emissiveIntensity = NIGHT_BACKDROP_EMISSIVE_INTENSITY * lightScale;
      backdropMaterial.update();
    }
    activeRuntime.dayBackdropShell.enabled = Boolean(activeRuntime.environmentEntity);
  }
}

function normalizeVector3(values: unknown, fallback: readonly [number, number, number]): Vector3Tuple {
  if (!Array.isArray(values)) {
    return [fallback[0], fallback[1], fallback[2]];
  }
  return [
    typeof values[0] === "number" && Number.isFinite(values[0]) ? values[0] : fallback[0],
    typeof values[1] === "number" && Number.isFinite(values[1]) ? values[1] : fallback[1],
    typeof values[2] === "number" && Number.isFinite(values[2]) ? values[2] : fallback[2],
  ];
}

function applyDeviceDisplayProfileState(deviceProfiles: DeviceDisplayProfilesResponse | undefined): DeviceDisplayProfile | undefined {
  const profiles = Array.isArray(deviceProfiles?.profiles) ? deviceProfiles?.profiles : [];
  const selectedId = deviceProfiles?.selectedDeviceId?.trim() || state.selectedDeviceId || "unknown";
  const selectedDevice = profiles.find((profile) => profile.id === selectedId);
  state.selectedDeviceId = selectedId;
  state.selectedDeviceLabel = selectedDevice?.label?.trim() || state.selectedDeviceId || "unknown";
  state.selectedSceneId = selectedDevice?.staging?.sceneId?.trim() || "none";
  state.selectedDeviceAspectRatio = selectedDevice?.display?.aspectRatio?.trim() || "unknown";
  state.selectedDeviceMeshSummary = selectedDevice?.mesh
    ? `body ${selectedDevice.mesh.bodyQuality || "?"} | clothes ${selectedDevice.mesh.clothingQuality || "?"} | hair ${selectedDevice.mesh.hairQuality || "?"} | anim ${selectedDevice.mesh.animationLod || "?"}`
    : "unknown";
  state.selectedAvatarPosition = normalizeVector3(selectedDevice?.staging?.avatarTransform?.position, STAGE_AVATAR_POSITION);
  state.selectedAvatarRotation = normalizeVector3(selectedDevice?.staging?.avatarTransform?.rotation, STAGE_AVATAR_ROTATION);
  state.selectedAvatarScale = normalizeVector3(selectedDevice?.staging?.avatarTransform?.scale, STAGE_AVATAR_SCALE);
  state.selectedCameraPosition = normalizeVector3(selectedDevice?.staging?.cameraTransform?.position, STAGE_CAMERA_POSITION);
  state.selectedCameraTarget = normalizeVector3(selectedDevice?.staging?.cameraTransform?.target, STAGE_CAMERA_TARGET);
  return selectedDevice;
}

function resolveEnvironmentProfile(
  response: EnvironmentProfilesResponse | undefined,
  sceneId: string | undefined,
): EnvironmentProfile | undefined {
  const targetSceneId = sceneId?.trim();
  if (!targetSceneId) {
    return undefined;
  }
  const profiles = Array.isArray(response?.profiles) ? response.profiles : [];
  return profiles.find((profile) => profile.id === targetSceneId);
}

function measureFilteredRenderBounds(
  target: any,
  options: {
    ignoreEntityNames?: Set<string>;
    ignoreParentNames?: Set<string>;
  } = {},
): StageBounds | undefined {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  let countedMeshInstances = 0;

  const shouldIgnoreEntity = (entity: any): boolean => {
    if (!entity) {
      return false;
    }
    if (options.ignoreEntityNames?.has(entity.name)) {
      return true;
    }
    let cursor = entity.parent;
    while (cursor) {
      if (options.ignoreParentNames?.has(cursor.name)) {
        return true;
      }
      cursor = cursor.parent;
    }
    return false;
  };

  const walk = (entity: any): void => {
    if (!entity || shouldIgnoreEntity(entity)) {
      return;
    }
    for (const meshInstance of entity.render?.meshInstances ?? []) {
      const { center, halfExtents } = meshInstance.aabb;
      minX = Math.min(minX, center.x - halfExtents.x);
      minY = Math.min(minY, center.y - halfExtents.y);
      minZ = Math.min(minZ, center.z - halfExtents.z);
      maxX = Math.max(maxX, center.x + halfExtents.x);
      maxY = Math.max(maxY, center.y + halfExtents.y);
      maxZ = Math.max(maxZ, center.z + halfExtents.z);
      countedMeshInstances += 1;
    }
    for (const child of entity.children ?? []) {
      walk(child);
    }
  };

  walk(target);
  if (countedMeshInstances === 0) {
    return undefined;
  }
  return createStageBounds({ minX, minY, minZ, maxX, maxY, maxZ });
}

function measureNamedRenderBounds(root: any, names: Set<string>): StageBounds | undefined {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  let countedMeshInstances = 0;

  const walk = (entity: any): void => {
    if (!entity) {
      return;
    }
    if (names.has(entity.name)) {
      for (const meshInstance of entity.render?.meshInstances ?? []) {
        const { center, halfExtents } = meshInstance.aabb;
        minX = Math.min(minX, center.x - halfExtents.x);
        minY = Math.min(minY, center.y - halfExtents.y);
        minZ = Math.min(minZ, center.z - halfExtents.z);
        maxX = Math.max(maxX, center.x + halfExtents.x);
        maxY = Math.max(maxY, center.y + halfExtents.y);
        maxZ = Math.max(maxZ, center.z + halfExtents.z);
        countedMeshInstances += 1;
      }
    }
    for (const child of entity.children ?? []) {
      walk(child);
    }
  };

  walk(root);
  if (countedMeshInstances === 0) {
    return undefined;
  }
  return createStageBounds({ minX, minY, minZ, maxX, maxY, maxZ });
}

function findEntityByName(root: any, name: string): any | undefined {
  if (!root) {
    return undefined;
  }
  if (root.name === name) {
    return root;
  }
  for (const child of root.children ?? []) {
    const match = findEntityByName(child, name);
    if (match) {
      return match;
    }
  }
  return undefined;
}

function resolveSkeletonRoot(bodyRoot: any): any {
  const bones: any[] = [];
  for (const renderComponent of bodyRoot?.findComponents?.("render") ?? []) {
    for (const meshInstance of renderComponent.meshInstances ?? []) {
      const skinBones = meshInstance?.skinInstance?.bones;
      if (Array.isArray(skinBones)) {
        for (const bone of skinBones) {
          if (bone) bones.push(bone);
        }
      }
    }
  }

  if (bones.length === 0) {
    return findEntityByName(bodyRoot, "hip") ?? bodyRoot;
  }

  const uniqueBones = Array.from(new Set(bones));
  const isAncestorOf = (ancestor: any, node: any) => {
    let cursor = node;
    while (cursor) {
      if (cursor === ancestor) return true;
      cursor = cursor.parent;
    }
    return false;
  };

  let candidate = uniqueBones[0];
  // Stop climbing when we reach bodyRoot — do NOT go above the loaded body entity.
  // Without this cap the loop climbs all the way to app.root, which breaks PlayCanvas's
  // anim-bone path matching (it can no longer find "Victoria 8" / "hip" at the right depth).
  while (
    candidate?.parent &&
    candidate.parent !== bodyRoot &&
    uniqueBones.every((bone) => isAncestorOf(candidate.parent, bone))
  ) {
    candidate = candidate.parent;
  }

  const resolved = candidate ?? findEntityByName(bodyRoot, "hip") ?? bodyRoot;
  console.info(`[resolveSkeletonRoot] resolved root bone: "${resolved?.name ?? "unknown"}" (bodyRoot="${bodyRoot?.name ?? "unknown"}")`);
  return resolved;
}

function rebindEntityRenderRootBone(entity: any, rootBone: any): void {
  if (!entity || !rootBone) {
    return;
  }

  for (const renderComponent of entity.findComponents?.("render") ?? []) {
    renderComponent.rootBone = rootBone;
  }
}

function toCanonicalBoneName(name: string): string {
  let canonical = name;
  while (/\.\d{3}$/.test(canonical)) {
    canonical = canonical.replace(/\.\d{3}$/, "");
  }
  return canonical;
}

function buildSkeletonBoneLookup(root: any): {
  exact: Map<string, any>;
  canonical: Map<string, any>;
} {
  const exact = new Map<string, any>();
  const canonical = new Map<string, any>();
  const walk = (entity: any): void => {
    const name: string | undefined = entity?.name;
    if (name) {
      exact.set(name, entity);
      const canonicalName = toCanonicalBoneName(name);
      if (!canonical.has(canonicalName)) {
        canonical.set(canonicalName, entity);
      }
    }
    for (const child of entity?.children ?? []) {
      walk(child);
    }
  };
  walk(root);
  return { exact, canonical };
}

/**
 * Re-resolve all skinned mesh instances in a garment/hair entity tree
 * so their bones point to the body's animated skeleton instead of
 * the garment's own (static) skeleton copy.
 */
function bindGarmentToSkeleton(garmentRoot: any, bodyRoot: any, skeletonRoot?: any): void {
  const targetRoot = skeletonRoot ?? bodyRoot;
  const skeletonLookup = buildSkeletonBoneLookup(targetRoot);
  rebindEntityRenderRootBone(garmentRoot, targetRoot);
  function walk(entity: any): void {
    if (entity.render?.meshInstances) {
      for (const mi of entity.render.meshInstances) {
        if (mi.skinInstance?.skin?.boneNames) {
          mi.skinInstance.resolve(targetRoot, entity);
          const boneNames = mi.skinInstance.skin.boneNames as string[];
          const resolvedBones = mi.skinInstance.bones as Array<any | undefined>;
          let fallbackBound = 0;
          const unresolved: string[] = [];
          for (let i = 0; i < boneNames.length; i += 1) {
            if (resolvedBones[i]) {
              continue;
            }
            const requested = boneNames[i];
            const exact = skeletonLookup.exact.get(requested);
            const canonical = skeletonLookup.canonical.get(toCanonicalBoneName(requested));
            const replacement = exact ?? canonical;
            if (replacement) {
              resolvedBones[i] = replacement;
              fallbackBound += 1;
            } else {
              unresolved.push(requested);
            }
          }
          if (unresolved.length > 0) {
            console.warn(`[anim] Unresolved garment joints on "${entity.name}": ${unresolved.slice(0, 8).join(", ")}${unresolved.length > 8 ? " ..." : ""} (total ${unresolved.length})`);
          }
          console.info(`Bound skin on "${entity.name}" â†’ body skeleton "${targetRoot?.name ?? "unknown"}" (${resolvedBones.length} bones, fallback=${fallbackBound}, unresolved=${unresolved.length})`);
        }
      }
    }
    for (const child of entity.children ?? []) {
      walk(child);
    }
  }
  walk(garmentRoot);
}

function collectSpeechMorphTargets(entity: any): SpeechMorphTarget[] {
  const targets: SpeechMorphTarget[] = [];
  for (const renderComponent of entity.findComponents?.("render") ?? []) {
    for (const meshInstance of renderComponent.meshInstances ?? []) {
      const morphInstance = meshInstance.morphInstance;
      const keys = Array.from(morphInstance?._weightMap?.keys?.() ?? []) as string[];
      if (!morphInstance || keys.length === 0) {
        continue;
      }
      const pickAny = (...needles: string[]): string | undefined => keys.find((key) => {
        const normalized = key.toLowerCase();
        return needles.some((needle) => normalized.includes(needle.toLowerCase()));
      });
      targets.push({
        instance: morphInstance,
        mouthOpen: pickAny("ectrlmouthopen", "facs_rosamaria8_1_cbs_jawopen", "facs_rosamaria8_1_cbs_mouthfunnel"),
        aa: pickAny("ectrlvaa", "facs_ctrl_vaa"),
        ow: pickAny("ectrlvow", "facs_ctrl_vow", "facs_rosamaria8_1_cbs_mouthpucker"),
        ee: pickAny("ectrlvee", "facs_ctrl_vee", "facs_ctrl_viy"),
        ih: pickAny("ectrlvih", "facs_ctrl_vih", "facs_ctrl_veh"),
        fv: pickAny("ectrlvfv", "ectrlvf", "facs_ctrl_vf"),
        l: pickAny("ectrlvl", "facs_ctrl_vl"),
        th: pickAny("ectrlvth", "facs_ctrl_vth"),
        m: pickAny("ectrlvm", "facs_ctrl_vm", "facs_rosamaria8_1_cbs_mouthclose"),
        lowerLip: keys.filter((key) => {
          const normalized = key.toLowerCase();
          return normalized.includes("lowerlip")
            || normalized.includes("mouthlowerdown")
            || normalized.includes("lowerlipdepress")
            || normalized.includes("lipdown");
        }),
        chin: keys.filter((key) => {
          const normalized = key.toLowerCase();
          return normalized.includes("chinraise")
            || normalized.includes("chinraiser")
            || normalized.includes("mentalis");
        }),
        smileLeft: keys.filter((key) => {
          const normalized = key.toLowerCase();
          return normalized.includes("smilel")
            || normalized.includes("mouthsmile_l")
            || normalized.includes("mouthsmileleft")
            || normalized.includes("lipcornerpullerl")
            || normalized.includes("grinl");
        }),
        smileRight: keys.filter((key) => {
          const normalized = key.toLowerCase();
          return normalized.includes("smiler")
            || normalized.includes("mouthsmile_r")
            || normalized.includes("mouthsmileright")
            || normalized.includes("lipcornerpullerr")
            || normalized.includes("grinr");
        }),
      });
    }
  }
  return targets;
}

function clampMorphWeight(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function normalizeBodyMorphOverrides(overrides: unknown): Record<string, number> {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(overrides as Record<string, unknown>)
      .filter(([key]) => key.trim().length > 0)
      .map(([key, value]) => [key, clampMorphWeight(value)]),
  );
}

function applyBodyMorphControlSettings(settings: RuntimeSettingsResponse): void {
  state.bodyMorphsEnabledDuringMotion = settings.bodyMorphControls?.enabledDuringMotion
    ?? state.bodyMorphsEnabledDuringMotion
    ?? true;
  state.bodyMorphOverrides = normalizeBodyMorphOverrides(settings.bodyMorphControls?.overrides);
}

function collectFaceMorphKeys(
  speechMorphTargets: SpeechMorphTarget[],
  eyeMorphTargets: EyeMorphTarget[],
): Set<string> {
  const excluded = new Set<string>();
  for (const target of speechMorphTargets) {
    const singleKeys = [target.mouthOpen, target.aa, target.ow, target.ee, target.ih, target.fv, target.l, target.th, target.m];
    for (const key of singleKeys) {
      if (key) {
        excluded.add(key);
      }
    }
    for (const key of target.lowerLip ?? []) excluded.add(key);
    for (const key of target.chin ?? []) excluded.add(key);
    for (const key of target.smileLeft ?? []) excluded.add(key);
    for (const key of target.smileRight ?? []) excluded.add(key);
  }
  for (const target of eyeMorphTargets) {
    for (const key of target.blinkLeft ?? []) excluded.add(key);
    for (const key of target.blinkRight ?? []) excluded.add(key);
    for (const key of target.squintLeft ?? []) excluded.add(key);
    for (const key of target.squintRight ?? []) excluded.add(key);
  }
  return excluded;
}

function collectBodyMorphTargets(entity: any, excludedKeys: Set<string>): BodyMorphTarget[] {
  const targets: BodyMorphTarget[] = [];
  for (const renderComponent of entity.findComponents?.("render") ?? []) {
    for (const meshInstance of renderComponent.meshInstances ?? []) {
      const morphInstance = meshInstance.morphInstance;
      const keys = Array.from(morphInstance?._weightMap?.keys?.() ?? []) as string[];
      if (!morphInstance || keys.length === 0) {
        continue;
      }
      const bodyKeys = keys.filter((key) => !excludedKeys.has(key));
      if (bodyKeys.length === 0) {
        continue;
      }
      targets.push({
        instance: morphInstance,
        keys: bodyKeys,
      });
    }
  }
  return targets;
}

function applyBodyMorphOverrides(
  targets: BodyMorphTarget[],
  overrides: Record<string, number>,
  blend: number,
): void {
  const scaledBlend = Math.max(0, Math.min(1, blend));
  for (const target of targets) {
    for (const key of target.keys) {
      const baseValue = overrides[key] ?? 0;
      target.instance.setWeight(key, clampMorphWeight(baseValue) * scaledBlend);
    }
  }
}

function createFacialMicroMotionState(): FacialMicroMotionState {
  return {
    retargetIn: 0.25 + Math.random() * 0.8,
    mouthOpenCurrent: 0,
    mouthOpenTarget: 0,
    lowerLipCurrent: 0,
    lowerLipTarget: 0,
    chinCurrent: 0,
    chinTarget: 0,
    smileBaseCurrent: 0,
    smileBaseTarget: 0,
    smileAsymCurrent: 0,
    smileAsymTarget: 0,
    squintBaseCurrent: 0,
    squintBaseTarget: 0,
    squintAsymCurrent: 0,
    squintAsymTarget: 0,
    jawOpenCurrent: 0,
    jawOpenTarget: 0,
    jawSwayCurrent: 0,
    jawSwayTarget: 0,
  };
}

function updateFacialMicroMotion(
  micro: FacialMicroMotionState,
  dt: number,
  context: {
    enabled: boolean;
    idleBlend: number;
    speaking: boolean;
    listening: boolean;
    dancing: boolean;
    talkAmount: number;
  },
): void {
  const { enabled, idleBlend, speaking, listening, dancing, talkAmount } = context;
  const activeBlend = enabled ? Math.max(0, Math.min(1, idleBlend)) : 0;
  const speechDamping = speaking ? Math.max(0.22, 0.62 - talkAmount * 0.28) : 1;
  const danceDamping = dancing ? 0.45 : 1;
  const listeningLift = listening && !speaking ? 1.18 : 1;
  const intensity = activeBlend * speechDamping * danceDamping * listeningLift;

  micro.retargetIn -= dt;
  if (micro.retargetIn <= 0) {
    micro.retargetIn = randomRange(0.7, 2.7);

    const expressionRoll = Math.random();
    const smileMood = expressionRoll < 0.16
      ? randomRange(0.055, 0.105)
      : expressionRoll < 0.68
        ? randomRange(0.018, 0.065)
        : randomRange(0.0, 0.032);
    const mouthRoll = Math.random();
    const mouthBase = mouthRoll < 0.22
      ? randomRange(0.0, 0.006)
      : mouthRoll < 0.82
        ? randomRange(0.006, 0.024)
        : randomRange(0.024, 0.043);
    const side = Math.random() < 0.5 ? -1 : 1;

    micro.mouthOpenTarget = mouthBase * intensity;
    micro.lowerLipTarget = randomRange(0.004, 0.028) * intensity;
    micro.chinTarget = randomRange(0.003, 0.02) * intensity;
    micro.smileBaseTarget = smileMood * intensity;
    micro.smileAsymTarget = side * randomRange(0.002, 0.018) * intensity;
    micro.squintBaseTarget = randomRange(0.012, 0.046) * intensity;
    micro.squintAsymTarget = -side * randomRange(0.0, 0.014) * intensity;
    micro.jawOpenTarget = randomRange(0.05, 0.46) * intensity;
    micro.jawSwayTarget = side * randomRange(0.015, 0.16) * intensity;
  }

  const slowBlend = Math.min(1, dt * 1.55);
  const lipBlend = Math.min(1, dt * 2.15);
  micro.mouthOpenCurrent += (micro.mouthOpenTarget - micro.mouthOpenCurrent) * lipBlend;
  micro.lowerLipCurrent += (micro.lowerLipTarget - micro.lowerLipCurrent) * lipBlend;
  micro.chinCurrent += (micro.chinTarget - micro.chinCurrent) * lipBlend;
  micro.smileBaseCurrent += (micro.smileBaseTarget - micro.smileBaseCurrent) * slowBlend;
  micro.smileAsymCurrent += (micro.smileAsymTarget - micro.smileAsymCurrent) * slowBlend;
  micro.squintBaseCurrent += (micro.squintBaseTarget - micro.squintBaseCurrent) * slowBlend;
  micro.squintAsymCurrent += (micro.squintAsymTarget - micro.squintAsymCurrent) * slowBlend;
  micro.jawOpenCurrent += (micro.jawOpenTarget - micro.jawOpenCurrent) * lipBlend;
  micro.jawSwayCurrent += (micro.jawSwayTarget - micro.jawSwayCurrent) * slowBlend;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function scheduleSpeechBreathPause(
  text: string,
  speechState: WorkLiteSpeechState,
  options?: { pauseQueuedBrowserSpeech?: boolean },
): number {
  const trimmed = text.trim();
  const now = performance.now();
  if (trimmed.length < 92 || now - speechState.lastBreathPauseAt < 3800) {
    return 0;
  }

  const sentenceCount = Math.max(1, (trimmed.match(/[.!?]/g) ?? []).length);
  const pauseMs = Math.min(760, 190 + Math.min(trimmed.length, 220) * 1.6 + sentenceCount * 55);
  speechState.lastBreathPauseAt = now;
  speechState.breathPauseUntil = Math.max(speechState.breathPauseUntil, now + pauseMs);

  if (options?.pauseQueuedBrowserSpeech && "speechSynthesis" in window && window.speechSynthesis.pending) {
    try {
      window.speechSynthesis.pause();
      window.setTimeout(() => {
        try {
          window.speechSynthesis.resume();
        } catch {
          // Browser speech pause/resume is best-effort across engines.
        }
      }, pauseMs);
    } catch {
      // Some browsers ignore pause/resume around queued utterances.
    }
  }

  return pauseMs;
}

function createBodyAliveMotionState(): BodyAliveMotionState {
  return {
    breathPhase: Math.random() * Math.PI * 2,
    breathRateCurrent: randomRange(0.24, 0.34),
    breathRateTarget: randomRange(0.24, 0.34),
    breathDepthCurrent: randomRange(0.75, 1.05),
    breathDepthTarget: randomRange(0.75, 1.05),
    breathRetargetIn: randomRange(3.5, 7.5),
    inhaleHold: 0,
    weightRetargetIn: randomRange(2.8, 6.5),
    weightShiftCurrent: 0,
    weightShiftTarget: 0,
    hipSwayCurrent: 0,
    hipSwayTarget: 0,
    shoulderEaseCurrent: 0,
    shoulderEaseTarget: 0,
    settleCurrent: 0,
    settleTarget: 0,
  };
}

function updateBodyAliveMotion(
  body: BodyAliveMotionState,
  dt: number,
  context: {
    enabled: boolean;
    idleBlend: number;
    speaking: boolean;
    listening: boolean;
    dancing: boolean;
    talkAmount: number;
    breathPauseActive: boolean;
  },
): { breath: number; chestLift: number; shoulderLift: number; weightShift: number; hipSway: number; settle: number } {
  const { enabled, idleBlend, speaking, listening, dancing, talkAmount, breathPauseActive } = context;
  const activeBlend = enabled ? Math.max(0, Math.min(1, idleBlend)) : 0;
  const danceDamping = dancing ? 0.35 : 1;
  const speechLift = speaking ? 0.18 + talkAmount * 0.14 : 0;
  const listeningLift = listening && !speaking ? 0.08 : 0;
  const pauseLift = breathPauseActive ? 0.36 : 0;

  body.breathRetargetIn -= dt;
  if (body.breathRetargetIn <= 0) {
    body.breathRetargetIn = randomRange(3.8, 8.4);
    body.breathRateTarget = randomRange(0.21, 0.36);
    body.breathDepthTarget = randomRange(0.62, 1.18);
    body.shoulderEaseTarget = randomRange(0.82, 1.16);
    if (Math.random() < 0.22 || breathPauseActive) {
      body.inhaleHold = randomRange(0.16, 0.42);
    }
  }

  body.weightRetargetIn -= dt;
  if (body.weightRetargetIn <= 0) {
    body.weightRetargetIn = randomRange(3.2, 8.5);
    const side = Math.random() < 0.5 ? -1 : 1;
    body.weightShiftTarget = side * randomRange(0.18, 0.85) * activeBlend * danceDamping;
    body.hipSwayTarget = -side * randomRange(0.08, 0.42) * activeBlend * danceDamping;
    body.settleTarget = side * randomRange(0.02, 0.32) * activeBlend * danceDamping;
  }

  const breathTuningBlend = Math.min(1, dt * 0.55);
  body.breathRateCurrent += (body.breathRateTarget - body.breathRateCurrent) * breathTuningBlend;
  body.breathDepthCurrent += (body.breathDepthTarget - body.breathDepthCurrent) * breathTuningBlend;
  body.shoulderEaseCurrent += (body.shoulderEaseTarget - body.shoulderEaseCurrent) * Math.min(1, dt * 0.75);

  if (body.inhaleHold > 0 || breathPauseActive) {
    body.inhaleHold = Math.max(0, body.inhaleHold - dt);
    body.breathPhase += dt * body.breathRateCurrent * Math.PI * 0.34;
  } else {
    body.breathPhase += dt * body.breathRateCurrent * Math.PI * 2;
  }

  const cycle = (Math.sin(body.breathPhase - Math.PI * 0.36) + 1) * 0.5;
  const inhale = Math.pow(cycle, 0.64);
  const exhaleEase = Math.pow(1 - cycle, 1.45) * 0.18;
  const breath = (inhale - exhaleEase) * body.breathDepthCurrent * activeBlend * danceDamping;
  const chestLift = (breath * 1.05) + speechLift + listeningLift + pauseLift;
  const shoulderLift = ((breath * 0.72) + pauseLift * 0.58) * body.shoulderEaseCurrent;

  const weightBlend = Math.min(1, dt * 0.8);
  body.weightShiftCurrent += (body.weightShiftTarget - body.weightShiftCurrent) * weightBlend;
  body.hipSwayCurrent += (body.hipSwayTarget - body.hipSwayCurrent) * weightBlend;
  body.settleCurrent += (body.settleTarget - body.settleCurrent) * Math.min(1, dt * 1.15);

  return {
    breath,
    chestLift,
    shoulderLift,
    weightShift: body.weightShiftCurrent,
    hipSway: body.hipSwayCurrent,
    settle: body.settleCurrent,
  };
}

function collectEyeMorphTargets(entity: any): EyeMorphTarget[] {
  const targets: EyeMorphTarget[] = [];
  for (const renderComponent of entity.findComponents?.("render") ?? []) {
    for (const meshInstance of renderComponent.meshInstances ?? []) {
      const morphInstance = meshInstance.morphInstance;
      const keys = Array.from(morphInstance?._weightMap?.keys?.() ?? []) as string[];
      if (!morphInstance || keys.length === 0) {
        continue;
      }
      const pickAll = (...patterns: string[]) => keys.filter((key) => {
        const normalized = key.toLowerCase();
        return patterns.some((pattern) => normalized.includes(pattern));
      });
      const blinkLeft = pickAll("eyeblinkl", "eyesclosedl", "eyelidclose_l", "blink_l");
      const blinkRight = pickAll("eyeblinkr", "eyesclosedr", "eyelidclose_r", "blink_r");
      const squintLeft = pickAll("eyesquintl", "cheeksquintl");
      const squintRight = pickAll("eyesquintr", "cheeksquintr");
      if (blinkLeft.length === 0 && blinkRight.length === 0 && squintLeft.length === 0 && squintRight.length === 0) {
        continue;
      }
      targets.push({
        instance: morphInstance,
        blinkLeft: blinkLeft.length > 0 ? blinkLeft : blinkRight,
        blinkRight: blinkRight.length > 0 ? blinkRight : blinkLeft,
        squintLeft: squintLeft.length > 0 ? squintLeft : undefined,
        squintRight: squintRight.length > 0 ? squintRight : undefined,
      });
    }
  }
  return targets;
}

function collectEyelidRigNodes(entity: any): EyelidRigNode[] {
  const nodeNames: Array<{ name: string; direction: "upper" | "lower" }> = [
    { name: "lEyelidInner", direction: "upper" },
    { name: "lEyelidUpperInner", direction: "upper" },
    { name: "lEyelidUpper", direction: "upper" },
    { name: "lEyelidUpperOuter", direction: "upper" },
    { name: "lEyelidOuter", direction: "upper" },
    { name: "rEyelidUpperInner", direction: "upper" },
    { name: "rEyelidUpper", direction: "upper" },
    { name: "rEyelidUpperOuter", direction: "upper" },
    { name: "rEyelidInner", direction: "upper" },
    { name: "rEyelidOuter", direction: "upper" },
    { name: "lEyelidLowerInner", direction: "lower" },
    { name: "lEyelidLower", direction: "lower" },
    { name: "lEyelidLowerOuter", direction: "lower" },
    { name: "rEyelidLowerInner", direction: "lower" },
    { name: "rEyelidLower", direction: "lower" },
    { name: "rEyelidLowerOuter", direction: "lower" },
  ];
  const targets: EyelidRigNode[] = [];
  for (const nodeName of nodeNames) {
    const eyelid = findEntityByName(entity, nodeName.name);
    if (!eyelid?.getLocalPosition) {
      continue;
    }
    const position = eyelid.getLocalPosition();
    targets.push({
      entity: eyelid,
      direction: nodeName.direction,
      basePosition: { x: position.x, y: position.y, z: position.z },
    });
  }
  return targets;
}

function setMorphWeightIfPresent(morphInstance: any, key: string | undefined, value: number): void {
  if (!morphInstance || !key) {
    return;
  }
  morphInstance.setWeight(key, Math.max(0, Math.min(1, value)));
}

function setMorphWeights(morphInstance: any, keys: string[] | undefined, value: number): void {
  if (!morphInstance || !keys || keys.length === 0) {
    return;
  }
  const clamped = Math.max(0, Math.min(1, value));
  for (const key of keys) {
    morphInstance.setWeight(key, clamped);
  }
}

function createZeroViseme(): VisemeWeights {
  return {
    mouthOpen: 0,
    aa: 0,
    ow: 0,
    ee: 0,
    ih: 0,
    fv: 0,
    l: 0,
    th: 0,
    m: 0,
    lowerLip: 0,
    chin: 0,
    smileLeft: 0,
    smileRight: 0,
  };
}

async function speakWorkLiteText(text: string, speechState: WorkLiteSpeechState): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  stopWorkLiteSpeech(speechState);
  const settings = getCurrentVoiceSettings();
  if (settings.preferredTtsEngine === "browser-speech-synthesis" || shouldPreferConfiguredBrowserVoice(settings)) {
    speechState.engineLabel = settings.preferredTtsEngine === "browser-speech-synthesis"
      ? "browser speech"
      : "browser voice override";
    enqueueBrowserVoiceText(trimmed, settings, speechState);
    return;
  }
  try {
    const payload = await requestSpeechAudio(trimmed);
    if (payload.audioBase64 && payload.mimeType) {
      speechState.engineLabel = settings.preferredTtsEngine ?? "openai-gpt-4o-mini-tts";
      queueAudioSpeechChunk(payload.audioBase64, payload.mimeType, trimmed, speechState);
      return;
    }
  } catch (error) {
    console.warn("Work-lite TTS failed, falling back to browser voice.", error);
  }
  speechState.engineLabel = "browser fallback";
  enqueueBrowserVoiceText(trimmed, settings, speechState);
}

function getCurrentVoiceSettings(): VoiceSettingsResponse {
  return {
    mode: state.voiceMode,
    silenceTimeoutMs: state.silenceTimeoutMs,
    wakeWord: state.wakeWord,
    autoResumeAfterResponse: state.autoResumeAfterResponse,
    preferredTtsEngine: state.preferredTtsEngine,
    fallbackTtsEngine: state.fallbackTtsEngine,
    openAiVoice: state.openAiVoice,
    openAiInstructions: state.openAiInstructions,
    preferLocalBrowserVoice: state.preferLocalVoice,
    browserVoiceName: state.browserVoiceName,
    avatarVoiceProfiles: state.avatarVoiceProfiles,
  };
}

async function requestSpeechAudio(text: string): Promise<{ mimeType?: string; audioBase64?: string }> {
  const settings = getCurrentVoiceSettings();
  const response = await fetch("/voice/speak", {
    method: "POST",
    headers: buildGailHeaders(true),
    body: JSON.stringify({
      text,
      voiceOverride: settings.openAiVoice,
      instructionsOverride: settings.openAiInstructions,
    }),
  });
  if (!response.ok) {
    throw new Error(`Voice speak request failed with ${response.status}`);
  }
  return await response.json() as { mimeType?: string; audioBase64?: string };
}

function queueAudioSpeechChunk(audioBase64: string, mimeType: string, sourceText: string, speechState: WorkLiteSpeechState): void {
  speechState.audioQueue.push({ audioBase64, mimeType, sourceText });
  if (!speechState.processingAudioQueue) {
    void processQueuedAudioSpeech(speechState);
  }
}

async function processQueuedAudioSpeech(speechState: WorkLiteSpeechState): Promise<void> {
  if (speechState.processingAudioQueue) {
    return;
  }
  speechState.processingAudioQueue = true;
  const generation = speechState.playbackGeneration;
  try {
    while (speechState.audioQueue.length > 0 && generation === speechState.playbackGeneration) {
      const next = speechState.audioQueue.shift();
      if (!next) {
        continue;
      }
      await playAudioBase64(next.audioBase64, next.mimeType, next.sourceText, generation, speechState);
    }
  } finally {
    if (generation === speechState.playbackGeneration) {
      speechState.processingAudioQueue = false;
      if (speechState.audioQueue.length === 0 && !speechState.utterance) {
        speechState.speaking = false;
        speechState.talkLevel = 0;
        speechState.engineLabel = "idle";
        markGailOutputEndedIfIdle(speechState);
      }
    }
  }
}

function playAudioBase64(
  audioBase64: string,
  mimeType: string,
  sourceText: string,
  generation: number,
  speechState: WorkLiteSpeechState,
): Promise<void> {
  clearCurrentAudioPlayback(speechState);
  const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  const sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);
  speechState.audio = audio;
  speechState.audioContext = audioContext;
  speechState.analyser = analyser;
  speechState.sourceNode = sourceNode;
  speechState.speaking = true;
  markGailOutputStarted();
  const data = new Uint8Array(analyser.frequencyBinCount);
  return new Promise<void>((resolve) => {
    const finish = () => {
      if (speechState.playbackGeneration === generation) {
        clearCurrentAudioPlayback(speechState);
        if (!speechState.utterance && speechState.audioQueue.length === 0 && speechState.browserQueue.length === 0) {
          speechState.speaking = false;
          speechState.talkLevel = 0;
          speechState.engineLabel = "idle";
        }
        markGailOutputEndedIfIdle(speechState);
      }
      resolve();
    };
    const tick = () => {
      if (!speechState.speaking || !speechState.analyser || speechState.playbackGeneration !== generation) {
        return;
      }
      speechState.analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        sum += Math.abs(data[i] - 128);
      }
      speechState.talkLevel = Math.min(1, (sum / data.length) / 18);
      speechState.raf = window.requestAnimationFrame(tick);
    };
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    void audioContext.resume().catch(() => undefined);
    void audio.play().catch(() => {
      clearCurrentAudioPlayback(speechState);
      speechState.engineLabel = "browser fallback";
      enqueueBrowserVoiceText(sourceText, getCurrentVoiceSettings(), speechState);
      finish();
    });
    tick();
  });
}

function shouldPreferConfiguredBrowserVoice(settings: VoiceSettingsResponse): boolean {
  return settings.preferLocalBrowserVoice === true
    && settings.preferredTtsEngine !== "browser-speech-synthesis"
    && Boolean(findConfiguredBrowserVoice(settings.browserVoiceName));
}

function enqueueBrowserVoiceText(text: string, settings: VoiceSettingsResponse, speechState: WorkLiteSpeechState): void {
  if (!("speechSynthesis" in window)) {
    return;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  speechState.browserQueue.push(trimmed);
  if (speechState.utterance) {
    return;
  }
  playNextBrowserVoice(settings, speechState);
}

function playNextBrowserVoice(settings: VoiceSettingsResponse, speechState: WorkLiteSpeechState): void {
  if (!("speechSynthesis" in window)) {
    return;
  }
  const next = speechState.browserQueue.shift();
  if (!next) {
    if (speechState.audioQueue.length === 0) {
      speechState.speaking = false;
      speechState.talkLevel = 0;
      speechState.engineLabel = "idle";
      markGailOutputEndedIfIdle(speechState);
    }
    speechState.utterance = undefined;
    return;
  }
  const utterance = new SpeechSynthesisUtterance(next);
  utterance.rate = state.speechRate;
  utterance.pitch = state.speechPitch;
  const selectedVoice = getSelectedBrowserVoice(settings.browserVoiceName);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  utterance.onstart = () => {
    markGailOutputStarted();
    speechState.speaking = true;
    speechState.talkLevel = 0.45;
  };
  utterance.onboundary = () => {
    speechState.talkLevel = 0.9;
  };
  utterance.onend = () => {
    speechState.utterance = undefined;
    speechState.talkLevel = 0;
    const breathPauseMs = scheduleSpeechBreathPause(next, speechState);
    if (breathPauseMs > 0 && speechState.browserQueue.length > 0) {
      window.setTimeout(() => playNextBrowserVoice(settings, speechState), breathPauseMs);
    } else {
      playNextBrowserVoice(settings, speechState);
    }
  };
  utterance.onerror = () => {
    speechState.utterance = undefined;
    speechState.talkLevel = 0;
    markGailOutputEndedIfIdle(speechState);
    playNextBrowserVoice(settings, speechState);
  };
  speechState.utterance = utterance;
  speechState.speaking = true;
  markGailOutputStarted();
  window.speechSynthesis.speak(utterance);
}

function populateVoiceSelect(select: HTMLSelectElement | null): void {
  if (!select || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;

  const current = state.browserVoiceName || "";
  select.innerHTML = "";

  // English voices first, then the rest
  const english = voices.filter((v) => /^en[-_]/i.test(v.lang));
  const other = voices.filter((v) => !/^en[-_]/i.test(v.lang));
  const sorted = [...english, ...other];

  for (const voice of sorted) {
    const opt = document.createElement("option");
    opt.value = voice.name;
    opt.textContent = `${voice.name} (${voice.lang})`;
    if (voice.name === current) opt.selected = true;
    select.appendChild(opt);
  }

  // If no exact match found, try normalized match
  if (!select.value || select.value !== current) {
    const normalizedTarget = normalizeVoiceName(current);
    for (let i = 0; i < sorted.length; i++) {
      if (normalizeVoiceName(sorted[i].name) === normalizedTarget) {
        select.selectedIndex = i;
        break;
      }
    }
  }

  console.info(`[voice-select] ${voices.length} voices available. Selected: ${select.value}`);
}

function getSelectedBrowserVoice(voiceName?: string): SpeechSynthesisVoice | undefined {
  if (!("speechSynthesis" in window)) {
    return undefined;
  }
  const voices = window.speechSynthesis.getVoices();
  const configuredVoice = findConfiguredBrowserVoice(voiceName, voices);
  if (configuredVoice) {
    return configuredVoice;
  }
  return voices.find((voice) => /^en-(IE|GB)/i.test(voice.lang))
    ?? voices.find((voice) => /^en-/i.test(voice.lang))
    ?? voices[0];
}

function findConfiguredBrowserVoice(
  voiceName?: string,
  availableVoices?: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  if (!voiceName || !("speechSynthesis" in window)) {
    return undefined;
  }
  const voices = availableVoices ?? window.speechSynthesis.getVoices();
  const exactMatch = voices.find((voice) => voice.name === voiceName);
  if (exactMatch) {
    return exactMatch;
  }
  const normalizedTarget = normalizeVoiceName(voiceName);
  if (!normalizedTarget) {
    return undefined;
  }
  return voices.find((voice) => normalizeVoiceName(voice.name) === normalizedTarget)
    ?? voices.find((voice) => normalizedTarget.split(" ").filter((token) => token.length >= 3).every((token) => normalizeVoiceName(voice.name).includes(token)));
}

function normalizeVoiceName(value: string): string {
  return value
    .toLowerCase()
    .replace(/desktop/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clearCurrentAudioPlayback(speechState: WorkLiteSpeechState): void {
  if (speechState.raf) {
    window.cancelAnimationFrame(speechState.raf);
    speechState.raf = undefined;
  }
  speechState.audio?.pause();
  speechState.audio = undefined;
  speechState.sourceNode?.disconnect?.();
  speechState.sourceNode = undefined;
  speechState.analyser?.disconnect?.();
  speechState.analyser = undefined;
  if (speechState.audioContext) {
    void speechState.audioContext.close().catch(() => undefined);
    speechState.audioContext = undefined;
  }
}

function stopWorkLiteSpeech(speechState: WorkLiteSpeechState): void {
  speechState.playbackGeneration += 1;
  clearCurrentAudioPlayback(speechState);
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  speechState.utterance = undefined;
  speechState.browserQueue = [];
  speechState.audioQueue = [];
  speechState.processingAudioQueue = false;
  speechState.speaking = false;
  speechState.talkLevel = 0;
  speechState.breathPauseUntil = 0;
  speechState.engineLabel = "idle";
  gailSpeechActive = false;
  speechEndedAt = performance.now();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: buildGailHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${url} (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

/** Standard headers for all Gail API calls. Includes persona when active. */
function buildGailHeaders(includeContentType = false): Record<string, string> {
  const headers: Record<string, string> = {
    "x-gail-device-id": "work-lite-rebuild",
    "x-gail-device-type": "kiosk",
    "x-gail-mode": "private",
  };
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  if (state.activePrivatePersona) {
    headers["x-gail-private-persona"] = state.activePrivatePersona;
  }
  return headers;
}

function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const scopedWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };
  return scopedWindow.SpeechRecognition ?? scopedWindow.webkitSpeechRecognition;
}

function syncStatus(text: string): void {
  state.status = text;
  const pill = document.querySelector<HTMLElement>(".status-pill");
  const status = document.querySelector<HTMLElement>("#stage-status");
  const loading = document.querySelector<HTMLElement>("#stage-loading");
  const loadingLabel = document.querySelector<HTMLElement>(".stage-loading-label");
  if (pill) {
    pill.textContent = text;
  }
  if (status) {
    status.textContent = text;
  }
  if (loadingLabel) {
    loadingLabel.textContent = text;
  }
  if (loading) {
    loading.classList.toggle("hidden", state.sceneReady);
  }
  syncFullscreenStatus();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getAssetUsage(asset: ManifestAsset): keyof typeof MATERIAL_PROFILE_BY_USAGE {
  if (asset.kind === "hair") {
    return "hair";
  }
  if (asset.kind === "accessory") {
    return "accessory";
  }
  if (asset.kind === "clothing") {
    return "clothing";
  }
  return "body";
}

function shouldUseReferenceAlignment(asset: ManifestAsset): boolean {
  return false;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getAssetLoadTimeoutMs(asset: ManifestAsset | undefined, fallbackMs: number): number {
  const fileSizeBytes = asset?.fileSizeBytes ?? 0;
  if (fileSizeBytes <= 0) {
    return fallbackMs;
  }
  const sizeInMb = fileSizeBytes / (1024 * 1024);
  const scaledTimeoutMs = 120000 + Math.round(sizeInMb * 1500);
  if (fileSizeBytes < LARGE_ASSET_BYTES) {
    return Math.min(fallbackMs, Math.max(45000, 30000 + Math.round(sizeInMb * 900)));
  }
  if (fileSizeBytes >= OVERSIZED_ASSET_BYTES) {
    return Math.max(fallbackMs, Math.min(900000, scaledTimeoutMs));
  }
  if (fileSizeBytes >= LARGE_ASSET_BYTES) {
    return Math.max(fallbackMs, Math.min(600000, scaledTimeoutMs));
  }
  return fallbackMs;
}

function shouldSkipStageDisplayAsset(asset: ManifestAsset): boolean {
  if (!asset.kind || !OVERSIZED_STAGE_MODULE_KINDS.has(asset.kind)) {
    return false;
  }
  return (asset.fileSizeBytes ?? 0) >= OVERSIZED_ASSET_BYTES;
}

function formatAssetSizeMb(fileSizeBytes: number | undefined): string {
  if (!fileSizeBytes || fileSizeBytes <= 0) {
    return "unknown size";
  }
  return `${Math.round(fileSizeBytes / (1024 * 1024))} MB`;
}

