# Decision Log

Use this file to record cleanup, consolidation, and governance decisions before changing drive layout.

## Template

### Decision

- Date:
- Requested by:
- Area:
- Source path:
- Target path:
- Action:
- Reason:
- Reference check completed:
- Backup confirmed:
- Operator approval:
- Notes:

## Current Open Decisions

### Decision 2026-04-22-05

- Date: 2026-04-22
- Requested by: operator
- Area: live backend path resolution / stale client serving
- Source path: `D:\Gail 2.1\working_copy\playcanvas-app\` (VS Code workspace)
- Target path: `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\playcanvas-app\` (active backend root)
- Action: copy `index.html` and `dist/playcanvas-app/src/work-lite-rebuild.js` from D:\ workspace to the OneDrive Desktop backend root; back up prior OneDrive files with `.bak-20260422-predeploy` / `.bak-20260420` suffixes
- Reason: diagnosed that the backend (PID 23024) was started via `backend-supervisor.ps1` with `-RepoRoot "C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy"` — all session edits had gone to the D:\ workspace but the backend was reading from a separate OneDrive Desktop copy; the stale `index.html` (`20260420-cherry-dancebind2`) and stale dist JS (April 20) were at the C:\ path, not D:\
- Reference check completed: yes — canary test confirmed 404 at D:\ path, OneDrive path content verified before and after
- Backup confirmed: yes — `index.html.bak-20260422-predeploy` and `work-lite-rebuild.js.bak-20260420` at C:\ OneDrive Desktop path
- Operator approval: yes (ongoing stale-client repair task)
- Notes: two working_copy roots are now diverged; D:\ is the VS Code edit surface; C:\ OneDrive Desktop is the live backend root; future edits must be propagated to both until the backend launch is redirected to D:\; Vera counselor assets at C:\ path were already April 22 (10:47) from a previous session's promotion — the Vera assets are therefore current on the live backend

### Decision 2026-04-22-04

- Date: 2026-04-22
- Requested by: operator
- Area: Vera runtime asset promotion
- Source path: `D:\Avatars\Vera\vera.blend`
- Target path: `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\counselor\`
- Action: create `tools/export_vera_runtime.py` and `tools/run-vera-runtime-refresh.ps1`; run promotion replacing April-14 ingest assets
- Reason: Vera scripts from prior session were in the chat diff but never written to disk; counselor assets were still the old April-14 ingest batch
- Reference check completed: yes — ingest report, Cherry/Gail patterns, module config slots verified
- Backup confirmed: yes — prior assets backed up under `cleanup-hub/vera-runtime-refresh-20260422-112223/before/`
- Operator approval: yes
- Notes: normalization applied (`+90° X / 0.01 scale`); all 6 slots promoted; run artifact at `cleanup-hub/vera-runtime-refresh-20260422-112223/`

### Decision 2026-04-22-01

- Date: 2026-04-22
- Requested by: operator
- Area: local GPU usage verification
- Source path: `D:\Gail 2.1\working_copy\tools\*.js`
- Target path: `D:\Gail 2.1\working_copy\tools\playwright-renderer.js`
- Action: remove forced SwiftShader defaults from local Playwright verification tools and make hardware rendering the default
- Reason: local audits were measuring a software-rendered path and giving misleading signals about GPU usage
- Reference check completed: yes
- Backup confirmed: n/a
- Operator approval: yes
- Notes: SwiftShader remains available via `--renderer=swiftshader` or `GAIL_PLAYWRIGHT_RENDERER=swiftshader`

### Decision 2026-04-22-02

- Date: 2026-04-22
- Requested by: operator
- Area: live browser GPU assignment
- Source path: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- Target path: `HKCU:\Software\Microsoft\DirectX\UserGpuPreferences`
- Action: set Edge to Windows high-performance GPU mode and verify the live browser renderer
- Reason: the live browser path was confirmed to be using Intel WebGL instead of the RTX 4050
- Reference check completed: yes
- Backup confirmed: n/a
- Operator approval: yes
- Notes: post-change verification showed `ANGLE (NVIDIA, NVIDIA GeForce RTX 4050 Laptop GPU ...)`

### Decision 2026-04-22-03

- Date: 2026-04-22
- Requested by: operator
- Area: persona hair routing
- Source path: `D:\Gail 2.1\working_copy\playcanvas-app\config\work-lite-modules.gail.json`
- Target path: runtime manifest contract
- Action: remove shared Gail hair from Vera and Cherry and restore persona-specific hair assets
- Reason: each avatar should use its own hair asset instead of the temporary shared-hair fallback
- Reference check completed: yes
- Backup confirmed: n/a
- Operator approval: yes
- Notes: isolated live Edge runs confirmed Vera loads `vera_hair.glb` and Cherry loads `cherry_hair.glb`

### Decision 2026-04-21-06

- Date: 2026-04-21
- Requested by: operator
- Area: work-lite runtime weight reduction
- Source path: `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\...`
- Target path: `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail_lite\...`
- Action: create a lighter Gail-only asset root for `work-lite` instead of replacing the main Gail runtime files
- Reason: reduce client/system load without destabilizing Vera, Cherry, or the main Gail asset contract
- Reference check completed: yes
- Backup confirmed: yes, promotion artifacts captured under `cleanup-hub/gail-lite-runtime-refresh-20260421-152928/`
- Operator approval: yes
- Notes: `work-lite` now prefers `gail_lite` by default; the lighter root is verified, but normal Gail can still stall on body load and needs another pass

### Decision 2026-04-20-01

- Date: 2026-04-20
- Requested by: operator
- Area: drive cleanup governance
- Source path: `D:\`
- Target path: `D:\Gail 2.1\working_copy\cleanup-hub`
- Action: create cleanup control center and freeze one source of truth
- Reason: drive sprawl, duplicate roots, unclear project authority, need for hard rules
- Reference check completed: yes, high-level only
- Backup confirmed: not yet fully inventoried
- Operator approval: yes
- Notes: no destructive cleanup performed yet; governance and classification created first

### Decision 2026-04-20-02

- Date: 2026-04-20
- Requested by: operator
- Area: runtime audit and documentation governance
- Source path: `D:\Gail 2.1\working_copy`
- Target path: `D:\Gail 2.1\working_copy\cleanup-hub`
- Action: create a repo-local runtime/UI audit baseline and hard documentation protocol before cleanup and rebuild continue
- Reason: project needs one trustworthy picture of what currently runs, what fails, and what every future agent must document
- Reference check completed: yes
- Backup confirmed: n/a
- Operator approval: yes
- Notes: produced `runtime-audit-20260420-141419/`, `RUNTIME_UI_AUDIT_2026-04-20.md`, and `DOCUMENTATION_PROTOCOL.md`; no destructive cleanup performed

### Decision 2026-04-20-03

- Date: 2026-04-20
- Requested by: operator
- Area: repo-standalone dependency bring-up
- Source path: `D:\Gail 2.1\anim_avatar_importer` and `D:\Gail 2.1\converted_animations_20260401`
- Target path: `D:\Gail 2.1\working_copy\tools\anim-avatar-importer` and `D:\Gail 2.1\working_copy\data\animation-library\converted_animations_20260401`
- Action: promote importer and converted animation library into the active repo, then restart and verify the live stack against repo-local paths
- Reason: reduce hidden cross-root dependency drift and establish `working_copy` as the real execution base
- Reference check completed: yes
- Backup confirmed: source roots left intact; no destructive source removal performed
- Operator approval: yes
- Notes: importer tests passed, repo-local library copy matched source file count/size, workbench route now exposes `1892` library items, and importer catalog rebuild succeeded against repo-local paths

### Decision 2026-04-20-04

- Date: 2026-04-20
- Requested by: operator
- Area: persona asset staging from external blend sources
- Source path: `D:\avatars`
- Target path: `D:\Gail 2.1\working_copy\cleanup-hub\persona-ingest-20260420-1630`
- Action: run the persona blend files through a repo-local Blender export pipeline and stage split avatar, hair, and clothing GLBs inside the active repo
- Reason: establish a repeatable repo-dependent export baseline before avatar ingestion and staging promotion are wired into the client/runtime
- Reference check completed: yes
- Backup confirmed: yes, source blends left in place and only staged exports were produced
- Operator approval: yes
- Notes: Gail main blend currently has no distinct hair export; Gail hair is present in `gail_daily_jacket.blend`; `gail_work_1` exported as a clothing-only staged asset with a static-export warning

### Decision 2026-04-21-01

- Date: 2026-04-21
- Requested by: operator
- Area: avatar appearance baseline
- Source path: `D:\avatars\Gail\gail.blend`
- Target path: `D:\Gail 2.1\working_copy\cleanup-hub` and project state docs
- Action: set Gail's current hair look as the canonical shared default for Gail, Cherry, and Vera until more hair variants are uploaded
- Reason: current alternate avatars use the same look for now and the intended product direction is selectable styles with future context-based switching
- Reference check completed: yes
- Backup confirmed: n/a
- Operator approval: yes
- Notes: current automation still does not emit a separate `gail_hair.glb` from `gail.blend`; runtime promotion will need an explicit shared-hair mapping or a temporary technical source until the split/export rules are improved

### Decision 2026-04-21-02

- Date: 2026-04-21
- Requested by: operator
- Area: runtime avatar hair mapping
- Source path: `D:\Gail 2.1\working_copy\playcanvas-app\config\work-lite-modules.gail.json`
- Target path: `D:\Gail 2.1\working_copy\playcanvas-app\config\work-lite-modules.gail.json`
- Action: map the Vera and Cherry persona hair slots to Gail's active shared hair runtime asset while preserving persona-specific slot ids
- Reason: implement the chosen shared-default hair behavior immediately without duplicating large binaries or breaking persona filtering
- Reference check completed: yes
- Backup confirmed: n/a
- Operator approval: yes
- Notes: `private_hair` and `girlfriend_hair` now both resolve to `gail/hair/meili_hair/meili_hair.glb`; future selectable/weather-driven style switching should happen at the slot-to-asset mapping layer

### Decision 2026-04-21-03

- Date: 2026-04-21
- Requested by: operator
- Area: work-lite staging behavior
- Source path: `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
- Target path: `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
- Action: add a staging-only startup override so `/client/work-lite/?allowPersistedPersona=1` can honor persisted backend persona state without changing the default normal-mode startup behavior
- Reason: staging and audit work needs a direct persona boot path, but normal client boot should remain safe and predictable
- Reference check completed: yes
- Backup confirmed: n/a
- Operator approval: implicit through active staging/runtime verification work
- Notes: direct-boot staging now reaches Cherry and Vera correctly, but Cherry still stalls at dress load and Vera still stalls at jeans load; audit browsers must be cleaned up before persona persistence checks because orphaned headless shells can reset backend persona state

### Decision 2026-04-21-04

- Date: 2026-04-21
- Requested by: operator
- Area: Gail runtime refresh and device texture policy
- Source path: `D:\Avatars\Gail\gail.blend`
- Target path: `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\...` and `D:\Gail 2.1\working_copy\cleanup-hub`
- Action: rebuild Gail's live runtime split from the current source blend, promote the refreshed runtime files into the repo, and standardize package texture tiers to `512 / 2048 / 4096`
- Reason: Gail is the canonical runtime baseline, the current source file is very large, and the project needs one explicit device-tier texture contract instead of mixed legacy defaults
- Reference check completed: yes
- Backup confirmed: yes, prior live Gail files were copied into `cleanup-hub/gail-runtime-refresh-20260421-135222/before`
- Operator approval: yes
- Notes: runtime refresh and package tier export both completed successfully; the remaining blocker is `work-lite` still stalling at base-body load even though the refreshed files and backend manifest are correct

### Decision 2026-04-21-05

- Date: 2026-04-21
- Requested by: operator
- Area: Gail hair runtime stabilization
- Source path: `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
- Target path: `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
- Action: lower the hair alpha-test threshold and use versioned client-asset URLs for modular runtime loads
- Reason: Gail hair strands were being fully cut out by the current client material rule, and live refresh work needs a safer path against stale same-path modular assets
- Reference check completed: yes
- Backup confirmed: n/a
- Operator approval: implicit through active Gail runtime debugging
- Notes: the visibility bug is confirmed and patched; runtime-weight/loading instability is still open and needs a lighter `work-lite` asset path

### Decision 2026-04-21-04

- Date: 2026-04-21
- Requested by: operator
- Area: Gail avatar orientation and scale
- Source path: `D:\avatars\Gail\gail.blend`
- Target path: `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\...`
- Action: normalize Blender export space and regenerate Gail body/wardrobe GLBs from source so the runtime uses identity-root assets instead of the legacy rotated/scaled exports
- Reason: Gail was rendering laid on her back and too small because the source armature exported with `+90° X` rotation and `0.01` scale at the GLB scene root
- Reference check completed: yes
- Backup confirmed: yes, source blend left intact and regenerated assets are reproducible from source
- Operator approval: implicit through active fix request
- Notes: live verification shows Gail upright and correctly scaled after regeneration; wardrobe completion is still a separate outstanding runtime issue

### Decision 2026-04-21-05

- Date: 2026-04-21
- Requested by: operator
- Area: Cherry runtime refresh
- Source path: `D:\Avatars\Cherry\Cherry.blend`
- Target path: `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\girlfriend\...`
- Action: export Cherry from source into the active runtime contract and promote the refreshed body, dress, shoes, and optional hair files into the live repo asset paths
- Reason: Cherry was still using older runtime assets and needed to be refreshed from the latest source blend before Vera and Gail follow
- Reference check completed: yes
- Backup confirmed: yes, previous live Cherry assets were copied into `cleanup-hub/cherry-runtime-refresh-20260421-live2/before`
- Operator approval: yes
- Notes: the exported Cherry assets are valid and promoted, but the live `work-lite` loader is still unstable; the best working proof still shows stretched shared Gail hair and rest pose, while Cherry's own hair mapping currently causes a worse wardrobe-load stall

### Decision 2026-04-22-01

- Date: 2026-04-22
- Requested by: operator
- Area: Gail lite runtime hair source
- Source path: `D:\Avatars\Gail\gail.blend`
- Target path: `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail_lite\...`
- Action: regenerate `gail_lite` from the current Gail source blend and stop using the archived fallback hair file for Gail lite refreshes
- Reason: the recent Gail upload should have included Gail hair in the live runtime path, and the active lite asset root was still serving an older archived hair export instead of the current source output
- Reference check completed: yes
- Backup confirmed: yes, prior `gail_lite` files were backed up in each refresh run under:
  - `cleanup-hub/gail-lite-runtime-refresh-20260422-current-hair/before`
  - `cleanup-hub/gail-lite-runtime-refresh-20260422-low-profile/before`
- Operator approval: yes
- Notes: source selection is now corrected and verified through `/client/asset-manifest`; the latest low-profile proof shows Gail hair loading from the refreshed lite export but still attaching/rendering incorrectly, with the skull-cap/hair chunk appearing by Gail's feet

### Decision 2026-04-22-02

- Date: 2026-04-22
- Requested by: operator
- Area: Gail hair floor-placement failure
- Source path: `D:\Avatars\Gail\gail.blend`
- Target path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail_lite\...`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\...`
- Action: inspect the Gail hair export/runtime path end to end, correct the root cause in the exporter, and regenerate the active Gail runtime asset roots from the corrected pipeline
- Reason: Gail hair was still rendering on the floor even after source selection and manifest routing were corrected, so the remaining bug needed a non-guessing root-cause fix
- Reference check completed: yes
- Backup confirmed: yes, prior Gail runtime files were backed up in:
  - `cleanup-hub/gail-lite-runtime-refresh-20260422-hair-floor-fix/before`
  - `cleanup-hub/gail-runtime-refresh-20260422-hair-floor-fix/before`
- Operator approval: yes
- Notes: the fix proved Gail hair floor placement was caused by exported Gail hair mesh positions near origin rather than missing files or wrong runtime persona routing; the corrected live proof is `docs/reports/worklite-persona-normal-20260422-100946.png`

### Decision 2026-04-22-03

- Date: 2026-04-22
- Requested by: operator
- Area: Gail work-lite baseline lock and temporary hair workaround
- Source path:
  - `D:\Gail 2.1\working_copy\docs\WORKING_COPY_CHAT_RECORD_2026-04-22.md`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\hair\meili_hair\meili_hair.glb`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\girlfriend\hair\cherry_hair.glb`
- Target path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\hair\meili_hair\meili_hair.glb`
  - `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\playcanvas-app\assets\gail\hair\meili_hair\meili_hair.glb`
