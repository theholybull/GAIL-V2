# Persona Hair Reset 2026-04-22

## Decision

Stop using shared Gail hair for Vera and Cherry. Each persona should use its own hair asset again.

## Config Change

Updated `playcanvas-app/config/work-lite-modules.gail.json`:

- `private_hair` now points to `gail/counselor/hair/vera_hair.glb`
- `girlfriend_hair` now points to `gail/girlfriend/hair/cherry_hair.glb`

Gail normal still uses:

- `meili_hair` -> `gail/hair/meili_hair/meili_hair.glb`

## Verified Files

- `playcanvas-app/assets/gail/counselor/hair/vera_hair.glb`
- `playcanvas-app/assets/gail/girlfriend/hair/cherry_hair.glb`
- `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`

## Verification

Backend manifest proof:

- `docs/reports/persona-hair-manifest-20260422.json`

Live isolated Edge runs:

- `docs/reports/persona-hair-live-isolated-20260422.json`

Confirmed:

- Vera requests `vera_hair.glb` and reaches `Scene ready`
- Cherry requests `cherry_hair.glb` and reaches `Scene ready`

## Current Boundary

- persona hair routing is now correct again
- this does not by itself fix Gail normal hair/skull-cap presentation
- Gail normal hair remains a separate problem from Vera/Cherry persona routing
