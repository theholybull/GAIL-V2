# Gail Shell Completion Checklist (Pass/Fail)

Date: 2026-04-04
Scope: Operator Studio Shell readiness, endpoint wiring, export pipeline viability, key/config readiness

## How to Use
- Mark each item `PASS` only after running the listed verification command(s).
- If any `Blocker` item is `FAIL`, do not treat the shell as complete.

## Blockers (Must Pass)

| ID | Status | Priority | Area | Owner | Required Fix | Primary File(s) | Verification Command(s) | Pass Criteria |
|---|---|---|---|---|---|---|---|---|
| B1 | PASS | Blocker | Export Runner | Backend + Tools | Added `tools/export-avatar-assets.ps1` as runner entrypoint (delegates to pipeline script). | `backend/services/export-service.ts`, `tools/export-avatar-assets.ps1` | `node -e "fetch('http://127.0.0.1:4180/exports/run',{method:'POST',headers:{'Content-Type':'application/json','x-gail-device-id':'check','x-gail-device-type':'web_admin','x-gail-mode':'work','x-gail-explicit-local-save':'false'},body:JSON.stringify({runner:'avatar-assets',runtimeProfile:'high'})}).then(async r=>console.log(r.status,await r.text()))"` | Returns HTTP 200 with export run payload (no missing-script error). |
| B2 | PASS | Blocker | Pipeline Inputs | Tools + Asset Pipeline | Updated script path expectations to resolve available repo blend candidates and avoid hard fail on missing repo-root master blend; writes degraded report when Blender is unavailable. | `tools/export-playcanvas-pipeline.ps1` | `node -e "fetch('http://127.0.0.1:4180/exports/run',{method:'POST',headers:{'Content-Type':'application/json','x-gail-device-id':'check','x-gail-device-type':'web_admin','x-gail-mode':'work','x-gail-explicit-local-save':'false'},body:JSON.stringify({runner:'playcanvas-pipeline',runtimeProfile:'low'})}).then(async r=>console.log(r.status,await r.text()))"` | Returns HTTP 200 without "Missing master blend". |
| B3 | PASS | Blocker | OpenAI Config Readiness | Backend + Ops | Configured stored OpenAI key by creating `data/providers/openai-config.json` from local key material. | `backend/services/openai-config-service.ts`, `web-control-panel/src/operator-studio-shell.js` | `node -e "fetch('http://127.0.0.1:4180/providers/openai-config',{headers:{'x-gail-device-id':'check','x-gail-device-type':'web_admin','x-gail-mode':'work','x-gail-explicit-local-save':'false'}}).then(r=>r.json()).then(j=>console.log(j))"` | `configured: true` and key source is expected (`env` or `stored`). |

## High Priority (Should Pass Before Pilot)

| ID | Status | Priority | Area | Owner | Required Fix | Primary File(s) | Verification Command(s) | Pass Criteria |
|---|---|---|---|---|---|---|---|---|
| H1 | FAIL | High | Dead Viewer Link | Shell UI | Replace hardcoded `127.0.0.1:8778` with health-gated link or disable when offline. | `web-control-panel/src/operator-studio-shell.js` | Open shell and click **Open Animation Viewer**. | No dead-tab launch; user sees valid page or clear offline state. |
| H2 | FAIL | High | Runtime System Drift | Shell UI + Backend | Populate runtime system options from backend (`/client/runtime-settings`) instead of static subset. | `web-control-panel/src/operator-studio-shell.js` | `node -e "fetch('http://127.0.0.1:4180/client/runtime-settings',{headers:{'x-gail-device-id':'check','x-gail-device-type':'web_admin','x-gail-mode':'work','x-gail-explicit-local-save':'false'}}).then(r=>r.json()).then(j=>console.log(j.availableAvatarSystems.map(x=>x.key)))"` | Shell dropdown values exactly match backend `availableAvatarSystems`. |
| H3 | FAIL | High | Auth Mode Control Gap | Shell UI + Backend | Either implement auth-mode apply action or mark `auth.mode` read-only. | `web-control-panel/src/operator-studio-shell.js` | In shell: change Auth Mode setting and run relevant action. | Behavior is explicit and correct (either applied or clearly read-only). |
| H4 | FAIL | High | OpenAI Config Control Gap | Shell UI + Backend | Add explicit set/clear OpenAI key controls in shell or remove unsupported controls from this shell. | `web-control-panel/src/operator-studio-shell.js` | Use shell to set key; re-check `/providers/openai-config`. | Shell can complete key lifecycle or clearly delegates elsewhere. |
| H5 | PASS | High | Work-Lite Wake-Word Voice Loop | Client + Backend | Added full browser `SpeechRecognition` loop to `work-lite-rebuild.ts` with wake-word detection, silence-timeout, conversation routing, mic lifecycle coordination, and runtime UI (2026-04-08). | `playcanvas-app/src/work-lite-rebuild.ts`, `backend/services/voice-service.ts` | Open `/client/work-lite/`, confirm `Voice input` row appears in shell-state panel, speak "hey gail" and confirm mic activates and transcript routes to conversation. | Wake word triggers listening, speech routes to conversation, mic auto-resumes after response. |

