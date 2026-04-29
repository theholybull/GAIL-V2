# AnimoXtend Script Inventory

This inventory separates supported scripts from obsolete diagnostics.

## Supported

### Library

- `D:\tools\download_animo_library.ps1`
- `D:\tools\preview-animoxtend-library.ps1`
- `D:\tools\start_animation_viewer.ps1`

### Mapping

- `D:\tools\run-animoxtend-rig-setup.ps1`
- `D:\tools\animoxtend_rig_setup.py`
- `D:\tools\mapping_profiles\animo_target_victoria8_test_v2.json`
- `D:\tools\mapping_profiles\animo_source_victoria8_test_v2.json`

### Conversion

- `D:\tools\run-animoxtend-local-pipeline.ps1`
- `D:\tools\animoxtend_local_retarget_export.py`
- `D:\tools\render_glb_midframe.py`

### Existing production pipeline

- `D:\tools\export-playcanvas-pipeline.ps1`
- `D:\animation_master\scripts\export_actions_glb.py`
- `D:\animation_master\scripts\export_actions_fbx.py`
- `D:\animation_master\scripts\export_clip_common.py`

## Removed during cleanup

These exploratory scripts were removed after the supported entrypoints were packaged and validated:

- `D:\tools\repair_and_apply_animo_mappings.py`
- `D:\tools\fix_v3_victoria_target_mapping.py`
- `D:\tools\animoxtend_mapping_audit.py`
- `D:\tools\generate_test_v2_mapping_profiles.py`
- `D:\tools\inspect_test_v2_rigs.py`
- `D:\tools\inspect_v3_armatures.py`
- `D:\tools\trial_animoxtend_run.py`
- `D:\tools\trial_animoxtend_direct_import.py`
- `D:\tools\trial_animoxtend_state_probe.py`
- `D:\tools\dump_viewer_api_diag.ps1`
- `D:\tools\build_animation_viewer_static.ps1`

Their behavior is preserved in:

- `D:\tools\run-animoxtend-rig-setup.ps1`
- `D:\tools\animoxtend_rig_setup.py`
- `D:\tools\run-animoxtend-local-pipeline.ps1`
- `D:\tools\start_animation_viewer.ps1`
