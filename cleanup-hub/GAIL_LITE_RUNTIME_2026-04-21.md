# Gail Lite Runtime 2026-04-21

## Goal

Reduce the default `work-lite` load on the system without breaking the main repo runtime contract.

## What Changed

- added a lighter Gail asset root at `playcanvas-app/assets/gail_lite/`
- added `tools/run-gail-lite-runtime-refresh.ps1` so the lighter root can be regenerated from `D:\Avatars\Gail\gail.blend`
- upgraded `tools/export_gail_split.py` with export profiles plus in-memory texture downscaling during Blender background export
- updated `playcanvas-app/src/work-lite-rebuild.ts` so `work-lite` now prefers `gail_lite` when the server runtime root is still `gail`
- added URL escape hatches:
  - `?assetRoot=<root>` to force a specific root
  - `?disableLiteAssetRoot=1` to stay on the server root

## Promoted Lite Assets

The verified `gail_lite` pass is in `cleanup-hub/gail-lite-runtime-refresh-20260421-152928/`.

- body: `playcanvas-app/assets/gail_lite/avatar/base_face/gail_base_avatar.glb`
- hair: `playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb`
- top: `playcanvas-app/assets/gail_lite/clothes/gail_top/gail_top.glb`
- pants: `playcanvas-app/assets/gail_lite/clothes/gail_pants/gail_pants.glb`
- sandals: `playcanvas-app/assets/gail_lite/clothes/gail_sandals/gail_sandals.glb`
- accessories: `playcanvas-app/assets/gail_lite/accessories/gail_bundle/gail_accessories.glb`

Hair intentionally uses the archived stable file from `cleanup-hub/gail-runtime-refresh-20260421-135222/before/...` because it is much lighter and currently more reliable than the refreshed 88 MB Gail hair.

## Verified Size Change

- Gail body: `238.44 MB` -> `163.06 MB`
- Gail hair: `83.93 MB` -> `25.11 MB`
- Gail top: `16.43 MB` -> `2.19 MB`
- Gail pants: `12.89 MB` -> `2.30 MB`
- Gail sandals: `21.90 MB` -> `8.49 MB`
- Gail accessories: `7.03 MB` -> `0.83 MB`

## Verification

- `GET /client/asset-manifest?assetRoot=gail_lite` now resolves Gail body, hair, clothes, and accessories from `playcanvas-app/assets/gail_lite/...`
- all promoted `gail_lite` GLBs pass `tools/check-gltf-root-contract.js`
- live `work-lite` shell state now reports `Asset root gail_lite`
- latest live proof:
  - `docs/reports/worklite-persona-normal-20260421-154725.json`
  - `docs/reports/worklite-persona-normal-20260421-154725.png`

## Current Honest Status

- confirmed fixed: `work-lite` now prefers the lighter repo-local Gail root by default
- confirmed fixed: Gail runtime weight is materially lower than the live `gail` path
- still open: normal Gail can still stall at `Loading bundle body...` even on `gail_lite`
- not adopted: a follow-up `1024` texture-cap experiment was started but timed out before clean verification, so it was not promoted

## Best Next Order

1. instrument body container load timing in `work-lite` so we can see whether the remaining stall is network, parsing, or GPU/upload time
2. if Gail body is still too heavy at `163 MB`, generate and verify a second lighter body tier before touching Cherry or Vera again
3. once Gail normal boot is reliable, rerun the full persona staging pass on Gail, Vera, and Cherry
