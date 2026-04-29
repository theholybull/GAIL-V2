# Gail Change Governance, Backup, and Avatar Audit Memory Plan (Pass/Fail)

Date: 2026-04-04
Scope: Pre-approval backups, immutable change logging, rollback controls, and full avatar/display-surface access to change history and rationale.

## Objective
- Every change must be recoverable before approval.
- Every change must have traceable metadata: what changed, when, why, by whom, and approval state.
- Avatar and display interface must be able to read, summarize, and act on this history.

## Core Policy (Required)
1. Pre-approval snapshot backup
- On every change submission, create snapshot before apply/promote.
- Snapshot includes affected files/config/manifests and screen evidence.

2. Immutable audit event
- Log append-only event for every change action:
  - created
  - modified
  - submitted
  - approved
  - rejected
  - reverted

3. Approval gate
- No change is marked safe/production until user approval.
- Unapproved changes remain in `pending` state with rollback available.

4. Rollback certainty
- One-click rollback to last approved snapshot.
- One-click restore to any pending snapshot for comparison.

## Data Contracts
### Change ledger
- `data/audit/change-ledger.jsonl` (append-only)

Event fields (minimum):
- `eventId`
- `changeId`
- `timestamp`
- `actor` (agent/user/system)
- `action` (create/update/submit/approve/reject/revert)
- `scope` (files/modules/screens)
- `reason`
- `approvalState`
- `snapshotId`
- `relatedArtifacts[]`

### Snapshot store
- `data/audit/snapshots/<changeId>/<snapshotId>/`
- includes changed files, config state, and screenshot artifacts.

### Approval registry
- `data/audit/approvals.json`
- records reviewer, decision, reason, and signed timestamp.

## UI/Avatar Access Requirements
1. Display screen + avatar interface must expose:
- current pending changes
- last approved change
- why each change exists
- before/after evidence
- rollback controls (permission-gated)

2. Avatar memory behavior
- Avatar can answer:
  - "what changed today"
  - "why was this changed"
  - "what did we roll back"
- Avatar responses must be sourced from ledger + approvals, not guessed memory.

3. Control commands
Voice/text commands required:
- `show pending changes`
- `show last approved change`
- `why was this changed`
- `approve change <id>`
- `reject change <id>`
- `rollback to last approved`
- `show change history`

## Build Control Tower Integration
- Every step submission in Build Control Tower auto-creates:
  - snapshot
  - audit log event
  - pending approval record
- Approval action updates ledger and unlocks promotion.
- Rejection action requires correction note and keeps rollback point.

## Bug/Screenshot Integration
- Each change can link to bug reports and screenshots.
- Screenshot QA analysis output is stored as change artifacts.
- Regression screenshots are diff-linked to change IDs.

## Additional Safety Controls
- Tamper-evident hash chain for change ledger entries.
- Daily backup export of audit + snapshots.
- Read-only viewer mode for audit history.

## Pass/Fail Gates
| ID | Status | Priority | Area | Requirement | Verification | Pass Criteria |
|---|---|---|---|---|---|---|
| CG1 | FAIL | Blocker | Snapshot Backup | Every submitted change creates pre-approval snapshot | Submit 5 test changes | 5/5 snapshots stored with retrievable file sets |
| CG2 | FAIL | Blocker | Immutable Logging | Every change action emits append-only ledger event | Perform full change lifecycle | Ledger contains ordered events for each transition |
| CG3 | FAIL | Blocker | Approval Safety | Unapproved changes cannot be marked safe | Attempt promote without approval | System blocks promotion with clear status |
| CG4 | FAIL | Blocker | Rollback | Rollback to last approved always available | Break and rollback test feature | System restores approved state successfully |
| CG5 | FAIL | High | Avatar Access | Avatar can query change history and rationale | Ask 10 history/rationale questions | Answers match logged data with change IDs |
| CG6 | FAIL | High | Display Controls | Display UI exposes history/approve/reject/rollback | Use display controls end-to-end | All controls execute with audit records |
| CG7 | FAIL | Medium | Artifact Linkage | Screenshots/bug reports linked to change IDs | Inspect 3 change records | Each has linked evidence or explicit none |

## Suggested Build Order
1. Implement snapshot + ledger storage primitives.
2. Wire build-step submission to auto snapshot/log.
3. Add approval registry and promotion block.
4. Add rollback engine + UI controls.
5. Expose history panels in display/avatar interfaces.
6. Add voice/text command routes for governance actions.
7. Add tamper-evidence and daily backup export.
