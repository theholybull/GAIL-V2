const fs = require('fs');
const path = 'F:/Gail/playcanvas-app/src/main.ts';
let text = fs.readFileSync(path, 'utf8');

function replaceOnce(from, to) {
  if (!text.includes(from)) throw new Error('Missing pattern: ' + from.slice(0, 80));
  text = text.replace(from, to);
}

replaceOnce(
  'import type { Mode, QualityTier } from "../../shared/contracts/index";',
  'import type { Mode, QualityTier, VoiceSettings } from "../../shared/contracts/index";'
);

replaceOnce(
  'let renderStatusText = "Renderer idle";\n',
  `let renderStatusText = "Renderer idle";
const speechRuntime: {
  settings?: VoiceSettings;
  speaking: boolean;
  talkLevel: number;
  speechText: string;
  audio?: HTMLAudioElement;
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
  sourceNode?: MediaElementAudioSourceNode;
  raf?: number;
  utterance?: SpeechSynthesisUtterance;
} = {
  settings: undefined,
  speaking: false,
  talkLevel: 0,
  speechText: "Hey Gail, this is a work-lite speech test.",
};
`
);

replaceOnce(
  '          <button id="reset-viewport-state" type="button" class="button-secondary">Reset Framing</button>\n          <button id="apply-client-state" type="button">Apply State</button>\n        </div>',
  `          <button id="reset-viewport-state" type="button" class="button-secondary">Reset Framing</button>
          <button id="apply-client-state" type="button">Apply State</button>
          <div class="voice-controls">
            <div class="voice-controls-label">Speech Test</div>
            <label>
              Speak Text
              <textarea id="voice-speak-text" rows="4">${'${escapeHtml(speechRuntime.speechText)}'}</textarea>
            </label>
            <div class="voice-button-row">
              <button id="speak-avatar" type="button">Speak</button>
              <button id="stop-avatar-speech" type="button" class="button-secondary">Stop</button>
            </div>
          </div>
        </div>`
);

replaceOnce(
  '  applyButton.addEventListener("click", () => {\n    applyViewportValues(false);\n  });\n',
  `  applyButton.addEventListener("click", () => {
    applyViewportValues(false);
  });

  const speakButton = root.querySelector<HTMLButtonElement>("#speak-avatar");
  const stopSpeakButton = root.querySelector<HTMLButtonElement>("#stop-avatar-speech");
  speakButton?.addEventListener("click", () => {
    speechRuntime.speechText = getTextAreaValue("voice-speak-text").trim() || speechRuntime.speechText;
    void speakAvatarText(speechRuntime.speechText);
  });
  stopSpeakButton?.addEventListener("click", () => {
    stopAvatarSpeech();
  });
`
);

replaceOnce(
  '  let loadedModuleCount = 0;\n  let avatarBoundsSummary = "avatar not loaded";\n  let avatarRenderComponentCount = 0;\n  let orientationSummary = "orientation pending";\n\n  let framedPosition = { x: 0, y: 0, z: 0 };\n  let framedScale = 1;\n  let baseSkeletonRoot: any | undefined;\n',
  `  let loadedModuleCount = 0;
  let avatarBoundsSummary = "avatar not loaded";
  let avatarRenderComponentCount = 0;
  let orientationSummary = "orientation pending";
  let talkStatusSummary = "speech idle";

  let framedPosition = { x: 0, y: 0, z: 0 };
  let framedScale = 1;
  let baseSkeletonRoot: any | undefined;
  let jawBone: any | undefined;
  let headBone: any | undefined;
  let neckBone: any | undefined;
  let talkAmount = 0;
  let talkClock = 0;
`
);

replaceOnce(
  '    baseSkeletonRoot = findSkeletonRoot(baseAvatarEntity);\n    rebindEntityRenderRootBone(baseAvatarEntity, baseSkeletonRoot);\n',
  `    baseSkeletonRoot = findSkeletonRoot(baseAvatarEntity);
    rebindEntityRenderRootBone(baseAvatarEntity, baseSkeletonRoot);
    jawBone = findEntityByName(baseAvatarEntity, "lowerJaw") ?? findEntityByName(baseAvatarEntity, "BelowJaw");
    headBone = findEntityByName(baseAvatarEntity, "head");
    neckBone = findEntityByName(baseAvatarEntity, "neckUpper") ?? findEntityByName(baseAvatarEntity, "neckLower");
`
);

replaceOnce(
  '  app.on("update", (dt: number) => {\n',
  `  const postUpdateHandler = (dt: number) => {
    talkClock += dt;
    const targetTalk = speechRuntime.speaking ? Math.max(0.18, speechRuntime.talkLevel) : 0;
    talkAmount += (targetTalk - talkAmount) * Math.min(1, dt * 10);
    const pulse = talkAmount > 0.001 ? (0.55 + 0.45 * Math.sin(talkClock * 18)) * talkAmount : 0;
    if (jawBone?.getLocalEulerAngles) {
      const jawAngles = jawBone.getLocalEulerAngles();
      jawBone.setLocalEulerAngles(jawAngles.x + pulse * 12, jawAngles.y, jawAngles.z);
    }
    if (headBone?.getLocalEulerAngles) {
      const headAngles = headBone.getLocalEulerAngles();
      headBone.setLocalEulerAngles(headAngles.x + pulse * 1.8, headAngles.y, headAngles.z + pulse * 0.8);
    }
    if (neckBone?.getLocalEulerAngles) {
      const neckAngles = neckBone.getLocalEulerAngles();
      neckBone.setLocalEulerAngles(neckAngles.x + pulse * 1.2, neckAngles.y, neckAngles.z);
    }
    talkStatusSummary = speechRuntime.speaking ? \`speech active ${'${formatNumber(pulse)}'}\` : "speech idle";
  };
  app.systems.on("postUpdate", postUpdateHandler);

  app.on("update", (dt: number) => {
`
);

