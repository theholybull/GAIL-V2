# Cleanup Pass - 2026-04-23

Purpose:

- remove old generated artifacts and test results from the active working copies after locking the known-good fallback checkpoint
- keep the active repo small enough to work in without old evidence folders getting mistaken for current state

Preserved fallback:

- `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`

Cleaned active roots:

- `D:\Gail 2.1\working_copy`
- `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`

Removed:

- old `cleanup-hub` import/export artifact directories
- old `docs/reports` generated reports, screenshots, and proof images
- old `data/reports` generated UI/test reports
- old `data/audit/snapshots` generated audit snapshots
- Python `__pycache__` and `*.pyc` files
- root-level temporary probe/diff files
- old D-only Blender/runtime scratch files in `data/runtime`

Not removed:

- active PlayCanvas/avatar assets
- active source files
- `data/client/avatar-runtime.json`
- the solid fallback checkpoint
- top-level legacy project folders outside `D:\Gail 2.1\working_copy`

Result:

- removed items: `1190`
- freed total: approximately `33.36 GB`
- freed from D working copy: approximately `16.73 GB`
- freed from live C mirror: approximately `16.63 GB`

Post-cleanup active sizes:

- D `cleanup-hub`: under `1 MB`
- D `docs/reports`: latest backend report pair only at cleanup time, then regenerated one fresh verification pair
- D `data/runtime`: small runtime files only
- D `data/reports`: empty
- D `data/audit/snapshots`: empty

Verification after cleanup:

- `tools/build-backend.ps1`: passed
- `tools/build-playcanvas-app.ps1`: passed
- animation validator: passed `11` files, `0` errors, `0` warnings
- `tools/build-control-panel.ps1`: passed
- `/client/runtime-settings`: returned active avatar system `gail_primary`
- `tools/run-backend-tests.ps1`: passed `121/121`

Fresh post-cleanup backend test report:

- `docs/reports/backend-test-report-20260423-092242.json`
- `docs/reports/backend-test-report-20260423-092242.md`

New guardrails:

- `.gitignore` now ignores bulky generated report/import/cache patterns
- `tools/clean-generated-artifacts.ps1` provides a reusable cleanup pass with dry-run default

Agent rule:

- do not leave raw generated reports, screenshots, GLB scratch files, or import/export artifact folders in the active repo unless they are the current evidence for an active task
- summarize the outcome in docs and keep bulky raw evidence in an explicit checkpoint/archive only
- run `tools/clean-generated-artifacts.ps1` without `-Execute` before deleting anything, then run with `-Execute` only when the target list is clearly generated clutter
