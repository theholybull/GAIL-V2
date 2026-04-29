# Animation Master Scripts

These scripts now follow the corrected Gail workflow:

- capture a canonical base pose as a one-frame pose action
- reference that pose action from clip config
- rebuild idle clips from that pose action and tuning JSON
- treat the runtime file as disposable

## Scripts

- `validate_animation_master.py`
  - checks armature naming, collection presence, action naming, and fake-user coverage
- `mark_library_actions.py`
  - turns on fake users and writes lightweight custom metadata to actions
- `export_actions_glb.py`
  - reads the clip registry and exports one GLB per allowed clip
- `generate_nod_small_v1.py`
  - creates a grouped `ack_nod_small_v1` action from the configured base pose and drives hips, spine, chest, neck, head, and shoulder chain together
- `generate_pose_loop_clip.py`
  - creates a loop or sequence clip directly from captured start, midpoint, and end pose actions
- `generate_idle_base_v1.py`
  - creates `idle_base_v1` from the configured `base_pose_action` plus body motion tuning
- `generate_idle_face_v1.py`
  - creates blink and subtle face micro-motion actions for the body, lashes, and brows shape keys
- `capture_current_pose_as_action.py`
  - captures the current armature pose as a one-frame named pose action
- `rebuild_idle_from_action.py`
  - regenerates idle body and face layers into a fresh rebuilt master file using the configured base pose action
- `append_actions_from_blend.py`
  - appends named actions from a source blend into the current file
- `assign_idle_bundle.py`
  - assigns the body idle plus face idle actions together for preview
- `list_transfer_queue.py`
  - prints the master-to-regular transfer queue from the transfer manifest
- `import_lab_actions_to_master.py`
  - appends approved actions from `gail_rig_master.blend` into `gail_rig.blend`
- `generate_regular_avatar_from_master.py`
  - builds `gail_rig.blend` from `gail_rig_master.blend` by removing non-runtime authoring clutter and disallowed shape keys
- `export_playcanvas_assets.py`
  - exports avatar base, hair, clothing pieces, clothing sets, and accessories from `asset_partition.gail.json`
  - supports per-avatar runtime roots under `playcanvas-app/assets/gail/avatars/<avatar_id>/`
  - skips base-avatar export when the manifest marks an avatar as `existing_avatar_update`
  - supports `--profile high|medium|low` for host, low-power client, and watch-class exports
- `assign_clip_to_armature.py`
  - reliably assigns a named clip to the target armature for the current Blender session
- `mixamo_to_gail.py`
  - imports one source FBX or a whole folder, retargets onto Gail, bakes a clean action, and can register the clip metadata
- `launch_clip_preview.ps1`
  - opens `gail_rig.blend` and assigns a named clip with one command
- `launch_idle_preview.ps1`
  - quick launcher for `idle_base_v1`
- `launch_nod_preview.ps1`
  - quick launcher for the legacy nod test clip
- `rebuild_idle_live.ps1`
  - one-command rebuild for the idle workflow with backups, regular-file refresh, and optional opening of `gail_rig.blend`

## Correct Usage Order

1. Open `gail_rig_master.blend`.
2. Pose Gail exactly as desired for the canonical start pose.
3. Run `capture_current_pose_as_action.py` with `pose_idle_confident_v1`.
4. Confirm `manifests/clip_tuning.idle_base_v1.json` points at that pose action.
5. Run `rebuild_idle_live.ps1`.
6. Review `gail_rig.blend`.
7. Only edit the tuning JSON for motion changes.

Capture the canonical idle pose:

```powershell
powershell -ExecutionPolicy Bypass -Command "& 'C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe' 'C:\Users\jbates\Desktop\gail_rig_master.blend' -b --python 'F:\Gail\blender\animation_master\scripts\capture_current_pose_as_action.py' -- --armature 'VAMP Laurina for G8 Female' --action-name 'pose_idle_confident_v1' --frame 1 --save"
```

Rebuild the idle stack from the captured pose action:

```powershell
powershell -ExecutionPolicy Bypass -Command "& 'F:\Gail\blender\animation_master\scripts\rebuild_idle_live.ps1'"
```

Rebuild without opening Blender afterward:

```powershell
powershell -ExecutionPolicy Bypass -Command "& 'F:\Gail\blender\animation_master\scripts\rebuild_idle_live.ps1' -OpenRegular:`$false"
```

For generating the regular avatar file directly from the master file:

```powershell
"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe" "C:\Users\jbates\Desktop\gail_rig_master.blend" --python "F:\Gail\blender\animation_master\scripts\generate_regular_avatar_from_master.py" -- --manifest "F:\Gail\blender\animation_master\manifests\regular_avatar_build.gail.example.json"
```

For reliably attaching a clip after opening the file:

```powershell
"C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe" "C:\Users\jbates\Desktop\gail_rig.blend" --python "F:\Gail\blender\animation_master\scripts\assign_clip_to_armature.py" -- --armature "VAMP Laurina for G8 Female" --action "idle_base_v1" --frame-start 1 --frame-end 96
```

Simplest preview commands:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\blender\animation_master\scripts\launch_idle_preview.ps1"
```

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\blender\animation_master\scripts\launch_nod_preview.ps1"
```

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\blender\animation_master\scripts\launch_clip_preview.ps1" -Action "idle_base_v1"
```

One-command idle rebuild:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\blender\animation_master\scripts\rebuild_idle_live.ps1"
```

Export modular avatar assets for the host machine profile:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\export-avatar-assets.ps1" -RuntimeProfile high
```

Export modular avatar assets for a lighter x86 client profile:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\export-avatar-assets.ps1" -RuntimeProfile medium
```

Export a minimal watch/display profile:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\export-avatar-assets.ps1" -RuntimeProfile low
```

Rebuild without opening Blender afterward:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\blender\animation_master\scripts\rebuild_idle_live.ps1" -OpenRegular:$false
```

## Supporting Commands

Validate the external AnimoXTend setup and Gail export roots:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\check-animoxtend-setup.ps1"
```

```powershell
"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe" "C:\Users\jbates\Desktop\gail_rig.blend" --python "F:\Gail\blender\animation_master\scripts\validate_animation_master.py" -- --manifest "F:\Gail\blender\animation_master\manifests\clip_registry.gail.example.json"
```

```powershell
"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe" "C:\Users\jbates\Desktop\gail_rig.blend" --python "F:\Gail\blender\animation_master\scripts\mark_library_actions.py" -- --manifest "F:\Gail\blender\animation_master\manifests\clip_registry.gail.example.json"
```

```powershell
"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe" "C:\Users\jbates\Desktop\gail_rig.blend" --python "F:\Gail\blender\animation_master\scripts\export_actions_glb.py" -- --manifest "F:\Gail\blender\animation_master\manifests\clip_registry.gail.example.json" --profile "playcanvas_glb"
```

Import and retarget a single source FBX:

```powershell
"C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe" "F:\Gail\gail_rig.blend" -b --python "F:\Gail\blender\animation_master\scripts\mixamo_to_gail.py" -- --source-fbx "F:\Gail\blender\animation_master\source\imports\raw\mixamo\MyGesture.fbx" --category gesture --clip-name gesture_my_gesture_v1 --register --save
```

Batch-import a folder of source FBXs:

```powershell
"C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe" "F:\Gail\gail_rig.blend" -b --python "F:\Gail\blender\animation_master\scripts\mixamo_to_gail.py" -- --source-dir "F:\Gail\blender\animation_master\source\imports\raw\mixamo" --category gesture --register --save
```
