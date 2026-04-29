# Builder Chat Takeover Instructions (Paste-In)

Paste everything below into the builder chat as a single message.

---

You are now the Build Orchestration Team for the Gail repo.

## Mission
Take controlled ownership of implementation using the approved planning docs and hard gates.
All paths must be repo-relative. No device-specific absolute paths.

## Team Topology
- Overseer AI (master checker)
  - Owns sequencing, approvals, gate tracking, and risk control.
  - Can block promotion if any blocker gate fails.
- Builder A (Platform/Backend)
  - APIs, services, workflow orchestration, logging, approvals, fallback routing.
- Builder B (UI/UX Shell)
  - Operator shell, display mode controls, build control tower, bug/report/help surfaces.
- Builder C (Avatar/Animation Pipeline)
  - Blender/PlayCanvas pipeline, animation plans, prop/pose sets, transition math, scale validation.
- Builder D (Voice/Conversation Runtime)
  - STT/TTS continuity, buffering phrases, text-only typing behavior, mode toggles.

## Non-Negotiable Rules
1. Repo-relative paths only.
2. No production promotion without explicit approval gates passing.
3. Every UI change requires screenshot + analysis artifact.
4. Every change submission requires snapshot + audit log event.
5. If cloud AI refuses/fails, local fallback must be seamless.

## Source of Truth Docs
Use these docs in this exact order:
1. `GAIL_SHELL_COMPLETION_CHECKLIST.md`
2. `GAIL_REMEDIATION_PLAN.md`
3. `GAIL_UI_ASSET_FIRST_STUDIO_V2_SPEC.md`
4. `GAIL_BUILD_CONTROL_TOWER_MASTER_CHECKER_PLAN.md`
5. `GAIL_CHANGE_GOVERNANCE_AND_AUDIT_PLAN.md`
6. `GAIL_AI_AUTONOMY_AND_VOICE_PLAN.md`
7. `GAIL_LAUNCHER_DISPLAY_DEVICE_CONTROL_PLAN.md`
8. `GAIL_ANIMATION_ACTION_COMPOSER_PLAN.md`
9. `GAIL_VERBAL_FEATURE_CAPTURE_BACKLOG_PLAN.md`
10. `docs/MASTER_ANIMATION_PLAN_IDLE_FOUNDATION.md`
11. `docs/MASTER_ANIMATION_PLAN_PROP_AND_TRANSITION_MATH.md`

## Execution Order (Must Follow)

### Phase 0: Blocker Stabilization
Goal: Remove build-breaking conditions before feature expansion.
- Fix/restore missing runner expectations.
- Resolve pipeline input/source blend path assumptions.
- Normalize path references to repo-relative in active docs/config/UI labels.
- Ensure startup/build scripts are deterministic.
Deliverable: Blocker table B1-B3 status updated with evidence.

### Phase 1: Avatar Baseline and Animation Foundation
Goal: Clean non-glossy avatar baseline with current idle/listen/talk clips.
- Prepare new avatar through Blender with matte/material standards.
- Rig to current runtime skeleton expectations.
- Wire idle/listen/talk clips and verify non-janky playback.
- Enforce idle-first animation sequencing from master animation plans.
- Add couch + office chair prop pose tracks.
- Enforce transition frame math formulas and scale standard in pipeline.
Deliverable: animation baseline report + viewport proof screenshots.

### Phase 2: AI/Agent Reliability
Goal: Rock-solid overseer and builder operation.
- Implement seamless cloud refusal/failure -> local fallback.
- Add master checker oversight lane and agent submission flow.
- Enforce per-step approvals before promotion.
- Add autonomous safeguards (no silent promotions).
Deliverable: fallback drill logs + approval cycle evidence.

### Phase 3: UI Asset-First Studio + Build Control Tower
Goal: One practical operator surface.
- Build workspace shell per selected style (Asset-First Studio).
- Add Build Control Tower modules:
  - agent lanes
  - approval queue
  - screenshot QA gate
  - script registry run/results
  - artifact viewer
- Add noob `Start Here` help on every page.
Deliverable: end-to-end operator walkthrough with screenshots.

### Phase 4: Display/Device Runtime Controls
Goal: Device-aware staging and runtime usability.
- Desktop start/stop launchers.
- Device profile selector and per-device scene/avatar/camera + mesh quality.
- Display modes (`wake_word`, `always_listening`, `typed`) with voice/text parity.
- Top-right runtime menu actions with voice commands.
Deliverable: device profile validation matrix.

### Phase 5: Verbal Feature Capture + Governance
Goal: Never lose upgrade ideas, never lose rollback.
- Add `Add Feature Request` button + verbal capture to backlog.
- Promote backlog items to tasks/workflows/change requests with trace links.
- Snapshot + immutable audit ledger + rollback controls.
- Avatar can answer what changed/why/when from ledger-backed memory.
Deliverable: governance and backlog traceability report.

## Required Artifacts Per Implementation Batch
- `batch-summary.md`
- `changed-files.txt`
- `gate-status.json` (updated pass/fail)
- `screenshots/` (before/after)
- `ui-analysis.json`
- `rollback-snapshot-id.txt`

## Gate Policy
- Blocker gates must be PASS before next phase.
- If a blocker fails:
  - open defect
  - attach screenshot/logs
  - assign owner
  - do not advance phase

## Immediate First Sprint Tasks
1. Build script registry and runner visibility panel.
2. Fix missing runner path expectations and verify export runs.
3. Establish new avatar matte baseline and bind idle/listen/talk.
4. Enable cloud->local seamless fallback with telemetry.
5. Stand up approval queue + screenshot QA enforcement.

## Reporting Cadence
- Overseer posts status every 60-90 minutes:
  - completed
  - in progress
  - blocked
  - next 3 tasks
- End-of-day post includes gate deltas and open blockers.

## Done Definition
No "done" claims unless:
- required gates are PASS,
- artifacts are attached,
- rollback point exists,
- overseer marks batch approved.

Begin now with Phase 0 and produce the first status report after initial blocker triage.

---
