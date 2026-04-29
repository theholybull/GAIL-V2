export {};

function renderApp(): string {
  return `
    <div class="panel-shell">
      <aside class="panel-sidebar">
        <div class="brand-block">
          <div class="eyebrow">Gail</div>
          <h1>Operator Panel</h1>
          <p>Live test surface for backend health, devices, approvals, tasks, notes, cart, and private session flows.</p>
        </div>
        <div class="status-card">
          <div class="status-label">Backend</div>
          <div id="health-status" class="status-value">Unknown</div>
          <button id="refresh-health" class="ghost-button" type="button">Refresh Health</button>
        </div>
        <div class="status-card">
          <div class="status-label">Response Log</div>
          <pre id="response-log" class="response-log">No requests yet.</pre>
        </div>
      </aside>
      <main class="panel-main">
        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Session</div>
              <h2>Request Context</h2>
            </div>
          </div>
          <div class="grid two-up">
            <label>
              Backend URL
              <input id="base-url" value="http://127.0.0.1:4180" />
            </label>
            <label>
              Device ID
              <input id="device-id" value="watch-demo-1" />
            </label>
            <label>
              Device Type
              <select id="device-type">
                <option value="web_admin">web_admin</option>
                <option value="uconsole">uconsole</option>
                <option value="iphone">iphone</option>
                <option value="kiosk">kiosk</option>
                <option value="watch">watch</option>
                <option value="service">service</option>
              </select>
            </label>
            <label>
              Mode
              <select id="mode">
                <option value="work">work</option>
                <option value="home_shop">home_shop</option>
                <option value="private">private</option>
                <option value="lightweight">lightweight</option>
                <option value="focus">focus</option>
              </select>
            </label>
          </div>
          <label class="inline-check">
            <input id="explicit-local-save" type="checkbox" />
            Explicit local save
          </label>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Voice</div>
              <h2>Voice Loop</h2>
            </div>
            <button id="refresh-voice-settings" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Voice Mode
              <select id="voice-mode">
                <option value="push_to_talk">push_to_talk</option>
                <option value="wake_word">wake_word</option>
              </select>
            </label>
            <label>
              Wake Word
              <input id="voice-wake-word" value="hey gail" />
            </label>
          </div>
          <div class="grid two-up">
            <label>
              Silence Timeout (ms)
              <input id="voice-silence-timeout" value="6000" />
            </label>
            <label class="inline-check top-gap">
              <input id="voice-auto-resume" type="checkbox" checked />
              Auto resume after response
            </label>
          </div>
          <div class="grid two-up">
            <label>
              Preferred TTS
              <select id="voice-preferred-tts">
                <option value="browser-speech-synthesis">browser-speech-synthesis</option>
                <option value="openai-gpt-4o-mini-tts">openai-gpt-4o-mini-tts</option>
                <option value="openai-tts-1">openai-tts-1</option>
                <option value="openai-tts-1-hd">openai-tts-1-hd</option>
              </select>
            </label>
            <label>
              Fallback TTS
              <select id="voice-fallback-tts">
                <option value="browser-speech-synthesis">browser-speech-synthesis</option>
              </select>
            </label>
          </div>
          <div class="grid two-up">
            <label>
              OpenAI Voice
              <input id="voice-openai-voice" value="nova" />
            </label>
            <label>
              Browser Voice
              <select id="voice-browser-voice">
                <option value="">system default</option>
              </select>
            </label>
          </div>
          <div class="action-row">
            <button id="save-voice-settings" type="button">Save Voice Settings</button>
            <button id="start-voice" type="button">Start Listening</button>
            <button id="stop-voice" type="button">Stop Listening</button>
            <button id="test-voice-output" type="button">Test Voice Output</button>
          </div>
          <label>
            Voice Shootout Sample
            <input id="voice-shootout-text" value="Hi, I?m Gail. I can help you sort things out, remember what matters, and keep the day moving." />
          </label>
          <div class="action-row">
            <button id="voice-shootout-coral" type="button">Try coral</button>
            <button id="voice-shootout-nova" type="button">Try nova</button>
            <button id="voice-shootout-shimmer" type="button">Try shimmer</button>
            <button id="voice-shootout-alloy" type="button">Try alloy</button>
          </div>
          <pre id="voice-status-output" class="data-block">No voice status loaded.</pre>
          <pre id="voice-log-output" class="data-block">No voice activity yet.</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Camera</div>
              <h2>Camera Access</h2>
            </div>
            <button id="refresh-camera-matrix" type="button">Refresh</button>
          </div>
          <div class="action-row">
            <button id="start-camera-preview" type="button">Start Camera Preview</button>
            <button id="stop-camera-preview" type="button">Stop Camera Preview</button>
          </div>
          <video id="camera-preview" autoplay playsinline muted class="camera-preview"></video>
          <pre id="camera-matrix-output" class="data-block">No camera matrix loaded.</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Providers</div>
              <h2>Provider Status</h2>
            </div>
            <button id="refresh-providers" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              OpenAI API Key
              <input id="openai-api-key" type="password" placeholder="sk-..." autocomplete="off" />
            </label>
            <div class="top-gap action-row">
              <button id="save-openai-config" type="button">Save OpenAI Key</button>
              <button id="clear-openai-config" type="button">Clear Stored Key</button>
            </div>
          </div>
          <pre id="openai-config-output" class="data-block">No OpenAI config loaded.</pre>
          <pre id="providers-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Overview</div>
              <h2>Dashboard Snapshot</h2>
            </div>
            <button id="refresh-overview" type="button">Refresh</button>
          </div>
          <pre id="overview-output" class="data-block">No overview loaded.</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Devices</div>
              <h2>Device Registry</h2>
            </div>
            <button id="refresh-devices" type="button">Refresh</button>
          </div>
          <div class="grid three-up">
            <label>
              Register Device ID
              <input id="register-device-id" value="watch-demo-1" />
            </label>
            <label>
              Name
              <input id="register-device-name" value="Demo Watch" />
            </label>
            <label>
              Type
              <select id="register-device-type">
                <option value="watch">watch</option>
                <option value="iphone">iphone</option>
                <option value="uconsole">uconsole</option>
                <option value="kiosk">kiosk</option>
                <option value="web_admin">web_admin</option>
                <option value="service">service</option>
              </select>
            </label>
          </div>
          <div class="grid three-up">
            <label>
              Default Mode
              <select id="register-device-mode">
                <option value="lightweight">lightweight</option>
                <option value="work">work</option>
                <option value="home_shop">home_shop</option>
                <option value="private">private</option>
                <option value="focus">focus</option>
              </select>
            </label>
            <label>
              Quality Tier
              <select id="register-device-tier">
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>
            <label class="inline-check top-gap">
              <input id="register-device-trusted" type="checkbox" checked />
              Trusted on register
            </label>
          </div>
          <div class="action-row">
            <button id="register-device" type="button">Register Device</button>
            <button id="trust-current-device" type="button">Trust Current Device ID</button>
            <button id="untrust-current-device" type="button">Untrust Current Device</button>
            <button id="unlock-current-device" type="button">Unlock Current Device</button>
            <button id="lock-current-device" type="button">Lock Current Device</button>
          </div>
          <div class="grid two-up">
            <label>
              Unlock Minutes
              <input id="device-unlock-minutes" value="15" />
            </label>
          </div>
          <pre id="devices-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Approvals</div>
              <h2>Approval Queue</h2>
            </div>
            <button id="refresh-approvals" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Approval ID
              <input id="approval-id" />
            </label>
            <label>
              Approval Status
              <select id="approval-status">
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
          </div>
          <button id="resolve-approval" type="button">Resolve Approval Using Current Device</button>
          <pre id="approvals-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Tasks</div>
              <h2>Task Testing</h2>
            </div>
            <button id="refresh-tasks" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Task Title
              <input id="task-title" value="Panel-created task" />
            </label>
            <label>
              Priority
              <select id="task-priority">
                <option value="normal">normal</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
                <option value="low">low</option>
                <option value="someday">someday</option>
              </select>
            </label>
          </div>
          <button id="create-task" type="button">Create Task</button>
          <pre id="tasks-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Projects</div>
              <h2>Project Tracking</h2>
            </div>
            <button id="refresh-projects" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Project Title
              <input id="project-title" value="Panel project" />
            </label>
            <label>
              Project Status
              <select id="project-status">
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="archived">archived</option>
              </select>
            </label>
          </div>
          <label>
            Project Summary
            <textarea id="project-summary">Created from the operator panel.</textarea>
          </label>
          <div class="grid two-up">
            <label>
              Project Tags
              <input id="project-tags" value="panel,project" />
            </label>
            <label>
              Project ID
              <input id="project-id" />
            </label>
          </div>
          <div class="action-row">
            <button id="create-project" type="button">Create Project</button>
            <button id="update-project" type="button">Update Project</button>
          </div>
          <pre id="projects-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Lists</div>
              <h2>List Workflow</h2>
            </div>
            <button id="refresh-lists" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              List Title
              <input id="list-title" value="Panel list" />
            </label>
            <label>
              List ID
              <input id="list-id" />
            </label>
          </div>
          <label>
            List Description
            <textarea id="list-description">List managed from the operator panel.</textarea>
          </label>
          <div class="grid two-up">
            <label>
              New Item Text
              <input id="list-item-text" value="Panel list item" />
            </label>
            <label>
              Item ID
              <input id="list-item-id" />
            </label>
          </div>
          <label class="inline-check">
            <input id="list-item-completed" type="checkbox" />
            Mark item complete on update
          </label>
          <div class="action-row">
            <button id="create-list" type="button">Create List</button>
            <button id="add-list-item" type="button">Add Item</button>
            <button id="complete-list-item" type="button">Update Item</button>
          </div>
          <pre id="lists-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Notes</div>
              <h2>Notes and Private Saves</h2>
            </div>
            <button id="refresh-notes" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Note Title
              <input id="note-title" value="Panel note" />
            </label>
            <label class="inline-check top-gap">
              <input id="note-private-only" type="checkbox" />
              privateOnly
            </label>
          </div>
          <label>
            Note Body
            <textarea id="note-body">Created from the operator panel.</textarea>
          </label>
          <button id="create-note" type="button">Create Note</button>
          <pre id="notes-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Memory</div>
              <h2>Shared Memory</h2>
            </div>
            <button id="refresh-memory" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Memory Title
              <input id="memory-title" value="Panel memory" />
            </label>
            <label>
              Memory Source
              <input id="memory-source" value="operator-panel" />
            </label>
          </div>
          <div class="grid two-up">
            <label>
              Memory ID
              <input id="memory-id" />
            </label>
            <label>
              Memory Search
              <input id="memory-query" value="" />
            </label>
          </div>
          <label>
            Memory Body
            <textarea id="memory-body">Remember this as a persistent shared memory entry.</textarea>
          </label>
          <label>
            Memory Tags
            <input id="memory-tags" value="panel,memory" />
          </label>
          <div class="action-row">
            <button id="create-memory" type="button">Create Memory</button>
            <button id="update-memory" type="button">Update Memory</button>
            <button id="delete-memory" type="button">Delete Memory</button>
            <button id="search-memory" type="button">Search Memory</button>
          </div>
          <pre id="memory-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Conversation</div>
              <h2>Conversation Sessions</h2>
            </div>
            <button id="refresh-conversations" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Session Title
              <input id="conversation-title" value="Panel conversation" />
            </label>
            <label>
              Provider Preference
              <select id="conversation-provider">
                <option value="">default</option>
                <option value="openai">openai</option>
                <option value="local-llm">local-llm</option>
              </select>
            </label>
          </div>
          <div class="grid two-up">
            <label>
              Session ID
              <input id="conversation-id" />
            </label>
            <label>
              Last Used Provider
              <input id="conversation-used-provider" value="unknown" readonly />
            </label>
          </div>
          <label>
            Message
            <textarea id="conversation-message">Help me organize the next step.</textarea>
          </label>
          <div class="action-row">
            <button id="create-conversation" type="button">Create Session</button>
            <button id="send-conversation-message" type="button">Send Message</button>
            <button id="load-conversation" type="button">Load Session</button>
          </div>
          <pre id="conversations-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Commands</div>
              <h2>Hardwired Commands</h2>
            </div>
            <button id="refresh-commands" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Command Phrase
              <input id="command-phrase" value="show tasks" />
            </label>
            <div class="top-gap">
              <button id="execute-command" type="button">Execute Command</button>
            </div>
          </div>
          <pre id="commands-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Client</div>
              <h2>Asset Manifest</h2>
            </div>
            <button id="refresh-client-assets" type="button">Refresh</button>
          </div>
          <pre id="client-assets-output" class="data-block">No client asset manifest loaded.</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Reminders</div>
              <h2>Reminder Tracking</h2>
            </div>
            <button id="refresh-reminders" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Reminder Title
              <input id="reminder-title" value="Panel reminder" />
            </label>
            <label>
              Reminder Status
              <select id="reminder-status">
                <option value="scheduled">scheduled</option>
                <option value="snoozed">snoozed</option>
                <option value="completed">completed</option>
                <option value="canceled">canceled</option>
              </select>
            </label>
          </div>
          <div class="grid two-up">
            <label>
              Remind At
              <input id="reminder-remind-at" value="2026-03-18T18:00:00" />
            </label>
            <label>
              Reminder ID
              <input id="reminder-id" />
            </label>
          </div>
          <label>
            Reminder Details
            <textarea id="reminder-details">Reminder created from the operator panel.</textarea>
          </label>
          <div class="action-row">
            <button id="create-reminder" type="button">Create Reminder</button>
            <button id="update-reminder" type="button">Update Reminder</button>
          </div>
          <pre id="reminders-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Parts</div>
              <h2>Parts Tracking</h2>
            </div>
            <button id="refresh-parts" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Part Title
              <input id="part-title" value="Panel part" />
            </label>
            <label>
              Part Status
              <select id="part-status">
                <option value="needed">needed</option>
                <option value="researching">researching</option>
                <option value="in_cart">in_cart</option>
                <option value="ordered">ordered</option>
                <option value="received">received</option>
                <option value="installed">installed</option>
                <option value="returned">returned</option>
                <option value="incompatible">incompatible</option>
              </select>
            </label>
          </div>
          <div class="grid two-up">
            <label>
              Source Type
              <select id="part-source-type">
                <option value="catalog">catalog</option>
                <option value="search">search</option>
                <option value="marketplace">marketplace</option>
                <option value="reference">reference</option>
              </select>
            </label>
            <label>
              Part ID
              <input id="part-id" />
            </label>
          </div>
          <div class="grid two-up">
            <label>
              Part Number
              <input id="part-number" value="PN-001" />
            </label>
            <label>
              Source URL
              <input id="part-source-url" value="https://example.com/panel-part" />
            </label>
          </div>
          <label>
            Compatibility Notes
            <textarea id="part-compatibility-notes">Panel-managed part notes.</textarea>
          </label>
          <div class="action-row">
            <button id="create-part" type="button">Create Part</button>
            <button id="update-part" type="button">Update Part</button>
          </div>
          <pre id="parts-output" class="data-block">[]</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Private Session</div>
              <h2>RAM-Only Private Session</h2>
            </div>
            <button id="refresh-private-session" type="button">Refresh</button>
          </div>
          <label>
            Private Session Note
            <textarea id="private-session-body">I need a place to vent without saving it permanently.</textarea>
          </label>
          <div class="action-row">
            <button id="add-private-session-note" type="button">Add RAM-Only Note</button>
            <button id="wipe-private-session" type="button">Wipe Private Session</button>
          </div>
          <pre id="private-session-output" class="data-block">No session loaded.</pre>
        </section>

        <section class="panel-section">
          <div class="section-header">
            <div>
              <div class="eyebrow">Cart</div>
              <h2>Approval Flow</h2>
            </div>
            <button id="refresh-cart" type="button">Refresh</button>
          </div>
          <div class="grid two-up">
            <label>
              Cart Title
              <input id="cart-title" value="Panel cart item" />
            </label>
            <label>
              Source URL
              <input id="cart-source-url" value="https://example.com/panel-item" />
            </label>
          </div>
          <div class="grid two-up">
            <label>
              Cart Item ID
              <input id="cart-item-id" />
            </label>
            <label>
              Approval ID For Commit
              <input id="cart-approval-id" />
            </label>
          </div>
          <div class="action-row">
            <button id="create-cart-item" type="button">Create Cart Item</button>
            <button id="request-cart-approval" type="button">Request Approval</button>
            <button id="commit-cart-approval" type="button">Commit Approval</button>
          </div>
          <pre id="cart-output" class="data-block">[]</pre>
        </section>
      </main>
    </div>
  `;
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface VoiceSettingsPayload {
  mode: "push_to_talk" | "wake_word";
  wakeWord: string;
  silenceTimeoutMs: number;
  autoResumeAfterResponse: boolean;
  preferredTtsEngine: "browser-speech-synthesis" | "openai-gpt-4o-mini-tts" | "openai-tts-1" | "openai-tts-1-hd";
  fallbackTtsEngine: "browser-speech-synthesis";
  openAiVoice: string;
  openAiInstructions?: string;
  browserVoiceName?: string;
}

interface VoiceRuntimeState {
  recognition: SpeechRecognitionInstance | null;
  listening: boolean;
  wakeArmed: boolean;
  conversationBuffer: string;
  silenceTimer: number | null;
  speaking: boolean;
  stream: MediaStream | null;
}

interface SpeechRecognitionResultLike {
  readonly transcript: string;
}

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<ArrayLike<SpeechRecognitionAlternativeLike> & { isFinal?: boolean }>;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface PanelContext {
  baseUrl: string;
  deviceId: string;
  deviceType: string;
  mode: string;
  explicitLocalSave: boolean;
}

interface OpenAiConfigStatus {
  configured: boolean;
  source: "env" | "stored" | "none";
  hasStoredKey: boolean;
  model: string;
  baseUrl: string;
}

const appRoot = document.querySelector<HTMLDivElement>("#app");
const voiceRuntime: VoiceRuntimeState = {
  recognition: null,
  listening: false,
  wakeArmed: false,
  conversationBuffer: "",
  silenceTimer: null,
  speaking: false,
  stream: null,
};

if (!appRoot) {
  throw new Error("Missing #app root.");
}

appRoot.innerHTML = renderApp();

wireEvents();
void initialLoad();

function wireEvents(): void {
  onClick("refresh-health", () => fetchHealth());
  onClick("refresh-voice-settings", () => refreshVoiceSettings());
  onClick("save-voice-settings", () => saveVoiceSettings());
  onClick("start-voice", () => startVoiceLoop());
  onClick("stop-voice", () => stopVoiceLoop());
  onClick("test-voice-output", () => testVoiceOutput());
  onClick("voice-shootout-coral", () => runVoiceShootout("coral"));
  onClick("voice-shootout-nova", () => runVoiceShootout("nova"));
  onClick("voice-shootout-shimmer", () => runVoiceShootout("shimmer"));
  onClick("voice-shootout-alloy", () => runVoiceShootout("alloy"));
  onClick("refresh-camera-matrix", () => refreshCameraMatrix());
  onClick("start-camera-preview", () => startCameraPreview());
  onClick("stop-camera-preview", () => stopCameraPreview());
  onClick("refresh-providers", () => refreshProviders());
  onClick("save-openai-config", () => saveOpenAiConfig());
  onClick("clear-openai-config", () => clearOpenAiConfig());
  onClick("refresh-overview", () => refreshOverview());
  onClick("refresh-devices", () => refreshDevices());
  onClick("register-device", () => registerDevice());
  onClick("trust-current-device", () => trustCurrentDevice());
  onClick("untrust-current-device", () => untrustCurrentDevice());
  onClick("unlock-current-device", () => unlockCurrentDevice());
  onClick("lock-current-device", () => lockCurrentDevice());
  onClick("refresh-approvals", () => refreshApprovals());
  onClick("resolve-approval", () => resolveApproval());
  onClick("refresh-tasks", () => refreshTasks());
  onClick("create-task", () => createTask());
  onClick("refresh-projects", () => refreshProjects());
  onClick("create-project", () => createProject());
  onClick("update-project", () => updateProject());
  onClick("refresh-lists", () => refreshLists());
  onClick("create-list", () => createList());
  onClick("add-list-item", () => addListItem());
  onClick("complete-list-item", () => updateListItem());
  onClick("refresh-notes", () => refreshNotes());
  onClick("create-note", () => createNote());
  onClick("refresh-memory", () => refreshMemory());
  onClick("create-memory", () => createMemory());
  onClick("update-memory", () => updateMemory());
  onClick("delete-memory", () => deleteMemory());
  onClick("search-memory", () => searchMemory());
  onClick("refresh-conversations", () => refreshConversations());
  onClick("create-conversation", () => createConversation());
  onClick("send-conversation-message", () => sendConversationMessage());
  onClick("load-conversation", () => loadConversation());
  onClick("refresh-commands", () => refreshCommands());
  onClick("execute-command", () => executeCommand());
  onClick("refresh-client-assets", () => refreshClientAssets());
  onClick("refresh-reminders", () => refreshReminders());
  onClick("create-reminder", () => createReminder());
  onClick("update-reminder", () => updateReminder());
  onClick("refresh-parts", () => refreshParts());
  onClick("create-part", () => createPart());
  onClick("update-part", () => updatePart());
  onClick("refresh-private-session", () => refreshPrivateSession());
  onClick("add-private-session-note", () => addPrivateSessionNote());
  onClick("wipe-private-session", () => wipePrivateSession());
  onClick("refresh-cart", () => refreshCart());
  onClick("create-cart-item", () => createCartItem());
  onClick("request-cart-approval", () => requestCartApproval());
  onClick("commit-cart-approval", () => commitCartApproval());
}

async function initialLoad(): Promise<void> {
  await fetchHealth();
  await Promise.all([
    refreshVoiceSettings(),
    refreshCameraMatrix(),
    refreshProviders(),
    refreshOpenAiConfig(),
    refreshOverview(),
    refreshDevices(),
    refreshApprovals(),
    refreshTasks(),
    refreshProjects(),
    refreshLists(),
    refreshNotes(),
    refreshMemory(),
    refreshConversations(),
    refreshCommands(),
    refreshClientAssets(),
    refreshReminders(),
    refreshParts(),
    refreshCart(),
  ]);
}

function getContext(): PanelContext {
  return {
    baseUrl: getInputValue("base-url"),
    deviceId: getInputValue("device-id"),
    deviceType: getSelectValue("device-type"),
    mode: getSelectValue("mode"),
    explicitLocalSave: getCheckboxValue("explicit-local-save"),
  };
}

async function fetchJson(path: string, method: HttpMethod = "GET", body?: unknown): Promise<unknown> {
  const context = getContext();
  const response = await fetch(`${context.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-gail-device-id": context.deviceId,
      "x-gail-device-type": context.deviceType,
      "x-gail-mode": context.mode,
      "x-gail-explicit-local-save": String(context.explicitLocalSave),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? safeParseJson(text) : null;

  writeLog(`${method} ${path} -> ${response.status}\n${formatJson(payload)}`);

  if (!response.ok) {
    throw new Error(typeof payload === "object" && payload && "error" in payload
      ? String((payload as { error: unknown }).error)
      : `Request failed with status ${response.status}`);
  }

  return payload;
}

async function fetchHealth(): Promise<void> {
  const payload = await fetchJson("/health");
  setText("health-status", typeof payload === "object" && payload ? "Online" : "Unknown");
}

async function refreshVoiceSettings(): Promise<void> {
  const settings = await fetchJson("/voice/settings") as VoiceSettingsPayload;
  const engines = await fetchJson("/voice/engines");
  const status = await fetchJson("/voice/status");
  setSelectValue("voice-mode", settings.mode);
  setInputValue("voice-wake-word", settings.wakeWord);
  setInputValue("voice-silence-timeout", String(settings.silenceTimeoutMs));
  setCheckboxValue("voice-auto-resume", settings.autoResumeAfterResponse);
  setSelectValue("voice-preferred-tts", settings.preferredTtsEngine);
  setSelectValue("voice-fallback-tts", settings.fallbackTtsEngine);
  setInputValue("voice-openai-voice", settings.openAiVoice);
  populateBrowserVoiceSelect(settings.browserVoiceName);
  writeVoiceLog(`Voice engines loaded: ${formatJson(engines)}`);
  setPre("voice-status-output", status);
}

async function saveVoiceSettings(): Promise<void> {
  const payload = await fetchJson("/voice/settings", "PATCH", getVoiceSettingsPayload());
  setPre("voice-status-output", payload);
}

async function refreshCameraMatrix(): Promise<void> {
  const payload = await fetchJson("/camera/matrix");
  setPre("camera-matrix-output", payload);
}

async function startVoiceLoop(): Promise<void> {
  const settings = await saveVoiceSettingsForRuntime();
  ensureSpeechRecognitionAvailable();
  initializeRecognition(settings);
  voiceRuntime.wakeArmed = settings.mode === "wake_word";
  voiceRuntime.conversationBuffer = "";
  voiceRuntime.recognition?.start();
}

async function stopVoiceLoop(): Promise<void> {
  clearVoiceSilenceTimer();
  voiceRuntime.wakeArmed = false;
  voiceRuntime.conversationBuffer = "";
  voiceRuntime.listening = false;
  voiceRuntime.recognition?.stop();
  stopSpeaking();
  writeVoiceLog("Voice loop stopped.");
}

async function testVoiceOutput(): Promise<void> {
  const settings = await saveVoiceSettingsForRuntime();
  speakText("This is a Gail voice output test.", settings);
}

async function runVoiceShootout(voice: string): Promise<void> {
  const settings = await saveVoiceSettingsForRuntime();
  const text = getInputValue("voice-shootout-text").trim() || "Hi, I?m Gail.";
  writeVoiceLog(`Voice shootout: ${voice}.`);
  speakText(text, settings, {
    engineOverride: "openai-gpt-4o-mini-tts",
    voiceOverride: voice,
  });
}

async function startCameraPreview(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    writeVoiceLog("Camera preview is not available in this browser.");
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  voiceRuntime.stream = stream;
  const video = document.getElementById("camera-preview");
  if (video instanceof HTMLVideoElement) {
    video.srcObject = stream;
  }
  writeVoiceLog("Camera preview started.");
}

async function stopCameraPreview(): Promise<void> {
  if (voiceRuntime.stream) {
    for (const track of voiceRuntime.stream.getTracks()) {
      track.stop();
    }
    voiceRuntime.stream = null;
  }

  const video = document.getElementById("camera-preview");
  if (video instanceof HTMLVideoElement) {
    video.srcObject = null;
  }
  writeVoiceLog("Camera preview stopped.");
}

async function refreshProviders(): Promise<void> {
  const payload = await fetchJson("/providers/status");
  setPre("providers-output", payload);
}

async function refreshOpenAiConfig(): Promise<void> {
  const payload = await fetchJson("/providers/openai-config") as OpenAiConfigStatus;
  setPre("openai-config-output", payload);
}

async function saveOpenAiConfig(): Promise<void> {
  const apiKey = getInputValue("openai-api-key").trim();
  if (!apiKey) {
    throw new Error("OpenAI API key must not be empty.");
  }
  const payload = await fetchJson("/providers/openai-config", "PATCH", { apiKey }) as OpenAiConfigStatus;
  setInputValue("openai-api-key", "");
  setPre("openai-config-output", payload);
  await refreshProviders();
}

async function clearOpenAiConfig(): Promise<void> {
  const payload = await fetchJson("/providers/openai-config", "PATCH", { clear: true }) as OpenAiConfigStatus;
  setInputValue("openai-api-key", "");
  setPre("openai-config-output", payload);
  await refreshProviders();
}

async function refreshOverview(): Promise<void> {
  const payload = await fetchJson("/dashboard/overview");
  setPre("overview-output", payload);
}

async function refreshDevices(): Promise<void> {
  const payload = await fetchJson("/devices");
  setPre("devices-output", payload);
}

async function registerDevice(): Promise<void> {
  const payload = await fetchJson("/devices", "POST", {
    id: getInputValue("register-device-id"),
    name: getInputValue("register-device-name"),
    type: getSelectValue("register-device-type"),
    defaultMode: getSelectValue("register-device-mode"),
    qualityTier: getSelectValue("register-device-tier"),
    trusted: getCheckboxValue("register-device-trusted"),
    supportsWatchApproval: getSelectValue("register-device-type") === "watch",
  });
  setPre("devices-output", payload);
}

async function trustCurrentDevice(): Promise<void> {
  const context = getContext();
  const payload = await fetchJson(`/devices/${context.deviceId}/trust`, "PATCH", { trusted: true });
  setPre("devices-output", payload);
}

async function untrustCurrentDevice(): Promise<void> {
  const context = getContext();
  const payload = await fetchJson(`/devices/${context.deviceId}/trust`, "PATCH", { trusted: false });
  setPre("devices-output", payload);
}

async function unlockCurrentDevice(): Promise<void> {
  const context = getContext();
  const payload = await fetchJson(`/devices/${context.deviceId}/access-window`, "PATCH", {
    unlockForMinutes: Number.parseInt(getInputValue("device-unlock-minutes"), 10),
  });
  setPre("devices-output", payload);
}

async function lockCurrentDevice(): Promise<void> {
  const context = getContext();
  const payload = await fetchJson(`/devices/${context.deviceId}/access-window`, "PATCH", {
    clear: true,
  });
  setPre("devices-output", payload);
}

async function refreshApprovals(): Promise<void> {
  const payload = await fetchJson("/approvals");
  setPre("approvals-output", payload);
}

async function resolveApproval(): Promise<void> {
  const approvalId = getInputValue("approval-id").trim();
  if (!approvalId) {
    throw new Error("Set Approval ID before resolving.");
  }
  const payload = await fetchJson(`/approvals/${approvalId}`, "PATCH", {
    approvedByDeviceId: getInputValue("device-id"),
    status: getSelectValue("approval-status"),
  });
  setPre("approvals-output", payload);
}

async function refreshTasks(): Promise<void> {
  const payload = await fetchJson("/tasks");
  setPre("tasks-output", payload);
}

async function createTask(): Promise<void> {
  const payload = await fetchJson("/tasks", "POST", {
    title: getInputValue("task-title"),
    priority: getSelectValue("task-priority"),
  });
  setPre("tasks-output", payload);
}

async function refreshProjects(): Promise<void> {
  const payload = await fetchJson("/projects");
  setPre("projects-output", payload);
}

async function createProject(): Promise<void> {
  const payload = await fetchJson("/projects", "POST", {
    title: getInputValue("project-title"),
    summary: getTextareaValue("project-summary"),
    tags: parseCsv(getInputValue("project-tags")),
  });
  setPre("projects-output", payload);
  if (payload && typeof payload === "object" && "id" in payload) {
    setInputValue("project-id", String((payload as { id: unknown }).id));
  }
}

async function updateProject(): Promise<void> {
  const projectId = getInputValue("project-id").trim();
  if (!projectId) {
    throw new Error("Set Project ID before updating.");
  }
  const payload = await fetchJson(`/projects/${projectId}`, "PATCH", {
    title: getInputValue("project-title"),
    summary: getTextareaValue("project-summary"),
    status: getSelectValue("project-status"),
    tags: parseCsv(getInputValue("project-tags")),
  });
  setPre("projects-output", payload);
}

async function refreshLists(): Promise<void> {
  const payload = await fetchJson("/lists");
  setPre("lists-output", payload);
}

async function createList(): Promise<void> {
  const payload = await fetchJson("/lists", "POST", {
    title: getInputValue("list-title"),
    description: getTextareaValue("list-description"),
  });
  setPre("lists-output", payload);
  if (payload && typeof payload === "object" && "id" in payload) {
    setInputValue("list-id", String((payload as { id: unknown }).id));
  }
}

async function addListItem(): Promise<void> {
  const listId = getInputValue("list-id").trim();
  if (!listId) {
    throw new Error("Set List ID before adding an item.");
  }
  const payload = await fetchJson(`/lists/${listId}/items`, "POST", {
    text: getInputValue("list-item-text"),
  });
  setPre("lists-output", payload);
  if (payload && typeof payload === "object" && "items" in payload) {
    const items = (payload as { items?: Array<{ id?: unknown }> }).items;
    const latest = items?.[items.length - 1];
    if (latest?.id) {
      setInputValue("list-item-id", String(latest.id));
    }
  }
}

async function updateListItem(): Promise<void> {
  const listId = getInputValue("list-id").trim();
  const listItemId = getInputValue("list-item-id").trim();
  if (!listId) {
    throw new Error("Set List ID before updating an item.");
  }
  if (!listItemId) {
    throw new Error("Set List Item ID before updating an item.");
  }
  const payload = await fetchJson(
    `/lists/${listId}/items/${listItemId}`,
    "PATCH",
    {
      text: getInputValue("list-item-text"),
      completed: getCheckboxValue("list-item-completed"),
    },
  );
  setPre("lists-output", payload);
}

async function refreshNotes(): Promise<void> {
  const payload = await fetchJson("/notes");
  setPre("notes-output", payload);
}

async function createNote(): Promise<void> {
  const payload = await fetchJson("/notes", "POST", {
    title: getInputValue("note-title"),
    body: getTextareaValue("note-body"),
    privateOnly: getCheckboxValue("note-private-only"),
  });
  setPre("notes-output", payload);
}

async function refreshMemory(): Promise<void> {
  const payload = await fetchJson("/memory/entries");
  setPre("memory-output", payload);
}

async function createMemory(): Promise<void> {
  const payload = await fetchJson("/memory/entries", "POST", {
    title: getInputValue("memory-title"),
    body: getTextareaValue("memory-body"),
    source: getInputValue("memory-source"),
    tags: parseCsv(getInputValue("memory-tags")),
  });
  setPre("memory-output", payload);
  if (payload && typeof payload === "object" && "id" in payload) {
    setInputValue("memory-id", String((payload as { id: unknown }).id));
  }
}

async function updateMemory(): Promise<void> {
  const memoryId = getInputValue("memory-id").trim();
  if (!memoryId) {
    throw new Error("Set Memory ID before updating.");
  }
  const payload = await fetchJson(`/memory/entries/${memoryId}`, "PATCH", {
    title: getInputValue("memory-title"),
    body: getTextareaValue("memory-body"),
    source: getInputValue("memory-source"),
    tags: parseCsv(getInputValue("memory-tags")),
  });
  setPre("memory-output", payload);
}

async function deleteMemory(): Promise<void> {
  const memoryId = getInputValue("memory-id").trim();
  if (!memoryId) {
    throw new Error("Set Memory ID before deleting.");
  }
  const payload = await fetchJson(`/memory/entries/${memoryId}`, "DELETE");
  setPre("memory-output", payload);
}

async function searchMemory(): Promise<void> {
  const query = encodeURIComponent(getInputValue("memory-query"));
  const payload = await fetchJson(`/memory/entries?query=${query}`);
  setPre("memory-output", payload);
}

async function refreshConversations(): Promise<void> {
  const payload = await fetchJson("/conversation/sessions");
  setPre("conversations-output", payload);
}

async function createConversation(): Promise<void> {
  const providerPreference = getSelectValue("conversation-provider");
  const body = providerPreference
    ? {
        title: getInputValue("conversation-title"),
        providerPreference,
      }
    : {
        title: getInputValue("conversation-title"),
      };
  const payload = await fetchJson("/conversation/sessions", "POST", body);
  setPre("conversations-output", payload);
  if (payload && typeof payload === "object" && "id" in payload) {
    setInputValue("conversation-id", String((payload as { id: unknown }).id));
  }
  if (payload && typeof payload === "object" && "provider" in payload) {
    setInputValue("conversation-used-provider", String((payload as { provider: unknown }).provider));
  }
}

async function loadConversation(): Promise<void> {
  const conversationId = getInputValue("conversation-id").trim();
  if (!conversationId) {
    throw new Error("Set Conversation ID before loading.");
  }
  const payload = await fetchJson(`/conversation/sessions/${conversationId}`);
  setPre("conversations-output", payload);
  if (payload && typeof payload === "object" && "provider" in payload) {
    setInputValue("conversation-used-provider", String((payload as { provider: unknown }).provider));
  }
}

async function sendConversationMessage(): Promise<void> {
  const conversationId = getInputValue("conversation-id").trim();
  if (!conversationId) {
    throw new Error("Set Conversation ID before sending a message.");
  }
  const payload = await fetchJson(`/conversation/sessions/${conversationId}/messages`, "POST", {
    content: getTextareaValue("conversation-message"),
  });
  setPre("conversations-output", payload);
  if (payload && typeof payload === "object" && "usedProvider" in payload) {
    setInputValue("conversation-used-provider", String((payload as { usedProvider: unknown }).usedProvider));
  }
}

async function sendVoiceConversationMessage(content: string): Promise<void> {
  let conversationId = getInputValue("conversation-id").trim();
  if (!conversationId) {
    await createConversation();
    conversationId = getInputValue("conversation-id").trim();
  }

  const payload = await fetchJson(`/conversation/sessions/${conversationId}/messages`, "POST", {
    content,
  }) as { reply?: { content?: string }; usedProvider?: string };
  setPre("conversations-output", payload);
  if (payload.usedProvider) {
    setInputValue("conversation-used-provider", payload.usedProvider);
  }
  const replyText = payload.reply?.content ?? "";
  if (replyText) {
    speakText(replyText, getVoiceSettingsPayload());
  }
}

async function refreshCommands(): Promise<void> {
  const payload = await fetchJson("/commands");
  setPre("commands-output", payload);
}

async function executeCommand(): Promise<void> {
  const payload = await fetchJson("/commands/execute", "POST", {
    phrase: getInputValue("command-phrase"),
  });
  setPre("commands-output", payload);
}

async function refreshClientAssets(): Promise<void> {
  const payload = await fetchJson("/client/asset-manifest");
  setPre("client-assets-output", payload);
}

async function refreshReminders(): Promise<void> {
  const payload = await fetchJson("/reminders");
  setPre("reminders-output", payload);
}

async function createReminder(): Promise<void> {
  const payload = await fetchJson("/reminders", "POST", {
    title: getInputValue("reminder-title"),
    remindAt: getInputValue("reminder-remind-at"),
    details: getTextareaValue("reminder-details"),
    status: getSelectValue("reminder-status"),
  });
  setPre("reminders-output", payload);
  if (payload && typeof payload === "object" && "id" in payload) {
    setInputValue("reminder-id", String((payload as { id: unknown }).id));
  }
}

async function updateReminder(): Promise<void> {
  const reminderId = getInputValue("reminder-id").trim();
  if (!reminderId) {
    throw new Error("Set Reminder ID before updating.");
  }
  const payload = await fetchJson(`/reminders/${reminderId}`, "PATCH", {
    title: getInputValue("reminder-title"),
    remindAt: getInputValue("reminder-remind-at"),
    details: getTextareaValue("reminder-details"),
    status: getSelectValue("reminder-status"),
  });
  setPre("reminders-output", payload);
}

async function refreshParts(): Promise<void> {
  const payload = await fetchJson("/parts");
  setPre("parts-output", payload);
}

async function createPart(): Promise<void> {
  const payload = await fetchJson("/parts", "POST", {
    title: getInputValue("part-title"),
    sourceType: getSelectValue("part-source-type"),
    partNumber: getInputValue("part-number"),
    sourceUrl: getInputValue("part-source-url"),
    compatibilityNotes: getTextareaValue("part-compatibility-notes"),
    status: getSelectValue("part-status"),
  });
  setPre("parts-output", payload);
  if (payload && typeof payload === "object" && "id" in payload) {
    setInputValue("part-id", String((payload as { id: unknown }).id));
  }
}

async function updatePart(): Promise<void> {
  const partId = getInputValue("part-id").trim();
  if (!partId) {
    throw new Error("Set Part ID before updating.");
  }
  const payload = await fetchJson(`/parts/${partId}`, "PATCH", {
    title: getInputValue("part-title"),
    sourceType: getSelectValue("part-source-type"),
    partNumber: getInputValue("part-number"),
    sourceUrl: getInputValue("part-source-url"),
    compatibilityNotes: getTextareaValue("part-compatibility-notes"),
    status: getSelectValue("part-status"),
  });
  setPre("parts-output", payload);
}

async function refreshPrivateSession(): Promise<void> {
  assertMode("private", "Private session refresh");
  const payload = await fetchJson("/private/session");
  setPre("private-session-output", payload);
}

async function addPrivateSessionNote(): Promise<void> {
  assertMode("private", "Private session note");
  const payload = await fetchJson("/private/session/notes", "POST", {
    body: getTextareaValue("private-session-body"),
  });
  setPre("private-session-output", payload);
}

async function wipePrivateSession(): Promise<void> {
  assertMode("private", "Private session wipe");
  const payload = await fetchJson("/private/session/wipe", "POST");
  setPre("private-session-output", payload);
}

async function refreshCart(): Promise<void> {
  const payload = await fetchJson("/cart");
  setPre("cart-output", payload);
}

async function createCartItem(): Promise<void> {
  const payload = await fetchJson("/cart", "POST", {
    title: getInputValue("cart-title"),
    sourceUrl: getInputValue("cart-source-url"),
  });
  setPre("cart-output", payload);
  if (payload && typeof payload === "object" && "id" in payload) {
    setInputValue("cart-item-id", String((payload as { id: unknown }).id));
  }
}

async function requestCartApproval(): Promise<void> {
  assertMode("home_shop", "Cart approval request");
  const cartItemId = getInputValue("cart-item-id").trim();
  if (!cartItemId) {
    throw new Error("Set Cart Item ID before requesting approval.");
  }
  const payload = await fetchJson(`/cart/${cartItemId}/approve-request`, "POST");
  setPre("cart-output", payload);
  if (payload && typeof payload === "object" && "approval" in payload) {
    const approval = (payload as { approval: { id?: unknown } }).approval;
    if (approval?.id) {
      setInputValue("cart-approval-id", String(approval.id));
      setInputValue("approval-id", String(approval.id));
    }
  }
}

async function commitCartApproval(): Promise<void> {
  assertMode("home_shop", "Cart approval commit");
  const cartItemId = getInputValue("cart-item-id").trim();
  const approvalId = getInputValue("cart-approval-id").trim();
  if (!cartItemId) {
    throw new Error("Set Cart Item ID before committing approval.");
  }
  if (!approvalId) {
    throw new Error("Set Cart Approval ID before committing approval.");
  }
  const payload = await fetchJson(`/cart/${cartItemId}/approve-commit`, "POST", {
    approvalId,
  });
  setPre("cart-output", payload);
}

function assertMode(expectedMode: string, actionName: string): void {
  const mode = getSelectValue("mode");
  if (mode !== expectedMode) {
    throw new Error(`${actionName} requires mode '${expectedMode}'. Current mode is '${mode}'.`);
  }
}

function onClick(id: string, handler: () => Promise<void> | void): void {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Missing button #${id}`);
  }

  element.addEventListener("click", () => {
    if (!isInteractableButton(element)) {
      writeLog(`Skipped hidden or inactive button #${id}.`);
      return;
    }

    void Promise.resolve(handler()).catch((error: unknown) => {
      writeLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    });
  });
}

