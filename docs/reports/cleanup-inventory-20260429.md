# Cleanup Inventory

Date: 2026-04-29

## Purpose

Inventory cleanup candidates after the lockdown backup. This report does not authorize deletion. It only identifies categories for a later move/delete pass.

## Protected State

Primary documented lockdown:

- `D:\Gail 2.1\lockdown-backups\working_copy_lockdown_20260429-085311`

Post-lockdown docs pack:

- `D:\Gail 2.1\lockdown-backups\post_lockdown_docs_20260429-0910`

## Candidate Categories

Observed candidates in `D:\Gail 2.1\working_copy`:

| Category | Count | Size |
|---|---:|---:|
| Python `__pycache__` directories | 1 | negligible |
| PID files | 2 | negligible |
| PlayCanvas root temp screenshot/debug scripts and PNGs | 28 | 4.7 MB |
| Current files under `docs/reports` | 13 | 43.55 MB |
| Runtime logs/state files under `data/runtime` | 7 | negligible |

## Path Drift Hits

Path drift references still exist in docs and scripts.

Important active-risk files:

- `STREAM_STATUS.md`
- `tools\clean-generated-artifacts.ps1`
- `tools\prepare-playcanvas-manual-package.ps1`
- `tools\promote-d-to-c-working-copy.ps1`
- `tools\set-avatar-orientation-and-launch.ps1`
- `docs\OPERATOR_STUDIO_HANDOFF_README.md`
- `docs\PLAYCANVAS_AVATAR_PIPELINE.md`
- `docs\PLAYCANVAS_MANUAL_SETUP.md`
- `docs\PROJECT_STATE.md`
- `docs\MOBILE_AUDIO_REPLICATION_RUNBOOK_2026-04-28.md`

Historical-only files also contain old `D:\Gail`, `F:\Gail`, and C mirror references. Those should not all be rewritten blindly; some are historical records.

## Recommendation

Cleanup should begin with path correction and hold-folder movement, not deletion.

First safe pass:

1. Fix active scripts that hardcode stale roots.
2. Add a promotion script that defaults to:
   - source: `D:\Gail 2.1\working_copy`
   - target: C promoted backup
   - no mirror delete unless explicitly requested
3. Move root-level PlayCanvas temp screenshot/debug files to:
   - `D:\Gail 2.1\cleanup-hold\20260429-playcanvas-temp-screens`
4. Re-run builds and backend regression.

Deletion should wait until after:

- the hold-folder move is verified
- the active root still passes the gate
- the user approves the category for final deletion

