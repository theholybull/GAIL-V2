# Gail Mobile Client — Debug Handoff Document

**Date:** April 28, 2026  
**Status:** The standalone mobile client exists and the route is fixed, but the avatar is NOT visually rendering correctly on screen. This document describes every relevant file, what was done, what the current state is, and what still needs fixing.

---

## 1. What the User Wants

A **standalone mobile HTML page** served at `/gail-mobile/` with:
- Fullscreen 16:9 portrait canvas showing the Gail avatar loaded into a static backdrop
- Chat window docked at the bottom
- Camera PIP (phone front camera) at top-right
- Real incoming voice on iPhone Chrome
- Cloud TTS with iPhone hardware volume controls working across repeated replies
- No work-lite toolbars, settings panels, or operator UI

---

## 2. Current Server State

**Backend process:** Node.js PID 16076, listening on port 4180 (`0.0.0.0`).

**URLs:**
- LAN: `http://10.10.10.41:4180/gail-mobile/`
- Public HTTPS: `https://gail.guysinthegarage.com/gail-mobile/`

**HTTPS lock:** The mobile client is HTTPS-only. Any plain `http://.../gail-mobile/` request, including LAN/IP/local hostnames, must redirect to `https://gail.guysinthegarage.com/gail-mobile/`. This is required because iPhone browsers do not expose camera/mic or screen wake-lock APIs in insecure contexts. Do not add an insecure bypass for the mobile route.

The route NOW returns HTTP 200 with the correct HTML (the redirect was removed — see Section 4).

---

## 3. Key Files

| File | Purpose | Status |
|------|---------|--------|
| `D:\Gail 2.1\working_copy\playcanvas-app\gail-mobile-client.html` | **The standalone mobile client page** | Exists, served correctly |
| `D:\Gail 2.1\working_copy\backend\api\http-server.ts` | Backend HTTP server — routes `/gail-mobile/` | Route fixed (see Section 4) |
| `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts` | Full work-lite TypeScript client (reference for animation/rendering) | Working, DO NOT LOAD on mobile |
| `D:\Gail 2.1\working_copy\playcanvas-app\backups\gail-mobile\gail-mobile-client-20260427-144042.html` | Backup of the mobile client before today's session edits | Pre-session baseline |

---

## 4. What Changed This Session

### 4e. Replication Runbook And Shell Settings

Use `docs/MOBILE_AUDIO_REPLICATION_RUNBOOK_2026-04-28.md` before changing the standalone mobile audio stack. It contains the locked runtime contract, the repeatable verification commands, the iPhone Chrome/Safari media rules, the known failed variants, and the list of operator-shell settings that should be added so future tuning does not require editing `gail-mobile-client.html` directly.

Important shell settings still need to be implemented for:
- mobile TTS engine/voice/instructions/fallback policy
- mobile playback and mic-route behavior during TTS
- mobile mouth/speech animation scale and sync timing
- mobile MediaRecorder/VAD/transcription behavior
- mobile camera frame cadence and vision-send policy
- mobile HTTPS/wake-lock/permission behavior

### 4a. `http-server.ts` — Route Fix (the critical change)

**Before:** The `/gail-mobile/` route did a **302 redirect to `/client/work-lite/?fs=1`** (the full operator UI). This was NOT what the user wanted.

**After:** The route now reads and serves `gail-mobile-client.html` directly.

**Code diff — `tryServeMobileClient()` function:**
```typescript
// BEFORE (wrong):
if (pathname === "/gail-mobile" || pathname === "/gail-mobile/") {
  response.statusCode = 302;
  response.setHeader("Location", "/client/work-lite/?fs=1");
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  response.end();
  return true;
}

// AFTER (correct):
if (pathname === "/gail-mobile" || pathname === "/gail-mobile/") {
  const htmlFile = resolve(playcanvasRoot, "gail-mobile-client.html");
  if (!existsSync(htmlFile)) {
    response.statusCode = 404;
    response.end("gail-mobile-client.html not found");
    return true;
  }
  sendStaticFile(htmlFile, response);
  return true;
}
```

