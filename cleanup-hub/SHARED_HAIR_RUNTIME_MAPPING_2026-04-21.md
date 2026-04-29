# Shared Hair Runtime Mapping

Date: `2026-04-21`
Area: runtime asset manifest
Primary file: `playcanvas-app/config/work-lite-modules.gail.json`

## Decision Implemented

Gail's current hair look is now the active shared default for:

- Gail
- Vera (`private_counselor`)
- Cherry (`private_girlfriend`)

This implements the operator decision recorded in `cleanup-hub/DECISION_LOG.md`.

## Runtime Mapping

The persona-specific hair asset ids remain in place so persona filtering and wardrobe slot resolution still work:

- `meili_hair`
- `private_hair`
- `girlfriend_hair`

But both persona-specific hair modules now resolve to the same Gail hair asset path:

- `gail/hair/meili_hair/meili_hair.glb`

Implemented manifest changes:

- `private_hair.expectedPath` -> `gail/hair/meili_hair/meili_hair.glb`
- `private_hair.searchDirectories` -> `gail/hair`
- `girlfriend_hair.expectedPath` -> `gail/hair/meili_hair/meili_hair.glb`
- `girlfriend_hair.searchDirectories` -> `gail/hair`

## Why This Shape

- keeps existing persona-specific asset ids intact
- avoids duplicating large hair binaries
- allows the current runtime persona filtering to keep working without code changes
- leaves room for future per-persona or weather/time-of-day hair switching by changing slot-to-asset mappings later

## Current Limitation

The current Blender split/export pass still did not emit a distinct `gail_hair.glb` from `gail.blend`.

So this runtime mapping uses the already-active Gail hair runtime asset:

- `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`

That is the current technical source of truth for the shared hair look until the export/ingest pipeline is upgraded.

## Next Follow-Up

- add a selectable style layer for hair variants
- extend wardrobe/context logic so hair and clothing can switch by operator choice, time-of-day, and weather
