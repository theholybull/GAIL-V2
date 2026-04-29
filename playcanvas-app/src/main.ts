import type { ClientRuntimeSettings, Mode, QualityTier, VoiceSettings } from "../../shared/contracts/index";
import {
  workLiteAssetManifest,
  type WorkLiteAssetManifest,
  type WorkLiteAssetStatus,
} from "./config/asset-manifest.js";
import { AvatarManager, ModeManager, SceneManager } from "./managers/index.js";
import { appState, persistClientPreferences } from "./state/app-state.js";

const modeManager = new ModeManager(appState.mode);
const sceneManager = new SceneManager(appState.sceneRole, appState.qualityTier);
const avatarManager = new AvatarManager();
let runtimeManifest: WorkLiteAssetManifest = workLiteAssetManifest;
let clientRuntimeSettings: ClientRuntimeSettings | undefined;
let avatarViewport: { destroy: () => void; updateFromState: () => void } | undefined;
let renderStatusText = "Renderer idle";
type ConversationInputRoute = "conversation" | "workflow_control";
type ControlInputSource = "typed" | "voice";
type ControlIntentResponse = {
  action: "command" | "workflow";
  status: "accepted" | "planned" | "failed";
  summary: string;
  command?: {
    key: string;
    action: string;
    description: string;
    brokerStatus: string;
    success: boolean;
  };
  workflow?: {
    id: string;
    title: string;
    status: string;
    plannedStepCount: number;
    firstStepId?: string;
    firstStepTitle?: string;
    reviewRequired: boolean;
  };
};

const SHELL_PAGE_BY_COMMAND_ACTION: Record<string, string> = {
  open_tasks: "organizer-control",
  open_build_control_tower: "build-control-tower",
  show_build_approval_queue: "build-control-tower",
  run_build_script: "build-control-tower",
  show_build_results: "build-control-tower",
  capture_build_screenshot: "build-control-tower",
  analyze_build_screenshot: "build-control-tower",
  request_build_changes: "build-control-tower",
  approve_build_step: "build-control-tower",
  show_pending_changes: "change-governance",
  show_last_approved_change: "change-governance",
  explain_change_reason: "change-governance",
  approve_change: "change-governance",
  reject_change: "change-governance",
  rollback_last_approved: "change-governance",
  show_change_history: "change-governance",
  report_bug: "report-bugs",
  add_feature_request: "feature-inbox",
  help: "workflow-studio",
};
type BrowserSpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string };
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
  onresult: ((event: BrowserSpeechRecognitionEventLike) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognitionInstance;
type SpeechVisemeWeights = {
  mouthOpen: number;
  aa: number;
  ow: number;
  ee: number;
  ih: number;
  fv: number;
  l: number;
  th: number;
  m: number;
};
type SpeechVisemeFrame = {
  timeMs: number;
  weights: SpeechVisemeWeights;
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
};
type EyeMorphTarget = {
  instance: any;
  blinkLeft: string[];
  blinkRight: string[];
  squintLeft?: string[];
  squintRight?: string[];
};
type EyelidRigNode = {
  entity: any;
  basePosition: { x: number; y: number; z: number };
  direction: "upper" | "lower";
};
type AvatarRuntimeProfile = {
  key: "legacy_fallback" | "handoff_20260330" | "gail_primary";
  orientationAngles: readonly [number, number, number];
  skeletonRootHints: string[];
};
type TextureUsageKind = "body" | "hair" | "clothing" | "accessories";
const DEFAULT_RUNTIME_SETTINGS: ClientRuntimeSettings = {
  activeAvatarSystem: "handoff_20260330",
  activeAssetRoot: "handoffs/playcanvas_handoff_20260330",
  displayInputMode: "wake_word",
  availableAvatarSystems: [
    {
      key: "handoff_20260330",
      label: "New Handoff Bundle",
      assetRoot: "handoffs/playcanvas_handoff_20260330",
      description: "Modular body, hair, clothing, accessories, and starter clips.",
    },
  ],
};
const speechRuntime: {
  settings?: VoiceSettings;
  speaking: boolean;
  listening: boolean;
  talkLevel: number;
  speechText: string;
  audio?: HTMLAudioElement;
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
  sourceNode?: MediaElementAudioSourceNode;
  raf?: number;
  utterance?: SpeechSynthesisUtterance;
  browserQueue: string[];
  audioQueue: Array<{ audioBase64: string; mimeType: string; sourceText: string }>;
  processingAudioQueue: boolean;
  playbackGeneration: number;
  engineLabel: string;
  streamedSpokenText: string;
  visemeTarget: SpeechVisemeWeights;
  visemeCurrent: SpeechVisemeWeights;
  visemePlan: SpeechVisemeFrame[];
  visemePlanStartedAt: number;
  visemePlanElapsedMs: number;
} = {
  settings: undefined,
  speaking: false,
  listening: false,
  talkLevel: 0,
  speechText: "Hey Gail, this is a work-lite speech test.",
  browserQueue: [],
  audioQueue: [],
  processingAudioQueue: false,
  playbackGeneration: 0,
  engineLabel: "idle",
  streamedSpokenText: "",
  visemeTarget: createZeroViseme(),
  visemeCurrent: createZeroViseme(),
  visemePlan: [],
  visemePlanStartedAt: 0,
  visemePlanElapsedMs: 0,
};

const cameraRuntime: {
  stream?: MediaStream;
  active: boolean;
  status: string;
} = {
  stream: undefined,
  active: false,
  status: "Camera idle",
};

const conversationRuntime: {
  sessionId?: string;
  input: string;
  inputRoute: ConversationInputRoute;
  messages: Array<{ role: string; content: string }>;
  recentSessions: Array<{ id: string; title?: string; updatedAt?: string; messageCount: number }>;
  pending: boolean;
  status: string;
  activeRequestId: number;
  streamController?: AbortController;
  pendingAck: boolean;
} = {
  sessionId: undefined,
  input: "Help me test the work-lite client and tell me what you can see from this setup.",
  inputRoute: loadConversationRoutePreference(),
  messages: [],
  recentSessions: [],
  pending: false,
  status: "No session yet.",
  activeRequestId: 0,
  streamController: undefined,
  pendingAck: false,
};

const voiceControlRuntime: {
  recognition?: BrowserSpeechRecognitionInstance;
  active: boolean;
  supported: boolean;
  lastTranscript: string;
} = {
  recognition: undefined,
  active: false,
  supported: Boolean(getSpeechRecognitionConstructor()),
  lastTranscript: "",
};

const displayModeRuntime = {
  active: false,
  previewWidth: 1072,
  previewHeight: 472,
  sidebarPanel: loadSidebarPanelPreference(),
  quickMenuOpen: false,
};

type SidebarPanelKey = "status" | "framing" | "tuning" | "speech" | "assets";

function loadSidebarPanelPreference(): SidebarPanelKey {
  return "framing";
}

function persistSidebarPanelPreference(value: SidebarPanelKey): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem("gail.work-lite.sidebar-panel", value);
  } catch {
  }
}

function loadConversationRoutePreference(): ConversationInputRoute {
  if (typeof window === "undefined") {
    return "conversation";
  }
  try {
    const stored = window.localStorage.getItem("gail.work-lite.conversation-route");
    if (stored === "conversation" || stored === "workflow_control") {
      return stored;
    }
  } catch {
  }
  return "conversation";
}

function persistConversationRoutePreference(value: ConversationInputRoute): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem("gail.work-lite.conversation-route", value);
  } catch {
  }
}

const mechanicsRuntime = {
  assetRoot: "default catalog",
  moduleSummary: "modules pending",
  actionMapSummary: "actions pending",
  activeAction: "idle",
};

function isGailCatalogBaseActive(): boolean {
  const baseAvatar = runtimeManifest.assets?.find((asset) => asset.id === "base_avatar");
  const resolvedPath = (baseAvatar?.resolvedPath ?? "").replaceAll("\\", "/").toLowerCase();
  return resolvedPath.includes("/gail/avatar/base_face/gail_base_avatar.glb");
}

function getAvatarRuntimeProfile(): AvatarRuntimeProfile {
  const selectedSystem = clientRuntimeSettings?.activeAvatarSystem;
  if (selectedSystem === "handoff_20260330" || runtimeManifest.selectedBundleName === "playcanvas_handoff_20260330") {
    const handoffOrientation = runtimeManifest.runtimeProfile?.orientationAngles ?? [0, 0, 0];
    return {
      key: "handoff_20260330",
      orientationAngles: handoffOrientation,
      skeletonRootHints: runtimeManifest.runtimeProfile?.skeletonRootHints ?? ["Victoria 8", "Genesis 8 Female", "hip"],
    };
  }
  if (runtimeManifest.runtimeProfile?.orientationAngles) {
    return {
      key: "handoff_20260330",
      orientationAngles: runtimeManifest.runtimeProfile.orientationAngles,
      skeletonRootHints: runtimeManifest.runtimeProfile.skeletonRootHints ?? ["hip"],
    };
  }
  if (selectedSystem === "gail_primary" || isGailCatalogBaseActive()) {
    return {
      key: "gail_primary",
      orientationAngles: [90, 0, 0],
      skeletonRootHints: ["Victoria 8", "Genesis 8 Female", "hip"],
    };
  }
  return {
    key: "gail_primary",
    orientationAngles: [90, 0, 0],
    skeletonRootHints: ["Victoria 8", "Genesis8Female", "hip"],
  };
}

function getBaseViewportDefaults() {
  return {
    // Exact values from avatar_stage PlayCanvas scene: Camera + Render entities.
    modelX: 0,
    modelY: -0.01323,
    modelZ: 0,
    modelYaw: 0,
    modelPitch: -0.02198,
    modelRoll: 0,
    modelScaleMultiplier: 1,
    cameraX: 0,
    cameraY: 1.2,
    cameraZ: 3,
    targetX: 0,
    targetY: 0.9902,
    targetZ: 0,
  };
}

void bootWorkLiteClient().catch((error) => {
  reportClientBootError(error);
});

export function bootPlayCanvasApp(): string {
  return `PlayCanvas work-lite client booted for ${sceneManager.getSceneSummary()}`;
}

async function bootWorkLiteClient(): Promise<void> {
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) {
    throw new Error("Missing #app root.");
  }

  clientRuntimeSettings = await loadClientRuntimeSettings();
  runtimeManifest = await loadManifest(getEffectiveAssetRoot());
  try {
    await loadVoiceSettings();
  } catch {
    // Keep client booting even if voice settings are temporarily unavailable.
  }
  if (runtimeManifest.avatarReady) {
    avatarManager.markReady();
    appState.avatarState = "ready";
  }
  appState.status = "ready";
  root.innerHTML = render();
  wireEvents(root);
  attachCameraPreview(root);
  await restoreConversationState(root);
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && displayModeRuntime.active) {
      displayModeRuntime.active = false;
      syncDisplayModeUi(root);
    }
    syncDisplayModeUi(root);
    window.requestAnimationFrame(() => avatarViewport?.updateFromState());
    window.setTimeout(() => avatarViewport?.updateFromState(), 60);
  });
  window.addEventListener("resize", () => {
    syncDisplayModeUi(root);
  });
  await ensureVoiceStartupReady();
  await mountAvatarViewport(root);
}

function reportClientBootError(error: unknown): void {
  console.error("Work-lite client boot failed", error);
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) {
    return;
  }
  const message = error instanceof Error
    ? `${error.message}\n\n${error.stack ?? ""}`
    : String(error);
  root.innerHTML = `
    <div style="padding:24px;color:#f7f2ea;font-family:'Trebuchet MS','Segoe UI',sans-serif;">
      <h1 style="margin:0 0 12px;">Client Boot Error</h1>
      <pre style="white-space:pre-wrap;word-break:break-word;background:rgba(0,0,0,0.35);padding:16px;border-radius:16px;">${message
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")}</pre>
    </div>
  `;
}

function render(): string {
  const themeClass = modeManager.getThemeClass();
  const assetStatuses = runtimeManifest.assets ?? [];
  const requiredAssets = assetStatuses.filter((item) => item.required !== false);
  const presentRequiredCount = requiredAssets.filter((item) => item.present).length;
  return `
    <div class="client-shell rebuilt-layout staging-layout${displayModeRuntime.active ? " display-mode" : ""}">
      <main class="client-main">
        <section class="client-hero">
          ${renderBackground(themeClass)}
          <div class="staging-shell">
            <header class="staging-header glass">
              <div class="staging-header-copy">
                <div class="eyebrow">Gail</div>
                <h1 class="client-title">Work-Lite Staging Surface</h1>
                <p class="muted client-summary">Calibrate the avatar once, compare device-facing surfaces, and keep setup tools visible without losing the live stage.</p>
                <div class="staging-header-surface">
                  ${renderSurfaceDeck()}
                </div>
              </div>
              <div class="staging-command-bar">
                <div class="status-pill"><span class="status-dot"></span>${escapeHtml(appState.status)}</div>
                <label class="toolbar-control">
                  <span>Mode</span>
                  <select id="client-mode">
                    ${renderOption("work", appState.mode)}
                    ${renderOption("home_shop", appState.mode)}
                    ${renderOption("private", appState.mode)}
                    ${renderOption("lightweight", appState.mode)}
                    ${renderOption("focus", appState.mode)}
                  </select>
                </label>
                <label class="toolbar-control">
                  <span>Environment</span>
                  <select id="client-environment-quality">
                    ${renderOption("low", appState.qualityTier)}
                    ${renderOption("medium", appState.qualityTier)}
                    ${renderOption("high", appState.qualityTier)}
                  </select>
                </label>
                <label class="toolbar-control">
                  <span>Apply</span>
                  <select id="apply-mode">
                    ${renderOption("live", appState.autoApplyAdjustments ? "live" : "manual")}
                    ${renderOption("manual", appState.autoApplyAdjustments ? "live" : "manual")}
                  </select>
                </label>
                <button id="toggle-fullscreen" type="button" class="button-secondary toolbar-mode-button">${displayModeRuntime.active ? "Exit Display Mode" : "Display Mode"}</button>
                <button id="toggle-runtime-menu" type="button" class="button-secondary toolbar-mode-button">Runtime Menu</button>
                ${renderRuntimeQuickMenu()}
              </div>
            </header>
            <section class="staging-grid">
              <section class="staging-stage-column">
                <section class="hero-panel glass staging-stage-card">
                  <div class="panel-toolbar hero-toolbar">
                    <div class="hero-heading">
                      <div class="eyebrow">Avatar Stage</div>
                      <h2>${avatarManager.getState() === "ready" ? "Ready" : "Placeholder"}</h2>
                    </div>
                  </div>
                  <div class="avatar-stage">
                    ${renderAvatarStage()}
                  </div>
                </section>
              </section>
              <aside class="staging-calibration">
                <details class="glass staging-calibration-card staging-snapshot-card">
                  <summary class="staging-summary">
                    <span class="eyebrow">Runtime Snapshot</span>
                    <strong>Stage Snapshot</strong>
                  </summary>
                  <div class="staging-summary-body">
                    ${renderStageSnapshot(presentRequiredCount, requiredAssets.length)}
                  </div>
                </details>
                <details class="glass staging-calibration-card staging-debug-card">
                  <summary class="staging-summary">
                    <span class="eyebrow">Avatar Debug</span>
                    <strong>Render Diagnostics</strong>
                  </summary>
                  <div class="staging-summary-body">
                    ${renderAvatarDebugPanel()}
                  </div>
                </details>
                <section class="staging-control-stack">
                  <div class="staging-conversation">
                    ${renderConversationPanel()}
                  </div>
                  <div class="staging-camera">
                    ${renderCameraPanel()}
                  </div>
                </section>
              </aside>
            </section>
          </div>
        </section>
      </main>
    </div>
  `;
}

function renderBackground(themeClass: string): string {
  return `<div class="client-background ${themeClass}"></div>`;
}

function renderRuntimeQuickMenu(): string {
  if (!displayModeRuntime.quickMenuOpen) {
    return "";
  }
  const selectedMode = clientRuntimeSettings?.displayInputMode ?? "wake_word";
  return `
    <div class="runtime-quick-menu glass">
      <label class="toolbar-control">
        <span>Input Mode</span>
        <select id="runtime-input-mode">
          ${renderOption("wake_word", selectedMode)}
          ${renderOption("always_listening", selectedMode)}
          ${renderOption("typed", selectedMode)}
        </select>
      </label>
      <div class="runtime-quick-actions">
        <button id="runtime-exit-fullscreen" type="button" class="button-secondary">Exit Fullscreen</button>
        <button id="runtime-close-program" type="button" class="button-secondary">Close Program</button>
        <button id="runtime-add-feature" type="button" class="button-secondary">Add Feature Request</button>
        <button id="runtime-report-bug" type="button" class="button-secondary">Report Bug</button>
        <button id="runtime-help" type="button" class="button-secondary">Help</button>
      </div>
    </div>
  `;
}

function renderAvatarDescription(): string {
  if (avatarManager.getState() === "ready") {
    const coreAssets = getAssets().filter((asset) => asset.present && asset.kind !== "background");
    return `Detected ${coreAssets.length}/${coreAssets.length} core work-lite assets. Renderable modules now come from the backend asset catalog.`;
  }


  return "Mode background, quality tier, and avatar state are live. The client will immediately start using dropped background files and will switch the avatar slot to detected asset metadata as soon as the base model is present.";
}

function renderSurfaceDeck(): string {
  const surfaces = [
    {
      title: "Work Client",
      href: "/client/work-lite/",
      description: "Primary calibration surface for avatar staging, speech, framing, and device setup.",
      badge: "active",
    },
    {
      title: "Operator Panel",
      href: "/panel/",
      description: "Project imports, runtime switches, and stack-level controls for the live system.",
      badge: "ops",
    },
    {
      title: "Animation Viewer",
      href: "/client/anim-test/",
      description: "Review animation batches before they are promoted into the runtime action map.",
      badge: "review",
    },
    {
      title: "Animation Workbench",
      href: "/panel/animation-workbench.html",
      description: "Preview avatar + clothing + hair in Three.js and build Blender compose sequences.",
      badge: "tools",
    },
  ];
  return `
    <details class="glass surface-deck-dropdown">
      <summary class="staging-summary">
        <span class="eyebrow">Surface Deck</span>
        <strong>Device Views</strong>
      </summary>
      <div class="staging-summary-body surface-deck-list">
        ${surfaces.map((surface) => `
          <article class="surface-card">
            <div class="surface-card-head">
              <div>
                <strong>${escapeHtml(surface.title)}</strong>
                <p>${escapeHtml(surface.description)}</p>
              </div>
              <span class="surface-badge">${escapeHtml(surface.badge)}</span>
            </div>
            <a
              class="surface-link"
              href="${escapeHtml(surface.href)}"
              target="${surface.href.startsWith("http") ? "_blank" : "_self"}"
              rel="noreferrer"
            >
              Open Surface
            </a>
          </article>
        `).join("")}
      </div>
    </details>
  `;
}

