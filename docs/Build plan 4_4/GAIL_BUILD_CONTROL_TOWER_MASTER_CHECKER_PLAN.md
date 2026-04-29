# Gail Build Control Tower and Master Checker Plan (Pass/Fail)

Date: 2026-04-04
Scope: Build-screen orchestration with master checker AI oversight, step approval workflow for build agents, progress visibility, mandatory screen screenshot QA, and full script/accounting controls.

## Objective
- Turn the build screen into a real control tower for implementation execution.
- Require step-by-step submissions from agent workers with approval gates.
- Enforce screenshot-based QA on every built screen before acceptance.
- Account for all scripts and expose run/results from UI.

## Build Control Tower (New Screen)
Top sections:
1. `Master Checker`
- Overseer AI monitors all active build tasks.
- Reviews worker outputs before merge/promotion.
- Flags policy/quality/test failures and blocks forward progress until resolved.

2. `Agent Lanes`
- Each agent has lane cards:
  - assigned task
  - current step
  - submitted artifacts
  - pending approval status
  - blocker reasons

3. `Project Progress`
- Percent complete by epic/module.
- Milestone burndown and gate status.
- Critical-path health indicator.

4. `Evidence and Screens`
- Auto-captured screenshots for every screen change.
- Side-by-side compare (last approved vs current).
- Annotate issues and route back for correction.

5. `Script Registry`
- Script inventory table with type/path/owner/last run/last result.
- Run button per script.
- Open result/report button.

## Mandatory Build Flow
1. Task assignment
- Master checker assigns/sub-assigns task with acceptance criteria.

2. Step submission
- Agent submits step output with artifacts + summary.

3. Automatic checks
- lint/tests/smoke + required screenshot capture + UI mistake analyzer.

4. Human/master approval
- Step can be `approve`, `request_changes`, or `block`.

5. Promotion
- Only approved steps move to next phase.

## Screenshot QA Enforcement (No Exceptions)
Rule:
- Every screen build/change must include screenshot evidence and automated mistake analysis before acceptance.

Required checks per screen:
- overflow/off-screen elements
- broken/hidden primary controls
- text clipping
- contrast/readability issues
- obvious alignment/layout regressions
- dead/broken interactive targets

Storage:
- `data/reports/ui-screenshots/<feature>/<timestamp>/...`
- `data/reports/ui-analysis/<feature>/<timestamp>.json`

## Additional Additions Recommended From Current Build Scan
1. Script accounting appears fragmented across tools and docs.
- Add unified script manifest:
  - `data/build/script-registry.json`
  - fields: script path, purpose, owner, inputs, outputs, last status

2. Report volume is high and scattered.
- Add report index page in Build Control Tower with filters by date/type/module.

3. Export runner visibility must be first-class.
- Add explicit build-screen cards for:
  - `avatar-assets` runner
  - `playcanvas-pipeline` runner
  - latest report links

4. Agent oversight and workflow exist, but not unified in one build UI.
- Add master-checker lane board integrating workflow steps + review gates + artifact previews.

## UI Modules for Build Control Tower
- `Build Board` (epics, tasks, statuses)
- `Agent Monitor` (worker lanes)
- `Approval Queue` (pending step decisions)
- `Screenshot QA` (captures + analysis + findings)
- `Script Registry` (inventory + run + results)
- `Artifact Viewer` (reports, screenshots, logs)

## API/Service Plan
Add or extend endpoints:
- `GET /build/overview`
- `GET /build/agents`
- `POST /build/steps/:id/submit`
- `POST /build/steps/:id/approve`
- `POST /build/screenshots/capture`
- `POST /build/screenshots/analyze`
- `GET /build/scripts`
- `POST /build/scripts/run`
- `GET /build/scripts/:id/results`

## Pass/Fail Gates
| ID | Status | Priority | Area | Requirement | Verification | Pass Criteria |
|---|---|---|---|---|---|---|
| BC1 | FAIL | Blocker | Master Checker | Build screen has active master checker oversight lane | Open Build Control Tower during active tasks | All agent lanes visible with step status and blocker routing |
| BC2 | FAIL | Blocker | Step Approval | Agent work must be submitted step-by-step for approval | Run sample feature through 3-step flow | No step can promote without explicit approval decision |
| BC3 | FAIL | Blocker | Progress Visibility | Project progress and milestone health visible in real time | Execute tasks and watch board updates | Progress reflects agent submissions and approvals |
| BC4 | FAIL | Blocker | Screenshot QA | Every screen change captures and analyzes screenshots | Change 3 screens and run pipeline | Each change has screenshot + analysis record before acceptance |
| BC5 | FAIL | Blocker | Script Accounting | All scripts are listed with run button and result access | Open script registry and run sample scripts | Registry complete for tracked script roots; results view works |
| BC6 | FAIL | High | Correction Loop | Reviewer can request changes with actionable notes | Reject a submitted step with notes | Agent receives note and resubmits revised step |
| BC7 | FAIL | High | Artifact Access | Screens/reports/logs are accessible from one place | Navigate artifact viewer | Operator can open latest outputs in <=2 clicks |
| BC8 | FAIL | Medium | Noob Help | Build screen has beginner Start Here guidance | Open help on Build Control Tower | New user can run one approval cycle using guide |

## Build-Screen Voice/Text Commands
Required:
- `open build control tower`
- `show approval queue`
- `run script <name>`
- `show latest results`
- `capture build screenshot`
- `analyze current screen`
- `request changes`
- `approve step`

## Recommended Execution Order
1. Build Control Tower shell page and agent lane model.
2. Step submission/approval workflow wiring.
3. Screenshot capture + analyzer integration as mandatory gate.
4. Script registry with run/results controls.
5. Artifact viewer and report index.
6. Help + voice/text command surface.

## Verbal Feature Capture Track (Added 2026-04-04)

A dedicated feature-capture plan has been added:
- `GAIL_VERBAL_FEATURE_CAPTURE_BACKLOG_PLAN.md`

This track adds:
- `Add Feature Request` button,
- verbal capture into upgrade/update backlog,
- stage-based routing for future build rounds,
- promotion to tasks/workflows/change requests.
