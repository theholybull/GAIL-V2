# Agent Governance

This file defines hard rules for operator control, manager coordination, builder ownership, and drive-cleanup discipline.

## Chain Of Command

1. Human operator
   - final authority for drive cleanup, deletions, archival, credentials, release posture, and cross-repo decisions
2. Gail
   - in-product primary AI and final in-product review gate for manager/builder output
3. `manager-alpha`
   - orchestration, directive creation, assignment, acceptance checks, and status tracking
4. `builder-a`
   - `backend/`, `shared/`, `tools/`, `docs/`, `cleanup-hub/`
5. `builder-b`
   - `playcanvas-app/`, `web-control-panel/`

## Workspace Rules

- active write root: `D:\Gail 2.1\working_copy`
- `D:\` is not a working directory for new Gail code
- backup repos, old workstreams, and engine forks are read-only by default
- no new Gail project roots without operator approval
- no cross-root edits as a shortcut around repo hygiene

## Directive Requirements

Every directive must include:

- title
- problem statement
- expected outcome
- owner
- allowed write scope
- required checks
- rollback note
- artifact/report expectation

If any of those are missing, the manager should refine the directive before dispatch.

## Write Boundaries

### Builder-A

Allowed:

- `backend/`
- `shared/`
- `tools/`
- `docs/`
- `cleanup-hub/`

Not allowed without explicit handoff:

- `playcanvas-app/`
- `web-control-panel/`

### Builder-B

Allowed:

- `playcanvas-app/`
- `web-control-panel/`

Not allowed without explicit handoff:

- `backend/`
- `shared/`
- `tools/`
- `docs/`
- `cleanup-hub/`

### Manager

- does not bypass ownership boundaries
- coordinates handoffs when one change spans backend and frontend

## Mandatory Acceptance Gates

For backend-impacting work:

- build affected TypeScript surfaces
- run `tools/run-backend-tests.ps1` when runnable backend behavior changed
- update docs when behavior changed

For frontend/runtime work:

- run the relevant `npm.cmd run check`
- build affected client/shell surfaces
- record any manual verification that was performed

For cleanup/governance work:

- update `cleanup-hub` docs first
- record decisions before moving files
- never perform silent delete/archive actions

## Logging Rules

- every directive creation, dispatch, retry, approval, rejection, and completion must be logged
- builder logs must include files touched and result status
- cleanup actions must log source path, target path, reason, and approval status
- append-only logs remain under `data/agent-logs/`

## Documentation Sync Rules

When meaningful project behavior changes:

- update `docs/BUILD_LOG.md`
- update `docs/CHANGE_LOG.md`
- update `docs/PROJECT_STATE.md` when the state of the project materially changed
- update `cleanup-hub` docs if source-of-truth, governance, or cleanup classification changed
- follow `cleanup-hub/DOCUMENTATION_PROTOCOL.md` before treating work as complete

## Avatar Runtime Source Rule

- active avatar runtime data lives in `data/client/avatar-runtime.json`
- shell-facing changes must go through Avatar Library, Wardrobe, Runtime Mapping, or their existing `/client/*` endpoints
- do not edit `playcanvas-app/config/work-lite-modules.gail.json`, `data/client/runtime-settings.json`, or `data/client/wardrobe-presets.json` as active sources
- if avatar asset ids, persona mappings, active runtime systems, or wardrobe slots change, update `cleanup-hub/AVATAR_RUNTIME_SINGLE_SOURCE_2026-04-23.md` or its successor

## Destructive Action Rules

The following always require operator approval:

- deleting folders or files outside generated outputs
- moving or renaming repo roots
- changing archive/backup layout
- deleting backups or zip archives
- changing credential handling
- exposing new network surfaces publicly

The following require both manager review and operator approval:

- cross-repo consolidation moves
- rollback of approved changes
- mass asset relocation
- cleanup batches that affect more than one top-level `D:\` root

## Forbidden Behaviors

- no secret ad hoc worktrees
- no direct edits in backup repos during normal feature work
- no skip-the-tests merges for convenience
- no undocumented new scripts that mutate drive state
- no “temporary” root-level files that become permanent by accident
- no silent drift between docs and code when the change is known

## Preferred Working Pattern

1. classify the task
2. define the owner and write scope
3. implement in the active repo only
4. run required checks
5. log and document the result
6. route through review
7. only then promote, archive, or clean up related artifacts
