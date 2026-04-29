# Solid Fallback Checkpoint - 2026-04-23

This is the current known-good fallback point after operator visual confirmation that the client/avatar state looks good.

Checkpoint label:

- `solid-fallback-20260423-0848`

Primary working repo:

- `D:\Gail 2.1\working_copy`

External fallback copy:

- `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`

Copy scope:

- copied working files and assets from `D:\Gail 2.1\working_copy`
- excluded `.git`
- excluded `node_modules`
- excluded Python bytecode cache files (`*.pyc`)

Robocopy result:

- dirs total: `1078`
- dirs copied: `1074`
- files total: `4445`
- files copied: `4351`
- bytes copied: `31.446 GB`
- failures: `0`
- log: `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848\robocopy.log`

Important boundary:

- this is a filesystem fallback snapshot, not a clean Git release commit
- Git HEAD at checkpoint time: `4db8c2dfd4d63817f32ac1f13f8ec1a7460b2cd3`
- the working tree was intentionally dirty with active generated assets, docs, reports, and runtime files
- do not use old `D:\` folders or older avatar exports to overwrite this checkpoint without operator approval

## Verification

Fresh verification completed on 2026-04-23:

- `tools/build-backend.ps1`: passed
- `tools/build-playcanvas-app.ps1`: passed
- animation GLB validator during PlayCanvas build: passed `11` files, `0` errors, `0` warnings
- `tools/build-control-panel.ps1`: passed
- `tools/run-backend-tests.ps1`: passed `121/121`

Backend test report:

- `docs/reports/backend-test-report-20260423-084838.json`
- `docs/reports/backend-test-report-20260423-084838.md`

Live endpoint spot checks:

- `/client/runtime-settings` returned active avatar system `gail_primary`
- `/client/runtime-settings` returned active asset root `gail`
- `/client/asset-manifest?assetRoot=gail_lite` returned `avatarReady: true`
- `/client/asset-manifest?assetRoot=gail_lite` returned the central persona map for Gail, Vera, and Cherry

Known endpoint note:

- `/client/asset-manifest?assetRoot=gail_lite` returned `assetRoot: null` while still returning `avatarReady: true` and the expected persona map
- this was recorded as current-state behavior, not treated as a fallback blocker because the operator confirmed the client visuals are good

## Current Avatar Runtime Rules

Active avatar/runtime source of truth:

- `data/client/avatar-runtime.json`

This file owns:

- active runtime settings
- available avatar systems
- asset catalog
- wardrobe presets
- persona-to-avatar body mappings

Non-authoritative legacy files:

- `playcanvas-app/config/work-lite-modules.gail.json`
- `data/client/runtime-settings.json`
- `data/client/wardrobe-presets.json`

Agent rule:

- change avatar runtime data through `data/client/avatar-runtime.json` or the shell endpoints that write to it
- do not reintroduce split avatar config edits unless the operator explicitly approves a migration

## Current Client/Avatar State

Current `work-lite` cache/material checkpoint:

- `CLIENT_ASSET_VERSION_SALT = "20260423-hair-cull1"`
- `alphaTest = 0.08`
- `glossCap = 0.04`
- `shininessCap = 14`
- `specularityCap = 0.03`
- `specularColor = 0.03`
- `cull = pc.CULLFACE_BACK`

Important asset hashes:

- `playcanvas-app\assets\gail_lite\avatar\base_face\gail_base_avatar.glb`
  - SHA256 `B217E92D469F121C7DA220DD70A49D9A8E044D8DBA7CCE9EA31191589CF8C716`
- `playcanvas-app\assets\gail_lite\hair\meili_hair\meili_hair.glb`
  - SHA256 `B83A726809109A52052935EB6DFA00F7AA1D77C6CADCFDB9ED30692369AD5823`
- `data\client\avatar-runtime.json`
  - SHA256 `F18694A6122D89177C9A63910F465D3C1A355F3747E29C48C37505D6374089B4`
- `playcanvas-app\src\work-lite-rebuild.ts`
  - SHA256 `0E7566669EB78E8DECF409145181F24B0D93D8BF70EE46E0647B3362D77B9BD6`

## Restore Notes

To restore this fallback into a new working folder:

1. Copy `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848` to the desired working location.
2. Install dependencies in the required Node project folders because `node_modules` is intentionally not included.
3. Rebuild with:
   - `tools/build-backend.ps1`
   - `tools/build-playcanvas-app.ps1`
   - `tools/build-control-panel.ps1`
4. Run backend verification:
   - `tools/run-backend-tests.ps1`
5. Start the backend from the restored working copy and verify `/client/runtime-settings` and `/client/asset-manifest`.

Do not restore from older avatar folders over this checkpoint unless the operator explicitly asks for that older source.
