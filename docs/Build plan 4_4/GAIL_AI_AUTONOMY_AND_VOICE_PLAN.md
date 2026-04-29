# Gail AI Autonomy and Voice Standardization Plan (Pass/Fail)

Date: 2026-04-04
Scope: AI reliability, model capability upgrade, personality alignment, and unified UK narration voice strategy across OpenAI and local runtime paths

## Goal
- Make AI operation stable enough to run unattended with predictable behavior.
- Upgrade to a more capable model tier for reasoning and orchestration.
- Lock a consistent personality profile that matches product intent.
- Replace fragmented voices with a single UK narration standard wherever technically possible.

## Important Technical Constraint
- A downloaded local narrator voice cannot be directly injected into OpenAI-hosted TTS as a custom voice upload in the standard API flow.
- Practical path for "same voice everywhere":
  - Use local TTS narrator as the canonical voice renderer for both local and cloud-originated text, or
  - Use OpenAI TTS for cloud path and tune local path to closest UK match (not identical).
- Recommendation: choose one canonical renderer per environment and avoid dual-engine drift in production.

## Target Architecture
1. Brain Layer (LLM)
- Primary: upgraded OpenAI model for high-capability decisioning.
- Fallback: local model for degraded/offline operation.
- Router: policy-based model routing by task class (chat, planning, tool-call, safety-critical).

2. Personality Layer
- Single source prompt profile in versioned config:
  - tone, boundaries, escalation behavior, memory policy, refusal style.
- Prompt templates split into:
  - system-core
  - task-overrides
  - domain-policies

3. Voice Layer
- Canonical output text from AI is passed into voice orchestrator.
- Voice orchestrator routes to:
  - local narrator engine (preferred for exact UK identity),
  - optional OpenAI TTS fallback when local unavailable.
- All clients consume normalized audio contract:
  - sample rate, channels, loudness target, chunk size.

4. Control/Observability Layer
- Per-request tracing: model used, latency, token usage, failures, retries.
- Voice tracing: engine, voice id/name, synthesis latency, playback errors.
- Health checks and automatic failover with bounded retries.

## Config Surfaces to Define
- `config/ai-routing.json`
- `config/personality-profile.json`
- `config/voice-profile.json`
- `config/runtime-failover.json`

## Suggested Model Upgrade Policy
- Keep two OpenAI profiles:
  - `reasoning_high` for planning, orchestration, and long-context tasks.
  - `realtime_fast` for short operator interactions.
- Keep one local fallback profile:
  - `local_safe_fallback` with constrained context window and deterministic settings.
- Gate all upgrades with replay tests over representative transcripts before promoting.

## Voice Unification Plan (UK Narrator)
1. Canonical Voice Decision
- Set local UK narrator as canonical voice identity.

2. Cloud Path Alignment
- Cloud-generated text still synthesized by local UK narrator where possible.
- If cloud-only TTS is required, map to nearest UK OpenAI voice and flag as "approximate".

3. Runtime Voice Contract
- Define fixed audio output spec (example):
  - 24 kHz mono PCM or agreed opus profile
  - normalized loudness target
  - max synthesis timeout + fallback threshold

4. Operational Rule
- Do not mix multiple voices in one session unless explicit failover event is logged.

## Pass/Fail Gates
| ID | Status | Priority | Area | Requirement | Verification | Pass Criteria |
|---|---|---|---|---|---|---|
| A1 | FAIL | Blocker | Model Capability | Upgraded primary OpenAI model profile configured and active | Run model probe endpoint for planning and tool-call workloads | Responses meet baseline quality rubric and no unsupported feature errors |
| A2 | FAIL | Blocker | Autonomy Stability | Supervisory loop handles retries/timeouts without manual intervention | Run 2-hour unattended soak with scripted tasks | >= 99% task completion, no hard lock state |
| A3 | FAIL | Blocker | Fallback Safety | Local fallback model triggers on primary failure and recovers | Simulate OpenAI outage and run smoke tasks | Automatic fallback within target window and successful task completion |
| A4 | FAIL | High | Personality Consistency | Personality profile applied uniformly across UI and API entrypoints | Replay transcript suite across channels | Tone/behavior score above acceptance threshold with no policy drift |
| A5 | FAIL | High | Voice Consistency | UK narrator voice is default across all active clients | Run voice playback tests from panel + client + shell | Same voice identity used in all tested entrypoints |
| A6 | FAIL | High | Voice Failover | Voice engine fallback preserves session continuity | Kill primary TTS engine mid-session | Fallback audio starts within timeout and emits failover log |
| A7 | FAIL | Medium | Audio Quality | Output levels and clipping controlled across devices | Run audio validation script + manual listen checks | Loudness in range and no clipping artifacts |
| A8 | FAIL | Medium | Observability | AI+voice telemetry emitted and queryable | Trigger representative workflows and inspect logs | All required fields present (model, voice, latency, error class) |

