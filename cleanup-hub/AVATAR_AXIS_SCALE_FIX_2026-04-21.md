# Avatar Axis And Scale Fix

Date: 2026-04-21
Workspace: `D:\Gail 2.1\working_copy`
Scope: Gail base avatar and Gail wardrobe orientation/scale mismatch between Blender export space and the PlayCanvas runtime

## Root Cause

The active Gail source armature in `D:\avatars\Gail\gail.blend` was not in identity object space.

Confirmed source state from Blender:

- armature: `Victoria 8`
- rotation: `+90°` on `X`
- scale: `0.01`

That transform was being carried into exported GLBs as the scene root contract for:

- `gail_base_avatar.glb`
- `gail_top.glb`
- `gail_pants.glb`
- `gail_sandals.glb`
- `gail_bracelets.glb`

This is why Gail appeared:

- laid back with the soles facing the camera
- too small
- framed incorrectly relative to Vera and Cherry

## Fix Applied

Updated exporter normalization in:

- `tools/export_gail_split.py`
- `tools/export_persona_assets.py`

New export rule:

- before GLB export, the selected armature and its skinned meshes are normalized by applying location, rotation, and scale in Blender object space

This makes the exported GLB root contract consistent with PlayCanvas expectations:

- root translation: identity
- root rotation: identity
- root scale: identity

## Assets Regenerated

Re-exported from `D:\avatars\Gail\gail.blend` into the active repo:

- `playcanvas-app/assets/gail/avatar/base_face/gail_base_avatar.glb`
- `playcanvas-app/assets/gail/clothes/gail_top/gail_top.glb`
- `playcanvas-app/assets/gail/clothes/gail_pants/gail_pants.glb`
- `playcanvas-app/assets/gail/clothes/gail_sandals/gail_sandals.glb`
- `playcanvas-app/assets/gail/accessories/gail_bundle/gail_bracelets.glb`

## Validation

Added root-contract validator:

- `tools/check-gltf-root-contract.js`

Validated Gail exports now satisfy the identity-root contract.

Machine-readable root-contract report:

- `docs/reports/gail-root-contract-20260421-1149.json`

Live visual proof after the fix:

- `docs/reports/worklite-persona-normal-20260421-114312.png`
- `docs/reports/worklite-persona-normal-20260421-114312.json`

Result:

- Gail is upright
- Gail is correctly sized for the stage
- framing is materially corrected

## Remaining Separate Issue

This fix addressed orientation and scale.

It did not fully solve the separate wardrobe load pipeline issue:

- current normal-mode probe still stops at `Loading gail outfit pants...`
- body orientation/scale is fixed, but wardrobe/hair completion still needs its own pass

## Rule Going Forward

Any avatar or wardrobe export intended for the runtime must ship with an identity GLB scene-root transform.

If the source armature is not identity in Blender object space, the exporter must normalize it before writing the GLB.