- Action: leave the restored transcript-backed runtime baseline unchanged, remove the active Gail hair asset from the live normal persona path, and temporarily substitute Cherry hair at the existing Gail hair asset path so no code or wardrobe contract changes are required
- Reason: the user wanted the restored baseline locked in place and asked for a temporary working Gail hair swap rather than further runtime experimentation on the broken current Gail hair
- Reference check completed: yes
- Backup confirmed: yes, exact pre-swap Gail hair preserved in `cleanup-hub/gail-hair-backup-20260422/meili_hair.original.glb` and Cherry source hair preserved in `cleanup-hub/gail-hair-backup-20260422/cherry_hair.source.glb`
- Operator approval: yes
- Notes: `/client/runtime-settings` remains on `assetRoot: "gail"` and `/client/asset-manifest?assetRoot=gail` now reports `meili_hair` at `36483732` bytes, matching the Cherry hair asset. The original Gail hair fix stays on the follow-up list.
  - follow-up factual correction: the locked normal route still resolves Gail through `gail_lite`, so the visible workaround also had to be applied at `playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb`
  - verified live `gail_lite` manifest after the second swap: `selectedAssetRoot = "gail_lite"` and `meili_hair.fileSizeBytes = 36483732`
  - preserved the exact pre-swap Gail lite hair in `cleanup-hub/gail-lite-hair-backup-20260422/meili_hair.original.gail_lite.glb`

