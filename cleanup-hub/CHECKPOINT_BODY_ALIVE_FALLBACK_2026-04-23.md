# Body Alive Fallback Checkpoint - 2026-04-23

This is the known-good fallback after operator confirmation that the smoother animation, facial micro-movement, and body-alive motion feel good.

Checkpoint label:

- `solid-fallback-20260423-1035-body-alive1`

Primary working repo:

- `D:\Gail 2.1\working_copy`

External fallback copy:

- `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`

Copy scope:

- copied working files and assets from `D:\Gail 2.1\working_copy`
- excluded `.git`
- excluded `node_modules`
- excluded Python bytecode cache files (`*.pyc`)

Robocopy result:

- dirs total: `279`
- dirs copied: `275`
- files total: `3007`
- files copied: `3007`
- bytes copied: `14.729 GB`
- failures: `0`
- log: `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1\robocopy.log`

Git HEAD at checkpoint time:

- `4db8c2dfd4d63817f32ac1f13f8ec1a7460b2cd3`

Important boundary:

- this is a filesystem fallback snapshot, not a clean Git release commit
- active avatar/runtime source remains `data/client/avatar-runtime.json`
- do not overwrite this checkpoint with older avatar/runtime folders

## Current Client Feel

Current live client cache key:

- `20260423-body-alive1`

Included runtime feel passes:

- animation natural timing: slower playback, smoother crossfades, short state holds
- facial micro movement: randomized grouped mouth/lip/chin/jaw/smile/squint motion with mild asymmetry
- body alive motion: randomized breathing, chest/spine/shoulder/arm response, torso weight shift, and long-response breath pauses

Boundary:

- no avatar GLBs changed for these feel passes
- no animation GLBs changed for these feel passes
- no Blender/export scripts changed for these feel passes
- no avatar runtime config changed for these feel passes

## Verification

Fresh verification completed before checkpoint:

- `tools/build-backend.ps1`: passed
- `tools/build-playcanvas-app.ps1`: passed
- animation GLB validator: passed `11` files, `0` errors, `0` warnings
- `tools/build-control-panel.ps1`: passed
- live `/client/work-lite/` serves `20260423-body-alive1`

Live mirror check:

- D and live C copies matched for:
  - `playcanvas-app/src/work-lite-rebuild.ts`
  - `playcanvas-app/index.html`
  - `playcanvas-app/dist/playcanvas-app/src/work-lite-rebuild.js`

## Restore Notes

To restore this fallback into a new working folder:

1. Copy `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1` to the desired working location.
2. Install dependencies because `node_modules` is intentionally not included.
3. Rebuild with:
   - `tools/build-backend.ps1`
   - `tools/build-playcanvas-app.ps1`
   - `tools/build-control-panel.ps1`
4. Start the backend from the restored working copy.
5. Verify `/client/work-lite/` serves `20260423-body-alive1`.