`playcanvasRoot` resolves to `D:\Gail 2.1\working_copy\playcanvas-app`.

### 4b. `gail-mobile-client.html` — Lighting Changes

The previous session modified lighting values:

```javascript
// Ambient light added:
app.scene.ambientLight = new pc.Color(0.72, 0.68, 0.62);

// Key light intensity changed: 1.1 → 1.5
// Fill light intensity changed: 0.35 → 1.8
// Fill light range changed: 7 → 12
```

### 4c. `gail-mobile-client.html` — Skeleton Binding Changes

Two new functions were added and `bindAvatarAnimation` was updated to use them:

```javascript
// ADDED:
function resolveSkeletonRoot(bodyRoot) { ... }
function rebindEntityRenderRootBone(entity, rootBone) { ... }

// CHANGED inside bindAvatarAnimation():
// Before: const skeletonRoot = findEntityByName(avatarEntity, "hip") || avatarEntity;
// After:  const skeletonRoot = resolveSkeletonRoot(avatarEntity);
//         rebindEntityRenderRootBone(avatarEntity, skeletonRoot);
```

### 4d. `gail-mobile-client.html` - Mobile TTS, Mouth, and Camera Vision

**LOCKED KNOWN-GOOD MOBILE AUDIO PATH - April 28, 2026**

Do not rework this casually. The following combination was user-confirmed working after several failed variants:

1. Outbound voice uses `/voice/speak` with `openai-gpt-4o-mini-tts`, voice `nova`, and the soft Australian feminine voice instructions.
2. Each cloud MP3 reply creates a **fresh** normal `Audio` element. Do not reuse a previously paused/cleared/reloaded element across replies.
3. Do not add silent/tiny WAV "audio arming" or unlock playback. That broke iPhone hardware volume behavior.
4. Do not restore browser/system `speechSynthesis` fallback in the mobile client. It caused wrong voices and sync drift.
5. Avatar talk/mouth animation starts only from the MP3 `playing` event / resolved `audio.play()`.
6. Pause the mobile voice input loop and fully stop/remove live mic tracks while cloud MP3 playback runs, then reacquire audio-only mic access and resume listening after the speech cooldown. Disabling a mic track was not enough; iPhone still treated the tab as a capture session and hardware volume did not control playback normally.
7. iPhone/WebKit inbound voice must prefer `MediaRecorder` + `/voice/transcribe`, not browser `SpeechRecognition`.
8. The recorder must be created from an audio-only stream: `new MediaStream(mediaStream.getAudioTracks())`.
9. Backend must accept recorder MIME strings with codec parameters and upload `audio/mp4` as `.m4a`.
10. The full camera+mic stream must not be recorded for transcription; it can produce a corrupt/unsupported iPhone MP4 container.

Failed variants that must not be reintroduced:
- Reusing one `Audio` element after `pause()`, `removeAttribute("src")`, and `load()` caused volume to work on the first reply only.
- Silent/tiny WAV pre-play or "audio arming" broke iPhone hardware volume controls.
- Using browser/system TTS caused wrong voice, robotic/system voice fallback, and avatar/audio sync drift.
- Sending full camera+mic `MediaStream` blobs to `/voice/transcribe` caused OpenAI "audio file might be corrupted or unsupported" errors.
- Trusting iPhone Chrome `SpeechRecognition` caused "mic on but no audio input"; Chrome on iPhone is WebKit and may expose a partial/unusable Web Speech surface.

The standalone mobile client keeps exactly one latest camera frame in memory while camera is enabled:
- Captures a JPEG frame every 5 seconds.
- Replaces/deletes the previous cached frame whenever a new one is taken.
- Does not send frames with every chat message.
- Only calls `/vision/analyze` when the user prompt appears to ask for visual/camera context.
- Clears the cached frame after handing it to the vision endpoint; the next timer tick captures a fresh one.

