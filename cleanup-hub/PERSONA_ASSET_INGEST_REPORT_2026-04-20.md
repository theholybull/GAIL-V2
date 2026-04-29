# Persona Asset Ingest Report

Date: `2026-04-20`
Generated from run: `cleanup-hub/persona-ingest-20260420-1630`
Source root: `D:\avatars`
Blender: `C:\Program Files\Blender Foundation\Blender 4.2\blender.exe`

## Scope

This pass exported persona assets from the external blend source root into a repo-local staging folder so the project now has a repeatable Blender-driven split for:

- avatar body/base meshes
- hair meshes
- clothing meshes

Repo scripts used:

- `tools/export_persona_assets.py`
- `tools/run-persona-asset-ingest.ps1`

## Source Blends

- `D:\avatars\Cherry\Cherry.blend`
- `D:\avatars\Gail\gail.blend`
- `D:\avatars\Vera\vera.blend`
- `D:\avatars\Gail\clothes\gail_daily_jacket.blend`
- `D:\avatars\Gail\clothes\gail_work_1.blend`

## Output Root

- `cleanup-hub/persona-ingest-20260420-1630/exports`

Primary machine-readable artifacts:

- `cleanup-hub/persona-ingest-20260420-1630/ingest-summary.json`
- `cleanup-hub/persona-ingest-20260420-1630/ingest-summary.md`
- `cleanup-hub/persona-ingest-20260420-1630/reports/*.json`
- `cleanup-hub/persona-ingest-20260420-1630/logs/*.log`

## Results

### Cherry

- avatar export: `ok`
- hair export: `ok`
- clothes export: `ok`
- staged files:
  - `cleanup-hub/persona-ingest-20260420-1630/exports/cherry/avatar/cherry_avatar.glb`
  - `cleanup-hub/persona-ingest-20260420-1630/exports/cherry/hair/cherry_hair.glb`
  - `cleanup-hub/persona-ingest-20260420-1630/exports/cherry/clothes/cherry_clothes.glb`

### Gail

- avatar export: `ok`
- hair export: `skipped`
- clothes export: `ok`
- interpretation:
  - operator decision on `2026-04-21`: Gail's current hair look is the canonical shared default
  - Cherry and Vera may use the Gail hair look for now because both alternates are effectively the same at the moment
  - `gail.blend` does not currently expose a distinct hair mesh to the classifier as a separate staged `hair` export
  - the prior false hair classification on `B25CJHeels.Shape` was corrected
  - this means the product decision is now ahead of the current automation: the runtime should treat Gail hair as the shared default even though the current split pass did not emit a separate `gail_hair.glb`
- staged files:
  - `cleanup-hub/persona-ingest-20260420-1630/exports/gail/avatar/gail_avatar.glb`
  - `cleanup-hub/persona-ingest-20260420-1630/exports/gail/clothes/gail_clothes.glb`

### Vera

- avatar export: `ok`
- hair export: `ok`
- clothes export: `ok`
- staged files:
  - `cleanup-hub/persona-ingest-20260420-1630/exports/vera/avatar/vera_avatar.glb`
  - `cleanup-hub/persona-ingest-20260420-1630/exports/vera/hair/vera_hair.glb`
  - `cleanup-hub/persona-ingest-20260420-1630/exports/vera/clothes/vera_clothes.glb`

### Gail Daily Jacket

- avatar export: `ok`
- hair export: `ok`
- clothes export: `ok`
- interpretation:
  - this blend currently contains the cleanest explicit staged hair export for Gail-style hair
  - that is a technical staging fact, not the canonical product-style decision
- staged files:
  - `cleanup-hub/persona-ingest-20260420-1630/exports/gail_daily_jacket/avatar/gail_daily_jacket_avatar.glb`
  - `cleanup-hub/persona-ingest-20260420-1630/exports/gail_daily_jacket/hair/gail_daily_jacket_hair.glb`
  - `cleanup-hub/persona-ingest-20260420-1630/exports/gail_daily_jacket/clothes/gail_daily_jacket_clothes.glb`

### Gail Work 1

- avatar export: `skipped`
- hair export: `skipped`
- clothes export: `ok`
- warning:
  - selected armature has no mesh armature modifiers, so this export may behave like a static clothing asset
- staged file:
  - `cleanup-hub/persona-ingest-20260420-1630/exports/gail_work_1/clothes/gail_work_1_clothes.glb`

## Pipeline Fixes Made During This Pass

- hardened the batch runner against strict-mode property failures in summary generation
- switched Blender batch execution to redirected process logs so AnimoXtend stderr noise no longer aborts the run
- fixed spaced-path argument quoting so repo paths under `D:\Gail 2.1\...` execute correctly
- tightened hair classification so footwear and other clothing meshes no longer land in the hair export

## Current Status

- the repo now has a working Blender-driven staging export for persona assets from `D:\avatars`
- the staged GLBs live under `cleanup-hub` only and have not yet been promoted into runtime manifests or client asset registries
- the current product decision is that Gail's hair look is the shared default for Gail, Cherry, and Vera until additional styles are uploaded
- the runtime manifest mapping for that shared hair decision is now implemented in `playcanvas-app/config/work-lite-modules.gail.json`
- the intended direction is selectable hair and clothes that can change by context, including time-of-day and weather
- the active missing product step is still repo-backed avatar ingestion and staging promotion, not Blender export itself

## Recommended Next Moves

1. Decide which staged exports should be promoted into `playcanvas-app/assets` and under what naming contract.
2. Add a repo-backed avatar registry/manifest write step so future avatar imports become one repeatable operation instead of a manual staging handoff.
3. Design the selectable style layer so future uploaded hair and clothing variants can switch by operator choice, time-of-day, and weather.