### Decision 2026-04-22-04

- Date: 2026-04-22
- Requested by: operator
- Area: Gail sweater isolation test
- Source path:
  - `D:\Gail 2.1\working_copy\data\client\wardrobe-presets.json`
  - `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\data\client\wardrobe-presets.json`
- Target path:
  - `gail_workwear.slots.upper`
- Action: temporarily remove Gail's sweater/top layer from the active `gail_workwear` wardrobe preset by setting `upper` to `null`
- Reason: the visible lines may be coming from the sweater rather than the hair, so the cleanest next isolate is to remove only the top layer while leaving the restored runtime baseline untouched
- Reference check completed: yes
- Backup confirmed: yes, both preset files were backed up in `cleanup-hub/gail-sweater-isolation-20260422/`
- Operator approval: yes
- Notes: no restart was required because the wardrobe preset service reads from disk on each request; live `GET /client/wardrobe-presets` now returns `upper: null` for `gail_workwear`
  - factual correction: this did not affect `work-lite`, because `work-lite` selects Gail clothing/hair/accessory modules from the asset manifest rather than the wardrobe preset file
  - the preset files were restored after that finding so no unrelated preset drift remains from this isolate

### Decision 2026-04-22-05

- Date: 2026-04-22
- Requested by: operator
- Area: Gail top asset isolation for `work-lite`
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail_lite\clothes\gail_top\gail_top.glb`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\clothes\gail_top\gail_top.glb`
  - live C copies under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\...`
- Target path:
  - same paths, renamed to `.glb.disabled`
- Action: temporarily remove the actual Gail top asset files from both the `gail_lite` and fallback `gail` paths so the normal Gail route cannot load the sweater
- Reason: the earlier preset-based isolate did nothing because `work-lite` was ignoring `wardrobe-presets.json` for module selection; a real isolate required removing the top asset from the manifest-resolved load path
- Reference check completed: yes
- Backup confirmed: yes, original top assets preserved in `cleanup-hub/gail-top-asset-isolation-20260422/`
- Operator approval: yes
- Notes: live `GET /client/asset-manifest?assetRoot=gail_lite` now reports `gail_outfit_top.present = false`, so the sweater is truly out of the active load path for the next visual check

### Decision 2026-04-22-06

- Date: 2026-04-22
- Requested by: operator
- Area: Gail pants asset isolation for `work-lite`
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail_lite\clothes\gail_pants\gail_pants.glb`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\clothes\gail_pants\gail_pants.glb`
  - live C copies under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\...`
