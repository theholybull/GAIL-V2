# Path Drift Report 2026-04-20

This is a first-pass, non-destructive audit of active-doc and active-tool path drift.

Scope of this pass:

- selected high-signal active docs
- selected active tool and Blender README files
- not a full repo-wide exhaustive search yet

## Summary

Confirmed drift patterns:

- active docs still contain `F:\Gail` examples
- some state docs still refer to `D:\Gail` rather than `D:\Gail 2.1\working_copy`
- at least one active tool still defaults to `F:\Gail`

Current source of truth:

- active repo root: `D:\Gail 2.1\working_copy`

## Confirmed Findings

### Active Docs

`docs/PLAYCANVAS_AVATAR_PIPELINE.md`

- lines `143`, `149`, `153`, `157`, `163`
- issue: examples still invoke `F:\Gail\tools\export-playcanvas-pipeline.ps1`
- classification: must-fix active path drift

`docs/PROJECT_STATE.md`

- line `40`
- issue: still frames SSD migration around move to `F:\Gail`
- classification: review wording; may be historically true but not current active-root truth

- line `162`
- issue: file-browser service described as locked to `D:\Gail`
- classification: must-fix active path drift if the intended active root is now `D:\Gail 2.1\working_copy`

- line `171`
- issue: manager build-log path still references `D:\Gail\data\...`
- classification: must-fix active path drift

### Tools / Pipeline Docs

`tools/migrate-to-ssd.ps1`

- line `3`
- issue: default target root is still `F:\Gail`
- classification: decision-needed
- note: this may be intentional for SSD migration history, but the default no longer matches the active repo root

`tools/blender-gail-export-addon/README.md`

- lines `101-118`
- issue: smoke-test commands still reference `F:\Gail\...`
- classification: must-fix active path drift

`blender/animation_master/README.md`

- lines `40`, `52`
- issue: setup validation and archive examples still reference `F:\Gail\...`
- classification: must-fix active path drift

## Drift Classes

### Must-Fix Active Drift

- active operational docs that tell the operator or builders to use old paths
- active README command examples that will mislead new work
- active state docs that point services or artifacts at the wrong project root

### Decision-Needed Drift

- historical migration defaults that may still be useful as examples
- docs describing former roots for archive/recovery context

### Safe Legacy Reference

- archive snapshots
- frozen historical reports
- old handoff bundles preserved as record rather than active runbook

## Recommended Next Fix Batch

1. normalize active command examples to repo-relative commands where possible
2. replace hardcoded `D:\Gail` active-root references with the current truth
3. leave archive/history docs alone unless they are still being presented as active instructions

## Notes

- this report is intentionally conservative
- no files were moved or deleted
- a wider sweep across the full docs tree should be done in a later builder-a directive
