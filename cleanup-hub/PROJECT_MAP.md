# Project Map

This file separates the active Gail build from sidecars, references, and older forks.

## Active Build Root

Primary write location:

- `D:\Gail 2.1\working_copy`

This is the main Gail product repo and the only repo that should receive normal feature work unless the operator explicitly says otherwise.

Core active areas inside the repo:

- `backend/`
  - Node/TypeScript backend, SQLite runtime, providers, auth, workflow, manager, governance, bug reports, exports
- `shared/`
  - contracts, command definitions, shared types
- `web-control-panel/`
  - operator panel and Operator Studio shell
- `playcanvas-app/`
  - work-lite runtime, phone client, asset config, runtime scenes
- `blender/`
  - animation master workflow and export metadata
- `tools/`
  - PowerShell automation, export runners, validators, startup/stop/test scripts
- `data/`
  - runtime state, SQLite DBs, reports, logs, providers, memory
- `docs/`
  - product, operator, architecture, workflow, audit, and report docs

## Active Product Intent

Gail is a local-first, operator-first AI presence platform built around:

- one trusted host machine
- one operator shell
- one PlayCanvas runtime surface
- one Blender-to-PlayCanvas asset/export pipeline
- one workflow layer for review-first AI-assisted work
- one device-trust model for local, LAN, and later remote access

## Active Supporting Sidecars

These appear to support the active Gail build but are not the main repo root:

- `D:\Gail 2.1\anim_avatar_importer`
  - standalone animation browser/importer and validator for the converted clip library
- `D:\Gail 2.1\converted_animations_20260401`
  - converted GLB animation library used for inspection/import curation
- `D:\Gail 2.1\animation guidelines`
  - design/spec planning layer for shell, autonomy, device modes, governance, and persona systems

Rule:

- these are valid support assets, but product code and governance changes still belong in `working_copy` unless the operator directs otherwise

## Reference / Read-Only Repos

These look important but should be treated as read-only reference until explicitly promoted into active work:

- `D:\GAIL-V2-recovery-test`
  - PlayCanvas engine fork/recovery repo with repo-recovery docs
- `D:\engine-main`
  - nested engine repo/reference copy
- `D:\engine-main-github-backup`
  - likely a backup copy of the engine work

Rule:

- do not patch, reorganize, or delete these during normal Gail feature work
- if something must be pulled from them, record that decision in `cleanup-hub/DECISION_LOG.md`

## Older Workstream / Transitional Roots

These appear to be older split-workspace or migration-era roots:

- `D:\Gail_workstreams`
  - prior split between `ops-control` and `playcanvas-base`
- `D:\playcanvas-app`
  - top-level asset-only or detached runtime root

Rule:

- do not treat these as current source of truth
- keep them frozen until they are either archived or deliberately mined for missing assets/docs

## Large Asset / Personal Working Areas

These likely contain source assets, experiments, or loose content and need deliberate cleanup decisions later:

- `D:\avatar`
- `D:\Avatars`
- `D:\data`
- `D:\Misc`
- `D:\Pictures`
- `D:\Temp`
- `D:\_recovery`
- root loose assets such as `gail_final.blend`, `gail_final.fbx`

Rule:

- no mass move/delete without an explicit inventory and operator sign-off

## System / Ignore Areas

- `D:\$RECYCLE.BIN`
- `D:\System Volume Information`
- `D:\.gradle`

These are not part of Gail cleanup planning beyond basic awareness.

## Planned But Not Reliably Present

Docs mention or imply these surfaces, but the active repo does not currently contain matching first-class roots:

- `mobile-shell/`
- `watch-client/`

Current repo reality:

- phone runtime exists as `playcanvas-app/phone.html` and `playcanvas-app/src/phone.ts`
- watch/mobile remain design targets more than active folders

## Project Truth Rules

- one active product repo: `D:\Gail 2.1\working_copy`
- no new Gail project roots on `D:\` without operator approval
- no feature work in backup repos
- no silent promotions from older roots into the active repo
- every migration from a sidecar/root into the active repo must be logged
