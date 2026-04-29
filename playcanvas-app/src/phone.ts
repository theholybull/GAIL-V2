export {};

type ChatRole = "user" | "assistant" | "status";

interface ConversationMessageResponse {
  session?: {
    messages?: Array<{ role: string; content: string }>;
  };
  reply?: {
    content?: string;
  };
}

interface PhoneAvatarRuntime {
  setState: (state: "idle" | "talk" | "listen") => void;
}

const BASE_AVATAR_URL = "/client-assets/gail/avatar/base_face/gail_base_avatar.glb";
const IDLE_ANIMATION_URL = "/client-assets/animations/27775_stand_still.glb";
const TALK_ANIMATION_URL = "/client-assets/animations/28154_explain.glb";
const LISTEN_ANIMATION_URL = "/client-assets/animations/27299_stand_and_nod.glb";

const canvasElement = document.querySelector<HTMLCanvasElement>("#phone-avatar-canvas");
const chatShellElement = document.querySelector<HTMLElement>("#phone-chat-shell");
const chatToggleButtonElement = document.querySelector<HTMLButtonElement>("#phone-chat-toggle");
const chatLogElement = document.querySelector<HTMLElement>("#phone-chat-log");
const chatFormElement = document.querySelector<HTMLFormElement>("#phone-chat-form");
const chatInputElement = document.querySelector<HTMLTextAreaElement>("#phone-chat-input");
const chatSendElement = document.querySelector<HTMLButtonElement>("#phone-chat-send");

if (
  !canvasElement ||
  !chatShellElement ||
  !chatToggleButtonElement ||
  !chatLogElement ||
  !chatFormElement ||
  !chatInputElement ||
  !chatSendElement
) {
  throw new Error("Phone client is missing required DOM elements.");
}

const avatarCanvas = canvasElement;
const chatShell = chatShellElement;
const chatToggleButton = chatToggleButtonElement;
const chatLog = chatLogElement;
const chatForm = chatFormElement;
const chatInput = chatInputElement;
const chatSend = chatSendElement;

let sessionId: string | undefined;
let pending = false;
let fullscreenChat = false;
let avatarRuntime: PhoneAvatarRuntime | undefined;

void bootPhoneClient();

async function bootPhoneClient(): Promise<void> {
  appendMessage("status", "Phone client ready.");
  avatarRuntime = await bootAvatarScene(avatarCanvas);
  avatarRuntime.setState("idle");
  wireUiEvents();
}

function wireUiEvents(): void {
  chatToggleButton.addEventListener("click", () => {
    fullscreenChat = !fullscreenChat;
    chatShell.classList.toggle("chat-fullscreen", fullscreenChat);
    chatToggleButton.textContent = fullscreenChat ? "Avatar View" : "Full Chat";
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending) {
      return;
    }

    const text = chatInput.value.trim();
    if (!text) {
      return;
    }

    chatInput.value = "";
    appendMessage("user", text);
    chatSend.disabled = true;
    pending = true;
    avatarRuntime?.setState("listen");

    try {
      const activeSessionId = await ensureSession();
      avatarRuntime?.setState("talk");
      appendMessage("status", "Gail is responding...");
      const reply = await postMessage(activeSessionId, text);
      appendMessage("assistant", reply);
      avatarRuntime?.setState("idle");
    } catch (error) {
      avatarRuntime?.setState("idle");
      const message = error instanceof Error ? error.message : "Unable to complete request.";
      appendMessage("status", `Chat error: ${message}`);
    } finally {
      pending = false;
      chatSend.disabled = false;
      chatInput.focus();
    }
  });
}