Speech output is handled in `speakReply()`:
- Primary mobile TTS now uses `/voice/speak` with `openai-gpt-4o-mini-tts`, voice `nova`, and explicit soft Australian feminine voice instructions.
- The returned MP3 is played through a normal `Audio` element at `audio.volume = 1`, so the phone's hardware volume buttons control actual playback loudness.
- Mobile creates a fresh `Audio` element for each real cloud MP3 playback. Do not reuse a previously torn-down element across responses on iPhone; hardware volume worked on the first response and then failed on later responses when the same element was paused, cleared, reloaded, and reused.
- Browser/system `speechSynthesis` has been removed from the mobile client. Do not reintroduce it as an automatic fallback; it caused wrong voices, sync drift, and may interfere with iPhone media volume behavior.
- April 28 investigation: public `/voice/speak` returns valid `gpt-4o-mini-tts` MP3, so "Natural TTS unavailable" is not a generation/backend failure. The failure path is iPhone/WebKit playback/autoplay policy. iPhone Chrome is WebKit underneath; after async chat streaming + TTS fetch, `audio.play()` may reject with text like "not allowed by the user agent or the platform" because the original send tap no longer counts as a user activation.
- Do not add a silent/tiny WAV pre-play or "audio arming" step on iPhone. It made hardware volume controls stop behaving correctly. The mobile client must not play any non-user-visible arming audio.
- Recovery path: if automatic MP3 playback is denied, the mobile client keeps the generated cloud MP3 in memory and shows `Play Voice`. That button plays the same MP3 from a fresh user tap. This preserves hardware volume behavior better than silent pre-play hacks.
- Do not route this failure to browser/system TTS.
- Do not switch the avatar to `talk` during text streaming. Keep her in `listen` while the reply text is streaming and while `/voice/speak` is generating audio.
- For cloud TTS, the body talk clip, mouth layer, and `setSpeechActive(true)` now start from the MP3 `playing` event / resolved `audio.play()`, not from response text arrival. This prevents the avatar from getting ahead of the voice.
- Cloud TTS playback must use a Blob URL backed by the returned MP3. Avoid routing mobile playback through `AudioContext`; iPhone Chrome/WebKit can reject or block that path after an async TTS fetch.
- The body talk clip and mouth layer still begin only from the MP3 `playing` event / resolved `audio.play()`. Mouth motion uses a small playback pulse rather than analyser data for iPhone reliability.
- During MP3 playback, mobile pauses the incoming voice loop and stops/removes mic audio tracks. After playback/cooldown it reacquires audio-only mic access and restarts listening. Do not keep the mic capture loop active during TTS if iPhone hardware volume starts misbehaving.
- A long safety fallback timer exists only to stop stuck mouth motion if mobile audio events are incomplete.
- Mouth/jaw speech drive is intentionally reduced for mobile portrait: `speechMouthScale = 0.42`, `speechJawScale = 0.34`, and live talk amount is capped around `0.58`.

Inbound mobile voice is now a separate path from TTS:
- The mobile `Camera + Mic` button must do more than request `getUserMedia`; it must start an actual voice input loop.
- If `SpeechRecognition`/`webkitSpeechRecognition` exists, mobile uses a small work-lite-style browser recognition loop with wake-word matching.
- If browser recognition is missing or blocked, mobile uses the already-granted mic stream with `MediaRecorder` plus a lightweight VAD monitor. It records only when the mic level crosses the speech threshold, stops after silence, and posts the clip to `/voice/transcribe`.
- On iPhone/WebKit, mobile must prefer the MediaRecorder/transcription path even if a `SpeechRecognition` symbol appears. iPhone Chrome can expose or partially start Web Speech recognition without delivering usable transcripts, which looks like "mic on but no audio input."
- The VAD monitor `AudioContext` is created/resumed from the Camera + Mic tap before the async permission flow completes, then connected to the granted mic stream. This is intentional for iPhone user-activation behavior.
- `/voice/transcribe` is a backend endpoint backed by OpenAI `/audio/transcriptions`, default model `gpt-4o-mini-transcribe`, accepting JSON `{ audioBase64, mimeType, language, prompt }`.
- Recorder MIME types may include codec parameters such as `audio/mp4;codecs=mp4a.40.2` or `audio/webm;codecs=opus`. The backend validator must accept those and normalize to the base MIME type before uploading to OpenAI.
- The mobile recorder must be constructed from an audio-only `MediaStream` (`new MediaStream(mediaStream.getAudioTracks())`), not the full camera+mic stream. Recording the full stream on iPhone can produce a video/fragmented MP4 container that OpenAI rejects as corrupted or unsupported.
- Backend uploads `audio/mp4` clips with an `.m4a` filename. This matches phone audio containers better than `.mp4` for the transcription endpoint.
- Wake behavior mirrors the work-lite rules: `hey gail`/Gail/Gale/Gael/Gal opens a follow-up window; speech after the wake phrase is submitted directly to chat.
- Do not assume iPhone Chrome has Web Speech recognition. Chrome on iPhone is WebKit, so the MediaRecorder transcription fallback is the durable mobile path.

