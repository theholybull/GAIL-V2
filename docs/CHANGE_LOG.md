# Change Log

## 2026-04-28

- locked the standalone `/gail-mobile/` iPhone audio path after user confirmation: cloud MP3 playback uses a fresh `Audio` element per reply, with no silent audio arming and no browser/system TTS fallback
- switched standalone mobile TTS voice from `coral` to `nova` on the same locked `openai-gpt-4o-mini-tts` path
- fully stops/removes mobile mic tracks during cloud MP3 playback and reacquires audio-only mic access after speech cooldown so iPhone hardware volume is not fighting an active capture session
- added durable mobile voice input for iPhone Chrome/WebKit through `MediaRecorder` + VAD + `POST /voice/transcribe`, preferring this path over unreliable mobile Web Speech recognition
- added backend `POST /voice/transcribe` using OpenAI `gpt-4o-mini-transcribe`, accepting codec-bearing recorder MIME types and uploading iPhone `audio/mp4` as `.m4a`
- fixed the mobile transcription corruption error by recording an audio-only `MediaStream` instead of the combined camera+mic stream
- documented the known-good and failed mobile audio variants in `GAIL_MOBILE_DEBUG_HANDOFF.md`
- added `docs/MOBILE_AUDIO_REPLICATION_RUNBOOK_2026-04-28.md` with the repeatable mobile audio verification path and the shell-settings backlog for mobile TTS, playback, mic routing, mouth sync, camera, wake-lock, and permissions

## 2026-04-24

- fixed `work-lite` night lighting so the Light Level slider now responds in night mode instead of being pinned to a fixed 10%
- updated night lighting behavior to keep a dark baseline while allowing full-range slider response
- extended per-persona placement persistence to include avatar rotation (not only avatar position and camera position/target)
- updated persona placement load/apply flow to restore avatar rotation on boot and persona switches
- bumped `work-lite` client cache/version to `20260424-env-backdrop33`
- created locked checkpoint backup at `playcanvas-app/backups/20260424-env-backdrop33-lockdown/`
- verified the `playcanvas-app` TypeScript build passes with exit code `0`

## 2026-04-22

- created `tools/export_vera_runtime.py` for repeatable Vera GLB export from source blend
- created `tools/run-vera-runtime-refresh.ps1` for repeatable Vera promotion into `playcanvas-app/assets/gail/counselor/`
- promoted Vera runtime assets from `D:\Avatars\Vera\vera.blend` into the active repo; prior April-14 ingest batch replaced with fresh exports
- Vera outfit mapped to established counselor slots: blazer→`vera_blazer.glb`, blouse→`vera_camisole.glb`, skirt→`vera_jeans.glb`, heels→`vera_heels.glb`
- run artifact: `cleanup-hub/vera-runtime-refresh-20260422-112223/`
- added a shared Playwright renderer helper at `tools/playwright-renderer.js`
- changed local Playwright verification tools to default to hardware GPU rendering instead of `--use-angle=swiftshader`
- kept SwiftShader available as an explicit fallback via `--renderer=swiftshader` or `GAIL_PLAYWRIGHT_RENDERER=swiftshader`
- updated local verification reports so they now record `rendererMode`
- documented the local GPU rendering policy in `cleanup-hub/GPU_RENDERING_POLICY_2026-04-22.md`
- verified the real Edge browser path was using Intel WebGL before any graphics assignment
- set the Windows graphics preference for Edge to high performance with `GpuPreference=2;`
- verified the real Edge browser path now resolves WebGL through the NVIDIA RTX 4050
- documented the browser before/after in `cleanup-hub/LIVE_BROWSER_GPU_VERIFICATION_2026-04-22.md` and `docs/reports/edge-webgl-gpu-verification-20260422.json`
- ran a real Edge RTX-backed `work-lite` session and confirmed the live client now reaches `Scene ready` on `gail_lite`
- documented the run in `cleanup-hub/EDGE_LIVE_GPU_RUN_2026-04-22.md`
- recorded the remaining visual blockers from that live run: Gail rest pose and hair/skull-cap placement
- reset Vera and Cherry off the shared Gail hair and back onto their own persona-specific hair assets
- verified persona hair routing in `docs/reports/persona-hair-manifest-20260422.json` and `docs/reports/persona-hair-live-isolated-20260422.json`
- documented the change in `cleanup-hub/PERSONA_HAIR_RESET_2026-04-22.md`

## 2026-04-21

- rebuilt the missing Gail runtime export path with a new `tools/export_gail_split.py` and `tools/run-gail-runtime-refresh.ps1`
- refreshed Gail's live avatar, hair, clothes, and accessories from `D:\Avatars\Gail\gail.blend` into the repo runtime asset tree
- standardized package texture tier defaults to `512 / 2048 / 4096` across the headless package scripts and the Gail production workbench add-on
- updated workbench/export readmes so device-class texture usage is explicitly documented for host, general client, and watch-class targets
- ran and documented a fresh Gail runtime refresh plus a fresh Gail tiered package export under `cleanup-hub/`
- captured new verification artifacts for Gail root transforms, live asset manifest state, and normal work-lite staging behavior
- patched the `work-lite` client so Gail hair no longer uses the overly aggressive `alphaTest = 0.5` rule that cut out the new strand texture
- added versioned client-asset URLs for modular runtime loads in `work-lite` to make live refreshes less likely to reuse stale GLBs
- documented the Gail hair runtime findings, including the confirmed visibility bug and the still-open runtime-weight problem
- documented the current remaining blocker: Gail runtime files are refreshed and verified, but the live `work-lite` client still stalls at base-body load in the normal persona path
- added a lighter Gail runtime root at `playcanvas-app/assets/gail_lite/`
- added `tools/run-gail-lite-runtime-refresh.ps1` and extended `tools/export_gail_split.py` so lighter Gail exports are now repeatable instead of manual
- updated `work-lite` so it prefers the repo-local `gail_lite` root by default while still allowing explicit asset-root overrides
- verified the backend resolves Gail body, hair, clothes, and accessories from `gail_lite`, and captured the first live proof under `docs/reports/worklite-persona-normal-20260421-154725.*`
- documented the new lighter runtime contract and its remaining blocker in `cleanup-hub/GAIL_LITE_RUNTIME_2026-04-21.md`

