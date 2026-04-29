# Project State

## Date

2026-04-28

## Current Status Snapshot

- active repo root is `D:\Gail 2.1\working_copy`
- standalone `/gail-mobile/` iPhone audio is locked after user confirmation:
  - outbound TTS uses `/voice/speak` cloud MP3 with `openai-gpt-4o-mini-tts`, voice `nova`, and a fresh `Audio` element per reply
  - no silent audio arming or browser/system TTS fallback in the mobile client
  - iPhone hardware volume path is protected by removing live mic capture during playback
  - mobile mic tracks are stopped/removed during MP3 playback, then audio-only mic access is reacquired after speech cooldown
  - incoming mobile voice uses `MediaRecorder` + VAD + `/voice/transcribe` on iPhone/WebKit
  - mobile transcription records an audio-only stream and uploads iPhone `audio/mp4` clips as `.m4a`
  - repeatable mobile audio verification and shell-settings backlog are documented in `docs/MOBILE_AUDIO_REPLICATION_RUNBOOK_2026-04-28.md`
- current locked `work-lite` checkpoint is `env-backdrop33-lockdown`
- active `work-lite` cache/version salt is `20260424-env-backdrop33`
- night-mode Light Level slider is now live (no fixed 10% lock)
- per-persona placement now persists avatar rotation in addition to avatar and camera placement
- lockdown backup captured at `playcanvas-app/backups/20260424-env-backdrop33-lockdown/`
- `modern_country_home` day/night environment pass is now in `env-backdrop5` state with:
  - realistic mountain/lake wraparound shell backdrop from repo-owned asset
  - dedicated interior ceiling-down flood light tuned for soft day and warm night behavior
  - same selected backdrop image retained in night mode with warm grading instead of disabling the shell
- `cleanup-hub/` is now the control center for source-of-truth, cleanup, governance, runtime audit, and documentation rules
- backend, control panel, and PlayCanvas app currently build from the active repo
- backend regression currently passes `121/121`
- the local stack, animation importer, and animation viewer all launch from the active repo workflow
- `work-lite` preview verification confirms patched runtime reaches `Scene ready` at `http://127.0.0.1:4180/client/work-lite/` after the latest lighting/backdrop tuning pass
- local Playwright audit/probe tooling now defaults to hardware GPU rendering instead of SwiftShader, with explicit software fallback only when requested
- the live Edge browser path is now explicitly pinned to high-performance GPU mode and verified to resolve WebGL through the RTX 4050
- a live Edge RTX-backed `work-lite` run now reaches `Scene ready` on `gail_lite` in about `10 seconds`
- Vera runtime assets refreshed from `D:\Avatars\Vera\vera.blend` and promoted into `playcanvas-app/assets/gail/counselor/` — replaces April-14 ingest batch; `tools/export_vera_runtime.py` and `tools/run-vera-runtime-refresh.ps1` now exist on disk; run artifact at `cleanup-hub/vera-runtime-refresh-20260422-112223/`
- Vera and Cherry now use their own hair assets again and both have isolated live Edge proof reaching `Scene ready`
- Gail's live runtime split has now been refreshed from `D:\Avatars\Gail\gail.blend` and promoted into `playcanvas-app/assets/gail/...`
- a lighter Gail work-lite root now exists at `playcanvas-app/assets/gail_lite/...` and is the default effective Gail root for `work-lite`
- the repo now has a documented and verified texture-tier policy of `512 / 2048 / 4096` for low, medium, and high package exports
- the Gail package export path now emits real low/medium/high textures at those exact pixel dimensions
- the Gail hair visibility failure now has a confirmed client-side cause and patch: the strand texture was being cut out by an overly high hair alpha-test threshold in `work-lite`
- the lighter Gail root is materially smaller than the main Gail runtime path:
  - body `238.44 MB` -> `163.06 MB`
  - hair `83.93 MB` -> `25.11 MB`
- runtime/UI evidence is now captured in `cleanup-hub/runtime-audit-20260420-141419/`
- the best current runtime state is: core routes working, `work-lite` and `display` loading avatar scenes, importer reachable, viewer reachable with a remaining `404` resource issue
- the biggest current blockers are:
  - Gail still presents in a rest pose instead of a natural idle pose in the live RTX-backed client
  - Gail hair/skull-cap placement is still visibly wrong in the live RTX-backed client
  - Gail normal hair remains separate from the now-correct Vera/Cherry persona hair routing
  - a residual `404` resource error still appears in the live Edge run
  - verification drift from stale `D:\Gail` path assumptions
  - mobile overflow in `work-lite` and `display`
  - mobile overflow on several Operator Studio shell pages
  - export/report shell actions timing out on `POST /exports/run`
- when older docs conflict with `cleanup-hub` on paths or active roots, `cleanup-hub` is authoritative
- when older audit artifacts were captured before 2026-04-22, check whether they were created under SwiftShader before using them as GPU/performance evidence
- when judging live browser graphics behavior, use `cleanup-hub/LIVE_BROWSER_GPU_VERIFICATION_2026-04-22.md` as the current browser-level baseline

## Note

