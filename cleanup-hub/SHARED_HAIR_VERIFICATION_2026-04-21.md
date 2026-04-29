# Shared Hair Verification

Date: `2026-04-21`
Base URL: `http://127.0.0.1:4180`
Raw artifact: `docs/reports/shared-hair-verification-20260421-130124.json`

## Checks Run

- started the repo stack with `tools/start-gail-stack.ps1 -ForceRestart`
- verified backend health at `/health`
- queried `/client/asset-manifest`
- queried `/client/wardrobe-presets`

## Verified Result

The backend is live and the shared-hair runtime mapping is active.

Confirmed hair asset resolution:

- `meili_hair` -> `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`
- `private_hair` -> `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`
- `girlfriend_hair` -> `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`

All three reported:

- `present: true`
- `resolvedPath` equal to Gail's shared hair runtime file

Confirmed wardrobe preset hair slot ids remain persona-specific:

- `gail_workwear` -> `meili_hair`
- `lucy_counselor` -> `private_hair`
- `cherry_girlfriend` -> `girlfriend_hair`

## Meaning

- Gail, Vera, and Cherry now share the same live runtime hair asset
- persona slot ids remain intact, so future per-persona or context-driven remapping can happen without undoing this structure