---

## 5. What `gail-mobile-client.html` Contains

The file is a single self-contained HTML page (~1800 lines). Key sections:

### HTML Layout
```
#app (full viewport)
  #badge            — "Standalone Mobile Portrait v1" label (top-left)
  #scene-shell      — top 66.66% of viewport, avatar scene
    #scene-frame    — 16:9 aspect ratio container
      #scene-bg     — <img> static background image
      #avatar-canvas — PlayCanvas WebGL canvas
      #avatar-loading — loading overlay
      #scene-fade   — gradient fade from scene to chat
  #silent-toggle    — mute button (top-left, over scene)
  #quality-select   — low/medium/high quality dropdown (top-left)
  #cam-preview      — camera PIP (top-right, shown after getUserMedia)
  #chat-shell       — bottom 33.34% of viewport
    #chat-log       — scrolling message history
    #composer       — textarea + send button
  #warn             — toast warning overlay
```

### JavaScript — Boot Sequence (`bootAvatar()`)
1. Import PlayCanvas from `/vendor/playcanvas/build/playcanvas.mjs`
2. Configure Draco decoder (from `/gail-mobile/assets/draco/`)
3. Create `pc.Application` on `#avatar-canvas` with `alpha: true` clear color
4. Add camera, ambient light, key light, fill light
5. Fetch avatar manifest from `/client/asset-manifest?assetRoot=gail_lite`
6. Load base avatar GLB via `loadContainerEntity()`
7. Patch materials: `patchAvatarMaterials()`
8. Resolve skeleton root: `resolveSkeletonRoot()` + `rebindEntityRenderRootBone()`
9. Load clothing/hair modules, call `bindGarmentToSkeleton()` on each
10. `placeAvatarForStage()` — tries 6 rotation candidates, picks tallest bounds, scales to 1.72m, positions feet at y=-0.14
11. Load animation tracks (idle, talk, listen GLBs from `/gail-mobile/assets/animations/`)
12. `bindAvatarAnimation()` — adds `anim` component, assigns tracks, plays idle
13. `applyStageCameraPlacement()` — positions camera based on avatar bounds
14. `createFacialController()` — blink + viseme + micro-motion via `app.on("postUpdate")`
15. `canvas.classList.add("ready")` — fades canvas in

### Key Constants
```javascript
const IDLE_ANIM_URL  = "/gail-mobile/assets/animations/27775_stand_still.glb";
const TALK_ANIM_URL  = "/gail-mobile/assets/animations/28154_explain.glb";
const LISTEN_ANIM_URL = "/gail-mobile/assets/animations/27299_stand_and_nod.glb";
const OPTIMIZED_GAIL_ASSET_ROOT = "gail_lite";
const MOBILE_STAGE_CAMERA_POSITION = [0, 1.55, 2.8];
const MOBILE_STAGE_CAMERA_TARGET   = [0, 1.2, 0];
```

