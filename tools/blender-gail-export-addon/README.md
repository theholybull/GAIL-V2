# Gail Export Tools

Blender add-on for Object Mode workflows around Gail asset export.

Current working assumption:

- `gail_rig_master.blend` is the canonical animation authoring file
- `gail_rig.blend` remains the stripped regular/export derivative
- new clip authoring and registration should happen from the master file unless a workflow explicitly requires the regular file

Current MVP features:

- import a GLB into the current scene
- scan the scene for armatures, selected meshes, and actions
- capture the current pose into a reusable `pose_*` action and register it in `blender/animation_master/manifests/pose_registry.gail.json`
- preload a planned list of loop anchors, midpoints, and sequence keys from `blender/animation_master/manifests/pose_plan.gail.json`
- apply a saved pose action back onto Gail from the add-on UI
- append pose actions from another `.blend` as a simple importable pose library
- build a short loop or sequence clip directly from captured start, midpoint, and end poses
- run existing repo animation generators from the add-on UI
- import a source FBX clip and retarget it onto Gail from the add-on UI
- register a selected avatar/clothing/hair/accessory/background/animation asset into:
  - `playcanvas-app/config/work-lite-modules.gail.json`
  - `blender/animation_master/manifests/asset_partition.gail.json` when enabled
- export the selected module directly to a PlayCanvas asset path
- choose a runtime export profile for host, low-power client, or watch-class targets
- target exports to a specific `Avatar ID`
- mark exports as `New Avatar` or `Existing Avatar Update`
- export clothing as either:
  - individual pieces
  - complete sets
- register a clip into `clip_registry.gail.example.json`
- export the active clip directly to a PlayCanvas animation path
- run the full repo export pipeline from Blender

Install in Blender as a local add-on folder and use the `Gail Export` tab in the 3D View sidebar while in Object Mode.

Runtime avatar assets now export under:

```text
playcanvas-app/assets/gail/avatars/<avatar_id>/
```

Runtime profile targets:

- `High / Host PC`
  - intended for the RTX 4050 laptop host
  - keeps runtime morphs enabled
  - avoids Draco compression to reduce local decode overhead
  - uses `4096` texture tier outputs
- `Medium / N150 Client`
  - intended for low-power x86 clients
  - keeps core facial/runtime morphs
  - enables moderate Draco mesh compression
  - uses `2048` texture tier outputs
- `Low / ESP32 Watch`
  - intended for tiny display or telemetry-class clients
  - strips morphs from avatar exports
  - enables aggressive Draco compression
  - uses `512` texture tier outputs

The add-on now writes matching paths into the Gail runtime manifest and the Blender partition manifest.

Legacy generator presets currently wrap the repo's existing scripts for:

- pose capture
- legacy grouped acknowledge nod test generation from a base pose anchor
- idle body generation
- idle face generation
- listen body generation
- talk body generation

Pose library workflow:

- use `Pose Planner` to pick a planned anchor or midpoint name
- click `Seed Pose Registry` once to preload the planned pose list into the registry
- click `Use Planned Pose` to load the selected planned name into the capture fields
- author poses in `gail_rig_master.blend`
- use `Capture Pose` to turn the current armature state into a `pose_*` action
- the add-on registers that pose in `pose_registry.gail.json`
- use `Apply Pose` to restore one of the saved poses onto Gail
- use `Import Pose Library` to append `pose_*` actions from another Blender file

Pose clip workflow:

- choose a captured `Start Pose`
- optionally choose a `Mid Pose`
- choose an `End Pose`, or reuse the start pose for seamless loops
- set the clip name and frames
- click `Generate Pose Clip`

FBX retarget:

- choose a source `.fbx`
- optionally set the Gail clip name and category
- choose `Current` or `Rest` pose mode
- click `Import And Retarget FBX`
- the current backend uses the repo's Rokoko-based retarget script, auto-builds the mapping, bakes the result onto Gail, and sets the clip fields for normal Gail register/export steps

Headless smoke test:

```powershell
& "C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe" `
  "F:\Gail\gail_rig_master.blend" -b `
  --python "F:\Gail\tools\blender-gail-export-addon\smoke_test_generator.py"
```

Pose-library smoke test:

```powershell
& "C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe" `
  "F:\Gail\gail_rig_master.blend" -b `
  --python "F:\Gail\tools\blender-gail-export-addon\smoke_test_pose_library.py"
```

Pose-loop smoke test:

```powershell
& "C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe" `
  "F:\Gail\gail_rig_master.blend" -b `
  --python "F:\Gail\tools\blender-gail-export-addon\smoke_test_pose_loop.py"
```