The rest of this document is accumulated project-state history and still contains older phase details. Use `cleanup-hub/RUNTIME_UI_AUDIT_2026-04-20.md` and `cleanup-hub/PATH_DRIFT_REPORT_2026-04-20.md` when you need the current active-root and runtime baseline.

## Current Direction

The authoritative direction is now:

- web-first
- local-first
- PlayCanvas for avatar/presence rendering
- shared TypeScript contracts
- backend scaffold aligned to local SQLite plus cloud Postgres sync
- WebAuthn/passkeys as the browser-grade auth base for sensitive flows

## Phase

Phase 2 started.

## Included In This Pass

- repo structure aligned to the new spec
- shared contracts and enums
- backend service, broker, provider, sync placeholders
- control panel skeleton
- PlayCanvas manager skeleton
- baseline docs for modes, memory, devices, broker rules, and upgrade path
- in-memory domain repositories and CRUD-style core services for projects, notes, lists, tasks, reminders, parts, and cart
- built-in Node HTTP server for create/list/update domain endpoints
- SQLite-backed domain repositories using a local database file
- HTTP request validation and Private Mode write enforcement
- explicit private note saves routed to a separate private SQLite database
- RAM-only private session endpoint for unsaved private notes
- current device-aware route permissions with watch restrictions
- first approval workflow for sensitive cart approval transitions
- device registration and trust state now enforced for approval-sensitive flows
- web control panel replaced with a real static operator test client for live backend flows
- SSD migration helper script and migration notes added for move to `F:\Gail`
- living operator manual added for ongoing use/testing guidance
- automated test-script-first workflow added to project next steps for future phase work
- dashboard overview aggregation route and panel section added for lightweight status testing
- automated suite expanded again and currently passes with overview coverage included
- operator panel now covers project, list, reminder, and part create/update testing
- PATCH routes now normalize partial updates correctly before persistence
- sensitive-action unlock windows now gate approval-sensitive actions beyond simple trust state
- operator panel now includes device unlock/lock controls for sensitive-action testing
- approval flows now model rejection and expiry as first-class states with enforced commit blocking
- local automation now includes backend start/ready/stop helper scripts
- private-note isolation is now covered in the regression suite
- trust revocation now clears sensitive-action access immediately
- device mismatch and stale-unlock edge cases are now covered in the regression suite
- Private Mode now explicitly blocks approval-sensitive automation paths
- Private Mode dashboard reads are now isolated from normal organizer data
- service-device restrictions now include private-session route blocking in the regression suite
- conversation sessions now exist as a runnable backend surface with mode-aware provider selection
- conversation sessions now persist across backend restarts
- Private Mode conversation sessions are now RAM-only and device-bound
- same-mode normal conversation handoff is now covered across devices
- OpenAI conversation integration now uses the Responses API path when `OPENAI_API_KEY` is configured
- normal-mode conversation replies now fall back to the local provider if the OpenAI path is unavailable
- a shared persistent memory file now exists for non-private memory entries
- conversation replies now receive recent shared-memory context in normal modes
- automated coverage now includes shared-memory persistence and OpenAI fallback behavior
- operator panel now includes shared-memory and conversation-session controls
- a served work-lite PlayCanvas client shell now exists at `/client/work-lite/`
- work-lite client mode and quality switching are now live for placeholder avatar testing
- provider status is now surfaced through the backend and operator panel
- hardwired command listing and deterministic execution are now exposed through the backend and operator panel
- shared-memory search is now supported
- shared-memory entries can now be updated and deleted through the backend and operator panel
- the work-lite client now consumes a backend asset manifest for avatar-readiness checks
- the work-lite client asset manifest now reports missing assets and required directories
- provider status now includes live telemetry such as attempts, successes, failures, and fallbacks
- voice settings are now persisted through the backend
- operator panel now supports push-to-talk or wake-word browser voice control
- silence timeout before response is adjustable and persisted
- wake-word mode is wired to resume listening after responses
- camera access matrix is now surfaced by device type and the operator panel can request local browser camera preview
- OpenAI TTS is now wired as an optional primary TTS engine
- browser/on-device speech synthesis remains the offline-safe fallback TTS path
- voice engine selection and OpenAI/browser voice selection are now part of persisted voice settings
- the client asset manifest now autodetects nested dropped assets and ignores zero-byte exports
- dropped work-lite asset files are now directly served from `/client-assets/...`
- the work-lite client now uses real dropped background images when present and surfaces resolved avatar/animation asset metadata
- the modular Gail work-lite bundle is now recognized as: base body, hair, work vest, work pants, work boots, bracelets, and idle
- avatar readiness is now based on the required modular bundle instead of background placeholder presence
- backend host binding is now configurable and defaults to `0.0.0.0` for LAN reachability
- prototype-safe pairing/auth scaffolding now exists with LAN-only pairing sessions, issued device credentials, and optional authenticated device identity resolution
- auth mode is now configurable as open, paired, or paired_required_for_sensitive while defaulting to open for ongoing prototype work
- operator panel now supports auth status checks, pairing-session creation, pairing completion, token storage, and applying paired device identity into the live request context
- backend now exposes access-status reporting with detected local and LAN surfaces for easier multi-device setup
- the repo now includes dedicated Tailscale-oriented remote-access helpers and operational docs
- startup is now managed through a stack manifest with a single-command stack launcher and stop script
- runtime scripts now prefer drive-local Node under `runtime/nodejs` for better portability across PCs
- backend runtime is now supervised so the hidden watchdog restarts the Node child if it exits unexpectedly
- regression coverage now validates auth status, pairing session creation, pairing completion, and a token-backed request path
- the first `paired_required_for_sensitive` enforcement layer now exists for provider config changes, device trust/registration changes, approvals, and cart-approval actions
- the work-lite client now restores the last normal-mode conversation session per mode across reloads instead of always starting cold
- the work-lite client now exposes recent-session switching and explicit shared-memory capture for the latest exchange
- the operator panel now supports document import into shared memory or project-linked notes, with archived originals and first-pass PDF/text ingestion
- PDF imports now use a real extractor path through Python/PyMuPDF with pypdf fallback instead of only heuristic string scraping
- the `playcanvas_handoff_20260330` avatar package is now integrated as a first-class work-lite asset bundle
- the backend asset manifest now supports bundle-style integration manifests in addition to the legacy catalog
- the work-lite client now defaults to the handoff bundle for fresh boots while still honoring persisted asset-root selections
- the handoff bundle currently provides modular body/hair/clothing/accessories plus starter `idle`, `listen`, `ack`, and gesture clips, with `talk` still falling back to `idle`
- the backend now exposes a persistent client runtime setting for `handoff_20260330` versus `legacy_fallback`
- the operator panel now includes an avatar-system toggle so the active work-lite runtime can be swapped without editing client state by hand
- Unity runtime project and old backup directories were removed from the active repo path to reduce drift, reduce clutter, and keep build focus on the PlayCanvas/web shell stack
- Operator Studio shell builder pages are now live-wired for avatar/runtime mapping, animation library diagnostics, action graph command execution, and gesture expression profile application
- Blender avatar export now supports runtime-aware `high`, `medium`, and `low` profiles across the add-on, headless export script, and PowerShell entrypoints
- the backend now exposes export status and export-run routes so the shell can trigger avatar export and full pipeline runs directly
- Operator Studio shell animation and runtime pages now surface export status, run export actions, and summarize the latest export reports inside the working canvas
- Operator Studio shell now includes per-page help, quick-start instructions, plain-English glossary content, and an optional guided mode that gates later actions until earlier required steps complete successfully
- Operator Studio shell now includes a dedicated page-specific next-pass notes panel with statuses plus a cross-page `Pass Review` surface so each page can carry its own saved follow-up items while still supporting whole-shell next-pass review
- the repo now includes workspace-wide agent instructions plus a reusable `/project-log-sync` prompt so future agents keep build/state/change documentation in sync as part of normal completion
- the repo now includes a product strategy and commercial readiness checklist so active planning is anchored to a marketable pilot posture instead of an open-ended prototype posture
- the README and shell planning docs now frame Gail as a controlled pre-release operator product, with marketable pilot readiness gated by reliability, deployment, and demo quality rather than feature sprawl