- Target path:
  - same paths, renamed to `.glb.disabled`
- Action: restore the Gail top asset after the sweater isolate did not remove the visible lines, then remove the actual Gail pants asset files from both the `gail_lite` and fallback `gail` paths so the normal Gail route cannot load the pants
- Reason: the user confirmed the sweater was not the source of the visible lines and asked for the next clean isolate to be the pants while keeping the working shirt and temporary hair in place
- Reference check completed: yes
- Backup confirmed: yes, original pants assets preserved in `cleanup-hub/gail-pants-asset-isolation-20260422/`
- Operator approval: yes
- Notes: live `GET /client/asset-manifest?assetRoot=gail_lite` now reports `gail_outfit_top.present = true` and `gail_outfit_pants.present = false`, so the pants are truly out of the active load path for the next visual check

### Decision 2026-04-22-07

- Date: 2026-04-22
- Requested by: operator
- Area: Gail non-shoe accessory isolation for `work-lite`
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail_lite\accessories\...`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\accessories\...`
  - live C copies under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\...`
- Target path:
  - same paths, renamed to `.glb.disabled`
- Action: restore the Gail pants after the pants isolate, then remove the non-shoe accessory files from both the `gail_lite` and fallback `gail` paths while leaving the sandals/shoes untouched for the later shoe isolate
- Reason: the user confirmed pants were not the source of the visible lines and asked for the next isolate to be the remaining accessories, with shoes left for last
- Reference check completed: yes
- Backup confirmed: yes, disabled accessory files preserved in `cleanup-hub/gail-accessory-asset-isolation-20260422/`
- Operator approval: yes
- Notes: live `GET /client/asset-manifest?assetRoot=gail_lite` now reports `gail_outfit_pants.present = true` and `gail_accessories_bundle.present = false`; accessory bundles are optional in the manifest, but the actual files are now out of the active load path for the visual check

### Decision 2026-04-22-08

- Date: 2026-04-22
- Requested by: operator
- Area: Gail shoe isolate for `work-lite`
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail_lite\clothes\gail_sandals\gail_sandals.glb`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\clothes\gail_sandals\gail_sandals.glb`
  - live C copies under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\...`
- Target path:
  - same paths, renamed to `.glb.disabled`
- Action: keep the accessory files out of the active load path and remove the Gail sandals/shoes from both the `gail_lite` and fallback `gail` paths for the final clothing/accessory isolate
- Reason: the user confirmed the visible lines were still present after accessory removal and asked to do shoes last while keeping accessories out
- Reference check completed: yes
- Backup confirmed: yes, original sandal files preserved in `cleanup-hub/gail-shoe-asset-isolation-20260422/`
- Operator approval: yes
- Notes: live `GET /client/asset-manifest?assetRoot=gail_lite` now reports `gail_outfit_pants.present = true`, `gail_accessories_bundle.present = false`, and `gail_outfit_sandals.present = false`, so the current visual check is shirt on, pants on, accessories out, shoes out

