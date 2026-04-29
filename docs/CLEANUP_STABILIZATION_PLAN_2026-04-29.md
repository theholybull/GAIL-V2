# Cleanup And Stabilization Plan

Date: 2026-04-29

## Rule Zero

Do not delete first.

The project has working behavior, large assets, generated proof runs, old checkpoints, and duplicated roots. Cleanup must preserve recoverability before it improves neatness.

## Current Protected Backups

Primary documented lockdown:

- `D:\Gail 2.1\lockdown-backups\working_copy_lockdown_20260429-085311`

Earlier pre-document lockdown:

- `D:\Gail 2.1\lockdown-backups\working_copy_lockdown_20260429-083228`

Existing C promoted backup/live mirror:

- `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`

Current body-alive fallback checkpoint:

- `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`

Previous solid fallback checkpoint:

- `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`

## Cleanup Classification

Every file or folder should be classified before action.

### Keep In Active Root

- source code
- current docs
- current runtime manifests
- PlayCanvas runtime assets
- Blender source/export scripts
- current build/test scripts
- current launcher scripts
- current reports that prove the latest gate

### Keep In Lockdown Only

- old generated proof reports
- old screenshots
- old temporary probe outputs
- stale build logs
- old audit snapshots
- one-off debug artifacts

These should not be deleted until at least one lockdown backup exists and a second validation gate passes.

### Move To Hold First

Use a dated hold folder for anything uncertain:

- `D:\Gail 2.1\cleanup-hold\YYYYMMDD-<topic>`

Move candidates there first. Do not delete them immediately.

### Disposable After Backup

- Python `__pycache__`
- stale `.pid` files
- stale backend runtime logs
- temporary screenshot scripts
- generated UI screenshots older than the latest accepted gate
- old reports already preserved in lockdown

Even these should be removed only after the gate passes.

## Cleanup Pass Order

### Pass 1: Runtime Root Correction

Goal:

- D is the active runtime root.
- C is not used by the live backend unless explicitly promoted.

Tasks:

- confirm port `4180` backend route output resolves to D paths
- update docs that still say F or old C paths when they refer to the active root
- make `Start-Gail.ps1` and backend helper scripts consistently start from their own repo root

Gate:

- D root smoke report passes
- backend regression passes

### Pass 2: Report And Audit Triage

Goal:

- reduce active-root noise without losing evidence.

Tasks:

- keep the latest backend report
- keep latest route smoke report
- move older reports to `cleanup-hold` or rely on lockdown copies
- do not delete old report categories until user approves

Gate:

- no source or runtime assets affected
- build/test gate passes

### Pass 3: Generated Cache Triage

Goal:

- remove generated runtime noise from active work.

Candidates:

- `__pycache__`
- stale `.pid`
- old temporary GLBs under runtime test folders
- old ad hoc screenshot scripts after confirming they are not referenced

Gate:

- backend build passes
- PlayCanvas build passes
- animation validator passes

### Pass 4: C Promotion Reset

Goal:

- restore C to its intended role: working backup only.

Tasks:

- stop any backend process running from C
- preserve the current C state first
- promote D to C only after full gate
- document promotion date and test evidence

Gate:

- D full gate passes
- C copy succeeds
- C is not immediately used as active runtime

## Forward Product Work After Cleanup

Once cleanup pass 1 is complete, start feature work in this order:

1. Runtime contract screen in Operator Studio.
2. Kiosk animation library curation.
3. Avatar import pipeline.
4. Wardrobe slot compatibility and preview.
5. Environment anchors and interaction points.
6. Body morph physics controls.
7. Emotion engine and persona-to-animation mapping.
8. Gamepad emote/anchor control.
9. Agent control interface.
10. Distribution package and rollback flow.

## Current Stop Point

As of this plan:

- backup is locked
- D backend route smoke passes
- broad deletion has not started
- cleanup should begin with inventory and path correction only