## 2026-04-20

- added `cleanup-hub/` with `README.md`, `PROJECT_MAP.md`, `DRIVE_CLEANUP_PLAN.md`, `AGENT_GOVERNANCE.md`, and `DECISION_LOG.md` to establish one cleanup control center inside the active repo
- added `cleanup-hub/INITIAL_DIRECTIVES.md` so the manager and builders have a controlled first-pass directive queue instead of ad hoc cleanup work
- added `cleanup-hub/PATH_DRIFT_REPORT_2026-04-20.md` and `cleanup-hub/DRIVE_ROOT_MANIFEST_2026-04-20.md` so cleanup can proceed from audited evidence instead of memory or guesswork
- added `cleanup-hub/COMPONENT_DATES_2026-04-20.json` plus three new assessment/blueprint docs so the newest credible Gail system is documented in one place
- added a repo-local `tools/start-animation-importer.ps1` launcher to bridge the current sidecar importer into the repo workflow while importer promotion is planned
- added `tools/run-runtime-ui-snapshot-audit.js` so the repo can capture screenshots, shell-page audits, and bounded shell action checks into `cleanup-hub/`
- added `cleanup-hub/RUNTIME_UI_AUDIT_2026-04-20.md` as the current runtime/UI baseline for the active repo
- added `cleanup-hub/DOCUMENTATION_PROTOCOL.md` and tightened agent instructions so documentation, artifact storage, and handoff rules are explicit
- added standalone assembly directives for importer integration and staging-contract work
- classified `D:\Gail 2.1\working_copy` as the only active Gail product repo and marked sidecars, engine references, and old workstreams as non-default write targets
- documented a safe drive-cleanup sequence that separates active roots, frozen reference roots, and decision-pending asset areas before any archive/delete work begins
- tightened agent governance so the human operator is now the explicit final authority for drive cleanup, destructive actions, archive moves, credentials, and release decisions
- updated `.github/copilot-instructions.md` and the manager/builder agent files to require reading the cleanup hub before work and to prevent silent drift into new Gail roots on `D:\`

## 2026-04-08

- added a manager agent system so the main avatar AI can inspect system health, browse project files, issue build directives to worker agents, and control all settings through one unified surface
- created shared contracts for system status (`SystemStatus`, `SystemHealthEntry`, `SystemErrorEntry`, `FileSystemEntry`, `FileReadResult`) and manager agent (`ManagerDirective`, `ManagerAgentStatus`, `ManagerReport`, `CreateManagerDirectiveInput`)
- added `SystemStatusService` aggregating health from providers, voice, and build-control into a single snapshot with error tracking (capped at 100)
- added `FileSystemService` with sandboxed directory listing and file reading locked to `D:\Gail`, path-traversal protection, text-only whitelist, and 512 KB limit
- added `ManagerAgentService` implementing a manager-alpha agent with two builders (builder-a, builder-b), directive lifecycle (pending → assigned → running → done/failed/cancelled), and an avatar-request bridge
- wired all three services into `bootstrap.ts` with constructor-based dependency injection
- added 13 HTTP routes to `domain-http-routes.ts`: `GET /system/status`, `/system/errors`, `/system/files`, `/system/files/read`, `/manager/report`, `/manager/status`, `/manager/builders`, `/manager/directives`, `/manager/directives/:id`; `POST /manager/directives`, `/manager/directives/:id/cancel`, `/manager/avatar-request`
- wired avatar-to-manager bridge in `control-intent-service.ts` with `MANAGER_KEYWORDS` regex so spoken/typed build requests are automatically routed as manager directives before falling back to raw workflow creation
- added `system-status` and `manager-agent` pages to Operator Studio Shell with full PAGES entries, runtime properties, display builders, 10 action handlers, fetch functions, PAGE_HELP entries, SENSITIVE_ACTIONS, and auto-fetch hooks
- validated clean TypeScript backend build and tested all 13 endpoints live on port 4180

- fixed the work-lite client wake-word bug: the shell reported voice input as active but no browser `SpeechRecognition` listener existed in `work-lite-rebuild.ts`
- added a full browser `SpeechRecognition` loop to `work-lite-rebuild.ts` with wake-word detection, silence-timeout submission, conversation routing, and lifecycle coordination (~340 lines)
- added runtime UI elements to the work-lite client: `#voice-loop-restart` button, `#voice-runtime-note` div, and a `Voice input` row in the shell-state panel
- added voice lifecycle coordination so the mic pauses while Gail speaks and auto-resumes after response, syncing with backend voice settings every 3 seconds
- created `tools/patch-work-lite-wake-word.js` to apply on-disk source patches with CRLF normalization (workaround for VS Code buffer-only save issue)
- validated clean TypeScript build, confirmed served JS bundle contains all new functions, confirmed voice endpoints return correct wake-word settings
- updated `BUILD_LOG.md`, `CHANGE_LOG.md`, `PROJECT_STATE.md`, `OPERATOR_MANUAL.md`, and `GAIL_SHELL_COMPLETION_CHECKLIST.md` with wake-word implementation details

## 2026-04-07

