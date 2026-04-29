# AnimoXtend End-to-End System

This document is the current source of truth for the AnimoXtend workflow in this workspace.

It covers:

1. Local library download and organization
2. Viewer launch and preview behavior
3. Rig setup and mapping workflow
4. Local NPZ -> GLB/FBX conversion
5. Supported scripts vs retired exploratory scripts
6. Known issues and practical workarounds

## Current goals

This system was built to support:

1. Downloading the AnimoXtend motion library locally
2. Previewing and triaging clips quickly
3. Retargeting motions onto the Victoria 8 / Genesis 8 workflow
4. Exporting lightweight GLB previews
5. Exporting production-ready FBX/GLB files for the Gail animation plan

The next major phase after this system is streamlining the production flow against:

- `D:\docs\gail_animation_production_plan.pdf`

## Supported entrypoints

These are the supported scripts after cleanup.

### Library and viewer

- `D:\tools\download_animo_library.ps1`
- `D:\tools\preview-animoxtend-library.ps1`
- `D:\tools\start_animation_viewer.ps1`
- `C:\Users\guysi\Desktop\animations\metadata\viewer_runtime.html`

### Conversion pipeline

- `D:\tools\run-animoxtend-local-pipeline.ps1`
- `D:\tools\animoxtend_local_retarget_export.py`
- `D:\tools\render_glb_midframe.py`

### Rig setup package

- `D:\tools\run-animoxtend-rig-setup.ps1`
- `D:\tools\animoxtend_rig_setup.py`
- `D:\tools\animoxtend_rig_setup.README.md`

### Mapping profiles

- `D:\tools\mapping_profiles\animo_target_victoria8_test_v2.json`
- `D:\tools\mapping_profiles\animo_source_victoria8_test_v2.json`

## Library state

### Local mirror

The AnimoXtend library was mirrored locally into:

- `C:\Users\guysi\Desktop\animations`

Key subfolders:

- `C:\Users\guysi\Desktop\animations\categories`
- `C:\Users\guysi\Desktop\animations\converted\glb`
- `C:\Users\guysi\Desktop\animations\converted\fbx`
- `C:\Users\guysi\Desktop\animations\metadata`

Key metadata files:

- `C:\Users\guysi\Desktop\animations\metadata\library_index.json`
- `C:\Users\guysi\Desktop\animations\metadata\local_pipeline_progress.json`
- `C:\Users\guysi\Desktop\animations\metadata\full_glb_conversion.log`

### Current conversion run

The full proxy-GLB conversion was launched as a background batch with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\tools\run-animoxtend-local-pipeline.ps1" -MaxClips 5000 -GlbOnly
```

This currently writes progress to:

- `C:\Users\guysi\Desktop\animations\metadata\local_pipeline_progress.json`

## Viewer

### Launch

Launch the viewer with:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\tools\start_animation_viewer.ps1" -OutputRoot "C:\Users\guysi\Desktop\animations" -Port 8778
```

This opens:

- `http://localhost:8778/metadata/viewer_runtime.html`

### Viewer behavior

The viewer is intentionally simple and currently does the following:

1. Reads the library from `library_index.json`
2. Sorts converted GLB clips to the top
3. Supports `converted only`
4. Uses a shared `model-viewer` preview panel
5. Preloads converted clips on hover
6. Shows conversion progress from `local_pipeline_progress.json`

### Why the current viewer works better

Earlier iterations failed because of:

1. Stale embedded JSON blobs
2. Duplicate/partially overwritten PowerShell viewer scripts
3. Path handling split between server mode and file mode
4. Browser caching of replaced GLBs

The current viewer uses:

1. A static HTML file in the animation metadata folder
2. A plain Python `http.server`
3. Direct reads from `library_index.json`
4. Cache-busted GLB URLs

## Rig setup and mapping

## Exact mapping workflow used in this workspace

The mapping path that actually worked was:

1. Install/enable AnimoXtend from zip
2. Ensure `BufferArmature` exists
3. Build source mapping from AnimoXtend:
   - `bpy.ops.animoxtend.build_source_bone_list()`