function isInteractableButton(element: HTMLButtonElement): boolean {
  if (!element.isConnected || element.disabled || element.hidden) {
    return false;
  }

  if (element.getClientRects().length === 0) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function getInputValue(id: string): string {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing input #${id}`);
  }

  return element.value;
}

function setInputValue(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element instanceof HTMLInputElement) {
    element.value = value;
  }
}

function setSelectValue(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element instanceof HTMLSelectElement) {
    element.value = value;
  }
}

function setCheckboxValue(id: string, value: boolean): void {
  const element = document.getElementById(id);
  if (element instanceof HTMLInputElement) {
    element.checked = value;
  }
}

function getTextareaValue(id: string): string {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error(`Missing textarea #${id}`);
  }

  return element.value;
}

function getSelectValue(id: string): string {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(`Missing select #${id}`);
  }

  return element.value;
}

function getCheckboxValue(id: string): boolean {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing checkbox #${id}`);
  }

  return element.checked;
}

function setText(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setPre(id: string, payload: unknown): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = formatJson(payload);
  }
}

function writeLog(message: string): void {
  setPre("response-log", message);
}

function writeVoiceLog(message: string): void {
  setPre("voice-log-output", {
    at: new Date().toISOString(),
    message,
    listening: voiceRuntime.listening,
    wakeArmed: voiceRuntime.wakeArmed,
    speaking: voiceRuntime.speaking,
  });
}