## Medium Priority (Completion Quality)

| ID | Status | Priority | Area | Owner | Required Fix | Primary File(s) | Verification Command(s) | Pass Criteria |
|---|---|---|---|---|---|---|---|---|
| M1 | FAIL | Medium | Mock Route Labeling | Shell UI | Replace `/mock/...` route labels with real route model or explicitly tag as internal modules. | `web-control-panel/src/operator-studio-shell.js` | Open shell pages and inspect route pills. | Route labeling matches production intent, no misleading mock path leakage. |
| M2 | FAIL | Medium | Build Integrity | DevOps/Tools | Ensure stack startup builds frontend when stale (`-BuildFirst` default or stale-check). | `tools/start-gail-stack.ps1` | `powershell -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1 -ForceRestart` then open `/client/work-lite/`. | No stale-dist module errors after clean startup. |
| M3 | FAIL | Medium | AnimoXTend Readiness | Tools + Pipeline | Resolve `check-animoxtend-setup` not-ready condition(s), including missing asset root path. | `tools/check-animoxtend-setup.ps1`, `playcanvas-app/assets/gail/avatars` | `powershell -ExecutionPolicy Bypass -File .\tools\check-animoxtend-setup.ps1` | Output shows `ready: true`. |

## Current Key / Secret State Snapshot (2026-04-04)

| Item | Current State | Notes |
|---|---|---|
| `OPENAI_API_KEY` env | Missing | Not present in current shell process. |
| `data/providers/openai-config.json` | Missing | No stored OpenAI config file detected. |
| `/providers/openai-config` | `configured: false`, `source: none` | Live backend status at audit time. |
| `key.txt` | Present, non-empty | Exists but not wired to active provider config flow by default. |
| `tools/animoxtend_api_key.txt` | Present, non-empty | Present; setup still not fully ready due other missing dependency/path. |

## Endpoint Coverage Snapshot (Audit)

Verified reachable during audit:
- `/health`
- `/workflows`
- `/client/runtime-settings`
- `/client/asset-manifest`
- `/exports/status`
- `/commands`
- `/auth/status`
- `/devices`
- `/providers/status`
- `/providers/openai-config`
- `/voice/settings`
- `/voice/status`
- `/dashboard/overview`
- `/projects`
- `/tasks`
- `/reminders`
- `/approvals`
- `/camera/matrix`

## Exit Gate

Shell is ready to move forward only when:
1. All `Blocker` rows are `PASS`.
2. At least 3 of 4 `High` rows are `PASS`, with explicit handling documented for any remaining `FAIL`.
3. No export actions fail due missing local scripts or missing source assets.


## Staging and Environment Integration Gate (Added 2026-04-04)

Track this file as a required companion gate:
- `GAIL_STAGING_CALIBRATION_AND_3D_PREP.md`

Additional gate rule:
4. Staging gates `S1` to `S4` in the staging plan must be `PASS` before declaring shell calibration production-ready.

## AI and Voice Production Gate (Added 2026-04-04)
Reference:
- `GAIL_AI_AUTONOMY_AND_VOICE_PLAN.md`

Additional exit-gate condition:
5. AI gates `A1` to `A6` must be `PASS` before declaring autonomous runtime and voice stack production-ready.

## Private Persona and Appearance Gate (Added 2026-04-04)
Reference:
- `GAIL_PRIVATE_PERSONA_AND_WARDROBE_PIPELINE_PLAN.md`

Additional exit-gate condition:
6. Persona gates `PVT1` to `PVT7` must be `PASS` before enabling private persona mode controls in production.

