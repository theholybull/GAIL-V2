# Gail Hair Runtime Findings

Date: `2026-04-21`

## Trigger

Observed issue from live client review:

- Gail scalp cap appears near the feet or detached
- Gail hair strands appear invisible or never visibly finish loading

## What Was Confirmed

### 1. The refreshed Gail hair GLB is much heavier than the previous live file

- previous live Gail hair:
  - `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`
  - `26,332,168` bytes
- refreshed Gail hair from `gail.blend`:
  - `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`
  - `88,007,804` bytes

This is a real runtime risk for `work-lite`.

### 2. The new hair strands were being cut out by the client material rule

The current Gail hair GLB contains a strand texture:

- `cleanup-hub/gail-hair-image-dump-new/0_blond2.jpg-alssthin.jpg.png`
- size: `128 x 302`

Sampled alpha findings for that image:

- alpha max is only about `110 / 255`
- the client was using `material.alphaTest = 0.5`

That means the strand planes could be fully discarded by the client even when the file itself loaded correctly.

This is the strongest confirmed reason the hair appeared invisible.

### 3. Skeleton naming was not the primary mismatch

Compared against the refreshed Gail body GLB:

- body and hair both expose `193` skin joints
- missing joint names from hair relative to body: `0`
- major shared bones like `hip`, `pelvis`, `neckUpper`, and `head` match exactly

So this was not a simple body-vs-hair bone-name mismatch.

## Client Fix Applied

Updated `playcanvas-app/src/work-lite-rebuild.ts`:

- lowered hair cutout threshold from `0.5` to `0.08`
- added versioned client-asset URLs so refreshed runtime GLBs are less likely to be masked by stale browser asset reuse

Relevant lines now include:

- `toVersionedClientAssetUrl(...)`
- `material.alphaTest = 0.08`

Rebuilt the PlayCanvas app after the patch.

## Verification Status

What is confirmed:

- the alpha-test bug was real
- the client patch is in place
- the PlayCanvas app rebuild succeeded

What is not yet fully closed:

- headless `work-lite` verification is inconsistent because Gail runtime assets are still very large
- one long run reached body+clothes and stalled at `Loading meili hair...`
- a later cache-busted run stalled earlier at `Loading bundle body...`

Relevant artifacts:

- `docs/reports/worklite-persona-normal-20260421-141409.json`
- `docs/reports/worklite-persona-normal-20260421-141409.png`
- `docs/reports/worklite-persona-normal-20260421-144547.json`
- `docs/reports/worklite-persona-normal-20260421-144547.png`

## Best Current Read

There are two separate Gail hair problems:

1. a confirmed visibility bug in the client material handling
2. a runtime-weight problem caused by very large refreshed avatar files

The visibility bug is patched.

The remaining stability/performance problem is still open and is likely why live verification remains inconsistent.

## Next Best Move

1. keep the alpha-threshold fix
2. create a lighter runtime Gail hair/body path for `work-lite`
3. then re-run a fresh live Gail verification after the runtime payload is reduced
