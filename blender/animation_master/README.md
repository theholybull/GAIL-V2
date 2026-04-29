# Gail Blender Animation Master

This package defines the Blender-side animation authoring and library workflow for Gail.

The working assumptions are locked:

- Blender is the animation source of truth.
- PlayCanvas is the runtime client.
- Runtime handoff format is `.glb`.
- Gail uses one master rig only.
- Facial animation remains shape-key based.
- Body and face animation should stay separable.
- Imported motion is allowed, but every kept clip must be cleaned and normalized onto Gail's rig.
- The morph-rich source file is the long-term master blend.
- A clean regular avatar file should be generated from that master for export-safe work.

Start here:

- [CHANGE_TICKET.md](/F:/Gail/blender/animation_master/docs/CHANGE_TICKET.md)
- [IMPLEMENTATION_SUMMARY.md](/F:/Gail/blender/animation_master/docs/IMPLEMENTATION_SUMMARY.md)
- [ANIMOXTEND_SETUP.md](/F:/Gail/blender/animation_master/docs/ANIMOXTEND_SETUP.md)
- [AVATAR_EXPORT_LAYOUT.md](/F:/Gail/blender/animation_master/docs/AVATAR_EXPORT_LAYOUT.md)
- [MASTER_STRUCTURE.md](/F:/Gail/blender/animation_master/docs/MASTER_STRUCTURE.md)
- [NAMING_RULES.md](/F:/Gail/blender/animation_master/docs/NAMING_RULES.md)
- [WORKFLOW_SOP.md](/F:/Gail/blender/animation_master/docs/WORKFLOW_SOP.md)
- [LAB_TO_MASTER_WORKFLOW.md](/F:/Gail/blender/animation_master/docs/LAB_TO_MASTER_WORKFLOW.md)

Starter automation and metadata:

- [animation_manifest.schema.json](/F:/Gail/blender/animation_master/manifests/animation_manifest.schema.json)
- [clip_registry.gail.example.json](/F:/Gail/blender/animation_master/manifests/clip_registry.gail.example.json)
- [import_sources.gail.example.json](/F:/Gail/blender/animation_master/manifests/import_sources.gail.example.json)
- [transfer_manifest.gail.example.json](/F:/Gail/blender/animation_master/manifests/transfer_manifest.gail.example.json)
- [regular_avatar_build.gail.example.json](/F:/Gail/blender/animation_master/manifests/regular_avatar_build.gail.example.json)
- [asset_partition.gail.json](/F:/Gail/blender/animation_master/manifests/asset_partition.gail.json)
- [scripts/README.md](/F:/Gail/blender/animation_master/scripts/README.md)

Setup validation:

- `powershell -ExecutionPolicy Bypass -File "F:\Gail\tools\check-animoxtend-setup.ps1"`

Canonical master file:

- `C:\Users\jbates\Desktop\gail_rig_master.blend`

Derived regular avatar file:

- `C:\Users\jbates\Desktop\gail_rig.blend`

Version snapshots:

- `F:\Gail\blender\animation_master\source\archive\gail_animation_master.v###.blend`
