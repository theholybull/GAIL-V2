# Forward Plan: Professional Operator Shell

## Date

2026-04-02

## Current Baseline

- Active shell: `web-control-panel/operator-studio-shell.html`
- Active runtime path: PlayCanvas + backend client runtime settings + asset manifest
- Unity runtime project removed from active repo path (`rebuild/unity` deleted)
- Builder Core pages now live-wired for:
  - avatar/runtime system controls
  - wardrobe and asset validation reads
  - animation diagnostics and viewer launch
  - action graph command listing and execution
  - gesture profile application via voice settings

## Objective

Ship a polished, professional shell that is stable for daily operator use, visibly safe for sensitive actions, and reliable for avatar/animation runtime operations.

## Phase Plan

### Phase 1: Shell Reliability Hardening (Next 1-2 Days)

Status: In progress (core implementation completed on 2026-04-02; final UX sweep pending).

1. Add explicit loading skeletons for every action surface and display panel.
2. Add retry/backoff for transient API failures on read-only fetch actions.
3. Add per-page health summary row (data freshness + last successful sync time).
4. Lock down command execution UX with stronger validation and actionable failure hints.

Exit Criteria:
- No uncaught UI errors in a 30-minute operator session.
- Every failed action shows clear remediation guidance.

### Phase 2: Professional UX Polish (Next 2-3 Days)

1. Standardize visual hierarchy across panels (labels, spacing, control density).
2. Add keyboard-first navigation for page switch, action trigger, and command execution.
3. Add operator audit stream panel for high-signal actions (runtime changes, command executions, voice profile changes).
4. Improve mobile/compact drawer transitions and focus trapping for dialogs.

Exit Criteria:
- Keyboard-only operator flow is complete for critical operations.
- Action and state transitions are clear without relying on console logs.

### Phase 3: Guardrails and Operational Safety (Next 2-3 Days)

1. Add confirmation patterns for sensitive operations (runtime system switching, device/auth mutations).
2. Add “dry run” mode for shell actions where backend supports preview.
3. Add explicit role/capability badges per page to reduce accidental misuse.
4. Add change-request metadata enrichment (severity, impact area, rollback hint).

Exit Criteria:
- Sensitive operations require explicit confirmation.
- Review and audit intent is preserved in change submissions.

### Phase 4: Regression and Release Readiness (Next 1-2 Days)

1. Add shell-focused smoke suite:
   - shell route load
   - critical API route availability
   - runtime system toggle validation
   - command execute happy path
2. Add docs drift check:
   - verify removed paths are not listed as active
   - verify endpoint references remain valid
3. Produce release checklist and signoff report.

Exit Criteria:
- Smoke suite and TypeScript checks pass in one command.
- Documentation reflects actual runtime and repo structure.

## Workstream Ownership

- Shell UX and behavior: `web-control-panel/src/operator-studio-shell.js`, `web-control-panel/src/styles/operator-studio-shell.css`
- Runtime integration: backend `/client/runtime-settings`, `/client/asset-manifest`, `/commands`, `/voice/*`
- Documentation and operational readiness: `docs/*`, `docs/reports/*`

## Risks and Mitigations

- Risk: API shape drift between shell and backend.
- Mitigation: keep endpoint contract checks in smoke suite and gate release on them.

- Risk: operator confusion from dense controls.
- Mitigation: enforce page-level summaries and explicit action intent labels.

- Risk: regressions from large shell script growth.
- Mitigation: modularize shell script by domain after polish pass, preserving behavior through smoke tests.