function renderStageSnapshot(readyCount: number, requiredCount: number): string {
  const activeRoot = getEffectiveAssetRoot() ?? "server-selected bundle";
  const runtimeProfile = getAvatarRuntimeProfile();
  return `
    <section class="stage-snapshot">
      <div class="panel-toolbar">
        <div>
          <div class="eyebrow">Stage Snapshot</div>
          <h3>Runtime Readout</h3>
        </div>
      </div>
      <div class="snapshot-metrics">
        <article class="snapshot-card">
          <span>Bundle</span>
          <strong>${escapeHtml(runtimeManifest.selectedBundleName ?? "default catalog")}</strong>
          <p>${escapeHtml(activeRoot)}</p>
        </article>
        <article class="snapshot-card">
          <span>Assets</span>
          <strong>${readyCount}/${requiredCount}</strong>
          <p>${runtimeManifest.avatarReady ? "Required assets present" : "Bundle incomplete"}</p>
        </article>
        <article class="snapshot-card">
          <span>Rig Profile</span>
          <strong>${escapeHtml(runtimeProfile.key)}</strong>
          <p>${escapeHtml(runtimeProfile.orientationAngles.join(", "))}</p>
        </article>
      </div>
      <div class="snapshot-stack">
        <div class="snapshot-row">
          <span>Texture Routing</span>
          <strong>Body ${escapeHtml(appState.bodyQualityTier)} / Clothes ${escapeHtml(appState.clothingQualityTier)} / Hair ${escapeHtml(appState.hairQualityTier)}</strong>
        </div>
        <div class="snapshot-row">
          <span>Environment</span>
          <strong>${escapeHtml(appState.qualityTier)}</strong>
        </div>
        <div class="snapshot-row">
          <span>Speech Path</span>
          <strong>${escapeHtml(speechRuntime.engineLabel)}</strong>
        </div>
        <div class="snapshot-row">
          <span>Action Map</span>
          <strong>${escapeHtml(mechanicsRuntime.actionMapSummary)}</strong>
        </div>
        <div class="snapshot-row">
          <span>Render</span>
          <strong>${escapeHtml(renderStatusText)}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderQuickTuningDock(): string {
  return `
    <div class="quickstrip-head">
      <div>
        <div class="eyebrow">Live Tuning</div>
        <h3>Face And Material Controls</h3>
      </div>
      <p class="muted">These stay visible while you stage the avatar so you do not have to keep switching the tool bay.</p>
    </div>
    <div class="quickstrip-grid">
      <label class="quickstrip-slider">
        <span>Mouth Motion <strong>${appState.mouthMotionGain.toFixed(2)}</strong></span>
        <input id="mouth-motion-gain-inline" type="range" min="0.5" max="6" step="0.05" value="${appState.mouthMotionGain}" />
      </label>
      <label class="quickstrip-slider">
        <span>Viseme Smoothness <strong>${appState.visemeSmoothing.toFixed(2)}</strong></span>
        <input id="viseme-smoothing-inline" type="range" min="0.5" max="2" step="0.05" value="${appState.visemeSmoothing}" />
      </label>
      <label class="quickstrip-slider">
        <span>Matte <strong>${appState.matteStrength.toFixed(2)}</strong></span>
        <input id="matte-strength-inline" type="range" min="0.5" max="6" step="0.05" value="${appState.matteStrength}" />
      </label>
      <label class="quickstrip-slider">
        <span>Blink Amount <strong>${appState.blinkAmount.toFixed(2)}</strong></span>
        <input id="blink-amount-inline" type="range" min="0" max="1.5" step="0.05" value="${appState.blinkAmount}" />
      </label>
      <label class="quickstrip-slider">
        <span>Blink Rate <strong>${appState.blinkRate.toFixed(2)}</strong></span>
        <input id="blink-rate-inline" type="range" min="0.25" max="2" step="0.05" value="${appState.blinkRate}" />
      </label>
      <label class="quickstrip-slider">
        <span>Blink Travel <strong>${appState.blinkTravel.toFixed(2)}</strong></span>
        <input id="blink-travel-inline" type="range" min="0.5" max="6" step="0.05" value="${appState.blinkTravel}" />
      </label>
    </div>
  `;
}

function renderAvatarStage(): string {
  if (avatarManager.getState() === "ready") {
    return `
      <div class="avatar-preview-shell fullscreen-lite-shell">
        <div class="avatar-canvas-shell fullscreen-lite-canvas">
          <canvas id="avatar-diagnostic" class="avatar-diagnostic"></canvas>
          <canvas id="avatar-canvas" class="avatar-canvas"></canvas>
          ${renderStageFrameOverlays()}
        </div>
      </div>
    `;
  }

  return `
    <div class="avatar-bust">
      <div class="avatar-face"></div>
      <div class="avatar-shoulders"></div>
    </div>
  `;
}

function renderStageFrameOverlays(): string {
  return `
    <div class="stage-frame-overlays">
      <section class="stage-overlay-card stage-overlay-camera">
        <div class="stage-overlay-header">Camera</div>
        <video id="camera-preview-overlay" class="camera-preview camera-preview-overlay" autoplay playsinline muted></video>
      </section>
      <section class="stage-overlay-card stage-overlay-chat">
        <div class="stage-overlay-header">Conversation</div>
        <div id="conversation-overlay-log" class="conversation-overlay-log">
          ${renderConversationMessages(true)}
        </div>
      </section>
    </div>
  `;
}

function renderCameraPanel(): string {
  return `
    <section class="tool-card glass display-camera-panel">
      <div class="panel-toolbar">
        <div>
          <div class="eyebrow">Camera</div>
          <h3>Preview</h3>
        </div>
      </div>
      <div class="action-row compact-actions camera-actions">
        <button id="start-camera-preview" type="button">Start Camera</button>
        <button id="stop-camera-preview" type="button" class="button-secondary">Stop Camera</button>
      </div>
      <video id="camera-preview-control" class="camera-preview" autoplay playsinline muted></video>
      <div class="tool-status muted" id="camera-status">${escapeHtml(cameraRuntime.status)}</div>
    </section>
  `;
}

function renderAvatarDebugPanel(): string {
  return `
    <div class="debug-readout">
      <div id="avatar-render-status" class="avatar-render-status debug-stage-status">Loading avatar preview...</div>
    </div>
  `;
}

function renderViewportPanel(): string {
  return `
    <section class="tool-card glass display-viewport-panel">
      <div class="eyebrow">Framing</div>
      <h3>Manual Scene Controls</h3>
      <div class="muted">Linear scene movement on X/Y/Z plus full 3-axis avatar rotation. No auto fit.</div>
      <div class="viewport-grid compact-viewport-grid">
        <label>Avatar Position X<input id="avatar-pos-x" type="number" step="0.1" value="${appState.viewport.modelX}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="avatar-pos-x" data-step="-0.1">X -</button><button type="button" data-nudge="avatar-pos-x" data-step="0.1">X +</button></div>
        <label>Avatar Position Y<input id="avatar-pos-y" type="number" step="0.1" value="${appState.viewport.modelY}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="avatar-pos-y" data-step="-0.1">Y -</button><button type="button" data-nudge="avatar-pos-y" data-step="0.1">Y +</button></div>
        <label>Avatar Position Z<input id="avatar-pos-z" type="number" step="0.1" value="${appState.viewport.modelZ}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="avatar-pos-z" data-step="-0.1">Z -</button><button type="button" data-nudge="avatar-pos-z" data-step="0.1">Z +</button></div>
        <label>Avatar Rotation X<input id="avatar-rot-x" type="number" step="1" value="${appState.viewport.modelPitch}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="avatar-rot-x" data-step="-5">Rot X -</button><button type="button" data-nudge="avatar-rot-x" data-step="5">Rot X +</button></div>
        <label>Avatar Rotation Y<input id="avatar-rot-y" type="number" step="1" value="${appState.viewport.modelYaw}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="avatar-rot-y" data-step="-5">Rot Y -</button><button type="button" data-nudge="avatar-rot-y" data-step="5">Rot Y +</button></div>
        <label>Avatar Rotation Z<input id="avatar-rot-z" type="number" step="1" value="${appState.viewport.modelRoll}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="avatar-rot-z" data-step="-5">Rot Z -</button><button type="button" data-nudge="avatar-rot-z" data-step="5">Rot Z +</button></div>
        <label>Avatar Scale<input id="avatar-scale" type="number" step="0.05" min="0.01" value="${appState.viewport.modelScaleMultiplier}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="avatar-scale" data-step="-0.05">Scale -</button><button type="button" data-nudge="avatar-scale" data-step="0.05">Scale +</button></div>
        <label>Camera Position X<input id="camera-pos-x" type="number" step="0.1" value="${appState.viewport.cameraX}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="camera-pos-x" data-step="-0.1">Cam X -</button><button type="button" data-nudge="camera-pos-x" data-step="0.1">Cam X +</button></div>
        <label>Camera Height Y<input id="camera-pos-y" type="number" step="0.1" value="${appState.viewport.cameraY}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="camera-pos-y" data-step="-0.1">Cam Y -</button><button type="button" data-nudge="camera-pos-y" data-step="0.1">Cam Y +</button></div>
        <label>Camera Position Z<input id="camera-pos-z" type="number" step="0.1" value="${appState.viewport.cameraZ}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="camera-pos-z" data-step="-0.1">Cam Z -</button><button type="button" data-nudge="camera-pos-z" data-step="0.1">Cam Z +</button></div>
        <label>Camera Target X<input id="camera-target-x" type="number" step="0.1" value="${appState.viewport.targetX}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="camera-target-x" data-step="-0.1">Target X -</button><button type="button" data-nudge="camera-target-x" data-step="0.1">Target X +</button></div>
        <label>Camera Target Y<input id="camera-target-y" type="number" step="0.1" value="${appState.viewport.targetY}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="camera-target-y" data-step="-0.1">Target Y -</button><button type="button" data-nudge="camera-target-y" data-step="0.1">Target Y +</button></div>
        <label>Camera Target Z<input id="camera-target-z" type="number" step="0.1" value="${appState.viewport.targetZ}" /></label>
        <div class="action-row compact-actions"><button type="button" data-nudge="camera-target-z" data-step="-0.1">Target Z -</button><button type="button" data-nudge="camera-target-z" data-step="0.1">Target Z +</button></div>
      </div>
      <div class="action-row compact-actions viewport-actions">
        <button id="reset-viewport-state" type="button" class="button-secondary">Reset Framing</button>
        <button id="apply-client-state" type="button">Apply State</button>
      </div>
    </section>
  `;
}

function renderSidebarToolPanel(assetStatuses: WorkLiteAssetStatus[]): string {
  switch (displayModeRuntime.sidebarPanel) {
    case "status":
      return `
        <section class="control-section sidebar-tool-section">
          <div class="section-heading">Status</div>
          <div class="control-grid compact-sidebar-grid">
            <label>
              Device Label
              <input id="client-device-label" value="${escapeHtml(appState.deviceLabel)}" />
            </label>
            <label>
              Avatar Folder
              <input id="client-asset-root" list="client-asset-root-options" value="${escapeHtml(appState.assetRootMode === "custom" ? (appState.assetRoot ?? "") : "")}" placeholder="gail/avatar/base_face" />
              <datalist id="client-asset-root-options">
                ${runtimeManifest.availableAssetRoots?.map((root) => `<option value="${escapeHtml(root)}"></option>`).join("") ?? ""}
              </datalist>
            </label>
          </div>
          <div class="data-list compact-data-list">
            ${assetStatuses.length >= 0 ? `
              <article class="data-card compact-data-card">
                <strong>Render</strong>
                <span class="muted">${escapeHtml(renderStatusText)}</span>
              </article>
              <article class="data-card compact-data-card">
                <strong>Assets</strong>
                <span class="muted">${runtimeManifest.avatarReady ? "Avatar bundle ready" : "Avatar bundle incomplete"}</span>
              </article>
              <article class="data-card compact-data-card">
                <strong>Speech</strong>
                <span class="muted">${escapeHtml(speechRuntime.engineLabel)}</span>
              </article>
              <article class="data-card compact-data-card">
                <strong>Modules</strong>
                <span class="muted">${escapeHtml(mechanicsRuntime.moduleSummary)}</span>
              </article>
            ` : ""}
          </div>
        </section>
      `;
    case "framing":
      return `
        <section class="control-section sidebar-tool-section">
          <div class="section-heading">Framing</div>
          ${renderViewportPanel()}
        </section>
      `;
    case "tuning":
      return `
        <section class="control-section sidebar-tool-section">
          <div class="section-heading">Tuning</div>
          <div class="control-grid">
            <label>
              Mouth Motion (${appState.mouthMotionGain.toFixed(2)})
              <input id="mouth-motion-gain" type="range" min="0.5" max="6" step="0.05" value="${appState.mouthMotionGain}" />
            </label>
            <label>
              Viseme Smoothness (${appState.visemeSmoothing.toFixed(2)})
              <input id="viseme-smoothing" type="range" min="0.5" max="2" step="0.05" value="${appState.visemeSmoothing}" />
            </label>
            <label>
              Matte (${appState.matteStrength.toFixed(2)})
              <input id="matte-strength" type="range" min="0.5" max="6" step="0.05" value="${appState.matteStrength}" />
            </label>
            <label>
              Blink Amount (${appState.blinkAmount.toFixed(2)})
              <input id="blink-amount" type="range" min="0" max="1.5" step="0.05" value="${appState.blinkAmount}" />
            </label>
            <label>
              Blink Rate (${appState.blinkRate.toFixed(2)})
              <input id="blink-rate" type="range" min="0.25" max="2" step="0.05" value="${appState.blinkRate}" />
            </label>
            <label>
              Blink Travel (${appState.blinkTravel.toFixed(2)})
              <input id="blink-travel" type="range" min="0.5" max="6" step="0.05" value="${appState.blinkTravel}" />
            </label>
          </div>
        </section>
      `;
    case "speech":
      return `
        <section class="control-section sidebar-tool-section">
          <div class="section-heading">Speech</div>
          <div class="voice-controls compact-panel">
            <label>
              TTS Engine
              <select id="voice-engine">
                ${renderOption("openai-gpt-4o-mini-tts", speechRuntime.settings?.preferredTtsEngine ?? "openai-gpt-4o-mini-tts")}
                ${renderOption("openai-tts-1", speechRuntime.settings?.preferredTtsEngine ?? "openai-gpt-4o-mini-tts")}
                ${renderOption("openai-tts-1-hd", speechRuntime.settings?.preferredTtsEngine ?? "openai-gpt-4o-mini-tts")}
                ${renderOption("browser-speech-synthesis", speechRuntime.settings?.preferredTtsEngine ?? "openai-gpt-4o-mini-tts")}
              </select>
            </label>
            <label>
              OpenAI Voice
              <select id="voice-openai">
                ${renderVoiceOptions(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"], speechRuntime.settings?.openAiVoice ?? "nova")}
              </select>
            </label>
            <label>
              Browser Voice
              <select id="voice-browser">
                <option value="">auto</option>
                ${renderBrowserVoiceOptions(speechRuntime.settings?.browserVoiceName)}
              </select>
            </label>
            <label>
              Speak Text
              <textarea id="voice-speak-text" rows="4">${escapeHtml(speechRuntime.speechText)}</textarea>
            </label>
            <div class="voice-button-row">
              <button id="speak-avatar" type="button">Speak</button>
              <button id="stop-avatar-speech" type="button" class="button-secondary">Stop</button>
            </div>
          </div>
        </section>
      `;
    case "assets":
      return `
        <section class="control-section sidebar-tool-section">
          <div class="section-heading">Asset Checklist</div>
          <div class="control-grid compact-sidebar-grid">
            <label>
              Body Textures
              <select id="client-body-quality">
                ${renderOption("low", appState.bodyQualityTier)}
                ${renderOption("medium", appState.bodyQualityTier)}
                ${renderOption("high", appState.bodyQualityTier)}
              </select>
            </label>
            <label>
              Clothing Textures
              <select id="client-clothing-quality">
                ${renderOption("low", appState.clothingQualityTier)}
                ${renderOption("medium", appState.clothingQualityTier)}
                ${renderOption("high", appState.clothingQualityTier)}
              </select>
            </label>
            <label>
              Hair Textures
              <select id="client-hair-quality">
                ${renderOption("low", appState.hairQualityTier)}
                ${renderOption("medium", appState.hairQualityTier)}
                ${renderOption("high", appState.hairQualityTier)}
              </select>
            </label>
          </div>
          <ul class="asset-list">
            ${assetStatuses.length > 0
              ? assetStatuses.map((item) => `
                <li>
                  <strong>${escapeHtml(item.name)}</strong>: ${item.present ? "present" : "missing"}${item.required === false ? " (optional)" : ""}
                  ${item.resolvedPath ? `<div class="asset-path">${escapeHtml(toDisplayAssetPath(item.resolvedPath))}</div>` : ""}
                </li>
              `).join("")
              : runtimeManifest.placeholders.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      `;
    default:
      return `
        <section class="control-section sidebar-tool-section empty-tool-section">
          <div class="section-heading">Workspace</div>
          <div class="muted">Select a tool panel to tune framing, speech, assets, or motion behavior.</div>
        </section>
      `;
  }
}

function renderConversationPanel(): string {
  const activeSessionSummary = conversationRuntime.sessionId
    ? `Active session: ${conversationRuntime.sessionId}`
    : "Active session: none yet";
  const sendLabel = conversationRuntime.inputRoute === "workflow_control" ? "Send Control" : "Send To Gail";
  const routeHelp = conversationRuntime.inputRoute === "workflow_control"
    ? "Workflow control turns free text into a matched command or a planned workflow draft."
    : "Conversation sends the prompt to Gail chat and streams the reply back here.";
  return `
    <section class="tool-card glass conversation-panel display-chat-panel">
      <div class="panel-toolbar">
        <div>
          <div class="eyebrow">AI Control</div>
          <h3>Conversation And Workflow Control</h3>
        </div>
        <div class="action-row compact-actions toolbar-actions">
          <button id="new-conversation-session" type="button" class="button-secondary">New Session</button>
        </div>
      </div>
      <div class="tool-status muted" id="conversation-session-summary">${escapeHtml(activeSessionSummary)}</div>
      <div class="conversation-composer">
        <label class="session-select-label">
          Input Route
          <select id="conversation-input-route">
            ${renderOption("conversation", conversationRuntime.inputRoute)}
            ${renderOption("workflow_control", conversationRuntime.inputRoute)}
          </select>
        </label>
        <div class="tool-status muted">${escapeHtml(routeHelp)}</div>
        ${conversationRuntime.inputRoute === "conversation"
          ? `
        <label class="session-select-label">
          Recent Sessions
          <select id="conversation-session-select">
            <option value="">${conversationRuntime.recentSessions.length > 0 ? "Select a recent session" : "No stored sessions found"}</option>
            ${conversationRuntime.recentSessions.map((session) => `
              <option value="${escapeHtml(session.id)}"${session.id === conversationRuntime.sessionId ? " selected" : ""}>
                ${escapeHtml(renderConversationSessionLabel(session))}
              </option>
            `).join("")}
          </select>
        </label>
          `
          : '<div class="muted">Control mode does not append to a conversation session. It creates a command result or a reviewable workflow plan.</div>'}
        <label class="prompt-label">
          Prompt
          <textarea id="conversation-input" rows="4">${escapeHtml(conversationRuntime.input)}</textarea>
        </label>
      </div>
      <div class="action-row compact-actions conversation-actions">
        <button id="send-conversation-message" type="button">${escapeHtml(sendLabel)}</button>
        <button id="start-voice-control" type="button" class="button-secondary"${voiceControlRuntime.supported ? "" : " disabled"}>Voice Input</button>
        <button id="stop-voice-control" type="button" class="button-secondary">Stop Voice</button>
        <button id="speak-last-reply" type="button" class="button-secondary">Speak Last Reply</button>
        <button id="remember-last-exchange" type="button" class="button-secondary">Remember Last Exchange</button>
      </div>
      <div class="tool-status muted" id="conversation-voice-status">${escapeHtml(getVoiceControlStatus())}</div>
      <div class="tool-status muted" id="conversation-status">${escapeHtml(conversationRuntime.status)}</div>
    </section>
  `;
}

function renderConversationMessages(compact = false): string {
  const messages = compact ? conversationRuntime.messages.slice(-6) : conversationRuntime.messages;
  if (messages.length === 0) {
    return '<div class="muted">No messages yet.</div>';
  }
  return messages.map((message) => `
    <article class="conversation-message conversation-${escapeHtml(message.role)}${compact ? " compact-conversation-message" : ""}">
      <strong>${escapeHtml(message.role)}</strong>
      <p>${escapeHtml(message.content)}</p>
    </article>
  `).join("");
}

function wireEvents(root: HTMLElement): void {

  const applyButton = root.querySelector<HTMLButtonElement>("#apply-client-state");
  const resetButton = root.querySelector<HTMLButtonElement>("#reset-viewport-state");
  const viewportLocked = false;

  let viewportUpdateHandle: number | undefined;

  const applyViewportValues = async (remountOnly = false) => {
    const previousMode = appState.mode;
    const mode = getSelectValue("client-mode") as Mode;
    const environmentQuality = getSelectValueOrFallback("client-environment-quality", appState.qualityTier) as QualityTier;
    const bodyQuality = getSelectValueOrFallback("client-body-quality", appState.bodyQualityTier) as QualityTier;
    const clothingQuality = getSelectValueOrFallback("client-clothing-quality", appState.clothingQualityTier) as QualityTier;
    const hairQuality = getSelectValueOrFallback("client-hair-quality", appState.hairQualityTier) as QualityTier;
    const deviceLabel = getInputValueOrFallback("client-device-label", appState.deviceLabel);
    const assetRoot = getInputValueOrFallback("client-asset-root", appState.assetRoot ?? "").trim();
    appState.mouthMotionGain = getFirstNumberInputValue(["mouth-motion-gain-inline", "mouth-motion-gain"], appState.mouthMotionGain);
    appState.visemeSmoothing = getFirstNumberInputValue(["viseme-smoothing-inline", "viseme-smoothing"], appState.visemeSmoothing);
    appState.matteStrength = getFirstNumberInputValue(["matte-strength-inline", "matte-strength"], appState.matteStrength);
    appState.blinkAmount = getFirstNumberInputValue(["blink-amount-inline", "blink-amount"], appState.blinkAmount);
    appState.blinkRate = getFirstNumberInputValue(["blink-rate-inline", "blink-rate"], appState.blinkRate);
    appState.blinkTravel = getFirstNumberInputValue(["blink-travel-inline", "blink-travel"], appState.blinkTravel);
    if (!remountOnly) {
      destroyAvatarViewport();
      appState.mode = modeManager.setMode(mode);
      appState.qualityTier = sceneManager.setQualityTier(environmentQuality);
      appState.bodyQualityTier = bodyQuality;
      appState.clothingQualityTier = clothingQuality;
      appState.hairQualityTier = hairQuality;
      appState.deviceLabel = deviceLabel;
      appState.assetRootMode = assetRoot ? "custom" : "server";
      appState.assetRoot = assetRoot || undefined;
    }
    if (viewportLocked) {
      appState.viewport = { ...getViewportDefaultsForSystem(clientRuntimeSettings?.activeAvatarSystem) };
    } else {
      appState.viewport.modelX = getFirstNumberInputValue(["avatar-pos-x", "viewport-model-x"], appState.viewport.modelX);
      appState.viewport.modelY = getFirstNumberInputValue(["avatar-pos-y", "viewport-model-y"], appState.viewport.modelY);
      appState.viewport.modelZ = getFirstNumberInputValue(["avatar-pos-z", "viewport-model-z"], appState.viewport.modelZ);
      appState.viewport.modelPitch = getFirstNumberInputValue(["avatar-rot-x", "viewport-model-pitch"], appState.viewport.modelPitch);
      appState.viewport.modelYaw = getFirstNumberInputValue(["avatar-rot-y", "viewport-model-yaw"], appState.viewport.modelYaw);
      appState.viewport.modelRoll = getFirstNumberInputValue(["avatar-rot-z", "viewport-model-roll"], appState.viewport.modelRoll);
      appState.viewport.modelScaleMultiplier = getFirstNumberInputValue(["avatar-scale", "viewport-scale-multiplier"], appState.viewport.modelScaleMultiplier);
      appState.viewport.cameraX = getFirstNumberInputValue(["camera-pos-x", "viewport-camera-x"], appState.viewport.cameraX);
      appState.viewport.cameraY = getFirstNumberInputValue(["camera-pos-y", "viewport-camera-y"], appState.viewport.cameraY);
      appState.viewport.cameraZ = getFirstNumberInputValue(["camera-pos-z", "viewport-camera-z"], appState.viewport.cameraZ);
      appState.viewport.targetX = getFirstNumberInputValue(["camera-target-x", "viewport-target-x"], appState.viewport.targetX);
      appState.viewport.targetY = getFirstNumberInputValue(["camera-target-y", "viewport-target-y"], appState.viewport.targetY);
      appState.viewport.targetZ = getFirstNumberInputValue(["camera-target-z", "viewport-target-z"], appState.viewport.targetZ);
    }
    persistClientPreferences(appState);
    if (!remountOnly) {
      clientRuntimeSettings = await loadClientRuntimeSettings();
      runtimeManifest = await loadManifest(getEffectiveAssetRoot());
      if (runtimeManifest.avatarReady) {
        avatarManager.markReady();
        appState.avatarState = "ready";
      } else {
        appState.avatarState = "placeholder";
      }
      root.innerHTML = render();
      wireEvents(root);
      attachCameraPreview(root);
      if (previousMode !== appState.mode) {
        conversationRuntime.sessionId = appState.conversationSessionIds[appState.mode];
        conversationRuntime.messages = [];
        conversationRuntime.pendingAck = false;
        await restoreConversationState(root);
      }
      void mountAvatarViewport(root);
      return;
    }

    avatarViewport?.updateFromState();
  };

  const scheduleViewportRemount = () => {
    if (viewportUpdateHandle) {
      window.clearTimeout(viewportUpdateHandle);
    }

    viewportUpdateHandle = window.setTimeout(() => {
      void applyViewportValues(true);
    }, 120);
  };

  applyButton?.addEventListener("click", () => {
    void applyViewportValues(false);
  });

  const fullscreenButton = root.querySelector<HTMLButtonElement>("#toggle-fullscreen");
  const startCameraButton = root.querySelector<HTMLButtonElement>("#start-camera-preview");
  const stopCameraButton = root.querySelector<HTMLButtonElement>("#stop-camera-preview");
  const sendConversationButton = root.querySelector<HTMLButtonElement>("#send-conversation-message");
  const speakLastReplyButton = root.querySelector<HTMLButtonElement>("#speak-last-reply");
  const newConversationButton = root.querySelector<HTMLButtonElement>("#new-conversation-session");
  const rememberLastExchangeButton = root.querySelector<HTMLButtonElement>("#remember-last-exchange");
  const recentSessionSelect = root.querySelector<HTMLSelectElement>("#conversation-session-select");
  const conversationInputRoute = root.querySelector<HTMLSelectElement>("#conversation-input-route");
  const startVoiceControlButton = root.querySelector<HTMLButtonElement>("#start-voice-control");
  const stopVoiceControlButton = root.querySelector<HTMLButtonElement>("#stop-voice-control");
  const runtimeMenuButton = root.querySelector<HTMLButtonElement>("#toggle-runtime-menu");
  const runtimeInputMode = root.querySelector<HTMLSelectElement>("#runtime-input-mode");
  const runtimeExitFullscreenButton = root.querySelector<HTMLButtonElement>("#runtime-exit-fullscreen");
  const runtimeCloseProgramButton = root.querySelector<HTMLButtonElement>("#runtime-close-program");
  const runtimeAddFeatureButton = root.querySelector<HTMLButtonElement>("#runtime-add-feature");
  const runtimeReportBugButton = root.querySelector<HTMLButtonElement>("#runtime-report-bug");
  const runtimeHelpButton = root.querySelector<HTMLButtonElement>("#runtime-help");
  const sidebarToolPanelSelect = root.querySelector<HTMLSelectElement>("#sidebar-tool-panel");
  const controlsVisibilitySelect = root.querySelector<HTMLSelectElement>("#controls-visibility");
  const applyModeSelect = root.querySelector<HTMLSelectElement>("#apply-mode");
  const showControlsButton = root.querySelector<HTMLButtonElement>("#show-controls-panel");
  const speakButton = root.querySelector<HTMLButtonElement>("#speak-avatar");
  const stopSpeakButton = root.querySelector<HTMLButtonElement>("#stop-avatar-speech");
  speakButton?.addEventListener("click", () => {
    speechRuntime.speechText = getTextAreaValue("voice-speak-text").trim() || speechRuntime.speechText;
    void speakAvatarText(speechRuntime.speechText);
  });
  stopSpeakButton?.addEventListener("click", () => {
    stopAvatarSpeech();
  });
  fullscreenButton?.addEventListener("click", async () => {
    await toggleFullscreen(root);
  });
  runtimeMenuButton?.addEventListener("click", () => {
    displayModeRuntime.quickMenuOpen = !displayModeRuntime.quickMenuOpen;
    root.innerHTML = render();
    wireEvents(root);
    attachCameraPreview(root);
    void mountAvatarViewport(root);
  });
  runtimeInputMode?.addEventListener("change", async () => {
    await applyDisplayInputMode(root, runtimeInputMode.value as "wake_word" | "always_listening" | "typed");
  });
  runtimeExitFullscreenButton?.addEventListener("click", async () => {
    await exitFullscreenOnly(root);
  });
  runtimeCloseProgramButton?.addEventListener("click", async () => {
    await requestRuntimeCloseProgram(root);
  });
  runtimeAddFeatureButton?.addEventListener("click", async () => {
    await addFeatureRequestFromRuntime(root);
  });
  runtimeReportBugButton?.addEventListener("click", () => {
    window.open("/panel/operator-studio-shell.html", "_blank", "noopener,noreferrer");
  });
  runtimeHelpButton?.addEventListener("click", () => {
    conversationRuntime.status = "Help opened in Operator Studio Shell. Use [IN] Instructions and [WF] Workflow pages for guided steps.";
    updateConversationSurface(root);
  });
  startCameraButton?.addEventListener("click", async () => {
    await startCameraPreview(root);
  });
  stopCameraButton?.addEventListener("click", () => {
    stopCameraPreview(root);
  });
  sendConversationButton?.addEventListener("click", async () => {
    conversationRuntime.input = getTextAreaValue("conversation-input").trim() || conversationRuntime.input;
    await sendRoutedInput(root, conversationRuntime.input, "typed");
  });
  conversationInputRoute?.addEventListener("change", () => {
    conversationRuntime.inputRoute = conversationInputRoute.value as ConversationInputRoute;
    persistConversationRoutePreference(conversationRuntime.inputRoute);
    if (voiceControlRuntime.active) {
      stopVoiceControl(root, "Voice input stopped while changing routes.");
    }
    root.innerHTML = render();
    wireEvents(root);
    attachCameraPreview(root);
    void mountAvatarViewport(root);
  });
  speakLastReplyButton?.addEventListener("click", async () => {
    const lastReply = [...conversationRuntime.messages].reverse().find((message) => message.role === "assistant");
    if (lastReply) {
      await speakAvatarText(lastReply.content);
    }
  });
  newConversationButton?.addEventListener("click", async () => {
    await createFreshConversationSession(root);
  });
  rememberLastExchangeButton?.addEventListener("click", async () => {
    await rememberLastExchange(root);
  });
  startVoiceControlButton?.addEventListener("click", async () => {
    await startVoiceControl(root);
  });
  stopVoiceControlButton?.addEventListener("click", () => {
    stopVoiceControl(root, "Voice input stopped.");
  });
  recentSessionSelect?.addEventListener("change", async () => {
    const selectedId = recentSessionSelect.value.trim();
    if (!selectedId || selectedId === conversationRuntime.sessionId) {
      return;
    }
    await loadConversationSession(root, selectedId, `Loaded session ${selectedId}.`);
  });
  sidebarToolPanelSelect?.addEventListener("change", () => {
    const nextValue = sidebarToolPanelSelect.value as SidebarPanelKey;
    displayModeRuntime.sidebarPanel = nextValue;
    persistSidebarPanelPreference(nextValue);
    root.innerHTML = render();
    wireEvents(root);
    attachCameraPreview(root);
    void mountAvatarViewport(root);
  });
  controlsVisibilitySelect?.addEventListener("change", () => {
    appState.controlsVisible = controlsVisibilitySelect.value !== "hide";
    persistClientPreferences(appState);
    root.innerHTML = render();
    wireEvents(root);
    attachCameraPreview(root);
    void mountAvatarViewport(root);
  });
  applyModeSelect?.addEventListener("change", () => {
    appState.autoApplyAdjustments = applyModeSelect.value === "live";
    persistClientPreferences(appState);
  });
  showControlsButton?.addEventListener("click", () => {
    appState.controlsVisible = true;
    persistClientPreferences(appState);
    root.innerHTML = render();
    wireEvents(root);
    attachCameraPreview(root);
    void mountAvatarViewport(root);
  });

  resetButton?.addEventListener("click", () => {
    appState.viewport = { ...getViewportDefaultsForSystem(clientRuntimeSettings?.activeAvatarSystem) };
    persistClientPreferences(appState);
    root.innerHTML = render();
    wireEvents(root);
    attachCameraPreview(root);
    void mountAvatarViewport(root);
  });

  const nudgeButtons = root.querySelectorAll<HTMLButtonElement>("button[data-nudge]");
  for (const button of nudgeButtons) {
    button.addEventListener("click", () => {
      const inputId = button.dataset.nudge;
      const step = Number(button.dataset.step ?? "0");
      if (!inputId || !Number.isFinite(step)) {
        return;
      }
      const input = document.getElementById(inputId);
      if (!(input instanceof HTMLInputElement)) {
        return;
      }
      const current = Number(input.value);
      const next = (Number.isFinite(current) ? current : 0) + step;
      input.value = String(Math.round(next * 10000) / 10000);
      if (appState.autoApplyAdjustments) {
        scheduleViewportRemount();
      }
    });
  }

  if (viewportLocked) {
    for (const id of [
      "quick-scale-multiplier",
      "quick-model-x",
      "quick-model-y",
      "quick-model-z",
      "quick-model-yaw",
      "viewport-model-x",
      "viewport-model-y",
      "viewport-model-z",
      "viewport-model-yaw",
      "viewport-model-pitch",
      "viewport-model-roll",
      "viewport-scale-multiplier",
      "viewport-camera-x",
      "viewport-camera-y",
      "viewport-camera-z",
      "viewport-target-x",
      "viewport-target-y",
      "viewport-target-z",
      "reset-viewport-state",
    ]) {
      const element = document.getElementById(id);
      if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
        element.disabled = true;
        element.title = "Locked to handoff staging defaults";
      }
    }
  }

  for (const id of [
    "client-mode",
    "client-environment-quality",
    "client-body-quality",
    "client-clothing-quality",
    "client-hair-quality",
  ]) {
    const element = document.getElementById(id);
    if (element instanceof HTMLSelectElement) {
      element.addEventListener("change", () => {
        if (appState.autoApplyAdjustments) {
          void applyViewportValues(false);
        }
      });
    }
  }

  for (const id of [
    "client-device-label",
    "client-asset-root",
  ]) {
    const element = document.getElementById(id);
    if (element instanceof HTMLInputElement) {
      element.addEventListener("change", () => {
        if (appState.autoApplyAdjustments) {
          void applyViewportValues(false);
        }
      });
    }
  }

  for (const id of [
    "mouth-motion-gain",
    "mouth-motion-gain-inline",
    "viseme-smoothing",
    "viseme-smoothing-inline",
    "matte-strength",
    "matte-strength-inline",
    "blink-amount",
    "blink-amount-inline",
    "blink-rate",
    "blink-rate-inline",
    "blink-travel",
    "blink-travel-inline",
    "avatar-pos-x",
    "avatar-pos-y",
    "avatar-pos-z",
    "avatar-rot-x",
    "avatar-rot-y",
    "avatar-rot-z",
    "avatar-scale",
    "camera-pos-x",
    "camera-pos-y",
    "camera-pos-z",
    "camera-target-x",
    "camera-target-y",
    "camera-target-z",
    "viewport-model-x",
    "viewport-model-y",
    "viewport-model-z",
    "viewport-model-yaw",
    "viewport-model-pitch",
    "viewport-model-roll",
    "viewport-scale-multiplier",
    "viewport-camera-x",
    "viewport-camera-y",
    "viewport-camera-z",
    "viewport-target-x",
    "viewport-target-y",
    "viewport-target-z",
  ]) {
    const element = document.getElementById(id);
    if (element instanceof HTMLInputElement) {
      element.addEventListener("input", () => {
        if (appState.autoApplyAdjustments) {
          scheduleViewportRemount();
        }
      });
      element.addEventListener("change", () => {
        if (appState.autoApplyAdjustments) {
          scheduleViewportRemount();
        }
      });
    }
  }

  const voiceEngine = root.querySelector<HTMLSelectElement>("#voice-engine");
  const openAiVoice = root.querySelector<HTMLSelectElement>("#voice-openai");
  const browserVoice = root.querySelector<HTMLSelectElement>("#voice-browser");
  const saveVoiceSettings = async () => {
    await updateVoiceSettings({
      preferredTtsEngine: getSelectValue("voice-engine") as VoiceSettings["preferredTtsEngine"],
      openAiVoice: getSelectValue("voice-openai"),
      browserVoiceName: getSelectValue("voice-browser") || undefined,
    });
    root.innerHTML = render();
    wireEvents(root);
    attachCameraPreview(root);
    avatarViewport?.updateFromState();
  };
  voiceEngine?.addEventListener("change", () => {
    void saveVoiceSettings();
  });
  openAiVoice?.addEventListener("change", () => {
    void saveVoiceSettings();
  });
  browserVoice?.addEventListener("change", () => {
    void saveVoiceSettings();
  });
}

async function mountAvatarViewport(root: HTMLElement): Promise<void> {
  destroyAvatarViewport();

  const canvas = root.querySelector<HTMLCanvasElement>("#avatar-canvas");
  const diagnosticCanvas = root.querySelector<HTMLCanvasElement>("#avatar-diagnostic");
  const status = root.querySelector<HTMLDivElement>("#avatar-render-status");
  if (!canvas || !diagnosticCanvas || !status) {
    return;
  }

  mountDiagnosticOverlay(diagnosticCanvas);

  if (avatarManager.getState() !== "ready") {
    setRenderStatus(status, "Waiting for required avatar assets.");
    return;
  }

  setRenderStatus(status, "Loading avatar preview...");

  try {
    avatarViewport = await createAvatarViewport(canvas, status);
  } catch (error) {
    setRenderStatus(status, error instanceof Error ? error.message : String(error), true);
  }
}

function destroyAvatarViewport(): void {
  avatarViewport?.destroy();
  avatarViewport = undefined;
}

function attachCameraPreview(root: HTMLElement): void {
  const previews = root.querySelectorAll<HTMLVideoElement>("#camera-preview-control, #camera-preview-overlay");
  const status = root.querySelector<HTMLElement>("#camera-status");
  for (const preview of previews) {
    preview.srcObject = cameraRuntime.stream ?? null;
  }
  if (status) {
    status.textContent = cameraRuntime.status;
  }
  syncDisplayModeUi(root);
}

function syncDisplayModeUi(root: HTMLElement): void {
  const shell = root.querySelector<HTMLElement>(".client-shell");
  const button = root.querySelector<HTMLButtonElement>("#toggle-fullscreen");
  const canvasShell = root.querySelector<HTMLElement>(".avatar-canvas-shell");
  if (canvasShell && !displayModeRuntime.active) {
    const rect = canvasShell.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      displayModeRuntime.previewWidth = rect.width;
      displayModeRuntime.previewHeight = rect.height;
    }
  }
  if (shell) {
    shell.classList.toggle("display-mode", displayModeRuntime.active);
    const previewWidth = Math.max(1, displayModeRuntime.previewWidth);
    const previewHeight = Math.max(1, displayModeRuntime.previewHeight);
    const reservedHeight = displayModeRuntime.active ? 300 : 0;
    const scale = displayModeRuntime.active
      ? Math.min(window.innerWidth / previewWidth, Math.max(0.45, (window.innerHeight - reservedHeight) / previewHeight))
      : 1;
    shell.style.setProperty("--display-preview-width", `${previewWidth}px`);
    shell.style.setProperty("--display-preview-height", `${previewHeight}px`);
    shell.style.setProperty("--display-preview-scale", String(scale));
  }
  if (button) {
    button.textContent = displayModeRuntime.active ? "Exit Display Mode" : "Display Mode";
  }
}

function updateConversationSurface(root: HTMLElement): void {
  const status = root.querySelector<HTMLElement>("#conversation-status");
  const sessionSummary = root.querySelector<HTMLElement>("#conversation-session-summary");
  const sessionSelect = root.querySelector<HTMLSelectElement>("#conversation-session-select");
  const routeSelect = root.querySelector<HTMLSelectElement>("#conversation-input-route");
  const voiceStatus = root.querySelector<HTMLElement>("#conversation-voice-status");
  const sendButton = root.querySelector<HTMLButtonElement>("#send-conversation-message");
  const overlayLog = root.querySelector<HTMLElement>("#conversation-overlay-log");
  if (status) {
    status.textContent = conversationRuntime.status;
  }
  if (sessionSummary) {
    sessionSummary.textContent = conversationRuntime.sessionId
      ? `Active session: ${conversationRuntime.sessionId}`
      : "Active session: none yet";
  }
  if (sessionSelect) {
    sessionSelect.innerHTML = [
      `<option value="">${conversationRuntime.recentSessions.length > 0 ? "Select a recent session" : "No stored sessions found"}</option>`,
      ...conversationRuntime.recentSessions.map((session) => `
        <option value="${escapeHtml(session.id)}"${session.id === conversationRuntime.sessionId ? " selected" : ""}>
          ${escapeHtml(renderConversationSessionLabel(session))}
        </option>
      `),
    ].join("");
  }
  if (routeSelect) {
    routeSelect.value = conversationRuntime.inputRoute;
  }
  if (voiceStatus) {
    voiceStatus.textContent = getVoiceControlStatus();
  }
  if (sendButton) {
    sendButton.textContent = conversationRuntime.inputRoute === "workflow_control" ? "Send Control" : "Send To Gail";
  }
  if (overlayLog) {
    overlayLog.innerHTML = renderConversationMessages(true);
  }
}

function updateConversationInputField(root: ParentNode = document): void {
  const input = root.querySelector<HTMLTextAreaElement>("#conversation-input");
  if (input) {
    input.value = conversationRuntime.input;
  }
}

function getClientRequestHeaders(includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {
    "x-gail-device-id": "work-lite-client-1",
    "x-gail-device-type": "uconsole",
    "x-gail-mode": appState.mode,
  };
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

function persistConversationSessionPreference(): void {
  if (conversationRuntime.sessionId) {
    appState.conversationSessionIds[appState.mode] = conversationRuntime.sessionId;
  } else {
    delete appState.conversationSessionIds[appState.mode];
  }
  persistClientPreferences(appState);
}

async function refreshConversationSessions(root?: HTMLElement): Promise<void> {
  try {
    const response = await fetch("/conversation/sessions", {
      headers: getClientRequestHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Conversation session list failed with ${response.status}`);
    }
    const sessions = await response.json() as Array<{
      id: string;
      title?: string;
      updatedAt?: string;
      messages?: Array<{ role: string; content: string }>;
    }>;
    conversationRuntime.recentSessions = sessions
      .map((session) => ({
        id: session.id,
        title: session.title,
        updatedAt: session.updatedAt,
        messageCount: session.messages?.length ?? 0,
      }))
      .slice(0, 12);
    if (root) {
      updateConversationSurface(root);
    }
  } catch {
    // Keep the client usable even if session inspection is temporarily unavailable.
  }
}

