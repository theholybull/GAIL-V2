# Lab To Master Workflow

## Purpose

Use two Blender files on purpose:

- `gail_rig_master.blend`
  - morph-rich source-of-truth master
  - exploratory body motion
  - facial shape-key performance
  - source cleanup and blocking
  - temporary helper setups if needed
- `gail_rig.blend`
  - generated regular avatar file
  - cleaned production rig contract
  - export staging
  - runtime-safe clip ownership

This split is the default workflow now.

## Why This Produces Better Results

The morph-heavy master file is better for lifelike performance because it gives more room for:

- subtle facial shaping
- mouth and expression iteration
- flesh and silhouette correction during blocking
- garment-adjacent corrective sculpting
- exploratory posing without polluting the production library

The master file stays clean so runtime exports remain stable.

## Hard Boundary

- The master file is allowed to carry authoring complexity.
- The regular avatar file is not.
- Derivation is the boundary between them.

## Promotion Rule

A clip or asset moves from master to regular file only when all of these are true:

- clip name matches production naming rules
- body motion is final enough to reuse
- face action is either separated or intentionally omitted
- frame range is defined
- provenance is logged
- transfer entry exists in `transfer_manifest.gail.json`

## Recommended File Roles

### Master file

Keep in `gail_rig_master.blend`:

- extra morphs
- test meshes
- shape-key experiments
- temporary animation helpers
- imported source armatures
- reference footage empties
- throwaway retarget passes

### Regular file

Keep in `gail_rig.blend`:

- `rig_gail_master`
- production meshes only
- approved actions only
- approved face actions only
- export staging collections only
- archive snapshots only

## Transfer Strategy

Derive clips using action-level transfer, not full scene merging.

Preferred transfer units:

- body action on `rig_gail_master`
- face action on `geo_gail_face`
- metadata entry in `clip_registry.gail.json`
- provenance entry in `transfer_manifest.gail.json`

Do not copy the whole lab scene into the master file.
Do not turn the regular file into a second source-of-truth.

## Approval States

Use these states across the two files:

- `lab_blocking`
- `lab_polish`
- `review`
- `approved`
- `deprecated`

Only `approved` clips belong in the export path from the regular file.

## Suggested First Practical Use

1. Animate and tweak `nod_small_v1` in `gail_rig_master.blend`.
2. Separate body and face if needed.
3. Register it in `transfer_manifest.gail.json`.
4. Transfer the approved body action into `gail_rig.blend`.
5. Run validation in the regular file.
6. Export the clip from the regular file only.
