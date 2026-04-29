# PlayCanvas Handoff Package

This folder is the current handoff package for the other PC.

It is focused on:

1. actual avatar assets
2. a small starter animation set
3. the Blender add-on and scripts used to produce them
4. the docs that explain the current conversion path

## What Is In Here

### Avatar assets

- [body.glb](D:\playcanvas_handoff_20260330\assets\avatar\parts\body.glb)
- [hair.glb](D:\playcanvas_handoff_20260330\assets\avatar\parts\hair.glb)
- [clothing.glb](D:\playcanvas_handoff_20260330\assets\avatar\parts\clothing.glb)
- [accessories.glb](D:\playcanvas_handoff_20260330\assets\avatar\parts\accessories.glb)
- [base_avatar_flat.png](D:\playcanvas_handoff_20260330\assets\avatar\textures\base_avatar_flat.png)

### Starter animations

- [idle_default.glb](D:\playcanvas_handoff_20260330\assets\animations\idle_default.glb)
- [idle_alt.glb](D:\playcanvas_handoff_20260330\assets\animations\idle_alt.glb)
- [idle_cover.glb](D:\playcanvas_handoff_20260330\assets\animations\idle_cover.glb)
- [listen_ack.glb](D:\playcanvas_handoff_20260330\assets\animations\listen_ack.glb)
- [listen_focus.glb](D:\playcanvas_handoff_20260330\assets\animations\listen_focus.glb)
- [wave_hello.glb](D:\playcanvas_handoff_20260330\assets\animations\wave_hello.glb)

### Blender source and outputs

- [test_avatar.blend](D:\playcanvas_handoff_20260330\blender\test_avatar.blend)
- [animation_builder_test_output.blend](D:\playcanvas_handoff_20260330\blender\animation_builder_test_output.blend)

### Add-on

- [gail_production_workbench](D:\playcanvas_handoff_20260330\blender\addons\gail_production_workbench\__init__.py)
- [add-on README](D:\playcanvas_handoff_20260330\blender\addons\gail_production_workbench\README.md)

### Conversion and validation scripts

- [run-gail-production-workbench-test.ps1](D:\playcanvas_handoff_20260330\blender\scripts\run-gail-production-workbench-test.ps1)
- [test_gail_production_workbench.py](D:\playcanvas_handoff_20260330\blender\scripts\test_gail_production_workbench.py)
- [run-animoxtend-rig-setup.ps1](D:\playcanvas_handoff_20260330\blender\scripts\run-animoxtend-rig-setup.ps1)
- [animoxtend_rig_setup.py](D:\playcanvas_handoff_20260330\blender\scripts\animoxtend_rig_setup.py)
- [run-animoxtend-local-pipeline.ps1](D:\playcanvas_handoff_20260330\blender\scripts\run-animoxtend-local-pipeline.ps1)
- [animoxtend_local_retarget_export.py](D:\playcanvas_handoff_20260330\blender\scripts\animoxtend_local_retarget_export.py)
- [start_animation_viewer.ps1](D:\playcanvas_handoff_20260330\blender\scripts\start_animation_viewer.ps1)

### Manifests

- [integration_asset_manifest.json](D:\playcanvas_handoff_20260330\manifests\integration_asset_manifest.json)
- [package_manifest.json](D:\playcanvas_handoff_20260330\manifests\package_manifest.json)
- [avatar_partition_manifest.json](D:\playcanvas_handoff_20260330\manifests\avatar_partition_manifest.json)
- [texture_manifest.json](D:\playcanvas_handoff_20260330\manifests\texture_manifest.json)

### Docs

- [PLAYCANVAS_AVATAR_PIPELINE.md](D:\playcanvas_handoff_20260330\docs\PLAYCANVAS_AVATAR_PIPELINE.md)
- [GAIL_PRODUCTION_WORKBENCH_PLAN.md](D:\playcanvas_handoff_20260330\docs\GAIL_PRODUCTION_WORKBENCH_PLAN.md)
- [ANIMOXTEND_LOCAL_PIPELINE.md](D:\playcanvas_handoff_20260330\docs\ANIMOXTEND_LOCAL_PIPELINE.md)
- [ANIMOXTEND_END_TO_END_SYSTEM.md](D:\playcanvas_handoff_20260330\docs\ANIMOXTEND_END_TO_END_SYSTEM.md)
- [ANIMOXTEND_SCRIPT_INVENTORY.md](D:\playcanvas_handoff_20260330\docs\ANIMOXTEND_SCRIPT_INVENTORY.md)

## How These Assets Were Produced

### Avatar package

The avatar parts and texture outputs came from the guided Blender add-on:

- add-on: [__init__.py](D:\playcanvas_handoff_20260330\blender\addons\gail_production_workbench\__init__.py)
- test source: [test_avatar.blend](D:\playcanvas_handoff_20260330\blender\test_avatar.blend)

Validated headless flow:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\playcanvas_handoff_20260330\blender\scripts\run-gail-production-workbench-test.ps1"
```

That guided path performs:

1. scene scan
2. pose capture
3. loop build
4. action blend
5. root normalization
6. avatar partition
7. avatar part export
8. skin tuning
9. texture tier export

### Animation previews

The animation GLBs came from the local AnimoXtend conversion path:

- [run-animoxtend-local-pipeline.ps1](D:\playcanvas_handoff_20260330\blender\scripts\run-animoxtend-local-pipeline.ps1)
- [animoxtend_local_retarget_export.py](D:\playcanvas_handoff_20260330\blender\scripts\animoxtend_local_retarget_export.py)

That pipeline does:

1. read local NPZ clip library
2. open the mapped target blend
3. apply motion to `BufferArmature`
4. retarget to the target avatar rig
5. export lightweight GLB previews

## Conversion Pause State

Bulk conversion was paused intentionally so you can move ahead with integration work.

Pause snapshot:

- [pause_snapshot_20260330_1418.json](C:\Users\guysi\Desktop\animations\metadata\pause_snapshot_20260330_1418.json)

At pause time:

1. worker 0 completed `112`
2. worker 1 completed `50`
3. no worker failures were recorded

## Recommended Immediate Use On The Other PC

Start with the files in:

- [assets\avatar](D:\playcanvas_handoff_20260330\assets\avatar)
- [assets\animations](D:\playcanvas_handoff_20260330\assets\animations)
- [integration_asset_manifest.json](D:\playcanvas_handoff_20260330\manifests\integration_asset_manifest.json)

That is the smallest useful package for runtime integration while the full conversion remains paused.