replaceOnce(
  '      `Avatar preview running. Device ${deviceType}. Modules ${loadedModuleCount}/${1 + renderableModuleAssets.length}. Avatar renders ${avatarRenderComponentCount}. World mesh instances: ${worldMeshCount}. Layer cameras world/immediate: ${worldCameraCount}/${immediateCameraCount}. ${latestRenderStats}. ${orientationSummary}. ${avatarBoundsSummary}. Canvas ${canvas.clientWidth}x${canvas.clientHeight}`,\n',
  '      `Avatar preview running. Device ${deviceType}. Modules ${loadedModuleCount}/${1 + renderableModuleAssets.length}. Avatar renders ${avatarRenderComponentCount}. World mesh instances: ${worldMeshCount}. Layer cameras world/immediate: ${worldCameraCount}/${immediateCameraCount}. ${latestRenderStats}. ${orientationSummary}. ${avatarBoundsSummary}. ${talkStatusSummary}. Canvas ${canvas.clientWidth}x${canvas.clientHeight}`,\n'
);

replaceOnce(
  '    destroy: () => {\n      window.removeEventListener("resize", resize);\n      app.destroy();\n    },\n',
  `    destroy: () => {
      window.removeEventListener("resize", resize);
      app.systems.off("postUpdate", postUpdateHandler);
      app.destroy();
    },
`
);

replaceOnce(
  'function getInputValue(id: string): string {\n',
  `function getTextAreaValue(id: string): string {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error(\`Missing textarea #${'${id}'}\`);
  }

  return element.value;
}

function getInputValue(id: string): string {
`
);

text += `
async function loadVoiceSettings(): Promise<VoiceSettings> {
  if (speechRuntime.settings) {
    return speechRuntime.settings;
  }
  const response = await fetch("/voice/settings");
  if (!response.ok) {
    throw new Error(\`Voice settings request failed with ${'${response.status}'}\`);
  }
  const settings = await response.json() as VoiceSettings;
  speechRuntime.settings = settings;
  return settings;
}

async function speakAvatarText(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  stopAvatarSpeech();
  const settings = await loadVoiceSettings();
  const response = await fetch("/voice/speak", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: trimmed }),
  });
  if (!response.ok) {
    throw new Error(\`Voice speak request failed with ${'${response.status}'}\`);
  }
  const payload = await response.json() as {
    engineUsed: string;
    mimeType?: string;
    audioBase64?: string;
    details?: string;
  };

  if (payload.audioBase64 && payload.mimeType) {
    playAudioBase64(payload.audioBase64, payload.mimeType);
    return;
  }

  speakWithBrowserVoice(trimmed, settings);
}

function playAudioBase64(audioBase64: string, mimeType: string): void {
  stopAvatarSpeech();
  const audio = new Audio(\`data:${'${mimeType}'};base64,${'${audioBase64}'}\`);
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

  const data = new Uint8Array(analyser.frequencyBinCount);
  const tick = () => {
    if (!speechRuntime.speaking || !speechRuntime.analyser) {
      return;
    }
    speechRuntime.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      sum += Math.abs(data[i] - 128);
    }
    speechRuntime.talkLevel = Math.min(1, (sum / data.length) / 18);
    speechRuntime.raf = window.requestAnimationFrame(tick);
  };

  audio.addEventListener("ended", () => {
    stopAvatarSpeech();
  });
  audio.addEventListener("error", () => {
    stopAvatarSpeech();
  });
  void audioContext.resume().catch(() => undefined);
  void audio.play().catch(() => {
    stopAvatarSpeech();
  });
  tick();
}

function speakWithBrowserVoice(text: string, settings: VoiceSettings): void {
  stopAvatarSpeech();
  if (!("speechSynthesis" in window)) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = getSelectedBrowserVoice(settings.browserVoiceName);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  utterance.onstart = () => {
    speechRuntime.speaking = true;
  };
  utterance.onboundary = () => {
    speechRuntime.talkLevel = 0.9;
  };
  utterance.onend = () => {
    stopAvatarSpeech();
  };
  utterance.onerror = () => {
    stopAvatarSpeech();
  };
  speechRuntime.utterance = utterance;
  speechRuntime.speaking = true;
  window.speechSynthesis.speak(utterance);
}

function getSelectedBrowserVoice(voiceName?: string): SpeechSynthesisVoice | undefined {
  if (!voiceName || !("speechSynthesis" in window)) {
    return undefined;
  }
  return window.speechSynthesis.getVoices().find((voice) => voice.name === voiceName);
}

function stopAvatarSpeech(): void {
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
  if (speechRuntime.utterance && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    speechRuntime.utterance = undefined;
  }
  speechRuntime.speaking = false;
  speechRuntime.talkLevel = 0;
}
`;

fs.writeFileSync(path, text);