function formatJson(payload: unknown): string {
  return JSON.stringify(payload, null, 2);
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getVoiceSettingsPayload(): VoiceSettingsPayload {
  return {
    mode: getSelectValue("voice-mode") as VoiceSettingsPayload["mode"],
    wakeWord: getInputValue("voice-wake-word").trim().toLowerCase(),
    silenceTimeoutMs: Number.parseInt(getInputValue("voice-silence-timeout"), 10),
    autoResumeAfterResponse: getCheckboxValue("voice-auto-resume"),
    preferredTtsEngine: getSelectValue("voice-preferred-tts") as VoiceSettingsPayload["preferredTtsEngine"],
    fallbackTtsEngine: getSelectValue("voice-fallback-tts") as VoiceSettingsPayload["fallbackTtsEngine"],
    openAiVoice: getInputValue("voice-openai-voice").trim(),
    browserVoiceName: getSelectValue("voice-browser-voice") || undefined,
  };
}

async function saveVoiceSettingsForRuntime(): Promise<VoiceSettingsPayload> {
  const payload = getVoiceSettingsPayload();
  await fetchJson("/voice/settings", "PATCH", payload);
  const status = await fetchJson("/voice/status");
  setPre("voice-status-output", status);
  return payload;
}

function ensureSpeechRecognitionAvailable(): void {
  const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Constructor) {
    throw new Error("Speech recognition is not available in this browser.");
  }
}

