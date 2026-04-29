# Avatar Runtime Single Source

Date: 2026-04-23

## Decision

Avatar runtime information now has one active source of truth:

- [avatar-runtime.json](</D:/Gail 2.1/working_copy/data/client/avatar-runtime.json>)

The operator-facing shell remains the intended place to change it:

- Avatar Library for active runtime system and runtime health
- Wardrobe for outfit/preset changes
- Runtime Mapping for export/runtime checks

## What Was Consolidated

The new file owns:

- active runtime settings
- available avatar systems
- work-lite asset catalog
- wardrobe presets
- persona-to-avatar body mapping

## Files That Are No Longer Active Authority

These files are retained for compatibility/history, but agents should not edit them for active avatar changes:

- [work-lite-modules.gail.json](</D:/Gail 2.1/working_copy/playcanvas-app/config/work-lite-modules.gail.json>)
- [runtime-settings.json](</D:/Gail 2.1/working_copy/data/client/runtime-settings.json>)
- [wardrobe-presets.json](</D:/Gail 2.1/working_copy/data/client/wardrobe-presets.json>)

## Runtime Wiring

- `ClientRuntimeSettingsService` reads/writes `avatar-runtime.json`
- `ClientAssetsService` reads the asset catalog and persona map from `avatar-runtime.json`
- `WardrobePresetsService` reads/writes wardrobe data in `avatar-runtime.json`
- `work-lite` receives `personaMap` through `/client/asset-manifest` instead of relying only on hardcoded persona body ids

## Verification

Builds passed:

- `tools/build-backend.ps1`
- `tools/build-playcanvas-app.ps1`
- `tools/build-control-panel.ps1`

Live endpoint checks passed after restarting the backend:

- `/client/runtime-settings` returns `gail_primary` and systems from `avatar-runtime.json`
- `/client/asset-manifest?assetRoot=gail_lite` returns `personaMap`
- `/client/wardrobe-presets` returns presets from `avatar-runtime.json`
- PATCH `/client/runtime-settings` writes through the central config
- PATCH `/client/wardrobe-presets` writes through the central config

## Agent Rule

If an agent needs to change avatar asset ids, runtime system options, persona body mappings, or wardrobe slots, edit `data/client/avatar-runtime.json` or use the shell endpoints. Do not patch scattered JSON files or hardcoded client mappings.