## Minimal Rollout Sequence
1. Lock config schemas for routing, personality, and voice.
2. Switch primary model profile and validate with replay tests.
3. Wire local UK narrator as canonical renderer.
4. Add fallback mapping for cloud-only synthesis path.
5. Run autonomy soak + failover drills.
6. Promote only after A1-A6 are PASS.

## What To Continue vs Scrap
Continue:
- Local-first fallback strategy for resilience.
- Explicit profile-based configuration instead of hardcoded settings.
- Pass/fail gate approach before production promotion.

Scrap:
- Any auto-voice selection that changes voice identity per session.
- Unversioned prompt/personality edits in source files.
- Mixed model usage without routing policy and telemetry.

## Seamless Cloud-Refusal Fallback Requirement (Added 2026-04-04)

Policy:
- Any request the cloud AI refuses, blocks, times out, or cannot complete for policy/tool/reliability reasons must automatically route to local AI.
- This fallback must be seamless for the operator (no manual retry step required).

Routing behavior:
1. Primary attempt uses cloud provider per normal policy.
2. If result is refusal/unsupported/tool-failure/timeout, router retries through local provider with same user intent context.
3. UI response remains continuous:
- same conversation thread id,
- explicit but non-disruptive event note in telemetry/audit,
- no dead-end response unless both providers fail.

Safety behavior:
- Local fallback still respects configured safety policy and logging.
- If cloud refusal is policy-based and local policy also blocks, return consistent refusal with clear reason.

Observability requirements:
- Log `fallback_triggered` with:
  - reason class (`cloud_refusal`, `cloud_timeout`, `cloud_tool_failure`, `cloud_unavailable`)
  - cloud model/profile
  - local model/profile
  - retry latency
  - outcome

Pass/Fail additions:
- A9 (Blocker): Cloud-refusal seamless fallback
  - Test: trigger known cloud refusal and verify auto local retry
  - Pass: user receives local response in same flow without manual intervention
- A10 (High): Dual-failure clarity
  - Test: force both cloud and local failure
  - Pass: user receives single clear failure with actionable status and no UI hang

## Conversation Continuity and Voice Runtime Hardening (Added 2026-04-04)

Requirements:
1. Listen-timeout continuity
- Voice runtime must support configurable listen-timeout that keeps conversations flowing naturally.
- Timeout handling must work on work client and all verbal paths.

2. Push-to-talk parity
- Push-button TTS/STT flow on work client must behave the same as other verbal channels.
- No channel-specific degradation in turn-taking behavior.

3. Response continuity
- After assistant response completes, auto-resume listening behavior must follow configured mode policy.
- If auto-resume is enabled, conversation loop continues without manual re-arming.

4. Text-only mode animation
- When text-only node/mode is active, avatar must use typing/texting animation instead of speaking mouth animation.
- Talking animation must be suppressed in text-only mode.

5. Context-sensitive buffering phrases
- Add configurable buffering phrase sets to mask STT -> AI -> TTS latency.
- Phrase buckets by context (general/help/build/technical/error-recovery).
- Prevent repetitive phrase spam with cooldown and rotation.

Suggested new gates:
- A11 (Blocker): Work-client push-to-talk continuity parity
- A12 (High): Text-only typing animation correctness
- A13 (High): Context-sensitive buffering phrase effectiveness
