# Change Ticket

## Title

Create Blender-side source-of-truth animation library and automation scaffold for Gail.

## Problem

Gail needs a durable animation pipeline that supports one long-lived master rig, modular meshes, imported and custom clips, future clothing interaction work, and low-friction GLB export to PlayCanvas. The repo did not yet contain a concrete Blender-side library structure, naming contract, clip metadata model, or starter automation.

## Scope

- Define one master Blender file contract for Gail animation work.
- Define collection names, action naming, archive rules, and export staging rules.
- Define modular character rules for body, clothes, hair, and accessories.
- Define standard operating procedures for import, retarget, cleanup, library save, and export.
- Add automation-friendly manifests and starter Blender Python scripts.

## Out Of Scope

- Runtime animation graph design inside PlayCanvas.
- Creating final animation content.
- Rebuilding the wider Gail asset pipeline.
- Supporting multiple production rigs.

## Decision Summary

- Keep exactly one production armature: `rig_gail_master`.
- Treat `gail_animation_master.blend` as the canonical working file.
- Store action state in Blender Actions, not NLA strips.
- Use NLA only for preview assemblies, timing tests, and export staging.
- Export one GLB per runtime clip.
- Keep action names stable and status-free; put workflow status in metadata instead.
- Preserve source provenance in JSON registry files and action custom properties.

## Deliverables Added

- Source-of-truth workflow docs under `blender/animation_master/docs`.
- Example manifest and registry JSON files under `blender/animation_master/manifests`.
- Starter Blender Python automation scripts under `blender/animation_master/scripts`.

## Acceptance Criteria

- A new clip can be imported, retargeted, cleaned, named, registered, validated, and exported without inventing new structure.
- The system remains centered on one master rig.
- Clip exports are batch-friendly and avoid exporting junk objects.
- Future clothing interaction clips can be added without reorganizing the library.