### Static Background
`/gail-mobile/assets/backgrounds/background.jfif` — served by the `/gail-mobile/assets/` route in `http-server.ts`, which maps to `D:\Gail 2.1\working_copy\playcanvas-app\assets\backgrounds\background.jfif`.

### Vendor
PlayCanvas loaded as ES module from `/vendor/playcanvas/build/playcanvas.mjs` (served separately by the work-lite client route).

---

## 6. Known Avatar Rendering Problems (Unresolved)

These problems existed during the session and were not confirmed fixed:

### Problem 0: Repeated Rest-Pose Regression When Porting Animation Layers
**Symptom:** Gail appears upright and visually framed, but talk/listen/body clips stop playing and she looks stuck in a rest/idle position. Blink/speech may appear partially alive because morph or procedural overlays still run, masking the fact that skeletal clips are not transitioning.

**Critical rule:** The mobile procedural animation layer must **augment** skeletal clip playback, not replace it. Do not force `animComponent.baseLayer` to stay on `idle` as a workaround for a large nod. That hides or recreates the same rest-pose failure.

**Second critical rule:** Do not port Work-Lite limb/arm procedural overlays directly into the mobile portrait. The Work-Lite overlay writes collar/shoulder/upper-arm bones after the anim system has posed them. On the mobile close-up this can override the skeletal clip and put Gail back into a rest/T-pose-looking arm position. Mobile should keep procedural writes limited to face/jaw/blink/eyes/head/neck/light torso unless the limb overlay is explicitly retuned and verified.

**Root-bone rule from the existing animation docs:**
- For the Gail / Victoria 8 / Genesis 8 runtime skeleton, `anim.rootBone` must resolve to the real `hip` bone inside the loaded body entity.
- Render components must be rebound to the same resolved skeleton root immediately after the body entity is added.
- Garments/hair must bind to that same body skeleton root, not their own static skeleton copies.
- If `anim.rootBone`, render `rootBone`, and garment skin bones do not point at the same live skeleton, animation can look like rest pose, lying flat, body mangle, disappearing body, or clothing frozen in rest pose.

**Do not repeat this failed fix:**
```javascript
// WRONG for mobile if skeletal clips are expected to play:
animComponent.baseLayer.transition("idle", 0.22);
```

**Correct state behavior:**
```javascript
if (state === "talk") animComponent.baseLayer.transition("talk", 0.22);
else if (state === "listen") animComponent.baseLayer.transition("listen", 0.22);
else animComponent.baseLayer.transition("idle", 0.22);
```

**Reference docs already covering this family of bugs:**
- `docs/AVATAR_ANIMATION_DISAPPEARING_BODY_INVESTIGATION.md`
- `docs/ANIMATION_BODY_DISAPPEAR_ROOT_CAUSE_INVESTIGATION.md`

### Problem 1: Avatar Lying Flat / Invisible
**Symptom:** Playwright mesh AABB inspection showed the avatar mesh y-coordinates compressed to ~0.5 units range (expected ~1.8), with z-range extending to 1.5 — indicating the skeleton is rotated ~90° around X-axis, making the character lie face-up instead of standing.

**Root cause (diagnosis from session):** The `anim` component's root bone might not match the render components' root bone, causing the animation to drive the wrong bone, rotating the skeleton incorrectly. Work-lite solves this with `resolveSkeletonRoot()` + `rebindEntityRenderRootBone()` — these were added to the mobile client this session but **were not confirmed to fix the visual output** before the session ended.

**What work-lite does that may still be missing:**
- Work-lite calls `resolveSkeletonRoot` from actual `skinInstance.bones` arrays (finding lowest common ancestor of all bones within the body entity)
- Work-lite calls `rebindEntityRenderRootBone` immediately after `addChild` (before animations load), while the mobile client calls it inside `bindAvatarAnimation` (after clothes are loaded)

### Problem 2: Camera May Not Frame Avatar Correctly
**Symptom:** `applyStageCameraPlacement` uses bounds from the avatar entity AFTER `placeAvatarForStage`. If the avatar is in the wrong orientation (Problem 1), the bounds will be wrong and the camera will be misframed.

