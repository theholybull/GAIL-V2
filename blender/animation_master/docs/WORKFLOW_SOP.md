# Workflow SOP

## Disk Layout

Use this on-disk layout:

```text
F:\Gail\blender\animation_master\
|-- docs\
|-- manifests\
|-- scripts\
|-- source\
|   |-- gail_anim_lab.blend
|   |-- gail_animation_master.blend
|   |-- archive\
|   |   |-- gail_animation_master.v001.blend
|   |   `-- gail_animation_master.v002.blend
|   |-- imports\
|   |   |-- raw\
|   |   |   `-- mixamo\
|   |   `-- retargeted\
|   `-- notes\
|       |-- import_log_2026_03_18.md
|       `-- cleanup_notes_2026_03_18.md
`-- exports\
    |-- glb\
    |   |-- avatar\
    |   |   `-- gail_avatar_base.glb
    |   `-- clips\
    |       |-- approved\
    |       |   |-- idle\
    |       |   |   `-- idle_base_v1.glb
    |       |   `-- talk\
    |       |       `-- talk_base_v1.glb
    |       `-- review\
    `-- reports\
        `-- export_report_2026_03_18.json
```

Current real working files:

- Master source file: `C:\Users\jbates\Desktop\gail_rig_master.blend`
- Derived regular file: `C:\Users\jbates\Desktop\gail_rig.blend`

## Armature and Modular Character Rules

Hard rules:

- One production skeleton only: `rig_gail_master`.
- All production body, clothes, hair, and accessories must bind to that armature.
- All deform-bone names are frozen once the first approved clip ships.
- Facial animation remains shape-key based.
- The morph-rich master avatar can carry extra authoring morphs.
- The derived regular file should keep only approved production-safe requirements.
- Clothing pieces must remain separate meshes by logical slot.
- Runtime-ready clothes should not be merged into the body mesh.

Recommended mesh slots:

- `body`
- `hair`
- `upper`
- `lower`
- `outer`
- `footwear`
- `accessory`

Interactive clothing planning rules:

- Author clothing interaction clips against the same rig.
- Prefer body motion plus garment-specific corrective shape keys before adding more bones.
- Only add helper bones when a real interaction repeatedly breaks with shape keys alone.
- If helper bones are added, make them non-deform unless garment deformation truly requires them.
- Name future garment helpers with `hlp_` prefix and isolate their use in garment-specific notes.

Worth planning now:

- hand contact pose library
- wrist and elbow clearance QA poses
- optional non-deform helpers for coat hem or hoodie hem only if interaction clips demand them later

Defer for now:

- full cloth simulation pipeline
- per-outfit bespoke skeleton branches
- physics-only runtime secondary rigs

## Master Authoring Workflow

1. Open `gail_rig_master.blend`.
2. Import or tweak the morph-heavy avatar there.
3. Block body motion and shape-key performance there.
4. Keep experimental helpers, extra morphs, and temporary source assets in the master file only.
5. When the clip reaches `review` quality, separate body and face action data if needed.
6. Register the clip in `transfer_manifest.gail.json`.

## Regular Avatar Generation Workflow

1. Open `gail_rig_master.blend`.
2. Run `generate_regular_avatar_from_master.py` with `regular_avatar_build.gail.json`.
3. Remove non-runtime collections, temp objects, and disallowed shape keys.
4. Save a copy as `gail_rig.blend`.
5. Treat `gail_rig.blend` as the clean regular derivative, not as a second authoring master.

## Import and Retarget Workflow

1. Save a snapshot of the master file before import work.
2. Import the source animation into the master file under `08_IMPORT_SOURCES > SRC_raw_import`.
3. Rename the imported armature and objects with `src_` prefix immediately.
4. Log provenance in `import_sources.gail.json`.
5. Retarget the motion onto Gail's master rig in `SRC_retarget_workspace`.
6. Bake the retargeted motion onto Gail's rig.
7. Remove translation drift, bad wrist rolls, shoulder collapse, and foot sliding.
8. Normalize frame range and loop integrity where needed.
9. Save the cleaned motion as a named master Action.
10. Rename it using the production grammar.
11. Transfer it into `gail_rig.blend` only after review.
12. Enable `Fake User` in the regular file after transfer.
13. Add or update the clip entry in `clip_registry.gail.json`.
14. Delete imported junk from the master workspace or move it into `90_ARCHIVE` if it still has audit value.

Cleanup rules:

- No imported source armature remains outside `08_IMPORT_SOURCES` or `90_ARCHIVE`.
- No production action keeps source prefixes like `mixamo_`, `take_001`, or `armature|`.
- No source mesh or source armature is allowed in `09_EXPORT_STAGING`.

## Export Workflow

Use one GLB per runtime clip.

Reasons:

- simpler runtime loading
- easier per-clip approval
- easier re-export of one changed clip
- safer automation
- cleaner provenance

Export rules:

- Export from `09_EXPORT_STAGING` only.
- Export only from `gail_rig.blend`.
- Stage only the production armature and runtime meshes needed for that export set.
- Export body clips separately from future face clips.
- File names must equal the clip name: `idle_base_v1.glb`
- Organize export folders by approval state and category.

Recommended export paths:

- `exports\glb\avatar\gail_avatar_base.glb`
- `exports\glb\clips\approved\idle\idle_base_v1.glb`
- `exports\glb\clips\approved\talk\talk_base_v1.glb`
- `exports\glb\clips\review\remove\remove_sweatshirt_v1.glb`

Export staging contents:

- `rig_gail_master`
- currently approved production meshes
- optional `exp_gail_root`

Never include:

- source import armatures
- QA meshes
- archive content
- deprecated outfits
- camera or light helpers
- reference empties

## Automation Plan

Automate these first:

- regular-avatar generation from the master blend
- master-to-regular action transfer
- action fake-user enforcement
- clip registry validation
- export queue generation from registry status
- batch per-clip export
- report generation after export

Store metadata in:

- Blender action custom properties for quick local context
- `clip_registry.gail.json` for automation and review tooling
- `import_sources.gail.json` for provenance
- `transfer_manifest.gail.json` for master-to-regular transfer audit

Recommended registry fields:

- clip name
- category
- version
- status
- frame range
- loop flag
- source provenance
- export target
- body or face partition
- notes

Recommended automation safety rules:

- export only clips with `status = approved` unless `--include-review` is passed
- refuse export if the armature name is not `rig_gail_master`
- refuse export if an action is missing `Fake User`
- refuse export if clip registry naming and action naming do not match
- write a JSON export report every run

## Next Operating Step

Use `gail_rig_master.blend` as the morph-rich source, generate `gail_rig.blend` as the clean regular avatar file, and transfer only approved actions into the regular file for export.
