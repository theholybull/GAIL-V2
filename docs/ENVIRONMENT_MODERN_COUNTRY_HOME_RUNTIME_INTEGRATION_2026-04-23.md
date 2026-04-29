# Modern Country Home Runtime Integration

Date: 2026-04-23

## Source

- input blend: `D:\Gail 2.1\env.blend`
- exporter: `tools/export_environment_from_blend.py`
- Blender: `C:\Program Files\Blender Foundation\Blender 4.2\blender.exe`
- export mode: `--factory-startup`

## Ruling

- use the environment rooted at `Modern Country Home.Node`
- do not export the full scene bundle
- exclude unrelated top-level content by filtering to the intended room root instead of trying to correct it later in runtime

## Filtered Result

- kept root: `Modern Country Home.Node`
- kept objects: `69`
- removed objects: `20`
- removed groups:
  - `CH Modern Cruiser Motorcycle`
  - `XI Classic Cruiser Motorcycle`
  - `MCH Island`
  - `MCH High Chair`
  - `ML_*` bedroom / bathroom furniture block

## Outputs

- candidate GLB:
  - `data/environment/candidates/modern_country_home/modern_country_home_optimized_2k.glb`
- candidate blend:
  - `data/environment/candidates/modern_country_home/modern_country_home_optimized_2k.blend`
- report:
  - `data/environment/candidates/modern_country_home/modern_country_home_optimized_2k.report.json`
- runtime GLB:
  - `playcanvas-app/assets/environments/modern_country_home/modern_country_home_optimized_2k.glb`

## Measured Facts

- runtime GLB size: `51,276,684` bytes
- GLB scene count: `1`
- root node count: `1`
- root node name: `Modern Country Home.Node`
- meshes: `34`
- materials: `91`
- textures: `69`
- images: `39`
- animations: `0`
- imported world bounds:
  - min: `[-8.0991, -6.4709, -0.0779]`
  - max: `[8.0991, 6.4709, 6.1714]`
  - size: `[16.1981, 12.9418, 6.2493]`

## Transform Notes

- the exported GLB root still carries the Daz/Blender scene transform:
  - rotation quaternion: `[0.7071068, 0, 0, 0.7071068]`
  - scale: `[0.01, 0.01, 0.01]`
- this pass does not bake or guess a corrective runtime transform
- manual placement should continue through `Stage Tune` until operator-confirmed values are promoted

## Live Runtime Switch

- added environment profile:
  - `modern_country_home`
- runtime profile source:
  - `playcanvas-app/assets/environments/environment-profiles.json`
- switched laptop scene:
  - `data/client/device-display-profiles.json`
  - `sceneId = modern_country_home`

## Verification

- PlayCanvas build passed
- live `/client-assets/environments/environment-profiles.json` includes `modern_country_home`
- live `/client/device-display-profiles` reports laptop `sceneId = modern_country_home`
- live asset route returns:
  - `GET /client-assets/environments/modern_country_home/modern_country_home_optimized_2k.glb`
  - status `200`
  - bytes `51276684`

## Note On Cache Key

- `work-lite` still serves cache tag `20260423-env-loft1`
- that is expected for this pass because the room swap happened in runtime data / static asset config, not in new `work-lite` TypeScript code

## Restage Correction Pass

- source fact from `D:\Gail 2.1\env.blend`:
  - `Modern Country Home.Node` is the Daz handoff root
  - local transform is `+90 X` with `0.01` scale
- the earlier post-export GLB root-bake experiment was rejected after measurement because it produced incorrect oversized bounds
- the correct fix is now in `tools/export_environment_from_blend.py`:
  - `--normalize-root-transform`
  - this reparents the filtered room children under an identity staging root in Blender before export
- the room was re-exported from source with:
  - `--root-object "Modern Country Home.Node"`
  - `--normalize-root-transform`

## Corrected Export Facts

- runtime GLB size: `51,280,332` bytes
- imported world bounds after corrected export:
  - min: `[-8.0991, -6.4709, -0.0779]`
  - max: `[8.0991, 6.4709, 6.1714]`
  - size: `[16.1981, 12.9418, 6.2493]`
- Blender keeps an identity wrapper root in the saved `.blend`
- the glTF exporter optimizes that identity wrapper out of the final GLB scene roots
- that optimization is acceptable for runtime because `loadContainerEntityWithRetry(...)` still wraps the imported scene under one PlayCanvas container entity

## Runtime Cleanup

- `modern_country_home` now carries `tuningStorageVersion = "root-contract-1"` in `playcanvas-app/assets/environments/environment-profiles.json`
- `work-lite` staging persistence now keys environment / avatar / camera tuning by environment storage scope instead of bare scene id
- result:
  - stale browser-saved offsets from the broken stage-adjustment passes are not reused for this room anymore

## Current Cache Key

- `work-lite` now serves cache tag `20260423-env-restage1`