## Preserved Existing Work

The following areas remain in the repo as prior exploration and should not be treated as the active architecture:

- `backend/app`
- `scripts`
- `blender_scripts`

## Immediate Next Review Gate

Review the Phase 2 domain core, then choose the next layer:

- operator panel conversation and memory depth
- provider/session edge behavior beyond basic fallback
- request validation and auth gates
- stronger phoneme-aligned viseme timing and higher-fidelity facial export assets for the work-lite client
- conversation history inspection and memory search depth in the operator panel
- deeper work-lite client memory flows beyond explicit save-and-restore
- OCR for image-only/scanned PDFs and more structured bulk-import rules beyond the current importer
- voice defaults are now shared across clients through persisted voice settings: wake-word mode, OpenAI GPT-4o mini TTS primary, browser speech synthesis fallback, shimmer voice, and a soft feminine light-UK-accent instruction profile
- OpenAI config status surface is now live with stored-key persistence and clear controls
- OpenAI config wired into the OpenAI provider and voice service for consistent env-or-stored key resolution
- the host now has a stored OpenAI provider key at `data/providers/openai-config.json`, so the preferred `openai-gpt-4o-mini-tts` voice path is operational instead of falling straight to browser fallback
- live verification now confirms OpenAI TTS engine availability, successful preferred-engine warmup, and successful non-fallback speech synthesis through `/voice/speak`
- the work-lite client can now route typed input as either normal conversation or workflow control from the same panel, instead of forcing all free text through the conversation path
- browser speech recognition is now wired in the work-lite client so supported browsers can capture spoken input and route the transcript through the same workflow-control resolver used by typed control
- free-text control requests now resolve through `POST /control/intents`: matched phrases still execute deterministic hardwired commands, while broader requests create planned workflows that remain review-first before execution
- backend regression suite restored to a clean passing state with corrected voice defaults and OpenAI config lifecycle coverage
- the backend now exposes persisted local-LLM configuration through `GET/PATCH /providers/local-llm-config`
- private mode now supports two configured local agents, `private_counselor` and `private_girlfriend`, instead of a single generic local private prompt
- Operator Studio shell and the legacy operator panel now both expose local-model settings plus active/default private persona controls
- the live work-lite preview client now loads manifest-driven `idle`, `talk`, and `listen` clips onto the active avatar instead of rendering only a static preview mesh
- the work-lite preview client now discovers facial speech morphs, eye morphs, and eyelid rig nodes from the active avatar GLB and drives fallback viseme/blink motion during assistant replies
- the work-lite shell-state preview now reports avatar motion readiness alongside runtime, voice, provider, and device state
- the work-lite preview now uses actual preview speech playback timing through `/voice/speak` audio with browser voice fallback instead of estimating speech duration from reply text length
- the active `gail` asset root now exposes a live `ack` clip at `playcanvas-app/assets/animations/ack_nod_small_v1.glb`, so the preview runtime now has `idle`, `talk`, `listen`, and `ack`
- the work-lite client now has a full browser `SpeechRecognition` loop for wake-word detection, silence-timeout submission, and conversation routing, matching the capability of the web control panel and main PlayCanvas client
- the work-lite voice loop pauses the mic while Gail speaks and auto-resumes after response, syncing with backend voice settings every 3 seconds
- the work-lite client now shows runtime voice state through `#voice-loop-restart`, `#voice-runtime-note`, and a `Voice input` row in the shell-state panel
- a manager agent system now exists so the main avatar AI can inspect system health, browse project files, issue build directives to worker agents, and manage all settings through one unified command surface
- system status aggregation now rolls provider, voice, and build-control health into a single `GET /system/status` snapshot with an in-memory error log exposed at `GET /system/errors`
- a sandboxed file browser service now supports directory listing and text file reading locked to the `D:\Gail` project root with path-traversal protection
- a manager-alpha agent with two builders (builder-a for AI tasks, builder-b for Codex tasks) now manages directive lifecycles from pending through assigned, running, done, failed, or cancelled states
- 13 new HTTP routes expose system status, error history, file browsing, manager reports, builder status, directive CRUD, and an avatar-request bridge
- avatar-to-manager keyword routing now intercepts build/deploy/create/fix and similar spoken or typed requests and routes them as manager directives before falling back to raw workflow creation
- the Operator Studio shell now includes `System Status` and `Manager Agent` pages in the Operations group with full action handlers, display builders, auto-fetch hooks, and per-page help
- manager keyword routing uses `dispatch|deploy|create|fix|run script|execute|compile|export|generate|pipeline|ship it|assign task|set up|update the` — the original `build` and `make it` keywords were replaced with `dispatch` and `assign task` to avoid collisions with existing build-control terminology
- the manager agent system has been verified end-to-end: a directive created via avatar request successfully progressed through workflow planning (6 auto-generated steps), AI-driven step execution, and completion tracking, producing a real calculator program as output with 15/15 tests passing
- the integration test suite at `tools/test-manager-agent-integration.js` covers 212 assertions across 11 test categories: system status, file system, manager status, directive lifecycle, avatar bridge, control-intent routing, report integrity, error recording, shell wiring, cross-system integration, and edge cases
- the end-to-end workflow test at `tools/test-manager-build-workflow.js` covers 37 assertions across 8 phases including priority handling, explicit builder assignment, mid-flight cancellation, concurrent directives, non-manager text bypass, and fresh plan-execute-complete cycles
- build progress logs are persisted to `D:\Gail\data\runtime\manager-build-test-log.json` with timestamped entries for every action and assertion
## 2026-04-20 Update

