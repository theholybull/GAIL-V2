# Work-Lite Persona Staging Audit

Date: 2026-04-21
Workspace: `D:\Gail 2.1\working_copy`
Scope: direct-boot and persona-runtime verification for the active `work-lite` client

## What Changed

- added an opt-in startup flag to `work-lite` so staging can intentionally honor backend persona state:
  - `/client/work-lite/?allowPersistedPersona=1`
- kept the default safety behavior unchanged:
  - plain `/client/work-lite/` still normalizes back to `normal`
- upgraded `tools/probe-worklite-persona.js` so it can:
  - skip UI persona switching
  - boot a URL suffix such as `?allowPersistedPersona=1`
  - record failed network requests and non-2xx responses

## Important Test Hygiene

- orphaned `chrome-headless-shell` audit processes can keep touching the running stack and interfere with persona persistence tests
- confirmed behavior:
  - after patching backend persona to `private_girlfriend`, the backend reverted to `normal` within `12s` while orphaned headless shells were still alive
  - after stopping those orphaned headless shells, the backend persona persisted correctly over the same `12s` check

## Verified Working

- shared-hair manifest mapping is still correct at the backend/config level
- backend persona patch/readback works when the runtime is clean:
  - patch returned `private_girlfriend`
  - immediate readback returned `private_girlfriend`
- direct persona boot now works for staging when using:
  - `/client/work-lite/?allowPersistedPersona=1`
- verified direct-boot persona artifacts:
  - Cherry: `docs/reports/worklite-persona-private_girlfriend-20260421-110335.json`
  - Cherry screenshot: `docs/reports/worklite-persona-private_girlfriend-20260421-110335.png`
  - Vera: `docs/reports/worklite-persona-private_counselor-20260421-110522.json`
  - Vera screenshot: `docs/reports/worklite-persona-private_counselor-20260421-110522.png`
- direct asset serving is not the blocker:
  - `gail/hair/meili_hair/meili_hair.glb` served cleanly over HTTP
  - `gail/counselor/clothing/vera_jeans.glb` served cleanly over HTTP
  - `gail/girlfriend/clothing/girlfriend_dress.glb` served cleanly over HTTP

## Confirmed Broken Or Incomplete

### Cherry Direct Boot

- startup persona honored correctly:
  - selector: `private_girlfriend`
  - label: `Cherry`
- runtime stalls at:
  - `Loading Cherry dress...`
- visual result at `90s`:
  - Cherry base avatar is visible
  - dress is missing
  - hair is missing
- observed requests:
  - `cherry_base_avatar.glb`
  - no completed `girlfriend_dress.glb` request recorded in the probe output
  - no completed shared-hair request recorded in the probe output

### Vera Direct Boot

- startup persona honored correctly:
  - selector: `private_counselor`
  - label: `Vera`
- runtime stalls at:
  - `Loading Vera jeans...`
- visual result at `90s`:
  - Vera base avatar is visible
  - blazer is visible
  - jeans are missing
  - hair is missing
- observed requests:
  - `vera_base_avatar.glb`
  - `vera_blazer.glb`
  - `vera_heels.glb`
  - `vera_jeans.glb`
  - no completed shared-hair request recorded in the probe output

### Normal Mode Headless Baseline

- normal mode can reach `Scene ready`
- current headless screenshot still looks wrong even when clips report loaded:
  - avatar appears tiny / horizontal in the stage
- reference artifacts:
  - `docs/reports/worklite-persona-normal-20260421-102729.png`
  - `docs/reports/worklite-persona-private_girlfriend-20260421-104224.png`
  - `docs/reports/worklite-persona-private_counselor-20260421-104432.png`

## Best Current Read

- the persona-startup lock was a real staging blocker and is now solved with an opt-in route flag
- the remaining Cherry/Vera failures are not primarily backend file-serving problems
- the stronger failure point is inside the `work-lite` stage load pipeline after the base avatar is up:
  - module container load completion
  - module instantiate/bind
  - or a rendering/runtime issue that prevents the loader from advancing
- shared-hair mapping is still correct as configuration, but runtime proof is incomplete for direct-boot staging because the client never reaches the hair module in the failing persona paths

## Best Order From Here

1. keep using `?allowPersistedPersona=1` for staging-only persona boot verification
2. kill orphaned audit browsers before persona tests so backend persona state is not silently reset
3. instrument `loadContainerEntity` / `loadContainerEntityWithRetry` in `playcanvas-app/src/work-lite-rebuild.ts` with per-asset start, ready, error, and timeout logging
4. isolate why Cherry stalls before dress completion and why Vera stalls at jeans before hair
5. separately fix the normal-mode headless pose/camera problem so `Scene ready` also looks visually correct in automated screenshots

## Operator Summary

Working now:

- backend persona persistence under clean conditions
- opt-in direct persona boot for staging
- backend/shared-hair manifest correctness
- direct HTTP serving for the tested GLBs

Not working yet:

- Cherry full outfit completion
- Vera full outfit completion
- direct shared-hair runtime proof for staged persona boot
- stable normal-mode headless rendering baseline
