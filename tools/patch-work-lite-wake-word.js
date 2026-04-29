/**
 * Patches work-lite-rebuild.ts on disk to add wake-word speech recognition.
 * Run: node tools/patch-work-lite-wake-word.js
 */
const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "..", "playcanvas-app", "src", "work-lite-rebuild.ts");
let src = fs.readFileSync(filePath, "utf8");
// Normalize to LF for matching, restore CRLF at the end
const originalHasCrlf = src.includes("\r\n");
src = src.replace(/\r\n/g, "\n");

function replace(oldStr, newStr) {
  if (!src.includes(oldStr)) {
    throw new Error("PATCH FAILED: could not find:\n" + oldStr.slice(0, 120));
  }
  const count = src.split(oldStr).length - 1;
  if (count !== 1) {
    throw new Error(`PATCH FAILED: expected 1 occurrence, found ${count} for:\n` + oldStr.slice(0, 120));
  }
  src = src.replace(oldStr, newStr);
}

// 1. Add speech recognition types after ConversationMessageResponse
replace(
`type ConversationMessageResponse = {
  session?: {
    messages?: Array<{ role: string; content: string }>;
  };
  reply?: {
    content?: string;
  };
};`,
`type ConversationMessageResponse = {
  session?: {
    messages?: Array<{ role: string; content: string }>;
  };
  reply?: {
    content?: string;
  };
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
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEventLike) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognitionInstance;`
);

// 2. Add WorkLiteVoiceRuntime type after WorkLiteSpeechState
replace(
`  talkLevel: number;
  engineLabel: string;
};

const DEFAULT_ASSET_ROOT`,
`  talkLevel: number;
  engineLabel: string;
};

type WorkLiteVoiceRuntime = {
  supported: boolean;
  active: boolean;
  recognition?: BrowserSpeechRecognitionInstance;
  conversationBuffer: string;
  silenceTimer?: number;
  lastTranscript: string;
  lastError?: string;
  retryBlocked: boolean;
  awaitingAssistant: boolean;
};

const DEFAULT_ASSET_ROOT`
);

// 3. Add voiceRuntime const after state declaration
replace(
`  avatarMotionSummary: "loading",
};

type StageRuntime`,
`  avatarMotionSummary: "loading",
};

const voiceRuntime: WorkLiteVoiceRuntime = {
  supported: Boolean(getSpeechRecognitionConstructor()),
  active: false,
  recognition: undefined,
  conversationBuffer: "",
  silenceTimer: undefined,
  lastTranscript: "",
  lastError: undefined,
  retryBlocked: false,
  awaitingAssistant: false,
};

type StageRuntime`
);

// 4. Add voice loop calls in boot()
replace(
`  startVoiceSettingsSync();
  await bootStage(root);
}`,
`  startVoiceSettingsSync();
  syncVoiceRuntimeUi();
  void ensureWorkLiteVoiceLoopState("boot");
  await bootStage(root);
}`
);

// 5. Add Restart Voice button in render()
replace(
`          <div class="status-pill">\${escapeHtml(state.status)}</div>
        </div>
      </header>`,
`          <button id="voice-loop-restart" type="button" class="secondary">Restart Voice</button>
          <div class="status-pill">\${escapeHtml(state.status)}</div>
        </div>
      </header>`
);

// 6. Add voice-runtime-note div above chat-log
replace(
`            <div id="chat-log" class="chat-log"></div>
            <form id="chat-form" class="chat-form">`,
`            <div id="voice-runtime-note" class="voice-follow-note">\${escapeHtml(formatVoiceRuntimeNote())}</div>
            <div id="chat-log" class="chat-log"></div>
            <form id="chat-form" class="chat-form">`
);

// 7. Add voiceLoopRestartButton in wireUi and replace inline submit handler
replace(
`  const localVoiceToggle = root.querySelector<HTMLInputElement>("#local-voice-toggle");
  const runMotionTestButton = root.querySelector<HTMLButtonElement>("#run-motion-test");

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
    appendChatMessage("user", message);
    state.conversationPending = true;
    stageRuntime?.mechanics?.setListening(true);
    syncStatus("Sending message...");
    try {
      const sessionId = await ensureConversationSession();
      const reply = await postConversationMessage(sessionId, message);
      appendChatMessage("assistant", reply);
      stageRuntime?.mechanics?.pulseAck();
      stageRuntime?.mechanics?.speakText(reply);
      syncStatus(state.sceneReady ? "Scene ready" : state.status);
    } catch (error) {
      appendChatMessage("system", \`Chat error: \${error instanceof Error ? error.message : String(error)}\`);
      syncStatus("Chat error");
    } finally {
      state.conversationPending = false;
      stageRuntime?.mechanics?.setListening(false);
    }
  });`,
`  const localVoiceToggle = root.querySelector<HTMLInputElement>("#local-voice-toggle");
  const voiceLoopRestartButton = root.querySelector<HTMLButtonElement>("#voice-loop-restart");
  const runMotionTestButton = root.querySelector<HTMLButtonElement>("#run-motion-test");

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
    await sendWorkLiteMessage(message, "typed");
  });`
);

