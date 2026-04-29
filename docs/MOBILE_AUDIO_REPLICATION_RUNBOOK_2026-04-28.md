# Mobile Audio Replication Runbook

Date: 2026-04-28

This is the repeatable recipe for the standalone `/gail-mobile/` iPhone audio path. Keep this file current before changing mobile voice, TTS, wake, camera, or playback behavior.

## Locked Runtime Contract

- Route: `https://gail.guysinthegarage.com/gail-mobile/`
- Mobile page: `playcanvas-app/gail-mobile-client.html`
- Outbound TTS endpoint: `POST /voice/speak`
- Outbound TTS engine: `openai-gpt-4o-mini-tts`
- Outbound TTS voice: `nova`
- Inbound iPhone voice endpoint: `POST /voice/transcribe`
- Inbound iPhone transcription model: `gpt-4o-mini-transcribe`
- iPhone voice input path: `MediaRecorder` + VAD + `/voice/transcribe`
- iPhone recorder stream: audio-only `new MediaStream(mediaStream.getAudioTracks())`
- iPhone recorder upload filename for `audio/mp4`: `.m4a`
- Camera frames: keep only the newest frame in memory, capture every 5 seconds, clear the frame after sending it to vision.

## Browser Rules

- iPhone Chrome is WebKit under the hood. Treat it like Safari with extra routing/autoplay quirks.
- Safari may be more predictable for media permissions and hardware volume, but it has the same core iOS restrictions.
- Do not assume browser `SpeechRecognition` works on iPhone, even if the symbol exists.
- Do not assume a Send tap remains a valid user activation after streaming chat and fetching TTS.

## TTS Playback Rules

The user-confirmed stable path is cloud MP3 playback through a normal `Audio` element.

- Create a fresh `Audio` element for every cloud MP3 reply.
- Play a Blob URL built from the returned MP3.
- Set `audio.volume = 1`; device hardware buttons own loudness.
- Start avatar talk, mouth movement, and `setSpeechActive(true)` only from the MP3 `playing` event or resolved `audio.play()`.
- Keep the avatar in listen while text is streaming and while `/voice/speak` is generating.
- If autoplay is blocked, keep the generated MP3 in memory and show the visible `Play Voice` button.
- The `Play Voice` button must play the same cloud MP3 from a fresh user tap.

## Mic And Volume Rules

iOS may treat the tab as an active capture session while the mic track is live. That can make hardware volume buttons stop controlling normal MP3 playback.

Required behavior during TTS:

1. Stop the VAD/voice input loop.
2. Remove every live audio track from the shared media stream.
3. Stop those removed tracks.
4. Play the cloud MP3.
5. After playback and speech cooldown, request audio-only mic access again.
6. Add the new audio track back to the shared stream.
7. Restart the VAD/voice input loop.

Do not merely set `track.enabled = false`. That was not enough on iPhone Chrome.

## Things Not To Reintroduce

- No browser/system `speechSynthesis` fallback in the standalone mobile client.
- No silent/tiny WAV unlock audio.
- No shared/reused `Audio` element across replies.
- No `AudioContext` playback path for the cloud MP3.
- No recording the combined camera+mic stream for transcription.
- No treating iPhone Chrome Web Speech recognition as the primary input path.
- No starting avatar talk/mouth animation from streamed text arrival.

## Replication Checklist

1. Confirm the mobile page contains the locked constants and functions:
   ```powershell
   Select-String -Path 'playcanvas-app\gail-mobile-client.html' -Pattern 'MOBILE_TTS_VOICE|createCloudSpeechAudioElement|pauseVoiceInputForPlayback|resumeVoiceInputAfterPlayback|MediaRecorder|voice/transcribe'
   ```

2. Confirm forbidden fallbacks are absent:
   ```powershell
   Select-String -Path 'playcanvas-app\gail-mobile-client.html' -Pattern 'SpeechSynthesisUtterance|speechSynthesis\.speak|CLOUD_SPEECH_ARM_AUDIO_URL|armCloudSpeechFromGesture|cloudSpeechArmed|cloudSpeechArming'
   ```
   This command should return no active mobile fallback/arming code.

3. Syntax-check the embedded mobile module:
   ```powershell
   @'
   const fs = require('fs');
   const html = fs.readFileSync('playcanvas-app/gail-mobile-client.html', 'utf8');
   const marker = '<script type="module">';
   const start = html.indexOf(marker);
   const end = html.lastIndexOf('</script>');
   if (start < 0 || end < 0) throw new Error('module script not found');
   process.stdout.write(html.slice(start + marker.length, end));
   '@ | node - | node --check --input-type=module -
   ```

4. Type-check the backend:
   ```powershell
   cd backend
   npx tsc -p tsconfig.json --noEmit
   ```

5. Test public TTS from the same origin the phone uses:
   ```powershell
   $body = @{ text = 'Mobile voice test.'; voiceOverride = 'nova'; format = 'mp3' } | ConvertTo-Json
   Invoke-RestMethod -Method Post -Uri 'https://gail.guysinthegarage.com/voice/speak' -ContentType 'application/json' -Body $body
   ```
   Expected: `engineUsed = openai-gpt-4o-mini-tts`, `fallbackUsed = false`, `mimeType = audio/mpeg`, and non-empty `audioBase64`.