Active repo-dependent animation state now looks like this:

- importer runtime: `tools/anim-avatar-importer`
- importer data: `data/animation-importer`
- converted animation library: `data/animation-library/converted_animations_20260401`
- imported runtime clips: `playcanvas-app/assets/animations`

Verified live on `2026-04-20`:

- integrated importer runs from `working_copy`
- repo-local animation library copy is present and complete
- backend health is green on `http://127.0.0.1:4180/health`
- animation workbench now exposes `1892` repo-local library items
- importer can preview and import clips into the active repo runtime

Current highest-value unfinished item:

- avatar import is not yet a true repo-backed ingestion flow; the existing `avatar-import.html` page still acts as a browser-local registration stub instead of a real file import pipeline

Reference report:

- `cleanup-hub/DEPENDENCY_BRINGUP_REPORT_2026-04-20.md`

## 2026-04-20 Persona Asset Ingest Update

The repo now has a working Blender-driven staging export path for persona assets sourced from `D:\avatars`.

Current export tooling:

- `tools/export_persona_assets.py`
- `tools/run-persona-asset-ingest.ps1`

Current staged output baseline:

- `cleanup-hub/persona-ingest-20260420-1630`

What is verified:

- Cherry exports cleanly into staged `avatar`, `hair`, and `clothes` GLBs
- Vera exports cleanly into staged `avatar`, `hair`, and `clothes` GLBs
- Gail daily jacket exports cleanly into staged `avatar`, `hair`, and `clothes` GLBs
- Gail main blend exports staged `avatar` and `clothes`, but no distinct hair mesh is currently classified in `gail.blend`
- Gail work outfit exports as a clothes-only staged asset and may be static because the selected armature has no mesh armature modifiers