**Dependency:** Fix Problem 1 first; camera framing likely self-corrects.

### Problem 3: Canvas Never Reached "ready" State (Earlier in Session)
**Symptom:** Playwright observed `#avatar-canvas` existed but never got the `ready` class. The canvas ID is `avatar-canvas` not `scene-canvas` (Playwright code was looking for the wrong ID).

**Status:** The canvas does get `ready` class when boot completes — confirmed by querying `document.querySelectorAll('canvas')`. This may not actually be a remaining bug; it was a test script issue.

---

## 7. What Works (Confirmed in Prior Iterations)

- `loadContainerEntity()` — loads GLBs via PlayCanvas asset system ✓
- `patchAvatarMaterials()` — tames PBR to matte look ✓
- `bindGarmentToSkeleton()` — re-wires garment skins to body skeleton ✓
- `createFacialController()` — blink + morph visemes via `_weightMap` ✓
- Chat streaming to `/conversation/sessions/{id}/messages/stream` ✓
- Cloud MP3 TTS through `/voice/speak`; browser/system TTS intentionally removed ✓
- Mobile mic input through browser `SpeechRecognition` when available, or MediaRecorder + `/voice/transcribe` fallback ✓
- Camera PIP via `getUserMedia` ✓
- Quality selector with cookie persistence ✓
- Background image layer (static JFIF) ✓
- Layout: portrait, 16:9 scene top, chat panel bottom ✓
- `resolveSkeletonRoot` + `rebindEntityRenderRootBone` — ported from work-lite ✓ (but visual effect unconfirmed)

---

## 8. How Work-Lite Does It (Reference)

The working avatar rendering in work-lite (`work-lite-rebuild.ts`) does the following after loading the body GLB:

```typescript
// 1. Instantiate
const bodyEntity = asset.resource.instantiateRenderEntity();
avatarRoot.addChild(bodyEntity);

// 2. Resolve skeleton from actual skin bone arrays
const skeletonRoot = resolveSkeletonRoot(bodyEntity);

// 3. Set rootBone on every render component IMMEDIATELY
rebindEntityRenderRootBone(bodyEntity, skeletonRoot);

// 4. Patch materials
applyClientMatteMaterials(bodyEntity);

// 5. Load garments, bind each
bindGarmentToSkeleton(garmentEntity, bodyEntity, skeletonRoot);

// 6. Add anim component with resolved skeleton root
bodyEntity.addComponent("anim", { activate: true, speed: 1 });
bodyEntity.anim.rootBone = skeletonRoot;
bodyEntity.anim.assignAnimation("idle", idleTrack);
bodyEntity.anim.baseLayer.play("idle");
```

The mobile client does these steps in a different order and applies some of them to `avatarEntity` (the container root) rather than the actual body entity inside the container. This mismatch is the likely cause of Problem 1.

**Specific difference:** `instantiateRenderEntity()` in work-lite gets called and the returned entity IS the body entity that gets `rebindEntityRenderRootBone` applied. In the mobile client, `loadContainerEntity()` also calls `instantiateRenderEntity()` internally, but the returned entity is the container root — the skeleton bones are one level deeper inside. The `resolveSkeletonRoot` traversal should handle this, but the ordering of `rebindEntityRenderRootBone` relative to `addChild` may matter.

---

## 9. Recommended Fix Plan for Next Agent

1. **Verify the avatar entity structure**: In the browser console at `/gail-mobile/`, after boot, run:
   ```javascript
   const app = window.__pcApp;
   const root = app.root.findByName('avatar-root');
   // Log child names
   function tree(e, d=0) { console.log(' '.repeat(d*2) + e.name); for(const c of e.children) tree(c,d+1); }
   tree(root);
   ```
   This will show what entities are inside the avatar root and where the skeleton bones actually live.