6. Test on phone with a fresh page load:
   - Open `https://gail.guysinthegarage.com/gail-mobile/`
   - Tap Camera + Mic.
   - Send a short text prompt.
   - During Gail's reply, use iPhone hardware volume buttons.
   - Send a second prompt and repeat volume test.
   - Say the wake phrase and confirm incoming audio is transcribed.

## Shell Settings To Add

These should be exposed in the operator shell so future tuning does not require editing `gail-mobile-client.html` directly.

### Mobile TTS

- `mobile.tts.enabled`
- `mobile.tts.engine`
- `mobile.tts.voice`
- `mobile.tts.instructions`
- `mobile.tts.format`
- `mobile.tts.autoplayRecoveryMode`
- `mobile.tts.useBrowserFallback`
- `mobile.tts.useSilentAudioArming`

Recommended defaults:

- `enabled = true`
- `engine = openai-gpt-4o-mini-tts`
- `voice = nova`
- `format = mp3`
- `autoplayRecoveryMode = visible-play-button`
- `useBrowserFallback = false`
- `useSilentAudioArming = false`

### Mobile Playback And Sync

- `mobile.playback.freshAudioElementPerReply`
- `mobile.playback.pauseMicDuringTts`
- `mobile.playback.stopAndRemoveMicTracksDuringTts`
- `mobile.playback.reacquireAudioOnlyMicAfterTts`
- `mobile.playback.speechCooldownMs`
- `mobile.playback.fallbackTimerMinMs`
- `mobile.playback.fallbackTimerMaxMs`
- `mobile.playback.fallbackMsPerCharacter`

Recommended defaults:

- `freshAudioElementPerReply = true`
- `pauseMicDuringTts = true`
- `stopAndRemoveMicTracksDuringTts = true`
- `reacquireAudioOnlyMicAfterTts = true`

### Mobile Mouth And Animation

- `mobile.animation.startTalkOnAudioPlaying`
- `mobile.animation.keepListenDuringTextStream`
- `mobile.animation.speechMouthScale`
- `mobile.animation.speechJawScale`
- `mobile.animation.speechLevelCap`
- `mobile.animation.talkTransitionSeconds`
- `mobile.animation.listenTransitionSeconds`
- `mobile.animation.idleTransitionSeconds`

Recommended defaults:

- `startTalkOnAudioPlaying = true`
- `keepListenDuringTextStream = true`
- `speechMouthScale = 0.42`
- `speechJawScale = 0.34`
- `speechLevelCap = 0.58`

### Mobile Voice Input

- `mobile.voiceInput.enabled`
- `mobile.voiceInput.preferMediaRecorderOnIos`
- `mobile.voiceInput.allowBrowserSpeechRecognitionNonIos`
- `mobile.voiceInput.vadThreshold`
- `mobile.voiceInput.silenceMs`
- `mobile.voiceInput.maxClipMs`
- `mobile.voiceInput.minClipMs`
- `mobile.voiceInput.transcriptionModel`
- `mobile.voiceInput.transcriptionLanguage`
- `mobile.voiceInput.uploadAudioMp4AsM4a`
- `mobile.voiceInput.recordAudioOnlyStream`

Recommended defaults:

- `preferMediaRecorderOnIos = true`
- `allowBrowserSpeechRecognitionNonIos = true`
- `transcriptionModel = gpt-4o-mini-transcribe`
- `uploadAudioMp4AsM4a = true`
- `recordAudioOnlyStream = true`

### Mobile Camera And Vision

- `mobile.camera.enabled`
- `mobile.camera.frameIntervalMs`
- `mobile.camera.keepOnlyLatestFrame`
- `mobile.camera.sendOnlyWhenPromptNeedsVision`
- `mobile.camera.clearFrameAfterVisionRequest`
- `mobile.camera.jpegQuality`

Recommended defaults:

- `frameIntervalMs = 5000`
- `keepOnlyLatestFrame = true`
- `sendOnlyWhenPromptNeedsVision = true`
- `clearFrameAfterVisionRequest = true`

### Mobile Wake Lock And Permissions

- `mobile.permissions.requireHttps`
- `mobile.permissions.publicHttpsOrigin`
- `mobile.permissions.preferSafariHint`
- `mobile.wakeLock.enabled`
- `mobile.wakeLock.reacquireOnVisibility`

Recommended defaults:

- `requireHttps = true`
- `publicHttpsOrigin = https://gail.guysinthegarage.com`
- `wakeLock.enabled = true`
- `wakeLock.reacquireOnVisibility = true`

## OneDrive Sync Rule

After any mobile audio change, mirror the active D: working copy to the OneDrive working copy and verify hashes for changed files.

```powershell
$src = Resolve-Path 'D:\Gail 2.1\working_copy'
$dst = Resolve-Path 'C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy'
robocopy $src.Path $dst.Path /MIR /XD .git node_modules .gradle __pycache__ /XF *.pyc /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -gt 7) { throw "robocopy failed with $LASTEXITCODE" }
```