function initializeRecognition(settings: VoiceSettingsPayload): void {
  if (voiceRuntime.recognition) {
    voiceRuntime.recognition.stop();
  }

  const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Constructor) {
    throw new Error("Speech recognition is not available in this browser.");
  }

  const recognition = new Constructor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    voiceRuntime.listening = true;
    writeVoiceLog(`Listening started in ${settings.mode} mode.`);
  };

  recognition.onend = () => {
    voiceRuntime.listening = false;
    if (voiceRuntime.speaking) {
      return;
    }

    if (settings.mode === "wake_word" && settings.autoResumeAfterResponse) {
      window.setTimeout(() => {
        if (!voiceRuntime.speaking) {
          try {
            recognition.start();
          } catch {
          }
        }
      }, 250);
    }
  };

  recognition.onerror = (event) => {
    writeVoiceLog(`Speech recognition error: ${event.error ?? "unknown"}`);
  };

  recognition.onresult = (event) => {
    let transcript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const alternative = result[0];
      if (alternative?.transcript) {
        transcript += `${alternative.transcript} `;
      }
    }

    const nextChunk = transcript.trim();
    if (!nextChunk) {
      return;
    }

    if (settings.mode === "wake_word") {
      handleWakeWordTranscript(nextChunk.toLowerCase(), settings);
      return;
    }

    voiceRuntime.conversationBuffer = nextChunk;
    scheduleVoiceSubmission(settings);
  };

  voiceRuntime.recognition = recognition;
}