### Decision 2026-04-22-09

- Date: 2026-04-22
- Requested by: operator
- Area: Gail body-only line isolate in `work-lite`
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - live C copy under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\playcanvas-app\...`
- Target path:
  - same file paths, one runtime-only mesh disable added
- Action: disable only the Gail body submesh `VAMPLaurinaBrows.Shape` at runtime in `work-lite` while keeping the restored shirt, pants, and shoes in place and leaving accessories out
- Reason: the visible lines survived every clothing/accessory isolate; Gail body auditing proved no body vertices are weighted to `.001` duplicate bones; Gail alone carries `VAMPLaurinaBrows.Shape`, a body-embedded hair-material mesh driven by the same brow bones targeted by all active animation clips
- Reference check completed: yes
- Backup confirmed: yes, change limited to the transcript-backed working-copy source plus rebuilt JS; no Gail asset files were modified in this step
- Operator approval: yes
- Notes: if the lines remain after this isolate, the next body-only suspect is `Genesis 8 Female Eyelashes (2).Shape`

### Decision 2026-04-23-01

- Date: 2026-04-23
- Requested by: operator
- Area: Gail source refresh from new `gail.blend`
- Source path:
  - `D:\Avatars\Gail\gail.blend`
  - `D:\Gail 2.1\working_copy\tools\export_gail_split.py`
- Target path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\...`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail_lite\...`
  - live C copies under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\...`
- Action: remove the temporary Gail brow isolate, patch the Gail exporter to match the new blend mesh names, regenerate both `gail` and `gail_lite` from the new source, rebuild the client, and sync the live C working copy
- Reason: the previous brow isolate removed Gail eyebrows but did not solve the underlying issue; operator chose to replace Gail with the newer avatar source instead of continuing to isolate the old one
- Reference check completed: yes
- Backup confirmed: yes, both Gail refresh runners wrote backup copies inside their run roots before promotion
- Operator approval: yes
- Notes: live `gail_lite` now resolves the new April-23 Gail package with body `43918416`, hair `13952556`, top `8422736`, pants `7330360`, and footwear `2011560`

### Decision 2026-04-23-02

- Date: 2026-04-23
- Requested by: operator
- Area: Gail new-source hair placement fix
- Source path:
  - `D:\Avatars\Gail\gail.blend`
  - `D:\Gail 2.1\working_copy\tools\export_gail_split.py`
- Target path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\hair\meili_hair\meili_hair.glb`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail_lite\hair\meili_hair\meili_hair.glb`
  - live C copies under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\...`
- Action: patch the Gail hair correction so it does not apply the old floor-origin translation to new hair that is already in head/body space; rerun both Gail exports; sync corrected assets and cache-salted client bundle to live C
- Reason: the new Voss hair file was present but had been lifted to Y `3.07-3.45`, above Gail's head; corrected export reports now show hair Y bounds `1.4419605731964111-1.8281116485595703`
- Reference check completed: yes
- Backup confirmed: yes, refresh runners backed up previous promoted files inside `cleanup-hub/gail-runtime-refresh-20260423-hair-yfix/before` and `cleanup-hub/gail-lite-runtime-refresh-20260423-hair-yfix/before`
- Operator approval: yes
- Notes: client asset URL salt is now `20260423-gail-hair-yfix1` because the corrected hair GLB retained the same byte size as the bad lifted GLB

### Decision 2026-04-23-03

- Date: 2026-04-23
- Requested by: operator
- Area: hair material softening across `work-lite`
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
- Target path:
  - same files in D working copy
  - live C copies under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\...`
- Action: adjust only the runtime hair material profile by raising alpha cutout and lowering gloss/specular/shininess, then rebuild and sync the client bundle
- Reason: operator confirmed Gail has hair, but hair reads too solid/plastic across the board
- Reference check completed: yes
- Backup confirmed: not applicable; material-only source change with no GLB edits
- Operator approval: yes
- Notes: new tuning point is `alphaTest = 0.22`, `glossCap = 0.012`, `shininessCap = 6`, `specularityCap = 0.012`, cache key `20260423-hair-softcut1`

### Decision 2026-04-23-04

- Date: 2026-04-23
- Requested by: operator
- Area: second hair material softening pass across `work-lite`
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
- Target path:
  - same files in D working copy
  - live C copies under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\...`
- Action: apply one additional material-only step, raising hair `alphaTest` to `0.32` and lowering gloss/specular/shininess further, then rebuild and sync the client bundle
- Reason: operator confirmed first softcut pass still looked too solid
- Reference check completed: yes
- Backup confirmed: not applicable; material-only source change with no GLB edits
- Operator approval: yes
- Notes: current tuning point is `alphaTest = 0.32`, `glossCap = 0.006`, `shininessCap = 3`, `specularityCap = 0.006`, cache key `20260423-hair-softcut2`

### Decision 2026-04-23-05

- Date: 2026-04-23
- Requested by: operator
- Area: revert hair softcut and try back-face culling
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
- Target path:
  - same files in D working copy
  - live C copies under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\...`
- Action: revert the two alpha/spec softcut material passes, restore `alphaTest = 0.08` and prior hair shine caps, then set hair culling to `pc.CULLFACE_BACK`
- Reason: operator reported the top hair disappeared under `softcut2` while side hair still looked too solid; back-face culling targets the doubled-card side mass without raising alpha threshold
- Reference check completed: yes
- Backup confirmed: not applicable; material-only source change with no GLB edits
- Operator approval: yes
- Notes: current tuning point is `alphaTest = 0.08`, `glossCap = 0.04`, `shininessCap = 14`, `cull = pc.CULLFACE_BACK`, cache key `20260423-hair-cull1`

### Decision 2026-04-23-06

