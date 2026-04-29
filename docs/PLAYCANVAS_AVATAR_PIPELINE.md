# PlayCanvas Avatar Pipeline

This is the current repo-level source of truth for Gail avatar export into the PlayCanvas work-lite client.

## What Is Current

Current PlayCanvas path:

- author and clean in Blender
- export modular runtime GLBs into `playcanvas-app/assets/gail/...`
- export approved animation clips as one GLB per clip
- let the backend serve those files under `/client-assets/...`
- let the PlayCanvas client assemble the modular bundle at runtime

Current authoritative Blender area:

- [blender/animation_master](/F:/Gail/blender/animation_master/README.md)

Legacy or parallel-but-not-primary areas:

- [blender_scripts](/F:/Gail/blender_scripts/README.md)
  - older Genesis 8 and Unity-oriented helpers
- [docs/GENESIS8_AUTOMATION.md](/F:/Gail/docs/GENESIS8_AUTOMATION.md)
  - still useful for morph validation and Unity FBX export
- [ASSET_PIPELINE.md](/F:/Gail/ASSET_PIPELINE.md)
  - useful high-level rules, but it still describes a Unity-first runtime decision that no longer matches the active PlayCanvas client

## Runtime Wiring

The active PlayCanvas client loads asset paths from the backend manifest and then imports the GLBs directly:

- [playcanvas-app/src/main.ts](/F:/Gail/playcanvas-app/src/main.ts)
- [backend/services/client-assets-service.ts](/F:/Gail/backend/services/client-assets-service.ts)
- [playcanvas-app/assets/README.md](/F:/Gail/playcanvas-app/assets/README.md)

Currently recognized core modules:

- base avatar
- hair
- vest
- pants
- boots
- idle animation

Optional recognized module:

- bracelets

## Blender Files And Manifests

Current working `.blend` files in the repo root:

- [gail_rig_master.blend](/F:/Gail/gail_rig_master.blend)
  - morph-rich source and modular export source
- [gail_rig.blend](/F:/Gail/gail_rig.blend)
  - cleaned regular export file for animation validation and clip export

Important manifests:

- [blender/animation_master/manifests/asset_partition.gail.json](/F:/Gail/blender/animation_master/manifests/asset_partition.gail.json)
  - defines the armature, base-face meshes, hair groups, clothing groups, accessory groups, and exact PlayCanvas output folders
- [blender/animation_master/manifests/runtime_shape_keys.gail.json](/F:/Gail/blender/animation_master/manifests/runtime_shape_keys.gail.json)
  - runtime shape-key allowlist for exported base avatar face/body meshes
- [blender/animation_master/manifests/clip_registry.gail.example.json](/F:/Gail/blender/animation_master/manifests/clip_registry.gail.example.json)
  - defines clip names, statuses, frame ranges, categories, and export paths
- [blender/animation_master/manifests/regular_avatar_build.gail.example.json](/F:/Gail/blender/animation_master/manifests/regular_avatar_build.gail.example.json)
  - defines how `gail_rig_master.blend` is reduced into `gail_rig.blend`

## Existing Blender Scripts

PlayCanvas-side export scripts:

- [blender/animation_master/scripts/export_playcanvas_assets.py](/F:/Gail/blender/animation_master/scripts/export_playcanvas_assets.py)
  - exports modular GLBs for base avatar, hair, clothes, accessories
- [blender/animation_master/scripts/export_actions_glb.py](/F:/Gail/blender/animation_master/scripts/export_actions_glb.py)
  - exports one GLB per approved body clip from `gail_rig.blend`
  - now falls back to exporting the armature plus all skinned meshes if the expected staging collection is missing
- [blender/animation_master/scripts/generate_regular_avatar_from_master.py](/F:/Gail/blender/animation_master/scripts/generate_regular_avatar_from_master.py)
  - rebuilds the clean regular avatar file from the master
- [blender/animation_master/scripts/validate_animation_master.py](/F:/Gail/blender/animation_master/scripts/validate_animation_master.py)
  - checks collection contract, armature identity, action naming, registry coverage, and fake-user usage

Animation authoring helpers:

- [blender/animation_master/scripts/capture_current_pose_as_action.py](/F:/Gail/blender/animation_master/scripts/capture_current_pose_as_action.py)
- [blender/animation_master/scripts/rebuild_idle_from_action.py](/F:/Gail/blender/animation_master/scripts/rebuild_idle_from_action.py)
- [blender/animation_master/scripts/rebuild_idle_live.ps1](/F:/Gail/blender/animation_master/scripts/rebuild_idle_live.ps1)
- [blender/animation_master/scripts/assign_clip_to_armature.py](/F:/Gail/blender/animation_master/scripts/assign_clip_to_armature.py)
- [blender/animation_master/scripts/import_lab_actions_to_master.py](/F:/Gail/blender/animation_master/scripts/import_lab_actions_to_master.py)

Older but still useful mesh/rig utilities:

- [blender_scripts/bind_rig_to_mesh.py](/F:/Gail/blender_scripts/bind_rig_to_mesh.py)
- [blender_scripts/clean_skin_weights.py](/F:/Gail/blender_scripts/clean_skin_weights.py)
- [blender_scripts/clean_avatar_mesh.py](/F:/Gail/blender_scripts/clean_avatar_mesh.py)
- [blender_scripts/batch_clean_export_glb.py](/F:/Gail/blender_scripts/batch_clean_export_glb.py)

Bundled Blender add-on:

