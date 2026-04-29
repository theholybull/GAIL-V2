# AnimoXtend Local Pipeline

This pipeline converts mirrored AnimoXtend NPZ clips into locally retargeted exports using Blender and the mapped Victoria 8 rig in `D:\test_v3_mapped.blend`.

It exists because the hosted AnimoXtend preview/export endpoint was returning `500` for GLB preview requests, while local retarget plus local export still works.

## Entry Points

- `D:\tools\run-animoxtend-local-pipeline.ps1`
- `D:\tools\animoxtend_local_retarget_export.py`

## What It Does

1. Reads `C:\Users\guysi\Desktop\animations\metadata\library_index.json`
2. Selects local `.npz` clips by id and/or category
3. Launches Blender headless on `D:\test_v3_mapped.blend`
4. Loads the NPZ onto `BufferArmature`
5. Retargets onto `Victoria 8` using the saved target map
6. Exports local FBX and optional local GLB files
7. Writes a per-run manifest and report under `C:\Users\guysi\Desktop\animations\metadata`
8. Updates the library index so the viewer can use local GLB previews

## Default Rig Inputs

- Blend: `D:\test_v3_mapped.blend`
- Source armature: `BufferArmature`
- Target armature: `Victoria 8`
- Target mapping: `D:\tools\mapping_profiles\animo_target_victoria8_test_v2.json`
- Add-on root: `D:\tools\_animoxtend_1_2_2_unpack`
- API key file: `D:\tools\animoxtend_api_key.txt`

## Usage

Export one known clip to FBX:

```powershell
& 'D:\tools\run-animoxtend-local-pipeline.ps1' -Id 27044 -MaxClips 1
```

Export one known clip to both FBX and GLB:

```powershell
& 'D:\tools\run-animoxtend-local-pipeline.ps1' -Id 27044 -MaxClips 1 -ExportGlb
```

Export GLB only:

```powershell
& 'D:\tools\run-animoxtend-local-pipeline.ps1' -Category locomotion -MaxClips 25 -GlbOnly
```

Skip clips that already have converted outputs and show live progress in the viewer:

```powershell
& 'D:\tools\run-animoxtend-local-pipeline.ps1' -Category locomotion -MaxClips 25 -GlbOnly -SkipExistingConverted
```

Export the first 25 locomotion clips:

```powershell
& 'D:\tools\run-animoxtend-local-pipeline.ps1' -Category locomotion -MaxClips 25
```

Preview the batch selection without launching Blender:

```powershell
& 'D:\tools\run-animoxtend-local-pipeline.ps1' -Category locomotion -MaxClips 25 -DryRun
```

Export armature-only clips:

```powershell
& 'D:\tools\run-animoxtend-local-pipeline.ps1' -Category locomotion -MaxClips 25 -ArmatureOnly
```

## Outputs

- FBX: `C:\Users\guysi\Desktop\animations\converted\fbx\<category>\*.fbx`
- GLB: `C:\Users\guysi\Desktop\animations\converted\glb\<category>\*.glb`
- Manifest: `C:\Users\guysi\Desktop\animations\metadata\local_pipeline_manifest_*.json`
- Report: `C:\Users\guysi\Desktop\animations\metadata\local_pipeline_report_*.json`
- Live progress: `C:\Users\guysi\Desktop\animations\metadata\local_pipeline_progress.json`

## Validated Example

The clip `27044_walk` was validated through this pipeline.

Validated outputs:

- `C:\Users\guysi\Desktop\animations\converted\fbx\locomotion\27044_walk.fbx`
- `C:\Users\guysi\Desktop\animations\converted\glb\locomotion\27044_walk.glb`
- `C:\Users\guysi\Desktop\animations\metadata\local_pipeline_report_20260329_113131.json`

The validated run reported:

- `frame_start = 48`
- `frame_end = 83`
- `errors = []`

## Notes

- Local GLB export can emit duplicate-channel warnings from Blender's glTF exporter. The validated run still completed and wrote a usable `.glb`.
- The pipeline currently assumes the mapped Genesis 8 / Victoria 8 rig layout already present in `D:\test_v3_mapped.blend`.
- If you change the target rig or mapping, update the wrapper arguments instead of editing the Blender script.