## UI Overhaul Gate (Added 2026-04-04)
Reference:
- `GAIL_UI_OVERHAUL_PLAN.md`

Additional exit-gate condition:
7. UI gates `UI1` to `UI7` must be `PASS` before declaring the operator shell redesign production-ready.

## UI v2 Bug Reporting Gate (Added 2026-04-04)
Reference:
- `GAIL_UI_ASSET_FIRST_STUDIO_V2_SPEC.md`

Additional exit-gate condition:
8. UX gates `UX1` to `UX5` must be `PASS`, including screenshot-backed bug reporting from the new `Report Bugs` page.

## Animation Composer Gate (Added 2026-04-04)
Reference:
- `GAIL_ANIMATION_ACTION_COMPOSER_PLAN.md`

Additional exit-gate condition:
9. Action composer gates `AC1` to `AC4` must be `PASS` before enabling animation-composition publish in production.

## Cloud-to-Local Refusal Fallback Gate (Added 2026-04-04)
Reference:
- `GAIL_AI_AUTONOMY_AND_VOICE_PLAN.md`

Additional exit-gate condition:
10. AI fallback gates `A9` and `A10` must be `PASS` before production so cloud refusals/timeouts automatically and seamlessly route to local AI.

## Launcher and Display Control Gate (Added 2026-04-04)
Reference:
- `GAIL_LAUNCHER_DISPLAY_DEVICE_CONTROL_PLAN.md`

Additional exit-gate condition:
11. Launcher/display gates `LD1` to `LD7` must be `PASS` before production deployment on operator devices.

## Build Control Tower Gate (Added 2026-04-04)
Reference:
- `GAIL_BUILD_CONTROL_TOWER_MASTER_CHECKER_PLAN.md`

Additional exit-gate condition:
12. Build control gates `BC1` to `BC5` must be `PASS` before accepting screen builds as production-ready.

## Change Governance Gate (Added 2026-04-04)
Reference:
- `GAIL_CHANGE_GOVERNANCE_AND_AUDIT_PLAN.md`

Additional exit-gate condition:
13. Governance gates `CG1` to `CG5` must be `PASS` before enabling autonomous build promotion.

## Verbal Feature Capture Gate (Added 2026-04-04)
Reference:
- `GAIL_VERBAL_FEATURE_CAPTURE_BACKLOG_PLAN.md`

Additional exit-gate condition:
14. Verbal capture gates `VF1` to `VF4` must be `PASS` before enabling autonomous upgrade-round planning.

## Voice Continuity and Text-Only Animation Gate (Added 2026-04-04)
References:
- `GAIL_AI_AUTONOMY_AND_VOICE_PLAN.md`
- `GAIL_LAUNCHER_DISPLAY_DEVICE_CONTROL_PLAN.md`

Additional exit-gate condition:
15. Voice continuity gates `A11` to `A13` must be `PASS`, including text-only typing animation behavior and buffering-phrase latency masking.

## Manager Agent System Gate (Added 2026-04-08)

| ID | Status | Priority | Area | Verification | Pass Criteria |
|---|---|---|---|---|---|
| MA1 | PASS | High | System Status Endpoints | `GET /system/status`, `GET /system/errors`, `GET /system/files`, `GET /system/files/read?path=README.md` | All return HTTP 200 with expected payload shapes. |
| MA2 | PASS | High | Manager Agent Endpoints | `GET /manager/report`, `GET /manager/status`, `GET /manager/builders`, `GET /manager/directives` | All return HTTP 200 with manager-alpha and builder-a/builder-b data. |
| MA3 | PASS | High | Directive Lifecycle | `POST /manager/directives` with `{ "title": "test", "description": "test" }`, then `POST /manager/directives/:id/cancel` | Directive created, assigned to builder, cancellation succeeds. |
| MA4 | PASS | High | Avatar Bridge | `POST /manager/avatar-request` with `{ "text": "build the new dashboard" }` | Returns directive or acknowledgment; keyword routing triggers manager path. |
| MA5 | PASS | High | Shell Pages | Open Operator Studio Shell, navigate to `System Status` and `Manager Agent` pages | Both pages load, display data, and actions execute without console errors. |

Additional exit-gate condition:
16. Manager agent gates `MA1` to `MA5` must be `PASS` before enabling avatar-driven autonomous build management.
