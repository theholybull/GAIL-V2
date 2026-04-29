# Phase Promotion Readiness Checklist

Date: 2026-04-05  
Purpose: One checklist for what must be ready before promoting each phase.

## How To Use
1. Complete `Global Preflight` first.
2. Complete the phase section you are promoting (`Phase 1` ... `Phase 5`).
3. Mark `GO` only when all blocker items are checked.
4. If any blocker fails, stay in current phase and open a fix item.

## Global Preflight (Every Phase)
- [ ] Backend stack starts cleanly via `tools/start-gail-stack.ps1`.
- [ ] Shell loads at `/panel/` and shows backend `Online`.
- [ ] No failing blocker from `docs/Build plan 4_4/GAIL_SHELL_COMPLETION_CHECKLIST.md`.
- [ ] Verification scripts are present under `tools/` for the target phase.
- [ ] Report folder created at `data/reports/build-batches/<date>-<phase>-final/`.
- [ ] Rollback snapshot exists and snapshot ID is recorded.
- [ ] Guided mode is enabled for the operator walkthrough.

## Operator Inputs You Should Have Ready
- [ ] Asset package for the current phase (avatar/animations/props/textures) staged in agreed repo path.
- [ ] Any required API keys/tokens available and validated.
- [ ] Device/runtime targets identified (desktop only or desktop + display devices).
- [ ] Approval owner available for sign-off window.
- [ ] Test scenarios prepared (happy path + one failure path).

## Pipeline Paths (DAZ -> Blender -> PlayCanvas) Readiness
- [ ] Blender resolves from `tools/blender-common.ps1` (4.2+ accepted).
- [ ] DAZ export scripts available in `tools/daz-export-scripts/`.
- [ ] Blender add-on available in `tools/blender-gail-export-addon/`.
- [ ] Pipeline runner available: `tools/export-playcanvas-pipeline.ps1`.
- [ ] Avatar export runner available: `tools/export-avatar-assets.ps1`.
- [ ] Runtime asset roots exist under `playcanvas-app/assets/gail/`.

Verification commands:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-animoxtend-setup.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-shell-phase1-links-scripts-smoke.ps1
```

## Phase 1 Promotion Checklist (Avatar Baseline + Animation Foundation)
Blockers:
- [ ] Idle/listen/talk baseline clips load and play without jitter.
- [ ] Avatar baseline is non-glossy/matte and scale is correct.
- [ ] Transition math/idle-first sequencing is in place.
- [ ] Phase 1 verifier passes:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-shell-phase1-verify.ps1
```

Evidence:
- [ ] Baseline screenshots captured.
- [ ] Phase report + walkthrough generated.

## Phase 2 Promotion Checklist (AI/Agent Reliability)
Blockers:
- [ ] Command routing and intent handling pass in shell/backend.
- [ ] Approval cycle functions (queue/read/approve flow).
- [ ] Fallback path is operational (no hard stop on refusal/failure).
- [ ] Phase 2 verifier passes:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-shell-phase2-verify.ps1
```

Evidence:
- [ ] Fallback drill log captured.
- [ ] Approval/audit events visible in shell.
- [ ] Phase report + walkthrough generated.

## Phase 3 Promotion Checklist (Operator UX + Control Tower)
Blockers:
- [ ] Command palette quick actions execute real operations.
- [ ] Keyboard workflow shortcuts work (`Ctrl/Cmd+1..4`, `Ctrl/Cmd+K`, etc.).
- [ ] Workflow review queue jump action works from workflow page.
- [ ] Notification + audit trail entries are visible and append correctly.
- [ ] Phase 3 verifier passes:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-shell-phase3-verify.ps1
```

Evidence:
- [ ] Operator walkthrough completed start-to-finish.
- [ ] Phase report + walkthrough generated.

## Phase 4 Promotion Checklist (Display/Device Runtime Controls)
You need ready:
- [ ] Display/device targets list (names + intended role).
- [ ] Device profile defaults (scene/avatar/camera/quality per device).
- [ ] Launch behavior preference (`wake_word`, `always_listening`, `typed`).

Blockers:
- [ ] Start/stop launcher controls work from shell.
- [ ] Device profile selector persists and applies per target.
- [ ] Display mode switching works with voice/text parity.
- [ ] Runtime menu actions execute without dead links.

Evidence:
- [ ] `LD1` to `LD7` gates pass in `GAIL_LAUNCHER_DISPLAY_DEVICE_CONTROL_PLAN.md`.
- [ ] Device validation matrix captured.

## Phase 5 Promotion Checklist (Verbal Feature Capture + Governance)
You need ready:
- [ ] Backlog taxonomy (feature types/tags/priorities).
- [ ] Approval policy for promoting backlog items.
- [ ] Rollback owner and audit retention preference.

Blockers:
- [ ] Feature capture works from button and verbal route.
- [ ] Captured items trace to tasks/workflows/change requests.
- [ ] Immutable audit ledger + rollback controls function.
- [ ] Avatar can answer change-history questions from ledger data.

Evidence:
- [ ] `CG1` to `CG5` pass.
- [ ] `VF1` to `VF4` pass.
- [ ] Governance traceability report generated.

## Final GO / NO-GO
- [ ] All phase blocker checks complete.
- [ ] All required evidence artifacts attached.
- [ ] Rollback point recorded.
- [ ] Approval granted by overseer/operator.

Decision:
- [ ] GO
- [ ] NO-GO