- added `GET /providers/local-llm-config` and `PATCH /providers/local-llm-config` for persisted Ollama and private-persona configuration
- changed the local provider to read live local-model settings from persisted config instead of only startup env values
- added two configurable private-mode local agents, `private_counselor` and `private_girlfriend`, and made private local replies persona-aware
- wired both the Operator Studio shell and the legacy operator panel provider sections to the new local-LLM/private-persona config route
- added explicit command phrases and actions for switching the active private persona, including `doc im lonley` -> `private_girlfriend`
- updated workspace instructions and operator/provider docs for the new local-LLM and private-persona flow
- upgraded the live work-lite preview client so it now loads the avatar's manifest-driven `idle`, `talk`, and `listen` clips instead of showing only a static stage mesh
- added facial morph and blink runtime to the work-lite preview by discovering morph targets and eyelid rig nodes from the active avatar GLB and driving them during assistant replies
- tied work-lite chat activity into avatar motion state and surfaced avatar-motion status in the shell-state preview panel
- bumped the served work-lite bundle cache key to `rebuild4` so browsers fetch the new avatar mechanics client immediately
- replaced the work-lite preview's text-length speech estimate with real preview playback timing via `POST /voice/speak` audio plus browser speech fallback
- restored the live `ack` animation slot by adding `playcanvas-app/assets/animations/ack_nod_small_v1.glb` from the existing nod animation library
- bumped the served work-lite bundle cache key again to `rebuild5` for the speech-timing and ack-clip update
- added a visible on-stage avatar-motion overlay to the work-lite client so motion state appears directly on the lite page
- made the lite client fall back to browser speech if returned TTS audio cannot actually start playback, preserving visible talk motion
- bumped the served work-lite bundle cache key to `rebuild6`
- added a `Run Motion Test` button and automatic startup motion demo directly on the lite stage
- bumped the served work-lite bundle cache key to `rebuild7`

## 2026-04-02

- added `POST /control/intents` so typed or spoken work-lite input can now resolve to either a matched hardwired command or a newly created planned workflow
- extended the work-lite client conversation panel with a route selector for `conversation` versus `workflow_control` and browser speech-recognition controls for spoken input routing
- validated the new control path with passing backend/client type-checks, successful backend/client builds, and live regression coverage for natural-language command matching plus free-text workflow planning in `docs/reports/backend-test-report-20260402-152027.md`
- stored the existing local OpenAI API key in `data/providers/openai-config.json` so Gail's preferred cloud TTS engine is now configured on this machine
- verified the live voice path end to end: provider config now reports configured, OpenAI TTS engines report available, warmup succeeds, and `POST /voice/speak` returns OpenAI-generated audio without browser fallback
- removed stale Blender backup directories and autosave-style backup files from the active animation workspace
- added runtime-aware `high`, `medium`, and `low` export profiles across the Blender add-on, headless export script, and PowerShell export entrypoints
- updated the export pipeline so profile choice now changes morph retention and compression behavior for host, lightweight client, and watch-class delivery targets
- added backend export orchestration with `GET /exports/status` and `POST /exports/run`
- wired the Operator Studio shell animation and runtime pages to load export status, trigger export actions, and show the latest export report summary
- replaced the shell inspector checklist with per-page help content covering setup, steps, settings, actions, success checks, and troubleshooting
- added top-bar Help access, quick-start guidance, and a plain-English glossary to the Operator Studio shell
- added optional guided mode to the Operator Studio shell with per-page action order, persisted progress, and gated later actions until earlier required steps succeed
- updated the project build log and project state docs to reflect the current export and shell status
- added workspace-wide agent instructions and a reusable prompt command so future agents in this repo keep `docs/BUILD_LOG.md`, `docs/CHANGE_LOG.md`, and `docs/PROJECT_STATE.md` synchronized after meaningful project work
- added `PRODUCT_STRATEGY.md` and `COMMERCIAL_READINESS_CHECKLIST.md` to define the path from prototype build to marketable pilot product
- repositioned the README and active planning docs around a controlled pre-release product story instead of a loose prototype story
- added a dedicated per-page next-pass notes panel in the Operator Studio shell with note statuses and a cross-page `Pass Review` page so follow-up work can be recorded and reviewed without mixing notes across pages

## 2026-03-16

- established the V1 foundation scaffold for the new Gail architecture
- marked web-first and local-first direction in root docs
- added shared contracts for modes, devices, presence, tasks, reminders, projects, notes, parts, cart, and approvals
- added backend scaffold modules for services, brokers, providers, db, jobs, and sync placeholders
- added web control panel and PlayCanvas placeholder structure

## 2026-03-17

- added project, note, and list domain services
- implemented CRUD-style task, reminder, part, and cart services
- added shared service input contracts for domain creation and updates
- added in-memory repositories and a domain bootstrap for the TypeScript backend
- upgraded the action broker to execute a small safe subset of domain actions
- added a runnable Node HTTP server for the TypeScript backend and validated the health endpoint
- switched the backend domain storage from in-memory repositories to SQLite-backed repositories
- verified persisted project records survive a backend restart
- added request validation and Private Mode enforcement for persistent write routes
- routed explicit private note saves into a separate private SQLite database
- added RAM-only private session APIs for unsaved private notes
- added device-type-based route permission enforcement
- verified current route permission behavior for watch vs iPhone device types
- added first trust/approval workflow for cart approval requests and commits
- verified multi-step cart approval flow end to end
- added device registration and trust-state enforcement for approval-sensitive routes
- verified trusted device registration gates approval-sensitive routes correctly
- persisted device and approval state in SQLite for restart-safe trust testing
- replaced the control panel scaffold with a usable backend-connected operator panel
- added SSD migration guidance and a PowerShell migration helper
- added a living operator manual for running and testing the current build
- expanded automated backend coverage and documented the test-update requirement for future phases
- added a dashboard overview route and operator-panel summary section
- expanded automated backend coverage to validate overview availability and counts
- expanded the operator panel with project, list, reminder, and part workflow controls
- fixed partial PATCH normalization for SQLite-backed update routes
- expanded automated backend coverage to validate project, list, reminder, and part updates
- added sensitive-action unlock windows for trusted devices
- enforced unlock-window checks on approval-sensitive routes
- expanded automated backend coverage to validate locked and unlocked approval flows
- added explicit rejection and expiry enforcement to approval resolution and cart commit flows
- expanded automated backend coverage to validate rejected and expired approval behavior
- added backend background start/stop/readiness helper scripts
- expanded automated backend coverage to validate private-note explicit-save enforcement and read isolation
- made trust revocation clear the sensitive-action unlock window
- expanded automated backend coverage for stale unlock windows, untrusted devices, and device-type mismatches
- hardened backend automation helpers to stop stale listeners on the backend port
- blocked approval-sensitive automation while Private Mode is active
- expanded automated backend coverage for Private Mode approval-request blocking
- isolated private dashboard reads from normal organizer data
- expanded automated backend coverage for service-device private-session blocking
- turned the conversation/provider layer into a runnable backend session surface
- expanded automated backend coverage for conversation provider selection and mode mismatch blocking
- persisted conversation sessions to SQLite
- expanded automated backend coverage for conversation restart persistence
- moved Private Mode conversation sessions to RAM-only handling
- expanded automated backend coverage for conversation handoff and private-session isolation

