# Voice Wake, Listening, and Local Model Cleanup - 2026-04-23

## Goal

Clean up the `work-lite` voice loop so wake-word recognition is less brittle, short buffer responses feel context-aware, and the local model configuration matches the intended Cherry/private-persona behavior.

## Single Source Of Truth

Voice behavior is now centralized under:

- `data/voice/voice-settings.json`
- served by `GET /voice/settings`
- updated by `PATCH /voice/settings`

The persisted `runtime` block now owns:

- wake aliases and prefixes
- wake acknowledgements
- thinking filler phrase banks
- context filler phrase banks
- conversation closers
- boot greetings
- speech cooldown
- thinking filler delay
- follow-up and submit timing
- ambient confidence and repeat filtering thresholds
- ambient single-word allowlist

The operator shell `Providers & Voice` page now exposes those knobs and saves them back through `/voice/settings`.

## Changed

- Added fuzzy wake-word matching in `playcanvas-app/src/work-lite-rebuild.ts`.
- Accepted configured wake phrase plus common browser STT variants:
  - `hey gail`
  - `hey gale`
  - `hi Gail`
  - `okay Gail`
  - short leading `Gail` / `Gale` / `Gael` / `Gal`
- Replaced generic thinking fillers with intent/context-aware local phrase banks.
- Classified voice input locally as `question`, `command`, or `statement`.
- Added context hints for follow-up, vision, persona, dance, and system/voice commands.
- Reduced thinking filler delay from `1400ms` to `650ms`.
- Added repeat protection for wake acknowledgements and thinking fillers.
- Updated client cache key to `20260423-voice-wake1`.

## Always-Listening Ambient Guard

Added a conservative always-listening guard after the first wake/buffer pass.

Current behavior:

- Only applies when `state.voiceMode === "always_listening"`.
- Does not affect wake-word follow-up windows.
- Does not affect command handling that is matched before normal conversation submission.
- Rejects likely ambient transcripts before they are sent to the model.

Rejected cases:

- empty transcript
- single-word ambient transcript unless it is a short allowed reply such as `yes`, `no`, `stop`, or `cancel`
- low-confidence short transcript when browser `SpeechRecognition` provides confidence values
- repeated identical transcript within `10` seconds
- long statement not directed at Gail and not framed as personal speech or a command

Cache key after this pass:

- `20260423-voice-ambient1`

Important limit:

- Browser `SpeechRecognition` does not provide reliable speaker identity or true source separation.
- True voice locking would require a separate speaker-identification/enrollment layer or a local STT pipeline that exposes audio features.

## Self-Hearing Guard Tightening

Added one shared output guard for all Gail speech paths.

Protected output paths:

- quick browser phrases and filler lines
- streamed sentence speech
- queued browser speech synthesis
- OpenAI/audio element playback

Guard behavior:

- `gailSpeechActive` is set whenever Gail starts outputting speech.
- voice transcripts are blocked while `gailSpeechActive` is true.
- browser speech synthesis `speaking`/`pending` is checked as a second guard.
- OpenAI/audio queue and browser speech queue are checked before follow-up listening starts.
- after speech ends, a `1200ms` cooldown blocks late echo transcripts.

Cache key after this pass:

- `20260423-voice-selfguard1`

Known limit:

- if external speakers are loud enough that Gail's voice is still bouncing in the room after the cooldown, the browser can still mis-transcribe it. The current guard blocks Gail's own active output and immediate tail echo; true acoustic echo cancellation requires deeper mic/audio routing than browser `SpeechRecognition` exposes.

## Local LLM Decision

The local LLM is not used for the immediate buffer phrase because that adds latency to the thing meant to hide latency.

Observed local timing on 2026-04-23:

- `qwen2.5:3b`: intent test completed in about `4497ms`.
- `dolphin-mistral:7b`: intent test completed in about `9864ms`.

Decision:

- Use deterministic local classification for the immediate buffer response.
- Keep the model free to think/generate the actual reply after the buffer.
- Configure the live local provider to `dolphin-mistral:7b` because Cherry/private chat requires that model behavior.

## Model Configuration

Updated:

- `data/providers/local-llm-config.json`
- `backend/services/local-llm-config-service.ts`
- `backend/README.md`
- `playcanvas-app/src/work-lite-rebuild.ts`

Live verified:

- `GET /providers/local-llm-config` reports `model: dolphin-mistral:7b`.
- `GET /providers/local-llm-config` reports `effectiveModel: dolphin-mistral:7b`.
- Normal, Vera, Cherry, and hangout persona entries all report `dolphin-mistral:7b`.

## Verification

- PlayCanvas build passed.
- Backend build passed.
- Live `/client/work-lite/` serves cache key `20260423-voice-wake1`.
- Live `/client/work-lite-rebuild.js?v=20260423-voice-wake1` contains:
  - `findWakeWordMatch`
  - `classifyVoiceIntent`
  - `dolphin-mistral:7b`
  - `20260423-voice-wake1`

## Boundary

- No avatar GLBs changed.
- No animation GLBs changed.
- No Blender/export scripts changed.
- No voice settings JSON changed.
- Wake-word detection still depends on browser `SpeechRecognition` producing usable text; this pass makes text matching more forgiving after transcription.
