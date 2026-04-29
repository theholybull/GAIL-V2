# Professional Shell Build Plan

## Date

2026-04-02

## Status Update (2026-04-02)

- Unity runtime folder cleanup completed from active repo path.
- Avatar/runtime builder pages are now live-wired (not scaffold-only).
- Action Graph and Gesture/Expression pages are now live-wired.
- Current focus shifted to polish, guardrails, and release hardening.

Related artifacts:

- `docs/FORWARD_PLAN_SHELL_20260402.md`
- `docs/reports/SHELL_CLEANUP_AND_BUILD_LOG_20260402.md`

## Context

Current shell assets already exist and are live:

- `web-control-panel/operator-studio-shell.html`
- `web-control-panel/src/operator-studio-shell.js`
- `web-control-panel/src/styles/operator-studio-shell.css`
- served at `http://127.0.0.1:4180/panel/operator-studio-shell.html`

Current backend is up and reachable:

- `GET /health` -> `200`
- shell route -> `200`

This plan defines how to move from the current browser shell prototype to a professional operator shell.

## Product Goal

Deliver a stable, fast, operator-first shell that can run all Gail operations from one coherent workspace with:

- predictable performance on long sessions
- complete wiring to real backend/runtime surfaces
- clear safety and review controls for sensitive actions
- upgrade path to desktop container when approved
- clear path from internal prototype to marketable pilot surface

## Non-Goals For This Phase

- final client-facing consumer UX polish
- replacing backend domain model
- full animation-runtime redesign

## Build Principles

- keep operator shell as the primary control center
- preserve existing `Submit Changes` workflow on every page
- ship vertically: each milestone must be runnable and testable
- keep safety gates explicit for approvals, pairing, and external actions

## Phased Roadmap

## Phase 1: Stabilize Current Shell

Objective:

- harden the existing browser shell into a reliable daily-use surface

Deliverables:

- normalize shell routing and navigation state
- unify API error handling + response logging
- add page-level loading/empty/error states
- add smoke checks for all currently wired pages

Acceptance criteria:

- shell boot < 2s on local machine
- no uncaught errors during basic operator flow
- all wired actions visibly report success/failure

## Phase 2: Wire High-Value Pages

Objective:

- convert scaffolded shell pages into real operator tools

Deliverables:

- Avatar Library wired to backend asset manifest + runtime settings
- Wardrobe Manager wired to module selection/presets
- Animation Library wired to available clips + quick preview actions
- Action Graph editor v1 (view + edit + save basic mappings)

Acceptance criteria:

- operator can browse assets, choose configuration, and persist settings
- operator can inspect clip inventory and trigger preview flow

## Phase 3: Professional UX and Workflow Controls

Objective:

- make the shell operationally robust for long sessions

Deliverables:

- command palette actions mapped to all critical operations
- keyboard-first workflow (focus, hotkeys, quick actions)
- structured notifications + operation audit panel
- workflow review checkpoints integrated with shell task pages

Acceptance criteria:

- operator can complete common scenarios without leaving shell
- all sensitive operations expose explicit review prompts

## Phase 4: Desktop Container Decision Gate

Objective:

- decide and execute desktop packaging path if memory/perf still requires it

Candidates:

- Electron (faster integration path)
- Tauri (lower memory footprint path)

Deliverables:

- one packaged desktop shell proof-of-concept
- startup, memory, crash-recovery comparison vs browser mode
- go/no-go recommendation

Acceptance criteria:

- measured memory improvement or clear justification to remain browser-hosted

## Phase 5: Marketable Pilot Shell

Objective:

- turn the shell from an internal build surface into a defensible pilot-ready operator product

Deliverables:

- separate release-grade pages from internal or experimental pages
- define a clean demo route through the shell
- add market-facing operator guidance and onboarding path
- add shell smoke checks for pilot-critical routes and actions
- align README, operator manual, build log, and project state with the actual shell capabilities

Acceptance criteria:

- a serious reviewer can understand the shell product role in under two minutes
- a first-time operator can complete the critical demo path without hand-held developer intervention
- shell-critical routes and actions have explicit validation coverage or smoke coverage

## Immediate Execution Plan (Next 7-10 Days)

1. Shell hardening pass:
   - centralize fetch/error helpers in `src/operator-studio-shell.js`
   - standardize success/error toast + console output
2. Page wiring sprint:
   - wire Avatar Library and Wardrobe Manager first
   - add minimal persistence contract if missing
3. Add shell regression smoke script:
   - verify `/panel/operator-studio-shell.html` render
   - verify critical API endpoints used by shell
4. Add docs + build log updates:
   - operator runbook for shell-specific flows
   - milestone tracking in `docs/BUILD_LOG.md`
5. Start productization gate:
   - define marketable pilot page set
   - define demo story and onboarding path
   - add commercial readiness checkpoints

## Technical Work Breakdown

Frontend shell:

- modularize current monolithic shell script by page domain
- add shared API client layer with typed request wrappers
- add state store for active page, filters, command palette, and draft forms

Backend support:

- confirm/extend routes required by Avatar/Wardrobe/Animation pages
- expose explicit validation errors consumable by shell UI

Quality:

- add `npm.cmd run check` gate for web control panel changes
- add backend route smoke tests for shell dependencies

## Risks and Mitigations

Risk:

- shell complexity grows faster than page quality

Mitigation:

- page-by-page completion definition and acceptance checklist

Risk:

- browser memory pressure during multi-tab operation

Mitigation:

- single-shell workflow guidance now, desktop container benchmark in Phase 4

Risk:

- drift between docs and actual wired behavior

Mitigation:

- update this plan + `OPERATOR_STUDIO_HANDOFF_README.md` at each milestone

## Definition of Done (Professional Shell v1)

- all priority operator pages are real (not scaffold-only)
- consistent, resilient UX for success/error/loading states
- review/safety gates are explicit and enforced in UI
- operator can run core workflow, device/auth, provider/voice, organizer, and avatar/animation operations end-to-end
- documented build/run/test process exists and passes from clean startup