## 2026-03-19

- wired the normal conversation provider path to the OpenAI Responses API with environment-based configuration
- added local fallback behavior when the OpenAI provider is unavailable or returns an error
- added a shared persistent memory file for non-private memory entries
- added memory routes for creating and listing shared memory entries
- passed recent shared memory into normal-mode conversation generation
- expanded automated backend coverage for shared-memory persistence and OpenAI fallback behavior
- added shared-memory and conversation-session sections to the operator panel
- added a served work-lite client shell for the PlayCanvas path
- added automated coverage for the work-lite client route
- added provider-status and hardwired-command API surfaces
- added shared-memory search support
- added shared-memory update and delete support
- added a client asset-manifest route and work-lite client manifest consumption
- expanded the client asset manifest with missing-asset and required-directory reporting
- expanded automated backend coverage for provider status, commands, shared-memory search, and client asset manifest
- added live provider telemetry updates driven by conversation traffic
- expanded automated backend coverage for provider telemetry
- added persisted voice settings and voice status API surfaces
- added camera access matrix API surface
- added operator-panel browser voice controls for push-to-talk, wake-word, silence timeout, and auto-resume
- added operator-panel local camera preview controls
- expanded automated backend coverage for voice settings, voice status, camera matrix, and voice restart persistence
- added OpenAI TTS speech synthesis route with browser fallback
- added voice engine listing and persisted TTS engine preferences
- expanded automated backend coverage for TTS engine selection and synth fallback behavior
- upgraded client asset-manifest detection to scan nested dropped assets and ignore zero-byte files
- added direct `/client-assets/*` serving for work-lite dropped assets
- updated work-lite client asset handling to use resolved background files and resolved avatar/animation metadata
- expanded automated backend coverage for resolved client-asset fetchability
- moved the work-lite asset manifest contract into shared contracts
- expanded work-lite avatar asset reporting to the modular Gail bundle
- updated avatar readiness to use the required modular work-lite bundle
- expanded automated backend coverage for modular avatar bundle readiness
- locked the shared client voice baseline to wake-word mode, gpt-4o-mini-tts, shimmer, and a soft feminine light-UK-accent instruction profile

## 2026-03-23

- added OpenAI config status surface at `GET /providers/openai-config`
- added stored-key persistence and clear controls at `PATCH /providers/openai-config`
- wired `OpenAiConfigService` into the OpenAI provider and voice service for consistent env-or-stored API key resolution
- added OpenAI config management section to the operator panel (status, update key, clear key)
- expanded automated backend coverage for OpenAI config status, stored-key lifecycle, and key removal
- verified the updated OpenAI config layer with a clean 109/109 report at `docs/reports/backend-test-report-20260323-160658.md`

## 2026-03-24

- identified that default voice instructions in voice-service diverge from the UK English accent baseline expected by the test suite
- identified that voice settings update test assertion does not match the instruction text sent in the update body
- identified that OpenAI config test section was removed from the regression suite, leaving fallback-sensitive voice and conversation tests exposed to uncontrolled stored-key state
- backend left in a 5-failure regression state at end of session (voice settings surface, voice settings update, voice speak, conversation fallback, provider telemetry)

## 2026-03-27

- corrected default voice instruction profile in voice-service to use the canonical soft-feminine-UK-English-accent text matching the test baseline
- corrected the voice settings update test body to contain the instruction phrase the assertion checks for
- restored the OpenAI config test section to the regression suite with stored-key clear before fallback-sensitive tests
- verified the corrected regression suite produces a clean report

## 2026-03-30

- added prototype-safe pairing/auth scaffolding with LAN-only pairing session creation, pairing completion, and persistent device credential storage
- added token-backed request identity resolution so authenticated paired devices override spoofable header identity when a valid token is present
- added operator-panel pairing workflow controls including auth status refresh, pairing session creation, pairing completion, token storage, token clearing, and paired-device context application
- expanded regression coverage for auth status, pairing session creation, pairing completion, and token-backed request success
- added detailed auth and pairing documentation in `docs/AUTH_PAIRING.md`
- expanded the operator manual with step-by-step pairing usage, token behavior, config guidance, and troubleshooting notes
- added the first `paired_required_for_sensitive` enforcement layer for selected sensitive routes
- added `AuthMode` support to the backend launcher and managed regression script
- verified the updated suite with a clean 113/113 report at `docs/reports/backend-test-report-20260330-113803.md`

## 2026-04-08

