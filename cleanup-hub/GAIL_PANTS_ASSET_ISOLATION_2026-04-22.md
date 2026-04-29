# Gail Pants Asset Isolation - 2026-04-22

## What Changed

After the Gail top/sweater isolate, the operator confirmed the visible lines were still present.

So:

- the Gail top asset was restored
- the next isolate was the Gail pants asset

## Active Asset State

Restored:

- `playcanvas-app/assets/gail_lite/clothes/gail_top/gail_top.glb`
- `playcanvas-app/assets/gail/clothes/gail_top/gail_top.glb`

Removed from the live load path:

- `playcanvas-app/assets/gail_lite/clothes/gail_pants/gail_pants.glb`
  - renamed to `gail_pants.glb.disabled`
- `playcanvas-app/assets/gail/clothes/gail_pants/gail_pants.glb`
  - renamed to `gail_pants.glb.disabled`

Applied in both D and live C working copies.

## Verification

Live manifest check:

- `GET /client/asset-manifest?assetRoot=gail_lite`

Confirmed:

- `selectedAssetRoot = "gail_lite"`
- `gail_outfit_top.present = true`
- `gail_outfit_pants.present = false`
- `gail_outfit_pants` appears in `missingAssets`

## Backups

Original pants files preserved in:

- `cleanup-hub/gail-pants-asset-isolation-20260422/gail_pants.gail_lite.original.glb`
- `cleanup-hub/gail-pants-asset-isolation-20260422/gail_pants.gail_lite.live.original.glb`
- `cleanup-hub/gail-pants-asset-isolation-20260422/gail_pants.gail.original.glb`
- `cleanup-hub/gail-pants-asset-isolation-20260422/gail_pants.gail.live.original.glb`

## Visual Check

Refresh the live client:

- `http://127.0.0.1:4180/client/work-lite/`

Current intended state for the next check:

- shirt restored
- Cherry-hair workaround still active
- pants removed from the active load path