- Date: 2026-04-23
- Requested by: operator
- Area: avatar runtime single source of truth
- Source path:
  - `playcanvas-app/config/work-lite-modules.gail.json`
  - `data/client/runtime-settings.json`
  - `data/client/wardrobe-presets.json`
  - hardcoded persona map in `playcanvas-app/src/work-lite-rebuild.ts`
- Target path:
  - `data/client/avatar-runtime.json`
- Action: consolidate runtime settings, available avatar systems, asset catalog, wardrobe presets, and persona body mapping behind one central config read/written by existing shell endpoints
- Reason: operator correctly identified that multiple edit points for avatar info invite regressions and backsliding
- Reference check completed: yes
- Backup confirmed: yes, legacy files are retained as history/compatibility, but marked non-authoritative
- Operator approval: yes
- Notes: Avatar Library/Wardrobe/Runtime Mapping remain the operator-facing shell surfaces; backend services now source their data from `avatar-runtime.json`

### Decision 2026-04-23-07

- Date: 2026-04-23
- Requested by: operator
- Area: known-good fallback checkpoint
- Source path:
  - `D:\Gail 2.1\working_copy`
- Target path:
  - `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`
- Action: create a non-destructive filesystem fallback copy of the current working state after operator visual confirmation, excluding `.git`, `node_modules`, and Python bytecode caches
- Reason: operator confirmed everything looks good and asked to lock this down as a solid fallback point
- Reference check completed: yes
- Backup confirmed: yes, external checkpoint copy completed with `0` robocopy failures
- Operator approval: yes
- Notes: this is a filesystem checkpoint, not a clean Git release commit; verification passed backend build, PlayCanvas build, control panel build, animation validation, and backend tests `121/121`

### Decision 2026-04-23-08

- Date: 2026-04-23
- Requested by: operator
- Area: generated artifact cleanup
- Source path:
  - `D:\Gail 2.1\working_copy`
  - `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`
- Target path:
  - generated reports, cleanup/import artifacts, Python caches, scratch GLBs, and temporary probe files inside the active working copies
- Action: remove old generated artifacts from active working copies after preserving them in the solid fallback checkpoint
- Reason: operator asked to clear old stuff and test results so the drives stop filling and agents stop confusing stale evidence for current state
- Reference check completed: yes
- Backup confirmed: yes, `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848` was preserved before cleanup
- Operator approval: yes
- Notes: freed approximately `33.36 GB`; active source/assets and `data/client/avatar-runtime.json` were preserved; builds passed and backend tests passed `121/121` after cleanup

### Decision 2026-04-23-09

- Date: 2026-04-23
- Requested by: operator
- Area: top-level drive cleanup
- Source path:
  - `D:\`
- Target path:
  - deleted regenerable caches/temp/download artifacts
  - moved old reference roots to `D:\Gail 2.1\legacy-hold\20260423-top-level-review`
- Action: inspect top-level old folders, delete non-useful/regenerable clutter, and move reference/old asset material out of the root
- Reason: operator asked to dig through the remaining old stuff and either keep useful material, get it out of the way, or remove it
- Reference check completed: yes
- Backup confirmed: yes, current fallback checkpoint preserved before cleanup
- Operator approval: yes
- Notes: deleted approximately `66.25 GB`, moved approximately `3.50 GB` into legacy hold, preserved current `D:\Avatars`, active repo, fallback checkpoint, importer, converted animations, and installed DAZ libraries

### Decision 2026-04-23-10

- Date: 2026-04-23
- Requested by: operator
- Area: work-lite animation timing
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
- Target path:
  - same files in D working copy
  - live C mirror under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`
- Action: tune runtime animation playback and transitions for slower, smoother, more natural loops
- Reason: operator asked to smooth animation loops/transitions, slow them down, and make movement feel more natural
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`
- Operator approval: yes
- Notes: runtime-only change; no GLB/export edits; cache key is `20260423-anim-natural1`; PlayCanvas build and animation validator passed

### Decision 2026-04-23-11

- Date: 2026-04-23
- Requested by: operator
- Area: work-lite facial micro movement
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
- Target path:
  - same files in D working copy
  - live C mirror under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`
- Action: add randomized runtime facial micro movements across mouth/lip/chin/jaw/smile/squint groups
- Reason: operator requested subtle natural face movement, group movement instead of single-muscle twitches, and slight asymmetry without scripted loops
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`
- Operator approval: yes
- Notes: runtime-only change; no GLB/export/config edits; cache key is `20260423-face-micro1`; PlayCanvas build and animation validator passed

### Decision 2026-04-23-12

- Date: 2026-04-23
- Requested by: operator
- Area: work-lite body alive motion
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
- Target path:
  - same files in D working copy
  - live C mirror under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`
- Action: add randomized procedural body breathing, chest/shoulder/spine motion, weight shift, and long-response speech breath pauses
- Reason: operator requested real movement/physics feel so animations read as fluid and alive, including chest rise/fall and breathing during long responses
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`
- Operator approval: yes
- Notes: runtime-only procedural overlay; no GLB/export/config edits; cache key is `20260423-body-alive1`; PlayCanvas build and animation validator passed

### Decision 2026-04-23-13

- Date: 2026-04-23
- Requested by: operator
- Area: body-alive known-good fallback checkpoint
- Source path:
  - `D:\Gail 2.1\working_copy`
- Target path:
  - `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`
- Action: create a non-destructive filesystem fallback copy of the current body-alive working state, excluding `.git`, `node_modules`, and Python bytecode caches
- Reason: operator confirmed the current smoother animation/facial/body motion state is good and asked to lock it down
- Reference check completed: yes
- Backup confirmed: yes, external checkpoint copy completed with `0` robocopy failures
- Operator approval: yes
- Notes: this is a filesystem checkpoint, not a clean Git release commit; verification passed backend build, PlayCanvas build, control panel build, animation validation, and live `20260423-body-alive1` serving check

### Decision 2026-04-23-14

- Date: 2026-04-23
- Requested by: operator
- Area: voice wake/listening and local LLM model selection
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
  - `D:\Gail 2.1\working_copy\data\providers\local-llm-config.json`
  - `D:\Gail 2.1\working_copy\backend\services\local-llm-config-service.ts`
- Target path:
  - same files in D working copy
  - live C mirror under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`
