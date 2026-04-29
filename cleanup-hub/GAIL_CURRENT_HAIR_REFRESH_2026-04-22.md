# Gail Current Hair Refresh 2026-04-22

## Goal

Verify that the recent `D:\Avatars\Gail\gail.blend` upload actually contributes Gail hair to the live `work-lite` runtime path, then promote the correct Gail hair into the active repo asset root.

## What Changed

- confirmed `playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb` was still an older fallback file from `2026-04-17`
- updated `tools/run-gail-lite-runtime-refresh.ps1` so `gail_lite` no longer silently falls back to the archived pre-refresh Gail hair file
- regenerated `gail_lite` from the current source blend:
  - medium pass: `cleanup-hub/gail-lite-runtime-refresh-20260422-current-hair`
  - low-profile pass: `cleanup-hub/gail-lite-runtime-refresh-20260422-low-profile`
- promoted the low-profile pass into the active runtime asset root at `playcanvas-app/assets/gail_lite/...`

## Current Active Gail Lite Sizes

- avatar: `141,375,508` bytes
- hair: `77,952,824` bytes
- top: `598,628` bytes
- pants: `1,388,772` bytes
- sandals: `7,165,696` bytes
- accessories: `147,928` bytes

## Verification

Manifest proof:

- `http://127.0.0.1:4180/client/asset-manifest?assetRoot=gail_lite`
- `meili_hair` now resolves to `playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb`
- active Gail lite hair size in manifest: `77,952,824` bytes

Runtime proof:

- `docs/reports/worklite-persona-normal-20260422-093603.json`
- `docs/reports/worklite-persona-normal-20260422-093603.png`
- `docs/reports/worklite-persona-normal-20260422-094103.json`
- `docs/reports/worklite-persona-normal-20260422-094103.png`

## What The Proof Means

- Gail's recent upload does include hair
- the live `gail_lite` runtime now uses Gail's freshly exported hair instead of the stale archived fallback
- the low-profile runtime path successfully finishes the Gail hair HTTP request:
  - `client-assets/gail_lite/hair/meili_hair/meili_hair.glb?v=meili_hair-77952824`
- the remaining normal-mode bug is no longer "missing Gail hair"
- the remaining bug is "Gail hair loads but attaches/render-binds incorrectly"

## Current Visual Result

The latest low-profile proof shows:

- Gail upright and correctly scaled
- Gail body and wardrobe visible
- Gail hair asset requested and loaded
- a detached skull-cap/hair chunk rendering by Gail's feet
- client still not reaching a clean finished animated state

## Fix Boundary

The next Gail hair pass should focus on bind/attachment correctness, not source selection:

- compare Gail hair export/bind data against the working Cherry and Vera persona hair assets
- inspect whether Gail hair should stay as a skinned modular GLB or be attached as a different runtime component
- verify the Gail hair mesh/bone relationship after export before touching client-side rendering again
