# Gail UI Asset-First Studio v2 Spec (Selected Style 4)

Date: 2026-04-04
Status: Planning approved for implementation
Base shell observed at:
- `web-control-panel/operator-studio-shell.html`
- `web-control-panel/src/operator-studio-shell.js`
- `web-control-panel/src/styles/operator-studio-shell.css`

## Selected Direction
Chosen visual/interaction model: `Mockup 4 - Asset-First Studio`.

Primary objective:
- Make core work possible from one screen with obvious paths for total beginners.

## Layout Blueprint (Asset-First Studio)
Top bar:
- Workspace tabs: `Viewport`, `AI Workflow`, `Scene Build`, `Ops`, `Report Bugs`
- Global quick controls: profile, provider, voice, quality, save layout, command palette

Main body:
1. Left column: `Asset Library + Persona Tabs`
- Persona tabs: `Main`, `Private Counselor`, `Private Girlfriend`
- Asset categories: body/hair/clothing/accessories/animations/backgrounds
- Search + filters + compatibility badges

2. Center column: `Live Stage`
- Avatar scene viewport with staging and safe-frame overlays
- Drag-drop target for assets
- Direct transform gizmos and camera presets

3. Right column: `Inspector`
- Selected item properties (transform/material/slot)
- Inheritance policy toggles
- Pipeline actions (import/normalize/publish)

4. Bottom rail: `Jobs and Diagnostics`
- Import queue
- Conversion status
- Runtime validation
- Error/warning feed

## Noob-First Help System (Required on Every Page)
Current shell note:
- Existing `PAGE_HELP`, `Guided Mode`, and `Quick Start` already exist and should be retained.

v2 requirement:
- Every page must expose a pinned `Start Here` block with:
  1. What this page does in plain language
  2. First 3 actions to click
  3. What success looks like
  4. If broken, exact next check

Help quality rules:
- No jargon without glossary term.
- Every critical button has one-line explanation.
- Every page has at least one 60-second checklist for a beginner.

## New Page: Report Bugs
Add top-level page: `Report Bugs` (not hidden in Ops).

### UX Requirements
Panel A: `Quick Capture`
- Button: `Capture Screenshot`
- Button: `Capture + Report` (one-step)
- Field: summary (required)
- Field: reproduction steps
- Auto fields: page/workspace, timestamp, active mode, runtime profile

Panel B: `Issue Log`
- Shows saved issues in reverse chronological order
- Filters: `open`, `in progress`, `blocked`, `done`
- Actions: assign status, add note, link to pass-review note, archive

Panel C: `Attachments`
- Screenshot thumbnail preview
- Open full image
- Add additional screenshot

### Screenshot Behavior
- Default capture target: main shell viewport container.
- Optional full-window capture toggle.
- Store image as PNG with deterministic naming:
  - `bug_<yyyyMMdd_HHmmss>_<pageId>.png`

### Data Storage Contract
Local-first storage path:
- `data/reports/bug-log.json`
- `data/reports/screenshots/`

Issue record schema (minimum):
- `id`
- `title`
- `details`
- `status`
- `createdAt`
- `workspace`
- `pageId`
- `mode`
- `runtimeProfile`
- `screenshotPaths[]`
- `notes[]`

### API Endpoints to Add (planned)
- `POST /reports/bugs`
- `GET /reports/bugs`
- `PATCH /reports/bugs/:id`
- `POST /reports/bugs/:id/screenshot`

## Click Paths (Top 5 Tasks)
1. Swap persona clothing
- Scene Build -> Persona tab -> drag clothing -> validate -> apply

2. Fix staging/framing
- Viewport -> framing tools -> lock profile -> verify safe frame

3. Build/run AI workflow
- AI Workflow -> create -> plan -> run ready -> inspect logs

4. Report visual bug
- Report Bugs -> Capture + Report -> save -> appears in issue log

5. Check system health
- Ops -> provider/device/runtime panels -> confirm green status