// 8. Add voiceLoopRestartButton event listener after localVoiceToggle handler
replace(
`    } finally {
      localVoiceToggle.disabled = false;
    }
  });
}`,
`    } finally {
      localVoiceToggle.disabled = false;
    }
  });

  voiceLoopRestartButton?.addEventListener("click", () => {
    voiceRuntime.retryBlocked = false;
    voiceRuntime.lastError = undefined;
    stopWorkLiteVoiceLoop();
    void ensureWorkLiteVoiceLoopState("manual restart");
  });
}`
);

// 9. Add "Voice input" row to renderShellStateItems
replace(
`    ["Voice mode", voiceModeText],
    ["Auto resume",`,
`    ["Voice mode", voiceModeText],
    ["Voice input", formatVoiceInputState()],
    ["Auto resume",`
);

// 10. Add syncVoiceRuntimeUi and related functions after syncShellStatePanel
replace(
`function syncAvatarMotionOverlay`,
`function syncVoiceRuntimeUi(): void {
  const note = document.querySelector<HTMLElement>("#voice-runtime-note");
  if (note) {
    note.textContent = formatVoiceRuntimeNote();
  }
  const button = document.querySelector<HTMLButtonElement>("#voice-loop-restart");
  if (button) {
    button.disabled = !voiceRuntime.supported || state.conversationPending;
  }
  syncShellStatePanel();
}

function syncAvatarMotionOverlay`
);

// 11. Add voice runtime helper functions after formatVoiceFollowNote
replace(
`function startVoiceSettingsSync`,
`function formatVoiceInputState(): string {
  if (!voiceRuntime.supported) {
    return "unavailable | browser speech recognition missing";
  }
  if (voiceRuntime.awaitingAssistant) {
    return "paused | Gail is responding";
  }
  if (!isContinuousVoiceMode()) {
    return \`idle | mode \${state.voiceMode}\`;
  }
  if (voiceRuntime.active) {
    return state.voiceMode === "wake_word"
      ? \`listening | wake word \${state.wakeWord}\`
      : "listening | always listening";
  }
  if (voiceRuntime.retryBlocked) {
    return \`blocked | \${voiceRuntime.lastError ?? "microphone permission required"}\`;
  }
  if (voiceRuntime.lastError) {
    return \`retrying | \${voiceRuntime.lastError}\`;
  }
  return "idle | ready to restart voice";
}

function formatVoiceRuntimeNote(): string {
  if (!voiceRuntime.supported) {
    return "Wake word is unavailable in this browser because SpeechRecognition is not exposed.";
  }
  if (voiceRuntime.awaitingAssistant) {
    return "Wake word is paused while Gail speaks. It will resume after the reply if auto resume is enabled.";
  }
  if (!isContinuousVoiceMode()) {
    return \`Wake word is idle because the shell voice mode is \${state.voiceMode}.\`;
  }
  if (voiceRuntime.active) {
    return state.voiceMode === "wake_word"
      ? \`Wake word listening for "\${state.wakeWord}".\`
      : "Voice loop is listening continuously.";
  }
  if (voiceRuntime.retryBlocked) {
    return \`Wake word could not start: \${voiceRuntime.lastError ?? "microphone access was blocked"}. Use Restart Voice after allowing mic access.\`;
  }
  if (voiceRuntime.lastTranscript) {
    return \`Wake word is idle. Last transcript: \${voiceRuntime.lastTranscript}\`;
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
    let transcript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (result[0]?.transcript) {
        transcript += \`\${result[0].transcript} \`;
      }
    }
    const nextChunk = transcript.trim();
    if (!nextChunk) {
      return;
    }
    voiceRuntime.lastTranscript = nextChunk;
    if (state.voiceMode === "wake_word") {
      handleWorkLiteWakeWordTranscript(nextChunk.toLowerCase());
    } else {
      voiceRuntime.conversationBuffer = nextChunk;
      scheduleWorkLiteVoiceSubmission();
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
    console.warn(\`work-lite voice loop failed to start during \${reason}\`, error);
    syncVoiceRuntimeUi();
  }
}

function stopWorkLiteVoiceLoop(): void {
  clearWorkLiteVoiceSilenceTimer();
  voiceRuntime.conversationBuffer = "";
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

function handleWorkLiteWakeWordTranscript(transcript: string): void {
  const wakeWord = state.wakeWord.trim().toLowerCase();
  if (!wakeWord) {
    return;
  }
  if (transcript.includes(wakeWord)) {
    const afterWakeWord = transcript.slice(transcript.indexOf(wakeWord) + wakeWord.length).trim();
    if (afterWakeWord) {
      voiceRuntime.conversationBuffer = afterWakeWord;
      scheduleWorkLiteVoiceSubmission();
    }
    return;
  }
  if (voiceRuntime.conversationBuffer) {
    voiceRuntime.conversationBuffer = \`\${voiceRuntime.conversationBuffer} \${transcript}\`.trim();
  }
}

function scheduleWorkLiteVoiceSubmission(): void {
  clearWorkLiteVoiceSilenceTimer();
  const timeout = Number.isFinite(state.silenceTimeoutMs) ? state.silenceTimeoutMs : 2600;
  voiceRuntime.silenceTimer = window.setTimeout(() => {
    const content = voiceRuntime.conversationBuffer.trim();
    voiceRuntime.conversationBuffer = "";
    voiceRuntime.silenceTimer = undefined;
    if (!content || state.conversationPending) {
      syncVoiceRuntimeUi();
      return;
    }
    void sendWorkLiteMessage(content, "voice");
  }, timeout);
}

function startVoiceSettingsSync`
);

