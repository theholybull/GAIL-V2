# Gail Body Line Isolation

Date: 2026-04-22

## Locked baseline

- `work-lite` remains on the transcript-backed baseline from `docs/WORKING_COPY_CHAT_RECORD_2026-04-22.md`
- Gail keeps the temporary Cherry-hair swap
- Gail top, pants, and shoes are present again
- Gail non-shoe accessories remain out of the active load path
- live manifest still resolves normal Gail through `gail_lite`

## Facts proven before the isolate

- The visible "lines" survived removal of:
  - Gail top
  - Gail pants
  - Gail accessories
  - Gail shoes
- Gail body vertices are **not** weighted to `.001` duplicate bones:
  - audited `playcanvas-app/assets/gail_lite/avatar/base_face/gail_base_avatar.glb`
  - result: `dupWeightedVertices = 0` for every Gail body primitive
- Gail body carries extra skinned render nodes that Vera and Cherry do not:
  - `Genesis 8 Female Eyelashes (2).Shape`
  - `VAMPLaurinaBrows.Shape`
- `VAMPLaurinaBrows.Shape` is the strongest suspect because:
  - it is Gail-only
  - it contains three hair-style materials: `Hair01`, `Hair02`, `Hair03`
  - it contributes `166,028` vertices total across its three primitives
  - it is skinned to brow/head bones, not duplicate `.001` bones
- All active animation clips target those same brow bones:
  - `CenterBrow`
  - `lBrowInner`
  - `lBrowMid`
  - `lBrowOuter`
  - `rBrowInner`
  - `rBrowMid`
  - `rBrowOuter`

## Isolated change

- File changed: [work-lite-rebuild.ts](</D:/Gail 2.1/working_copy/playcanvas-app/src/work-lite-rebuild.ts>)
- Added `disableEntityRenderTree(...)`
- Disabled only `VAMPLaurinaBrows.Shape` inside the loaded Gail body before the scene bounds/alignment step
- No clothing asset changes
- No runtime asset-root changes
- No animation binding changes

## Why this isolate is justified

- It is body-only, which matches the clothing/accessory elimination sequence
- It removes only the Gail-only body mesh that is both:
  - visually hair-like
  - directly driven by the animated brow rig
- It does not touch Gail base body skin, clothes, or shoes

## Build and live verification

- `tools/build-playcanvas-app.ps1` completed successfully
- animation validation passed during the build
- updated source and built JS were copied to the live C working copy
- served bundle check confirmed the live browser path now contains the `VAMPLaurinaBrows.Shape` isolate

## Current test request

- hard refresh `http://127.0.0.1:4180/client/work-lite/`
- run/load Gail normally
- confirm whether the "lines shooting into space" are gone

If the lines remain after this isolate, the next body-only suspect is `Genesis 8 Female Eyelashes (2).Shape`, not the clothes or shoes.
