# Gail Accessory Asset Isolation - 2026-04-22

## What Changed

After the Gail pants isolate, the operator confirmed the visible lines were still present and asked for the next isolate to be the remaining accessories, with shoes left for last.

So:

- the Gail pants assets were restored
- the non-shoe accessory files were removed from the live load path

## Active Asset State

Restored:

- `playcanvas-app/assets/gail_lite/clothes/gail_pants/gail_pants.glb`
- `playcanvas-app/assets/gail/clothes/gail_pants/gail_pants.glb`

Removed from the live load path:

- `playcanvas-app/assets/gail_lite/accessories/gail_bundle/gail_accessories.glb`
- `playcanvas-app/assets/gail_lite/accessories/gail_bundle/gail_bracelets.glb`
- `playcanvas-app/assets/gail/accessories/gail_bundle/gail_accessories.glb`
- `playcanvas-app/assets/gail/accessories/gail_bundle/gail_bracelets.glb`
- live C-only:
  - `playcanvas-app/assets/gail/accessories/gail_bracelets/gail_bracelets.glb`

Each removed file was renamed to `.glb.disabled`.

Shoes were intentionally left alone for the later shoe isolate.

## Verification

Live manifest check:

- `GET /client/asset-manifest?assetRoot=gail_lite`

Confirmed:

- `selectedAssetRoot = "gail_lite"`
- `gail_outfit_pants.present = true`
- `gail_accessories_bundle.present = false`
- `gail_accessories_bundle` appears in `missingAssets`

## Important Note

The Gail accessory bundle is optional in the manifest, not a required/core asset.

That means:

- this is still a valid isolate of the accessory files themselves
- if the visible lines remain, the next isolate should be shoes as requested

## Backups

Disabled accessory copies preserved in:

- `cleanup-hub/gail-accessory-asset-isolation-20260422/`

## Visual Check

Refresh the live client:

- `http://127.0.0.1:4180/client/work-lite/`

Current intended state for the next check:

- shirt restored
- pants restored
- Cherry-hair workaround still active
- non-shoe accessory files removed
- shoes unchanged