// 12. Add syncVoiceRuntimeUi() and ensureWorkLiteVoiceLoopState() calls in settings sync refresh
replace(
`      syncVoiceToggleUi(state.preferLocalVoice);
    } catch {
    }
  };`,
`      syncVoiceToggleUi(state.preferLocalVoice);
      syncVoiceRuntimeUi();
      void ensureWorkLiteVoiceLoopState("settings sync");
    } catch {
    }
  };`
);

// 13. Add sendWorkLiteMessage function after ensureConversationSession/postConversationMessage
replace(
`  state.conversationSessionId = payload.id;
  return payload.id;
}

async function postConversationMessage`,
`  state.conversationSessionId = payload.id;
  return payload.id;
}

async function sendWorkLiteMessage(content: string, origin: "typed" | "voice"): Promise<void> {
  const message = content.trim();
  if (!message || state.conversationPending) {
    return;
  }

  clearWorkLiteVoiceSilenceTimer();
  voiceRuntime.awaitingAssistant = isContinuousVoiceMode() && state.autoResumeAfterResponse;
  stopWorkLiteVoiceLoop();
  appendChatMessage("user", message);
  state.conversationPending = true;
  syncVoiceRuntimeUi();
  syncStatus(origin === "voice" ? "Sending voice message..." : "Sending message...");

  try {
    const sessionId = await ensureConversationSession();
    const reply = await postConversationMessage(sessionId, message);
    appendChatMessage("assistant", reply);
    stageRuntime?.mechanics?.pulseAck();
    const speechPromise = stageRuntime?.mechanics?.speakText(reply);
    if (speechPromise) {
      void speechPromise.finally(() => {
        voiceRuntime.awaitingAssistant = false;
        syncVoiceRuntimeUi();
        void ensureWorkLiteVoiceLoopState("assistant speech finished");
      });
    } else {
      voiceRuntime.awaitingAssistant = false;
    }
    syncStatus(state.sceneReady ? "Scene ready" : state.status);
  } catch (error) {
    voiceRuntime.awaitingAssistant = false;
    appendChatMessage("system", \`Chat error: \${error instanceof Error ? error.message : String(error)}\`);
    syncStatus("Chat error");
  } finally {
    state.conversationPending = false;
    syncVoiceRuntimeUi();
    if (!voiceRuntime.awaitingAssistant) {
      void ensureWorkLiteVoiceLoopState("message complete");
    }
  }
}

async function postConversationMessage`
);

// 14. Add getSpeechRecognitionConstructor after stopWorkLiteSpeech
replace(
`  speechState.engineLabel = "idle";
}

async function fetchJson`,
`  speechState.engineLabel = "idle";
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

async function fetchJson`
);

// Restore CRLF if original had it
if (originalHasCrlf) {
  src = src.replace(/\n/g, "\r\n");
}
fs.writeFileSync(filePath, src);
console.log("Patch applied successfully.");
console.log("Lines:", src.split("\n").length, "Size:", src.length);
console.log("Has voiceRuntime:", src.includes("voiceRuntime"));
console.log("Has ensureWorkLiteVoiceLoopState:", src.includes("ensureWorkLiteVoiceLoopState"));
console.log("Has getSpeechRecognitionConstructor:", src.includes("getSpeechRecognitionConstructor"));
console.log("Has sendWorkLiteMessage:", src.includes("sendWorkLiteMessage"));
console.log("Has voice-loop-restart:", src.includes("voice-loop-restart"));
