# Current System Assessment 2026-04-20

This is the best current assembled view of Gail using the newest credible components found on `D:\`.

## Executive Read

The most up-to-date credible Gail system is not spread evenly across the drive.

The strongest current build is:

1. active product repo from `D:\Gail 2.1\working_copy`
2. animation importer from `D:\Gail 2.1\anim_avatar_importer`
3. converted clip library from `D:\Gail 2.1\converted_animations_20260401`
4. planning/spec overlays from `D:\Gail 2.1\animation guidelines`

The other major roots are older reference or recovery material and should not be treated as active build sources.

## Most Recent Component Dates

### Active Repo Components

| Component | Latest Source Date | Latest Source File | Meaning |
|---|---:|---|---|
| `playcanvas-app` | 2026-04-20 10:29:58 | `src/work-lite-rebuild.ts` | newest active runtime code |
| `docs` | 2026-04-20 11:06:28 | `docs/CHANGE_LOG.md` | newest active governance/docs layer |
| `data` | 2026-04-20 10:18:35 | `data/providers/local-llm-config.json` | live runtime state continued after code work |
| `tools` | 2026-04-17 14:52:51 | `tools/export_gail_split.py` | latest primary tool update |
| `web-control-panel` | 2026-04-16 13:56:51 | `src/animation-workbench.js` | latest shell/source update |
| `backend` | 2026-04-16 08:22:29 | `api/domain-http-routes.ts` | latest backend source update |
| `blender` | 2026-04-14 11:59:05 | `animation_master/manifests/runtime_shape_keys.vera.counselor.json` | latest Blender source/manifests update |
| `shared` | 2026-04-14 11:11:30 | `command-definitions/hardwired-commands.ts` | latest shared contract/command update |

### Sidecars And Neighbor Roots

| Component | Latest Date | Latest File | Assessment |
|---|---:|---|---|
| `anim_avatar_importer` source | 2026-04-16 13:41:08 | `server.js` | current enough to promote into repo |
| `anim_avatar_importer` runtime data | 2026-04-16 14:11:35 | `data/catalog.json` | generated runtime state, not source of truth |
| `animation guidelines` | 2026-04-08 13:07:18 | `GAIL_SHELL_COMPLETION_CHECKLIST.md` | useful spec layer |
| `Gail_workstreams` | 2026-04-09 09:30:41 | `ops-control/tools/validate-animoxtend-prereqs.ps1` | older transitional root |
| `GAIL-V2-recovery-test` | 2026-04-04 09:13:48 | model text file | reference only |
| `converted_animations_20260401` | 2026-04-01 08:15:28 | `README.md` | static library payload, still relevant |
| `engine-main` | 2026-04-01 20:01:55 | `build/playcanvas.d.ts` | engine reference only |

## Best Current System We Actually Have

### Core Product

Use the active repo for:

- backend and all HTTP routes
- workflow engine
- manager-agent and builder governance
- Operator Studio shell
- work-lite runtime
- phone client
- export orchestration
- pairing, auth, voice, provider config, memory, bug reports, governance, build control

### Animation Tooling

Use the sidecar importer for:

- animation catalog scanning
- five-law validation
- strip-fix pipeline
- clip preview and import into runtime animation targets
- avatar import UI surface

Proof it is already part of the intended live system:

- `web-control-panel/src/animation-workbench.js` talks to `http://localhost:8888`
- shell copy explicitly says to start the importer if the import server is offline

### Animation Viewer

Use the repo-local viewer path for:

- simple browser-hosted viewer runtime at port `8778`
- lightweight viewing of generated viewer metadata

This is already represented by:

- `tools/start-animation-viewer.ps1`
- `tools/animation_viewer_runtime/index.html`

### Asset Payload

The newest active Gail runtime asset payload appears to be:

- main Gail base/clothes/accessories refreshed on `2026-04-17`
- counselor assets refreshed on `2026-04-14`
- girlfriend assets refreshed on `2026-04-17`
- older `private/*` assets still present from `2026-04-10`

This means the repo currently contains overlapping persona-era asset conventions that should be normalized before calling the runtime solid.

## Current Blockers To A Solid Build

### 1. Importer is not repo-standalone yet

The importer is self-contained, but it is not repo-standalone:

- `anim_avatar_importer/lib/catalog.js` expects `..\..\converted_animations_20260401`
- `anim_avatar_importer/lib/importer.js` writes into `..\..\working_copy\playcanvas-app\assets\animations`
- `anim_avatar_importer/server.js` reads handoff animations through `..\working_copy\playcanvas-app\assets\handoffs\...`

Meaning:

- it already depends on Gail layout
- it just depends on it from outside the repo instead of from inside the repo

### 2. Staging is still mostly planned, not real

The staging/calibration plan exists, but the implementation is not there yet:

- manual calibrator: planned
- persisted staging profiles: planned
- transform lock/apply per target context: planned
- Blender normalization helper: planned

### 3. Work-lite runtime is still in containment mode

`docs/WORK_LITE_DISPLAY_CONTAINMENT_2026-04-08.md` makes clear that work-lite is still in a temporary safe-state:

- skeletal body animation disabled
- visible-body fallback still active
- clothing fit still approximate
- blink behavior still compensating around export/runtime issues

### 4. Path drift is still real

Confirmed active drift still exists in selected docs and tool readmes:

- active docs still use `F:\Gail`
- some active state docs still reference `D:\Gail`

### 5. Repo contains mixed live work and loose artifacts

The active repo root still has loose diagnostic files and unrelated modified/untracked runtime state. That does not block assessment, but it does block calling the repo “clean.”

## What Should Be Considered Active Versus Frozen

### Active

- `D:\Gail 2.1\working_copy`
- `D:\Gail 2.1\anim_avatar_importer`
- `D:\Gail 2.1\converted_animations_20260401`
- `D:\Gail 2.1\animation guidelines`

### Frozen / Reference Only

- `D:\Gail_workstreams`
- `D:\GAIL-V2-recovery-test`
- `D:\engine-main`
- `D:\engine-main-github-backup`

## Recommendation

Do not create another top-level “clean working copy.”

Instead:

- turn `D:\Gail 2.1\working_copy` into the clean working copy
- pull the importer inward
- make paths repo-relative
- add staging as a first-class repo config/system
- then harden runtime and smoke coverage around that single root