- Action: add fuzzy wake matching, local intent/context voice buffer phrases, and configure `dolphin-mistral:7b` as the persisted/default local model
- Reason: operator reported unreliable wake word behavior, requested context-appropriate buffer responses, and clarified that the 7B Dolphin model is required for Cherry/private chat behavior
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`
- Operator approval: yes
- Notes: immediate buffer phrases remain deterministic/local because both local LLMs were too slow for the latency-critical buffer path; live provider endpoint reports `dolphin-mistral:7b`; cache key is `20260423-voice-wake1`

### Decision 2026-04-23-15

- Date: 2026-04-23
- Requested by: operator
- Area: always-listening ambient noise filtering
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
- Target path:
  - same files in D working copy
  - live C mirror under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`
- Action: add a conservative always-listening ambient guard before conversation submission
- Reason: operator asked whether always-listening can be locked to a voice or filter background music/TV noise
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`
- Operator approval: yes
- Notes: browser `SpeechRecognition` cannot truly identify the speaker; this pass filters likely ambient transcripts by length, confidence where available, repetition, directedness, and command/personal-speech shape; cache key is `20260423-voice-ambient1`

### Decision 2026-04-23-16

- Date: 2026-04-23
- Requested by: operator
- Area: voice self-hearing prevention
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
- Target path:
  - same files in D working copy
  - live C mirror under `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`
- Action: extend the global `gailSpeechActive` self-hearing guard across quick phrases, queued browser speech, OpenAI/audio playback, and follow-up restart timing
- Reason: operator asked whether the system has a solid method to prevent Gail from responding to herself
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`
- Operator approval: yes
- Notes: browser speech was already guarded; this closes the richer audio/queued-speech gap; post-speech cooldown remains `1200ms`; cache key is `20260423-voice-selfguard1`

### Decision 2026-04-23-17

- Date: 2026-04-23
- Requested by: operator
- Area: voice config consolidation and shell wiring
- Source path:
  - `D:\Gail 2.1\working_copy\data\voice\voice-settings.json`
  - `D:\Gail 2.1\working_copy\backend\services\voice-service.ts`
  - `D:\Gail 2.1\working_copy\backend\api\validators.ts`
  - `D:\Gail 2.1\working_copy\shared\contracts\voice.ts`
  - `D:\Gail 2.1\working_copy\shared\contracts\service-inputs.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\web-control-panel\src\operator-studio-shell.js`
- Target path:
  - same files in D working copy
  - live backend and clients served from restarted D stack
- Action: consolidate runtime voice behavior into `/voice/settings.runtime` and expose the tuning controls in the operator shell
- Reason: operator asked to stop scattering voice behavior across multiple sources and make the shell the place to adjust it
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`
- Operator approval: yes
- Notes: runtime patch verified live by changing and restoring `ambientRepeatWindowMs`; work-lite cache key is `20260423-voice-config1`; shell now defaults local model display to `dolphin-mistral:7b`

### Decision 2026-04-23-18

- Date: 2026-04-23
- Requested by: operator
- Area: operator shell voice controls UX
- Source path:
  - `D:\Gail 2.1\working_copy\web-control-panel\src\operator-studio-shell.js`
  - `D:\Gail 2.1\working_copy\web-control-panel\src\styles\operator-studio-shell.css`
- Target path:
  - same files in D working copy
  - live panel served from the D stack
- Action: group the `Providers & Voice` settings into sectioned cards while preserving the same save/load ids and backend contract
- Reason: operator approved a cleanup pass so the new voice controls are easier to manage from the shell
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`
- Operator approval: yes
- Notes: live panel source verified for `renderProvidersVoiceSettings`, `settings-form--sectioned`, and `settings-section-grid`; no voice runtime contract changes were introduced in this pass

### Decision 2026-04-23-19

- Date: 2026-04-23
- Requested by: operator
- Area: animation plan implementation baseline
- Source path:
  - `D:\Gail 2.1\working_copy\docs\MASTER_ANIMATION_PLAN_IDLE_FOUNDATION.md`
  - `D:\Gail 2.1\working_copy\docs\MASTER_ANIMATION_PLAN_PROP_AND_TRANSITION_MATH.md`
  - `D:\Gail 2.1\working_copy\docs\Build plan 4_4\GAIL_ANIMATION_ACTION_COMPOSER_PLAN.md`
  - `D:\Gail 2.1\working_copy\docs\Build plan 4_4\GAIL_AI_AUTONOMY_AND_VOICE_PLAN.md`
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
- Target path:
  - `D:\Gail 2.1\working_copy\docs\ANIMATION_TRIGGER_IMPLEMENTATION_BASELINE_2026-04-23.md`
- Action: create one animation/trigger baseline document that defines current live states, current trigger classes, missing plan slices, and the recommended implementation order
- Reason: operator clarified the focus should be the overall animation plan with triggers, not path cleanup
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`
- Operator approval: yes
- Notes: baseline identifies `typing` / text-only routing as the next smallest useful implementation slice before seated props or action-composer work

### Decision 2026-04-23-20

- Date: 2026-04-23
- Requested by: operator
- Area: full environment integration planning
- Source path:
  - `D:\Gail 2.1\working_copy\docs\FULL_3D_ENVIRONMENT_INTERACTION_AND_CONTROL_PLAN_2026-04-23.md`
  - `D:\Gail 2.1\working_copy\docs\Build plan 4_4\GAIL_STAGING_CALIBRATION_AND_3D_PREP.md`
  - `D:\Gail 2.1\working_copy\docs\DEVICE_MATRIX.md`
  - `D:\Gail 2.1\working_copy\data\client\device-display-profiles.json`
  - official PlayCanvas docs for supported formats, Asset Store, Sketchfab integration, and texture compression
- Target path:
  - `D:\Gail 2.1\working_copy\docs\ENVIRONMENT_INTEGRATION_LOCK_PLAN_2026-04-23.md`
- Action: lock the environment source strategy, texture-size targets, DAZ environment compatibility ruling, and optimized GLB runtime path
- Reason: operator asked for a full integration plan, documentation, and clear guidance on where to start looking for an environment and what texture sizes to target
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`
- Operator approval: yes
- Notes: locked recommendation is to scout a PlayCanvas/Sketchfab studio or apartment-lounge base first; DAZ environment scenes remain valid source content if exported to Blender, optimized, and re-exported as GLB