What is still missing:

- staged persona exports are not yet promoted into the runtime asset registry or manifest system
- avatar import is still not a true repo-backed ingestion flow end-to-end

Operator decision recorded on `2026-04-21`:

- Gail's current hair look is the canonical shared default
- Cherry and Vera should use that same hair look for now
- future uploaded styles should become selectable and eventually switch by context such as time-of-day and weather

Current technical note:

- the product decision above is ahead of the current automation because `gail.blend` did not emit a distinct staged hair export in the last split pass
- `gail_daily_jacket.blend` currently contains the cleanest explicit staged Gail-style hair export if a temporary source is needed during runtime promotion
- the active runtime manifest now implements the shared-hair decision by mapping `private_hair` and `girlfriend_hair` to `gail/hair/meili_hair/meili_hair.glb`
- live verification on `2026-04-21` confirmed via `/client/asset-manifest` and `/client/wardrobe-presets` that the shared-hair mapping is active while persona hair slot ids remain distinct

## 2026-04-21 Work-Lite Persona Staging Update

The active `work-lite` client now has a staging-only startup path that can intentionally honor persisted backend persona state:

- staging route: `/client/work-lite/?allowPersistedPersona=1`
- default route remains safe/local-normalized: `/client/work-lite/`

What is now verified:

- backend persona persistence is stable when orphaned headless audit browsers are not interfering
- Cherry can boot directly into the correct staged persona state and render the base Cherry avatar
- Vera can boot directly into the correct staged persona state and render the base Vera avatar
- direct HTTP serving for the currently tested large persona modules is working

What is still broken:

- Cherry stalls at `Loading Cherry dress...`
- Vera stalls at `Loading Vera jeans...`
- direct staged shared-hair runtime proof is still blocked because both persona boots stall before completing the remaining wardrobe/hair modules
- normal-mode headless rendering can still look visually wrong even when status reaches `Scene ready`

Current best interpretation:

- shared-hair manifest/config mapping is correct
- the remaining blocker is inside the `work-lite` load/bind/render path for persona modules, not the raw backend file-serving layer

Reference report:

- `cleanup-hub/WORKLITE_PERSONA_STAGING_AUDIT_2026-04-21.md`

## 2026-04-21 Gail Axis / Scale Update

The Gail orientation/scale bug was traced to the source export contract, not PlayCanvas camera guesswork.

Confirmed source cause:

- `D:\avatars\Gail\gail.blend`
- armature `Victoria 8`
- object rotation `+90° X`
- object scale `0.01`

That transform was leaking into the exported Gail runtime GLBs and causing the classic failure:

- avatar appears laid on its back
- soles face the camera
- avatar looks tiny

What is now fixed:

- Gail export tools now normalize armature/skinned-mesh object space before GLB export
- the active Gail body and Gail wardrobe GLBs were regenerated from source
- live normal-mode verification now shows Gail upright and correctly scaled

What is still separate:

- Gail wardrobe/hair completion is not fully resolved yet; the current normal probe still stalls at `Loading gail outfit pants...`

Reference report:

- `cleanup-hub/AVATAR_AXIS_SCALE_FIX_2026-04-21.md`

Reference report:

- `cleanup-hub/PERSONA_ASSET_INGEST_REPORT_2026-04-20.md`
- `cleanup-hub/SHARED_HAIR_RUNTIME_MAPPING_2026-04-21.md`
- `cleanup-hub/SHARED_HAIR_VERIFICATION_2026-04-21.md`

## 2026-04-21 Cherry Runtime Refresh

Cherry has now been refreshed from the latest source blend into the live runtime asset contract.

Source and run roots:

- source: `D:\Avatars\Cherry\Cherry.blend`
- run root: `cleanup-hub/cherry-runtime-refresh-20260421-live2`

Current refresh tooling:

- `tools/export_cherry_runtime.py`
- `tools/run-cherry-runtime-refresh.ps1`

What is now true:

- the active Cherry runtime body is the new promoted export from source
- the active Cherry dress and Cherry shoes runtime GLBs are also refreshed from source
- the refreshed Cherry hair GLB exists in the repo runtime path as an optional promoted asset
- all promoted Cherry GLBs pass the root-transform guard

Best stable live proof from this pass:

- `docs/reports/worklite-persona-private_girlfriend-20260421-131550.json`
- `docs/reports/worklite-persona-private_girlfriend-20260421-131550.png`

What that proof shows:

- Cherry body, dress, and shoes are refreshed and visible
- scale and orientation are correct
- Cherry is still in rest pose / T-pose
- the best-working runtime path still inherits the broken shared Gail hair result

Important runtime caution:

- Cherry's own hair asset is exported and promoted, but routing `girlfriend_hair` to `gail/girlfriend/hair/cherry_hair.glb` currently causes a worse wardrobe-load stall than the shared-hair path
- the active repo was therefore left on the more usable shared-hair mapping while the loader issue is investigated