- added manager agent system: `manager-alpha` coordinator with two builders (`builder-a` for AI tasks, `builder-b` for Codex tasks) managing directive lifecycles from pending through completed/failed/cancelled
- added system status aggregation service rolling provider, voice, and build-control health into `GET /system/status` with in-memory error log at `GET /system/errors`
- added sandboxed file browser service at `GET /system/files` and `GET /system/files/read` locked to `D:\Gail` project root with path-traversal protection and text-only whitelist
- added 13 HTTP routes for system status, error history, file browsing, manager reports, builder status, directive CRUD, and avatar-request bridge
- added avatar-to-manager keyword routing intercepting `dispatch|deploy|create|fix|run script|execute|compile|export|generate|pipeline|ship it|assign task|set up|update the` and routing as manager directives before falling back to raw workflow creation
- replaced collision-prone `build` and `make it` keywords with `dispatch` and `assign task` to avoid conflicts with existing build-control terminology
- added `System Status` and `Manager Agent` pages to the Operator Studio shell with full action handlers, display builders, auto-fetch hooks, and per-page help
- added 212-assertion integration test at `tools/test-manager-agent-integration.js` covering system status, file system, manager status, directive lifecycle, avatar bridge, control-intent keyword routing, report integrity, error recording, shell wiring, cross-system integration, and edge cases
- added end-to-end build workflow test at `tools/test-manager-build-workflow.js` covering directive creation through avatar request, workflow auto-planning (6 steps), full step execution through AI runner, real program output (calculator module with 15-test harness), manager report verification, and 8 variation tests (control-intent routing, priority handling, explicit builder assignment, mid-flight cancellation, sequential avatar requests, non-manager text bypass, fresh plan-execute-complete cycle)
- verified end-to-end workflow test: 37/37 assertions passed, calculator output program 15/15 tests passed, all variation scenarios green
- added per-page testing and setup instructions to `System Status` and `Manager Agent` PAGE_HELP entries in the Operator Studio shell
- added Manager Agent System Gate (MA1–MA5) to shell completion checklist, all 5 gates PASS
## 2026-04-20

- promoted the animation importer into the active repo at `tools/anim-avatar-importer`
- added repo-local importer/log/catalog path resolution and kept legacy-root fallback only as a temporary compatibility path
- promoted the converted animation library into the active repo at `data/animation-library/converted_animations_20260401`
- updated backend library-serving code to prefer repo-local animation library paths
- updated animation workbench library selection to skip empty candidate roots and fall back to a real populated library
- updated the importer shell integration to resolve port `8888` against the current host instead of hardcoded `localhost`
- added automatic importer catalog fallback so stale catalogs rebuild when the library root changes
- verified repo-local animation imports into `playcanvas-app/assets/animations`
- documented current live status, remaining gaps, and best work order in `cleanup-hub/DEPENDENCY_BRINGUP_REPORT_2026-04-20.md`
- added a Blender-driven persona asset exporter at `tools/export_persona_assets.py`
- added a repo-local persona batch ingest runner at `tools/run-persona-asset-ingest.ps1`
- exported staged persona assets from `D:\avatars` into `cleanup-hub/persona-ingest-20260420-1630`
- corrected the persona asset classifier so Gail footwear no longer misclassifies as hair
- recorded the staged export status and follow-up decisions in `cleanup-hub/PERSONA_ASSET_INGEST_REPORT_2026-04-20.md`

## 2026-04-21

- recorded the operator decision that Gail's current hair look is the shared default for Gail, Cherry, and Vera
- documented that future uploaded hair variants should become selectable and eventually switch by time-of-day and weather alongside clothing logic
- clarified that the product decision is ahead of the current automation because `gail.blend` still does not emit a distinct staged hair export in the current split pass
- updated the runtime manifest so Vera and Cherry now resolve their persona hair slots to Gail's shared hair asset instead of separate persona-specific hair files
- documented the manifest-level shared-hair implementation in `cleanup-hub/SHARED_HAIR_RUNTIME_MAPPING_2026-04-21.md`
- started the live repo stack and verified through `/client/asset-manifest` and `/client/wardrobe-presets` that Gail, Vera, and Cherry now resolve to the same shared runtime hair asset while keeping separate persona hair slot ids
- added a staging-only startup override so `/client/work-lite/?allowPersistedPersona=1` can honor backend persona state without changing the normal default route behavior
- upgraded the persona probe tool so it can boot startup-only personas, record failed requests, and record non-2xx asset responses
- documented the current direct-boot persona results in `cleanup-hub/WORKLITE_PERSONA_STAGING_AUDIT_2026-04-21.md`
- confirmed current remaining runtime stalls:
  - Cherry stops at `Loading Cherry dress...`
  - Vera stops at `Loading Vera jeans...`
  - normal-mode headless screenshots can still look visually wrong even when the status reaches `Scene ready`
- fixed Gail avatar axis/scale export drift by normalizing Blender armature/skinned-mesh transforms before GLB export
- regenerated the active Gail body and wardrobe GLBs from `D:\avatars\Gail\gail.blend`
- added `tools/check-gltf-root-contract.js` as a reusable guard against non-identity GLB root transforms
- verified Gail is now upright and correctly scaled in the live `work-lite` client while noting that wardrobe completion is still a separate outstanding issue
- added `tools/export_cherry_runtime.py` and `tools/run-cherry-runtime-refresh.ps1` to refresh Cherry directly into the live runtime asset contract
- promoted new Cherry body, dress, shoes, and optional hair GLBs from `D:\Avatars\Cherry\Cherry.blend` into `playcanvas-app/assets/gail/girlfriend/...`
- verified the promoted Cherry GLBs against the root-transform guard and recorded the run artifacts in `cleanup-hub/cherry-runtime-refresh-20260421-live2`
- captured a stable live Cherry proof showing refreshed body/dress/shoes with correct orientation and scale, but with stretched shared hair and rest pose still unresolved
- tested Cherry's own hair mapping and confirmed it currently causes a worse wardrobe-load stall, so the active config was left on shared-hair mapping while the refreshed `cherry_hair.glb` remains promoted on disk

