# Documentation Protocol

This file defines the hard documentation rules for Gail work. No meaningful change is complete until the required docs and verification artifacts are updated.

## Mandatory Read Order

Before changing code, tooling, drive layout, or agent behavior, read:

1. `cleanup-hub/PROJECT_MAP.md`
2. `cleanup-hub/DRIVE_CLEANUP_PLAN.md`
3. `cleanup-hub/AGENT_GOVERNANCE.md`
4. `cleanup-hub/DOCUMENTATION_PROTOCOL.md`

## Golden Rule

- if code changed, documentation changed
- if cleanup classification changed, the cleanup hub changed
- if verification ran, artifacts and a human-readable summary were recorded
- if an agent cannot update the required docs directly because of write boundaries, the manager must dispatch or log an explicit documentation handoff before the task can be treated as complete

## Required Updates By Work Type

### All Meaningful Repo Work

Always update:

- `docs/BUILD_LOG.md`
- `docs/CHANGE_LOG.md`

Also update:

- `docs/PROJECT_STATE.md` when project status, active root, runtime readiness, or blocker state materially changed

### Cleanup, Archive, Move, Delete, Or Source-Of-Truth Changes

Always update:

- `cleanup-hub/DECISION_LOG.md`

Update as needed:

- `cleanup-hub/PROJECT_MAP.md`
- `cleanup-hub/DRIVE_CLEANUP_PLAN.md`
- `cleanup-hub/PATH_DRIFT_REPORT_YYYY-MM-DD.md`
- `cleanup-hub/DRIVE_ROOT_MANIFEST_YYYY-MM-DD.md`

### Runtime, UI, Or Verification Passes

Always record:

- raw machine artifacts under `docs/reports/` or a timestamped folder under `cleanup-hub/`
- a human-readable audit summary in `cleanup-hub/`

Recommended pattern:

- raw JSON/PNG/test output: `docs/reports/` or `cleanup-hub/runtime-audit-YYYYMMDD-HHMMSS/`
- operator summary: `cleanup-hub/RUNTIME_UI_AUDIT_YYYY-MM-DD.md`

### Avatar Runtime Changes

Always treat this as a source-of-truth change and update:

- `data/client/avatar-runtime.json`
- `cleanup-hub/AVATAR_RUNTIME_SINGLE_SOURCE_YYYY-MM-DD.md` or its current successor
- `docs/PROJECT_STATE.md`

Do not edit these legacy split files for active avatar state:

- `playcanvas-app/config/work-lite-modules.gail.json`
- `data/client/runtime-settings.json`
- `data/client/wardrobe-presets.json`

### Agent, Governance, Or Workflow Rule Changes

Always update:

- `cleanup-hub/AGENT_GOVERNANCE.md`
- `cleanup-hub/DOCUMENTATION_PROTOCOL.md` when the rule itself changes
- `.github/copilot-instructions.md`
- relevant `.github/agents/*.agent.md`

## Artifact Rules

- raw generated reports belong in `docs/reports/` unless the artifact is part of a cleanup-hub audit package
- screenshots and audit packages that establish a cleanup or release baseline belong in a timestamped folder under `cleanup-hub/`
- do not leave important evidence only in temp folders, Desktop, Downloads, or external roots
- use repo-relative paths inside docs whenever possible
- keep active raw artifacts minimal: after a fallback/checkpoint is created, old reports, screenshots, GLB scratch files, and import/export run folders should be removed from the active repo or moved to an explicit archive
- before deleting generated artifacts, run `tools/clean-generated-artifacts.ps1` in dry-run mode and confirm the candidates are generated clutter, not active source
- generated cleanup/import folders must not be treated as active source of truth; active avatar/runtime data lives in `data/client/avatar-runtime.json` and active client assets live under `playcanvas-app/assets/`

## Entry Requirements

Every completion report from an agent or human-assisted pass must state:

- files changed
- checks run
- artifacts created
- docs updated
- open risks or blockers

## Builder Boundary Rule

- `builder-a` may update docs directly because docs are in its write scope
- `builder-b` must not silently skip docs; if the task changes frontend or runtime behavior, `builder-b` must either:
  - receive explicit doc-handoff permission, or
  - return the exact docs that need updating so the manager can dispatch a documentation sync
- the manager must verify documentation coverage before routing work into Gail review

## Definition Of Done

Work is not done until:

1. the owned file changes are complete
2. required checks were run or explicitly blocked
3. required docs were updated or an explicit documentation handoff was logged
4. artifacts were stored in the repo
5. unresolved risks were recorded