Best current interpretation:

- Cherry export/import/promotion is working
- the remaining blocker is runtime persona wardrobe/animation stability, not the Cherry source export contract

Reference report:

- `cleanup-hub/CHERRY_RUNTIME_REFRESH_2026-04-21.md`

## 2026-04-22 Gail Current Hair Refresh

Gail's current source upload does include hair, and the active lite runtime has now been corrected to use that fresh Gail hair export instead of the stale archived fallback.

Active source and runs:

- source: `D:\Avatars\Gail\gail.blend`
- medium proof run: `cleanup-hub/gail-lite-runtime-refresh-20260422-current-hair`
- active low-profile run: `cleanup-hub/gail-lite-runtime-refresh-20260422-low-profile`

What is now true:

- `gail_lite` no longer points at the old 2026-04-17 fallback hair file
- `/client/asset-manifest?assetRoot=gail_lite` resolves `meili_hair` to the current Gail lite export
- the active Gail lite runtime now uses:
  - body `141,375,508` bytes
  - hair `77,952,824` bytes
  - top `598,628` bytes
  - pants `1,388,772` bytes
  - sandals `7,165,696` bytes
  - accessories `147,928` bytes

Best current live proof:

- `docs/reports/worklite-persona-normal-20260422-094103.json`
- `docs/reports/worklite-persona-normal-20260422-094103.png`

What that proof shows:

- Gail is upright and correctly scaled
- Gail body and wardrobe load in the active lite path
- Gail hair now loads from the current export path
- the remaining bug is attachment/render correctness, not source selection
- the detached skull-cap/hair chunk still appears by Gail's feet

Current fix boundary:

- the next Gail pass should inspect hair bind/attachment correctness against the working Vera/Cherry hair exports instead of re-litigating source selection

Reference report:

- `cleanup-hub/GAIL_CURRENT_HAIR_REFRESH_2026-04-22.md`

## 2026-04-22 Gail Hair Floor Fix

Gail hair is no longer failing because of source selection or missing files. The exporter/runtime investigation showed the actual floor bug was an export-space problem specific to Gail hair geometry.

What was confirmed:

- Gail hair skin names and inverse bind matrices already matched the Gail body correctly
- `work-lite` runtime rebinding now resolves Gail hair against the real body skeleton
- the remaining floor failure came from Gail hair mesh vertices being exported near origin / floor level instead of head height

Implemented fix:

- `playcanvas-app/src/work-lite-rebuild.ts` now rebinds modular render roots to the resolved skeleton root before garment skin rebinding
- `tools/export_gail_split.py` now performs a Gail hair post-export correction using the exported head inverse bind matrix to translate Gail hair `POSITION` accessors into the correct rest position
- both active Gail runtime roots were regenerated from the corrected exporter:
  - `cleanup-hub/gail-lite-runtime-refresh-20260422-hair-floor-fix`
  - `cleanup-hub/gail-runtime-refresh-20260422-hair-floor-fix`

Best current proof:

- `docs/reports/worklite-persona-normal-20260422-100946.json`
- `docs/reports/worklite-persona-normal-20260422-100946.png`

Current interpretation:

- the Gail hair floor-placement bug is fixed in the exporter-backed runtime path
- Gail hair now renders in the head region in the corrected live proof
- remaining Gail work is visual polish and pose quality, not the original floor-placement failure

Reference report:

- `cleanup-hub/GAIL_HAIR_FLOOR_FIX_2026-04-22.md`

## 2026-04-22 Vera Refresh and Stale-Client Fix

All Vera counselor assets are now current and the live client is serving the correct April-22 build.

### Vera runtime refresh

- 	ools/export_vera_runtime.py and 	ools/run-vera-runtime-refresh.ps1 created and run; 6 Vera GLBs promoted to playcanvas-app/assets/gail/counselor/ at April-22 11:23
- playcanvas-app/index.html updated to version 20260422-vera-refresh

### Two-working-copy architecture (Decision 2026-04-22-05)

The backend is currently running from a different physical directory than the VS Code workspace:

- VS Code workspace (edit surface): D:\Gail 2.1\working_copy
- Active backend root: C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy

The backend was launched by ackend-supervisor.ps1 with the OneDrive Desktop path as RepoRoot. All session edits went to D:\; the backend was reading stale April-20 files from C:\.

Immediate fix applied:

- copied current index.html and dist JS from D:\ workspace to the C:\ backend root
- server now returns =20260422-vera-refresh
- Vera counselor assets at C:\ OneDrive Desktop path are already April 22 (10:47) from a prior session

Outstanding risk:

- future edits to the D:\ workspace must be propagated to the C:\ backend root until the backend launch is redirected to D:\
- the backend launch reconfiguration (pointing ackend-supervisor.ps1 to D:\) is a separate task not yet done

## 2026-04-23 New Gail Source Refresh

The active Gail source has been refreshed from the new `D:\Avatars\Gail\gail.blend` upload and promoted into both active runtime roots.

What is now true:

