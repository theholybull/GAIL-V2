# AnimoXTend Setup

## Purpose

This is the Gail-side setup guide for the local AnimoXTend toolchain staged under `F:\Gail`.

Use this when you need to verify:

- the AnimoXTend API key exists
- the unpacked add-on exists
- the local retarget/export pipeline exists
- the Gail Blender export add-on exists
- the Gail avatar export folders and manifests are ready

## Local Dependency Paths

These are now staged under the repo/workspace drive:

- API key: `F:\Gail\tools\animoxtend_api_key.txt`
- unpacked add-on: `F:\Gail\tools\_animoxtend_1_2_2_unpack`
- local pipeline wrapper: `F:\Gail\tools\run-animoxtend-local-pipeline.ps1`
- local retarget/export script: `F:\Gail\tools\animoxtend_local_retarget_export.py`
- rig setup wrapper: `F:\Gail\tools\run-animoxtend-rig-setup.ps1`
- rig setup script: `F:\Gail\tools\animoxtend_rig_setup.py`
- system reference doc: `F:\Gail\docs\ANIMOXTEND_END_TO_END_SYSTEM.md`
- viewer runtime root: `F:\Gail\data\animation_viewer`
- viewer page: `F:\Gail\data\animation_viewer\metadata\viewer_runtime.html`

Gail-side paths:

- Gail Blender export add-on: `F:\Gail\tools\blender-gail-export-addon`
- Gail avatar partition manifest: `F:\Gail\blender\animation_master\manifests\asset_partition.gail.json`
- Gail runtime avatar root: `F:\Gail\playcanvas-app\assets\gail\avatars`

## One-Command Validation

Run:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\check-animoxtend-setup.ps1"
```

That script verifies the local `F:` AnimoXTend paths and the Gail export paths together.

It exits non-zero if the setup is incomplete.

## Blender Add-On Roles

There are two separate concerns here.

### AnimoXTend

AnimoXTend handles:

- source motion loading
- retarget mapping
- local NPZ-to-rig retarget
- local FBX/GLB conversion support

### Gail Export Tools

The Gail Blender add-on handles:

- module registration
- module export path generation
- PlayCanvas module manifest updates
- Gail avatar partition manifest updates
- clip registration
- clip export

The Gail add-on does not replace AnimoXTend.
It sits on top of the Gail repo and makes the Gail-side export contract consistent.

## Current Pipeline Split

### Motion conversion side

Use the local `F:` pipeline when you have source animations:

```powershell
powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\run-animoxtend-local-pipeline.ps1" -Id 27044 -MaxClips 1 -GlbOnly
```

That is for:

- retargeting source motion
- generating local preview exports
- validating imported motion

### Gail runtime asset side

Use the Gail Blender add-on and `asset_partition.gail.json` when you are exporting:

- base avatars
- hair variants
- clothing pieces
- clothing sets
- accessories

## New Avatar Export Contract

The exporter now writes avatar runtime assets under:

```text
F:\Gail\playcanvas-app\assets\gail\avatars\<avatar_id>\
```

Layout:

```text
gail\avatars\<avatar_id>\
|-- base\
|   `-- <avatar_id>_base_avatar.glb
|-- hair\
|   `-- <hair_id>\
|       `-- <hair_id>.glb
|-- clothing\
|   |-- pieces\
|   |   `-- <piece_id>\
|   |       `-- <piece_id>.glb
|   `-- sets\
|       `-- <set_id>\
|           `-- <set_id>.glb
`-- accessories\
    `-- <accessory_id>\
        `-- <accessory_id>.glb
```

## Export Intent Rules

### New Avatar

Use `new_avatar` when:

- exporting a fresh body/face base
- introducing a new avatar identity
- building the first runtime package for that avatar

This exports the base avatar in addition to modular pieces.

### Existing Avatar Update

Use `existing_avatar_update` when:

- adding hair
- adding clothing
- adding accessories
- replacing modular pieces for an existing avatar

This avoids treating every modular update like a brand-new full avatar package.

## Clothing Export Modes

### Individual Pieces

Use `pieces` when:

- upper, lower, outer, footwear, or accessories need to be mixed independently
- you want one GLB per wearable part

The add-on will register and export each selected clothing mesh as its own runtime asset.

### Complete Set

Use `set` when:

- an outfit should stay together
- the runtime should load it as one combined clothing package

The add-on will register and export the selected clothing meshes as one GLB.

## Blender Add-On Workflow

In Blender:

1. Open the `Gail Export` panel.
2. Set `Repo Root` to `F:\Gail` if it is not detected automatically.
3. Scan the scene.
4. Pick or confirm the Gail armature.
5. In `Module Builder`, set:
   - `Kind`
   - `Avatar ID`
   - `Avatar Export`
   - `Slot`
6. For clothing, choose:
   - `Individual Pieces`
   - or `Complete Set`
7. Register the module.
8. Export the module.

## Manifest Sync

The add-on now updates:

- `F:\Gail\playcanvas-app\config\work-lite-modules.gail.json`
- `F:\Gail\blender\animation_master\manifests\asset_partition.gail.json`

The partition manifest now supports multiple avatar roots through `avatar_exports`.

## Export Script Behavior

`export_playcanvas_assets.py` now:

- supports `avatar_exports`
- keeps backward compatibility with the old manifest shape
- exports hair, clothing pieces, clothing sets, and accessories independently
- exports the base avatar only when `export_mode = new_avatar`
- duplicates avatar meshes for base export before pruning shape keys
- avoids destructive in-place pruning on the working file

## What Is Still Waiting On Source Animations

Not blocked:

- rig setup validation
- add-on registration
- module registration
- avatar/clothing/hair/accessory export
- path and manifest generation

Blocked until you provide animations:

- real animation import batch
- final retarget curation
- clip-specific cleanup
- production motion library fill-out
