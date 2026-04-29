# Gail New Hair Y Fix

Date: 2026-04-23

## Problem

After importing the new `D:\Avatars\Gail\gail.blend`, Gail loaded correctly except for hair.

The hair file was present in the manifest:

- `playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb`
- size: `13,952,556` bytes

## Root cause

The old Gail exporter hair correction was still being applied to the new Voss hair.

That correction was originally added for a previous Gail hair export that came in near floor/origin space. The new Voss hair already exports near the head, so applying the correction moved it too high.

Bad live bounds before the fix:

- hair Y range: `3.07` to `3.45`
- Gail face/head Y range: approximately `1.56` to `1.79`

Corrected exporter evidence:

- the exporter now detects the hair is already in head/body space
- `glb_fix.applied = false`
- `current_y_bounds = [1.4419605731964111, 1.8281116485595703]`

## Fix

- Updated [export_gail_split.py](</D:/Gail 2.1/working_copy/tools/export_gail_split.py>) so `translate_gail_hair_vertices_to_head_space(...)` skips the lift when hair vertices already appear to be in head/body space.
- Reran both Gail export paths:
  - `cleanup-hub/gail-runtime-refresh-20260423-hair-yfix`
  - `cleanup-hub/gail-lite-runtime-refresh-20260423-hair-yfix`
- Synced corrected `gail` and `gail_lite` assets to the live C working copy.
- Added `CLIENT_ASSET_VERSION_SALT = "20260423-gail-hair-yfix1"` in [work-lite-rebuild.ts](</D:/Gail 2.1/working_copy/playcanvas-app/src/work-lite-rebuild.ts>) because the corrected hair GLB kept the same byte size as the bad one.
- Updated [index.html](</D:/Gail 2.1/working_copy/playcanvas-app/index.html>) to cache key `20260423-gail-hair-yfix1`.

## Verification

- `tools/build-playcanvas-app.ps1` passed.
- Animation GLB validation passed.
- live `/client/work-lite/` serves cache key `20260423-gail-hair-yfix1`.
- live JS contains the new asset cache salt.
- D and C `gail_lite` hair files have matching SHA256:
  - `B83A726809109A52052935EB6DFA00F7AA1D77C6CADCFDB9ED30692369AD5823`
- corrected `gail_lite` hair bounds:
  - scalp Y: `1.6067` to `1.8000`
  - hair1 Y: `1.4420` to `1.8281`
  - hair2 Y: `1.4552` to `1.8260`

## Operator Check

Hard refresh `http://127.0.0.1:4180/client/work-lite/` and verify Gail hair is visible on/around the head.