- the temporary Gail brow isolate used for the last body-line test has been removed from `work-lite`
- the Gail exporter now understands the new mesh naming contract in the fresh blend:
  - `Genesis 8 Female.Shape`
  - `Voss Hair Genesis 8 Female.Shape`
  - `MK Short T-shirt.Shape`
  - `Urban Action Pants.Shape`
  - `Angie Sneakers.Shape`
- both runtime roots were regenerated from the new source:
  - `cleanup-hub/gail-runtime-refresh-20260423-new-gail-v2`
  - `cleanup-hub/gail-lite-runtime-refresh-20260423-new-gail-v2`
- the live client cache key is now `20260423-new-gail1`
- the live `gail_lite` manifest resolves the new Gail package sizes:
  - body `43918416`
  - hair `13952556`
  - top `8422736`
  - pants `7330360`
  - footwear `2011560`

Current boundary:

- the import/export step is complete and the live server is on the new Gail assets
- visual operator confirmation is still needed for:
  - pose quality
  - hair behavior during animation
  - whether the prior body-line issue is gone with the new source

### Gail hair correction

The first April-23 new-source import placed the new Voss hair too high because the old floor-hair correction still translated the hair even though the new hair already exported in head/body space.

Current state:

- `tools/export_gail_split.py` now skips that translation when hair vertex bounds already exceed head/body-space threshold
- corrected `gail_lite` hair Y bounds are now `1.4419605731964111` to `1.8281116485595703`
- live client cache key is now `20260423-gail-hair-yfix1`
- D and C live hair files match SHA256 `B83A726809109A52052935EB6DFA00F7AA1D77C6CADCFDB9ED30692369AD5823`

Reference:

- `cleanup-hub/GAIL_NEW_HAIR_Y_FIX_2026-04-23.md`

### Hair material tuning

The current runtime hair pass is material-only:

- no GLB changes
- no Blender/export changes
- no animation changes

Current `work-lite` hair material settings:

- `alphaTest = 0.08`
- `glossCap = 0.04`
- `shininessCap = 14`
- `specularityCap = 0.03`
- `specularColor = 0.03`
- `cull = pc.CULLFACE_BACK`
- cache key and asset salt: `20260423-hair-cull1`

Reference:

- `cleanup-hub/HAIR_MATERIAL_SOFTCUT_2026-04-23.md`

## 2026-04-23 Avatar Runtime Source Of Truth

Avatar runtime data has been consolidated.

Active source:

- `data/client/avatar-runtime.json`

This file now owns:

- active runtime settings
- available avatar systems
- work-lite asset catalog
- wardrobe presets
- persona-to-avatar body mappings

The legacy split files are no longer active authority:

- `playcanvas-app/config/work-lite-modules.gail.json`
- `data/client/runtime-settings.json`
- `data/client/wardrobe-presets.json`

Shell-facing behavior:

- Avatar Library, Wardrobe, and Runtime Mapping continue using the same `/client/*` endpoints
- those endpoints now read/write `avatar-runtime.json`
- `work-lite` receives `personaMap` through `/client/asset-manifest`

Reference:

- `cleanup-hub/AVATAR_RUNTIME_SINGLE_SOURCE_2026-04-23.md`

## 2026-04-23 Solid Fallback Checkpoint

The current client/avatar state has been locked as a known-good fallback after operator visual confirmation.

External checkpoint:

- `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`

Verification:

- backend build passed
- PlayCanvas build passed
- control panel build passed
- animation validator passed `11` files with `0` errors
- backend tests passed `121/121`

Boundary:

- this is a filesystem fallback snapshot, not a clean Git release commit
- `.git`, `node_modules`, and `*.pyc` were intentionally excluded
- active avatar runtime source remains `data/client/avatar-runtime.json`

Reference:

- `cleanup-hub/CHECKPOINT_SOLID_FALLBACK_2026-04-23.md`

## 2026-04-23 Generated Artifact Cleanup

The active working copies have been compacted after the solid fallback checkpoint was created.

Cleaned:

- old cleanup/import artifact folders
- old generated reports and screenshots
- old audit snapshots
- Python bytecode caches
- root-level temporary probe/diff files
- old D-only Blender/runtime scratch files

Preserved:

