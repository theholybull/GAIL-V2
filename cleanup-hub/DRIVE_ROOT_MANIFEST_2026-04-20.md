# Drive Root Manifest 2026-04-20

This is the first-pass classification of visible top-level `D:\` items relevant to Gail cleanup.

## Keep Active

- `D:\Gail 2.1`
  - primary Gail cluster
  - active product repo lives at `D:\Gail 2.1\working_copy`

## Freeze As Reference

- `D:\GAIL-V2-recovery-test`
  - engine/recovery reference repo
- `D:\engine-main`
  - engine/reference root
- `D:\engine-main-github-backup`
  - backup/reference root
- `D:\Gail_workstreams`
  - older split-workstream root

## Decision-Pending Asset / Working Areas

- `D:\avatar`
- `D:\Avatars`
- `D:\avatar_final.fbm`
- `D:\data`
- `D:\Kilo`
- `D:\Misc`
- `D:\Pictures`
- `D:\playcanvas-app`
- `D:\Temp`
- `D:\_recovery`
- `D:\gail_final.blend`
- `D:\gail_final.fbx`
- `D:\gail_master_v2.duf.png`

Rule:

- do not move or delete these until ownership and runtime relevance are checked

## Likely Archive Candidates After Review

- `D:\engine-main-github-backup.zip`
- `D:\engine-main.zip`

Rule:

- archive or delete only after:
  - confirming the matching repo/folder still exists and is readable
  - confirming these zip files are not the only surviving recovery copies
  - operator approval

## System / Ignore

- `D:\$RECYCLE.BIN`
- `D:\System Volume Information`
- `D:\.gradle`
- `D:\Applications`
- `D:\CppProperties.json`

## Immediate Cleanup Meaning

This manifest means:

- normal Gail feature work should stay inside `D:\Gail 2.1\working_copy`
- no top-level folder should be treated as implicitly active just because it exists
- reference roots and decision-pending roots should stay frozen until moved through the cleanup decision process

## Next Review Needed

The next cleanup review should decide:

1. whether `D:\playcanvas-app` contains anything not already represented inside `working_copy`
2. whether `D:\Kilo` is relevant to Gail or a separate effort
3. which loose root assets must be preserved as source inputs versus archived
4. whether engine zip backups can move into a later archive location