async function restoreConversationState(root: HTMLElement): Promise<void> {
  await refreshConversationSessions(root);
  const preferredSessionId = appState.conversationSessionIds[appState.mode];
  if (!preferredSessionId) {
    conversationRuntime.status = conversationRuntime.recentSessions.length > 0
      ? "Recent sessions available."
      : "No session yet.";
    updateConversationSurface(root);
    return;
  }
  try {
    await loadConversationSession(root, preferredSessionId, `Restored session ${preferredSessionId}.`);
  } catch {
    delete appState.conversationSessionIds[appState.mode];
    persistClientPreferences(appState);
    conversationRuntime.status = "Saved session was unavailable. Ready for a new session.";
    updateConversationSurface(root);
  }
}

async function loadConversationSession(root: HTMLElement, sessionId: string, statusText?: string): Promise<void> {
  cancelActiveConversationRequest(root, "Switching sessions...");
  const response = await fetch(`/conversation/sessions/${sessionId}`, {
    headers: getClientRequestHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Conversation session load failed with ${response.status}`);
  }
  const session = await response.json() as { id: string; messages?: Array<{ role: string; content: string }> };
  conversationRuntime.sessionId = session.id;
  conversationRuntime.messages = session.messages ?? [];
  conversationRuntime.pendingAck = false;
  conversationRuntime.status = statusText ?? `Session ${session.id} loaded.`;
  persistConversationSessionPreference();
  await refreshConversationSessions();
  updateConversationSurface(root);
}

async function ensureConversationSession(root: HTMLElement): Promise<string> {
  if (conversationRuntime.sessionId) {
    return conversationRuntime.sessionId;
  }
  conversationRuntime.status = "Creating conversation session...";
  updateConversationSurface(root);
  const response = await fetch("/conversation/sessions", {
    method: "POST",
    headers: getClientRequestHeaders(true),
    body: JSON.stringify({ title: "Work-lite integrated test" }),
  });
  if (!response.ok) {
    throw new Error(`Conversation session create failed with ${response.status}`);
  }
  const session = await response.json() as { id: string; messages: Array<{ role: string; content: string }> };
  conversationRuntime.sessionId = session.id;
  conversationRuntime.messages = session.messages ?? [];
  conversationRuntime.status = `Session ${session.id} ready.`;
  persistConversationSessionPreference();
  await refreshConversationSessions();
  updateConversationSurface(root);
  return session.id;
}

async function createFreshConversationSession(root: HTMLElement): Promise<void> {
  cancelActiveConversationRequest(root, "Starting fresh session...");
  conversationRuntime.sessionId = undefined;
  conversationRuntime.messages = [];
  conversationRuntime.pendingAck = false;
  persistConversationSessionPreference();
  await ensureConversationSession(root);
}

async function sendRoutedInput(root: HTMLElement, text: string, source: ControlInputSource): Promise<void> {
  if (conversationRuntime.inputRoute === "workflow_control") {
    await sendControlIntent(root, text, source);
    return;
  }
  await sendConversationMessage(root, text);
}

async function sendConversationMessage(root: HTMLElement, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  if (conversationRuntime.pending) {
    cancelActiveConversationRequest(root, "Interrupted previous reply.");
  }
  const sessionId = await ensureConversationSession(root);
  const requestId = conversationRuntime.activeRequestId + 1;
  conversationRuntime.activeRequestId = requestId;
  conversationRuntime.pending = true;
  conversationRuntime.pendingAck = false;
  conversationRuntime.status = "Sending to Gail...";
  speechRuntime.listening = true;
  speechRuntime.streamedSpokenText = "";
  conversationRuntime.messages = [
    ...conversationRuntime.messages,
    { role: "user", content: trimmed },
    { role: "assistant", content: "" },
  ];
  updateConversationSurface(root);
  try {
    const payload = await streamConversationMessage(root, sessionId, trimmed, requestId);
    if (requestId !== conversationRuntime.activeRequestId) {
      return;
    }
    conversationRuntime.messages = payload.session.messages ?? [];
    conversationRuntime.status = payload.fellBack
      ? `Reply ready via ${payload.usedProvider} fallback.`
      : `Reply ready via ${payload.usedProvider ?? "assistant"}.`;
    await refreshConversationSessions();
    updateConversationSurface(root);
    await flushStreamingSpeech();
  } catch (error) {
    if (requestId !== conversationRuntime.activeRequestId) {
      return;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      conversationRuntime.status = "Reply canceled.";
      updateConversationSurface(root);
      return;
    }
    throw error;
  } finally {
    if (requestId === conversationRuntime.activeRequestId) {
      conversationRuntime.pending = false;
      speechRuntime.listening = false;
      conversationRuntime.streamController = undefined;
      updateConversationSurface(root);
    }
  }
  updateRuntimeMechanicsSurface(root);
}

async function sendControlIntent(root: HTMLElement, text: string, source: ControlInputSource): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  if (conversationRuntime.pending) {
    cancelActiveConversationRequest(root, "Interrupted previous control action.");
  }
  const requestId = conversationRuntime.activeRequestId + 1;
  conversationRuntime.activeRequestId = requestId;
  conversationRuntime.pending = true;
  conversationRuntime.pendingAck = false;
  conversationRuntime.status = source === "voice" ? "Routing voice control..." : "Routing workflow control...";
  speechRuntime.listening = true;
  conversationRuntime.messages = [
    ...conversationRuntime.messages,
    { role: "user", content: trimmed },
    { role: "assistant", content: "" },
  ];
  updateConversationSurface(root);
  try {
    const response = await fetch("/control/intents", {
      method: "POST",
      headers: getClientRequestHeaders(true),
      body: JSON.stringify({
        text: trimmed,
        source,
        autoPlan: true,
      }),
    });
    if (!response.ok) {
      throw new Error(`Workflow control request failed with ${response.status}`);
    }
    const payload = await response.json() as ControlIntentResponse;
    if (requestId !== conversationRuntime.activeRequestId) {
      return;
    }
    const lastMessage = conversationRuntime.messages[conversationRuntime.messages.length - 1];
    if (lastMessage?.role === "assistant") {
      lastMessage.content = formatControlIntentMessage(payload);
    }
    conversationRuntime.status = payload.summary;
    updateConversationSurface(root);
    if (payload.action === "command" && payload.command?.success) {
      await routeRuntimeCommandAction(root, payload.command.action);
    }
    if (source === "voice" && lastMessage?.content) {
      await speakAvatarText(lastMessage.content);
    }
  } finally {
    if (requestId === conversationRuntime.activeRequestId) {
      conversationRuntime.pending = false;
      speechRuntime.listening = false;
      updateConversationSurface(root);
    }
  }
  updateRuntimeMechanicsSurface(root);
}

function buildOperatorShellUrl(pageId?: string, commandAction?: string): string {
  const url = new URL("/panel/operator-studio-shell.html", window.location.origin);
  if (pageId) {
    url.searchParams.set("page", pageId);
  }
  if (commandAction) {
    url.searchParams.set("commandAction", commandAction);
  }
  return url.toString();
}

function openOperatorShell(pageId?: string, commandAction?: string): void {
  window.open(buildOperatorShellUrl(pageId, commandAction), "_blank", "noopener,noreferrer");
}

async function rerenderRuntimeSurface(root: HTMLElement): Promise<void> {
  root.innerHTML = render();
  wireEvents(root);
  attachCameraPreview(root);
  await mountAvatarViewport(root);
}

async function applyRuntimeModeFromCommand(root: HTMLElement, mode: Mode): Promise<void> {
  if (appState.mode === mode) {
    conversationRuntime.status = `Already in ${mode} mode.`;
    updateConversationSurface(root);
    return;
  }

  appState.mode = modeManager.setMode(mode);
  persistClientPreferences(appState);
  clientRuntimeSettings = await loadClientRuntimeSettings();
  runtimeManifest = await loadManifest(getEffectiveAssetRoot());
  if (runtimeManifest.avatarReady) {
    avatarManager.markReady();
    appState.avatarState = "ready";
  } else {
    appState.avatarState = "placeholder";
  }
  conversationRuntime.sessionId = appState.conversationSessionIds[appState.mode];
  conversationRuntime.messages = [];
  conversationRuntime.pendingAck = false;
  await rerenderRuntimeSurface(root);
  await restoreConversationState(root);
  conversationRuntime.status = `Mode switched to ${mode}.`;
  updateConversationSurface(root);
}

async function routeRuntimeCommandAction(root: HTMLElement, action: string): Promise<void> {
  switch (action) {
    case "switch_mode_work":
      await applyRuntimeModeFromCommand(root, "work");
      return;
    case "switch_mode_private":
      await applyRuntimeModeFromCommand(root, "private");
      return;
    case "switch_private_persona_counselor":
      await applyRuntimePrivatePersona(root, "private_counselor");
      return;
    case "switch_private_persona_girlfriend":
      await applyRuntimePrivatePersona(root, "private_girlfriend");
      return;
    case "open_menu":
      displayModeRuntime.quickMenuOpen = true;
      await rerenderRuntimeSurface(root);
      conversationRuntime.status = "Runtime menu opened.";
      updateConversationSurface(root);
      return;
    case "exit_fullscreen":
      displayModeRuntime.quickMenuOpen = false;
      await exitFullscreenOnly(root);
      conversationRuntime.status = "Display mode exited.";
      updateConversationSurface(root);
      return;
    case "set_display_mode_wake_word":
      await applyDisplayInputMode(root, "wake_word");
      conversationRuntime.status = "Display input mode set to wake_word.";
      updateConversationSurface(root);
      return;
    case "set_display_mode_always_listening":
      await applyDisplayInputMode(root, "always_listening");
      conversationRuntime.status = "Display input mode set to always_listening.";
      updateConversationSurface(root);
      return;
    case "set_display_mode_typed":
      await applyDisplayInputMode(root, "typed");
      conversationRuntime.status = "Display input mode set to typed.";
      updateConversationSurface(root);
      return;
    case "close_program":
      window.close();
      conversationRuntime.status = "Close requested. If the browser blocks it, use the desktop stop shortcut.";
      updateConversationSurface(root);
      return;
    default: {
      const pageId = SHELL_PAGE_BY_COMMAND_ACTION[action];
      openOperatorShell(pageId, action);
      conversationRuntime.status = pageId
        ? `Command routed to Operator Studio Shell: ${action} on ${pageId}.`
        : `Command routed to Operator Studio Shell: ${action}.`;
      updateConversationSurface(root);
    }
  }
}

async function applyRuntimePrivatePersona(
  root: HTMLElement,
  persona: "private_counselor" | "private_girlfriend",
): Promise<void> {
  if (appState.mode !== "private") {
    await applyRuntimeModeFromCommand(root, "private");
  }

  const response = await fetch("/providers/local-llm-config", {
    method: "PATCH",
    headers: getClientRequestHeaders(true),
    body: JSON.stringify({ activePrivatePersona: persona }),
  });
  if (!response.ok) {
    throw new Error(`Private persona update failed with ${response.status}`);
  }

  conversationRuntime.status = persona === "private_girlfriend"
    ? "Private persona switched to Cherry."
    : "Private persona switched to Vera.";
  updateConversationSurface(root);
}

async function rememberLastExchange(root: HTMLElement): Promise<void> {
  if (appState.mode === "private") {
    conversationRuntime.status = "Private mode blocks shared memory saves.";
    updateConversationSurface(root);
    return;
  }
  const lastAssistant = [...conversationRuntime.messages].reverse().find((message) => message.role === "assistant");
  const lastUser = [...conversationRuntime.messages].reverse().find((message) => message.role === "user");
  if (!lastAssistant) {
    conversationRuntime.status = "No assistant reply available to remember yet.";
    updateConversationSurface(root);
    return;
  }

  const titleSource = lastUser?.content || lastAssistant.content;
  const title = createMemoryTitle(titleSource);
  const body = [
    lastUser ? `User: ${lastUser.content}` : undefined,
    `Assistant: ${lastAssistant.content}`,
  ].filter(Boolean).join("\n\n");

  const response = await fetch("/memory/entries", {
    method: "POST",
    headers: getClientRequestHeaders(true),
    body: JSON.stringify({
      title,
      body,
      tags: ["conversation", "work-lite", appState.mode],
      source: conversationRuntime.sessionId ? `conversation:${conversationRuntime.sessionId}` : "conversation:work-lite",
    }),
  });
  if (!response.ok) {
    throw new Error(`Memory save failed with ${response.status}`);
  }

  conversationRuntime.status = `Saved memory: ${title}`;
  updateConversationSurface(root);
}

async function startVoiceControl(root: HTMLElement): Promise<void> {
  if (voiceControlRuntime.active) {
    return;
  }
  const Recognition = getSpeechRecognitionConstructor();
  if (!Recognition) {
    conversationRuntime.status = "Browser speech recognition is unavailable here.";
    updateConversationSurface(root);
    return;
  }
  stopAvatarSpeech();
  const recognition = new Recognition();
  voiceControlRuntime.recognition = recognition;
  voiceControlRuntime.active = true;
  speechRuntime.listening = true;
  conversationRuntime.status = conversationRuntime.inputRoute === "workflow_control"
    ? "Listening for workflow control..."
    : "Listening for conversation input...";
  updateConversationSurface(root);
  let submittedTranscript = false;
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    let transcript = "";
    let finalDetected = false;
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      transcript += result[0]?.transcript ?? "";
      finalDetected = finalDetected || Boolean(result.isFinal);
    }
    const trimmed = transcript.trim();
    if (!trimmed) {
      return;
    }
    voiceControlRuntime.lastTranscript = trimmed;
    conversationRuntime.input = trimmed;
    updateConversationInputField(root);
    if (finalDetected && !submittedTranscript) {
      submittedTranscript = true;
      conversationRuntime.status = "Voice captured. Routing transcript...";
      updateConversationSurface(root);
      void sendRoutedInput(root, trimmed, "voice");
    }
  };
  recognition.onerror = (event) => {
    const detail = event.error ?? event.message ?? "Speech recognition failed.";
    conversationRuntime.status = `Voice input error: ${detail}`;
    updateConversationSurface(root);
  };
  recognition.onend = () => {
    voiceControlRuntime.active = false;
    voiceControlRuntime.recognition = undefined;
    if (!conversationRuntime.pending) {
      speechRuntime.listening = false;
      if (!submittedTranscript && !conversationRuntime.status.startsWith("Voice input error:")) {
        conversationRuntime.status = "Voice input stopped.";
      }
    }
    updateConversationSurface(root);
  };
  recognition.start();
}

function stopVoiceControl(root?: HTMLElement, statusText = "Voice input stopped."): void {
  const recognition = voiceControlRuntime.recognition;
  voiceControlRuntime.recognition = undefined;
  voiceControlRuntime.active = false;
  if (recognition) {
    recognition.onend = null;
    recognition.abort();
  }
  if (!conversationRuntime.pending) {
    speechRuntime.listening = false;
    conversationRuntime.status = statusText;
  }
  if (root) {
    updateConversationSurface(root);
  }
}

function getVoiceControlStatus(): string {
  if (!voiceControlRuntime.supported) {
    return "Voice input is unavailable in this browser. Typed control still works.";
  }
  if (voiceControlRuntime.active) {
    return conversationRuntime.inputRoute === "workflow_control"
      ? "Listening for a spoken workflow or command request."
      : "Listening for a spoken conversation prompt.";
  }
  if (voiceControlRuntime.lastTranscript) {
    return `Last transcript: ${voiceControlRuntime.lastTranscript}`;
  }
  return conversationRuntime.inputRoute === "workflow_control"
    ? "Voice input will route the transcript into workflow control."
    : "Voice input will route the transcript into conversation.";
}

function formatControlIntentMessage(payload: ControlIntentResponse): string {
  if (payload.action === "command" && payload.command) {
    return `${payload.summary} Command: ${payload.command.key}. Action: ${payload.command.action}. Broker status: ${payload.command.brokerStatus}.`;
  }
  if (payload.action === "workflow" && payload.workflow) {
    const firstStep = payload.workflow.firstStepTitle
      ? ` First step: ${payload.workflow.firstStepTitle}.`
      : "";
    const reviewText = payload.workflow.reviewRequired ? " Review is still required before execution." : "";
    return `${payload.summary} Workflow ID: ${payload.workflow.id}. Steps: ${payload.workflow.plannedStepCount}.${firstStep}${reviewText}`;
  }
  return payload.summary;
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

function updateRuntimeMechanicsSurface(root: ParentNode = document): void {
  for (const [title, value] of [
    ["Modules", mechanicsRuntime.moduleSummary],
    ["Asset Root", mechanicsRuntime.assetRoot],
    ["Action Map", mechanicsRuntime.actionMapSummary],
    ["Active Action", mechanicsRuntime.activeAction],
    ["Speech Path", speechRuntime.engineLabel],
  ] as const) {
    const label = Array.from(root.querySelectorAll<HTMLElement>(".data-card strong"))
      .find((element) => element.textContent === title);
    const body = label?.nextElementSibling as HTMLElement | null;
    if (body) {
      body.textContent = value;
    }
  }
}

function cancelActiveConversationRequest(root?: HTMLElement, statusText = "Reply canceled."): void {
  if (conversationRuntime.streamController) {
    conversationRuntime.streamController.abort();
    conversationRuntime.streamController = undefined;
  }
  conversationRuntime.pending = false;
  conversationRuntime.pendingAck = false;
  speechRuntime.listening = false;
  stopAvatarSpeech();
  conversationRuntime.status = statusText;
  if (root) {
    updateConversationSurface(root);
  }
}

async function streamConversationMessage(
  root: HTMLElement,
  sessionId: string,
  text: string,
  requestId: number,
): Promise<{ session: { messages: Array<{ role: string; content: string }> }; reply?: { content: string }; usedProvider?: string; fellBack?: boolean }> {
  const settings = await loadVoiceSettings();
  stopAvatarSpeech();
  const controller = new AbortController();
  conversationRuntime.streamController = controller;
  const response = await fetch(`/conversation/sessions/${sessionId}/messages/stream`, {
    method: "POST",
    headers: getClientRequestHeaders(true),
    body: JSON.stringify({ content: text }),
    signal: controller.signal,
  });
  if (!response.ok || !response.body) {
    const fallback = await fetch(`/conversation/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: getClientRequestHeaders(true),
      body: JSON.stringify({ content: text }),
      signal: controller.signal,
    });
    if (!fallback.ok) {
      throw new Error(`Conversation message failed with ${fallback.status}`);
    }
    const payload = await fallback.json() as { session: { messages: Array<{ role: string; content: string }> }; reply?: { content: string }; usedProvider?: string; fellBack?: boolean };
    if (payload.reply?.content) {
      await speakAvatarText(payload.reply.content);
    }
    return payload;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let delimiterIndex = findStreamDelimiter(buffer);
    while (delimiterIndex >= 0) {
      const separatorLength = buffer[delimiterIndex] === "\r" ? 4 : 2;
      const rawEvent = buffer.slice(0, delimiterIndex);
      buffer = buffer.slice(delimiterIndex + separatorLength);
      const event = parseStreamEvent(rawEvent);
      if (event) {
        if (event.event === "delta" && typeof event.data.delta === "string") {
          if (requestId !== conversationRuntime.activeRequestId) {
            throw new DOMException("Conversation stream superseded.", "AbortError");
          }
          appendStreamedAssistantText(event.data.delta, root, settings);
        }
        if (event.event === "done") {
          if (requestId !== conversationRuntime.activeRequestId) {
            throw new DOMException("Conversation stream superseded.", "AbortError");
          }
          return event.data as { session: { messages: Array<{ role: string; content: string }> }; reply?: { content: string }; usedProvider?: string; fellBack?: boolean };
        }
        if (event.event === "error") {
          throw new Error(typeof event.data.error === "string" ? event.data.error : "Conversation stream failed.");
        }
      }
      delimiterIndex = findStreamDelimiter(buffer);
    }
  }

  throw new Error("Conversation stream ended before completion.");
}

