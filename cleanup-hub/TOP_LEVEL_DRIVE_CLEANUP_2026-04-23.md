# Top-Level Drive Cleanup - 2026-04-23

Purpose:

- clear old project roots, test outputs, caches, and duplicate installer payloads from `D:\`
- keep active Gail sources easy to find
- avoid future agents treating old recovery/reference folders as active work

## Result

The visible top-level `D:\` root is now reduced to:

- `D:\Applications`
- `D:\Avatars`
- `D:\Gail 2.1`
- system folders: `$RECYCLE.BIN`, `System Volume Information`

Space impact:

- deleted/regenerable data removed: approximately `66.25 GB`
- old but potentially useful material moved to legacy hold: approximately `3.50 GB`
- D drive free after cleanup: approximately `750.55 GB`

Legacy hold:

- `D:\Gail 2.1\legacy-hold\20260423-top-level-review`

Raw operation report:

- `cleanup-hub/top-level-cleanup-20260423.json`

## Kept Active

`D:\Gail 2.1\working_copy`

- active repo and product work root

`D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`

- current known-good fallback checkpoint

`D:\Avatars`

- current Blender avatar source inputs
- contains current Gail, Cherry, Vera, and Gail clothing blend files

`D:\Gail 2.1\anim_avatar_importer`

- sidecar animation/avatar importer
- still relevant until fully repo-integrated

`D:\Gail 2.1\converted_animations_20260401`

- converted animation library payload
- still used by importer flow

`D:\Gail 2.1\animation guidelines`

- planning/spec overlay docs

`D:\Applications`

- DAZ/application/content area
- installed DAZ libraries were preserved

## Deleted

Regenerable caches:

- `D:\.gradle`

DAZ installer download cache:

- `D:\Applications\Applications\Data\DAZ 3D\InstallManager\Downloads`
- `D:\Applications\Data\DAZ 3D\InstallManager\Downloads`

Important boundary:

- only Install Manager downloaded zip/cache payloads were removed
- installed `My DAZ 3D Library` content was preserved

Duplicate/temporary top-level files:

- `D:\engine-main.zip`
- `D:\engine-main-github-backup.zip`
- `D:\CppProperties.json`

Temporary folders:

- `D:\Temp`
- `D:\avatar`

Old Gail sidecar temp files:

- `D:\Gail 2.1\strip_test.log`
- `D:\Gail 2.1\strip_test.log.err`
- `D:\Gail 2.1\temp_anim_inspect.py`
- `D:\Gail 2.1\temp_inspect.py`
- `D:\Gail 2.1\avatar_gail`

Bulky generated output removed before archiving old project roots:

- old `node_modules`
- old build outputs
- old duplicated backend test reports
- old vendor examples from PlayCanvas engine reference folders
- old `.git` metadata from archived reference folders

## Moved To Legacy Hold

Reference projects:

- `D:\GAIL-V2-recovery-test`
- `D:\engine-main`
- `D:\engine-main-github-backup`
- `D:\Gail_workstreams`

Old loose assets/runtime data:

- `D:\playcanvas-app`
- `D:\avatar_final.fbm`
- `D:\data`
- `D:\Misc`

Empty or decision-pending roots:

- `D:\Kilo`
- `D:\_recovery`
- `D:\Pictures`

Loose old files:

- `D:\autonomy_starter_pack.zip`

Old Gail sidecars:

- `D:\Gail 2.1\Avatars`
- `D:\Gail 2.1\lucy.blend`
- `D:\Gail 2.1\animoxtend-1.2.2.zip`

## Useful Findings

Useful/active:

- `D:\Avatars` is the current source location for avatar Blender files and must stay
- the active runtime config remains `data/client/avatar-runtime.json`
- the active runtime assets remain under `D:\Gail 2.1\working_copy\playcanvas-app\assets`

Reference only:

- old PlayCanvas engine roots and `GAIL-V2-recovery-test` are not active Gail runtime sources
- `Gail_workstreams` was an older transitional dual-workstream root

Possibly useful but not active:

- old loose DAZ/GLB/texture assets were moved into legacy hold instead of deleted
- old Lucy/older avatar sidecars were moved into legacy hold instead of deleted

## Verification

After cleanup:

- `tools/build-backend.ps1`: passed
- `tools/build-playcanvas-app.ps1`: passed
- animation validator: passed `11` files, `0` errors, `0` warnings
- `tools/build-control-panel.ps1`: passed
- `/client/runtime-settings`: responded with active avatar system `gail_primary`

## Agent Rule

Agents must not search or use old roots in:

- `D:\Gail 2.1\legacy-hold\20260423-top-level-review`

unless the task explicitly asks for old/reference material.

Active work starts from:

- `D:\Gail 2.1\working_copy`

Current avatar source imports start from:

- `D:\Avatars`

Do not recreate top-level scratch folders on `D:\`. Put generated evidence inside the repo only while it is current, then summarize it and clean it.
