# Dependency Bring-Up Report

Date: `2026-04-20`
Workspace: `D:\Gail 2.1\working_copy`

## Scope

This pass brought external runtime dependencies into the active repo one at a time, verified each one live, and recorded the current best order for stabilization work.

Primary goals for this pass:

- move the animation importer into the repo
- move the converted animation library into the repo
- restart the live stack against repo-local paths
- verify what now works versus what still blocks a solid standalone build

## What Was Brought In

### 1. Animation importer

Promoted into:

- `tools/anim-avatar-importer`

Key runtime changes:

- importer path resolution now prefers repo-local roots under `working_copy`
- importer logs and catalog now live under `data/animation-importer`
- importer target animation output now resolves to `playcanvas-app/assets/animations`
- importer browser pages now use `window.location.origin`
- shell importer integration now targets `${window.location.protocol}//${window.location.hostname}:8888`

Verification:

- syntax checks passed for `server.js`, `lib/paths.js`, `lib/catalog.js`, `lib/importer.js`
- importer test suite passed: `117 passed / 0 failed`
- integrated importer now starts from `tools/start-animation-importer.ps1`
- live status endpoint confirmed integrated runtime on `http://127.0.0.1:8888/api/status`

### 2. Converted animation library

Promoted into:

- `data/animation-library/converted_animations_20260401`

Verification:

- source files: `1893`
- repo-local files: `1893`
- source size: `5.79 GB`
- repo-local size: `5.79 GB`
- importer now resolves `libraryRoot` to:
  - `D:\Gail 2.1\working_copy\data\animation-library\converted_animations_20260401`

## Live Verification Summary

### Importer

Verified live:

- `GET /api/status`
- `GET /api/catalog`
- `GET /api/imported`
- `GET /api/handoff-glbs`
- `GET /api/preview-glb?id=...`
- `POST /api/import-single`
- `POST /api/catalog/rebuild`
- `GET /`
- `GET /avatar-import`

Observed:

- catalog size: `1892` clips
- handoff bundle files exposed: `6`
- preview endpoint returned `200` with `model/gltf-binary`
- catalog rebuild completed successfully and rewrote source paths to repo-local library paths
- import-log history still contains pre-rebuild legacy-path entries for the earliest verification imports, but new imports now resolve from the repo-local library copy

Sample verified imports:

- `idle__26777_cover_idle.glb`
- `idle__26965_stand_still.glb`
- `idle__27375_stand_still.glb`

Current importer artifacts:

- `data/animation-importer/catalog.json`
- `data/animation-importer/import-log.json`
- `cleanup-hub/logs/catalog-rebuild-20260420.jsonl`

### Backend and workbench

Verified live:

- `GET /health`
- `GET /animation-workbench/state`
- `GET /animation-workbench/files?root=workspace&path=data/animation-library/converted_animations_20260401`
- `GET /library-assets/combat/26478_sitting_raising_hand_to_shoot.glb`
- `GET /panel/`
- `GET /panel/operator-studio-shell.html`
- `GET /client/work-lite/`
- `GET /display/` -> `302` redirect to `/client/work-lite/`

Observed:

- backend healthy on `http://127.0.0.1:4180`
- workbench now reports `1892` `libraryItems`
- first repo-local library item exposed as:
  - `/library-assets/combat/26478_sitting_raising_hand_to_shoot.glb`
- viewer remained reachable from state endpoint

## What Works Now

- the animation importer is now repo-owned and runs from `working_copy`
- the converted animation library is now stored inside `working_copy`
- the backend now serves library-backed workbench items from the repo-local copy
- the importer can rebuild catalog data against the repo-local library
- the importer can preview GLBs and import them into `playcanvas-app/assets/animations`
- the control panel, Operator Studio shell, work-lite client, and display redirect are live after rebuild
- the repo-local catalog auto-recovers on restart if it was built against an older library root

## What Still Does Not Work Or Is Not Finished

- `avatar-import.html` is still a stub-style tool:
  - it stores registrations in browser `localStorage`
  - it does not yet copy avatar files into the repo or update a real backend registry
- legacy fallback paths still exist in code and launchers as safety fallbacks
- the animation viewer still depends on local Python availability
- Ollama and OpenAI are still external service dependencies when those features are used
- prior UI audit issues still remain and were not the focus of this pass:
  - mobile overflow in `work-lite` and `display`
  - mobile overflow in several Operator Studio pages
  - export/report actions timing out on `POST /exports/run`
  - animation viewer console `404`
- documentation drift outside the active repo still exists on `D:\`

## Best Order From Here

### Order 1: finish the avatar ingestion path

- replace the current `avatar-import.html` localStorage stub with a real repo-backed avatar import flow
- define one authoritative avatar registry and destination layout inside `working_copy`
- verify new avatar parts appear in the shell and runtime without manual file surgery

### Order 2: lock staging and asset contracts

- define one staging profile contract for the client/runtime pipeline
- document which avatar, clothes, accessories, animations, and manifests are required for a valid staged build
- add one reproducible verification path for “staged and ready”

### Order 3: stabilize Operator Studio runtime pages

- retest the animation/import pages now that importer and library are repo-local
- fix known mobile overflow on shell/runtime pages
- fix `POST /exports/run` timeout path

### Order 4: remove unnecessary legacy fallbacks

- once avatar ingest and staging are stable, remove or demote fallback paths that still point outside `working_copy`
- keep only explicit operator-approved fallback behavior

### Order 5: turn this into a release-grade local stack

- package required local runtime dependencies clearly
- define exact “standalone except Blender” requirements
- tighten manager/builder execution rules around staging, docs, and verification gates

## Recommended Immediate Task

The next highest-value task is:

- build a real repo-backed avatar import pipeline to replace the current browser-only registration stub

That directly unlocks the stated goal:

- import new avatars
- get staging right
- then harden the client/runtime build on top of one controlled asset flow
