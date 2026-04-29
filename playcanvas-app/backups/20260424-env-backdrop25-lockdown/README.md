# Work-Lite Checkpoint Backup

Date: 2026-04-24
Checkpoint: env-backdrop25-lockdown
Purpose: Preserve the approved temporary staging setup before next changes.

## Backed Up Files

- index.html
- src/work-lite-rebuild.ts
- src/styles/work-lite-rebuild.css

## Locked-In Behavior

- Brightness slider kept and defaulted to 27.
- Night mode forced to 10% light level.
- Controls can be hidden/shown with the header toggle.
- Controls start hidden by default.
- Camera controls:
  - Move = linear translation.
  - Aim = pivots from current camera position.

## Restore Steps

1. Copy files from this folder back into the project root with the same relative paths.
2. Run `npm run build`.
3. Reload client and verify the cache version matches env-backdrop25.
