# Gail Export Tools

Blender add-on for Object Mode workflows around Gail asset export.

Current MVP features:

- import a GLB into the current scene
- scan the scene for armatures, selected meshes, and actions
- run existing repo animation generators from the add-on UI
- import a Mixamo FBX and retarget it onto Gail from the add-on UI
- register a selected avatar/clothing/hair/accessory/background/animation asset into:
  - `playcanvas-app/config/work-lite-modules.gail.json`
  - `blender/animation_master/manifests/asset_partition.gail.json` when enabled
- export the selected module directly to a PlayCanvas asset path
- register a clip into `clip_registry.gail.example.json`
- export the active clip directly to a PlayCanvas animation path
- run the full repo export pipeline from Blender

Install in Blender as a local add-on folder and use the `Gail Export` tab in the 3D View sidebar while in Object Mode.

Generator presets currently wrap the repo's existing scripts for:

- pose capture
- nod generation
- idle body generation
- idle face generation
- listen body generation
- talk body generation

Mixamo retarget:

- choose a downloaded Mixamo `.fbx`
- optionally set the Gail clip name and category
- click `Retarget Mixamo FBX`
- the script imports the FBX, retargets to Gail, bakes a clean action, and can register it in the clip registry

Headless smoke test:

```powershell
& "C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe" `
  "F:\Gail\gail_rig.blend" -b `
  --python "F:\Gail\tools\blender-gail-export-addon\smoke_test_generator.py"
```