## 2026-04-22

- corrected the Gail lite refresh path so it no longer silently reuses the archived pre-refresh Gail hair fallback
- regenerated `gail_lite` from the current `D:\Avatars\Gail\gail.blend` upload and recorded the run artifacts under:
  - `cleanup-hub/gail-lite-runtime-refresh-20260422-current-hair`
  - `cleanup-hub/gail-lite-runtime-refresh-20260422-low-profile`
- promoted the low-profile Gail lite package into the active runtime asset root
- verified `/client/asset-manifest?assetRoot=gail_lite` now resolves `meili_hair` to the freshly exported Gail lite hair file
- captured fresh normal Gail proofs in:
  - `docs/reports/worklite-persona-normal-20260422-093603.json`
  - `docs/reports/worklite-persona-normal-20260422-093603.png`
  - `docs/reports/worklite-persona-normal-20260422-094103.json`
  - `docs/reports/worklite-persona-normal-20260422-094103.png`
- confirmed the remaining Gail issue is no longer missing source hair; the current low-profile proof shows the Gail hair asset loading but attaching/rendering incorrectly, with a detached skull-cap/hair chunk appearing by Gail's feet
- traced the Gail hair floor bug to exported Gail hair mesh positions rather than missing files, wrong persona routing, or unresolved runtime bones
- updated `playcanvas-app/src/work-lite-rebuild.ts` so body and modular garment render roots are rebound to the resolved skeleton root before skin rebinding
- updated `tools/export_gail_split.py` with a Gail hair post-export correction that derives the head-space rest offset from the exported head inverse bind matrix and translates Gail hair `POSITION` accessors before promotion
- regenerated both `gail_lite` and `gail` from the corrected exporter and recorded the promotion runs under:
  - `cleanup-hub/gail-lite-runtime-refresh-20260422-hair-floor-fix`
  - `cleanup-hub/gail-runtime-refresh-20260422-hair-floor-fix`
- captured the corrected live proof in:
  - `docs/reports/worklite-persona-normal-20260422-100946.json`
  - `docs/reports/worklite-persona-normal-20260422-100946.png`
- documented the full fix boundary in `cleanup-hub/GAIL_HAIR_FLOOR_FIX_2026-04-22.md`
- created 	ools/export_vera_runtime.py and 	ools/run-vera-runtime-refresh.ps1; ran Vera runtime promotion replacing April-14 ingest assets with April-22 exports; run artifact at cleanup-hub/vera-runtime-refresh-20260422-112223/
- updated playcanvas-app/index.html version strings to 20260422-vera-refresh
- diagnosed and fixed stale client serving: backend was running from C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy (OneDrive Desktop copy) while all edits went to D:\Gail 2.1\working_copy (VS Code workspace); copied current index.html and dist JS to the OneDrive Desktop backend root; server now returns correct 20260422-vera-refresh version; see Decision 2026-04-22-05 in DECISION_LOG.md for the two-working-copy finding

## 2026-04-23

- removed the temporary Gail brow isolate from `playcanvas-app/src/work-lite-rebuild.ts` before importing the next Gail source refresh
- updated `tools/export_gail_split.py` to classify the new Gail blend mesh names correctly:
  - `Genesis 8 Female.Shape`
  - `Voss Hair Genesis 8 Female.Shape`
  - `MK Short T-shirt.Shape`
  - `Urban Action Pants.Shape`
  - `Angie Sneakers.Shape`
- imported the fresh Gail source from `D:\Avatars\Gail\gail.blend` into both active runtime roots:
  - `playcanvas-app/assets/gail/...`
  - `playcanvas-app/assets/gail_lite/...`
- recorded the import runs in:
  - `cleanup-hub/gail-runtime-refresh-20260423-new-gail-v2`
  - `cleanup-hub/gail-lite-runtime-refresh-20260423-new-gail-v2`
- updated the client cache key to `20260423-new-gail1`
- rebuilt the PlayCanvas app and synced the new Gail assets plus rebuilt `work-lite` bundle to the live C working copy
- verified the live manifest now resolves the refreshed `gail_lite` package from the new source with sizes:
  - body `43918416`
  - hair `13952556`
  - top `8422736`
  - pants `7330360`
  - footwear `2011560`
- fixed the new Gail Voss hair placement by teaching `tools/export_gail_split.py` to skip the old floor-hair translation when hair vertices are already in head/body space
- reran both Gail runtime exports under:
  - `cleanup-hub/gail-runtime-refresh-20260423-hair-yfix`
  - `cleanup-hub/gail-lite-runtime-refresh-20260423-hair-yfix`
