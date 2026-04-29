# Gail Shoe Asset Isolation - 2026-04-22

## What Changed

After the Gail accessory isolate, the operator reported the visible lines were still present and requested the final isolate to be the shoes, with accessories staying out.

So:

- accessories remained removed from the active load path
- the Gail sandals/shoes were removed next

## Active Asset State

Still removed:

- non-shoe Gail accessory files

Removed for this isolate:

- `playcanvas-app/assets/gail_lite/clothes/gail_sandals/gail_sandals.glb`
  - renamed to `gail_sandals.glb.disabled`
- `playcanvas-app/assets/gail/clothes/gail_sandals/gail_sandals.glb`
  - renamed to `gail_sandals.glb.disabled`

Applied in both D and live C working copies.

## Verification

Live manifest check:

- `GET /client/asset-manifest?assetRoot=gail_lite`

Confirmed:

- `selectedAssetRoot = "gail_lite"`
- `gail_outfit_pants.present = true`
- `gail_accessories_bundle.present = false`
- `gail_outfit_sandals.present = false`
- `gail_outfit_sandals` appears in `missingAssets`

## Backups

Original sandal files preserved in:

- `cleanup-hub/gail-shoe-asset-isolation-20260422/`

## Visual Check

Refresh the live client:

- `http://127.0.0.1:4180/client/work-lite/`

Current intended state for the next check:

- shirt on
- pants on
- Cherry-hair workaround still active
- non-shoe accessories out
- shoes out