function appendMessage(role: ChatRole, text: string): void {
  const row = document.createElement("div");
  row.className = `chat-message ${role}`;
  row.textContent = text;
  chatLog.append(row);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function ensureSession(): Promise<string> {
  if (sessionId) {
    return sessionId;
  }

  const response = await fetch("/conversation/sessions", {
    method: "POST",
    headers: getClientRequestHeaders(true),
    body: JSON.stringify({
      title: "Phone client chat",
      providerPreference: "openai",
    }),
  });

  if (!response.ok) {
    throw new Error(`Session creation failed (${response.status}).`);
  }

  const payload = await response.json() as { id: string };
  if (!payload.id) {
    throw new Error("Session creation response did not include an id.");
  }
  sessionId = payload.id;
  return sessionId;
}

async function postMessage(activeSessionId: string, content: string): Promise<string> {
  const response = await fetch(`/conversation/sessions/${activeSessionId}/messages`, {
    method: "POST",
    headers: getClientRequestHeaders(true),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`Message send failed (${response.status}).`);
  }

  const payload = await response.json() as ConversationMessageResponse;
  const directReply = payload.reply?.content?.trim();
  if (directReply) {
    return directReply;
  }

  const fallbackReply = payload.session?.messages
    ?.slice()
    .reverse()
    .find((message) => message.role === "assistant" && typeof message.content === "string")
    ?.content
    ?.trim();

  return fallbackReply || "Response received with no assistant text.";
}

function getClientRequestHeaders(includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {
    "x-gail-device-id": "phone-client-iphone15promax",
    "x-gail-device-type": "iphone",
    "x-gail-mode": "shared",
  };
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function bootAvatarScene(targetCanvas: HTMLCanvasElement): Promise<PhoneAvatarRuntime> {
  const playcanvasUrl = "/vendor/playcanvas/build/playcanvas.mjs";
  const pc: any = await import(playcanvasUrl);

  const app = new pc.Application(targetCanvas, {
    graphicsDeviceOptions: {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: false,
    },
  });

  app.setCanvasFillMode(pc.FILLMODE_NONE);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.start();

  const camera = new pc.Entity("phone-camera");
  camera.addComponent("camera", {
    clearColor: new pc.Color(0.055, 0.065, 0.09, 1),
    nearClip: 0.1,
    farClip: 80,
    fov: 44,
  });
  app.root.addChild(camera);

  const key = new pc.Entity("phone-key-light");
  key.addComponent("light", {
    type: "directional",
    color: new pc.Color(0.95, 0.95, 0.98),
    intensity: 1.15,
    castShadows: false,
  });
  key.setEulerAngles(40, 25, 0);
  app.root.addChild(key);

  const fill = new pc.Entity("phone-fill-light");
  fill.addComponent("light", {
    type: "omni",
    color: new pc.Color(0.28, 0.4, 0.75),
    intensity: 0.35,
    range: 8,
    castShadows: false,
  });
  fill.setLocalPosition(-1.4, 1.8, 2.6);
  app.root.addChild(fill);

  const avatarRoot = new pc.Entity("phone-avatar-root");
  app.root.addChild(avatarRoot);

  const avatarEntity = await loadContainerEntity(pc, app, "phone-fallback-avatar", BASE_AVATAR_URL);
  avatarRoot.addChild(avatarEntity);
  avatarRoot.setLocalPosition(0, -1.24, 0);
  avatarRoot.setLocalScale(1.16, 1.16, 1.16);
  dimEntitySpecular(avatarEntity);

  const animationTracks: Record<"idle" | "talk" | "listen", any | undefined> = {
    idle: undefined,
    talk: undefined,
    listen: undefined,
  };
  animationTracks.idle = await loadAnimationTrack(pc, app, "phone-idle", IDLE_ANIMATION_URL);
  animationTracks.talk = await loadAnimationTrack(pc, app, "phone-talk", TALK_ANIMATION_URL);
  animationTracks.listen = await loadAnimationTrack(pc, app, "phone-listen", LISTEN_ANIMATION_URL);
  animationTracks.talk = animationTracks.talk ?? animationTracks.idle;
  animationTracks.listen = animationTracks.listen ?? animationTracks.idle;

  let animComponent: any;
  if (animationTracks.idle) {
    avatarEntity.addComponent("anim", {
      activate: true,
      speed: 1,
    });
    animComponent = avatarEntity.anim;
    if (animComponent) {
      const skeletonRoot = findEntityByName(avatarEntity, "hip") ?? avatarEntity;
      animComponent.rootBone = skeletonRoot;
      animComponent.assignAnimation("idle", animationTracks.idle);
      animComponent.assignAnimation("talk", animationTracks.talk);
      animComponent.assignAnimation("listen", animationTracks.listen);
      animComponent.baseLayer?.play("idle");
      animComponent.rebind?.();
    }
  }

  const orbit = createOrbitController(targetCanvas);
  const resize = () => {
    const width = Math.max(1, targetCanvas.clientWidth || window.innerWidth);
    const height = Math.max(1, targetCanvas.clientHeight || window.innerHeight);
    targetCanvas.style.width = `${width}px`;
    targetCanvas.style.height = `${height}px`;
    app.resizeCanvas(width, height);
  };
  resize();
  window.addEventListener("resize", resize);

  app.on("update", (dt: number) => {
    orbit.tick(dt);
    const pivot = orbit.pivot;
    const yawRad = (orbit.yaw * Math.PI) / 180;
    const pitchRad = (orbit.pitch * Math.PI) / 180;
    const radius = orbit.distance;
    const horizontal = Math.cos(pitchRad) * radius;
    const x = pivot.x + Math.sin(yawRad) * horizontal;
    const y = pivot.y + Math.sin(pitchRad) * radius;
    const z = pivot.z + Math.cos(yawRad) * horizontal;
    camera.setPosition(x, y, z);
    camera.lookAt(pivot);
  });

  return {
    setState(state: "idle" | "talk" | "listen") {
      if (!animComponent?.baseLayer) {
        return;
      }
      animComponent.baseLayer.transition(state, 0.17);
    },
  };
}

function createOrbitController(canvasElement: HTMLCanvasElement): {
  yaw: number;
  pitch: number;
  distance: number;
  pivot: { x: number; y: number; z: number };
  tick: (dt: number) => void;
} {
  const pivot = { x: 0, y: 1.05, z: 0 };
  let yaw = 0;
  let pitch = -3;
  let yawTarget = 0;
  let pitchTarget = -3;
  let dragPointerId: number | undefined;
  let lastX = 0;
  let lastY = 0;

  canvasElement.addEventListener("pointerdown", (event) => {
    dragPointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    canvasElement.setPointerCapture(event.pointerId);
  });

  canvasElement.addEventListener("pointermove", (event) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    yawTarget -= dx * 0.19;
    pitchTarget -= dy * 0.12;
    pitchTarget = Math.max(-22, Math.min(18, pitchTarget));
  });

  const release = (event: PointerEvent) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }
    dragPointerId = undefined;
    canvasElement.releasePointerCapture(event.pointerId);
  };

  canvasElement.addEventListener("pointerup", release);
  canvasElement.addEventListener("pointercancel", release);
  canvasElement.addEventListener("pointerleave", release);

  return {
    get yaw() {
      return yaw;
    },
    get pitch() {
      return pitch;
    },
    distance: 2.35,
    pivot,
    tick(dt: number) {
      const blend = Math.min(1, dt * 10);
      yaw += (yawTarget - yaw) * blend;
      pitch += (pitchTarget - pitch) * blend;
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
): Promise<any> {
  const asset = new pc.Asset(name, "container", { url });
  app.assets.add(asset);

  await new Promise<void>((resolve, reject) => {
    asset.ready(() => resolve());
    asset.once("error", (error: unknown) => reject(error));
    app.assets.load(asset);
  });

  return asset.resource.instantiateRenderEntity();
}

async function loadAnimationTrack(
  pc: any,
  app: {
    assets: {
      add: (asset: unknown) => void;
      load: (asset: unknown) => void;
    };
  },
  name: string,
  url: string,
): Promise<any | undefined> {
  const asset = new pc.Asset(name, "container", { url });
  app.assets.add(asset);

  try {
    await new Promise<void>((resolve, reject) => {
      asset.ready(() => resolve());
      asset.once("error", (error: unknown) => reject(error));
      app.assets.load(asset);
    });
    return asset?.resource?.animations?.[0]?.resource;
  } catch {
    return undefined;
  }
}

function dimEntitySpecular(entity: any): void {
  if (!entity?.findComponents) {
    return;
  }
  const renders = entity.findComponents("render") as Array<{ meshInstances?: Array<{ material?: any }> }>;
  for (const render of renders) {
    for (const meshInstance of render.meshInstances ?? []) {
      const material = meshInstance.material;
      if (!material) {
        continue;
      }
      if (typeof material.metalness === "number") {
        material.metalness = Math.min(material.metalness, 0.03);
      }
      if (typeof material.gloss === "number") {
        material.gloss = Math.min(material.gloss, 0.32);
      }
      if (typeof material.emissiveIntensity === "number") {
        material.emissiveIntensity = Math.min(material.emissiveIntensity, 0.55);
      }
      material.update?.();
    }
  }
}

function findEntityByName(entity: any, name: string): any | undefined {
  if (!entity) {
    return undefined;
  }
  if (typeof entity.name === "string" && entity.name.toLowerCase() === name.toLowerCase()) {
    return entity;
  }
  const children = Array.isArray(entity.children) ? entity.children : [];
  for (const child of children) {
    const match = findEntityByName(child, name);
    if (match) {
      return match;
    }
  }
  return undefined;
}