function appendStreamedAssistantText(delta: string, root: HTMLElement, settings: VoiceSettings): void {
  const lastMessage = conversationRuntime.messages[conversationRuntime.messages.length - 1];
  if (!lastMessage || lastMessage.role !== "assistant") {
    return;
  }
  if (!lastMessage.content.trim() && delta.trim()) {
    conversationRuntime.pendingAck = true;
  }
  lastMessage.content += delta;
  queueSpeechFromStreamingText(lastMessage.content, settings);
  updateConversationSurface(root);
}

function queueSpeechFromStreamingText(fullText: string, settings: VoiceSettings): void {
  let pending = fullText.slice(speechRuntime.streamedSpokenText.length);
  let match = pending.match(/[\s\S]*?[.!?](?:\s|$)/);
  while (match) {
    const chunk = match[0].trim();
    if (chunk) {
      void enqueueSpeechChunk(chunk, settings);
      speechRuntime.streamedSpokenText += match[0];
    }
    pending = fullText.slice(speechRuntime.streamedSpokenText.length);
    match = pending.match(/[\s\S]*?[.!?](?:\s|$)/);
  }
}

async function flushStreamingSpeech(): Promise<void> {
  const lastMessage = conversationRuntime.messages[conversationRuntime.messages.length - 1];
  if (!lastMessage || lastMessage.role !== "assistant") {
    return;
  }
  const remaining = lastMessage.content.slice(speechRuntime.streamedSpokenText.length).trim();
  if (!remaining) {
    return;
  }
  const settings = speechRuntime.settings;
  if (settings) {
    await enqueueSpeechChunk(remaining, settings);
  }
  speechRuntime.streamedSpokenText = lastMessage.content;
}

function findStreamDelimiter(buffer: string): number {
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

function parseStreamEvent(rawEvent: string): { event: string; data: Record<string, unknown> } | undefined {
  const lines = rawEvent.split(/\r?\n/);
  const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
  const dataLines = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim());
  if (!event || dataLines.length === 0) {
    return undefined;
  }
  try {
    return {
      event,
      data: JSON.parse(dataLines.join("\n")) as Record<string, unknown>,
    };
  } catch {
    return undefined;
  }
}

async function startCameraPreview(root: HTMLElement): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraRuntime.status = "Camera API not supported in this browser.";
    attachCameraPreview(root);
    return;
  }
  if (cameraRuntime.stream) {
    cameraRuntime.status = "Camera already active.";
    attachCameraPreview(root);
    return;
  }
  try {
    cameraRuntime.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    cameraRuntime.active = true;
    cameraRuntime.status = "Camera live preview active.";
  } catch (error) {
    cameraRuntime.active = false;
    cameraRuntime.status = error instanceof Error ? error.message : "Camera start failed.";
  }
  attachCameraPreview(root);
}

function stopCameraPreview(root: HTMLElement): void {
  for (const track of cameraRuntime.stream?.getTracks() ?? []) {
    track.stop();
  }
  cameraRuntime.stream = undefined;
  cameraRuntime.active = false;
  cameraRuntime.status = "Camera stopped.";
  attachCameraPreview(root);
}

async function toggleFullscreen(root: HTMLElement): Promise<void> {
  const shell = root.querySelector<HTMLElement>(".client-shell") ?? root;
  const canvasShell = root.querySelector<HTMLElement>(".avatar-canvas-shell");
  const syncViewport = () => {
    syncDisplayModeUi(root);
    window.requestAnimationFrame(() => avatarViewport?.updateFromState());
    window.setTimeout(() => avatarViewport?.updateFromState(), 50);
  };
  if (displayModeRuntime.active) {
    displayModeRuntime.active = false;
    syncDisplayModeUi(root);
    syncViewport();
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    return;
  }

  if (canvasShell) {
    const rect = canvasShell.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      displayModeRuntime.previewWidth = rect.width;
      displayModeRuntime.previewHeight = rect.height;
    }
  }
  displayModeRuntime.active = true;
  syncDisplayModeUi(root);
  syncViewport();
  if (!document.fullscreenElement) {
    await shell.requestFullscreen();
  }
}

async function exitFullscreenOnly(root: HTMLElement): Promise<void> {
  displayModeRuntime.active = false;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  }
  syncDisplayModeUi(root);
}

