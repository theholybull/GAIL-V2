# Gail Top Asset Isolation - 2026-04-22

## What Was Learned

The first sweater test failed because `work-lite` does not use `wardrobe-presets.json` to choose Gail's loaded display modules.

Facts:

- `work-lite` builds Gail display assets from the asset manifest
- the Gail top was still being autoloaded from `gail_outfit_top`
- changing `gail_workwear.slots.upper` to `null` had no effect on the `work-lite` stage

## Actual Isolation Applied

To remove the sweater from the active normal-Gail route, the top asset itself was taken out of the manifest-resolved load path.

Renamed in both D and live C copies:

- `playcanvas-app/assets/gail_lite/clothes/gail_top/gail_top.glb`
  - to `gail_top.glb.disabled`
- `playcanvas-app/assets/gail/clothes/gail_top/gail_top.glb`
  - to `gail_top.glb.disabled`

## Verification

Live manifest check:

- `GET /client/asset-manifest?assetRoot=gail_lite`
- confirmed:
  - `selectedAssetRoot = "gail_lite"`
  - `gail_outfit_top.present = false`
  - `gail_outfit_top` appears in `missingAssets`

That means the sweater/top is no longer in the active `work-lite` load path for Gail.

## Backups

Original files preserved in:

- `cleanup-hub/gail-top-asset-isolation-20260422/gail_top.gail_lite.original.glb`
- `cleanup-hub/gail-top-asset-isolation-20260422/gail_top.gail.original.glb`
- `cleanup-hub/gail-top-asset-isolation-20260422/gail_top.gail_lite.live.original.glb`

## Visual Check

Refresh the live client:

- `http://127.0.0.1:4180/client/work-lite/`

If the sweater is still visible after this, then the visible lines are not coming from the separate top asset and the next suspect is the body/avatar asset itself.
