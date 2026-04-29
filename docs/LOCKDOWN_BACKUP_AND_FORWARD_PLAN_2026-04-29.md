# Lockdown Backup And Forward Plan

Date: 2026-04-29

## Purpose

Protect the current working Gail prototype before cleanup or feature work.

The rule is simple:

- D is the active build root.
- C is a promoted working backup, not a scratch area.
- A lockdown backup is an immutable filesystem snapshot.
- Nothing gets deleted or promoted until the active root passes the gate.

## Current Roots

Active root:

- `D:\Gail 2.1\working_copy`

Existing C working backup/live mirror:

- `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`

Current lockdown backup:

- `D:\Gail 2.1\lockdown-backups\working_copy_lockdown_20260429-083228`

Robocopy log:

- `D:\Gail 2.1\lockdown-backups\working_copy_lockdown_20260429-083228.robocopy.log`

Git status capture:

- `D:\Gail 2.1\lockdown-backups\working_copy_lockdown_20260429-083228.git-status.txt`

Git head capture:

- `D:\Gail 2.1\lockdown-backups\working_copy_lockdown_20260429-083228.git-head.txt`

## Lockdown Evidence

Snapshot copy:

- source file count: `17794`
- backup file count after status captures: `17795`
- source size: `26.471 GB`
- backup size: `26.471 GB`
- robocopy failed files: `0`
- robocopy mismatches: `0`

Git base:

- D and C both report `4db8c2dfd4d63817f32ac1f13f8ec1a7460b2cd3`
- dirty-state count captured at lockdown: `828`

Validation gate run after lockdown:

- backend build: PASS
- PlayCanvas build: PASS
- web control panel build: PASS
- animation GLB validator: PASS, `11 files, 0 errors, 0 warnings`
- animation importer test suite: PASS, `117 passed, 0 failed`
- managed backend regression from D root: PASS, `122 passed, 0 failed`

Backend regression report:

- `docs/reports/backend-test-report-20260429-085018.md`
- `docs/reports/backend-test-report-20260429-085018.json`

## Promotion Policy

Use three levels.

### Level 1: Active Work

Location:

- `D:\Gail 2.1\working_copy`

Use this for normal implementation, testing, docs, and asset work.

Rules:

- Can be dirty.
- Can have experiments.
- Must be backed up before broad cleanup.
- Must pass the gate before promotion.

### Level 2: Lockdown Backup

Location:

- `D:\Gail 2.1\lockdown-backups\working_copy_lockdown_<timestamp>`

Use this as the "do not lose what we have" snapshot.

Rules:

- Never edit it directly.
- Never run tests inside it if that would write reports or mutate data.
- Restore from it by copying to a new working folder, not by editing the snapshot.
- Keep the robocopy log, git status, and test evidence next to it.

### Level 3: C Promoted Backup

Location:

- `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`

Use C as the latest promoted known-good working copy.

Rules:

- Do not use C for experiments.
- Do not let the live backend keep running from C once D is the active root.
- Promote D to C only after D passes:
  - backend build
  - PlayCanvas build
  - web control panel build
  - animation validator
  - backend regression
  - minimal live route smoke
- Promotion should preserve the previous C state first, either as a timestamped C-side archive or a D lockdown backup.

## Promotion Gate

Before copying D to C, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\create-lockdown-backup.ps1
npm run build --prefix .\backend
npm run build --prefix .\playcanvas-app
npm run build --prefix .\web-control-panel
node .\tools\validate-animation-glbs.js
powershell -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1 -EnsureBackend -ShutdownWhenDone -AuthMode open
```

Then run a route smoke after starting D:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\start-backend-background.ps1
Invoke-RestMethod http://127.0.0.1:4180/health
Invoke-RestMethod http://127.0.0.1:4180/client/runtime-settings
Invoke-RestMethod "http://127.0.0.1:4180/client/asset-manifest?assetRoot=gail_lite"
```

Pass criteria:

- all commands complete successfully
- backend route output resolves against the D root, not the old C root
- asset manifest reports the active avatar bundle ready

## Cleanup Policy

No destructive cleanup until after a lockdown backup exists.

Allowed before cleanup:

- add docs
- add scripts
- add manifests
- write reports
- create new backup folders

Not allowed until explicitly reviewed:

- deleting old reports
- deleting old checkpoints
- deleting C mirror content
- removing generated runtime data that may be the only copy of an asset or proof run
- running a mirror/sync command that can delete destination files

Cleanup should happen in passes:

1. Inventory only.
2. Classify as source, runtime asset, generated report, local runtime state, old checkpoint, or disposable cache.
3. Move questionable files to a dated hold folder.
4. Re-run the promotion gate.
5. Delete only after a second backup exists and the user approves the category.

## Forward Build Path

### Phase 0: Lock The Ground

Goals:

- stop C/D drift
- make D the live runtime root
- preserve C as promoted backup
- make backup creation repeatable

Deliverables:

- `tools/create-lockdown-backup.ps1`
- this document
- current lockdown backup
- route smoke showing D is the active backend root

### Phase 1: Shell Unification

Goals:

- make Operator Studio the main control surface
- reduce scattered launch paths
- expose avatar, wardrobe, animation, environment, personality, agents, and distribution status in one shell

Deliverables:

- one Start Gail path
- one health/status screen
- one runtime contract screen
- one evidence panel for latest build/test reports

### Phase 2: Runtime Contract

Goals:

- consolidate avatar, wardrobe, animation, environment, and device display state
- replace ad hoc localStorage placement with saved environment anchors

Deliverables:

- runtime contract manifest
- environment anchor manifest
- interaction point manifest
- animation action manifest
- wardrobe slot compatibility manifest

### Phase 3: Feature Tracks A-I

Build tracks:

- A: kiosk animation library
- B: avatar import pipeline
- C: wardrobe system
- D: breast/body morph physics controls
- E: environment placement and daily-life anchors
- F: personality and emotional engine
- G: gamepad control
- H: Codex-like agent interface
- I: distribution and rollback

Order:

1. runtime contract and shell unification
2. animation/action library
3. avatar import and wardrobe
4. placement anchors and gamepad emote controls
5. emotion engine tied to animation and voice
6. agent interface and build control
7. distribution packaging

## Immediate Next Actions

1. Start the backend from D only.
2. Confirm no active backend process is launched from C.
3. Add a D-root route smoke proof to `docs/reports`.
4. Inventory cleanup candidates without deleting them.
5. Promote only after the gate passes again.

