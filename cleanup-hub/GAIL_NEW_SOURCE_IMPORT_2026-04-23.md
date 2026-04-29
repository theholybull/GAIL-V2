# Gail New Source Import

Date: 2026-04-23

## Source

- New source file: [gail.blend](</D:/Avatars/Gail/gail.blend>)
- Source timestamp: `2026-04-23 00:46:39`
- Source size: `298,409,764` bytes

## What changed

- Removed the temporary Gail brow isolate from [work-lite-rebuild.ts](</D:/Gail 2.1/working_copy/playcanvas-app/src/work-lite-rebuild.ts>) so the new avatar would load without the prior body-only test shim.
- Updated [export_gail_split.py](</D:/Gail 2.1/working_copy/tools/export_gail_split.py>) to recognize the new Gail mesh names used in the fresh blend:
  - avatar: `Genesis 8 Female.Shape`
  - hair: `Voss Hair Genesis 8 Female.Shape`
  - top: `MK Short T-shirt.Shape`
  - pants: `Urban Action Pants.Shape`
  - footwear: `Angie Sneakers.Shape`

## Export runs

- Full Gail:
  - `cleanup-hub/gail-runtime-refresh-20260423-new-gail-v2`
- Gail lite:
  - `cleanup-hub/gail-lite-runtime-refresh-20260423-new-gail-v2`

## Promoted runtime outputs

### `gail`

- body: `139,200,244` bytes
- hair: `36,483,732` bytes
- top: `41,408,480` bytes
- pants: `19,274,364` bytes
- footwear: `5,844,712` bytes

### `gail_lite`

- body: `43,918,416` bytes
- hair: `13,952,556` bytes
- top: `8,422,736` bytes
- pants: `7,330,360` bytes
- footwear: `2,011,560` bytes

## Live sync

- Rebuilt the PlayCanvas app after removing the brow isolate.
- Updated [index.html](</D:/Gail 2.1/working_copy/playcanvas-app/index.html>) to cache key `20260423-new-gail1`.
- Synced the following from `D:\Gail 2.1\working_copy` to the live C working copy:
  - `playcanvas-app/index.html`
  - `playcanvas-app/src/work-lite-rebuild.ts`
  - `playcanvas-app/dist/playcanvas-app/src/work-lite-rebuild.js`
  - `playcanvas-app/assets/gail/...`
  - `playcanvas-app/assets/gail_lite/...`

## Live verification

- `/client/work-lite/` serves cache key `20260423-new-gail1`
- `/client/asset-manifest?assetRoot=gail_lite` now resolves:
  - body: `43,918,416`
  - hair: `13,952,556`
  - top: `8,422,736`
  - pants: `7,330,360`
  - footwear: `2,011,560`

## Current note

- The export/import step is complete and live.
- Visual runtime confirmation is still needed from the operator for pose, hair behavior, and whether the prior line issue is gone with the new Gail source.