async function applyDisplayInputMode(root: HTMLElement, mode: "wake_word" | "always_listening" | "typed"): Promise<void> {
  const response = await fetch("/client/runtime-settings", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-gail-device-id": "work-lite-client-1",
      "x-gail-device-type": "uconsole",
      "x-gail-mode": appState.mode,
      "x-gail-explicit-local-save": "false",
    },
    body: JSON.stringify({ displayInputMode: mode }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to set display input mode (${response.status}): ${message}`);
  }
  const settingsPayload = await response.json() as ClientRuntimeSettings;
  clientRuntimeSettings = settingsPayload;
  try {
    await fetch("/voice/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-gail-device-id": "work-lite-client-1",
        "x-gail-device-type": "uconsole",
        "x-gail-mode": appState.mode,
        "x-gail-explicit-local-save": "false",
      },
      body: JSON.stringify({ mode }),
    });
  } catch {
    // Keep display mode updates resilient even when voice patch fails.
  }
  conversationRuntime.status = `Display input mode set to ${mode}.`;
  updateConversationSurface(root);
  root.innerHTML = render();
  wireEvents(root);
  attachCameraPreview(root);
  await mountAvatarViewport(root);
}

async function requestRuntimeCloseProgram(root: HTMLElement): Promise<void> {
  try {
    const response = await fetch("/control/intents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gail-device-id": "work-lite-client-1",
        "x-gail-device-type": "uconsole",
        "x-gail-mode": appState.mode,
        "x-gail-explicit-local-save": "false",
      },
      body: JSON.stringify({ text: "close program", source: "typed", autoPlan: false }),
    });
    const payload = await response.json() as { summary?: string };
    conversationRuntime.status = payload.summary ?? "Close program command routed.";
    updateConversationSurface(root);
  } catch {
    conversationRuntime.status = "Close program routing failed. Use desktop Stop Gail shortcut.";
    updateConversationSurface(root);
  }
}

async function addFeatureRequestFromRuntime(root: HTMLElement): Promise<void> {
  const fallbackTitle = "Display runtime improvement";
  const title = window.prompt("Feature request title:", fallbackTitle)?.trim();
  if (!title) {
    return;
  }
  const details = window.prompt("Feature request details:", "Improve display/menu/operator flow.")?.trim();
  if (!details) {
    return;
  }
  try {
    await fetch("/backlog/features", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gail-device-id": "work-lite-client-1",
        "x-gail-device-type": "uconsole",
        "x-gail-mode": appState.mode,
        "x-gail-explicit-local-save": "false",
      },
      body: JSON.stringify({
        title,
        details,
        source: "typed",
        stageTarget: "next_round",
        priority: "normal",
        capturedBy: "work-lite-client",
      }),
    });
    conversationRuntime.status = `Feature request captured: ${title}`;
  } catch {
    conversationRuntime.status = "Feature request capture failed.";
  }
  updateConversationSurface(root);
}

async function createAvatarViewport(
  canvas: HTMLCanvasElement,
  status: HTMLDivElement,
): Promise<{ destroy: () => void; updateFromState: () => void }> {
  const playcanvasUrl = "/vendor/playcanvas/build/playcanvas.mjs";
  const pc: any = await import(playcanvasUrl);
  setRenderStatus(status, "PlayCanvas engine loaded");
  const app = new pc.Application(canvas, {
    graphicsDeviceOptions: {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: false,
    },
  });

  const defaultBaseFallbackPaths = [
    "/client-assets/gail/avatar/base_face/gail_base_avatar.glb",
    "/client-assets/gail/avatar/base_face/gail_base_avatar_fallback.glb",
  ];

  let camera: any;
  const resize = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    app.resizeCanvas(width, height);
    if (camera?.camera) {
      camera.camera.aspectRatioMode = pc.ASPECT_MANUAL;
      camera.camera.aspectRatio = width / Math.max(1, height);
    }
  };
  let syncSceneAfterResize = () => {};
  const resizeAndSync = () => {
    resize();
    syncSceneAfterResize();
  };

  app.setCanvasFillMode(pc.FILLMODE_NONE);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.start();
  resize();
  const deviceType = String(app.graphicsDevice?.deviceType ?? "unknown");
  setRenderStatus(status, `PlayCanvas engine loaded. Device ${deviceType}. Canvas ${canvas.clientWidth}x${canvas.clientHeight}`);
  app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);

  camera = new pc.Entity("camera");
  camera.addComponent("camera", {
    clearColor: new pc.Color(0.118, 0.118, 0.118, 1),
    fov: 45,
    nearClip: 0.1,
    farClip: 1000,
  });
  camera.setLocalPosition(appState.viewport.cameraX, appState.viewport.cameraY, appState.viewport.cameraZ);
  app.root.addChild(camera);
  camera.lookAt(appState.viewport.targetX, appState.viewport.targetY, appState.viewport.targetZ);

  const floor = new pc.Entity("stage-floor");
  floor.addComponent("render", {
    type: "plane",
    castShadows: true,
    castShadowsLightmap: true,
    receiveShadows: true,
    lightmapped: false,
    lightmapSizeMultiplier: 1,
  });
  floor.setLocalPosition(0, 0, 0);
  floor.setLocalEulerAngles(0, 0, 0);
  floor.setLocalScale(8, 1, 8);
  app.root.addChild(floor);

  const light = new pc.Entity("key-light");
  light.addComponent("light", {
    type: "directional",
    color: new pc.Color(1, 1, 1),
    intensity: 1,
    castShadows: true,
    shadowUpdateMode: 2,
    vsmBlurSize: 11,
    normalOffsetBias: 0.05,
    shadowBias: 0.2,
    shadowResolution: 1024,
    shadowDistance: 16,
  });
  light.setLocalPosition(-0.03046, 2.61912, 4.78987);
  light.setEulerAngles(91.7, -29.75, 180);
  app.root.addChild(light);

  const fill = new pc.Entity("fill-light");
  fill.addComponent("light", {
    type: "point",
    color: new pc.Color(1, 1, 1),
    intensity: 1,
    range: 8,
    castShadows: false,
  });
  fill.setLocalPosition(0.11058, 4.56518, -0.87433);
  fill.setEulerAngles(51.9718, 0, 0);
  app.root.addChild(fill);

  const canvasShell = canvas.parentElement instanceof HTMLElement ? canvas.parentElement : undefined;
  let backgroundSummary = "avatar_stage neutral background";
  if (canvasShell) {
    canvasShell.style.removeProperty('background-image');
    canvasShell.style.removeProperty('background-size');
    canvasShell.style.removeProperty('background-position');
    canvasShell.style.removeProperty('background-repeat');
  }

  const avatarStageRoot = new pc.Entity("avatar-stage-root");
  avatarStageRoot.setLocalPosition(appState.viewport.modelX, appState.viewport.modelY, appState.viewport.modelZ);
  avatarStageRoot.setLocalEulerAngles(
    appState.viewport.modelPitch,
    appState.viewport.modelYaw,
    appState.viewport.modelRoll,
  );
  app.root.addChild(avatarStageRoot);

  const avatarRoot = new pc.Entity("avatar-root");
  avatarRoot.setLocalPosition(0, 0, 0);
  avatarStageRoot.addChild(avatarRoot);

  const baseAvatarAsset = getPrimaryAsset("avatar");
  const runtimeProfile = getAvatarRuntimeProfile();
  const renderableModuleAssets = getAutoLoadAssets().filter((asset) =>
    inferAssetKind(asset) === "hair" || inferAssetKind(asset) === "clothing" || inferAssetKind(asset) === "accessory",
  );
  const flatTextureAsset = getAssetBySlot("texture", "flat_base");
  const baseAvatarPath = baseAvatarAsset ? getAssetPath(baseAvatarAsset) : undefined;
  const flatTexturePath = flatTextureAsset ? getAssetPath(flatTextureAsset) : undefined;
  const idleAnimationAsset = getAssetBySlot("animation", "idle");
  const talkAnimationAsset = getAssetBySlot("animation", "talk");
  const listenAnimationAsset = getAssetBySlot("animation", "listen");
  const ackAnimationAsset = getAssetBySlot("animation", "ack");
  const idleAnimationPath = idleAnimationAsset ? getAssetPath(idleAnimationAsset) : undefined;
  const talkAnimationPath = talkAnimationAsset ? getAssetPath(talkAnimationAsset) : undefined;
  const listenAnimationPath = listenAnimationAsset ? getAssetPath(listenAnimationAsset) : undefined;
  const ackAnimationPath = ackAnimationAsset ? getAssetPath(ackAnimationAsset) : undefined;
  let loadedModuleCount = 0;
  let avatarBoundsSummary = "avatar not loaded";
  let avatarRenderComponentCount = 0;
  let orientationSummary = "orientation pending";
  let talkStatusSummary = "speech idle";

  let framedPosition = { x: 0, y: 0, z: 0 };
  let framedScale = 1;
  let baseSkeletonRoot: any | undefined;
  let headBone: any | undefined;
  let neckBone: any | undefined;
  let speechMorphTargets: SpeechMorphTarget[] = [];
  let eyeMorphTargets: EyeMorphTarget[] = [];
  let eyelidRigNodes: EyelidRigNode[] = [];
  const avatarEntitiesForMaterialTuning: Array<{ entity: any; usage: TextureUsageKind }> = [];
  let importedFlatTexture: any | undefined;
  const importedTierTexturesByUsage: Partial<Record<TextureUsageKind, Map<string, any> | undefined>> = {};
  let talkAmount = 0;
  let talkClock = 0;
  let blinkCooldown = 0.45;
  let blinkPhase = 0;
  let blinkAmountCurrent = 0;
  let previousBlinkRate = appState.blinkRate;
  let animComponent: any | undefined;
  let activeAnimationState: "idle" | "talk" | "listen" | "ack" = "idle";
  let actionOneShotRemaining = 0;
  const animationTracks: Partial<Record<"idle" | "talk" | "listen" | "ack", any>> = {};

  const enableHandoffTierTextureImport = true;
  const useMeasuredBundleCamera = runtimeProfile.key === "handoff_20260330";
  const allowCrossAvatarFallback = runtimeProfile.key !== "handoff_20260330";
  if (runtimeProfile.key === "handoff_20260330" && enableHandoffTierTextureImport) {
    if (flatTexturePath) {
      try {
        importedFlatTexture = await loadTextureAsset(pc, app, flatTextureAsset?.name ?? "bundle flat texture", flatTexturePath);
      } catch (error) {
        console.warn("Flat texture import failed", error);
      }
    }
    try {
      const tierCache = new Map<QualityTier, Map<string, any> | undefined>();
      for (const tier of new Set<QualityTier>([
        getQualityTierForTextureUsage("body"),
        getQualityTierForTextureUsage("hair"),
        getQualityTierForTextureUsage("clothing"),
      ])) {
        tierCache.set(tier, await loadSelectedTextureTierSet(pc, app, runtimeManifest, tier));
      }
      importedTierTexturesByUsage.body = tierCache.get(getQualityTierForTextureUsage("body"));
      importedTierTexturesByUsage.hair = tierCache.get(getQualityTierForTextureUsage("hair"));
      importedTierTexturesByUsage.clothing = tierCache.get(getQualityTierForTextureUsage("clothing"));
      importedTierTexturesByUsage.accessories = importedTierTexturesByUsage.clothing;
    } catch (error) {
      console.warn("Tier texture import failed", error);
    }
  }

  if (baseAvatarPath && baseAvatarAsset) {
    const baseAvatarCandidatePaths = Array.from(new Set([
      baseAvatarPath,
      ...(allowCrossAvatarFallback ? defaultBaseFallbackPaths : []),
    ]));
    let baseAvatarEntity: any | undefined;
    let baseAvatarLoadError: unknown;
    for (let index = 0; index < baseAvatarCandidatePaths.length; index += 1) {
      const candidatePath = baseAvatarCandidatePaths[index];
      const attemptLabel = index === 0 ? baseAvatarAsset.name : `${baseAvatarAsset.name} fallback ${index}`;
      try {
        setRenderStatus(status, `Loading ${attemptLabel}...`);
        baseAvatarEntity = await loadContainerEntity(pc, app, attemptLabel, candidatePath, 180000);
        break;
      } catch (error) {
        baseAvatarLoadError = error;
        console.error(`Base avatar load attempt ${index + 1} failed`, { candidatePath, error });
      }
    }
    if (!baseAvatarEntity) {
      throw (baseAvatarLoadError instanceof Error
        ? baseAvatarLoadError
        : new Error("Base avatar failed to load from all candidates."));
    }
    disableEntityFrustumCulling(baseAvatarEntity);

    avatarRoot.addChild(baseAvatarEntity);
    avatarEntitiesForMaterialTuning.push({ entity: baseAvatarEntity, usage: "body" });
    loadedModuleCount += 1;
    softenEntityMaterials(pc, baseAvatarEntity, importedTierTexturesByUsage.body, importedFlatTexture, "body");
    const orientation = normalizeAvatarOrientation(baseAvatarEntity, runtimeProfile);
    orientationSummary = orientation.summary;

    avatarRenderComponentCount = countRenderComponents(baseAvatarEntity);
    baseSkeletonRoot = findSkeletonRoot(baseAvatarEntity, runtimeProfile);
    rebindEntityRenderRootBone(baseAvatarEntity, baseSkeletonRoot);
    const hipPosition = findEntityByName(baseAvatarEntity, "hip")?.getLocalPosition?.();
    headBone = findEntityByName(baseAvatarEntity, "head");
    neckBone = findEntityByName(baseAvatarEntity, "neckUpper") ?? findEntityByName(baseAvatarEntity, "neckLower");
    speechMorphTargets = collectSpeechMorphTargets(baseAvatarEntity);
    eyeMorphTargets = collectEyeMorphTargets(baseAvatarEntity);
    eyelidRigNodes = collectEyelidRigNodes(baseAvatarEntity);
    const baseBounds = measureRenderBounds(baseAvatarEntity);
    const bundleAlignment = {
      x: -(hipPosition?.x ?? 0),
      y: 0,
      z: -(hipPosition?.z ?? 0),
    };
    baseAvatarEntity.setLocalPosition(bundleAlignment.x, bundleAlignment.y, bundleAlignment.z);
    avatarBoundsSummary = `manual framing active bounds w${formatNumber(baseBounds.width)} h${formatNumber(baseBounds.height)} d${formatNumber(baseBounds.depth)}`;
    framedPosition = { x: 0, y: 0, z: 0 };
    framedScale = 1;
    if (useMeasuredBundleCamera) {
      applyAutoFitViewport(camera, measureRenderBounds(avatarRoot));
    } else {
      applyManualViewport(camera);
    }
    setRenderStatus(
      status,
      `Base avatar loaded. Render components: ${avatarRenderComponentCount}. ${orientation.summary}. ${avatarBoundsSummary}`,
    );

    for (const moduleAsset of renderableModuleAssets) {
      const assetPath = getAssetPath(moduleAsset);
      if (!assetPath) {
        continue;
      }

      try {
        setRenderStatus(status, `Loading ${moduleAsset.name}...`);
        const entity = await loadContainerEntity(pc, app, moduleAsset.name, assetPath, 120000);
        disableEntityFrustumCulling(entity);

        entity.setLocalEulerAngles(orientation.angles[0], orientation.angles[1], orientation.angles[2]);
        entity.setLocalPosition(bundleAlignment.x, bundleAlignment.y, bundleAlignment.z);
        avatarRoot.addChild(entity);
        const usage = inferAssetKind(moduleAsset) === "hair"
          ? "hair"
          : inferAssetKind(moduleAsset) === "accessory"
            ? "accessories"
            : "clothing";
        avatarEntitiesForMaterialTuning.push({ entity, usage });
        softenEntityMaterials(pc, entity, importedTierTexturesByUsage[usage], importedFlatTexture, usage);
        rebindEntityRenderRootBone(entity, baseSkeletonRoot);
        loadedModuleCount += 1;
      } catch (error) {
        console.error(`Module load failed: ${moduleAsset.name}`, error);
        if (runtimeProfile.key === "handoff_20260330" && allowCrossAvatarFallback) {
          const moduleKind = inferAssetKind(moduleAsset);
          const fallbackPaths = getFallbackModulePathsForKind(moduleKind);
          for (const fallbackPath of fallbackPaths) {
            try {
              setRenderStatus(status, `Loading fallback ${moduleKind ?? "module"}: ${fileNameFromPath(fallbackPath)}...`);
              const fallbackEntity = await loadContainerEntity(pc, app, `${moduleAsset.name} fallback`, fallbackPath, 120000);
              disableEntityFrustumCulling(fallbackEntity);
              fallbackEntity.setLocalEulerAngles(orientation.angles[0], orientation.angles[1], orientation.angles[2]);
              fallbackEntity.setLocalPosition(bundleAlignment.x, bundleAlignment.y, bundleAlignment.z);
              avatarRoot.addChild(fallbackEntity);
              const usage = moduleKind === "hair"
                ? "hair"
                : moduleKind === "accessory"
                  ? "accessories"
                  : "clothing";
              avatarEntitiesForMaterialTuning.push({ entity: fallbackEntity, usage });
              softenEntityMaterials(pc, fallbackEntity, importedTierTexturesByUsage[usage], importedFlatTexture, usage);
              rebindEntityRenderRootBone(fallbackEntity, baseSkeletonRoot);
              loadedModuleCount += 1;
            } catch (fallbackError) {
              console.error(`Fallback module load failed for ${moduleAsset.name}`, { fallbackPath, fallbackError });
            }
          }
        }
      }
    }

    avatarRenderComponentCount = countRenderComponents(avatarRoot);
    const loadAnimationTrack = async (
      asset: WorkLiteAssetStatus | undefined,
      assetPath: string | undefined,
      slot: "idle" | "talk" | "listen" | "ack",
    ): Promise<void> => {
      if (!asset || !assetPath) {
        return;
      }
      try {
        setRenderStatus(status, `Loading ${asset.name}...`);
        const containerAsset = await loadContainerAsset(pc, app, asset.name, assetPath, 6000);
        const trackAsset = containerAsset?.resource?.animations?.[0];
        const track = trackAsset?.resource;
        if (track) {
          animationTracks[slot] = track;
        } else {
          orientationSummary = `${orientationSummary}. ${slot} track missing`;
        }
      } catch (error) {
        orientationSummary = `${orientationSummary}. ${slot} load failed`;
        console.error(`${slot} animation load failed`, error);
      }
    };

    const enableBundleClipPlayback = Boolean(idleAnimationPath || talkAnimationPath || listenAnimationPath || ackAnimationPath);
    if (enableBundleClipPlayback) {
      await loadAnimationTrack(idleAnimationAsset, idleAnimationPath, "idle");
      await loadAnimationTrack(talkAnimationAsset, talkAnimationPath, "talk");
      await loadAnimationTrack(listenAnimationAsset, listenAnimationPath, "listen");
      await loadAnimationTrack(ackAnimationAsset, ackAnimationPath, "ack");

      const idleTrack = animationTracks.idle;
      if (idleTrack) {
        animationTracks.talk = animationTracks.talk ?? idleTrack;
        animationTracks.listen = animationTracks.listen ?? idleTrack;

        baseAvatarEntity.addComponent?.("anim", {
          activate: true,
          speed: 1,
        });
        animComponent = baseAvatarEntity.anim;
        if (animComponent) {
          animComponent.rootBone = baseSkeletonRoot ?? findEntityByName(baseAvatarEntity, "hip") ?? baseAvatarEntity;
          animComponent.assignAnimation("idle", animationTracks.idle);
          animComponent.assignAnimation("talk", animationTracks.talk);
          animComponent.assignAnimation("listen", animationTracks.listen);
          if (animationTracks.ack) {
            animComponent.assignAnimation("ack", animationTracks.ack);
          }
          activeAnimationState = "idle";
          animComponent.baseLayer?.play(activeAnimationState);
          animComponent.playing = true;
          animComponent.rebind?.();
          orientationSummary = `${orientationSummary}. clips idle/talk/listen${animationTracks.ack ? "/ack" : ""} ready`;
        } else {
          orientationSummary = `${orientationSummary}. anim component missing`;
        }
      } else {
        orientationSummary = `${orientationSummary}. idle track missing`;
      }
    } else {
      orientationSummary = `${orientationSummary}. no animation clips configured`;
    }
    mechanicsRuntime.moduleSummary = `${loadedModuleCount}/${1 + renderableModuleAssets.length} modules`;
    mechanicsRuntime.actionMapSummary = enableBundleClipPlayback
      ? [
        `idle:${animationTracks.idle ? "loaded" : "missing"}`,
        `talk:${animationTracks.talk === animationTracks.idle ? "fallback" : animationTracks.talk ? "loaded" : "missing"}`,
        `listen:${animationTracks.listen === animationTracks.idle ? "fallback" : animationTracks.listen ? "loaded" : "missing"}`,
        `ack:${animationTracks.ack ? "loaded" : "missing"}`,
      ].join(" | ")
      : "no animation clips configured";
    mechanicsRuntime.activeAction = activeAnimationState;
    if (useMeasuredBundleCamera) {
      applyAutoFitViewport(camera, measureRenderBounds(avatarRoot));
    } else {
      applyManualViewport(camera);
    }
    setRenderStatus(
      status,
      `Avatar modules loaded: ${loadedModuleCount}/${1 + renderableModuleAssets.length}. Render components: ${avatarRenderComponentCount}. ${orientation.summary}. ${avatarBoundsSummary}. ${backgroundSummary}`,
    );
  } else {
    mechanicsRuntime.moduleSummary = "0 modules";
    mechanicsRuntime.actionMapSummary = "idle:missing | talk:missing | listen:missing | ack:missing";
    mechanicsRuntime.activeAction = "idle";
    if (useMeasuredBundleCamera) {
      applyAutoFitViewport(camera, measureRenderBounds(avatarRoot));
    } else {
      applyManualViewport(camera);
    }
  }

  const updateSceneFromState = () => {
    resize();
    for (const entry of avatarEntitiesForMaterialTuning) {
      softenEntityMaterials(pc, entry.entity, importedTierTexturesByUsage[entry.usage], importedFlatTexture, entry.usage);
    }
    avatarStageRoot.setLocalEulerAngles(
      appState.viewport.modelPitch,
      appState.viewport.modelYaw,
      appState.viewport.modelRoll,
    );
    avatarStageRoot.setLocalPosition(
      appState.viewport.modelX,
      appState.viewport.modelY,
      appState.viewport.modelZ,
    );

    avatarRoot.setLocalEulerAngles(0, 0, 0);

    const liveScale = Math.max(0.01, appState.viewport.modelScaleMultiplier);
    const appliedScale = framedScale * liveScale;
    avatarRoot.setLocalScale(appliedScale, appliedScale, appliedScale);
    avatarRoot.setLocalPosition(framedPosition.x, framedPosition.y, framedPosition.z);

    const liveBounds = measureRenderBounds(avatarStageRoot);
    if (useMeasuredBundleCamera) {
      applyAutoFitViewport(camera, liveBounds);
    } else {
      applyManualViewport(camera);
    }
    setRenderStatus(
      status,
      `Avatar preview running. Device ${deviceType}. Modules ${loadedModuleCount}/${1 + renderableModuleAssets.length}. Avatar renders ${avatarRenderComponentCount}. ${orientationSummary}. ${avatarBoundsSummary}. stageCenter x${formatNumber(Number.isFinite(liveBounds.minX) ? (liveBounds.minX + liveBounds.maxX) * 0.5 : 0)} z${formatNumber(Number.isFinite(liveBounds.minZ) ? (liveBounds.minZ + liveBounds.maxZ) * 0.5 : 0)} floor ${formatNumber(Number.isFinite(liveBounds.minY) ? liveBounds.minY : 0)}. Canvas ${canvas.clientWidth}x${canvas.clientHeight}`,
    );
  };

  syncSceneAfterResize = updateSceneFromState;

  const worldLayer = app.scene.layers.getLayerById(pc.LAYERID_WORLD);
  const immediateLayer = app.scene.layers.getLayerById(pc.LAYERID_IMMEDIATE);
  const worldMeshCount = typeof worldLayer?.meshInstances?.length === "number" ? worldLayer.meshInstances.length : -1;
  const worldCameraCount = typeof worldLayer?.cameras?.length === "number" ? worldLayer.cameras.length : -1;
  const immediateCameraCount = typeof immediateLayer?.cameras?.length === "number" ? immediateLayer.cameras.length : -1;
  let latestRenderStats = "drawCalls 0 renderedCameras pending";
  app.on("postrender", () => {
    latestRenderStats = `drawCalls ${app.stats.drawCalls.total} renderedCameras ${app.stats.frame.cameras}`;
  });
  const postUpdateHandler = (dt: number) => {
    talkClock += dt;
    const desiredAnimationState: "idle" | "talk" | "listen" = speechRuntime.speaking
      ? "talk"
      : speechRuntime.listening
        ? "listen"
        : "idle";
    if (actionOneShotRemaining > 0) {
      actionOneShotRemaining = Math.max(0, actionOneShotRemaining - dt);
    }
    if (animComponent && conversationRuntime.pendingAck && animationTracks.ack && activeAnimationState !== "ack") {
      animComponent.baseLayer?.play("ack");
      activeAnimationState = "ack";
      actionOneShotRemaining = Math.max(0.45, Number(animationTracks.ack.duration ?? 0.65));
      conversationRuntime.pendingAck = false;
    } else if (animComponent && actionOneShotRemaining <= 0 && desiredAnimationState !== activeAnimationState) {
      animComponent.baseLayer?.play(desiredAnimationState);
      activeAnimationState = desiredAnimationState;
    }
    mechanicsRuntime.activeAction = activeAnimationState;

    const targetTalk = speechRuntime.speaking ? Math.max(0.18, speechRuntime.talkLevel) : 0;
    talkAmount += (targetTalk - talkAmount) * Math.min(1, dt * 10);
    const pulse = talkAmount > 0.001 ? (0.55 + 0.45 * Math.sin(talkClock * 18)) * talkAmount : 0;
    const aaPulse = talkAmount > 0.001 ? (0.5 + 0.5 * Math.sin(talkClock * 11)) * talkAmount : 0;
    const owPulse = talkAmount > 0.001 ? (0.5 + 0.5 * Math.sin(talkClock * 7 + 0.8)) * talkAmount : 0;
    const fallbackViseme = {
      mouthOpen: pulse * 0.053125,
      aa: aaPulse * 0.04375,
      ow: owPulse * 0.028125,
      ee: aaPulse * 0.03,
      ih: aaPulse * 0.024,
      fv: pulse * 0.018,
      l: pulse * 0.012,
      th: pulse * 0.012,
      m: Math.max(0, 0.02 - pulse * 0.03),
    };
    if (speechRuntime.speaking) {
      speechRuntime.visemeTarget = sampleSpeechVisemePlan(performance.now());
    } else {
      speechRuntime.visemeTarget = createZeroViseme();
    }
    const targetViseme = speechRuntime.speaking
      ? {
          mouthOpen: Math.max(fallbackViseme.mouthOpen * 0.45, speechRuntime.visemeTarget.mouthOpen),
          aa: Math.max(fallbackViseme.aa * 0.35, speechRuntime.visemeTarget.aa),
          ow: Math.max(fallbackViseme.ow * 0.35, speechRuntime.visemeTarget.ow),
          ee: Math.max(fallbackViseme.ee * 0.3, speechRuntime.visemeTarget.ee),
          ih: Math.max(fallbackViseme.ih * 0.3, speechRuntime.visemeTarget.ih),
          fv: Math.max(fallbackViseme.fv * 0.3, speechRuntime.visemeTarget.fv),
          l: Math.max(fallbackViseme.l * 0.3, speechRuntime.visemeTarget.l),
          th: Math.max(fallbackViseme.th * 0.3, speechRuntime.visemeTarget.th),
          m: Math.max(fallbackViseme.m, speechRuntime.visemeTarget.m),
        }
      : createZeroViseme();
    const visemeBlend = Math.min(1, dt * (10 * Math.max(0.5, appState.visemeSmoothing)));
    speechRuntime.visemeCurrent.mouthOpen += (targetViseme.mouthOpen - speechRuntime.visemeCurrent.mouthOpen) * visemeBlend;
    speechRuntime.visemeCurrent.aa += (targetViseme.aa - speechRuntime.visemeCurrent.aa) * visemeBlend;
    speechRuntime.visemeCurrent.ow += (targetViseme.ow - speechRuntime.visemeCurrent.ow) * visemeBlend;
    speechRuntime.visemeCurrent.ee += (targetViseme.ee - speechRuntime.visemeCurrent.ee) * visemeBlend;
    speechRuntime.visemeCurrent.ih += (targetViseme.ih - speechRuntime.visemeCurrent.ih) * visemeBlend;
    speechRuntime.visemeCurrent.fv += (targetViseme.fv - speechRuntime.visemeCurrent.fv) * visemeBlend;
    speechRuntime.visemeCurrent.l += (targetViseme.l - speechRuntime.visemeCurrent.l) * visemeBlend;
    speechRuntime.visemeCurrent.th += (targetViseme.th - speechRuntime.visemeCurrent.th) * visemeBlend;
    speechRuntime.visemeCurrent.m += (targetViseme.m - speechRuntime.visemeCurrent.m) * visemeBlend;
    for (const target of speechMorphTargets) {
      setMorphWeightIfPresent(target.instance, target.mouthOpen, speechRuntime.visemeCurrent.mouthOpen * appState.mouthMotionGain);
      setMorphWeightIfPresent(target.instance, target.aa, speechRuntime.visemeCurrent.aa * appState.mouthMotionGain);
      setMorphWeightIfPresent(target.instance, target.ow, speechRuntime.visemeCurrent.ow * appState.mouthMotionGain);
      setMorphWeightIfPresent(target.instance, target.ee, speechRuntime.visemeCurrent.ee * appState.mouthMotionGain);
      setMorphWeightIfPresent(target.instance, target.ih, speechRuntime.visemeCurrent.ih * appState.mouthMotionGain);
      setMorphWeightIfPresent(target.instance, target.fv, speechRuntime.visemeCurrent.fv * appState.mouthMotionGain);
      setMorphWeightIfPresent(target.instance, target.l, speechRuntime.visemeCurrent.l * appState.mouthMotionGain);
      setMorphWeightIfPresent(target.instance, target.th, speechRuntime.visemeCurrent.th * appState.mouthMotionGain);
      setMorphWeightIfPresent(target.instance, target.m, speechRuntime.visemeCurrent.m * appState.mouthMotionGain);
    }
    if (Math.abs(appState.blinkRate - previousBlinkRate) > 0.001) {
      previousBlinkRate = appState.blinkRate;
      blinkCooldown = Math.min(blinkCooldown, 0.2);
    }
    if (blinkPhase > 0) {
      blinkPhase = Math.min(1, blinkPhase + (dt / 0.22));
      if (blinkPhase >= 1) {
        blinkPhase = 0;
        blinkCooldown = getNextBlinkDelay(appState.blinkRate);
      }
    } else if (blinkCooldown > 0) {
      blinkCooldown = Math.max(0, blinkCooldown - dt);
    } else if (appState.blinkAmount > 0.001) {
      blinkPhase = Number.EPSILON;
    }
    const blinkPulse = blinkPhase > 0
      ? (blinkPhase < 0.5 ? blinkPhase / 0.5 : 1 - ((blinkPhase - 0.5) / 0.5))
      : 0;
    const targetBlinkAmount = Math.min(1, blinkPulse * appState.blinkAmount * 2.4);
    blinkAmountCurrent += (targetBlinkAmount - blinkAmountCurrent) * Math.min(1, dt * 30);
    for (const target of eyeMorphTargets) {
      setMorphWeights(target.instance, target.blinkLeft, blinkAmountCurrent);
      setMorphWeights(target.instance, target.blinkRight, blinkAmountCurrent);
      setMorphWeights(target.instance, target.squintLeft, blinkAmountCurrent * 0.35);
      setMorphWeights(target.instance, target.squintRight, blinkAmountCurrent * 0.35);
    }
    for (const eyelid of eyelidRigNodes) {
      const blinkTravel = Math.max(0.25, appState.blinkTravel);
      const yOffset = (eyelid.direction === "upper" ? -0.16 : 0.01) * blinkAmountCurrent * blinkTravel;
      const zOffset = (eyelid.direction === "upper" ? -0.03 : 0.004) * blinkAmountCurrent * blinkTravel;
      eyelid.entity.setLocalPosition(
        eyelid.basePosition.x,
        eyelid.basePosition.y + yOffset,
        eyelid.basePosition.z + zOffset,
      );
    }
    if (headBone?.getLocalEulerAngles) {
      const headAngles = headBone.getLocalEulerAngles();
      headBone.setLocalEulerAngles(pulse * 0.45, headAngles.y, pulse * 0.2);
    }
    if (neckBone?.getLocalEulerAngles) {
      const neckAngles = neckBone.getLocalEulerAngles();
      neckBone.setLocalEulerAngles(pulse * 0.275, neckAngles.y, 0);
    }
    talkStatusSummary = `speech ${desiredAnimationState} ${formatNumber(pulse)} viseme ${formatNumber(speechRuntime.visemeCurrent.mouthOpen)}/${formatNumber(speechRuntime.visemeCurrent.aa)}/${formatNumber(speechRuntime.visemeCurrent.ow)}/${formatNumber(speechRuntime.visemeCurrent.ee)}/${formatNumber(speechRuntime.visemeCurrent.fv)}/${formatNumber(speechRuntime.visemeCurrent.m)} blink ${formatNumber(blinkAmountCurrent)} morphs ${speechMorphTargets.length}/${eyeMorphTargets.length} lids ${eyelidRigNodes.length}`;
    updateRuntimeMechanicsSurface();
  };
  app.systems.on("postUpdate", postUpdateHandler);

  app.on("update", (dt: number) => {
    void dt;
    setRenderStatus(
      status,
      `Avatar preview running. Device ${deviceType}. Modules ${loadedModuleCount}/${1 + renderableModuleAssets.length}. Avatar renders ${avatarRenderComponentCount}. World mesh instances: ${worldMeshCount}. Layer cameras world/immediate: ${worldCameraCount}/${immediateCameraCount}. ${latestRenderStats}. ${orientationSummary}. ${avatarBoundsSummary}. ${talkStatusSummary}. Canvas ${canvas.clientWidth}x${canvas.clientHeight}`,
    );
  });
  updateSceneFromState();

  const resizeObserver = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(() => resizeAndSync())
    : undefined;
  resizeObserver?.observe(canvas);
  if (canvas.parentElement) {
    resizeObserver?.observe(canvas.parentElement);
  }
  window.addEventListener("resize", resizeAndSync);

  return {
    updateFromState: updateSceneFromState,
    destroy: () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resizeAndSync);
      app.systems.off("postUpdate", postUpdateHandler);
      app.destroy();
    },
  };
}

async function loadContainerEntity(
  pc: any,
  app: {
    assets: {
      add: (asset: unknown) => void;
      load: (asset: unknown) => void;
    };
  },
  name: string,
  url: string,
  timeoutMs = 30000,
): Promise<any> {
  const asset = new pc.Asset(name, "container", { url });
  app.assets.add(asset);

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutHandle);
      callback();
    };
    const timeoutHandle = window.setTimeout(() => {
      finish(() => reject(new Error(`Timed out loading container asset: ${name}`)));
    }, timeoutMs);
    asset.ready(() => finish(() => resolve()));
    asset.once("error", (error: unknown) => finish(() => reject(error)));
    app.assets.load(asset);
  });

  const entity = asset.resource.instantiateRenderEntity();
  entity.setLocalPosition(0, 0, 0);
  entity.setLocalScale(1, 1, 1);
  return entity;
}

async function loadContainerAsset(
  pc: any,
  app: {
    assets: {
      add: (asset: unknown) => void;
      load: (asset: unknown) => void;
    };
  },
  name: string,
  url: string,
  timeoutMs = 30000,
): Promise<any> {
  const asset = new pc.Asset(name, "container", { url });
  app.assets.add(asset);

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutHandle);
      callback();
    };
    const timeoutHandle = window.setTimeout(() => {
      finish(() => reject(new Error(`Timed out loading container asset: ${name}`)));
    }, timeoutMs);
    asset.ready(() => finish(() => resolve()));
    asset.once("error", (error: unknown) => finish(() => reject(error)));
    app.assets.load(asset);
  });

  return asset;
}

async function loadTextureAsset(
  pc: any,
  app: {
    assets: {
      add: (asset: unknown) => void;
      load: (asset: unknown) => void;
    };
  },
  name: string,
  url: string,
): Promise<any> {
  const asset = new pc.Asset(name, "texture", { url });
  app.assets.add(asset);

  await new Promise<void>((resolve, reject) => {
    asset.ready(() => resolve());
    asset.once("error", (error: unknown) => reject(error));
    app.assets.load(asset);
  });

  return asset.resource;
}

async function loadSelectedTextureTierSet(
  pc: any,
  app: {
    assets: {
      add: (asset: unknown) => void;
      load: (asset: unknown) => void;
    };
  },
  manifest: WorkLiteAssetManifest,
  qualityTier: QualityTier,
): Promise<Map<string, any> | undefined> {
  const tierDirectoryPath = manifest.textureTiers?.[qualityTier];
  const textureManifestPath = manifest.textureTiers?.manifest;
  if (!tierDirectoryPath || !textureManifestPath) {
    return undefined;
  }

  const tierDirectoryUrl = toClientAssetUrlFromResolvedPath(tierDirectoryPath);
  const textureManifestUrl = toClientAssetUrlFromResolvedPath(textureManifestPath);
  if (!tierDirectoryUrl || !textureManifestUrl) {
    return undefined;
  }

  const response = await fetch(textureManifestUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Texture manifest request failed with ${response.status}`);
  }

  const payload = await response.json() as {
    source_images?: Array<{ image?: string }>;
  };
  const sourceImages = payload.source_images ?? [];
  if (sourceImages.length === 0) {
    return undefined;
  }

  const textures = new Map<string, any>();
  await Promise.all(
    sourceImages
      .map((entry) => entry.image?.trim())
      .filter((entry): entry is string => Boolean(entry))
      .map(async (imageName) => {
        const candidateUrls = buildTextureTierCandidateUrls(tierDirectoryUrl, imageName);
        for (const textureUrl of candidateUrls) {
          try {
            const texture = await loadTextureAsset(pc, app, `${qualityTier}:${imageName}`, textureUrl);
            registerTierTexture(textures, imageName, texture);
            return;
          } catch {
            // Try next candidate path.
          }
        }
        console.warn(`Texture tier asset failed to load for ${imageName}`);
      }),
  );

  return textures.size > 0 ? textures : undefined;
}