- active source
- active PlayCanvas/avatar assets
- `data/client/avatar-runtime.json`
- solid fallback checkpoint at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`

Result:

- approximately `33.36 GB` freed across the D working copy and live C mirror
- builds passed after cleanup
- backend tests passed `121/121` after cleanup

Reference:

- `cleanup-hub/CLEANUP_PASS_2026-04-23.md`

## 2026-04-23 Top-Level Drive Cleanup

The top-level `D:\` root has been cleaned.

Current top-level shape:

- `D:\Applications`
- `D:\Avatars`
- `D:\Gail 2.1`
- system folders only

Current active roots:

- product repo: `D:\Gail 2.1\working_copy`
- avatar blend inputs: `D:\Avatars`
- fallback checkpoint: `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`
- legacy hold: `D:\Gail 2.1\legacy-hold\20260423-top-level-review`

Cleanup result:

- deleted approximately `66.25 GB`
- moved approximately `3.50 GB` of old reference/asset material out of the root
- D drive free after cleanup: approximately `750.55 GB`

Verification:

- backend build passed
- PlayCanvas build passed
- control panel build passed
- animation validator passed `11` files with `0` errors
- live runtime settings endpoint returned `gail_primary`

Reference:

- `cleanup-hub/TOP_LEVEL_DRIVE_CLEANUP_2026-04-23.md`

## 2026-04-23 Animation Natural Timing

The current `work-lite` avatar animation feel has been softened at runtime.

Current tuning:

- normal animation playback: `0.86x`
- dance playback: `0.68x`
- longer crossfades between idle, talk, listen, ack, and dance
- short hold times reduce rapid state flipping
- client cache key: `20260423-anim-natural1`

Boundary:

- no avatar GLBs changed
- no animation GLBs changed
- no Blender/export scripts changed

Verification:

- PlayCanvas build passed
- animation validator passed `11` files with `0` errors
- live client serves `20260423-anim-natural1`

Reference:

- `cleanup-hub/ANIMATION_NATURAL_TIMING_2026-04-23.md`

## 2026-04-23 Facial Micro Movement

The current `work-lite` avatar has a runtime facial micro-motion layer.

Current behavior:

- random expression retargets every `0.7` to `2.7` seconds
- grouped mouth/lip/chin/jaw/smile/squint motion
- left/right mirrored pairs with slight asymmetry
- damped while speaking so visemes remain readable
- client cache key: `20260423-face-micro1`

Boundary:

- no avatar GLBs changed
- no animation GLBs changed
- no Blender/export scripts changed
- no avatar runtime config changed

Verification:

- PlayCanvas build passed
- animation validator passed `11` files with `0` errors
- live client serves `20260423-face-micro1`

Reference:

- `cleanup-hub/FACIAL_MICRO_MOVEMENT_2026-04-23.md`

## 2026-04-23 Body Alive Motion

The current `work-lite` avatar has a procedural body-alive layer.

Current behavior:

- randomized breathing rate and depth
- chest/spine rise and fall
- shoulder and arm breathing response
- subtle torso weight shift and settle motion
- long browser-speech chunks can pause briefly for a breath before the next queued chunk
- client cache key: `20260423-body-alive1`

Boundary:

- no avatar GLBs changed
- no animation GLBs changed
- no Blender/export scripts changed
- no avatar runtime config changed

Verification:

- PlayCanvas build passed
- animation validator passed `11` files with `0` errors
- live client serves `20260423-body-alive1`

Reference:

- `cleanup-hub/BODY_ALIVE_MOTION_2026-04-23.md`

## 2026-04-23 Body Alive Fallback Checkpoint

The current smoother animation, facial micro-movement, and body-alive runtime state has been locked as the newest known-good fallback.

Current known-good fallback:

- `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`

Previous fallback:

- `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`

Verification:

- backend build passed
- PlayCanvas build passed
- control panel build passed
- animation validator passed `11` files with `0` errors
- live client served `20260423-body-alive1`

Reference:

- `cleanup-hub/CHECKPOINT_BODY_ALIVE_FALLBACK_2026-04-23.md`

## 2026-04-23 Voice Wake And Buffer Cleanup

The current `work-lite` voice loop now has more forgiving wake matching, faster context-aware buffer responses, an always-listening ambient guard, a shared self-hearing guard, and a single persisted runtime tuning source.

Current behavior:

- wake-word mode accepts the configured phrase plus common STT variants of Gail/Gale/Gael/Gal
- voice messages get a short buffer phrase after `650ms`
- buffer phrase selection is local and classifies the utterance as question, command, or statement
- phrase context can reflect follow-up, vision, persona, dance, or system/voice commands
- always-listening ignores likely background transcripts before model submission
- Gail's own output sets `gailSpeechActive` across quick phrases, queued browser speech, and OpenAI/audio playback
- follow-up listening waits for Gail speech, browser synthesis, and work-lite speech queues to go idle
- post-speech cooldown remains `1200ms`
- runtime voice behavior is sourced from `data/voice/voice-settings.json` under `runtime`
- operator shell `Providers & Voice` can edit persisted wake aliases, filler phrases, cooldowns, timing, and ambient filtering thresholds
- local Ollama provider is configured for `dolphin-mistral:7b`
- Cherry/private-girlfriend explicitly uses `dolphin-mistral:7b`
- client cache key: `20260423-voice-config1`

Boundary:

- the immediate buffer phrase does not call the local LLM because local model latency is too high for that path
- browser wake transcription still depends on browser `SpeechRecognition`
- true speaker locking is not available through browser `SpeechRecognition` alone
- very loud external speaker echo after the cooldown can still be a physical-room issue
- no avatar, animation, or Blender/export assets changed

Verification:

- PlayCanvas build passed
- backend build passed
- live provider endpoint reports effective model `dolphin-mistral:7b`
- live client serves `20260423-voice-wake1`

Reference:

- `cleanup-hub/VOICE_WAKE_LISTENING_CLEANUP_2026-04-23.md`