function handleWakeWordTranscript(transcript: string, settings: VoiceSettingsPayload): void {
  const wakeWord = settings.wakeWord.trim().toLowerCase();
  if (!wakeWord) {
    return;
  }

  if (!voiceRuntime.wakeArmed) {
    voiceRuntime.wakeArmed = true;
  }

  if (transcript.includes(wakeWord)) {
    const afterWakeWord = transcript.slice(transcript.indexOf(wakeWord) + wakeWord.length).trim();
    if (afterWakeWord) {
      voiceRuntime.conversationBuffer = afterWakeWord;
      scheduleVoiceSubmission(settings);
    } else {
      writeVoiceLog(`Wake word heard: ${wakeWord}`);
    }
    return;
  }

  if (voiceRuntime.conversationBuffer) {
    voiceRuntime.conversationBuffer = `${voiceRuntime.conversationBuffer} ${transcript}`.trim();
  }
}

function scheduleVoiceSubmission(settings: VoiceSettingsPayload): void {
  clearVoiceSilenceTimer();
  const timeout = Number.isFinite(settings.silenceTimeoutMs) ? settings.silenceTimeoutMs : 6000;
  voiceRuntime.silenceTimer = window.setTimeout(() => {
    const content = voiceRuntime.conversationBuffer.trim();
    voiceRuntime.conversationBuffer = "";
    if (!content) {
      if (settings.mode === "push_to_talk") {
        voiceRuntime.recognition?.stop();
      }
      return;
    }

    writeVoiceLog(`Submitting voice message after ${timeout}ms silence: ${content}`);
    void sendVoiceConversationMessage(content);
    if (settings.mode === "push_to_talk") {
      voiceRuntime.recognition?.stop();
    }
  }, timeout);
}