### Decision 2026-04-23-21

- Date: 2026-04-23
- Requested by: operator
- Area: brutalist loft runtime integration
- Source path:
  - `D:\Gail 2.1\brutalist_loft.glb`
  - `D:\Gail 2.1\working_copy\data\environment\candidates\brutalist_loft\brutalist_loft_optimized_2k.glb`
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
- Target path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\environments\brutalist_loft\brutalist_loft_optimized_2k.glb`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\environments\environment-profiles.json`
  - `D:\Gail 2.1\working_copy\docs\ENVIRONMENT_BRUTALIST_LOFT_RUNTIME_INTEGRATION_2026-04-23.md`
- Action: integrate the optimized loft as the active laptop scene using measured bounds only, with explicit skybox exclusions and no added corrective scene rotation or scale
- Reason: operator requested a careful no-guessing environment integration with explicit checks for rotation, axis handling, and scale
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1500-env-lock1`
- Operator approval: yes
- Notes: Blender and GLB inspection showed the root scene already carries the axis conversion, so the safe ruling was to keep runtime transform at `rotation 0,0,0` and `scale 1,1,1` while excluding `Object_40` / `Skybox_17` from floor/center alignment math

### Decision 2026-04-23-22

- Date: 2026-04-23
- Requested by: operator
- Area: manual environment calibration
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\styles\work-lite-rebuild.css`
- Target path:
  - `D:\Gail 2.1\working_copy\docs\ENVIRONMENT_BRUTALIST_LOFT_RUNTIME_INTEGRATION_2026-04-23.md`
- Action: add a live browser-side environment tuning panel so room offset, rotation, and scale can be adjusted manually, persisted locally per scene, and copied back out as exact values
- Reason: the first runtime trial proved the room loaded but visual orientation was still wrong, and operator requested a manual route to save time and prevent more guesswork
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1500-env-lock1`
- Operator approval: yes
- Notes: this is intentionally a calibration tool, not a hidden automatic correction; confirmed values should be promoted into repo config only after operator verification

### Decision 2026-04-23-23

- Date: 2026-04-23
- Requested by: operator
- Area: replacement environment conversion from blend source
- Source path:
  - `D:\Gail 2.1\env.blend`
  - `D:\Gail 2.1\working_copy\tools\export_environment_from_blend.py`
- Target path:
  - `D:\Gail 2.1\working_copy\data\environment\candidates\modern_country_home\modern_country_home_optimized_2k.glb`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\environments\modern_country_home\modern_country_home_optimized_2k.glb`
  - `D:\Gail 2.1\working_copy\docs\ENVIRONMENT_MODERN_COUNTRY_HOME_RUNTIME_INTEGRATION_2026-04-23.md`
- Action: convert the replacement blend by filtering to `Modern Country Home.Node`, promote the cleaned GLB into runtime assets, and switch laptop scene routing to `modern_country_home`
- Reason: operator asked to try `env.blend` instead of the current room and explicitly noted it would need conversion
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1500-env-lock1`
- Operator approval: yes
- Notes: the conversion was intentionally filtered instead of exporting the whole blend; this removed motorcycles and unrelated room blocks from the runtime asset while preserving the original root transform for manual stage tuning

### Decision 2026-04-23-24

- Date: 2026-04-23
- Requested by: operator
- Area: modern country home avatar staging correction
- Source path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\environments\environment-profiles.json`
- Target path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
- Action: fix avatar staging to use device-profile base transforms and anchor the house placement to `MCH Floor`, while making avatar tune controls operate relative to that base
- Reason: operator reported Gail appeared under the house and avatar adjustments were not working
- Reference check completed: yes
- Backup confirmed: yes, solid fallback checkpoint exists at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1500-env-lock1`
- Operator approval: yes
- Notes: this pass avoids baking a guessed room offset into source assets; it corrects the runtime staging contract first so manual tuning is dependable

### Decision 2026-04-24-01

- Date: 2026-04-24
- Requested by: operator
- Area: modern_country_home final lighting + backdrop realism tuning
- Source path:
  - `D:\Gail 2.1\Backdrop\rocky-mountains-moraine-lake-park-7q1ld8rxud81wzd6.jpg`
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\environments\environment-profiles.json`
- Target path:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\environments\backdrops\mountain_lake_realistic_primary.jpg`
  - `D:\Gail 2.1\working_copy\playcanvas-app\src\work-lite-rebuild.ts`
  - `D:\Gail 2.1\working_copy\playcanvas-app\index.html`
- Action: integrate selected realistic backdrop into repo assets, add a dedicated ceiling-down interior flood light, retune night warmth, and keep the same backdrop active at night with warm grading
- Reason: operator requested interior ceiling flooding (not intense), warm cozy night tuning, and realistic mountain/lake background continuity between day and night
- Reference check completed: yes
- Backup confirmed: yes, existing room and prior backdrop pipeline preserved; new backdrop added as a new asset path
- Operator approval: yes
- Notes: build passed and live route `http://127.0.0.1:4180/client/work-lite/` reached `Scene ready` after deploying `env-backdrop5`
