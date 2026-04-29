# Clean Start Plan

## Goal

Create a stable baseline so ongoing Gail work can continue without noise from local artifacts, temporary scripts, or mixed-in runtime state.

## Current Baseline

- backend build passes
- playcanvas-app build passes
- web-control-panel build passes
- backend regression suite passes (`120 passed`, `0 failed`)
- stack launch path is operational through `tools/start-gail-stack.ps1`

## What Was Cleaned

- removed temporary root scripts:
  - `tmp_export_avatar_package.py`
  - `tmp_inspect_blend.py`
  - `tmp_inspect_live_body_orientation.py`
  - `tmp_inspect_master_v2.py`
- removed temporary backend script:
  - `backend/tmp_check_manifest.cjs`
- removed generated Unity artifact folder:
  - `rebuild/unity/obj/`
- expanded `.gitignore` to exclude local/runtime noise:
  - temp files (`tmp_*`)
  - runtime folder (`runtime/`)
  - Unity obj output (`rebuild/unity/obj/`)
  - local data runtime/import/debug folders under `data/`
  - local secret file (`tools/animoxtend_api_key.txt`)
  - unpacked/local tool runtime folders under `tools/`

## Execution Plan (Forward)

### Phase 1: Repo Hygiene Freeze

1. Keep generated/runtime outputs ignored and out of commits.
2. Separate feature work from environment/state files.
3. Normalize docs that still use machine-specific drive paths.

### Phase 2: Stabilization Commit Set

1. Group commits by domain:
   - backend/auth/workflow
   - client/panel/runtime surfaces
   - tools/ops scripts
   - docs-only updates
2. Attach one backend test report to each backend-impacting change window.

### Phase 3: Security + Operator Completion

1. Finish paired-device lifecycle:
   - inspect
   - revoke
   - re-issue
2. Expand route enforcement tests in `paired_required_for_sensitive` mode.

### Phase 4: Workflow + Import Reliability

1. Complete workflow workbench execution artifacts and review flow.
2. Harden document import classification + dedupe path.
3. Preserve source provenance for imported records.

### Phase 5: Avatar Runtime Completion

1. Finalize avatar/action manifest contract.
2. Complete runtime animation mapping (`talk`, transitions, fallback behaviors).
3. Add regression checks for client asset manifest/runtime loading.

## Clean Start Rules

- never commit runtime state from `data/` or `runtime/`
- never commit local secret files
- always run:
  - build scripts for touched surfaces
  - `tools/run-backend-tests.ps1` for backend-impacting changes
- write outcomes to `docs/BUILD_LOG.md` and `docs/reports/`
