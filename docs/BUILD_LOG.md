# Build Log

## 2026-04-28

### Completed

- locked the user-confirmed standalone mobile audio system for `/gail-mobile/`
- kept outbound TTS on `/voice/speak` with `openai-gpt-4o-mini-tts`, now using voice `nova`, and soft Australian feminine instructions
- changed mobile MP3 playback to create a fresh normal `Audio` element for each response so iPhone hardware volume continues working after the first reply
- stopped/removed incoming mobile mic tracks during cloud MP3 playback and reacquired audio-only mic access after cooldown so iPhone hardware volume is not competing with an active capture session
- removed and documented the failed silent/tiny-WAV audio arming path; it broke iPhone hardware volume controls
- kept browser/system `speechSynthesis` out of the mobile client to avoid wrong voice and sync drift
- added `POST /voice/transcribe` backed by OpenAI `gpt-4o-mini-transcribe`
- added mobile incoming voice through iPhone-first `MediaRecorder` + VAD + `/voice/transcribe`, while non-iOS browsers may still use browser `SpeechRecognition`
- fixed iPhone transcription failures by recording an audio-only stream and uploading `audio/mp4` as `.m4a`
- updated `GAIL_MOBILE_DEBUG_HANDOFF.md` with locked known-good rules and failed variants
- added a dedicated mobile audio replication runbook and shell-settings backlog at `docs/MOBILE_AUDIO_REPLICATION_RUNBOOK_2026-04-28.md`

### Verification

- backend TypeScript check passed with `npx tsc -p backend/tsconfig.json --noEmit`
- mobile module syntax check passed with `node --check --input-type=module`
- public `/gail-mobile/` serves the audio-only recorder code and fresh MP3 playback path
- public `/voice/transcribe` accepts `audio/mp4;codecs=mp4a.40.2`
- OneDrive working copy synced from `D:\Gail 2.1\working_copy`

## 2026-04-24

### Completed

- fixed `playcanvas-app/src/work-lite-rebuild.ts` so night mode lighting now responds to the Light Level slider
- replaced fixed night light locking with a dark-baseline scaling curve driven by slider input
- extended `PersonaPlacement` to include `avatarRotation`
- updated persona placement persistence to save avatar rotation from runtime and restore it during apply/boot/persona switch
- bumped cache/version salt to `20260424-env-backdrop33` in `playcanvas-app/src/work-lite-rebuild.ts`
- updated versioned imports in `playcanvas-app/index.html` to `20260424-env-backdrop33`
- created lockdown backup folder `playcanvas-app/backups/20260424-env-backdrop33-lockdown/` including:
  - `index.html`
  - `src/work-lite-rebuild.ts`
  - `src/styles/work-lite-rebuild.css`
  - `README.md`
- rebuilt `playcanvas-app` after the fixes and cache bump; build completed with exit code `0`

### Notes

- older persona placement records that predate rotation persistence will load with default avatar rotation until the next placement save
- this checkpoint supersedes `env-backdrop32` for runtime verification

## 2026-04-22

### Completed

- locked the restored `work-lite` baseline after reverting the live C: runtime back to the D: transcript-backed implementation
- kept the restored runtime/code baseline unchanged and applied the Gail hair workaround as an asset-only swap
- replaced `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb` with the current Cherry hair asset in both:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\hair\meili_hair\meili_hair.glb`
  - `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\playcanvas-app\assets\gail\hair\meili_hair\meili_hair.glb`
- verified the temporary Gail hair swap by hash:
  - active `meili_hair.glb` hash now matches `cherry_hair.glb`
  - active `meili_hair.glb` size now reads `36483732` bytes in `/client/asset-manifest?assetRoot=gail`
- preserved the exact pre-swap Gail hair asset in `cleanup-hub/gail-hair-backup-20260422/meili_hair.original.glb`
- preserved the Cherry source hair copy used for the swap in `cleanup-hub/gail-hair-backup-20260422/cherry_hair.source.glb`
- documented the baseline lock and temporary Gail hair workaround in `cleanup-hub/GAIL_BASELINE_LOCK_AND_TEMP_HAIR_SWAP_2026-04-22.md`
- confirmed the first no-change result was because the locked normal route still resolves Gail through `gail_lite`
- applied the same asset-only Cherry-hair swap to `playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb` in both D: and live C:
- verified `/client/asset-manifest?assetRoot=gail_lite` now reports `meili_hair.fileSizeBytes = 36483732`
- preserved the exact pre-swap Gail lite hair in `cleanup-hub/gail-lite-hair-backup-20260422/meili_hair.original.gail_lite.glb`
- created a sweater-isolation backup in `cleanup-hub/gail-sweater-isolation-20260422/`
- updated `gail_workwear` in both D: and live C: `data/client/wardrobe-presets.json` so Gail's `upper` slot is now `null`
- verified the live backend returns `upper: null` from `GET /client/wardrobe-presets` for `gail_workwear`
- documented the sweater isolation step in `cleanup-hub/GAIL_SWEATER_ISOLATION_2026-04-22.md`
- confirmed `work-lite` does not use `wardrobe-presets.json` to decide Gail display modules; it loads renderable clothes/hair/accessories directly from the asset manifest
- restored the wardrobe preset file after confirming that preset edits could not remove the Gail sweater from `work-lite`
- backed up the actual Gail top assets in `cleanup-hub/gail-top-asset-isolation-20260422/`
- removed both active Gail top asset paths from the live load path by renaming:
  - `playcanvas-app/assets/gail_lite/clothes/gail_top/gail_top.glb`
  - `playcanvas-app/assets/gail/clothes/gail_top/gail_top.glb`
  to `.glb.disabled`
- verified `GET /client/asset-manifest?assetRoot=gail_lite` now reports:
  - `gail_outfit_top.present = false`
  - `gail_outfit_top` listed in `missingAssets`
- documented the actual top-asset isolate in `cleanup-hub/GAIL_TOP_ASSET_ISOLATION_2026-04-22.md`
- restored the Gail top asset in both `gail_lite` and fallback `gail` paths after the sweater isolate proved the visible lines remained
- removed the Gail pants asset from both active load paths by renaming:
  - `playcanvas-app/assets/gail_lite/clothes/gail_pants/gail_pants.glb`
  - `playcanvas-app/assets/gail/clothes/gail_pants/gail_pants.glb`
  to `.glb.disabled`
- verified `GET /client/asset-manifest?assetRoot=gail_lite` now reports:
  - `gail_outfit_top.present = true`
  - `gail_outfit_pants.present = false`
  - `gail_outfit_pants` listed in `missingAssets`
- preserved the original Gail pants assets in `cleanup-hub/gail-pants-asset-isolation-20260422/`
- documented the pants isolate in `cleanup-hub/GAIL_PANTS_ASSET_ISOLATION_2026-04-22.md`
- restored the Gail pants asset in both `gail_lite` and fallback `gail` paths after the pants isolate
- removed the non-shoe Gail accessory files from both active load paths by renaming these assets to `.glb.disabled` in D and live C:
  - `playcanvas-app/assets/gail_lite/accessories/gail_bundle/gail_accessories.glb`
  - `playcanvas-app/assets/gail_lite/accessories/gail_bundle/gail_bracelets.glb`
  - `playcanvas-app/assets/gail/accessories/gail_bundle/gail_accessories.glb`
  - `playcanvas-app/assets/gail/accessories/gail_bundle/gail_bracelets.glb`
  - plus the live C-only `playcanvas-app/assets/gail/accessories/gail_bracelets/gail_bracelets.glb`
- verified `GET /client/asset-manifest?assetRoot=gail_lite` now reports:
  - `gail_outfit_pants.present = true`
  - `gail_accessories_bundle.present = false`
  - `gail_accessories_bundle` listed in `missingAssets`
- preserved the disabled accessory files in `cleanup-hub/gail-accessory-asset-isolation-20260422/`
- documented the accessory isolate in `cleanup-hub/GAIL_ACCESSORY_ASSET_ISOLATION_2026-04-22.md`
- kept the non-shoe accessory files out of the active load path as requested
- removed the Gail sandal/shoe files from both active load paths by renaming these assets to `.glb.disabled` in D and live C:
  - `playcanvas-app/assets/gail_lite/clothes/gail_sandals/gail_sandals.glb`
  - `playcanvas-app/assets/gail/clothes/gail_sandals/gail_sandals.glb`
- verified `GET /client/asset-manifest?assetRoot=gail_lite` now reports:
  - `gail_outfit_pants.present = true`
  - `gail_accessories_bundle.present = false`
  - `gail_outfit_sandals.present = false`
  - `gail_outfit_sandals` listed in `missingAssets`
- preserved the original Gail sandal files in `cleanup-hub/gail-shoe-asset-isolation-20260422/`
- documented the shoe isolate in `cleanup-hub/GAIL_SHOE_ASSET_ISOLATION_2026-04-22.md`

- created `tools/export_vera_runtime.py` — Vera-specific Blender export script following the same pattern as `export_cherry_runtime.py`; normalizes armature transforms, classifies Vera's meshes into avatar/hair/blazer/blouse/skirt/shoes, exports 6 GLBs
- created `tools/run-vera-runtime-refresh.ps1` — repeatable Vera promotion runner; backs up existing counselor assets, runs Blender export, promotes into `playcanvas-app/assets/gail/counselor/`
- ran `tools/run-vera-runtime-refresh.ps1` against `D:\Avatars\Vera\vera.blend`
- promoted 6 Vera GLBs into `playcanvas-app/assets/gail/counselor/`:
  - `avatar/base_face/vera_base_avatar.glb`
  - `hair/vera_hair.glb`
  - `clothing/vera_blazer.glb`
  - `clothing/vera_camisole.glb` (blouse + 9 buttons)
  - `clothing/vera_jeans.glb` (skirt — slot compatibility)
  - `clothing/vera_heels.glb`
- normalization applied: Genesis 8 Female armature `+90° X / 0.01 scale` corrected before export
- all 6 files confirmed in `cleanup-hub/vera-runtime-refresh-20260422-112223/promotion-manifest.json`
- added `tools/playwright-renderer.js` as the shared renderer-mode helper for local Playwright verification tools
- updated `tools/probe-worklite-persona.js`, `tools/run-runtime-ui-snapshot-audit.js`, `tools/capture_lucy_worklite_screenshot.js`, and `tools/verify-shared-hair-personas.js` so they now default to hardware rendering instead of forcing SwiftShader
- added explicit fallback support for `--renderer=swiftshader` and `GAIL_PLAYWRIGHT_RENDERER=swiftshader`
- updated those tools to record `rendererMode` in their console output and JSON reports
- verified the helper resolves to `hardware` by default and still resolves to `swiftshader` when explicitly requested
- documented the policy in `cleanup-hub/GPU_RENDERING_POLICY_2026-04-22.md`
- verified the live Edge browser path was initially using Intel WebGL instead of the RTX 4050
- set the Windows per-app graphics preference for `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` to `GpuPreference=2;`
- reran the live Edge WebGL probe and confirmed the browser now resolves to `Google Inc. (NVIDIA)` / `NVIDIA GeForce RTX 4050 Laptop GPU`
- captured the before/after result in `cleanup-hub/LIVE_BROWSER_GPU_VERIFICATION_2026-04-22.md` and `docs/reports/edge-webgl-gpu-verification-20260422.json`
- started the full local Gail stack and ran a real Edge hardware session against `/client/work-lite/`
- captured a successful live RTX-backed client run in:
  - `docs/reports/edge-worklite-live-gpu-2026-04-22T12-42-55-817Z.json`
  - `docs/reports/edge-worklite-live-gpu-2026-04-22T12-42-55-817Z.png`
- verified the live client reached `Scene ready` on `gail_lite` in roughly `10 seconds`
- documented the run and remaining pose/hair issues in `cleanup-hub/EDGE_LIVE_GPU_RUN_2026-04-22.md`
- updated `playcanvas-app/config/work-lite-modules.gail.json` so Vera and Cherry no longer use shared Gail hair
- verified backend manifest routing in `docs/reports/persona-hair-manifest-20260422.json`
- verified isolated live Edge persona runs:
  - Vera requests `gail/counselor/hair/vera_hair.glb` and reaches `Scene ready`
  - Cherry requests `gail/girlfriend/hair/cherry_hair.glb` and reaches `Scene ready`
- documented the persona hair reset in `cleanup-hub/PERSONA_HAIR_RESET_2026-04-22.md`

### Notes

- a full post-change `probe-worklite-persona.js` run was attempted but hit the existing headless-browser hang and timed out before emitting a new report
- orphaned `chrome-headless-shell` processes from that attempt were cleaned up after timeout
- any already-open Edge windows should be restarted before judging live client GPU behavior from the operator side
- the live Edge RTX run still shows Gail in a rest pose with the hair/skull-cap issue visible, so rendering readiness is ahead of presentation correctness
- Gail normal hair remains its own issue; Vera/Cherry hair routing is now corrected and verified independently

## 2026-04-21

### Completed

- recreated the missing Gail runtime exporter in `tools/export_gail_split.py` against the new `D:\Avatars\Gail\gail.blend` mesh map
- added `tools/run-gail-runtime-refresh.ps1` so Gail runtime refresh is now repeatable and logs promotion artifacts under `cleanup-hub/`
- refreshed Gail's live runtime assets from `D:\Avatars\Gail\gail.blend` into:
  - `playcanvas-app/assets/gail/avatar/base_face/gail_base_avatar.glb`
  - `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`
  - `playcanvas-app/assets/gail/clothes/gail_top/gail_top.glb`
  - `playcanvas-app/assets/gail/clothes/gail_pants/gail_pants.glb`
  - `playcanvas-app/assets/gail/clothes/gail_sandals/gail_sandals.glb`
  - `playcanvas-app/assets/gail/accessories/gail_bundle/gail_accessories.glb`
  - `playcanvas-app/assets/gail/accessories/gail_bundle/gail_bracelets.glb`
- captured the runtime refresh artifacts in `cleanup-hub/gail-runtime-refresh-20260421-135222/`
- verified all promoted Gail GLBs pass the root-transform guard and saved proof in `docs/reports/gail-root-contract-20260421-140829.json`
- saved the live backend asset manifest after refresh in `docs/reports/gail-asset-manifest-20260421-140829.json`
- updated the tiered package pipeline defaults to `low=512`, `medium=2048`, and `high=4096` in:
  - `tools/export_avatar_pack_with_ior.py`
  - `tools/run_gail_workbench_package.py`
  - `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/blender/addons/gail_production_workbench/__init__.py`
- updated the workbench/export documentation so device-class tier expectations are explicit in the repo
- ran a fresh Gail package export into `cleanup-hub/gail-package-refresh-20260421-135422/`
- verified the package manifest and texture manifest both report `512 / 2048 / 4096`
- spot-checked real emitted texture sizes and confirmed representative low/medium/high outputs are actually `512x512`, `2048x2048`, and `4096x4096`
- added `cleanup-hub/GAIL_RUNTIME_REFRESH_2026-04-21.md` and `cleanup-hub/GAIL_TEXTURE_TIER_POLICY_2026-04-21.md` as the current Gail source-of-truth docs for runtime refresh and tier policy
- investigated the Gail hair runtime failure and confirmed the new strand texture was being fully cut out by the `work-lite` hair material rule
- updated `playcanvas-app/src/work-lite-rebuild.ts` so modular runtime assets now use versioned client URLs and Gail hair uses `material.alphaTest = 0.08` instead of `0.5`
- rebuilt the PlayCanvas app after the Gail hair client patch
- added `cleanup-hub/GAIL_HAIR_RUNTIME_FINDINGS_2026-04-21.md` with the confirmed alpha-cutout bug, runtime-weight findings, and remaining verification gap
- added `tools/run-gail-lite-runtime-refresh.ps1` so a lighter Gail work-lite runtime root can be regenerated repeatably from Blender
- upgraded `tools/export_gail_split.py` with export profiles and in-memory texture downscaling for lighter runtime variants
- created and promoted a new `playcanvas-app/assets/gail_lite/...` asset root from a verified medium-profile export plus the archived stable Gail hair
- updated `playcanvas-app/src/work-lite-rebuild.ts` so `work-lite` now prefers `gail_lite` by default while still allowing `?assetRoot=` and `?disableLiteAssetRoot=1` overrides
- verified `GET /client/asset-manifest?assetRoot=gail_lite` resolves the lighter Gail files from the repo-local `gail_lite` root
- captured the first live `gail_lite` proof in:
  - `docs/reports/worklite-persona-normal-20260421-154725.json`
  - `docs/reports/worklite-persona-normal-20260421-154725.png`
- documented the lighter runtime contract and remaining blocker in `cleanup-hub/GAIL_LITE_RUNTIME_2026-04-21.md`

### Notes

- the refreshed Gail source export is in much better shape than the older runtime bundle, but the live `work-lite` client still stalls at `Loading bundle body...` in the current normal-mode probe
- the backend asset manifest correctly resolves the refreshed Gail files, so the remaining problem is in the client/runtime loader path rather than the source split or file promotion step
- Gail hair now has a confirmed client-side visibility fix in place, but the refreshed runtime assets are still large enough that headless/live verification is inconsistent
- `gail_lite` materially reduces Gail runtime weight, but the normal body path is still heavy enough to stall in live `work-lite` boot
- the Blender console still prints noisy third-party add-on unregister warnings on exit; those did not block Gail export or package generation in this pass

## 2026-04-20

### Completed

- created `cleanup-hub/` as the repo-local control center for drive cleanup, project mapping, and agent governance
- added `cleanup-hub/README.md` to establish the active repo as the cleanup source of truth and define the operator-versus-Gail authority split
- added `cleanup-hub/PROJECT_MAP.md` to classify the active build root, sidecars, reference repos, old workstreams, and decision-pending asset roots on `D:\`
- added `cleanup-hub/DRIVE_CLEANUP_PLAN.md` with a safe multi-phase cleanup sequence that freezes one source of truth before any destructive moves
- added `cleanup-hub/AGENT_GOVERNANCE.md` with hard rules for chain of command, write scopes, acceptance gates, logging, and destructive action approval
- added `cleanup-hub/DECISION_LOG.md` so cleanup and consolidation actions are recorded before files are moved, archived, or deleted
- added `cleanup-hub/INITIAL_DIRECTIVES.md` to define the first controlled manager/builder cleanup batches before any destructive drive action begins
- added `cleanup-hub/PATH_DRIFT_REPORT_2026-04-20.md` with the first confirmed active-path drift findings across selected docs and tool readmes
- added `cleanup-hub/DRIVE_ROOT_MANIFEST_2026-04-20.md` to classify visible top-level `D:\` roots into active, reference, decision-pending, and ignore buckets
- added `cleanup-hub/COMPONENT_DATES_2026-04-20.json` as a machine-readable snapshot of the newest active and sidecar component dates
- added `cleanup-hub/CURRENT_SYSTEM_ASSESSMENT_2026-04-20.md`, `CLEAN_WORKING_COPY_TARGET_2026-04-20.md`, and `SOLID_BUILD_SEQUENCE_2026-04-20.md` to define the best current assembled Gail system, the clean working copy target, and the recommended hardening order
- added `tools/start-animation-importer.ps1` as a repo-local importer launcher that prefers a future integrated importer path and currently falls back to the legacy sidecar importer
- extended `cleanup-hub/INITIAL_DIRECTIVES.md` with standalone assembly directives for importer promotion and staging implementation
- replaced `.github/copilot-instructions.md` so future agent work must read the cleanup hub first and respect the new single-repo source-of-truth rule
- replaced `.github/agents/manager.agent.md`, `builder-a.agent.md`, and `builder-b.agent.md` so manager and builders now inherit the cleanup-hub governance model and explicit operator approval rules
- built backend, control panel, and PlayCanvas app from the active repo and launched the local stack at `http://127.0.0.1:4180`
- launched the animation importer through the repo-local bridge and verified the importer at `http://127.0.0.1:8888/`
- launched the animation viewer runtime and verified the viewer at `http://127.0.0.1:8778/metadata/viewer_runtime.html`
- ran final acceptance and backend regression from the active repo, confirming backend regression passes `121/121`
- ran `docs/reports/full-ui-audit-20260420-130756.json` and confirmed current overflow pressure is concentrated in mobile `work-lite` and `display`
- added `tools/run-runtime-ui-snapshot-audit.js` to capture repo-local screenshots and bounded shell-action audits without the hanging behavior of older helpers
- captured a full runtime/UI audit package in `cleanup-hub/runtime-audit-20260420-141419/`
- added `cleanup-hub/RUNTIME_UI_AUDIT_2026-04-20.md` to summarize the current working surfaces, blockers, and repair order
- added `cleanup-hub/DOCUMENTATION_PROTOCOL.md` and updated the repo/agent instructions so documentation is now part of the definition of done

