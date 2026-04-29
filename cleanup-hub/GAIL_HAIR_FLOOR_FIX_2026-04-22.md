# Gail Hair Floor Fix 2026-04-22

## Root Cause

Gail hair was not failing because of missing files or wrong persona routing.

The actual export bug was:

- Gail hair skin names and inverse bind matrices matched the Gail body correctly
- runtime bone rebinding in `work-lite` was resolving against the real body skeleton
- but the exported Gail hair mesh vertices were still clustered near origin / floor level instead of head height

Direct comparison against the working Vera and Cherry hair exports showed:

- Gail hair raw vertex Y range was roughly `-0.255` to `0.201`
- Vera and Cherry hair raw vertex Y range was roughly `1.30` to `1.83`

That is why Gail hair could resolve the correct bones and still render on the floor.

## Implemented Fix

Updated [export_gail_split.py](</D:/Gail 2.1/working_copy/tools/export_gail_split.py>) pipeline behavior in `tools/export_gail_split.py`:

- added GLB read/write helpers
- added a Gail hair post-export correction pass
- the correction derives Gail hair's head-space offset from the exported head inverse bind matrix
- it translates all Gail hair `POSITION` accessors into the correct head-space rest position before the file is promoted into runtime assets

The applied Gail hair offset is now:

- `x = 0.0`
- `y = 1.6255019903182983`
- `z = -0.018405750393867493`

## Runtime Support Change

Also updated `playcanvas-app/src/work-lite-rebuild.ts` so `work-lite` now rebonds modular render roots to the resolved skeleton root before garment skin rebinding. That change improved Gail load stability and stage readiness, but it was not the final floor-root cause by itself.

## Promotion Runs

Repo-backed refreshes completed:

- `cleanup-hub/gail-lite-runtime-refresh-20260422-hair-floor-fix`
- `cleanup-hub/gail-runtime-refresh-20260422-hair-floor-fix`

Both runs report:

- `exports.hair.glb_fix.applied = true`

## Verification

Best live proof after the exporter fix:

- `docs/reports/worklite-persona-normal-20260422-100946.json`
- `docs/reports/worklite-persona-normal-20260422-100946.png`

What that proof shows:

- Gail is upright and correctly scaled
- Gail hair is no longer on the floor
- Gail hair now renders from the corrected repo-generated `gail_lite` asset

## Remaining Issues

This fix closes the floor-placement bug, not all Gail hair polish issues.

Still separate:

- Gail remains in rest pose / T-pose style presentation
- Gail hair styling still needs visual polish and may sit imperfectly around the face/chest
- shorter probes can still capture intermediate load states before hair finishes
