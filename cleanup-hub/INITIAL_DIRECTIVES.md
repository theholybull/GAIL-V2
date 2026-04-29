# Initial Directives

These are the first controlled directive batches for getting the drive and repo back under control.

Rule:

- no destructive file moves or deletes happen until Batch 1 and Batch 2 outputs are reviewed by the operator

## Batch 1: Source-Of-Truth Stabilization

### DIR-001

- Owner: `builder-a`
- Area: docs/tools/governance
- Goal: audit active-repo references to old roots such as `F:\Gail` and classify them as:
  - must-fix now
  - safe legacy reference
  - archive-only reference
- Write scope:
  - `docs/`
  - `tools/`
  - `cleanup-hub/`
- Required output:
  - path drift report
  - prioritized fix list
- Required checks:
  - no destructive edits
  - report saved in `cleanup-hub/`

### DIR-002

- Owner: `builder-b`
- Area: shell/runtime alignment
- Goal: audit Operator Studio shell pages and runtime pages against live backend/system reality so the shell reflects the actual product instead of mixed live/mock states
- Write scope:
  - `web-control-panel/`
  - `playcanvas-app/`
  - `cleanup-hub/`
- Required output:
  - page status report:
    - live
    - partially live
    - planned-only
- Required checks:
  - `npm.cmd run check` for touched frontend surfaces

## Batch 2: Cleanup Classification

### DIR-003

- Owner: `manager-alpha`
- Area: drive cleanup
- Goal: produce a top-level `D:\` cleanup manifest from the rules in `PROJECT_MAP.md` and `DRIVE_CLEANUP_PLAN.md`
- Write scope:
  - `cleanup-hub/`
- Required output:
  - batchable manifest with:
    - keep active
    - freeze read-only
    - archive candidate
    - decision-pending
- Required checks:
  - no moves or deletes
  - all candidate roots logged first

### DIR-004

- Owner: `builder-a`
- Area: repo hygiene
- Goal: audit runtime/generated/untracked files in the active repo and separate:
  - should stay tracked
  - should be ignored
  - should be moved to reports/runtime/output locations
- Write scope:
  - `.gitignore`
  - `docs/`
  - `cleanup-hub/`
- Required output:
  - hygiene report
  - proposed ignore/runtime-state rules
- Required checks:
  - no deletion of user files

## Batch 3: Runtime And Asset Contract Cleanup

### DIR-005

- Owner: `builder-b`
- Area: runtime assets
- Goal: reconcile `playcanvas-app/config/work-lite-modules.gail.json` with the actual asset tree and current persona/runtime expectations
- Write scope:
  - `playcanvas-app/`
  - `cleanup-hub/`
- Required output:
  - asset contract report
  - mismatch list
  - recommended normalization plan
- Required checks:
  - `npm.cmd run check` in `playcanvas-app` if code changes

### DIR-006

- Owner: `builder-a`
- Area: animation and pipeline docs
- Goal: reconcile active animation/export docs with current repo reality and mark archive/spec docs that should not be treated as source of truth
- Write scope:
  - `docs/`
  - `cleanup-hub/`
- Required output:
  - source-of-truth doc list
  - archive/spec doc list

## Operator Gate Before Destructive Cleanup

Before any move/archive/delete batch starts, the operator should review:

1. path drift report
2. shell/runtime status report
3. drive cleanup manifest
4. repo hygiene report
5. asset contract report
6. doc source-of-truth report

Only after that should the first archive or delete batch be approved.

## Batch 4: Standalone Assembly

### DIR-007

- Owner: `builder-a`
- Area: tooling integration
- Goal: vendor the animation importer into the active repo and make its core paths repo-relative or configurable
- Write scope:
  - `tools/`
  - `docs/`
  - `cleanup-hub/`
- Required output:
  - importer integration report
  - updated launcher/runbook
- Required checks:
  - importer can still serve on port `8888`
  - shell animation workbench assumptions remain valid

### DIR-008

- Owner: `builder-b`
- Area: runtime staging
- Goal: define the first real staging profile contract and identify the minimum UI/runtime hooks needed to replace auto-staging
- Write scope:
  - `playcanvas-app/`
  - `web-control-panel/`
  - `cleanup-hub/`
- Required output:
  - staging implementation note
  - list of required files and UI surfaces
- Required checks:
  - no destructive runtime asset moves yet