- [tools/add-on-mixamo-rig-v1.1.8/README.md](/F:/Gail/tools/add-on-mixamo-rig-v1.1.8/README.md)
  - Mixamo retarget/control-rig support for imported motion cleanup
- [tools/blender-gail-export-addon/README.md](/F:/Gail/tools/blender-gail-export-addon/README.md)
  - Object Mode panel for importing GLBs, registering modules/clips, exporting directly, and running the full PlayCanvas pipeline from Blender

## Current Export Targets

Modular avatar exports land here:

- `playcanvas-app/assets/gail/avatar/base_face/gail_base_avatar.glb`
- `playcanvas-app/assets/gail/hair/<module>/<module>.glb`
- `playcanvas-app/assets/gail/clothes/<module>/<module>.glb`
- `playcanvas-app/assets/gail/accessories/<module>/<module>.glb`

Animation clip exports land here first:

- `blender/animation_master/exports/glb/clips/approved/<category>/<clip>.glb`

The new repo runner also mirrors approved clips into:

- `playcanvas-app/assets/animations/<clip>.glb`
- `playcanvas-app/assets/animations/idle.glb`
  - alias copied from the approved idle clip for simpler runtime intake

## New One-Command Export Runner

Use:

- [tools/export-playcanvas-pipeline.ps1](/F:/Gail/tools/export-playcanvas-pipeline.ps1)

Default behavior:

1. resolves Blender automatically
2. refreshes `gail_rig.blend` from `gail_rig_master.blend`
3. exports modular PlayCanvas avatar assets from the master file
4. validates the regular animation library
5. exports approved body clips as GLBs
6. copies approved clip exports into `playcanvas-app/assets/animations`
7. writes a pipeline report under `blender/animation_master/exports/reports`

Run it:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\export-playcanvas-pipeline.ps1"
```

Useful options:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\export-playcanvas-pipeline.ps1" -IncludeReview
```

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\export-playcanvas-pipeline.ps1" -SkipRegularRefresh
```

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\export-playcanvas-pipeline.ps1" -DryRun
```

If Blender is not auto-detected:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\export-playcanvas-pipeline.ps1" -BlenderExe "C:\path\to\blender.exe"
```

## How To Add A New Clothing Module

1. Skin the clothing mesh to the same production armature used by the rest of Gail.
2. Add the clothing object name to [asset_partition.gail.json](/F:/Gail/blender/animation_master/manifests/asset_partition.gail.json) under `clothing_groups`.
3. Give it a stable module name and output folder.
4. Run [tools/export-playcanvas-pipeline.ps1](/F:/Gail/tools/export-playcanvas-pipeline.ps1).
5. Confirm the new GLB appears under `playcanvas-app/assets/gail/clothes/<module>/`.

The runtime will not recognize it automatically unless the client/backend manifest logic is expanded to surface that module name.

## How To Add A New Hair Or Accessory Module

Same process as clothing, but add it under:

- `hair_groups`
- `accessory_groups`

in [asset_partition.gail.json](/F:/Gail/blender/animation_master/manifests/asset_partition.gail.json).

## How To Add A New Animation Clip

1. Author or import the motion on the Gail rig.
2. Give the Action a production name following [NAMING_RULES.md](/F:/Gail/blender/animation_master/docs/NAMING_RULES.md).
3. Turn on `Fake User`.
4. Add the clip metadata to [clip_registry.gail.example.json](/F:/Gail/blender/animation_master/manifests/clip_registry.gail.example.json).
5. Set `status` to `approved` when it is ready for export.
6. Run [tools/export-playcanvas-pipeline.ps1](/F:/Gail/tools/export-playcanvas-pipeline.ps1).
7. Confirm the clip appears in both:
   - `blender/animation_master/exports/glb/clips/...`
   - `playcanvas-app/assets/animations/`

## How To Swap In A New Base Avatar

1. Update the master `.blend` with the new body/face meshes and shared production armature.
2. Update [asset_partition.gail.json](/F:/Gail/blender/animation_master/manifests/asset_partition.gail.json) if mesh object names changed.
3. Update [runtime_shape_keys.gail.json](/F:/Gail/blender/animation_master/manifests/runtime_shape_keys.gail.json) if the new face mesh uses different runtime shape keys.
4. Rebuild the regular file and export through [tools/export-playcanvas-pipeline.ps1](/F:/Gail/tools/export-playcanvas-pipeline.ps1).

If the armature object name changes, the current pipeline will break until the manifests and animation library are updated to match.

## Important Friction Points Found In The Repo

- Blender executable paths are still hardcoded in several older scripts.
- The active PlayCanvas runtime is modular, but some older docs still describe Unity or Godot as the main target.
- New clothing/hair/accessory modules require both manifest updates and runtime manifest recognition if you want them surfaced explicitly in the UI.
- `clip_registry.gail.example.json` is acting like the live registry, despite the `example` filename.
- The PlayCanvas client currently detects animation assets through the backend manifest; it does not yet implement a full runtime state graph or generalized wardrobe browser.
- Validation and export assumptions are still looser than the original design docs because the real `gail_rig.blend` currently uses the default Blender `Collection` instead of the documented staging collection tree.

## Recommended Next Cleanup

If you want this to be easier still, the next practical steps are:

1. rename the live `*.example.json` manifests that are actually being used
2. add a first-class `playcanvas_modules.gail.json` manifest for runtime-discoverable outfits and hair
3. teach `backend/services/client-assets-service.ts` to enumerate modules dynamically instead of checking a fixed list
4. add animation categories beyond idle to the backend manifest so PlayCanvas can switch clips intentionally instead of only previewing detected files