function registerTierTexture(map: Map<string, any>, imageName: string, texture: any): void {
  const rawKey = normalizeTextureLookupKey(imageName);
  const trimmedExtensionKey = normalizeTextureLookupKey(imageName.replace(/\.[a-z0-9]+$/i, ""));
  if (rawKey) {
    map.set(rawKey, texture);
  }
  if (trimmedExtensionKey) {
    map.set(trimmedExtensionKey, texture);
  }
}

function buildTextureTierCandidateUrls(tierDirectoryUrl: string, imageName: string): string[] {
  const trimmed = imageName.trim();
  const lower = trimmed.toLowerCase();
  const hasExtension = /\.[a-z0-9]+$/i.test(trimmed);
  const candidates = new Set<string>();

  // Most manifests include a full filename (sometimes with spaces and multiple dots).
  candidates.add(`${tierDirectoryUrl}/${encodeURIComponent(trimmed)}`);

  // Backward compatibility for manifests that only provide stem names.
  if (!hasExtension) {
    candidates.add(`${tierDirectoryUrl}/${encodeURIComponent(`${trimmed}.png`)}`);
  }

  // Export pipeline commonly converts source images into .png while preserving source extension text.
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".tif") || lower.endsWith(".tiff") || lower.endsWith(".webp")) {
    candidates.add(`${tierDirectoryUrl}/${encodeURIComponent(`${trimmed}.png`)}`);
  }

  return Array.from(candidates);
}

function normalizeTextureLookupKey(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("\\", "/")
    .split("/")
    .pop()
    ?.replace(/\.png$/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") ?? "";
}

function normalizeAvatarOrientation(entity: {
  setLocalEulerAngles: (x: number, y: number, z: number) => void;
  findComponents: (type: string) => Array<{ meshInstances?: Array<{ aabb: { center: { x: number; y: number; z: number }; halfExtents: { x: number; y: number; z: number } } }> }>;
},
profile: AvatarRuntimeProfile,
): {
  angles: readonly [number, number, number];
  summary: string;
} {
  const correction = profile.key === "handoff_20260330"
    ? [0, 0, 0] as const
    : profile.orientationAngles;
  entity.setLocalEulerAngles(correction[0], correction[1], correction[2]);
  const bounds = measureRenderBounds(entity);
  return {
    angles: correction,
    summary: `${profile.key} rot(${correction.join(",")}) bounds w${formatNumber(bounds.width)} h${formatNumber(bounds.height)} d${formatNumber(bounds.depth)}` ,
  };
}

function getRuntimeBundleSignature(manifest: WorkLiteAssetManifest): string {
  const system = clientRuntimeSettings?.activeAvatarSystem ?? "unknown-system";
  const selectedRoot = manifest.selectedAssetRoot ?? "default-root";
  const bundleName = manifest.selectedBundleName ?? "default-bundle";
  const bodyPath = manifest.assets?.find((asset) => asset.id === "base_avatar")?.resolvedPath ?? "no-body";
  return [system, selectedRoot, bundleName, bodyPath].join("|");
}

function getViewportDefaultsForSystem(system: "legacy_fallback" | "handoff_20260330" | "gail_primary" | undefined) {
  void system;
  return {
    ...getBaseViewportDefaults(),
  };
}

function getQualityTierForTextureUsage(usage: TextureUsageKind | "environment"): QualityTier {
  switch (usage) {
    case "body":
      return appState.bodyQualityTier;
    case "hair":
      return appState.hairQualityTier;
    case "clothing":
    case "accessories":
      return appState.clothingQualityTier;
    case "environment":
    default:
      return appState.qualityTier;
  }
}



function frameAvatar(
  avatarRoot: {
    findComponents: (type: string) => Array<{ meshInstances?: Array<{ aabb: { center: { x: number; y: number; z: number }; halfExtents: { x: number; y: number; z: number } } }> }>;
    setLocalPosition: (x: number, y: number, z: number) => void;
    setLocalScale: (x: number, y: number, z: number) => void;
  },
  boundsSource?: {
    findComponents: (type: string) => Array<{ meshInstances?: Array<{ aabb: { center: { x: number; y: number; z: number }; halfExtents: { x: number; y: number; z: number } } }> }>;
  },
): {
  summary: string;
  position: { x: number; y: number; z: number };
  scale: number;
} {
  const bounds = measureRenderBounds(boundsSource ?? avatarRoot);
  if (!Number.isFinite(bounds.minX)) {
    avatarRoot.setLocalScale(1, 1, 1);
    avatarRoot.setLocalPosition(0, 0, 0);
    return {
      summary: "no finite bounds",
      position: { x: 0, y: 0, z: 0 },
      scale: 1,
    };
  }

  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const centerZ = (bounds.minZ + bounds.maxZ) * 0.5;
  const height = Math.max(0.001, bounds.height);
  const width = Math.max(0.001, bounds.width);
  const depth = Math.max(0.001, bounds.depth);
  // Export orientation can place the full body span on width or depth depending on rig axes.
  // Use the largest dimension to keep auto-framing stable across rotations.
  const dominantSpan = Math.max(height, width, depth);
  const targetHeight = 1.72;
  const scale = clamp(targetHeight / dominantSpan, 0.0005, 8);
  const position = {
    x: -centerX,
    y: -bounds.minY,
    z: -centerZ,
  };

  avatarRoot.setLocalScale(scale, scale, scale);
  avatarRoot.setLocalPosition(position.x, position.y, position.z);
  return {
    summary: `bounds w${formatNumber(width)} h${formatNumber(height)} d${formatNumber(depth)} dominant ${formatNumber(dominantSpan)} baseScale ${formatNumber(scale)}`,
    position,
    scale,
  };
}

function applyManualViewport(
  camera: {
    setLocalPosition: (x: number, y: number, z: number) => void;
    lookAt: (x: number, y: number, z: number) => void;
  },
  bounds?: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
    width: number;
    height: number;
    depth: number;
  },
): void {
  camera.setLocalPosition(
    appState.viewport.cameraX,
    appState.viewport.cameraY,
    appState.viewport.cameraZ,
  );
  camera.lookAt(
    appState.viewport.targetX,
    appState.viewport.targetY,
    appState.viewport.targetZ,
  );
}

function applyAutoFitViewport(
  camera: {
    setLocalPosition: (x: number, y: number, z: number) => void;
    lookAt: (x: number, y: number, z: number) => void;
    camera?: { fov?: number };
  },
  bounds: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
    width: number;
    height: number;
    depth: number;
  },
): void {
  if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.maxX)) {
    return;
  }
  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const centerY = (bounds.minY + bounds.maxY) * 0.5;
  const centerZ = (bounds.minZ + bounds.maxZ) * 0.5;
  const fovDeg = typeof camera.camera?.fov === "number" ? camera.camera.fov : 36;
  const fovRad = Math.max(0.2, (fovDeg * Math.PI) / 180);
  const halfW = bounds.width * 0.5;
  const halfH = bounds.height * 0.5;
  const halfD = bounds.depth * 0.5;
  const rawRadius = Math.max(0.6, Math.hypot(halfW, halfH, halfD));
  const radius = rawRadius;
  const distance = Math.max(1.8, (radius / Math.tan(fovRad * 0.5)) * 1.18);
  const targetY = centerY + bounds.height * 0.08;

  camera.setLocalPosition(centerX, targetY + bounds.height * 0.05, centerZ + distance);
  camera.lookAt(centerX, targetY, centerZ);
}

function orbitViewportFromDeltas(deltaX: number, deltaY: number): { cameraX: number; cameraY: number; cameraZ: number } {
  const offsetX = appState.viewport.cameraX - appState.viewport.targetX;
  const offsetY = appState.viewport.cameraY - appState.viewport.targetY;
  const offsetZ = appState.viewport.cameraZ - appState.viewport.targetZ;
  const radius = Math.max(0.4, Math.hypot(offsetX, offsetY, offsetZ));
  const yaw = Math.atan2(offsetX, offsetY) - deltaX * 0.01;
  const pitch = clamp(Math.atan2(offsetZ, Math.hypot(offsetX, offsetY)) - deltaY * 0.008, -1.35, 1.35);
  const planarRadius = Math.cos(pitch) * radius;
  return {
    cameraX: appState.viewport.targetX + Math.sin(yaw) * planarRadius,
    cameraY: appState.viewport.targetY + Math.cos(yaw) * planarRadius,
    cameraZ: appState.viewport.targetZ + Math.sin(pitch) * radius,
  };
}

function panViewportFromDeltas(deltaX: number, deltaY: number): { x: number; y: number; z: number } {
  const offsetX = appState.viewport.cameraX - appState.viewport.targetX;
  const offsetY = appState.viewport.cameraY - appState.viewport.targetY;
  const radius = Math.max(0.4, Math.hypot(offsetX, offsetY, appState.viewport.cameraZ - appState.viewport.targetZ));
  const yaw = Math.atan2(offsetX, offsetY);
  const panScale = radius * 0.0018;
  const rightX = Math.cos(yaw);
  const rightY = -Math.sin(yaw);
  return {
    x: (-deltaX * rightX + deltaY * 0) * panScale,
    y: (-deltaX * rightY + deltaY * 0) * panScale,
    z: deltaY * panScale,
  };
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
  width: number;
  height: number;
  depth: number;
} {
  const renderComponents = target.findComponents("render");
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const component of renderComponents) {
    for (const meshInstance of component.meshInstances ?? []) {
      const { center, halfExtents } = meshInstance.aabb;
      minX = Math.min(minX, center.x - halfExtents.x);
      minY = Math.min(minY, center.y - halfExtents.y);
      minZ = Math.min(minZ, center.z - halfExtents.z);
      maxX = Math.max(maxX, center.x + halfExtents.x);
      maxY = Math.max(maxY, center.y + halfExtents.y);
      maxZ = Math.max(maxZ, center.z + halfExtents.z);
    }
  }

  return {
    minX,
    minY,
    minZ,
    maxX,
    maxY,
    maxZ,
    width: Number.isFinite(minX) ? Math.max(0.001, maxX - minX) : 0,
    height: Number.isFinite(minY) ? Math.max(0.001, maxY - minY) : 0,
    depth: Number.isFinite(minZ) ? Math.max(0.001, maxZ - minZ) : 0,
  };
}

function disableEntityFrustumCulling(entity: any): void {
  if (!entity?.findComponents) {
    return;
  }
  for (const renderComponent of entity.findComponents("render") ?? []) {
    for (const meshInstance of renderComponent.meshInstances ?? []) {
      meshInstance.cull = false;
      meshInstance.visible = true;
    }
  }
}

function findEntityByName(entity: any, name: string): any | undefined {
  if (!entity) {
    return undefined;
  }
  if (entity.name === name) {
    return entity;
  }
  const children = entity.children ?? [];
  for (const child of children) {
    const match = findEntityByName(child, name);
    if (match) {
      return match;
    }
  }
  return undefined;
}

function findSkeletonRoot(entity: any, profile: AvatarRuntimeProfile): any | undefined {
  if (profile.key === "handoff_20260330") {
    const handoffHip = findEntityByName(entity, "hip");
    if (handoffHip) {
      return handoffHip;
    }
  }
  for (const hint of profile.skeletonRootHints) {
    const direct = findEntityByName(entity, hint);
    if (direct) {
      if (hint === "hip" && direct.parent) {
        return direct.parent;
      }
      return direct;
    }
  }
  return entity;
}

function rebindEntityRenderRootBone(entity: any, rootBone: any): void {
  if (!entity || !rootBone) {
    return;
  }

  for (const renderComponent of entity.findComponents?.("render") ?? []) {
    renderComponent.rootBone = rootBone;
  }
}

