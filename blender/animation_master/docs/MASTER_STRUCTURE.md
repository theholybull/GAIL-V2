# Master Blender File Structure

## Canonical Master File

- Working file: `gail_animation_master.blend`
- Location: `F:\Gail\blender\animation_master\source\gail_animation_master.blend`
- Snapshot files: `gail_animation_master.v001.blend`, `gail_animation_master.v002.blend`
- Snapshot location: `F:\Gail\blender\animation_master\source\archive\`

Do not branch this into separate outfit-specific animation masters. Outfits belong to the same rig and same library.

## Collection Tree

Build the collection tree exactly like this:

```text
SCN_GAIL_ANIMATION_MASTER
|-- 00_REFERENCE
|   |-- REF_scale
|   |-- REF_floor
|   `-- REF_camera_angles
|-- 01_RIG
|   |-- RIG_master
|   |-- RIG_widgets
|   `-- RIG_pose_markers
|-- 02_BODY
|   |-- GEO_body
|   |-- GEO_eyes
|   |-- GEO_teeth
|   |-- GEO_brows
|   `-- GEO_lashes
|-- 03_HAIR
|   |-- GEO_hair_default
|   `-- GEO_hair_variants
|-- 04_CLOTHES
|   |-- OUT_base
|   |-- OUT_upper
|   |-- OUT_lower
|   |-- OUT_outerwear
|   `-- OUT_footwear
|-- 05_ACCESSORIES
|   |-- ACC_jewelry
|   |-- ACC_wearables
|   `-- ACC_props_preview
|-- 06_FACE_TEST
|   |-- FACE_shape_key_preview
|   `-- FACE_lighting_preview
|-- 07_ANIM_LIBRARY
|   |-- ANIM_core_identity
|   |-- ANIM_conversation
|   |-- ANIM_reactions
|   |-- ANIM_locomotion_support
|   |-- ANIM_interactions
|   `-- ANIM_clothing_interactions
|-- 08_IMPORT_SOURCES
|   |-- SRC_raw_import
|   |-- SRC_retarget_workspace
|   `-- SRC_cleanup_workspace
|-- 09_EXPORT_STAGING
|   |-- EXP_avatar_base
|   |-- EXP_clip_preview
|   `-- EXP_validation_only
|-- 10_QA
|   |-- QA_pose_checks
|   |-- QA_deformation_checks
|   `-- QA_clip_reviews
|-- 90_ARCHIVE
|   |-- ARC_actions_superseded
|   |-- ARC_source_meshes
|   `-- ARC_test_exports
`-- 99_DEPRECATED
    |-- DEP_old_rigs
    `-- DEP_unused_objects
```

## Collection Intent

- `00_REFERENCE`: scale markers, floor plane, cameras, neutral references only.
- `01_RIG`: the production armature and rig controls. No duplicate rigs.
- `02_BODY` through `05_ACCESSORIES`: production meshes that follow the master rig.
- `06_FACE_TEST`: shape-key QA and facial preview helpers.
- `07_ANIM_LIBRARY`: organizational buckets for actions; this is for human navigation, not export.
- `08_IMPORT_SOURCES`: temporary imported clips, retarget helpers, and cleanup workspace.
- `09_EXPORT_STAGING`: the only collection the export script should touch.
- `10_QA`: deformation, clipping, and silhouette checks.
- `90_ARCHIVE`: recoverable old content still worth keeping.
- `99_DEPRECATED`: content that should never be used again unless intentionally revived.

## Object Naming Rules

- Armature object: `rig_gail_master`
- Armature data block: `rig_gail_master_data`
- Body root mesh: `geo_gail_body`
- Face mesh holding shape keys: `geo_gail_face`
- Hair meshes: `geo_hair_<name>`
- Clothes meshes: `geo_cloth_<slot>_<name>`
- Accessories: `geo_acc_<slot>_<name>`
- Export root empty if used: `exp_gail_root`

Examples:

- `geo_cloth_outer_sweatshirt_gray`
- `geo_cloth_upper_tank_basic`
- `geo_hair_bob_short`
- `geo_acc_wrist_watch_black`

## Action Library Rules

- Actions live on `rig_gail_master`.
- Shape-key facial actions should eventually live on `geo_gail_face`.
- Body actions and face actions should not be baked together by default.
- Library actions must have `Fake User` enabled.
- Library actions should never be kept alive only by an NLA strip.
- NLA is for preview and sequencing, not for long-term clip ownership.

## Test and Pose Collections

Use these scene helpers now:

- `QA_pose_checks`
  - A-pose
  - neutral idle
  - extreme crouch
  - arms overhead
  - seated knee compression
- `QA_deformation_checks`
  - shoulder raise
  - elbow bend
  - deep twist
  - jacket-over-hips
  - sweatshirt-pull test

## Clothing Interaction Planning

Reserve `ANIM_clothing_interactions` now for actions like:

- `remove_sweatshirt_v1`
- `put_on_jacket_v1`
- `adjust_collar_v1`
- `adjust_skirt_seated_v1`

Do not add simulation-driven cloth rigs to the production armature yet. Instead, plan the clips as authored body motion with optional per-garment corrective shape keys or limited garment helper bones added only when a real clip requires them.

## What Must Never Change Once Locked

- `rig_gail_master` object name
- deform-bone names
- base axis/orientation convention
- body mesh shape-key channel names used by face playback
- export collection names under `09_EXPORT_STAGING`
- clip naming grammar in [NAMING_RULES.md](/F:/Gail/blender/animation_master/docs/NAMING_RULES.md)