function clearVoiceSilenceTimer(): void {
  if (voiceRuntime.silenceTimer !== null) {
    window.clearTimeout(voiceRuntime.silenceTimer);
    voiceRuntime.silenceTimer = null;
  }
}

interface VoiceSpeakOverrides {
  engineOverride?: "browser-speech-synthesis" | "openai-gpt-4o-mini-tts" | "openai-tts-1" | "openai-tts-1-hd";
  voiceOverride?: string;
  instructionsOverride?: string;
}

function speakText(text: string, settings: VoiceSettingsPayload, overrides?: VoiceSpeakOverrides): void {
  void speakTextAsync(text, settings, overrides);
}

async function speakTextAsync(text: string, settings: VoiceSettingsPayload, overrides?: VoiceSpeakOverrides): Promise<void> {
  const payload = await fetchJson("/voice/speak", "POST", { text, ...overrides }) as {
    engineUsed: string;
    fallbackUsed: boolean;
    audioBase64?: string;
    mimeType?: string;
    details: string;
  };

  if (payload.audioBase64 && payload.mimeType) {
    await playAudioBase64(payload.audioBase64, payload.mimeType, settings);
    return;
  }

  speakWithBrowserVoice(text, settings, payload.details);
}

function speakWithBrowserVoice(text: string, settings: VoiceSettingsPayload, details?: string): void {
  if (!("speechSynthesis" in window)) {
    writeVoiceLog("Speech synthesis is not available in this browser.");
    return;
  }

  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = getSelectedBrowserVoice(settings.browserVoiceName);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  utterance.rate = 0.94;
  utterance.pitch = 1.1;
  voiceRuntime.speaking = true;
  utterance.onstart = () => {
    writeVoiceLog(details ?? "Speaking response.");
  };
  utterance.onend = () => {
    voiceRuntime.speaking = false;
    writeVoiceLog("Finished speaking response.");
    if (settings.mode === "wake_word" && settings.autoResumeAfterResponse) {
      try {
        voiceRuntime.recognition?.start();
      } catch {
      }
    }
  };
  utterance.onerror = () => {
    voiceRuntime.speaking = false;
    writeVoiceLog("Speech synthesis failed.");
  };
  window.speechSynthesis.speak(utterance);
}