### Notes

- this pass intentionally made no destructive drive-cleanup changes
- the repo currently contains unrelated modified and untracked runtime/asset files; those were left untouched
- next cleanup work should happen in logged batches using `cleanup-hub/DECISION_LOG.md` rather than ad hoc moves on `D:\`
- final acceptance is currently blocked by verification drift more than by total runtime failure; several checks still assume `D:\Gail` paths or older launcher/script contracts
- the current runtime/UI baseline shows `work-lite` and `display` loading successfully while mobile containment and export/report action stability still need work

## 2026-04-10

### Completed

- created VS Code agent customization files: `manager.agent.md`, `builder-a.agent.md`, `builder-b.agent.md` in `.github/agents/` so Copilot agents have defined roles, tool restrictions, and ownership boundaries
- created `.github/copilot-instructions.md` with project conventions, agent system rules, logging requirements, and git backup expectations
- replaced the RAM-only `ManagerDirective[]` array in `ManagerAgentService` with SQLite persistence via a new `SqliteDirectiveRepository` — directives now survive backend restarts
- added `manager_directives` and `agent_log_entries` tables to the SQLite schema in `backend/db/sqlite.ts`
- created `AgentLogService` with dual-write logging: every agent action persists to both SQLite (`agent_log_entries` table) and append-only JSONL files in `data/agent-logs/`
- wired the manager agent to OpenAI for intelligent planning: `generatePlanSummary(directiveId)` calls OpenAI Responses API to produce priority assessments, recommended steps, and risk analysis for directives
- added `generateActivitySummary()` which uses OpenAI to produce a natural-language summary of recent agent activity for operator consumption
- added a 30-second periodic refresh loop (`setInterval`) in the manager agent that automatically polls active directives and updates their status from linked workflows
- added `retryDirective(id)` with a max-3-retry guard so failed directives can be re-dispatched without manual recreation
- added completion callback registration via `onDirectiveComplete(callback)` so other services can react when directives complete or fail
- expanded the control-intent keyword regex to include: `build`, `test`, `check`, `validate`, `publish`, `push`, `merge`, `review`, `audit`, `scan`, `refactor`, `optimize`, `migrate`, `implement`, `wire up`, `connect`, `integrate`, `configure`, `install`, `upgrade`, `rollback`
- added `context` field to `ManagerDirective` contract and SQLite persistence so directives can carry structured context data
- added `AgentLogEntry` and `AgentLogLevel` types to the shared contracts
- added `recentLogs` to `ManagerReport` so the report endpoint now includes both recent directives and recent log entries
- added new API routes: `POST /manager/directives/:id/retry`, `GET /manager/directives/:id/plan`, `GET /manager/activity-summary`, `GET /manager/logs`, `GET /manager/directives/:id/logs`
- added hardwired voice commands: `backup to github` / `push to github` / `git backup`, `show agent logs`, `manager report`
- created `tools/git-backup.ps1` for one-command git init, stage, commit, and push to GitHub with automatic log entry creation
- initialized git repository in `working_copy/` with `.gitignore` excluding node_modules, dist, SQLite files, private data, and provider configs
- committed all changes as initial commit with agent identity

### Notes

- OpenAI plan generation gracefully falls back to a heuristic summary when `OPENAI_API_KEY` is not configured
- the periodic refresh timer uses `.unref()` so it does not prevent Node process shutdown
- the git repo is on OneDrive; `tools/git-backup.ps1` should be used after pausing OneDrive sync or from a non-OneDrive worktree if lock file conflicts recur
- VS Code agent files follow the `.agent.md` format with YAML frontmatter for tool restrictions, model preferences, and subagent delegation rules
- builder-a owns `backend/`, `shared/`, `tools/`, `docs/`; builder-b owns `playcanvas-app/`, `web-control-panel/` — enforced in agent instructions

## 2026-04-08

### Completed

- removed the live work-lite body animation clip-loading path and kept the lite avatar on a static-body containment path so the bundle body no longer disappears on load
- preserved work-lite blink, speech morphs, and eyelid containment while removing the unstable body `anim` component hookup
- added an explicit source-and-bundle guard comment that body skeletal playback must not be re-enabled for work-lite until the modular avatar has a unified runtime rig
- bumped the live work-lite client cache key to `rebuild10` earlier in the session so browsers stop reusing the broken animated bundle

### Notes

- root cause of the disappearing-body regression: reintroducing skeletal playback on the modular work-lite body reopens the same bounds-corruption path that previously dropped the avatar below the floor
- safe rule until the runtime changes: no manifest-driven idle/talk/listen/ack clip loading and no `anim` component attachment on the work-lite body bundle

## 2026-04-07

### Completed

- added a persisted local-LLM configuration service and provider routes at `GET/PATCH /providers/local-llm-config`
- upgraded the local provider so Ollama connection settings are now driven by persisted config instead of startup-only env values
- added two configured private-mode local agents, `private_counselor` and `private_girlfriend`, each with its own system prompt
- updated private-mode local generation so the active private persona prompt is injected before Ollama generation instead of using one generic private prompt
- wired the Operator Studio shell `Providers and Voice` page to load and save local model settings, default/active private persona, and both private agent prompts
- wired the legacy operator panel provider section to the same local-LLM/private-persona backend config route
- added explicit hardwired command phrases for private counselor/girlfriend switching, including the `doc im lonley` girlfriend trigger
- wired runtime and shell command dispatch so persona-switch commands now patch the active private persona instead of only opening config
- updated backend/operator documentation and workspace instructions so future provider/private-persona changes stay documented alongside command routing and operator usage
- expanded the live work-lite preview client so it now loads manifest-driven `idle`, `talk`, and `listen` clips directly onto the active avatar instead of rendering a static body-only stage
- ported the full-client facial runtime into the work-lite preview so it now discovers speech morph targets, eye morph targets, and eyelid rig nodes from the active avatar GLB and drives fallback viseme/blink motion during assistant replies
- tied work-lite chat state into avatar mechanics so request-in-flight drives `listen`, assistant replies drive `talk`, and the shell-state preview panel now reports current avatar motion readiness
- bumped the live work-lite cache key to `rebuild4` and validated the new avatar-mechanics bundle with a clean PlayCanvas build plus a served-asset check against `/client/work-lite-rebuild.js`
- replaced the work-lite preview's reply-length speech estimate with a real speech playback path that now calls `POST /voice/speak`, plays returned audio with analyser-driven talk levels when available, and falls back to browser speech synthesis when needed
- restored the missing `ack` animation slot by promoting an existing nod clip into `playcanvas-app/assets/animations/ack_nod_small_v1.glb`, so the active `gail` asset manifest now exposes `idle`, `talk`, `listen`, and `ack`
- bumped the live work-lite cache key again to `rebuild5` and validated both the served bundle and live asset manifest after the speech/ack updates
- added an on-stage avatar-motion overlay to the work-lite client so lite-page users can immediately see active motion state, clip readiness, and speech-engine status without hunting through the side panel
- hardened the work-lite speech path so if returned TTS audio cannot actually play in the browser, the client now falls back to browser speech and still shows visible talk-state motion
- bumped the live work-lite cache key to `rebuild6` and validated that `/client/work-lite/` now serves the new visible-overlay client
- added a dedicated `Run Motion Test` control to the work-lite stage plus an automatic startup demo so the avatar visibly runs through listen/ack/talk on the lite page even before chat is used
- bumped the live work-lite cache key to `rebuild7` and validated that the exact lite route now serves the motion-test client

### Notes

- private persona selection is currently backend-config driven rather than a fully separate runtime asset/persona-state machine
- private mode remains local-only; this change adds persona-aware local prompting, not cloud access for private conversations
- browser-level integration tests for persona switching are still pending; validation in this pass focused on API, command resolution, shell/runtime wiring, and static checks
- work-lite speech timing now follows actual preview playback start/end, but facial motion is still driven by lightweight amplitude/boundary signals rather than full phoneme-aligned viseme timing from the TTS engine

## 2026-04-02

### Completed

- added a dedicated control-intent path so free text from the work-lite client can now resolve into either a hardwired command or a newly created planned workflow instead of only going through conversation
- extended the work-lite client conversation panel with an input-route selector so typed prompts can now be sent as normal conversation or as workflow control from the same screen, including display mode
- added browser speech-recognition voice input to the work-lite client and routed spoken transcripts through the same control-intent path, so verbal workflow requests now create reviewable workflow plans on supported browsers
- expanded the managed backend regression suite to cover natural-language command matching and free-text workflow planning through `POST /control/intents`
- validated the new control path with successful backend and PlayCanvas type-checks/builds plus a live backend regression run at `docs/reports/backend-test-report-20260402-152027.md`
- confirmed the Gail voice stack was already implemented but not machine-configured for cloud TTS, then stored the existing local OpenAI API key in `data/providers/openai-config.json` so the preferred OpenAI speech path is now actually usable on this host
- verified live voice readiness through `GET /providers/openai-config`, `GET /voice/engines`, `POST /voice/warmup`, and `POST /voice/speak`, confirming `openai-gpt-4o-mini-tts` now warms successfully and synthesizes audio without falling back to browser speech
- removed stale Blender backup directories and autosave-style `.blend` backup files from the active Gail workspace so the working animation/export tree is cleaner and lighter
- added runtime-aware export profiles across the Blender export toolchain with `high`, `medium`, and `low` targets aligned to the RTX 4050 host, lighter N150-class clients, and watch-class delivery targets
- updated the Blender add-on and headless export script so profile choice now changes morph retention and Draco compression behavior instead of being only a naming convention
- updated `tools/export-avatar-assets.ps1` and `tools/export-playcanvas-pipeline.ps1` to accept `-RuntimeProfile` and forward it into the export pipeline
- updated avatar/export documentation so the current PlayCanvas pipeline, runtime profile choices, and shell wiring paths are documented in one place
- surfaced export runner paths, pipeline paths, and runtime profile settings directly inside the Operator Studio shell animation and runtime pages
- added backend export orchestration support through a new export service plus `GET /exports/status` and `POST /exports/run` so the shell can trigger exports instead of only documenting them
- wired the Operator Studio shell animation and runtime pages to load export status, run direct avatar export or full pipeline export, and display the latest export report summary in the working canvas
- replaced the static shell inspector checklist with per-page help content covering page purpose, setup, ordered steps, settings, button meanings, success checks, and troubleshooting written for non-expert operators
- added direct shell help access with a top-bar Help button, keyboard access, page-level quick-start panels, and a plain-English glossary for common runtime, workflow, auth, and voice terms
- added optional guided mode to the Operator Studio shell with per-page action order, persisted progress, locked later actions until required earlier actions succeed, and visible progress state in the quick-start panel
- added a workspace-wide agent instruction file plus a reusable `/project-log-sync` prompt command so future agents in this repo keep build/state/change logs synchronized after meaningful work
- added a product strategy document and a commercial readiness checklist so Gail now has a defined path from prototype to marketable pilot instead of only build-oriented planning
- repositioned the README and active shell plans toward a controlled pre-release product posture rather than a loose prototype posture
- added a dedicated per-page next-pass notes panel to the Operator Studio shell so every page now carries its own follow-up notes, saved locally by page, status-tracked, and promotable into the existing change-request flow
- added a cross-page `Pass Review` shell page so saved next-pass notes can be reviewed across the whole shell without losing per-page separation
- validated the updated shell and backend files with clean editor diagnostics and successful JavaScript syntax checks during the session

### Notes

- typed and spoken control now share one backend intent resolver, which keeps command matching deterministic while turning broader requests into planned workflows that still require review before execution
- browser voice control depends on the browser exposing `SpeechRecognition` or `webkitSpeechRecognition`; typed control remains available even where browser STT is unavailable
- the latest managed backend regression run passed the new control-intent coverage and finished at `121 passed / 1 failed`; the remaining failure is the pre-existing modular avatar bundle manifest assertion, not the new workflow-control path
- OpenAI TTS was not missing from the repo; the missing piece was runtime credential configuration on this machine, while browser speech synthesis remained available the whole time as fallback
- this pass focused on operator usability and export pipeline operability, not new domain entities or database work
- guided mode is intentionally operator-toggleable and persists in local storage so experienced users can disable it without code changes
- guided action gating currently uses successful action completion order; it does not yet enforce deeper data-state gates such as `avatarReady === true` before every downstream export/view action
- shell help and guided mode are now materially ahead of the older operator-panel documentation and should be treated as part of the active Operator Studio experience
- the repo now has productization criteria, but it is still pre-release; marketable pilot status still depends on reliability, demoability, and deployment hardening work not yet complete

## 2026-03-30

### Completed

- added a dedicated `/access/status` route for current bind host, auth posture, and detected local and LAN URLs
- added a `show-access.ps1` helper to print the actual local and LAN URLs other devices should use
- added `show-remote-access.ps1`, `install-tailscale.ps1`, and a dedicated remote-access guide for the recommended Tailscale path
- added a shared runtime helper, a stack manifest, and one-command `start-gail-stack.ps1` / `stop-gail-stack.ps1` orchestration
- updated runtime scripts to prefer repo-local Node under `runtime\nodejs` before falling back to a machine install
- verified the manifest-driven startup path with a clean 114/114 report at `docs/reports/backend-test-report-20260330-140126.md`
- added a hidden backend supervisor that restarts the Node child if it exits unexpectedly and updated stop logic to clean up the supervisor and stale listeners
- extended the regression suite to kill the backend child under the managed run and verify that the supervisor restarts it
- verified the supervised backend lifecycle with a clean 115/115 report at `docs/reports/backend-test-report-20260330-143457.md`
- surfaced access status in the operator panel so the local host can advertise the correct URLs without manual guesswork
- hardened the backend regression harness error path to avoid strict-mode failures when a request exception has no response object
- verified the updated access workflow with a clean 114/114 report at `docs/reports/backend-test-report-20260330-130227.md`
- added persistent avatar asset-root selection to the work-lite client
- taught the backend asset manifest to scope lookups to a selected asset root and surface discoverable asset-root folders
- added persistent client-side voice selection for TTS engine, OpenAI voice, and browser voice
- switched streamed reply speech to prefer queued OpenAI TTS chunks with browser speech fallback
- added reply interruption protection with abortable conversation streams and stale-delta suppression
- added first runtime action-map mechanics for `idle`, `talk`, `listen`, and optional `ack`
- added runtime mechanics visibility in the client for modules, asset root, action map, active action, and speech path
- integrated the `playcanvas_handoff_20260330` package as a first-class selectable asset root instead of loose-file fallback matching
- copied the handoff package into `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330`
- taught the backend asset manifest to consume `manifests/integration_asset_manifest.json` and expose bundle metadata
- made the handoff bundle the default work-lite asset root for fresh client boots while preserving persisted user overrides
- added a server-owned client runtime settings surface for switching between `handoff_20260330` and `legacy_fallback`
- added an operator-panel `Avatar System` control to flip the active runtime profile without touching the client code
- updated the work-lite client to follow the server-selected avatar system by default, while still allowing a local custom asset-root override

### Notes

- this pass focused on runtime mechanics and observability only
- it intentionally avoids the security and device-pairing work being handled in parallel elsewhere
- current action-map behavior is still a first-pass runtime layer, not the final animation state graph
- the handoff bundle currently maps `idle` and `listen` directly, uses `listen_ack` as optional `ack`, and still falls back `talk` to `idle` until a true talk clip exists

## 2026-03-16

### Completed

- created Phase 1 top-level directory scaffold
- added shared contract and enum placeholders
- scaffolded backend services, brokers, providers, sync, db, and jobs
- scaffolded PlayCanvas app managers and scene-role docs
- scaffolded web control panel tab shell
- added required project docs

### Assumptions

- existing Unity/Python files remain as legacy/rebuild references
- Phase 1 stops before live API wiring, database migrations, sync implementation, and UI implementation
- TypeScript scaffold is the target direction even though older Python backend code still exists in-repo

### Deferred

- real persistence
- PowerSync wiring
- WebAuthn implementation
- PlayCanvas runtime bootstrapping
- operator panel UI
- task/reminder/list behavior

## 2026-03-17

### Completed

- added the missing list entity and service input contracts
- implemented in-memory repository primitives for domain entities
- replaced task, reminder, parts, and cart placeholders with CRUD-style services
- added project, note, and list services
- added a domain bootstrap and route descriptors for the next HTTP pass
- upgraded the action broker to handle a small safe subset of domain actions
- added a minimal Node HTTP server and bound create/list/update domain endpoints
- installed backend TypeScript toolchain and validated `check`, `build`, and `/health`
- replaced in-memory repositories with SQLite-backed repositories using `node:sqlite`
- verified SQLite persistence across a server restart with a create/read smoke test
- added HTTP request validation and mode-aware write policy enforcement
- split explicit private note saves into a dedicated private SQLite database
- added RAM-only private session storage and endpoints for unsaved private notes
- added device-type-aware permission checks at the HTTP route layer
- verified watch devices are blocked from task routes while iPhone-class devices remain allowed
- added approval endpoints and a required approval flow for cart approval commits
- verified cart approval request, watch approval resolution, and final commit flow
- added device registration/trust APIs and require trusted registered devices for approval-sensitive actions
- verified unregistered devices are blocked from approval-sensitive actions while trusted registered devices succeed
- persisted device registry and approval state to SQLite and verified survival across restart
- replaced the control panel scaffold with a browser-based static operator client and enabled backend CORS for local testing
- added SSD migration documentation and a repo copy helper for move to `F:\Gail`
- added a living operator manual and linked it from the main README
- expanded the backend smoke test to cover projects, lists, reminders, parts, and panel availability
- established the workflow rule that new runnable features must update the test script and produce a report
- ran the expanded automated backend suite successfully and generated a clean 20/20 report
- added a dashboard overview aggregation service route and panel surface for lightweight operational status
- extended the automated backend suite to verify overview availability and aggregate counts
- ran the updated automated backend suite successfully and generated a clean 23/23 report at `docs/reports/backend-test-report-20260318-105610.md`
- expanded the operator panel with project, list, reminder, and part create/update flows
- fixed PATCH normalization so partial update routes no longer forward undefined fields into SQLite
- extended the automated backend suite for project/list/reminder/part update coverage
- ran the updated automated backend suite successfully and generated a clean 28/28 report at `docs/reports/backend-test-report-20260318-115441.md`
- added sensitive-action unlock windows to device records and enforced them for approval-sensitive flows
- added device access-window controls to the operator panel
- extended the automated backend suite for locked-vs-unlocked approval request and resolution paths
- ran the updated automated backend suite successfully and generated a clean 36/36 report at `docs/reports/backend-test-report-20260318-115819.md`
- added explicit approval rejection and expiry handling to the approval/cart flow
- allowed the cart approval helper route to accept an explicit expiry override for deterministic edge testing
- extended the automated backend suite for rejected and expired approval paths
- ran the updated automated backend suite successfully and generated a clean 44/44 report at `docs/reports/backend-test-report-20260318-120908.md`
- added background backend start/stop/readiness helper scripts for local automation
- extended the automated backend suite with private-note explicit-save and read-isolation coverage
- verified the self-starting test workflow with a clean 47/47 report at `docs/reports/backend-test-report-20260318-121455.md`
- made trust revocation clear the sensitive-action unlock window
- added device mismatch, stale unlock, and untrusted-device coverage to the regression suite
- hardened backend automation helpers to clear stale listeners on the target port before test runs
- verified the updated device-edge workflow with a clean 57/57 report at `docs/reports/backend-test-report-20260318-134533.md`
- blocked approval-sensitive automation while Private Mode is active even on trusted/unlocked devices
- extended the regression suite for Private Mode approval-request blocking
- verified the updated mode/device matrix with a clean 58/58 report at `docs/reports/backend-test-report-20260318-142701.md`
- isolated the private dashboard overview so it hides normal organizer data and only shows private note context
- extended the regression suite for private dashboard isolation and service-device private-session blocking
- verified the updated read-side isolation layer with a clean 60/60 report at `docs/reports/backend-test-report-20260318-151036.md`
- turned the conversation/provider layer from scaffold into a runnable in-memory session surface
- added mode-aware provider selection with OpenAI as normal default and local-only provider enforcement in Private Mode
- extended the regression suite for conversation session creation, provider selection, and mode mismatch blocking
- verified the updated conversation/provider layer with a clean 67/67 report at `docs/reports/backend-test-report-20260318-155149.md`
- persisted conversation sessions to SQLite instead of keeping them memory-only
- extended the regression suite to verify conversation sessions survive a managed backend restart
- verified the updated conversation persistence layer with a clean 68/68 report at `docs/reports/backend-test-report-20260318-161040.md`
- moved Private Mode conversation sessions back to RAM-only storage so they no longer persist like normal sessions
- enforced normal-session same-mode handoff and Private Mode device-bound conversation isolation
- verified the updated conversation handoff layer with a clean 73/73 report at `docs/reports/backend-test-report-20260318-161914.md`

## 2026-03-19

### Completed

- wired the normal-mode conversation provider to the OpenAI Responses API when `OPENAI_API_KEY` is configured
- added automatic local-provider fallback for normal-mode conversations when the OpenAI path is unavailable
- added a shared persistent memory file at `data/memory/gail-memory.json` by default
- added `GET /memory/entries` and `POST /memory/entries` for non-private shared memory
- passed recent shared-memory context into normal conversation generation
- expanded the automated backend suite for shared-memory create/list/restart persistence and OpenAI fallback handling
- verified the updated provider and memory layer with a clean 78/78 report at `docs/reports/backend-test-report-20260319-090139.md`
- expanded the operator panel with shared-memory and conversation-session controls
- added a served work-lite client shell at `/client/work-lite/`
- added a portable `tools/build-playcanvas-app.ps1` helper for the PlayCanvas-side build
- verified the updated panel and work-lite route layer, including client JS and CSS asset serving, with a clean 81/81 report at `docs/reports/backend-test-report-20260319-094433.md`
- added provider-status and hardwired-command APIs plus shared-memory search
- surfaced provider status, command execution, and client asset manifest data in the operator panel
- made the work-lite client consume the backend asset manifest for readiness display
- verified the updated operator and client-prep layer with a clean 86/86 report at `docs/reports/backend-test-report-20260319-101018.md`
- added shared-memory update and delete flows to the backend and operator panel
- tightened client asset manifest reporting with missing-asset and required-directory details
- verified the updated memory lifecycle and client-readiness layer with a clean 91/91 report at `docs/reports/backend-test-report-20260319-102220.md`
- added live provider telemetry for attempts, successes, failures, and fallbacks
- verified the updated provider diagnostics layer with a clean 92/92 report at `docs/reports/backend-test-report-20260319-110812.md`
- added persisted voice settings and voice status surfaces
- added camera matrix surface for device-level camera capability review
- added operator-panel browser voice loop controls with push-to-talk, wake-word, adjustable silence timeout, and auto-resume after response
- added operator-panel local camera preview controls
- verified the updated voice and camera configuration layer with a clean 97/97 report at `docs/reports/backend-test-report-20260320-082534.md`
- added OpenAI TTS as an optional primary speech engine with browser speech synthesis fallback
- added voice engine listing, engine preference persistence, and browser/OpenAI voice selection fields
- verified the updated TTS primary/fallback layer with a clean 99/99 report at `docs/reports/backend-test-report-20260320-085013.md`
- upgraded the client asset manifest to autodetect nested dropped asset files and ignore zero-byte exports
- added direct `/client-assets/*` serving for dropped work-lite assets
- updated the work-lite client to consume real dropped background files and resolved avatar/animation asset metadata
- expanded automated backend coverage to verify a resolved client asset path is directly fetchable
- verified the updated asset-ingestion prep layer with a clean 100/100 report at `docs/reports/backend-test-report-20260320-092515.md`
- moved the work-lite asset manifest contract into `shared` so backend and client use the same runtime shape
- expanded the work-lite asset manifest to the modular Gail bundle: base body, hair, work vest, work pants, work boots, bracelets, and idle
- marked avatar readiness from the required modular bundle instead of background placeholders
- verified the modular avatar-ready path with a clean 102/102 report at `docs/reports/backend-test-report-20260320-095106.md`

### Deferred

- provider streaming
- conversation UI depth in the operator panel
- automatic memory capture heuristics
- explicit provider health/status surfaces

### Deferred

- validation schemas
- UI consumption of the new services
- RAM-only private session storage for unsaved private conversations
- locked the shared voice baseline across clients to wake_word, gpt-4o-mini-tts, shimmer, and a soft feminine light-UK-accent OpenAI instruction profile
- expanded backend regression coverage to verify the shared voice profile and its persistence across restart

## 2026-03-23

### Completed

- added `GET /providers/openai-config` and `PATCH /providers/openai-config` routes
- implemented `OpenAiConfigService` for env-or-stored API key management with file persistence and full clear support
- wired `openAiConfigService` into both the OpenAI provider and voice service so stored keys are used consistently alongside env keys
- added operator-panel section for OpenAI config status, key update, and key clear
- expanded the regression suite with three new tests covering OpenAI config status, stored-key persistence, and stored-key clear
- verified the updated OpenAI config layer with a clean 109/109 report at `docs/reports/backend-test-report-20260323-160658.md`

## 2026-03-24

### Completed

- confirmed the March 23 build remained clean at 108/109 at `docs/reports/backend-test-report-20260324-080804.md` (one pre-existing voice settings update assertion mismatch)

### Open Issues Identified

- voice settings default instructions still read "Irish accent" from DEFAULT_VOICE_SETTINGS; test expects "UK English accent"
- voice settings update test body does not contain the phrase "soft feminine voice" that the assertion checks for
- OpenAI config test section removed from regression suite during session; fallback-sensitive voice and conversation tests then fail when a stored key is present
- backend test suite ended the session in a 5-failure regression state

## 2026-03-27

### Completed

- corrected `DEFAULT_VOICE_SETTINGS.openAiInstructions` in voice-service to the canonical soft-feminine-UK-English-accent profile
- corrected voice settings update test body to use matching instruction text containing "soft feminine voice"
- restored OpenAI config test section to the regression suite covering status, stored-key persist, and stored-key clear
- verified the corrected regression suite passes cleanly

## 2026-03-30

### Completed

- added prototype-safe pairing/auth scaffolding with LAN-only pairing session creation and completion routes
- added persistent device credential storage with bearer-token or `x-gail-device-token` authentication support
- extended request metadata so authenticated device identity can override spoofable header identity when credentials are present
- added paired-device metadata fields to device profiles for pairing state and last-seen tracking
- kept `GAIL_AUTH_MODE` defaulted to `open` so current prototype flows remain unblocked while the pairing path is built out
- added operator-panel controls for auth status refresh, pairing-session creation, pairing completion, token storage, token clearing, and paired-device context application
- added a dedicated auth and pairing reference document plus expanded operator manual guidance for the full prototype pairing workflow
- expanded the regression suite for auth status, pairing session creation, pairing completion, and token-backed request success
- added the first `paired_required_for_sensitive` enforcement layer for selected sensitive routes while leaving `open` mode behavior intact
- updated the backend launcher and managed regression script to accept `GAIL_AUTH_MODE` overrides
- added simpler quick-start auth instructions in the README, operator manual, and auth reference
- verified the updated suite passes cleanly at `docs/reports/backend-test-report-20260330-113803.md`
- updated the work-lite client to restore the last persisted conversation session per mode across reloads
- added recent-session inspection and session switching directly inside the work-lite client conversation panel
- added explicit `Remember Last Exchange` capture from the work-lite client into shared memory using the existing backend memory API
- persisted mode-scoped conversation session ids in the client preferences store so the browser shell can resume normal-mode work instead of starting cold each reload
- verified the updated work-lite client build passes with `npm.cmd run build` in `playcanvas-app`
- added `POST /imports/documents` for browser-driven file imports into shared memory or normal notes
- added backend import archiving under `data/imports` with first-pass text ingestion for text, JSON, and heuristic PDF extraction
- added operator-panel import controls for ChatGPT memory exports, manuals, and other uploaded reference files
- verified the backend and operator panel builds pass
- verified the import route live with a direct smoke test creating a shared memory entry through `/imports/documents`
- upgraded PDF import from heuristic scraping to Python-backed extraction using PyMuPDF with pypdf fallback
- added [extract_pdf_text.py](F:/Gail/tools/extract_pdf_text.py) as the backend PDF extraction bridge
- verified direct extraction against the animation and kiosk PDF docs returns full text
- verified live PDF import through `/imports/documents` with archived original path and extracted text length

### Deferred

- enforcement of paired-device auth on all routes
- sensitive-route auth tightening based on `paired_required_for_sensitive`
- operator panel UI for pairing/session issuance
- automated coverage for the new pairing/auth routes

## 2026-03-31

### Completed

- located the Blender workbench tooling inside `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/blender`
- confirmed the new source avatar blend at `C:\Users\jbates\Desktop\bethtest.blend` uses armature `Elizabeth`
- ran the `gail_production_workbench` add-on headlessly in Blender 4.1.0 to package the avatar into a staged export under `data/runtime/bethtest_export`
- exported fresh avatar part bundles for body, hair, clothing, and accessories plus flat/low/medium/high texture outputs
- replaced the active handoff avatar assets in `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/avatar`
- backed up the previous handoff avatar assets and manifests to `data/backups/handoff_avatar_swap_20260331_1839`
- updated the handoff integration manifest to record `bethtest.blend` as the current source and expose the available texture-tier directories

### Notes

- the Blender add-on classified the `Elizabeth.Shape` base mesh as `other`, so the staged export was normalized to the runtime `body` bucket before swap-in
- the current starter animation GLBs were left in place; only the avatar package was replaced in this pass

## 2026-04-01

### Completed

- imported the converted GLB animation library from `G:\converted_animations_20260401` into `F:\Gail\data\animation_viewer\animations`
- added [import-converted-animation-library.ps1](/f:/Gail/tools/import-converted-animation-library.ps1) to normalize the library into the viewer's expected folder layout and generate fresh metadata
- generated `F:\Gail\data\animation_viewer\metadata\library_index.json` with `1892` converted animation entries
- generated `F:\Gail\data\animation_viewer\metadata\local_pipeline_progress.json` showing a completed import state for the viewer progress bar
- verified the animation viewer launches cleanly at `http://127.0.0.1:8778/metadata/viewer_runtime.html`
- exposed handoff texture-tier paths and `texture_manifest.json` through the backend client asset manifest
- updated the work-lite client to load the selected `low` / `medium` / `high` texture tier for the active handoff bundle and remap imported material textures by filename
- kept the flat base texture as a low-tier fallback when a tier pack is unavailable
- verified backend and PlayCanvas app builds pass and the live `/client/asset-manifest` response now includes `textureTiers`
- extended the Blender `gail_production_workbench` add-on so clothing export can run as bundled output, individual item exports, or a selected clothing set
- extended the same add-on so texture-tier export can target all meshes, body only, clothing only, or selected clothing
- updated the workbench package manifest to record the new packaging settings
- syntax-checked the updated add-on and synced it to the active `G:` drive workbench copies
- ran the Blender workbench headlessly against `F:\gail_master_v2.blend` and staged a fresh avatar export under `F:\Gail\data\runtime\gail_master_v2_export`
- normalized the staged `Genesis8Female_other.glb` base mesh export into the live runtime `body.glb` slot
- replaced the active handoff body, hair, clothing, accessories, flat texture, and low/medium/high texture-tier folders in `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330`
- backed up the prior live handoff package to `F:\Gail\data\backups\handoff_avatar_swap_20260401_103907`
- updated the handoff manifests so the live bundle now records `F:\gail_master_v2.blend` as its source
- verified `/client/asset-manifest?assetRoot=handoffs/playcanvas_handoff_20260330` resolves the swapped `gail_master_v2` avatar parts and texture tiers from the live backend

### Notes

- the viewer path and runtime HTML were left unchanged on purpose; the converted library was imported into the existing `/animations/...` filesystem shape instead
- the imported index currently carries converted GLB entries only, derived from category folders and filenames
- the Blender partitioner still classified `Genesis8Female.Shape` as `other`, so the export needed the same runtime-body normalization pass used on earlier avatar swaps
- the `gail_master_v2` live swap was rolled back and the active handoff bundle restored to the previous `bethtest.blend` package after the wrong rig/body was applied

## 2026-04-02

### Completed

- created `docs/CLEAN_START_PLAN.md` to define a clean-baseline execution path and forward phases
- removed temporary scripts and generated artifacts from the working tree:
  - `tmp_export_avatar_package.py`
  - `tmp_inspect_blend.py`
  - `tmp_inspect_live_body_orientation.py`
  - `tmp_inspect_master_v2.py`
  - `backend/tmp_check_manifest.cjs`
  - `rebuild/unity/obj/`
- expanded `.gitignore` to suppress local runtime noise and secrets (`runtime/`, `data/debug/`, `data/imports/`, `data/client/`, `data/animation_viewer/`, `tools/animoxtend_api_key.txt`, and local unpacked tool runtime folders)

### Notes

- this pass is hygiene-only and does not alter backend/client runtime behavior

### Completed (Phone Client Surface)

- added backend static route support for `/client/phone/` (and redirect from `/client/phone`) in [backend/api/http-server.ts](/d:/Gail/backend/api/http-server.ts)
- added [playcanvas-app/phone.html](/d:/Gail/playcanvas-app/phone.html) as a dedicated phone display page that renders avatar + chat only
- added [playcanvas-app/src/phone.ts](/d:/Gail/playcanvas-app/src/phone.ts) as a focused phone runtime using the fallback avatar and conversation API
- added [playcanvas-app/src/styles/phone-client.css](/d:/Gail/playcanvas-app/src/styles/phone-client.css) with a translucent lower-third chat dock and fullscreen chat toggle state
- wired phone avatar animation defaults to:
  - idle: `27775_stand_still.glb`
  - listen: `27299_stand_and_nod.glb`
  - talk: `28154_explain.glb`
- tuned phone scene camera orbit controls and reduced avatar lighting/specular response for a cleaner mobile presentation
- kept the page intentionally minimal per shell-direction request: avatar surface + chat panel only
- verification run:
  - `npm run check` in `playcanvas-app` (pass)
  - `npm run build` in `playcanvas-app` (pass)
  - `npm run check` in `backend` (pass)
  - `npm run build` in `backend` (pass)
  - live backend smoke via `http://127.0.0.1:4180/client/phone/` returned HTTP `200` and served the new phone page

## 2026-04-03

### Completed

- processed source avatar file `D:\avatar_final.blend1` through the Blender production workbench export flow and generated a fresh runtime package at `D:\Gail\data\runtime\Gail_export\avatar_package`
- exported new avatar runtime bundles (hair, clothing, accessories, and normalized body slot from the `other` bucket):
  - `Victoria 8_hair.glb`
  - `Victoria 8_clothing.glb`
  - `Victoria 8_accessories.glb`
  - `Victoria 8_other.glb` (promoted into runtime `body.glb`)
- exported multi-tier runtime textures with updated `texture_manifest.json`:
  - `low` (49 files)
  - `medium` (49 files)
  - `high` (49 files)
  - `base_avatar_flat.png`
- promoted the export to the active handoff avatar runtime under `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/avatar`
- updated active handoff texture manifest at `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/manifests/texture_manifest.json`
- captured rollback backup of the prior active handoff avatar package at `D:\Gail\data\backups\handoff_avatar_swap_20260403_213137`
- created a named avatar staging tree under `playcanvas-app/assets/gail/avatars/Gail` with base/hair/clothing/accessories and texture tiers for explicit Gail-labeled reuse
- added export-scale locking to the Blender `gail_production_workbench` avatar exporter so GLB packages normalize to a canonical target height before export
- added new add-on controls:
  - `Lock Export Scale` (default on)
  - `Target Height (m)` (default `1.72`)
- extended exported avatar parts metadata to include `scale_factor_applied`, `target_height_m`, and `source_height_m` for deterministic runtime staging diagnostics
- updated headless runner `tools/run_gail_workbench_package.py` to enforce scale lock and pass a target height parameter
- validated locked export on `D:\avatar_final.blend1` into `D:\Gail\data\runtime\Gail_export_locked` with reported scale normalization factor `0.9363` to `1.72m`

### Notes

- `run-animoxtend-rig-setup.ps1` could not run on this host because the required add-on zip `runtime/blender/animoxtend-1.2.2.zip` is missing; export continued via the validated `gail_production_workbench` path
- current workbench partitioning for this blend classified the base skinned mesh into `other`; runtime normalization mapped that output to `body.glb` to match the active handoff runtime contract

### Completed (Stage Framing + Clean Re-Export)

- fixed work-lite avatar framing in `playcanvas-app/src/main.ts` to scale from the dominant avatar span (`max(height, depth)`) instead of height-only scaling, preventing axis-convention blowups on handoff rigs
- set framing target size to `1.72m` to match the scale-locked Blender exporter target
- updated work-lite cache-buster in `playcanvas-app/index.html` to `v=20260403-stagefix1` so browser refreshes pull the new runtime bundle
- reran the production exporter from `D:\avatar_final.blend1` into `D:\Gail\data\runtime\Gail_export_groundup_v3` with scale lock enabled
- promoted the `v3` package into the active handoff runtime at `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/avatar`
  - `body.glb`, `hair.glb`, `clothing.glb`, `accessories.glb`
  - low/medium/high texture tiers + `base_avatar_flat.png`
- refreshed active handoff manifests:
  - `avatar_parts_manifest.generated.json`
  - `texture_manifest.json`
  - `avatar_partition_manifest.json`
- captured rollback backup before promotion at `D:\Gail\data\backups\handoff_20260330_20260403_231749`

### Notes (Stage Framing + Clean Re-Export)

- `v3` clothing bundle dropped from `303,044,276` bytes to `240,022,928` bytes after reclassification changes, moving jacket/zipper/puller/buckle/loop meshes out of the clothing bundle
- backend remained healthy on `http://127.0.0.1:4180` during promotion; `/client/main.js?v=20260403-stagefix1` now serves the updated framing logic

### Completed (Viewport Lockdown)

- added handoff viewport lock detection in `playcanvas-app/src/main.ts` (`isHandoffViewportLocked`)
- for server-mode `handoff_20260330`, work-lite now enforces viewport defaults on apply/remount instead of reading framing sliders
- disabled viewport adjustment controls and reset-framing button when handoff lock is active to prevent drift
- bumped work-lite client cache key to `v=20260403-stagefix2` in `playcanvas-app/index.html` so clients fetch the locked runtime immediately

### Completed (Fresh Avatar Replacement + Private Folders)

- exported fresh source `D:\gail_final.blend` via production workbench into `D:\Gail\data\runtime\Gail_export_private_refresh` with scale lock enabled
- removed previous live avatar/clothing/accessory folders and replaced runtime assets with the new package:
  - `playcanvas-app/assets/gail/avatar/base_face/gail_base_avatar.glb`
  - `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb`
  - `playcanvas-app/assets/gail/clothes/gail_bundle/gail_clothing.glb`
  - `playcanvas-app/assets/gail/accessories/gail_bundle/gail_accessories.glb`
- created dedicated private-mode folders and copied private bundle assets:
  - `playcanvas-app/assets/gail/private/clothing/private_clothing.glb`
  - `playcanvas-app/assets/gail/private/accessories/private_accessories.glb`
- removed legacy staged avatar tree at `playcanvas-app/assets/gail/avatars/Gail` to prevent path resolution collisions
- updated catalog in `playcanvas-app/config/work-lite-modules.gail.json` to use new bundle IDs/paths and include private clothing/accessory assets
- added mode-aware module loading in `playcanvas-app/src/main.ts` so private mode loads only `private_*` clothing/accessory assets, while non-private modes load non-private clothing/accessory assets
- increased matte default to `2.2` in `playcanvas-app/src/state/app-state.ts` and added hard matte enforcement for body/clothing material tuning in `playcanvas-app/src/main.ts` (low gloss, zero metalness, reduced specularity maps)
- bumped work-lite cache key to `v=20260404-private1` in `playcanvas-app/index.html`
- captured rollback backup before deletion/replacement at `D:\Gail\data\backups\avatar_asset_refresh_20260404_001340`

### Completed (Load-Stability + Staging + Matte Corrections)

- switched active runtime system to `legacy_fallback` so catalog-based Gail assets load from `gail/...` paths instead of handoff bundle body paths
- added timeout-protected container loading in `playcanvas-app/src/main.ts` and base-avatar fallback candidate path to prevent indefinite hangs on base load
- restored proven lighter base and hair assets from backup:
  - `gail_base_avatar.glb` (`164,393,772` bytes)
  - `meili_hair.glb` (`26,901,484` bytes)
- replaced heavy auto-load clothing flow with lightweight modular clothing pieces:
  - `gail_outfit_top` (`urban_action_vest.glb`)
  - `gail_outfit_pants` (`urban_action_pants.glb`)
  - `gail_outfit_boots` (`urban_action_boots.glb`)
- kept private-mode folder separation and added private modular pieces:
  - `private_top.glb`, `private_pants.glb`, `private_boots.glb`, `private_bracelets.glb`
- adjusted stage lighting down to reduce hot highlights:
  - ambient `0.18/0.20/0.24`
  - key light intensity `0.95`
  - fill light intensity `0.22`
- made matte response stronger while preserving slider control (dynamic caps instead of static clamps)
- preserved per-session staging for the Gail catalog path by skipping automatic viewport reset for this bundle signature
- captured validation screenshot via Playwright at `D:\Gail\data\runtime\work-lite-latest.png` after load pass
- observed successful load status after fixes:
  - `Avatar preview running`
  - `Modules 7/7`
  - `legacy_fallback rot(90,0,0)`

## 2026-04-20

### Completed (Repo-Local Dependency Bring-Up)

- promoted the animation importer into `tools/anim-avatar-importer`
- added repo-local importer path resolution through `tools/anim-avatar-importer/lib/paths.js`
- moved importer catalog/log storage to `data/animation-importer`
- moved the converted animation library into `data/animation-library/converted_animations_20260401`
- updated backend static library serving in `backend/api/http-server.ts` to prefer repo-local animation library paths
- updated animation workbench library discovery in `backend/services/animation-workbench-service.ts` to prefer repo-local library paths and skip empty candidate roots
- updated the workbench importer surface in `web-control-panel/src/animation-workbench.js` to target the current host on port `8888` and point operators to `tools/start-animation-importer.ps1`
- added importer catalog fallback logic so stale catalogs rebuild after library-root migration
- verified importer test suite clean at `117/117`
- verified integrated importer runtime on `http://127.0.0.1:8888`
- verified backend/workbench runtime on `http://127.0.0.1:4180`
- verified `GET /animation-workbench/state` now exposes `1892` repo-local library items
- verified successful repo-local clip imports into `playcanvas-app/assets/animations`
- recorded the full bring-up status in `cleanup-hub/DEPENDENCY_BRINGUP_REPORT_2026-04-20.md`

### Completed (Persona Asset Ingest Staging)

- added `tools/export_persona_assets.py` to classify blend contents into staged `avatar`, `hair`, and `clothes` exports
- added `tools/run-persona-asset-ingest.ps1` to batch-run persona asset exports from `D:\avatars` into a repo-local staging folder
- inventoried the current external persona blend sources under `D:\avatars` and recorded source inventories in `cleanup-hub/persona-inventory-20260420`
- hardened the batch runner for strict-mode summary handling, spaced repo paths, and noisy Blender/AnimoXtend stderr output
- corrected hair classification so clothing meshes like Gail's heels no longer land in the hair export
- completed a clean staged export run at `cleanup-hub/persona-ingest-20260420-1630`
- verified final staged results:
  - `cherry`: avatar/hair/clothes all exported
  - `gail`: avatar/clothes exported, hair skipped because no distinct hair mesh was classified in `gail.blend`
  - `vera`: avatar/hair/clothes all exported
  - `gail_daily_jacket`: avatar/hair/clothes all exported
  - `gail_work_1`: clothes-only export succeeded; avatar/hair skipped and export may be static
- documented the final pass in `cleanup-hub/PERSONA_ASSET_INGEST_REPORT_2026-04-20.md`

### Completed (Hair Style Decision Capture)

- recorded the operator decision that Gail's current hair look is the canonical shared default for Gail, Cherry, and Vera
- recorded the future direction that uploaded styles should become selectable and eventually switch by context such as time-of-day and weather
- documented the technical mismatch that the current `gail.blend` split still does not emit a separate staged hair asset, so runtime promotion will need an explicit mapping step

### Completed (Shared Hair Runtime Mapping)

- updated `playcanvas-app/config/work-lite-modules.gail.json` so `private_hair` and `girlfriend_hair` now resolve to Gail's active shared hair asset at `gail/hair/meili_hair/meili_hair.glb`
- kept persona-specific hair asset ids intact so persona filtering and wardrobe slot resolution still work without runtime code changes
- documented the runtime mapping and technical source of truth in `cleanup-hub/SHARED_HAIR_RUNTIME_MAPPING_2026-04-21.md`

### Verified (Live Shared Hair Runtime)

- started the repo stack with `tools/start-gail-stack.ps1 -ForceRestart`
- verified backend health live on `http://127.0.0.1:4180/health`
- verified live `/client/asset-manifest` resolution for `meili_hair`, `private_hair`, and `girlfriend_hair`
- verified all three hair ids resolve to `playcanvas-app/assets/gail/hair/meili_hair/meili_hair.glb` with `present: true`
- verified live `/client/wardrobe-presets` still keeps persona-specific hair slot ids in place
- recorded raw verification output in `docs/reports/shared-hair-verification-20260421-130124.json`
- recorded the human-readable verification summary in `cleanup-hub/SHARED_HAIR_VERIFICATION_2026-04-21.md`

### Completed (Work-Lite Persona Staging Audit)

- upgraded `tools/probe-worklite-persona.js` with:
  - `skipSwitch` support for startup-only probes
  - `urlSuffix` support for staging URLs
  - failed-request and response-error capture
- added an opt-in startup flag in `playcanvas-app/src/work-lite-rebuild.ts` so `/client/work-lite/?allowPersistedPersona=1` honors backend persona state for staging while the default route still enforces safe normal-mode startup
- identified and cleared orphaned `chrome-headless-shell` audit processes that were silently forcing backend persona state back to `normal`
- verified backend persona persistence stays stable after cleanup of those orphaned audit browsers
- verified direct-boot staging screenshots and reports for:
  - Cherry via `docs/reports/worklite-persona-private_girlfriend-20260421-110335.json`
  - Vera via `docs/reports/worklite-persona-private_counselor-20260421-110522.json`
- verified Cherry still stalls at `Loading Cherry dress...` with body visible but dress and hair missing
- verified Vera still stalls at `Loading Vera jeans...` with body/blazer visible but jeans and hair missing
- verified direct HTTP serving for `girlfriend_dress.glb`, `vera_jeans.glb`, and `meili_hair.glb`, narrowing the remaining blocker to the `work-lite` runtime load/bind/render path rather than raw backend file serving
- recorded the current staging findings and fix order in `cleanup-hub/WORKLITE_PERSONA_STAGING_AUDIT_2026-04-21.md`

### Completed (Gail Axis / Scale Root Fix)

- confirmed the Gail source armature in `D:\avatars\Gail\gail.blend` was exported from non-identity object space:
  - rotation `+90° X`
  - scale `0.01`
- confirmed the bad root transform had propagated into the active repo Gail body and wardrobe GLBs
- updated `tools/export_gail_split.py` so Gail exports normalize armature/skinned-mesh object transforms before GLB export
- updated `tools/export_persona_assets.py` with the same normalization rule so future persona exports do not silently reintroduce root-axis drift
- regenerated the active Gail runtime assets from `gail.blend`:
  - `gail_base_avatar.glb`
  - `gail_top.glb`
  - `gail_pants.glb`
  - `gail_sandals.glb`
  - `gail_bracelets.glb`
- added `tools/check-gltf-root-contract.js` to validate that exported GLB scene roots stay at identity translation/rotation/scale
- recorded the machine-readable validator pass in `docs/reports/gail-root-contract-20260421-1149.json`
- verified the fixed Gail body renders upright and at sane scale in `docs/reports/worklite-persona-normal-20260421-114312.png`
- recorded the root-cause analysis and fix contract in `cleanup-hub/AVATAR_AXIS_SCALE_FIX_2026-04-21.md`

### Completed (Cherry Runtime Refresh)

- added a Cherry-specific runtime exporter at `tools/export_cherry_runtime.py`
- added a repeatable Cherry live-promotion runner at `tools/run-cherry-runtime-refresh.ps1`
- exported Cherry from `D:\Avatars\Cherry\Cherry.blend` into the active runtime contract:
  - `cherry_base_avatar.glb`
  - `girlfriend_dress.glb`
  - `girlfriend_shoes.glb`
  - `cherry_hair.glb`
- backed up the previous live Cherry runtime files under `cleanup-hub/cherry-runtime-refresh-20260421-live2/before`
- verified all promoted Cherry GLBs pass the root-transform validator
- verified backend `/client/asset-manifest` reflects the new Cherry asset sizes and paths
- recorded the runtime export report and promotion manifest under `cleanup-hub/cherry-runtime-refresh-20260421-live2`
- captured the best stable live Cherry proof in:
  - `docs/reports/worklite-persona-private_girlfriend-20260421-131550.json`
  - `docs/reports/worklite-persona-private_girlfriend-20260421-131550.png`
- confirmed Cherry now uses the refreshed body/dress/shoes assets with correct scale and orientation
- confirmed Cherry still has two remaining runtime issues:
  - rest pose / T-pose instead of expected animation-driven pose
  - stretched shared-hair result in the best-working runtime path
- tested Cherry's own hair mapping and confirmed it currently causes a worse wardrobe-load stall, so the repo was left on the more usable shared-hair mapping for now
- documented the Cherry pass and current blocker boundary in `cleanup-hub/CHERRY_RUNTIME_REFRESH_2026-04-21.md`

### Completed (Gail Current Hair Refresh)

- confirmed the active `gail_lite` hair file was still an older archived fallback rather than the current Gail source export
- updated `tools/run-gail-lite-runtime-refresh.ps1` so the lite refresh path now defaults to the freshly exported Gail hair output instead of the archived fallback file
- regenerated `gail_lite` from the current source blend `D:\Avatars\Gail\gail.blend`
- recorded the medium-profile refresh artifacts under `cleanup-hub/gail-lite-runtime-refresh-20260422-current-hair`
- promoted a low-profile Gail lite refresh as the active repo runtime under `cleanup-hub/gail-lite-runtime-refresh-20260422-low-profile`
- verified backend `/client/asset-manifest?assetRoot=gail_lite` now resolves `meili_hair` to the freshly exported Gail lite file rather than the stale 2026-04-17 fallback
- captured fresh normal Gail proof runs in:
  - `docs/reports/worklite-persona-normal-20260422-093603.json`
  - `docs/reports/worklite-persona-normal-20260422-093603.png`
  - `docs/reports/worklite-persona-normal-20260422-094103.json`
  - `docs/reports/worklite-persona-normal-20260422-094103.png`
- narrowed the remaining Gail hair problem to runtime bind/attachment correctness:
  - Gail hair is now being requested and loaded from the current export
  - the detached skull-cap/hair chunk still renders by Gail's feet in the low-profile proof
- documented the source-of-truth correction and current runtime boundary in `cleanup-hub/GAIL_CURRENT_HAIR_REFRESH_2026-04-22.md`

### Completed (Gail Hair Floor Fix)

- traced the Gail hair floor bug through export structure, runtime skeleton binding, and live `work-lite` inspection instead of guessing
- confirmed Gail hair joint names and inverse bind matrices already matched the Gail body correctly
- confirmed `work-lite` was resolving Gail hair skin bones against the real body skeleton, so the remaining floor bug was not missing runtime bone resolution
- compared raw GLB vertex bounds and proved Gail hair mesh vertices were exported near origin / floor level while Vera and Cherry hair meshes were exported near head height
- updated `playcanvas-app/src/work-lite-rebuild.ts` so modular body/garment render roots are rebound to the resolved skeleton root before skin rebinding
- updated `tools/export_gail_split.py` with a Gail hair post-export correction pass that derives the head-space offset from the exported head inverse bind matrix and translates Gail hair `POSITION` accessors into the correct rest position
- regenerated both active Gail runtime roots from the corrected exporter:
  - `cleanup-hub/gail-lite-runtime-refresh-20260422-hair-floor-fix`
  - `cleanup-hub/gail-runtime-refresh-20260422-hair-floor-fix`
- verified both refresh reports record `exports.hair.glb_fix.applied = true`
- captured the best corrected live proof in:
  - `docs/reports/worklite-persona-normal-20260422-100946.json`
  - `docs/reports/worklite-persona-normal-20260422-100946.png`
- documented the root cause, exporter fix, and remaining polish boundary in `cleanup-hub/GAIL_HAIR_FLOOR_FIX_2026-04-22.md`

### Vera Runtime Refresh and Stale-Client Fix (2026-04-22)

- diagnosed that 	ools/export_vera_runtime.py and 	ools/run-vera-runtime-refresh.ps1 were missing from disk despite appearing in a prior session diff; created both from scratch
- ran 	ools/run-vera-runtime-refresh.ps1; promoted 6 Vera GLBs into playcanvas-app/assets/gail/counselor/ (all April-22 11:23); run artifact at cleanup-hub/vera-runtime-refresh-20260422-112223/
- updated playcanvas-app/index.html version strings to 20260422-vera-refresh
- diagnosed stale-client serving: server returned 20260420-cherry-dancebind2 despite on-disk edit; root cause was that the running backend (PID 23024, started 10:42 AM) resolves its repo root from C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy (OneDrive Desktop copy) rather than the VS Code workspace at D:\Gail 2.1\working_copy
- confirmed via canary file test (404 at D:\ path) and process parent-chain inspection (ackend-supervisor.ps1 -RepoRoot C:\Users\bate_\...)
- copied playcanvas-app/index.html (1397 bytes, 20260422-vera-refresh) to the OneDrive Desktop backend root; backed up prior as index.html.bak-20260422-predeploy
- copied playcanvas-app/dist/playcanvas-app/src/work-lite-rebuild.js (April 22 10:13, 175 KB) to the OneDrive Desktop backend root; backed up prior April-20 dist as work-lite-rebuild.js.bak-20260420
- verified server now returns =20260422-vera-refresh on /client/work-lite/
- documented two-working-copy architecture finding in cleanup-hub/DECISION_LOG.md as Decision 2026-04-22-05

### Completed (Gail Body Line Isolation)

- kept the transcript-backed `work-lite` baseline intact and continued from the live `gail_lite` path with Gail top, pants, and shoes restored and accessories still removed
- verified again from the live manifest that the active normal Gail load path is:
  - `base_avatar -> playcanvas-app/assets/gail_lite/avatar/base_face/gail_base_avatar.glb`
  - `meili_hair -> playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb`
  - `gail_outfit_top`, `gail_outfit_pants`, and `gail_outfit_sandals` present
- audited Gail body skinning directly and proved no Gail body vertices are weighted to `.001` duplicate bones
- compared Gail body mesh nodes against Vera and Cherry and narrowed the Gail-only body suspects to:
  - `Genesis 8 Female Eyelashes (2).Shape`
  - `VAMPLaurinaBrows.Shape`
- proved all active animation clips target Gail brow bones (`CenterBrow`, `lBrow*`, `rBrow*`), which matches the timing of the visual defect appearing only when animation starts
- applied one isolated runtime change in `playcanvas-app/src/work-lite-rebuild.ts`:
  - added `disableEntityRenderTree(...)`
  - disabled only `VAMPLaurinaBrows.Shape` in the loaded Gail body
- rebuilt the PlayCanvas app successfully with `tools/build-playcanvas-app.ps1`
- copied the updated source and built `work-lite-rebuild.js` into the live C working copy
- verified the served bundle now contains the `VAMPLaurinaBrows.Shape` isolate
- documented the proof and isolate in `cleanup-hub/GAIL_BODY_LINE_ISOLATION_2026-04-22.md`

### Completed (New Gail Source Import)

- located the new Gail source at `D:\Avatars\Gail\gail.blend` (April 23, 2026 00:46)
- removed the temporary Gail brow isolate from `playcanvas-app/src/work-lite-rebuild.ts` so the new avatar would load without the prior body-only runtime shim
- attempted an initial fresh Gail export and confirmed the new blend uses a different mesh naming contract than the older Gail exporter expected
- updated `tools/export_gail_split.py` to recognize the new Gail mesh names:
  - `Genesis 8 Female.Shape`
  - `Voss Hair Genesis 8 Female.Shape`
  - `MK Short T-shirt.Shape`
  - `Urban Action Pants.Shape`
  - `Angie Sneakers.Shape`
- reran both Gail export pipelines from the new source:
  - `cleanup-hub/gail-runtime-refresh-20260423-new-gail-v2`
  - `cleanup-hub/gail-lite-runtime-refresh-20260423-new-gail-v2`
- promoted the new full Gail runtime assets to `playcanvas-app/assets/gail/...`
- promoted the new medium-profile Gail lite runtime assets to `playcanvas-app/assets/gail_lite/...`
- rebuilt the PlayCanvas app successfully after removing the brow isolate
- updated `playcanvas-app/index.html` cache key to `20260423-new-gail1`
- synced the rebuilt bundle and both Gail asset roots from the D working copy to the live C working copy
- verified the live server now serves cache key `20260423-new-gail1`
- verified `/client/asset-manifest?assetRoot=gail_lite` now resolves the new Gail package sizes:
  - body `43918416`
  - hair `13952556`
  - top `8422736`
  - pants `7330360`
  - footwear `2011560`
- documented the full source refresh in `cleanup-hub/GAIL_NEW_SOURCE_IMPORT_2026-04-23.md`

### Completed (New Gail Hair Y Fix)

- confirmed the new Gail hair file was present in the live `gail_lite` manifest but was not visually appearing where expected
- inspected the corrected/new `gail_lite` hair GLB bounds and found the problem:
  - bad promoted hair Y range was approximately `3.07` to `3.45`
  - Gail head/face Y range is approximately `1.56` to `1.79`
- identified the root cause as the old Gail hair floor-fix being applied to the new Voss hair even though the new hair was already exported in head/body space
- updated `tools/export_gail_split.py` so `translate_gail_hair_vertices_to_head_space(...)` skips the lift when the hair's current vertex bounds already indicate head/body-space placement
- reran both Gail export paths:
  - `cleanup-hub/gail-runtime-refresh-20260423-hair-yfix`
  - `cleanup-hub/gail-lite-runtime-refresh-20260423-hair-yfix`
- verified both reports now show `glb_fix.applied = false` with current hair Y bounds `[1.4419605731964111, 1.8281116485595703]`
- synced the corrected `gail` and `gail_lite` assets to the live C working copy
- added `CLIENT_ASSET_VERSION_SALT = "20260423-gail-hair-yfix1"` to `playcanvas-app/src/work-lite-rebuild.ts` because the corrected hair GLB retained the same byte size as the bad lifted one
- updated `playcanvas-app/index.html` to cache key `20260423-gail-hair-yfix1`
- rebuilt the PlayCanvas app successfully and synced the rebuilt client bundle to live C
- verified the served index has cache key `20260423-gail-hair-yfix1`
- verified D and C `gail_lite` hair files match SHA256 `B83A726809109A52052935EB6DFA00F7AA1D77C6CADCFDB9ED30692369AD5823`
- documented the fix in `cleanup-hub/GAIL_NEW_HAIR_Y_FIX_2026-04-23.md`

### Completed (Hair Material Softcut)

- kept avatar assets, pose, animation binding, and export outputs unchanged
- tuned only the runtime `kind: "hair"` material path in `playcanvas-app/src/work-lite-rebuild.ts`
- raised hair `alphaTest` from `0.08` to `0.22` so low-alpha hair-card pixels do not read as a solid helmet
- lowered hair shine values:
  - `glossCap` from `0.04` to `0.012`
  - `shininessCap` from `14` to `6`
  - `specularityCap` from `0.03` to `0.012`
  - `specularColor` from `0.03` to `0.012`
- changed the client asset cache salt to `20260423-hair-softcut1`
- updated `playcanvas-app/index.html` to cache key `20260423-hair-softcut1`
- rebuilt the PlayCanvas app successfully and synced the updated source, index, and built JS to the live C working copy
- verified live `/client/work-lite/` serves `20260423-hair-softcut1`
- verified served JS contains the new hair material values
- documented the tuning pass in `cleanup-hub/HAIR_MATERIAL_SOFTCUT_2026-04-23.md`
- after operator confirmed hair still looked too solid, applied a second measured material-only pass:
  - `alphaTest` from `0.22` to `0.32`
  - `glossCap` from `0.012` to `0.006`
  - `shininessCap` from `6` to `3`
  - `specularityCap` from `0.012` to `0.006`
  - `specularColor` from `0.012` to `0.006`
- changed cache key and asset salt to `20260423-hair-softcut2`
- rebuilt and synced the updated bundle to the live C working copy
- verified live `/client/work-lite/` serves `20260423-hair-softcut2`
- verified served JS contains `material.alphaTest = 0.32`, `glossCap: 0.006`, and `shininessCap: 3`
- after operator reported `softcut2` made the top disappear while the sides still looked solid, reverted the two softcut passes:
  - `alphaTest` back to `0.08`
  - `glossCap` back to `0.04`
  - `shininessCap` back to `14`
  - `specularityCap` back to `0.03`
  - `specularColor` back to `0.03`
- tried a different material-only approach: `material.cull = pc.CULLFACE_BACK`
- changed cache key and asset salt to `20260423-hair-cull1`
- rebuilt and synced the updated bundle to the live C working copy
- verified live `/client/work-lite/` serves `20260423-hair-cull1`
- verified served JS contains `material.alphaTest = 0.08`, `glossCap: 0.04`, `shininessCap: 14`, and `material.cull = pc.CULLFACE_BACK`

### Completed (Avatar Runtime Single Source)

- created `data/client/avatar-runtime.json` as the single active avatar/runtime source of truth for:
  - runtime settings
  - available avatar systems
  - work-lite asset catalog
  - wardrobe presets
  - persona-to-avatar body mapping
- added `backend/services/avatar-runtime-config-service.ts`
- updated `ClientRuntimeSettingsService` to read/write runtime settings from `avatar-runtime.json`
- updated `ClientAssetsService` to read the asset catalog and persona map from `avatar-runtime.json`
- updated `WardrobePresetsService` to read/write wardrobe data from `avatar-runtime.json`
- added `personaMap` to the shared `WorkLiteAssetManifest` contract
- updated `playcanvas-app/src/work-lite-rebuild.ts` so persona body mapping comes from `/client/asset-manifest` with the old hardcoded map only as fallback
- updated Operator Studio shell copy/options so Avatar Library and Wardrobe point to the central config and include `gail_primary`
- added `data/client/README.md` documenting `avatar-runtime.json` as the active authority
- synced backend/shared/playcanvas/web-control/data changes to the live C working copy
- restarted the live backend from the C working copy
- verified live endpoints:
  - `/client/runtime-settings`
  - `/client/asset-manifest?assetRoot=gail_lite`
  - `/client/wardrobe-presets`
- verified PATCH writes through the central config for runtime settings and active wardrobe preset
- ran `tools/run-backend-tests.ps1`: passed `121/121`
  - `docs/reports/backend-test-report-20260423-084023.json`
  - `docs/reports/backend-test-report-20260423-084023.md`
- documented the consolidation in `cleanup-hub/AVATAR_RUNTIME_SINGLE_SOURCE_2026-04-23.md`

### Completed (Solid Fallback Checkpoint)

- operator confirmed the current client/avatar state looks good and should be locked as a fallback
- ran fresh verification:
  - `tools/build-backend.ps1`: passed
  - `tools/build-playcanvas-app.ps1`: passed
  - animation GLB validator: passed `11` files, `0` errors, `0` warnings
  - `tools/build-control-panel.ps1`: passed
  - `tools/run-backend-tests.ps1`: passed `121/121`
- generated backend test report:
  - `docs/reports/backend-test-report-20260423-084838.json`
  - `docs/reports/backend-test-report-20260423-084838.md`
- created external fallback copy:
  - `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`
- copy excluded `.git`, `node_modules`, and `*.pyc`
- robocopy completed with `0` failures and copied `31.446 GB`
- documented the fallback in `cleanup-hub/CHECKPOINT_SOLID_FALLBACK_2026-04-23.md`

### Completed (Generated Artifact Cleanup)

- removed old generated artifacts from both active working copies:
  - `D:\Gail 2.1\working_copy`
  - `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy`
- preserved the solid fallback checkpoint at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`
- removed old cleanup/import run folders, old reports/screenshots, old audit snapshots, Python bytecode caches, root temp probe files, and D-only Blender/runtime scratch files
- freed approximately `33.36 GB`
- added `tools/clean-generated-artifacts.ps1` with dry-run default for future cleanup passes
- updated `.gitignore` to keep generated bulk artifacts out of normal repo flow
- verified after cleanup:
  - backend build passed
  - PlayCanvas build passed
  - control panel build passed
  - animation validator passed `11` files with `0` errors
  - backend tests passed `121/121`
- fresh post-cleanup backend test report:
  - `docs/reports/backend-test-report-20260423-092242.json`
  - `docs/reports/backend-test-report-20260423-092242.md`

### Completed (Top-Level Drive Cleanup)

- inspected old top-level `D:\` folders and existing cleanup docs
- kept current active sources:
  - `D:\Avatars`
  - `D:\Gail 2.1\working_copy`
  - `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`
  - importer/guidelines/converted animation sidecars under `D:\Gail 2.1`
- deleted regenerable/non-useful clutter:
  - Gradle caches
  - DAZ Install Manager downloaded zip cache
  - temp folders
  - duplicate old engine zip backups
  - old build/report outputs inside archived reference roots
- moved old reference/project/asset roots into:
  - `D:\Gail 2.1\legacy-hold\20260423-top-level-review`
- deleted approximately `66.25 GB`
- moved approximately `3.50 GB` out of the way
- verified after cleanup:
  - backend build passed
  - PlayCanvas build passed
  - control panel build passed
  - animation validator passed `11` files with `0` errors
  - `/client/runtime-settings` responded with active avatar system `gail_primary`

### Completed (Animation Natural Timing Pass)

- tuned `work-lite` runtime animation timing without changing GLB assets or Blender exports
- changed normal skeletal playback speed to `0.86x`
- changed dance playback speed to `0.68x`
- lengthened idle/talk/listen/ack/dance crossfades
- added short state hold times to reduce twitchy state flipping
- softened idle pose blend and talk amount easing
- changed client cache key to `20260423-anim-natural1`
- built and synced PlayCanvas client to the live C mirror
- verified live `/client/work-lite/` serves `20260423-anim-natural1`
- verified served JS contains the new speed/hold tuning
- `tools/build-playcanvas-app.ps1` passed
- animation validator passed `11` files with `0` errors and `0` warnings

### Completed (Facial Micro Movement Pass)

- added randomized runtime facial micro motion to `work-lite`
- grouped tiny mouth open, lower lip, chin, jaw, smile, and squint movement
- paired left/right smile and squint with slight asymmetry
- replaced fixed idle mouth/smile/squint oscillation with random retarget/ease behavior
- dampened the micro layer during speech so visemes stay readable
- changed client cache key to `20260423-face-micro1`
- built and synced PlayCanvas client to the live C mirror
- verified live `/client/work-lite/` serves `20260423-face-micro1`
- verified served JS contains `updateFacialMicroMotion`
- `tools/build-playcanvas-app.ps1` passed
- animation validator passed `11` files with `0` errors and `0` warnings

### Completed (Body Alive Motion Pass)

- added randomized runtime body-alive motion to `work-lite`
- replaced simple sine breathing with randomized breath rate/depth/easing and occasional inhale holds
- shared breathing into chest/spine, shoulders, head, and arms
- added subtle weight-shift/settle motion through the torso
- added long-response browser-speech breath pause hooks that also trigger a body inhale
- changed client cache key to `20260423-body-alive1`
- built and synced PlayCanvas client to the live C mirror
- verified live `/client/work-lite/` serves `20260423-body-alive1`
- verified served JS contains `updateBodyAliveMotion` and `scheduleSpeechBreathPause`
- `tools/build-playcanvas-app.ps1` passed
- animation validator passed `11` files with `0` errors and `0` warnings

### Completed (Body Alive Fallback Checkpoint)

- operator confirmed the current animation/facial/body-alive feel is good and asked to lock it down
- ran fresh verification:
  - `tools/build-backend.ps1`: passed
  - `tools/build-playcanvas-app.ps1`: passed
  - animation GLB validator: passed `11` files, `0` errors, `0` warnings
  - `tools/build-control-panel.ps1`: passed
  - live `/client/work-lite/` served `20260423-body-alive1`
- created external fallback copy:
  - `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`
- copy excluded `.git`, `node_modules`, and `*.pyc`
- robocopy completed with `0` failures and copied `14.729 GB`
- documented the fallback in `cleanup-hub/CHECKPOINT_BODY_ALIVE_FALLBACK_2026-04-23.md`

### Completed (Voice Wake and Buffer Cleanup)

- added fuzzy wake-word matching to `work-lite` for common browser STT variants of Gail/Gale/Gael/Gal
- replaced generic voice thinking fillers with local question/command/statement classification and context-aware phrase banks
- reduced voice filler delay from `1400ms` to `650ms`
- added repeat protection for wake acknowledgements and thinking fillers
- changed client cache key to `20260423-voice-wake1`
- switched persisted local Ollama model and repo default from `qwen2.5:3b` to `dolphin-mistral:7b`
- explicitly set Cherry/private-girlfriend model to `dolphin-mistral:7b`
- built PlayCanvas client and backend successfully
- synced the updated client/config/source to the live C mirror
- verified live `/providers/local-llm-config` reports `dolphin-mistral:7b` as the effective model
- verified live `/client/work-lite/` serves `20260423-voice-wake1`

### Completed (Always-Listening Ambient Guard)

- added an always-listening ambient guard to `work-lite`
- ignores likely background transcripts before model submission:
  - empty transcripts
  - unsupported single-word noise
  - low-confidence short transcripts when browser confidence is available
  - repeated identical transcripts within `10` seconds
  - long statements not directed at Gail, not personal speech, and not command-like
- kept wake-word follow-up behavior unchanged
- changed client cache key to `20260423-voice-ambient1`
- confirmed true voice-locking is not available through browser `SpeechRecognition` alone
- PlayCanvas build passed

### Completed (Voice Self-Hearing Guard Tightening)

- added shared Gail-output guard helpers for all speech paths
- extended self-hearing protection from quick browser phrases to queued browser speech and OpenAI/audio playback
- follow-up listening now waits for `gailSpeechActive`, browser synthesis, and active work-lite speech queues to be idle
- preserved the `1200ms` post-speech cooldown before listening resumes
- changed client cache key to `20260423-voice-selfguard1`
- PlayCanvas build passed

### Completed (Voice Runtime Single Source + Shell Wiring)

- expanded persisted `voice-settings.json` with a `runtime` block for live voice behavior tuning
- extended shared voice contracts, backend validation, and voice service normalization to carry the runtime config through `GET/PATCH /voice/settings`
- rewired `work-lite` to read wake aliases, filler phrase banks, cooldowns, submit timings, and ambient thresholds from `/voice/settings.runtime`
- added dynamic runtime controls to `Providers & Voice` in the operator shell and saved them through the existing `voice_save` action
- removed stale shell default model text that still referenced `qwen2.5:3b`
- restarted the stack from the D working copy so live backend behavior matches the updated runtime contract
- verified runtime patch persistence by changing and restoring `runtime.timing.ambientRepeatWindowMs`
- changed client cache key to `20260423-voice-config1`
- backend build passed
- PlayCanvas build passed
- web control panel build passed

### Completed (Providers & Voice Shell Layout Cleanup)

- regrouped the `Providers & Voice` settings form into section cards:
  - `Provider & Model`
  - `Persona Routing`
  - `Prompts & Canon`
  - `Voice Basics`
  - `Wake & Timing`
  - `Ambient Guard`
  - `Phrase Banks`
- kept all `setting-*` DOM ids unchanged so the existing save/load wiring still targets the same backend fields
- added responsive two-column section grids with full-width textareas for longer prompt/phrase editing
- verified live panel JS serves `renderProvidersVoiceSettings`
- verified live panel CSS serves `settings-form--sectioned` and `settings-section-grid`
- web control panel build passed

### Completed (Brutalist Loft Runtime Integration Trial)

- copied the optimized loft runtime asset into `playcanvas-app/assets/environments/brutalist_loft/brutalist_loft_optimized_2k.glb`
- added `playcanvas-app/assets/environments/environment-profiles.json` with measured bounds exclusions for `Object_40` / `Skybox_17`
- switched laptop staging scene selection to `brutalist_loft` in `data/client/device-display-profiles.json`
- updated `work-lite` to:
  - fetch environment profiles from static client assets
  - resolve the selected scene id from device display profiles
  - load the brutalist loft before avatar staging
  - center and floor the room from filtered render bounds only
  - hide the generated plane floor when the environment loads cleanly
- confirmed the live entry page now references cache key `20260423-env-loft1`
- confirmed live `/client-assets/environments/environment-profiles.json` serves the brutalist loft profile
- confirmed live `/client-assets/environments/brutalist_loft/brutalist_loft_optimized_2k.glb` serves at `16625036` bytes
- confirmed live `/client/work-lite-rebuild.js` contains `measureFilteredRenderBounds`, `selectedSceneId`, and `brutalist_loft`
- added live browser-side environment tuning controls to `work-lite` for per-scene offset / rotation / scale adjustment with local browser persistence and copy-out support
- confirmed live `/client/work-lite-rebuild.js` contains `environment-tuning-panel`, `Copy Values`, and `gail.worklite.environmentTuning`
- PlayCanvas build passed

### Completed (Modern Country Home Filtered Conversion + Runtime Swap)

- patched `tools/export_environment_from_blend.py` to support:
  - `--root-object`
  - `--exclude-root-object`
  - filtered scene report output
  - `use_selection=True` for Blender 4.2 GLB export
- ran Blender 4.2 in `--factory-startup` mode against `D:\Gail 2.1\env.blend`
- exported a filtered candidate by keeping only `Modern Country Home.Node`
- removed unrelated roots from the runtime export:
  - both motorcycles
  - `MCH Island`
  - `MCH High Chair`
  - `ML_*` bedroom / bathroom furniture set
- produced:
  - `data/environment/candidates/modern_country_home/modern_country_home_optimized_2k.glb`
  - `data/environment/candidates/modern_country_home/modern_country_home_optimized_2k.blend`
  - `data/environment/candidates/modern_country_home/modern_country_home_optimized_2k.report.json`
- verified cleaned GLB structure:
  - one root node: `Modern Country Home.Node`
  - `34` meshes
  - `91` materials
  - `69` textures
  - `39` images
  - `0` animations
- copied the cleaned GLB into `playcanvas-app/assets/environments/modern_country_home/`
- added the runtime environment profile and switched laptop `sceneId` to `modern_country_home`
- PlayCanvas build passed
- verified live routes on `http://127.0.0.1:4180`:
  - `/client-assets/environments/environment-profiles.json`
  - `/client/device-display-profiles`
  - `/client-assets/environments/modern_country_home/modern_country_home_optimized_2k.glb`

### Completed (Modern Country Home Avatar Stage Fix)

- traced the bad staging to two runtime issues in `work-lite`:
  - device-profile `staging.avatarTransform` existed in the contract but was never applied
  - avatar tune controls were writing raw local transforms instead of offsets relative to a stable base
- added avatar base position / rotation / scale handling to the stage runtime
- wired `applyDeviceDisplayProfileState(...)` to read:
  - `staging.avatarTransform.position`
  - `staging.avatarTransform.rotation`
  - `staging.avatarTransform.scale`
- changed `applyAvatarTuning(...)` to:
  - add offsets to avatar base position
  - add rotations to avatar base rotation
  - multiply tuning scale against avatar base scale
- added `avatarStandEntityNames` to environment profiles and set `modern_country_home` to anchor on `MCH Floor`
- bumped `playcanvas-app/index.html` cache tag from `20260423-env-loft1` to `20260423-env-stagefix1`
- PlayCanvas build passed

### Completed (Stage Tune Input Stability Fix)

- removed forced `syncEnvironmentTuningPanel()` re-renders from live environment / avatar / camera apply paths
- this prevents numeric fields from destroying and recreating themselves during typing
- bumped `playcanvas-app/index.html` cache tag from `20260423-env-stagefix1` to `20260423-env-stagefix2`
- PlayCanvas build passed

### Completed (Directional Stage Controls Rewrite)

- replaced axis-labeled stage controls with directional rows:
  - move: `Left / Right`, `Down / Up`, `Out / In`
  - rotate: `Tilt Down / Tilt Up`, `Turn Left / Turn Right`, `Roll Left / Roll Right`
  - size: `Narrower / Wider`, `Shorter / Taller`, `Shallower / Deeper`
- added `data-stage-nudge` button handling so stage controls can be adjusted reliably by clicking instead of typing only
- retained direct numeric entry in the center field for exact values
- bumped `playcanvas-app/index.html` cache tag from `20260423-env-stagefix2` to `20260423-env-controls2`
- PlayCanvas build passed

### Completed (Viewport Gizmo Staging Mode)

- removed the sidebar-first staging workflow as the primary adjustment tool
- added `viewport-gizmo-overlay` directly inside the stage shell
- added viewport toolbar controls for:
  - target: `Avatar`, `Environment`, `Camera`
  - mode: `Move`, `Rotate`/`Aim`, `Scale`
  - step: `Fine`, `Medium`, `Coarse`
- added object-attached on-canvas controls with directional buttons around the selected target
- added press-and-hold repeating nudge behavior for viewport handle buttons
- simplified the side `Stage Tune` panel to a status/help block with `Reset Selected` and `Copy Values`
- bumped `playcanvas-app/index.html` cache tag from `20260423-env-controls3` to `20260423-env-gizmo1`
- PlayCanvas build passed

### Completed (Persistent Environment Move Dock)

- added a fixed bottom-left viewport control dock that always drives the selected target
- this removes the dependency on the environment anchor/gizmo being visible on screen before movement can happen
- kept the attached anchor gizmo for local object context, but movement is now always available from the dock
- bumped `playcanvas-app/index.html` cache tag from `20260423-env-gizmo1` to `20260423-env-gizmo2`
- PlayCanvas build passed

### Completed (Modern Country Home Restage Correction)

- verified from `D:\Gail 2.1\env.blend` that `Modern Country Home.Node` carries the original Daz handoff transform: `+90 X` and `0.01` scale
- rejected the earlier post-export GLB root-bake path after proving it produced incorrect oversized bounds
- updated `tools/export_environment_from_blend.py` with `--normalize-root-transform` so the source root transform is normalized in Blender before export
- re-exported `modern_country_home_optimized_2k.glb` from `env.blend` with root filtering and normalized-root export enabled
- confirmed the corrected exported room still imports at:
  - min `[-8.0991, -6.4709, -0.0779]`
  - max `[8.0991, 6.4709, 6.1714]`
- versioned `modern_country_home` staging storage to `root-contract-1` so old browser-saved tune offsets are ignored
- bumped `playcanvas-app/index.html` cache tag from `20260423-env-gizmo2` to `20260423-env-restage1`
- PlayCanvas build passed

### Completed (Interior Lighting Lift)

- raised stage ambient from flat `0.2` to `0.3 / 0.3 / 0.32`
- increased base key/fill intensity for the room pass
- added `zip-interior-light`, a warm point light that turns on only when an environment is loaded and scales its height/range from measured room bounds
- bumped `playcanvas-app/index.html` cache tag from `20260423-env-restage1` to `20260424-env-light1`
- PlayCanvas build passed

### Completed (Clock-Driven Day/Night Environment Lighting)

- preserved the current interior-biased lighting setup as the night preset
- added `zip-day-sun-light` and `zip-day-sky-light` as exterior daylight sources for daytime
- wired lighting mode to the local machine clock:
  - day: `07:00` through `18:59`
  - night: `19:00` through `06:59`
- added a 60-second lighting sync timer so the scene follows the clock without reload when the hour changes
- bumped `playcanvas-app/index.html` cache tag from `20260424-env-light1` to `20260424-env-daynight1`
- PlayCanvas build passed

### Completed (Day Backdrop Correction)

- fixed the daytime regression where the scene background stayed effectively black
- day mode now switches the camera clear color to a sky tone
- day mode also keeps environment interior fill active so the room does not collapse into silhouette
- bumped `playcanvas-app/index.html` cache tag from `20260424-env-daynight1` to `20260424-env-daynight2`
- PlayCanvas build passed

### Completed (Exterior Day Flood Rig)

- added `zip-day-flood-light` and `zip-day-fill-flood-light` as daylight spotlights placed outside the environment bounds and aimed back into the room
- tied flood-light placement to measured room width/height/depth so the daylight rig is derived from the environment size instead of hardcoded stage guesses
- re-run flood-light placement whenever environment tuning is applied so the exterior rig stays aligned with the room
- bumped `playcanvas-app/index.html` cache tag from `20260424-env-daynight2` to `20260424-env-dayflood1`
- PlayCanvas build passed

### Completed (Exterior Day Flood Rig Strengthening)

- replaced the first spotlight-style flood pass with a stronger three-point exterior point-light rig
- added:
  - `zip-day-flood-light`
  - `zip-day-fill-flood-light`
  - `zip-day-roof-flood-light`
- raised daylight flood intensities and widened their effective ranges so the room is visibly filled from outside
- bumped `playcanvas-app/index.html` cache tag from `20260424-env-dayflood1` to `20260424-env-dayflood2`
- PlayCanvas build passed

### Completed (Window Transparency Asset Fix)

- inspected the source environment materials and confirmed the room glass was effectively opaque:
  - `DoorAnd_window_glass*` had `Alpha = 0.995`
- updated `tools/export_environment_from_blend.py` with glass-material tuning support
- re-exported `modern_country_home` with:
  - `DoorAnd_window_glass*`
  - `alpha = 0.12`
  - `transmission = 1`
  - `metallic = 0`
  - low roughness
  - `shadow_method = NONE`
- verified the shipped runtime GLB now contains those glass values
- bumped `CLIENT_ASSET_VERSION_SALT` and `playcanvas-app/index.html` cache tag to `20260424-env-window1`
- PlayCanvas build passed

### Completed (Day Backdrop And Exterior Sun Pass)

- copied the supplied backdrop image into the repo at `playcanvas-app/assets/environments/backdrops/mountain_lake_day_96518.jpg`
- added `dayBackdropImagePath` support to `work-lite` environment profiles
- updated `modern_country_home` to use the new day backdrop image
- retuned daytime lighting:
  - white daylight directional source mirrored to the avatar-right side
  - stronger primary exterior flood on the right
  - softer fill flood on the left
  - lower ambient wash
- added a large unlit exterior backdrop plane so the windows render into an actual scene image instead of stage clear-color
- bumped `CLIENT_ASSET_VERSION_SALT` and `playcanvas-app/index.html` cache tag to `20260424-env-backdrop1`
- PlayCanvas build passed

### Completed (Daylight Reassessment And Glass Pass)

- reassessed the room lighting and backdrop setup against PlayCanvas docs for:
  - light component types / directional-vs-local lighting
  - linear workflow texture handling for color textures
- changed backdrop texture loading to use PlayCanvas `texture` assets with sRGB encoding
- added a daytime interior bounce light and raised day-only interior support levels
- added a second day backdrop plane for the right-side window wall while keeping the camera-opposite exterior plane
- added runtime environment glass tuning for materials containing `glass`:
  - `blendType = normal`
  - `opacity = 0.04`
  - backface culling disabled
  - depth write disabled when supported
- bumped `CLIENT_ASSET_VERSION_SALT` and `playcanvas-app/index.html` cache tag to `20260424-env-backdrop3`
- PlayCanvas build passed
- generated verification captures at:
  - `docs/reports/worklite-env-daylight-check-2.png`
  - `docs/reports/worklite-env-daylight-check-3.png`
  - `docs/reports/worklite-env-daylight-check-4.png`

### Completed (Wraparound Backdrop Shell Cleanup)

- removed the day backdrop plane layout that was causing upside-down / one-window-only exterior views
- replaced it with a single wraparound `sphere` backdrop shell using the same repo-owned image asset
- rebalanced day lighting downward so the room keeps interior support without the prior blowout
- bumped `CLIENT_ASSET_VERSION_SALT` and `playcanvas-app/index.html` cache tag to `20260424-env-backdrop4`
- PlayCanvas build passed

### Completed (Ceiling Flood And Warm Night Backdrop Grading)

- copied operator-selected realistic mountain/lake backdrop into runtime assets at:
  - `playcanvas-app/assets/environments/backdrops/mountain_lake_realistic_primary.jpg`
- updated `modern_country_home.dayBackdropImagePath` to the new repo-owned backdrop asset path
- added `zip-ceiling-flood-light` as a dedicated interior top-down point light derived from measured room bounds
- tuned ceiling flood behavior per mode:
  - day uses a soft neutral ceiling flood (`CEILING_FLOOD_LIGHT_DAY_INTENSITY = 1.35`)
  - night uses a slightly warmer/stronger flood (`CEILING_FLOOD_LIGHT_NIGHT_INTENSITY = 1.55`)
- retuned night interior warmth by shifting night ambient and interior light color toward a warm cozy balance
- changed backdrop mode behavior so the same wraparound shell stays active at night and applies grading instead of being disabled:
  - day backdrop emissive stays neutral (`1.0,1.0,1.0`, intensity `0.92`)
  - night backdrop emissive uses warm grading (`0.78,0.68,0.56`, intensity `0.4`)
- bumped `CLIENT_ASSET_VERSION_SALT` and `playcanvas-app/index.html` cache tag to `20260424-env-backdrop5`
- PlayCanvas build passed (`npm run build`, exit code `0`)
- verified runtime boot at `http://127.0.0.1:4180/client/work-lite/` reaches `Scene ready` after patch
