# Phase Release Handoff Checklist

Date: 2026-04-05  
Purpose: One repeatable handoff list for release readiness after Phase 1-5 validation.

## 1) One-Command Final Acceptance
Run:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-shell-final-acceptance.ps1
```

Pass rule:
- [ ] Script exits `0`
- [ ] Summary shows `failed: 0`
- [ ] JSON + Markdown summaries generated under `docs/reports/`

## 2) Manual Operator Spot Checks
- [ ] `Devices and Auth` can apply display target + input mode.
- [ ] Work-lite `Runtime Menu` actions are clickable and not visually blocked.
- [ ] `Feature Inbox` can add and promote a request.
- [ ] `Change Governance` ledger history loads and updates after actions.

## 3) Required Evidence Pack
- [ ] Latest `final-acceptance-*.json` report.
- [ ] Latest `final-acceptance-*.md` report.
- [ ] Backend test report (`backend-test-report-*.md`) from same run window.
- [ ] Screenshots for:
- Operator shell Feature Inbox
- Operator shell Change Governance
- Work-lite Runtime Menu

## 4) Security / Runtime Guardrails
- [ ] Confirm expected auth mode for target environment.
- [ ] Confirm LAN exposure is intentional (`0.0.0.0` bind warning reviewed).
- [ ] Confirm OpenAI key lifecycle behaves correctly (set/clear) if cloud mode is in use.

## 5) Go / No-Go
- [ ] GO only if all checks above are complete.
- [ ] NO-GO if any blocker fails; log issue and rerun final acceptance after fix.

Decision:
- [ ] GO
- [ ] NO-GO

Approver:
- Name:
- Date:
- Notes:
