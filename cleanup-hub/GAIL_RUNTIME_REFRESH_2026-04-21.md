# Gail Runtime Refresh

Date: `2026-04-21`  
Workspace: `D:\Gail 2.1\working_copy`  
Source blend: `D:\Avatars\Gail\gail.blend`

## What Changed

- recreated the missing Gail runtime exporter at `tools/export_gail_split.py`
- added a repeatable live promotion runner at `tools/run-gail-runtime-refresh.ps1`
- refreshed the live Gail runtime assets from the current source blend:
  - `playcanvas-app/assets/gail/avatar/base_face/gail_base_avatar.glb`
  - `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`
  - `playcanvas-app/assets/gail/clothes/gail_top/gail_top.glb`
  - `playcanvas-app/assets/gail/clothes/gail_pants/gail_pants.glb`
  - `playcanvas-app/assets/gail/clothes/gail_sandals/gail_sandals.glb`
  - `playcanvas-app/assets/gail/accessories/gail_bundle/gail_accessories.glb`
  - `playcanvas-app/assets/gail/accessories/gail_bundle/gail_bracelets.glb`

## Run Artifacts

- live run root:
  - `cleanup-hub/gail-runtime-refresh-20260421-135222`
- export report:
  - `cleanup-hub/gail-runtime-refresh-20260421-135222/gail-runtime-report.json`
- promotion manifest:
  - `cleanup-hub/gail-runtime-refresh-20260421-135222/promotion-manifest.json`
- live asset manifest snapshot:
  - `docs/reports/gail-asset-manifest-20260421-140829.json`
- root-contract proof:
  - `docs/reports/gail-root-contract-20260421-140829.json`
- current live work-lite proof:
  - `docs/reports/worklite-persona-normal-20260421-140719.json`
  - `docs/reports/worklite-persona-normal-20260421-140719.png`

## Export Contract

The refreshed Gail split uses the new mesh map from `D:\Avatars\Gail\gail.blend`:

- avatar:
  - `Victoria 8.Shape`
  - `Genesis 8 Female Eyelashes.Shape`
  - `Genesis 8 Female Eyelashes (2).Shape`
  - `VAMPLaurinaBrows.Shape`
- hair:
  - `Orphelia_Hair.Shape`
- top:
  - `CACH_3Quarter_Sweatshirt.Shape`
  - `CACH_TubeTop.Shape`
- pants:
  - `Hanging Out Pants.Shape`
- sandals:
  - `B25CJHeels.Shape`
- accessories:
  - `Urban Action Bracelets.Shape`

Normalization still had to be applied at export time:

- armature: `Victoria 8`
- object rotation: `+90 deg X`
- object scale: `0.01`

## Verified Results

- all promoted Gail GLBs now pass the root-transform guard
- the live backend manifest resolves the refreshed Gail files and sizes:
  - avatar: `250,026,024` bytes
  - hair: `88,007,804` bytes
  - top: `17,225,968` bytes
  - pants: `13,518,588` bytes
  - sandals: `22,959,488` bytes
  - accessories: `7,370,452` bytes
- the split runtime assets are dramatically smaller and more controllable than the `1.7 GB` source `.blend`

## Current Limitation

The asset refresh itself is good, but the live `work-lite` client is still not consuming the full Gail wardrobe path correctly.

Current live proof shows:

- backend health is good
- asset manifest is good
- work-lite still stalls at `Loading bundle body...`
- the normal-mode probe only requested the base Gail avatar in that run, not the full Gail clothing/hair chain

That means the source export and runtime files are now in better shape than the current `work-lite` loader behavior.

Hair-specific runtime findings and the client-side alpha-threshold fix are documented separately in:

- `cleanup-hub/GAIL_HAIR_RUNTIME_FINDINGS_2026-04-21.md`

## Next Best Move

1. refresh Vera from `D:\Avatars\Vera\Vera.blend`
2. keep Gail as the canonical shared-hair source in runtime mapping
3. fix the `work-lite` normal wardrobe/bundle loader so live Gail reaches a full scene-ready state instead of stopping at base-body load
