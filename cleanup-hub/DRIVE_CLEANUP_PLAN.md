# Drive Cleanup Plan

This is the safe sequence for cleaning `D:\` without breaking Gail.

## Cleanup Goals

- reduce duplicate roots and ambiguous source-of-truth folders
- stop future work from spreading across backup, archive, and sidecar repos
- preserve recoverability while removing drift
- make the active build easy to find, back up, and operate

## Non-Negotiable Safety Rules

- do not delete anything from `D:\` until it has been classified
- do not move or rename active roots during feature work
- do not touch backups, zips, or sidecar repos without recording the reason first
- do not archive or delete anything that has not been checked for references in docs, scripts, or manifests
- every destructive or hard-to-reverse cleanup action requires operator approval

## Current Classification Snapshot

### Keep Active

- `D:\Gail 2.1\working_copy`
- `D:\Gail 2.1\anim_avatar_importer`
- `D:\Gail 2.1\converted_animations_20260401`
- `D:\Gail 2.1\animation guidelines`

### Freeze As Reference

- `D:\GAIL-V2-recovery-test`
- `D:\engine-main`
- `D:\engine-main-github-backup`
- `D:\Gail_workstreams`

### Decision-Pending Asset / Loose Content Areas

- `D:\avatar`
- `D:\Avatars`
- `D:\data`
- `D:\Misc`
- `D:\Pictures`
- `D:\Temp`
- `D:\_recovery`
- root loose assets and zips

### Ignore / System

- `D:\$RECYCLE.BIN`
- `D:\System Volume Information`
- `D:\.gradle`

## Cleanup Phases

## Phase 1: Freeze The Truth

Objective:

- stop further drift immediately

Actions:

1. Treat `D:\Gail 2.1\working_copy` as the only active product repo.
2. Route all new code, docs, prompts, and governance updates into that repo.
3. Treat all other Gail roots as read-only until classified.
4. Update agent instructions so builders do not create new side roots.

Exit criteria:

- all future feature work lands in one repo
- manager and builders have explicit boundaries

## Phase 2: Record Decisions Before Moving Files

Objective:

- create an audit trail for cleanup

Actions:

1. Record every candidate move/archive/delete in `cleanup-hub/DECISION_LOG.md`.
2. For each candidate, record:
   - source path
   - target path or archive destination
   - why it exists
   - whether it is backed up
   - whether references were checked
3. Prefer archive decisions before delete decisions.

Exit criteria:

- nothing is moved without a logged rationale

## Phase 3: Consolidate Loose Documentation And Plans

Objective:

- stop project intent from living in too many places

Actions:

1. Keep active governance/product docs in the active repo.
2. Treat `animation guidelines` as planning/reference until each needed item is either:
   - promoted into active docs, or
   - archived as superseded
3. Mark stale docs that still point to old drive roots.

Exit criteria:

- active docs are clearly separated from historic or speculative docs

## Phase 4: Consolidate Asset And Pipeline Inputs

Objective:

- remove ambiguity about where avatar and animation work starts

Actions:

1. Define which source assets stay as external working assets versus repo-owned assets.
2. Decide whether loose root assets such as `D:\gail_final.blend` remain source-of-truth inputs or get moved into a controlled source-assets location.
3. Keep import libraries and generated runtime exports separate.

Exit criteria:

- source assets, generated exports, and runtime-delivered assets are clearly separated

## Phase 5: Archive Old Roots

Objective:

- reduce clutter without losing recovery paths

Actions:

1. After references are checked, archive or label:
   - `Gail_workstreams`
   - old engine backups
   - duplicate zip backups
2. Prefer a named archive destination rather than ad hoc folders.
3. Only delete after:
   - archive exists
   - references are checked
   - operator approves

Exit criteria:

- old roots stop competing with the active repo for attention

## Immediate Working Rules

- no new files at `D:\` root for Gail unless they are raw external assets awaiting classification
- no new backup repos beside the active repo without operator approval
- no “temporary” working copy outside `working_copy`
- every cleanup action should either reduce ambiguity or improve recoverability

## Recommended Next Cleanup Actions

1. Keep building governance inside `working_copy`.
2. Normalize hardcoded `F:\Gail` references in active docs/scripts over time.
3. Create a later archive destination for frozen roots after operator review.
4. Perform cleanup in small logged batches, not one giant move.