## File/Module Mapping for Build
Frontend:
- `web-control-panel/operator-studio-shell.html`
- `web-control-panel/src/operator-studio-shell.js`
- `web-control-panel/src/styles/operator-studio-shell.css`

Backend (new reports service/routes):
- `backend/api/domain-http-routes.ts`
- `backend/api/validators.ts`
- `backend/services/` (new bug-report service)

Storage:
- `data/reports/bug-log.json`
- `data/reports/screenshots/*`

## Pass/Fail Gates (v2)
| ID | Status | Priority | Area | Requirement | Verification | Pass Criteria |
|---|---|---|---|---|---|---|
| UX1 | FAIL | Blocker | Asset-First Layout | Workspace uses asset-left/stage-center/inspector-right structure | Open each workspace and inspect panel arrangement | Layout consistent and discoverable |
| UX2 | FAIL | Blocker | Noob Help Coverage | Every page has Start Here + quick steps + success/troubleshoot | Navigate all pages | No page without beginner help section |
| UX3 | FAIL | Blocker | Bug Reporting | Report Bugs page can capture screenshot and create log entry | Create 3 sample issues with screenshots | Entries persist with image links |
| UX4 | FAIL | High | Workflow Speed | Core tasks complete with <= 2 context switches | Execute top 5 task script | All 5 tasks complete without hunting through menus |
| UX5 | FAIL | High | Responsive Framing | Primary controls remain visible at desktop/tablet/mobile targets | Resize and run viewport tests | No critical controls off-screen |
| UX6 | FAIL | Medium | Debug Throughput | Bug log supports status updates and re-open flow | Update sample issues through statuses | State transitions persist and are auditable |

## Implementation Sequence
1. Refactor existing shell nav into workspace tabs (reuse current page definitions as modules).
2. Introduce Asset-First layout containers and panel docking behavior.
3. Standardize and enforce per-page Start Here help template.
4. Add Report Bugs page and screenshot capture UI.
5. Add backend bug report storage endpoints.
6. Connect Report Bugs with Pass Review for remediation tracking.

## Non-Negotiable Rules
- Every operator-facing page must be usable by a first-time user without external docs.
- Every bug report must support screenshot evidence.
- No critical control hidden behind deep settings when it belongs in active workspace.

## Animation Action Composer Track (Added 2026-04-04)

A dedicated drag-drop animation composition plan has been added:
- `GAIL_ANIMATION_ACTION_COMPOSER_PLAN.md`

This track uses Blender as the transition/gap-fill engine and requires:
- viewport auto-preview,
- approve/save vs send-back-for-correction review flow,
- beginner help coverage on the composer page.

## Launcher + Display Device Control Track (Added 2026-04-04)

A dedicated launcher/display/device-control plan has been added:
- `GAIL_LAUNCHER_DISPLAY_DEVICE_CONTROL_PLAN.md`

This track covers:
- desktop start/stop shortcuts,
- per-device staging/display profiles,
- wake_word/always_listening/typed display input modes,
- top-right runtime menu with voice-command parity.

## Build Control Tower Track (Added 2026-04-04)

A dedicated build-control plan has been added:
- `GAIL_BUILD_CONTROL_TOWER_MASTER_CHECKER_PLAN.md`

This track requires:
- master checker AI overseeing build agents,
- step-by-step approval submissions,
- mandatory screenshot capture + analysis for every screen change,
- full script registry with run/results controls.

## Change Governance + Audit Memory Track (Added 2026-04-04)

A dedicated governance plan has been added:
- `GAIL_CHANGE_GOVERNANCE_AND_AUDIT_PLAN.md`

This track requires:
- pre-approval snapshot backups,
- immutable change ledger,
- explicit user approval before safe/promotion state,
- rollback to approved states,
- avatar/display access to complete change history and rationale.

## Voice Continuity + Texting Animation Track (Added 2026-04-04)

Added requirements include:
- listen-timeout and response-loop continuity across all verbal channels,
- push-to-talk parity on work client,
- text-only typing animation state,
- context-sensitive buffering phrases for STT/AI/TTS latency masking.
