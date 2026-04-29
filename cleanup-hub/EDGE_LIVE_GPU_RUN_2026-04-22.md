# Edge Live GPU Run 2026-04-22

## Result

The live `work-lite` client was tested through the real Edge browser path after Edge was pinned to the Windows high-performance GPU setting.

Outcome:

- renderer: `ANGLE (NVIDIA, NVIDIA GeForce RTX 4050 Laptop GPU ...)`
- asset root: `gail_lite`
- final stage status: `Scene ready`
- ready by: about `10 seconds` into the captured timeline

## Evidence

- report: `docs/reports/edge-worklite-live-gpu-2026-04-22T12-42-55-817Z.json`
- screenshot: `docs/reports/edge-worklite-live-gpu-2026-04-22T12-42-55-817Z.png`

## What Loaded

- Gail base avatar from `gail_lite`
- Gail top from `gail_lite`
- Gail pants from `gail_lite`
- Gail sandals from `gail_lite`
- Gail hair from `gail_lite`
- idle/talk/listen/ack clips all loaded

## What This Proves

- the real live browser path is now using the RTX 4050
- `gail_lite` plus hardware GPU is enough for the normal Gail path to reach `Scene ready`
- the earlier “stuck at body load forever” result was not the whole truth once the browser path and GPU assignment were corrected

## What Still Does Not Look Right

- Gail is still in a rest-pose / arms-out presentation instead of a natural idle pose
- the hair/skull-cap issue is still visible; hair geometry is still dropping down from the head area
- a single `404` console resource error still appeared during the run

## Best Read

The GPU path is no longer the blocker. The next blockers are avatar presentation correctness:

1. fix Gail pose/idle presentation
2. fix Gail hair binding/placement
3. then rerun the same Edge RTX test as the acceptance baseline
