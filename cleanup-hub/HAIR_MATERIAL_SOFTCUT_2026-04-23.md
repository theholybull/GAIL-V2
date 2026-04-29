# Hair Material Softcut

Date: 2026-04-23

## Goal

Make all runtime hair read less like a solid/plastic shell without changing avatar files, pose, animation, or exports.

## Change

File: [work-lite-rebuild.ts](</D:/Gail 2.1/working_copy/playcanvas-app/src/work-lite-rebuild.ts>)

Runtime hair material profile changed:

- `glossCap`: `0.04` -> `0.012`
- `shininessCap`: `14` -> `6`
- `specularityCap`: `0.03` -> `0.012`
- `specularColor`: `0.03` -> `0.012`
- hair `alphaTest`: `0.08` -> `0.22`

Second tuning pass after operator reported hair was still too solid:

- `glossCap`: `0.012` -> `0.006`
- `shininessCap`: `6` -> `3`
- `specularityCap`: `0.012` -> `0.006`
- `specularColor`: `0.012` -> `0.006`
- hair `alphaTest`: `0.22` -> `0.32`

Cache protection:

- `CLIENT_ASSET_VERSION_SALT = "20260423-hair-softcut2"`
- [index.html](</D:/Gail 2.1/working_copy/playcanvas-app/index.html>) cache key is now `20260423-hair-softcut2`

## Why

The previous `alphaTest = 0.08` kept the new Gail Voss hair visible, but it allowed too much soft alpha to render as filled mass. Raising the cutout threshold trims low-alpha pixels from hair cards. Lowering spec/gloss removes the plastic shine.

## Scope

- Material/runtime only
- Applies to all `kind: "hair"` assets loaded by `work-lite`
- No GLB changes
- No Blender/export changes
- No animation changes

## Verification

- `tools/build-playcanvas-app.ps1` passed
- animation validation passed
- live `/client/work-lite/` serves cache key `20260423-hair-softcut1`
- served JS contains:
  - `CLIENT_ASSET_VERSION_SALT = "20260423-hair-softcut1"`
  - `material.alphaTest = 0.22`
  - `glossCap: 0.012`
  - `shininessCap: 6`
- second pass verified live `/client/work-lite/` serves cache key `20260423-hair-softcut2`
- second pass served JS contains:
  - `CLIENT_ASSET_VERSION_SALT = "20260423-hair-softcut2"`
  - `material.alphaTest = 0.32`
  - `glossCap: 0.006`
  - `shininessCap: 3`

## Operator Check

Hard refresh `http://127.0.0.1:4180/client/work-lite/`.

If the hair is still too solid, raise alphaTest slightly. If it becomes too thin or patchy, lower alphaTest slightly.

## Reverted Softcut And Tried Back-Face Culling

Operator reported:

- `softcut2` made the top disappear
- sides still looked solid

Reverted:

- `alphaTest` back to `0.08`
- `glossCap` back to `0.04`
- `shininessCap` back to `14`
- `specularityCap` back to `0.03`
- `specularColor` back to `0.03`

New material-only trial:

- `material.cull = pc.CULLFACE_BACK`
- cache key and asset salt: `20260423-hair-cull1`

Reason:

- keep the low alpha threshold so the top does not disappear
- stop rendering both sides of every hair card, which can make side hair read as a doubled-up solid shell

Verification:

- `tools/build-playcanvas-app.ps1` passed
- animation validation passed
- live `/client/work-lite/` serves cache key `20260423-hair-cull1`
- served JS contains:
  - `material.alphaTest = 0.08`
  - `glossCap: 0.04`
  - `shininessCap: 14`
  - `material.cull = pc.CULLFACE_BACK`