- added a client asset cache salt `20260423-gail-hair-yfix1` so browsers do not reuse the lifted hair GLB URL when the corrected GLB has the same file size
- softened runtime hair rendering by raising hair alpha cutout to `0.22`, reducing gloss/specular/shininess caps, and bumping the live cache key to `20260423-hair-softcut1`
- applied a second runtime hair material softening pass with `alphaTest = 0.32`, `glossCap = 0.006`, `shininessCap = 3`, and cache key `20260423-hair-softcut2`
- reverted the two softcut passes after top hair disappeared, restored `alphaTest = 0.08` and the prior gloss/specular caps, and tried back-face culling with cache key `20260423-hair-cull1`
- consolidated avatar runtime data into `data/client/avatar-runtime.json` and rewired runtime settings, asset manifest, wardrobe presets, and `work-lite` persona mapping to read from that single source
- locked the operator-confirmed client/avatar state as a known-good fallback at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`
- verified the fallback point with backend, PlayCanvas, and control panel builds plus backend tests passing `121/121`
- cleaned old generated artifacts and test results from the D working copy and live C mirror, freeing approximately `33.36 GB`
- added cleanup guardrails in `.gitignore`, `cleanup-hub/CLEANUP_PASS_2026-04-23.md`, and `tools/clean-generated-artifacts.ps1`
- cleaned top-level `D:\` clutter by deleting approximately `66.25 GB` of caches/temp/download/build/report output and moving approximately `3.50 GB` of old reference material to `D:\Gail 2.1\legacy-hold\20260423-top-level-review`
- tuned `work-lite` animation playback/transitions for a slower, smoother natural feel with cache key `20260423-anim-natural1`
- added randomized grouped facial micro movement to `work-lite` with cache key `20260423-face-micro1`
- added randomized body-alive breathing, posture, weight-shift, and long-response breath pauses to `work-lite` with cache key `20260423-body-alive1`
- locked the operator-confirmed body-alive version as a known-good fallback at `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`
- cleaned up `work-lite` wake/listening behavior with fuzzy Gail/Gale/Gael/Gal wake matching, context-aware voice buffer phrases, and cache key `20260423-voice-wake1`
- changed the persisted and default local Ollama model to `dolphin-mistral:7b`, including Cherry/private-girlfriend, and verified the live provider endpoint reports Dolphin as effective
- added an always-listening ambient guard to reduce TV/music/background false submissions and bumped the client cache key to `20260423-voice-ambient1`
- tightened self-hearing prevention across all Gail speech paths, including queued browser speech and OpenAI/audio playback, with cache key `20260423-voice-selfguard1`
- consolidated voice behavior into `data/voice/voice-settings.json` `runtime`, wired it through `/voice/settings`, exposed the tuning controls in the operator shell, and bumped the client cache key to `20260423-voice-config1`
- reorganized the `Providers & Voice` shell page into grouped sections so provider/model, persona routing, voice basics, wake/timing, ambient guard, and phrase banks are easier to manage without code edits
- added `docs/ANIMATION_TRIGGER_IMPLEMENTATION_BASELINE_2026-04-23.md` to merge the master animation plans, action composer plan, and current `work-lite` runtime into one implementation contract for states, triggers, and build order
- added `docs/ENVIRONMENT_INTEGRATION_LOCK_PLAN_2026-04-23.md` to lock the environment source strategy, DAZ compatibility ruling, texture targets, and optimized GLB import path for the first real 3D environment
- assessed `D:\Gail 2.1\brutalist_loft.glb` in `docs/ENVIRONMENT_CANDIDATE_BRUTALIST_LOFT_2026-04-23.md` and marked it `GO for optimization pass`, with texture density identified as the primary cleanup target
- ran `D:\Gail 2.1\brutalist_loft.glb` through Blender with `tools/optimize_environment_glb.py`, producing a `2048`-capped runtime candidate at `data/environment/candidates/brutalist_loft/brutalist_loft_optimized_2k.glb` and reducing size from about `64.8 MB` to `15.9 MB`
- imported the optimized brutalist loft into the live PlayCanvas asset tree at `playcanvas-app/assets/environments/brutalist_loft/brutalist_loft_optimized_2k.glb`
- added `playcanvas-app/assets/environments/environment-profiles.json` as the runtime environment source with explicit skybox bounds exclusions for `Object_40` / `Skybox_17`
- switched the laptop device staging scene in `data/client/device-display-profiles.json` to `brutalist_loft`
- updated `work-lite` to load environment profiles, center/floor the room from measured filtered bounds, hide the generated plane floor when the loft is active, and expose the selected scene id in the shell state panel
- added a live `Stage Tune -> Environment` panel in `work-lite` so environment offset, rotation, and scale can be adjusted manually in-browser, stored locally per scene, and copied back out as exact JSON values before promoting to config
- documented the measured runtime integration pass in `docs/ENVIRONMENT_BRUTALIST_LOFT_RUNTIME_INTEGRATION_2026-04-23.md`, including the no-extra-rotation ruling and the required visual confirmation checklist
- added root-filter support to `tools/export_environment_from_blend.py` so environment conversion can keep only the intended hierarchy and record removed objects in the export report
- converted `D:\Gail 2.1\env.blend` into a filtered `Modern Country Home` runtime candidate by keeping only `Modern Country Home.Node`, removing unrelated motorcycles / island / bedroom-bathroom blocks, and capping oversized textures to `2048`
- produced the cleaned candidate under `data/environment/candidates/modern_country_home/` with runtime GLB size `51276684` bytes and documented the result in `docs/ENVIRONMENT_MODERN_COUNTRY_HOME_RUNTIME_INTEGRATION_2026-04-23.md`
- promoted `playcanvas-app/assets/environments/modern_country_home/modern_country_home_optimized_2k.glb` into the live asset tree
- added `modern_country_home` to `playcanvas-app/assets/environments/environment-profiles.json`
- switched laptop staging in `data/client/device-display-profiles.json` from `brutalist_loft` to `modern_country_home`
- fixed `work-lite` avatar staging so device-profile `staging.avatarTransform` is actually read and used as the avatar base transform instead of being ignored
- changed avatar stage tuning to be additive/multiplicative relative to that base transform instead of overwriting raw local values from zero
- added `avatarStandEntityNames` support to environment profiles and anchored `modern_country_home` avatar placement to `MCH Floor` so Gail stages from the actual room floor instead of raw world origin
- bumped the live client cache tag to `20260423-env-stagefix1`
- fixed the `Stage Tune` form behavior so environment/avatar/camera inputs no longer re-render the entire panel on every keystroke, which had made manual value entry effectively unusable
- bumped the live client cache tag again to `20260423-env-stagefix2`
- replaced the axis-style stage panel with directional controls that expose real `Left / Right`, `Up / Down`, `In / Out`, turn/tilt/roll, and size buttons around each value field
- kept direct numeric entry for exact values while adding nudge buttons that actually apply changes immediately
- bumped the live client cache tag to `20260423-env-controls2`
- stopped trying to tune staging from the sidebar and replaced it with a viewport gizmo overlay attached to the stage canvas
- added in-scene toolbar controls for target selection (`Avatar`, `Environment`, `Camera`), mode selection (`Move`, `Rotate`/`Aim`, `Scale`), and step size (`Fine`, `Medium`, `Coarse`)
- added object-attached viewport controls for left/right, up/down, in/out plus rotate/scale variants, with press-and-hold repeating nudge behavior
- simplified the side panel to a viewport staging summary with `Reset Selected` and `Copy Values`
- bumped the live client cache tag to `20260423-env-gizmo1`
- added a persistent bottom-left viewport movement dock so `Environment` controls still work even when the room anchor/gizmo is off-screen or in a useless location
- bumped the live client cache tag to `20260423-env-gizmo2`
- corrected the `modern_country_home` room export path so the Daz/Blender handoff transform is normalized in Blender export instead of being guessed around in the client
- updated `tools/export_environment_from_blend.py` with `--normalize-root-transform` so filtered environment exports can reparent a transformed source root to an identity staging root before GLB export
- re-exported `D:\Gail 2.1\env.blend` into `data/environment/candidates/modern_country_home/modern_country_home_optimized_2k.glb` and promoted the result to `playcanvas-app/assets/environments/modern_country_home/modern_country_home_optimized_2k.glb`
- verified the corrected room export still imports at world bounds `min [-8.0991, -6.4709, -0.0779]` / `max [8.0991, 6.4709, 6.1714]` instead of the broken oversized result from the earlier post-export root-bake attempt
- versioned `modern_country_home` staging storage as `root-contract-1` in `playcanvas-app/assets/environments/environment-profiles.json` so stale browser-saved environment/avatar/camera offsets are no longer loaded on top of the corrected room
- updated `work-lite` staging persistence to use environment profile storage scopes and bumped the live client cache tag to `20260423-env-restage1`
- brightened interior environment lighting by raising stage ambient, increasing base key/fill intensity, and adding a bounds-scaled `zip-interior-light` that activates only when a room environment is loaded
- bumped the live client cache tag to `20260424-env-light1`
- split environment lighting into clock-driven day/night rigs in `work-lite`
- kept the current interior-biased setup as the night rig and added exterior-style daylight `zip-day-sun-light` / `zip-day-sky-light` directional sources for daytime
- switched the client off the local machine clock with daytime running from `07:00` to `18:59` and night from `19:00` to `06:59`
- bumped the live client cache tag to `20260424-env-daynight1`
- corrected the day pass so it also switches the camera/world background to a sky color and keeps interior fill active instead of dropping the room into a black void
- bumped the live client cache tag to `20260424-env-daynight2`
- added a real exterior daylight flood rig with `zip-day-flood-light` and `zip-day-fill-flood-light`, positioned from measured room bounds and aimed inward so daytime is lit from outside the environment instead of only by interior bulbs
- bumped the live client cache tag to `20260424-env-dayflood1`
- replaced the first day flood attempt with a stronger three-point exterior point-light rig: left flood, right fill flood, and roof flood
- bumped the live client cache tag to `20260424-env-dayflood2`
- fixed the actual room asset by re-exporting `modern_country_home` with transparent window glass material tuning:
  - `alpha = 0.12`
  - `transmission = 1`
  - `metallic = 0`
  - low roughness
- bumped the client asset version salt and live cache tag to `20260424-env-window1` so the corrected GLB is re-fetched instead of using the old cached room
- added a repo-owned outdoor backdrop image for `modern_country_home` at `playcanvas-app/assets/environments/backdrops/mountain_lake_day_96518.jpg`
- extended `environment-profiles.json` so `modern_country_home` can declare a `dayBackdropImagePath`
- updated the day rig in `work-lite` so daytime uses:
  - a stronger white sun direction from avatar-right
  - a brighter right-side exterior flood
  - a softer left fill flood
  - a large outdoor backdrop plane outside the room instead of relying on purple/clear-color through the windows
- reduced daytime ambient wash so the added exterior sources do more of the actual room lighting work
- bumped the client asset/version tag to `20260424-env-backdrop1`
- rebuilt the day/environment pass from PlayCanvas docs guidance:
  - color backdrop texture assets now load as `texture` assets with sRGB encoding
  - added a dedicated daytime interior bounce light instead of relying only on ambient wash
  - added dual backdrop planes so the room has both a camera-opposite outdoor image plane and a fixed right-side window-wall plane
  - raised daylight sun / sky / flood / roof intensities and daytime interior support
- added a runtime glass-material pass for environment materials containing `glass` so the windows stay visually open enough for the exterior backdrop to read
- bumped the client asset/version tag to `20260424-env-backdrop3`
- replaced the multi-plane backdrop experiment with a single wraparound backdrop shell so the exterior surrounds the full scene instead of appearing sideways/upside-down in individual windows
- pulled the day rig back from the blown-out state by lowering day ambient, sun, flood, roof, and interior-bounce intensities while keeping daytime interior support active
- bumped the client asset/version tag to `20260424-env-backdrop4`
- copied the selected realistic mountain/lake image into repo runtime assets at `playcanvas-app/assets/environments/backdrops/mountain_lake_realistic_primary.jpg`
- switched `modern_country_home.dayBackdropImagePath` to the new realistic backdrop asset
- added a dedicated interior ceiling-down flood light (`zip-ceiling-flood-light`) and derived its position/range from measured environment bounds
- tuned the ceiling flood to stay subtle in day mode and slightly stronger in night mode for the requested overhead interior wash
- warmed the night interior balance (ambient + interior color/intensity) for a cozy look
- changed night backdrop behavior from hidden to visible with warm emissive grading so day and night both use the same selected image
- bumped the client asset/version tag to `20260424-env-backdrop5`
- verified TypeScript build passes and work-lite reaches `Scene ready` at `http://127.0.0.1:4180/client/work-lite/`