function softenEntityMaterials(
  pc: any,
  entity: any,
  importedTierTextures?: Map<string, any>,
  importedFlatTexture?: any,
  usage: TextureUsageKind = "body",
): void {
  const matteFactor = Math.max(0.5, appState.matteStrength * 1.8);
  const qualityTier = getQualityTierForTextureUsage(usage);
  const useImportedFlatTexture = usage === "body" && qualityTier === "low" && !importedTierTextures?.size && Boolean(importedFlatTexture);
  const skinMaterialPresets = new Map<string, {
    gloss?: number;
    metalness?: number;
    specularityFactor?: number;
    sheenGloss?: number;
    clearCoat?: number;
    clearCoatGloss?: number;
  }>([
    ["torso", { gloss: 0.08, metalness: 0, specularityFactor: 0.03, sheenGloss: 0.08, clearCoat: 0, clearCoatGloss: 0.06 }],
    ["face", { gloss: 0.06, metalness: 0, specularityFactor: 0.02, sheenGloss: 0.06, clearCoat: 0, clearCoatGloss: 0.04 }],
    ["ears", { gloss: 0.06, metalness: 0, specularityFactor: 0.02, sheenGloss: 0.06, clearCoat: 0, clearCoatGloss: 0.04 }],
    ["legs", { gloss: 0.08, metalness: 0, specularityFactor: 0.03, sheenGloss: 0.08, clearCoat: 0, clearCoatGloss: 0.06 }],
    ["eyesocket", { gloss: 0.05, metalness: 0, specularityFactor: 0.02, sheenGloss: 0.05, clearCoat: 0, clearCoatGloss: 0.04 }],
    ["arms", { gloss: 0.08, metalness: 0, specularityFactor: 0.03, sheenGloss: 0.08, clearCoat: 0, clearCoatGloss: 0.06 }],
    ["lips", { gloss: 0.14, metalness: 0, specularityFactor: 0.08, sheenGloss: 0.12, clearCoat: 0, clearCoatGloss: 0.08 }],
    ["mouth", { gloss: 0.12, metalness: 0, specularityFactor: 0.06, sheenGloss: 0.1, clearCoat: 0, clearCoatGloss: 0.08 }],
  ]);
  const loggedMaterials = new Set<string>();
  for (const renderComponent of entity.findComponents?.("render") ?? []) {
    for (const meshInstance of renderComponent.meshInstances ?? []) {
      const material = meshInstance.material;
      if (!material) {
        continue;
      }
      const sourceMaterial = (material as any).__gailBaseMaterial ?? material;
      const tuned = sourceMaterial.clone?.() ?? sourceMaterial;
      const materialLabel = String(tuned.name ?? meshInstance.node?.name ?? "").trim();
      const materialName = materialLabel.toLowerCase();
      if (materialLabel && !loggedMaterials.has(materialLabel)) {
        loggedMaterials.add(materialLabel);
        console.info(`Avatar material detected: ${materialLabel}`);
      }
      const skinPreset = skinMaterialPresets.get(materialName);
      const isEyelashLike = materialName === "eyelashes";
      const isEyeSurfaceLike = materialName === "tear" || materialName === "eyemoisture" || materialName === "cornea";
      if ("glossTint" in tuned) {
        tuned.glossTint = true;
      }
      if ("metalnessTint" in tuned) {
        tuned.metalnessTint = true;
      }
      if ("specularityFactorTint" in tuned) {
        tuned.specularityFactorTint = true;
      }
      applyImportedTextureTier(tuned, importedTierTextures);
      if (skinPreset) {
        if (useImportedFlatTexture) {
          if ("diffuseMap" in tuned) {
            tuned.diffuseMap = importedFlatTexture;
          }
          if ("diffuse" in tuned && pc?.Color) {
            tuned.diffuse = new pc.Color(1, 1, 1);
          }
          if ("emissiveMap" in tuned) {
            tuned.emissiveMap = null;
          }
          if ("normalMap" in tuned) {
            tuned.normalMap = null;
          }
          if ("glossMap" in tuned) {
            tuned.glossMap = null;
          }
          if ("metalnessMap" in tuned) {
            tuned.metalnessMap = null;
          }
          if ("specularMap" in tuned) {
            tuned.specularMap = null;
          }
          if ("specularityFactorMap" in tuned) {
            tuned.specularityFactorMap = null;
          }
          if ("aoMap" in tuned) {
            tuned.aoMap = null;
          }
        }
        if (typeof tuned.gloss === "number" && typeof skinPreset.gloss === "number") {
          tuned.gloss = Math.min(tuned.gloss, skinPreset.gloss / (matteFactor * 1.2));
        }
        if (typeof tuned.metalness === "number" && typeof skinPreset.metalness === "number") {
          tuned.metalness = skinPreset.metalness;
        }
        if (typeof tuned.specularityFactor === "number" && typeof skinPreset.specularityFactor === "number") {
          tuned.specularityFactor = Math.min(tuned.specularityFactor, skinPreset.specularityFactor / (matteFactor * 1.6));
        }
        if (typeof tuned.sheenGloss === "number" && typeof skinPreset.sheenGloss === "number") {
          tuned.sheenGloss = Math.min(tuned.sheenGloss, skinPreset.sheenGloss / (matteFactor * 1.2));
        }
        if (typeof tuned.clearCoatGloss === "number" && typeof skinPreset.clearCoatGloss === "number") {
          tuned.clearCoatGloss = Math.min(tuned.clearCoatGloss, skinPreset.clearCoatGloss / (matteFactor * 1.5));
        }
        if (typeof tuned.clearCoat === "number" && typeof skinPreset.clearCoat === "number") {
          tuned.clearCoat = Math.min(tuned.clearCoat, skinPreset.clearCoat);
        }
      } else {
        if (typeof tuned.gloss === "number") {
          tuned.gloss *= 0.62 / (matteFactor * 1.1);
        }
        if (typeof tuned.metalness === "number") {
          tuned.metalness *= 0.45;
        }
        if (typeof tuned.specularityFactor === "number") {
          tuned.specularityFactor *= 0.65 / (matteFactor * 1.25);
        }
      }
      if (qualityTier === "medium") {
        if ("glossMap" in tuned) {
          tuned.glossMap = null;
        }
        if ("metalnessMap" in tuned) {
          tuned.metalnessMap = null;
        }
        if ("specularMap" in tuned) {
          tuned.specularMap = null;
        }
        if ("specularityFactorMap" in tuned) {
          tuned.specularityFactorMap = null;
        }
      }
      if (qualityTier === "low") {
        if ("normalMap" in tuned) {
          tuned.normalMap = null;
        }
        if ("glossMap" in tuned) {
          tuned.glossMap = null;
        }
        if ("metalnessMap" in tuned) {
          tuned.metalnessMap = null;
        }
        if ("specularMap" in tuned) {
          tuned.specularMap = null;
        }
        if ("specularityFactorMap" in tuned) {
          tuned.specularityFactorMap = null;
        }
        if ("aoMap" in tuned) {
          tuned.aoMap = null;
        }
      }
      if (isEyelashLike) {
        if (typeof tuned.gloss === "number") {
          tuned.gloss = Math.min(tuned.gloss, 0.01);
        }
        if (typeof tuned.metalness === "number") {
          tuned.metalness = 0;
        }
        if (typeof tuned.specularityFactor === "number") {
          tuned.specularityFactor = Math.min(tuned.specularityFactor, 0.005);
        }
        if (typeof tuned.clearCoat === "number") {
          tuned.clearCoat = 0;
        }
        if (typeof tuned.clearCoatGloss === "number") {
          tuned.clearCoatGloss = Math.min(tuned.clearCoatGloss, 0.01);
        }
        if (typeof tuned.opacity === "number") {
          tuned.opacity = 0.24;
        }
        if ("blendType" in tuned) {
          tuned.blendType = pc.BLEND_NORMAL;
        }
        if (typeof tuned.alphaTest === "number") {
          tuned.alphaTest = 0.08;
        }
        if ("opacityMapChannel" in tuned && typeof tuned.opacityMapChannel === "string") {
          tuned.opacityMapChannel = "a";
        }
        if ("depthWrite" in tuned) {
          tuned.depthWrite = false;
        }
        if ("opacityFadesSpecular" in tuned) {
          tuned.opacityFadesSpecular = true;
        }
        if ("alphaToCoverage" in tuned) {
          tuned.alphaToCoverage = false;
        }
        if ("twoSidedLighting" in tuned) {
          tuned.twoSidedLighting = true;
        }
        if ("cull" in tuned) {
          tuned.cull = pc.CULLFACE_NONE;
        }
      }
      if (isEyeSurfaceLike) {
        if (typeof tuned.gloss === "number") {
          tuned.gloss = Math.min(tuned.gloss, 0.06);
        }
        if (typeof tuned.metalness === "number") {
          tuned.metalness = 0;
        }
        if (typeof tuned.specularityFactor === "number") {
          tuned.specularityFactor = Math.min(tuned.specularityFactor, 0.08);
        }
        if (typeof tuned.clearCoat === "number") {
          tuned.clearCoat = 0;
        }
        if (typeof tuned.clearCoatGloss === "number") {
          tuned.clearCoatGloss = Math.min(tuned.clearCoatGloss, 0.04);
        }
        if (typeof tuned.opacity === "number") {
          tuned.opacity = materialName === "tear" ? 0.14 : 0.06;
        }
        if ("blendType" in tuned) {
          tuned.blendType = pc.BLEND_NORMAL;
        }
        if ("depthWrite" in tuned) {
          tuned.depthWrite = true;
        }
        if ("depthTest" in tuned) {
          tuned.depthTest = true;
        }
        if ("opacityFadesSpecular" in tuned) {
          tuned.opacityFadesSpecular = true;
        }
        if ("twoSidedLighting" in tuned) {
          tuned.twoSidedLighting = true;
        }
      }
      const enforceMatteLook = (usage === "body" || usage === "clothing" || usage === "hair") && !isEyelashLike && !isEyeSurfaceLike;
      if (enforceMatteLook) {
        const matteGlossCap = clamp(0.02 / matteFactor, 0.0025, 0.018);
        const matteSpecCap = clamp(0.035 / matteFactor, 0.0035, 0.028);
        const matteClearCoatGlossCap = clamp(0.016 / matteFactor, 0.0025, 0.016);
        if (typeof tuned.gloss === "number") {
          tuned.gloss = Math.min(tuned.gloss, matteGlossCap);
        }
        if (typeof tuned.metalness === "number") {
          tuned.metalness = 0;
        }
        if (typeof tuned.specularityFactor === "number") {
          tuned.specularityFactor = Math.min(tuned.specularityFactor, matteSpecCap);
        }
        if (typeof tuned.clearCoat === "number") {
          tuned.clearCoat = 0;
        }
        if (typeof tuned.clearCoatGloss === "number") {
          tuned.clearCoatGloss = Math.min(tuned.clearCoatGloss, matteClearCoatGlossCap);
        }
        if ("glossMap" in tuned) {
          tuned.glossMap = null;
        }
        if ("metalnessMap" in tuned) {
          tuned.metalnessMap = null;
        }
        if ("specularMap" in tuned) {
          tuned.specularMap = null;
        }
        if ("specularityFactorMap" in tuned) {
          tuned.specularityFactorMap = null;
        }
      }
      if (typeof tuned.update === "function") {
        tuned.update();
      }
      (tuned as any).__gailSoftenedMaterial = true;
      (tuned as any).__gailBaseMaterial = sourceMaterial;
      meshInstance.material = tuned;
    }
  }
}

function applyImportedTextureTier(material: any, importedTierTextures?: Map<string, any>): void {
  if (!importedTierTextures?.size) {
    return;
  }

  for (const propertyName of [
    "diffuseMap",
    "normalMap",
    "glossMap",
    "metalnessMap",
    "specularMap",
    "specularityFactorMap",
    "aoMap",
    "emissiveMap",
  ]) {
    const currentTexture = material[propertyName];
    if (!currentTexture) {
      continue;
    }
    const replacement = resolveImportedTexture(currentTexture, importedTierTextures);
    if (replacement) {
      material[propertyName] = replacement;
    }
  }
}

function resolveImportedTexture(texture: any, importedTierTextures: Map<string, any>): any | undefined {
  const candidates = [
    texture?.name,
    texture?.label,
    texture?.resource?.name,
    texture?.texture?.name,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => normalizeTextureLookupKey(value));

  for (const candidate of candidates) {
    const direct = importedTierTextures.get(candidate);
    if (direct) {
      return direct;
    }
  }

  return undefined;
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
      });
    }
  }
  return targets;
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

function countRenderComponents(avatarRoot: {
  findComponents: (type: string) => Array<unknown>;
}): number {
  return avatarRoot.findComponents("render").length;
}

function mountDiagnosticOverlay(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const draw = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(ratio, ratio);

    context.clearRect(0, 0, width, height);

    context.strokeStyle = "rgba(255, 255, 255, 0.35)";
    context.lineWidth = 2;
    context.strokeRect(12, 12, width - 24, height - 24);

    context.fillStyle = "rgba(255, 255, 255, 0.88)";
    context.font = '600 14px "Trebuchet MS", "Segoe UI", sans-serif';
    context.fillText("SCREEN FRAME", width - 120, 30);
  };

  draw();
  window.addEventListener("resize", draw, { passive: true });
}

function addEntityMeshesToLayer(
  layer: {
    addMeshInstances?: (meshInstances: unknown[]) => void;
  } | undefined,
  entity: {
    findComponents: (type: string) => Array<{ meshInstances?: unknown[] }>;
  },
): void {
  if (!layer?.addMeshInstances) {
    return;
  }

  for (const component of entity.findComponents("render")) {
    if (component.meshInstances && component.meshInstances.length > 0) {
      layer.addMeshInstances(component.meshInstances);
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : "nan";
}

function getAssets(): WorkLiteAssetStatus[] {
  return runtimeManifest.assets ?? [];
}

function inferAssetKind(asset: WorkLiteAssetStatus): WorkLiteAssetStatus["kind"] | undefined {
  if (asset.kind) {
    return asset.kind;
  }

  const key = normalizeAssetKey(asset.name);
  if (key.includes("base_avatar") || key === "base_avatar_glb") return "avatar";
  if (key.includes("hair")) return "hair";
  if (key.includes("background")) return "background";
  if (key.includes("animation") || key.includes("idle")) return "animation";
  if (key.includes("bracelet") || key.includes("accessor")) return "accessory";
  if (key.includes("vest") || key.includes("pants") || key.includes("boots") || key.includes("clothes")) return "clothing";
  return undefined;
}

function getAssetKey(asset: WorkLiteAssetStatus): string {
  return ((asset as any).id as string | undefined) ?? normalizeAssetKey(asset.name);
}

function getAssetPath(asset: WorkLiteAssetStatus): string | undefined {
  return findAssetPathById(getAssetKey(asset)) ?? findAssetPathByName(asset.name);
}

function getFallbackModulePathsForKind(kind: WorkLiteAssetStatus["kind"] | undefined): string[] {
  if (kind === "hair") {
    return [
      "/client-assets/gail/hair/meili_hair/meili_hair.glb",
    ];
  }
  if (kind === "clothing") {
    return [
      "/client-assets/gail/clothes/urban_action_vest/urban_action_vest.glb",
      "/client-assets/gail/clothes/urban_action_pants/urban_action_pants.glb",
      "/client-assets/gail/clothes/urban_action_boots/urban_action_boots.glb",
    ];
  }
  if (kind === "accessory") {
    return [
      "/client-assets/gail/accessories/gail_bundle/gail_accessories.glb",
      "/client-assets/gail/accessories/urban_action_bracelets/urban_action_bracelets.glb",
    ];
  }
  return [];
}

function getAutoLoadAssets(): WorkLiteAssetStatus[] {
  const runtimeProfile = getAvatarRuntimeProfile();
  const assets = getAssets();
  const privateSwitchKinds = new Set<NonNullable<WorkLiteAssetStatus["kind"]>>([
    "avatar",
    "hair",
    "clothing",
    "accessory",
  ]);
  const availablePrivateKinds = new Set<NonNullable<WorkLiteAssetStatus["kind"]>>();

  for (const candidate of assets) {
    if (!candidate.present || candidate.autoLoad === false) {
      continue;
    }
    const candidateKind = inferAssetKind(candidate);
    if (!candidateKind || !privateSwitchKinds.has(candidateKind)) {
      continue;
    }
    const candidateKey = getAssetKey(candidate);
    if (candidateKey.startsWith("private_")) {
      availablePrivateKinds.add(candidateKind);
    }
  }

  return assets.filter((asset) => {
    if (!asset.present) {
      return false;
    }
    if (asset.autoLoad === false) {
      return false;
    }
    const kind = inferAssetKind(asset);
    if (!kind || kind === "background") {
      return false;
    }
    if (privateSwitchKinds.has(kind)) {
      const key = getAssetKey(asset);
      const isPrivateAsset = key.startsWith("private_");
      if (appState.mode === "private") {
        if (isPrivateAsset) {
          return true;
        }
        return !availablePrivateKinds.has(kind);
      }
      if (isPrivateAsset) {
        return false;
      }
    }
    return true;
  });
}

function getPrimaryAsset(kind: WorkLiteAssetStatus["kind"]): WorkLiteAssetStatus | undefined {
  return getAutoLoadAssets().find((asset) => inferAssetKind(asset) === kind);
}

function getAssetBySlot(
  kind: WorkLiteAssetStatus["kind"],
  slot: string,
): WorkLiteAssetStatus | undefined {
  return getAssets().find((asset) => asset.present && inferAssetKind(asset) === kind && asset.slot === slot);
}

async function loadManifest(assetRoot?: string): Promise<WorkLiteAssetManifest> {
  try {
    const query = assetRoot ? `?assetRoot=${encodeURIComponent(assetRoot)}` : "";
    const response = await fetch(`/client/asset-manifest${query}`);
    if (!response.ok) {
      return workLiteAssetManifest;
    }

    const manifest = await response.json() as WorkLiteAssetManifest;
    mechanicsRuntime.assetRoot = manifest.selectedBundleName
      ? `${manifest.selectedAssetRoot ?? "default catalog"} (${manifest.selectedBundleName})`
      : manifest.selectedAssetRoot ?? "default catalog";
    return manifest;
  } catch {
    mechanicsRuntime.assetRoot = assetRoot ?? "default catalog";
    return workLiteAssetManifest;
  }
}

async function loadClientRuntimeSettings(): Promise<ClientRuntimeSettings | undefined> {
  try {
    const response = await fetch("/client/runtime-settings");
    if (!response.ok) {
      return DEFAULT_RUNTIME_SETTINGS;
    }
    const loaded = await response.json() as ClientRuntimeSettings;
    if (loaded.activeAvatarSystem === "legacy_fallback") {
      return {
        ...loaded,
        activeAvatarSystem: "gail_primary",
        activeAssetRoot: loaded.activeAssetRoot ?? "gail",
      };
    }
    return loaded;
  } catch {
    return DEFAULT_RUNTIME_SETTINGS;
  }
}

function getEffectiveAssetRoot(): string | undefined {
  if (appState.assetRootMode === "custom" && appState.assetRoot) {
    return appState.assetRoot;
  }
  return clientRuntimeSettings?.activeAssetRoot;
}

function isAvatarTweakModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("tweak_avatar") === "1";
  } catch {
    return false;
  }
}

function isHandoffViewportLocked(): boolean {
  if (appState.assetRootMode !== "server") {
    return false;
  }
  if (clientRuntimeSettings?.activeAvatarSystem === "handoff_20260330") {
    return true;
  }
  if (runtimeManifest.selectedBundleName === "playcanvas_handoff_20260330") {
    return true;
  }
  const selectedRoot = runtimeManifest.selectedAssetRoot ?? "";
  return selectedRoot.includes("handoffs/playcanvas_handoff_20260330");
}

function applyServerAvatarSystemDefaultsIfNeeded(): void {
  if (appState.mode === "work") {
    if (isWorkViewportInvalid()) {
      appState.viewport = {
        ...getViewportDefaultsForSystem(clientRuntimeSettings?.activeAvatarSystem ?? "gail_primary"),
      };
      persistClientPreferences(appState);
    }
    return;
  }
  const activeServerSystem = clientRuntimeSettings?.activeAvatarSystem;
  if (!activeServerSystem || appState.assetRootMode !== "server") {
    return;
  }
  if (appState.lastServerAvatarSystem === activeServerSystem) {
    return;
  }
  appState.viewport = {
    ...getViewportDefaultsForSystem(activeServerSystem),
  };
  appState.lastServerAvatarSystem = activeServerSystem;
  persistClientPreferences(appState);
}

function applyRuntimeBundleViewportDefaultsIfNeeded(): void {
  if (isAvatarTweakModeEnabled()) {
    return;
  }
  const activeRoot = runtimeManifest.selectedAssetRoot ?? "";
  const isHandoffBundleActive = activeRoot.includes("handoffs/playcanvas_handoff_20260330");
  const nextSignature = getRuntimeBundleSignature(runtimeManifest);

  if (appState.mode === "work") {
    if (isWorkViewportInvalid()) {
      appState.viewport = {
        ...getViewportDefaultsForSystem(clientRuntimeSettings?.activeAvatarSystem ?? "gail_primary"),
      };
      persistClientPreferences(appState);
      appState.lastViewportBundleSignature = nextSignature;
      return;
    }
    if (appState.assetRootMode === "server" && isHandoffBundleActive) {
      // Handoff rigs are exported with explicit framing targets. Always lock the work
      // viewport to those defaults so stale saved camera states cannot flatten/miniaturize
      // the avatar during startup.
      appState.viewport = {
        ...getViewportDefaultsForSystem(clientRuntimeSettings?.activeAvatarSystem ?? "handoff_20260330"),
      };
      appState.lastViewportBundleSignature = nextSignature;
      persistClientPreferences(appState);
    }
    return;
  }
  if (appState.assetRootMode !== "server") {
    return;
  }
  if (isGailCatalogBaseActive()) {
    appState.lastViewportBundleSignature = getRuntimeBundleSignature(runtimeManifest);
    persistClientPreferences(appState);
    return;
  }
  if (activeRoot.includes("handoffs/playcanvas_handoff_20260330")) {
    appState.viewport = {
      ...getViewportDefaultsForSystem(clientRuntimeSettings?.activeAvatarSystem),
    };
    appState.lastViewportBundleSignature = nextSignature;
    persistClientPreferences(appState);
    return;
  }
  const shouldResetForBundleChange = appState.lastViewportBundleSignature !== nextSignature;
  const shouldResetForLegacyScale = !shouldResetForBundleChange && shouldResetViewportForCurrentBundle();
  if (!shouldResetForBundleChange && !shouldResetForLegacyScale) {
    return;
  }
  appState.viewport = {
    ...getViewportDefaultsForSystem(clientRuntimeSettings?.activeAvatarSystem),
  };
  appState.lastViewportBundleSignature = nextSignature;
  persistClientPreferences(appState);
}

function shouldResetViewportForCurrentBundle(): boolean {
  const runtimeProfile = runtimeManifest.runtimeProfile;
  if (!runtimeProfile?.viewportDefaults) {
    return false;
  }
  const defaults = runtimeProfile.viewportDefaults;
  const cameraOffsetX = appState.viewport.cameraX - appState.viewport.targetX;
  const cameraOffsetY = appState.viewport.cameraY - appState.viewport.targetY;
  const cameraOffsetZ = appState.viewport.cameraZ - appState.viewport.targetZ;
  const cameraDistance = Math.hypot(cameraOffsetX, cameraOffsetY, cameraOffsetZ);

  if ((defaults.modelScaleMultiplier ?? 1) >= 0.5 && appState.viewport.modelScaleMultiplier < 0.25) {
    return true;
  }
  if ((defaults.modelScaleMultiplier ?? 1) >= 0.5 && appState.viewport.modelScaleMultiplier > 3) {
    return true;
  }
  if (Math.abs(appState.viewport.modelX) > 8 || Math.abs(appState.viewport.modelY) > 8) {
    return true;
  }
  if (appState.viewport.modelZ < -4 || appState.viewport.modelZ > 10) {
    return true;
  }
  if ((defaults.cameraY ?? 0) <= 15 && appState.viewport.cameraY > 20) {
    return true;
  }
  if ((defaults.cameraZ ?? 0) <= 6 && appState.viewport.cameraZ > 12) {
    return true;
  }
  if (cameraDistance < 1.2 || cameraDistance > 40) {
    return true;
  }
  if ((defaults.targetZ ?? 0) <= 6 && appState.viewport.targetZ > 12) {
    return true;
  }
  return false;
}

function isWorkViewportInvalid(): boolean {
  if (appState.viewport.modelScaleMultiplier < 0.2 || appState.viewport.modelScaleMultiplier > 4) {
    return true;
  }
  if (Math.abs(appState.viewport.modelX) > 8 || Math.abs(appState.viewport.modelY) > 8) {
    return true;
  }
  if (appState.viewport.modelZ < -4 || appState.viewport.modelZ > 10) {
    return true;
  }
  if (appState.viewport.cameraY > 20 || appState.viewport.cameraZ > 12) {
    return true;
  }
  return false;
}

function findAssetPathById(id: string): string | undefined {
  if (!id) {
    return undefined;
  }
  const asset = runtimeManifest.assets?.find((entry) => (entry as any).id === id || normalizeAssetKey(entry.name) === id);
  return toClientAssetUrlFromResolvedPath(asset?.resolvedPath);
}

function toDisplayAssetPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function findAssetPathByName(name: string): string | undefined {
  const asset = runtimeManifest.assets?.find((entry) => normalizeAssetKey(entry.name) === normalizeAssetKey(name));
  return toClientAssetUrlFromResolvedPath(asset?.resolvedPath);
}

function toClientAssetUrlFromResolvedPath(path: string | undefined): string | undefined {
  if (!path) {
    return undefined;
  }

  const marker = `${["playcanvas-app", "assets"].join("/")}/`;
  const normalized = path.replaceAll("\\", "/");
  const index = normalized.indexOf(marker);
  if (index < 0) {
    return undefined;
  }

  return `/client-assets/${normalized.slice(index + marker.length)}`;
}

function normalizeAssetKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function fileNameFromPath(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  const segments = normalized.split("/");
  return segments[segments.length - 1] ?? path;
}

function resolveBackgroundForMode(mode: Mode): string | undefined {
  if (mode === "private") {
    return findAssetPathById("private_background")
      ?? findAssetPathByName("private background")
      ?? findAnyBackgroundAssetPath();
  }

  return findAssetPathById("work_background")
    ?? findAssetPathByName("work background")
    ?? findAnyBackgroundAssetPath();
}

function findAnyBackgroundAssetPath(): string | undefined {
  const entry = getAssets().find((asset) => asset.present && inferAssetKind(asset) === "background");
  return entry ? getAssetPath(entry) : undefined;
}

function renderOption(value: string, current: string): string {
  const selected = value === current ? " selected" : "";
  return `<option value="${value}"${selected}>${value}</option>`;
}

function renderConversationSessionLabel(
  session: { id: string; title?: string; updatedAt?: string; messageCount: number },
): string {
  const label = session.title?.trim() || session.id;
  const updated = session.updatedAt ? new Date(session.updatedAt).toLocaleString() : "unknown time";
  return `${label} | ${session.messageCount} msgs | ${updated}`;
}

function renderVoiceOptions(values: string[], current: string): string {
  return values.map((value) => renderOption(value, current)).join("");
}

function renderBrowserVoiceOptions(current?: string): string {
  if (!("speechSynthesis" in window)) {
    return "";
  }
  const voices = window.speechSynthesis.getVoices()
    .slice()
    .sort((left, right) => `${left.lang} ${left.name}`.localeCompare(`${right.lang} ${right.name}`));
  return voices.map((voice) => {
    const selected = voice.name === current ? " selected" : "";
    const label = `${voice.lang} - ${voice.name}`;
    return `<option value="${escapeHtml(voice.name)}"${selected}>${escapeHtml(label)}</option>`;
  }).join("");
}

function getSelectValue(id: string): string {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(`Missing select #${id}`);
  }

  return element.value;
}

function getSelectValueOrFallback(id: string, fallback: string): string {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLSelectElement)) {
    return fallback;
  }
  return element.value;
}

function getTextAreaValue(id: string): string {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error(`Missing textarea #${id}`);
  }

  return element.value;
}

function getInputValue(id: string): string {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing input #${id}`);
  }

  return element.value;
}

function getInputValueOrFallback(id: string, fallback: string): string {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    return fallback;
  }

  return element.value;
}

function getNumberInputValue(id: string, fallback: number): number {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    return fallback;
  }

  const value = Number(element.value);
  return Number.isFinite(value) ? value : fallback;
}

function getFirstNumberInputValue(ids: string[], fallback: number): number {
  for (const id of ids) {
    const value = getNumberInputValue(id, Number.NaN);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return fallback;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function createMemoryTitle(source: string): string {
  const cleaned = source.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "Conversation memory";
  }
  return cleaned.length > 72 ? `${cleaned.slice(0, 69)}...` : cleaned;
}

function setRenderStatus(statusElement: HTMLDivElement, text: string, isError = false): void {
  renderStatusText = text;
  statusElement.textContent = text;
  statusElement.classList.toggle("avatar-render-status-error", isError);

  const cards = document.querySelectorAll<HTMLElement>("[data-render-status]");
  for (const card of cards) {
    card.textContent = text;
    card.classList.toggle("render-status-error", isError);
  }
}







async function loadVoiceSettings(): Promise<VoiceSettings> {
  if (speechRuntime.settings) {
    return speechRuntime.settings;
  }
  const response = await fetch("/voice/settings");
  if (!response.ok) {
    throw new Error(`Voice settings request failed with ${response.status}`);
  }
  const settings = await response.json() as VoiceSettings;
  speechRuntime.settings = settings;
  return settings;
}

async function updateVoiceSettings(input: Partial<VoiceSettings>): Promise<VoiceSettings> {
  const response = await fetch("/voice/settings", {
    method: "PATCH",
    headers: getClientRequestHeaders(true),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Voice settings update failed with ${response.status}`);
  }
  const settings = await response.json() as VoiceSettings;
  speechRuntime.settings = settings;
  return settings;
}

async function ensureVoiceStartupReady(): Promise<void> {
  try {
    await loadVoiceSettings();
    const response = await fetch("/voice/warmup", {
      method: "POST",
      headers: getClientRequestHeaders(true),
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      console.warn(`Voice warmup request failed with ${response.status}`);
      return;
    }
    const payload = await response.json() as { preferredEngine?: string; ready?: boolean; details?: string };
    console.info(`Voice startup warmup: ${payload.preferredEngine ?? "unknown"} ready=${String(payload.ready)} ${payload.details ?? ""}`.trim());
  } catch (error) {
    console.warn("Voice startup warmup failed", error);
  }
}

async function speakAvatarText(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  stopAvatarSpeech();
  const settings = await loadVoiceSettings();
  await enqueueSpeechChunk(trimmed, settings, true);
}

async function enqueueSpeechChunk(text: string, settings: VoiceSettings, interrupt = false): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  if (interrupt) {
    stopAvatarSpeech();
  }
  if (settings.preferredTtsEngine === "browser-speech-synthesis") {
    speechRuntime.engineLabel = "browser speech";
    enqueueBrowserVoiceText(trimmed, settings);
    return;
  }
  try {
    const payload = await requestSpeechAudio(trimmed);
    if (payload.audioBase64 && payload.mimeType) {
      speechRuntime.engineLabel = settings.preferredTtsEngine;
      queueAudioSpeechChunk(payload.audioBase64, payload.mimeType, trimmed);
      return;
    }
  } catch (error) {
    console.warn("OpenAI TTS chunk failed, falling back to browser voice.", error);
  }
  speechRuntime.engineLabel = "browser fallback";
  enqueueBrowserVoiceText(trimmed, settings);
}

async function requestSpeechAudio(text: string): Promise<{ mimeType?: string; audioBase64?: string }> {
  const response = await fetch("/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(`Voice speak request failed with ${response.status}`);
  }
  return await response.json() as { mimeType?: string; audioBase64?: string };
}

function queueAudioSpeechChunk(audioBase64: string, mimeType: string, sourceText: string): void {
  speechRuntime.audioQueue.push({ audioBase64, mimeType, sourceText });
  if (!speechRuntime.processingAudioQueue) {
    void processQueuedAudioSpeech();
  }
}

async function processQueuedAudioSpeech(): Promise<void> {
  if (speechRuntime.processingAudioQueue) {
    return;
  }
  speechRuntime.processingAudioQueue = true;
  const generation = speechRuntime.playbackGeneration;
  try {
    while (speechRuntime.audioQueue.length > 0 && generation === speechRuntime.playbackGeneration) {
      const next = speechRuntime.audioQueue.shift();
      if (!next) {
        continue;
      }
      await playAudioBase64(next.audioBase64, next.mimeType, next.sourceText, generation);
    }
  } finally {
    if (generation === speechRuntime.playbackGeneration) {
      speechRuntime.processingAudioQueue = false;
      if (speechRuntime.audioQueue.length === 0 && !speechRuntime.utterance) {
        speechRuntime.speaking = false;
        speechRuntime.talkLevel = 0;
      }
    }
  }
}

function playAudioBase64(
  audioBase64: string,
  mimeType: string,
  sourceText: string,
  generation = speechRuntime.playbackGeneration,
): Promise<void> {
  clearCurrentAudioPlayback();
  const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  const sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);
  speechRuntime.audio = audio;
  speechRuntime.audioContext = audioContext;
  speechRuntime.analyser = analyser;
  speechRuntime.sourceNode = sourceNode;
  speechRuntime.speaking = true;
  beginSpeechVisemePlan(sourceText);
  const data = new Uint8Array(analyser.frequencyBinCount);
  return new Promise<void>((resolve) => {
    const finish = () => {
      if (speechRuntime.playbackGeneration === generation) {
        clearCurrentAudioPlayback();
        if (!speechRuntime.utterance && speechRuntime.audioQueue.length === 0) {
          speechRuntime.visemePlan = [];
          setSpeechVisemeTarget(createZeroViseme());
        }
      }
      resolve();
    };
    const tick = () => {
      if (!speechRuntime.speaking || !speechRuntime.analyser || speechRuntime.playbackGeneration !== generation) {
        return;
      }
      speechRuntime.analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        sum += Math.abs(data[i] - 128);
      }
      speechRuntime.talkLevel = Math.min(1, (sum / data.length) / 18);
      syncSpeechVisemePlan(audio.currentTime);
      speechRuntime.raf = window.requestAnimationFrame(tick);
    };
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    void audioContext.resume().catch(() => undefined);
    void audio.play().catch(() => finish());
    tick();
  });
}

function speakWithBrowserVoice(text: string, settings: VoiceSettings): void {
  stopAvatarSpeech();
  speechRuntime.engineLabel = "browser speech";
  enqueueBrowserVoiceText(text, settings);
}

function enqueueBrowserVoiceText(text: string, settings: VoiceSettings): void {
  if (!("speechSynthesis" in window)) {
    return;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  speechRuntime.browserQueue.push(trimmed);
  if (speechRuntime.utterance) {
    return;
  }
  playNextBrowserVoice(settings);
}

function playNextBrowserVoice(settings: VoiceSettings): void {
  if (!("speechSynthesis" in window)) {
    return;
  }
  const next = speechRuntime.browserQueue.shift();
  if (!next) {
    if (speechRuntime.audioQueue.length === 0) {
      speechRuntime.speaking = false;
      speechRuntime.talkLevel = 0;
    }
    speechRuntime.utterance = undefined;
    return;
  }
  const utterance = new SpeechSynthesisUtterance(next);
  utterance.rate = 0.88;
  utterance.pitch = 1.12;
  const selectedVoice = getSelectedBrowserVoice(settings.browserVoiceName);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  utterance.onstart = () => {
    speechRuntime.speaking = true;
    beginSpeechVisemePlan(next);
  };
  utterance.onboundary = (event) => {
    speechRuntime.talkLevel = 0.9;
    syncSpeechVisemePlanToBoundary(next, event.charIndex);
  };
  utterance.onend = () => {
    speechRuntime.utterance = undefined;
    speechRuntime.talkLevel = 0;
    speechRuntime.visemePlan = [];
    setSpeechVisemeTarget(createZeroViseme());
    playNextBrowserVoice(settings);
  };
  utterance.onerror = () => {
    speechRuntime.utterance = undefined;
    speechRuntime.talkLevel = 0;
    speechRuntime.visemePlan = [];
    setSpeechVisemeTarget(createZeroViseme());
    playNextBrowserVoice(settings);
  };
  speechRuntime.utterance = utterance;
  speechRuntime.speaking = true;
  window.speechSynthesis.speak(utterance);
}

function beginSpeechVisemePlan(text: string): void {
  speechRuntime.visemePlan = buildSpeechVisemePlan(text);
  speechRuntime.visemePlanStartedAt = performance.now();
  speechRuntime.visemePlanElapsedMs = 0;
  const initialTarget = sampleSpeechVisemePlan(speechRuntime.visemePlanStartedAt + 70);
  speechRuntime.visemeTarget = initialTarget;
  speechRuntime.visemeCurrent = lerpViseme(speechRuntime.visemeCurrent, initialTarget, 0.6);
}

function syncSpeechVisemePlan(elapsedTimeSeconds?: number): void {
  if (!Number.isFinite(elapsedTimeSeconds)) {
    return;
  }
  speechRuntime.visemePlanElapsedMs = Math.max(0, Number(elapsedTimeSeconds) * 1000);
  speechRuntime.visemePlanStartedAt = performance.now();
}

function syncSpeechVisemePlanToBoundary(text: string, charIndex: number): void {
  const nextText = text.slice(clamp(Math.floor(charIndex), 0, text.length)).trimStart();
  if (!nextText) {
    return;
  }
  speechRuntime.visemePlan = buildSpeechVisemePlan(nextText);
  speechRuntime.visemePlanStartedAt = performance.now();
  speechRuntime.visemePlanElapsedMs = 0;
  speechRuntime.visemeTarget = sampleSpeechVisemePlan(speechRuntime.visemePlanStartedAt);
}

function setSpeechVisemeTarget(next: SpeechVisemeWeights): void {
  speechRuntime.visemeTarget = {
    mouthOpen: clamp(next.mouthOpen * 1.9, 0, 1),
    aa: clamp(next.aa * 1.7, 0, 1),
    ow: clamp(next.ow * 1.7, 0, 1),
    ee: clamp(next.ee * 1.65, 0, 1),
    ih: clamp(next.ih * 1.6, 0, 1),
    fv: clamp(next.fv * 1.35, 0, 1),
    l: clamp(next.l * 1.3, 0, 1),
    th: clamp(next.th * 1.3, 0, 1),
    m: clamp(next.m * 1.35, 0, 1),
  };
}

function sampleSpeechVisemePlan(now: number): SpeechVisemeWeights {
  if (speechRuntime.visemePlan.length === 0) {
    return createZeroViseme();
  }
  const elapsed = Math.max(0, (now - speechRuntime.visemePlanStartedAt) + speechRuntime.visemePlanElapsedMs);
  const frames = speechRuntime.visemePlan;
  if (elapsed <= frames[0].timeMs) {
    return blendSpeechVisemeNeighbors(frames, 0, frames[0].weights);
  }
  for (let i = 1; i < frames.length; i += 1) {
    const previous = frames[i - 1];
    const current = frames[i];
    if (elapsed <= current.timeMs) {
      const duration = Math.max(1, current.timeMs - previous.timeMs);
      const t = clamp((elapsed - previous.timeMs) / duration, 0, 1);
      const blended = lerpViseme(previous.weights, current.weights, t);
      return blendSpeechVisemeNeighbors(frames, i, blended);
    }
  }
  return blendSpeechVisemeNeighbors(frames, frames.length - 1, frames[frames.length - 1].weights);
}

function buildSpeechVisemePlan(text: string): SpeechVisemeFrame[] {
  const tokens = tokenizeSpeechVisemes(text);
  const frames: SpeechVisemeFrame[] = [{ timeMs: 0, weights: createZeroViseme() }];
  let timeMs = 0;
  for (const token of tokens) {
    const weights = deriveVisemeFromToken(token.value);
    timeMs += token.durationMs;
    frames.push({ timeMs, weights });
  }
  frames.push({ timeMs: timeMs + 70, weights: createZeroViseme() });
  return frames;
}

function tokenizeSpeechVisemes(text: string): Array<{ value: string; durationMs: number }> {
  const normalized = text.toLowerCase().replace(/[^a-z'\s]+/g, " ");
  const tokens: Array<{ value: string; durationMs: number }> = [];
  let index = 0;
  while (index < normalized.length) {
    const pair = normalized.slice(index, index + 2);
    const single = normalized[index] ?? "";
    if (/\s/.test(single)) {
      tokens.push({ value: "rest", durationMs: 45 });
      index += 1;
      continue;
    }
    if (["th", "sh", "ch", "oo", "ee", "ow", "ou", "ph", "ai", "ay", "ea"].includes(pair)) {
      tokens.push({ value: pair, durationMs: 72 });
      index += 2;
      continue;
    }
    tokens.push({ value: single, durationMs: /[aeiouy]/.test(single) ? 68 : 54 });
    index += 1;
  }
  return tokens;
}

function deriveVisemeFromToken(token: string): SpeechVisemeWeights {
  if (!token || token === "rest") {
    return {
      ...createZeroViseme(),
      mouthOpen: 0.03,
    };
  }

  const closed = ["m", "b", "p"];
  const round = ["o", "u", "w", "ow", "ou", "oo"];
  const wide = ["a", "aa", "ah", "ai", "ay"];
  const smile = ["e", "ee", "ea"];
  const mid = ["i", "y"];
  const lipTeeth = ["f", "v", "ph"];
  const tongueTip = ["l"];
  const tongueTeeth = ["th"];

  const weights = createZeroViseme();
  if (closed.includes(token)) {
    weights.m = 0.42;
    weights.mouthOpen = 0.02;
  } else if (round.includes(token)) {
    weights.ow = 0.28;
    weights.mouthOpen = 0.18;
  } else if (wide.includes(token)) {
    weights.aa = 0.3;
    weights.mouthOpen = 0.22;
  } else if (smile.includes(token)) {
    weights.ee = 0.34;
    weights.mouthOpen = 0.17;
  } else if (mid.includes(token)) {
    weights.ih = 0.28;
    weights.mouthOpen = 0.14;
  } else if (lipTeeth.includes(token)) {
    weights.fv = 0.34;
    weights.mouthOpen = 0.07;
  } else if (tongueTip.includes(token)) {
    weights.l = 0.28;
    weights.mouthOpen = 0.11;
  } else if (tongueTeeth.includes(token)) {
    weights.th = 0.32;
    weights.mouthOpen = 0.1;
  } else {
    weights.mouthOpen = 0.08;
  }

  return weights;
}

function createZeroViseme(): SpeechVisemeWeights {
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
  };
}

function getNextBlinkDelay(rate: number): number {
  const normalizedRate = Math.max(0.15, rate);
  return (0.9 + Math.random() * 1.6) / normalizedRate;
}

function lerpViseme(from: SpeechVisemeWeights, to: SpeechVisemeWeights, t: number): SpeechVisemeWeights {
  return {
    mouthOpen: from.mouthOpen + (to.mouthOpen - from.mouthOpen) * t,
    aa: from.aa + (to.aa - from.aa) * t,
    ow: from.ow + (to.ow - from.ow) * t,
    ee: from.ee + (to.ee - from.ee) * t,
    ih: from.ih + (to.ih - from.ih) * t,
    fv: from.fv + (to.fv - from.fv) * t,
    l: from.l + (to.l - from.l) * t,
    th: from.th + (to.th - from.th) * t,
    m: from.m + (to.m - from.m) * t,
  };
}

function blendSpeechVisemeNeighbors(
  frames: SpeechVisemeFrame[],
  index: number,
  center: SpeechVisemeWeights,
): SpeechVisemeWeights {
  const previous = index > 0 ? frames[index - 1].weights : center;
  const next = index < frames.length - 1 ? frames[index + 1].weights : center;
  const averaged = {
    mouthOpen: center.mouthOpen * 0.68 + previous.mouthOpen * 0.16 + next.mouthOpen * 0.16,
    aa: center.aa * 0.68 + previous.aa * 0.16 + next.aa * 0.16,
    ow: center.ow * 0.68 + previous.ow * 0.16 + next.ow * 0.16,
    ee: center.ee * 0.78 + previous.ee * 0.11 + next.ee * 0.11,
    ih: center.ih * 0.78 + previous.ih * 0.11 + next.ih * 0.11,
    fv: center.fv * 0.82 + previous.fv * 0.09 + next.fv * 0.09,
    l: center.l * 0.82 + previous.l * 0.09 + next.l * 0.09,
    th: center.th * 0.82 + previous.th * 0.09 + next.th * 0.09,
    m: center.m * 0.84 + previous.m * 0.08 + next.m * 0.08,
  };
  return {
    mouthOpen: clamp(averaged.mouthOpen, 0, 1),
    aa: clamp(averaged.aa, 0, 1),
    ow: clamp(averaged.ow, 0, 1),
    ee: clamp(averaged.ee, 0, 1),
    ih: clamp(averaged.ih, 0, 1),
    fv: clamp(averaged.fv, 0, 1),
    l: clamp(averaged.l, 0, 1),
    th: clamp(averaged.th, 0, 1),
    m: clamp(averaged.m, 0, 1),
  };
}

function getSelectedBrowserVoice(voiceName?: string): SpeechSynthesisVoice | undefined {
  if (!("speechSynthesis" in window)) {
    return undefined;
  }
  const voices = window.speechSynthesis.getVoices();
  if (voiceName) {
    const exactMatch = voices.find((voice) => voice.name === voiceName);
    if (exactMatch) {
      return exactMatch;
    }
  }

  const preferredPatterns = [
    { locale: /^en-IE/i, name: /(fiona|moira|saoirse|irish)/i },
    { locale: /^en-IE/i, name: /.*/i },
    { locale: /^en-GB/i, name: /(libby|hazel|susan|sonia|emma|alice|ava|aria|female|woman|zira)/i },
    { locale: /^en-GB/i, name: /.*/i },
    { locale: /^en-/i, name: /(libby|hazel|susan|sonia|emma|alice|ava|aria|female|woman|zira)/i },
  ];

  for (const pattern of preferredPatterns) {
    const match = voices.find((voice) => pattern.locale.test(voice.lang) && pattern.name.test(voice.name));
    if (match) {
      return match;
    }
  }

  return voices.find((voice) => /^en-(IE|GB)/i.test(voice.lang))
    ?? voices.find((voice) => /^en-/i.test(voice.lang))
    ?? voices[0];
}

function stopAvatarSpeech(): void {
  speechRuntime.playbackGeneration += 1;
  if (speechRuntime.raf) {
    window.cancelAnimationFrame(speechRuntime.raf);
    speechRuntime.raf = undefined;
  }
  clearCurrentAudioPlayback();
  if (speechRuntime.utterance && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    speechRuntime.utterance = undefined;
  }
  speechRuntime.browserQueue = [];
  speechRuntime.audioQueue = [];
  speechRuntime.processingAudioQueue = false;
  speechRuntime.streamedSpokenText = "";
  speechRuntime.visemePlan = [];
  speechRuntime.visemePlanStartedAt = 0;
  speechRuntime.visemePlanElapsedMs = 0;
  speechRuntime.visemeTarget = createZeroViseme();
  speechRuntime.visemeCurrent = createZeroViseme();
  speechRuntime.speaking = false;
  speechRuntime.talkLevel = 0;
  speechRuntime.engineLabel = "idle";
}

function clearCurrentAudioPlayback(): void {
  if (speechRuntime.raf) {
    window.cancelAnimationFrame(speechRuntime.raf);
    speechRuntime.raf = undefined;
  }
  if (speechRuntime.audio) {
    speechRuntime.audio.pause();
    speechRuntime.audio.src = "";
    speechRuntime.audio = undefined;
  }
  if (speechRuntime.sourceNode) {
    speechRuntime.sourceNode.disconnect();
    speechRuntime.sourceNode = undefined;
  }
  if (speechRuntime.analyser) {
    speechRuntime.analyser.disconnect();
    speechRuntime.analyser = undefined;
  }
  if (speechRuntime.audioContext) {
    void speechRuntime.audioContext.close().catch(() => undefined);
    speechRuntime.audioContext = undefined;
  }
}