async function playAudioBase64(audioBase64: string, mimeType: string, settings: VoiceSettingsPayload): Promise<void> {
  stopSpeaking();
  voiceRuntime.speaking = true;
  writeVoiceLog("Playing OpenAI TTS response.");
  const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
  await new Promise<void>((resolve) => {
    audio.onended = () => {
      voiceRuntime.speaking = false;
      writeVoiceLog("Finished OpenAI TTS playback.");
      if (settings.mode === "wake_word" && settings.autoResumeAfterResponse) {
        try {
          voiceRuntime.recognition?.start();
        } catch {
        }
      }
      resolve();
    };
    audio.onerror = () => {
      voiceRuntime.speaking = false;
      writeVoiceLog("OpenAI TTS playback failed; using browser voice fallback.");
      speakWithBrowserVoice(textFromSettingsFallback(), settings);
      resolve();
    };
    void audio.play();
  });
}

function populateBrowserVoiceSelect(selectedName?: string): void {
  const element = document.getElementById("voice-browser-voice");
  if (!(element instanceof HTMLSelectElement) || !("speechSynthesis" in window)) {
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  element.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "system default";
  element.appendChild(defaultOption);
  for (const voice of voices) {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} [${voice.lang}]${voice.localService ? " (local)" : ""}`;
    if (selectedName && voice.name === selectedName) {
      option.selected = true;
    }
    element.appendChild(option);
  }
}

function getSelectedBrowserVoice(voiceName?: string): SpeechSynthesisVoice | undefined {
  if (!("speechSynthesis" in window)) {
    return undefined;
  }

  const voices = window.speechSynthesis.getVoices();
  if (voiceName) {
    const explicit = voices.find((voice) => voice.name === voiceName);
    if (explicit) {
      return explicit;
    }
  }

  return pickPreferredBrowserVoice(voices);
}

function pickPreferredBrowserVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (voices.length === 0) {
    return undefined;
  }

  const femininePatterns = [/sonia/i, /moira/i, /libby/i, /hazel/i, /susan/i, /serena/i, /female/i];
  const irishNamePatterns = [/irish/i, /ireland/i, /moira/i];

  for (const voice of voices) {
    const haystack = `${voice.name} ${voice.lang}`;
    if (/en[-_]ie/i.test(voice.lang) && (irishNamePatterns.some((pattern) => pattern.test(haystack)) || femininePatterns.some((pattern) => pattern.test(haystack)))) {
      return voice;
    }
  }
  for (const voice of voices) {
    if (/en[-_]ie/i.test(voice.lang)) {
      return voice;
    }
  }
  for (const voice of voices) {
    const haystack = `${voice.name} ${voice.lang}`;
    if (/en[-_]gb/i.test(voice.lang) && femininePatterns.some((pattern) => pattern.test(haystack))) {
      return voice;
    }
  }
  for (const voice of voices) {
    if (/en[-_]gb/i.test(voice.lang)) {
      return voice;
    }
  }

  return voices.find((voice) => voice.default) ?? voices[0];
}


function textFromSettingsFallback(): string {
  return "The cloud voice path failed, so Gail switched to the local browser voice.";
}

function stopSpeaking(): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  voiceRuntime.speaking = false;
}




