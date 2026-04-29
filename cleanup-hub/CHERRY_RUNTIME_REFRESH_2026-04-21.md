# Cherry Runtime Refresh

Date: `2026-04-21`
Workspace: `D:\Gail 2.1\working_copy`
Source blend: `D:\Avatars\Cherry\Cherry.blend`
Live run root: `cleanup-hub/cherry-runtime-refresh-20260421-live2`

## What Changed

- added a Cherry-specific runtime exporter at `tools/export_cherry_runtime.py`
- added a repeatable live promotion runner at `tools/run-cherry-runtime-refresh.ps1`
- exported Cherry from source into the current runtime contract:
  - `playcanvas-app/assets/gail/girlfriend/avatar/base_face/cherry_base_avatar.glb`
  - `playcanvas-app/assets/gail/girlfriend/clothing/girlfriend_dress.glb`
  - `playcanvas-app/assets/gail/girlfriend/clothing/girlfriend_shoes.glb`
  - `playcanvas-app/assets/gail/girlfriend/hair/cherry_hair.glb`
- backed up the prior live Cherry files under `cleanup-hub/cherry-runtime-refresh-20260421-live2/before`

## Export Contract

The new exporter normalized Cherry's source armature before GLB export.

Confirmed source transform that required normalization:

- armature: `Genesis 8 Female`
- object rotation: `+90° X`
- object scale: `0.01`

Cherry runtime split used:

- avatar:
  - `Genesis 8 Female.Shape`
  - `Genesis 8 Female Eyelashes.Shape`
- dress:
  - `His Shirt.Shape`
  - `TDA Panty.Shape`
- shoes:
  - `AS8_HighHeels.Shape`
- hair:
  - `Voss Hair Genesis 8 Female.Shape`

## Validation

- machine-readable export report:
  - `cleanup-hub/cherry-runtime-refresh-20260421-live2/cherry-runtime-report.json`
- promotion manifest:
  - `cleanup-hub/cherry-runtime-refresh-20260421-live2/promotion-manifest.json`
- all promoted Cherry GLBs pass the root-transform guard:
  - `cherry_base_avatar.glb`
  - `girlfriend_dress.glb`
  - `girlfriend_shoes.glb`
  - `cherry_hair.glb`

## Live Runtime Results

Best stable Cherry proof after promotion:

- report: `docs/reports/worklite-persona-private_girlfriend-20260421-131550.json`
- screenshot: `docs/reports/worklite-persona-private_girlfriend-20260421-131550.png`

What that proof shows:

- Cherry is using the new promoted base avatar
- Cherry dress and shoes load from the refreshed runtime files
- scale and orientation are correct
- Cherry is still in rest pose / T-pose
- Cherry still inherits the current broken shared Gail hair in the best-working runtime path, so hair stretches to the floor

Additional runtime findings from this pass:

- testing Cherry's own hair mapping did change backend manifest resolution to `gail/girlfriend/hair/cherry_hair.glb`
- but that path regressed the live load sequence and stalled at `Loading Cherry dress...`
- later clean probes also showed inconsistent loader behavior, including an unexpected fallback into Gail asset requests

Important takeaway:

- the Cherry asset refresh itself is good
- the remaining instability is now clearly in the `work-lite` persona/wardrobe loader path, not in the Cherry source export contract

## Best Current State

Current repo state was left on the more usable mapping:

- Cherry runtime body, dress, shoes, and optional hair files are refreshed from `D:\Avatars\Cherry\Cherry.blend`
- `girlfriend_hair` remains mapped to shared Gail hair for now because Cherry's own hair path currently causes a worse runtime stall

## Next Best Move

Before touching Vera, instrument and stabilize the persona wardrobe loader so we can trust the Cherry baseline:

1. trace why Cherry sometimes reaches `Scene ready` and other times never progresses past wardrobe load
2. fix the rest-pose animation bind problem
3. then run the same refresh flow for Vera