2. **Check AABB after boot**:
   ```javascript
   const avatarRoot = app.root.findByName('avatar-root');
   const renders = avatarRoot.findComponents('render');
   renders.slice(0,3).forEach(r => {
     r.meshInstances.forEach(mi => {
       console.log(mi.material?.name, JSON.stringify({
         min: mi.aabb?.getMin(),
         max: mi.aabb?.getMax()
       }));
     });
   });
   ```
   If y-range is ~1.8 units tall, avatar is upright. If z-range is ~1.8, avatar is lying flat.

3. **If still lying flat**, the `bindAvatarAnimation` function is receiving the wrong root entity. Change the `anim.rootBone` assignment to use the direct body entity child (e.g., `avatarEntity.children[0]`) rather than `avatarEntity` itself, and call `resolveSkeletonRoot` on that child.

4. **If avatar is upright but not visible**, check camera position vs avatar world bounds. The camera constant `MOBILE_STAGE_CAMERA_POSITION = [0, 1.55, 2.8]` was tuned for a 1.72m avatar centered at the origin — verify `placeAvatarForStage` is correctly positioning the avatar at the world origin.

5. **Confirm voice**: The mobile client should call `/voice/speak` with `openai-gpt-4o-mini-tts`, voice `nova`, and the soft Australian feminine voice instructions. Do not use `speechSynthesis`, `utterance.voice`, or Microsoft Sonia in this mobile path; those notes are stale and caused the wrong-voice regression.

---

## 10. Build Commands

```powershell
# From D:\Gail 2.1\working_copy\playcanvas-app\
tsc -p tsconfig.json

# From D:\Gail 2.1\working_copy\backend\
tsc -p tsconfig.json

# Restart server (kill old node process first):
Get-NetTCPConnection -LocalPort 4180 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
cd "D:\Gail 2.1\working_copy\backend"
node dist/backend/server.js
```

---

## 11. Asset Paths (all confirmed to exist on server)

| URL | Local path |
|-----|-----------|
| `/gail-mobile/assets/animations/27775_stand_still.glb` | `playcanvas-app/assets/animations/27775_stand_still.glb` |
| `/gail-mobile/assets/animations/28154_explain.glb` | `playcanvas-app/assets/animations/28154_explain.glb` |
| `/gail-mobile/assets/animations/27299_stand_and_nod.glb` | `playcanvas-app/assets/animations/27299_stand_and_nod.glb` |
| `/gail-mobile/assets/backgrounds/background.jfif` | `playcanvas-app/assets/backgrounds/background.jfif` |
| `/gail-mobile/assets/draco/draco.wasm.js` | `playcanvas-app/assets/draco/draco.wasm.js` |
| `/vendor/playcanvas/build/playcanvas.mjs` | served by work-lite route |
| `/client/asset-manifest?assetRoot=gail_lite` | API endpoint (returns JSON) |

---

## 12. Session Timeline Summary

| Time | Action | Result |
|------|--------|--------|
| Session start | Camera/framing fixes on gail-mobile-client.html | Partial |
| Mid-session | iPhone 42MB load failures → deferred garment loading | Fixed |
| Mid-session | Clothing in rest pose → added `bindGarmentToSkeleton` | Fixed |
| Mid-session | Facial animation broken → switched to `_weightMap` string key | Fixed |
| Mid-session | Voice defaulting to wrong voice → timing fix | Fixed |
| Mid-session | **Agent redirected /gail-mobile/ to work-lite** | **Wrong** |
| End of session | Added `AUTO_FULLSCREEN`, CSS tweaks to work-lite (wrong target) | Wasted |
| End of session | Fixed `requestFullscreen is not a function` crash | Fixed (wrong file) |
| This session | Read transcript, identified the redirect was the core issue | Diagnosed |
| This session | Changed route to serve `gail-mobile-client.html` directly | Fixed |
| This session | Added `resolveSkeletonRoot` + `rebindEntityRenderRootBone` | Added, unverified |
| This session | Adjusted lighting values | Done |
| This session | Rebuilt both TypeScript projects, restarted server | Done |
| End | Route verified 200 OK, HTML is correct content | Confirmed |
