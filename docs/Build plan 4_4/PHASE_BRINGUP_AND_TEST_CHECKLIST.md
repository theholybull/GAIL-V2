# Phase Bring-Up And Test Checklist

Date: 2026-04-05  
Use this when actively bringing a phase online and validating it.

## Standard Bring-Up (Every Phase)
1. Start stack:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1 -ForceRestart
```
2. Confirm backend health:
```powershell
node -e "fetch('http://127.0.0.1:4180/health').then(r=>r.json()).then(j=>console.log(j.status||j))"
```
3. Open shell: `http://127.0.0.1:4180/panel/`
4. In shell:
- [ ] Backend shows `Online`
- [ ] Guided mode is ON
- [ ] You can switch pages and scroll works

## Phase 1 Bring-Up + Test
Run:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-shell-phase1-verify.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-shell-phase1-links-scripts-smoke.ps1
```
Pass criteria:
- [ ] Phase 1 verify returns all pass
- [ ] Links/scripts smoke returns all pass
- [ ] Avatar idle/listen/talk baseline behaves correctly in UI/runtime

## Phase 2 Bring-Up + Test
Run:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-shell-phase2-verify.ps1
```
Pass criteria:
- [ ] Verify result has `failed: 0`
- [ ] Action Graph mapping save works
- [ ] Command intent path works end-to-end
- [ ] Approval flow responds and logs entries

## Phase 3 Bring-Up + Test
Run:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-shell-phase3-verify.ps1
```
Pass criteria:
- [ ] Verify result has `failed: 0`
- [ ] Command palette quick actions execute
- [ ] Keyboard shortcuts work (`Ctrl/Cmd+1..4`, `Ctrl/Cmd+K`, `Ctrl/Cmd+L`, `Alt+G`)
- [ ] Workflow `Open Review Queue` action jumps and refreshes correctly
- [ ] Notifications/audit trail append correctly

## Full Regression (Before Promotion)
Run:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1
```
Pass criteria:
- [ ] Backend suite has zero failures
- [ ] Report file generated under `docs/reports/`

## Evidence Pack (Required)
- [ ] Screenshot of each tested phase screen
- [ ] Verification outputs captured (JSON/text)
- [ ] Report + walkthrough files written in `data/reports/build-batches/<date>-<phase>-final/`
- [ ] Rollback snapshot ID recorded

## Go / No-Go Rule
- [ ] GO only if all phase checks pass and regression is clean
- [ ] NO-GO if any blocker fails; log defect and re-run checklist after fix

