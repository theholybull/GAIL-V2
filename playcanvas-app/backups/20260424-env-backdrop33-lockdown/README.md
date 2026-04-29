# Work-Lite Checkpoint Backup

Date: 2026-04-24
Checkpoint: env-backdrop33-lockdown
Purpose: Preserve the approved lighting and persona-placement fixes before further changes.

## Backed Up Files

- index.html
- src/work-lite-rebuild.ts
- src/styles/work-lite-rebuild.css

## Locked-In Behavior

- Light slider responds in both day and night modes.
- Night lighting uses a dark baseline with full slider response instead of a fixed 10% lock.
- Controls can be hidden/shown with the header toggle.
- Controls start hidden by default.
- Camera controls:
  - Move = linear translation.
  - Aim = pivots from current camera position.
- Persona placement now persists avatar rotation in addition to avatar position and camera framing.
- Cache/version salt is `20260424-env-backdrop33`.

## Restore Steps

1. Copy files from this folder back into the project root with the same relative paths.
2. Run `npm run build` from `playcanvas-app`.
3. Restart the local stack and reload `/client/work-lite/`.
4. Verify the client loads `env-backdrop33` assets.