4. Apply the saved Victoria 8 target map:
   - `animo_target_victoria8_test_v2.json`
5. Validate source and target with the add-on’s own validation operators
6. Save a mapped blend

### Packaged rig-setup entrypoint

Use:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\tools\run-animoxtend-rig-setup.ps1"
```

Validated outputs:

- `D:\test_v3_mapped_rigsetup.blend`
- `D:\tools\mapping_profiles\rig_setup_report.json`

The current validated report shows:

1. `BufferArmature` present
2. `Victoria 8` present
3. `source_valid: true`
4. `target_valid: true`
5. `target_missing_bones: []`

### Provenance

The packaged rig setup is the cleaned version of the exploratory mapping work from this session. The original one-off scripts were removed during cleanup after the packaged entrypoint was validated.

## Local conversion pipeline

### Core behavior

`run-animoxtend-local-pipeline.ps1`:

1. Reads local NPZ clips from `library_index.json`
2. Opens `D:\test_v3_mapped.blend`
3. Uses the local add-on copy in `D:\tools\_animoxtend_1_2_2_unpack`
4. Loads NPZ motion onto `BufferArmature`
5. Retargets onto `Victoria 8`
6. Exports FBX and/or GLB

### GLB preview mode

`-GlbOnly` defaults to proxy preview mode.

That means new preview GLBs should use:

1. The base body mesh only
2. A plain gray material
3. No hair
4. No clothing
5. No full textured avatar payload

### Supported commands

One clip:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\tools\run-animoxtend-local-pipeline.ps1" -Id 27044 -MaxClips 1 -GlbOnly
```

Category batch:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\tools\run-animoxtend-local-pipeline.ps1" -Category locomotion -MaxClips 25 -GlbOnly
```

All remaining clips:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\tools\run-animoxtend-local-pipeline.ps1" -MaxClips 5000 -GlbOnly
```

### Validation helpers

Render a midpoint proof of a GLB:

```powershell
"C:\Users\guysi\Desktop\blender-4.1.1-windows-x64\blender.exe" --factory-startup -b --python "D:\tools\render_glb_midframe.py" -- --input "C:\path\to\clip.glb" --output "C:\path\to\proof.png" --meta "C:\path\to\proof.json"
```

## Known issues

### 1. Blender add-on temp cleanup warnings

You may still see warnings like:

- failed to remove temp directory of bin modules
- `PermissionError` on `retarget_functions.cp311-win_amd64.pyd`

These are noisy, but they do not necessarily indicate that mapping or conversion failed.

### 2. Remote GLB preview export is unreliable

The hosted AnimoXtend export endpoint returned `500` errors repeatedly during the session.

Because of that:

1. Remote preview cannot be trusted
2. Local GLB conversion is the supported preview path

### 3. Proxy preview export is still the main place to watch

The earlier proxy strategies failed for some clips, especially `26672`.

The current direction is:

1. Use the base body mesh only
2. Keep the preview mesh plain and lightweight
3. Validate suspicious clips with `render_glb_midframe.py`

## What was built during this session

### Confirmed working

1. Full local motion mirror
2. Search/list tooling for AnimoXtend library access
3. Viewer with progress and converted-first sorting
4. Local NPZ -> GLB/FBX retarget pipeline
5. Packaged rig setup workflow
6. Mid-frame GLB proof renderer

### Important generated artifacts

- `D:\tools\mapping_profiles\rig_setup_report.json`
- `C:\Users\guysi\Desktop\animations\metadata\local_pipeline_progress.json`
- `C:\Users\guysi\Desktop\animations\metadata\full_glb_conversion.log`
- `C:\Users\guysi\Desktop\animations\metadata\viewer_runtime.html`

## Recommended next phase

Once the full GLB conversion finishes and the viewer proves stable, the next step is to streamline the animation setup specifically for:

- `D:\docs\gail_animation_production_plan.pdf`

That should focus on:

1. Promotion from preview GLBs to production clips
2. Category curation
3. Facial layer pairing
4. Export manifests for Gail production
5. Multi-avatar transfer strategy
