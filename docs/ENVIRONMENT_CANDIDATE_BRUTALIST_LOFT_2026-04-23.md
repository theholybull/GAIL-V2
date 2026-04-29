# Environment Candidate Assessment: Brutalist Loft

Date: 2026-04-23
Source file:

- `D:\Gail 2.1\brutalist_loft.glb`

## Verdict

This is a viable base environment candidate.

It is not too heavy in geometry for a first-pass shell, but it is heavier than
our locked texture targets and should be optimized before we treat it as the
runtime environment.

## Factual Snapshot

### File-level

- file type: `GLB`
- file size: `67,953,676` bytes (`~64.8 MB`)
- last modified: `2026-04-23 14:55`

### GLB structure

- scenes: `1`
- nodes: `47`
- meshes: `23`
- primitives: `23`
- materials: `22`
- textures: `20`
- images: `20`
- animations: `0`
- skins: `0`
- cameras: `0`
- lights: `0`

### Geometry estimate

- total position vertices: `68,501`
- total indices: `275,070`

This is reasonable for a base room shell.

### Texture payload

- embedded images: `20`
- external images: `0`

Texture resolution breakdown:

- `4096 x 4096`: `13`
- `2048 x 2048`: `6`
- `1024 x 1024`: `1`

This is the main optimization concern.

## Source Metadata

Embedded asset metadata reports:

- title: `Brutalist Loft`
- source: `https://sketchfab.com/3d-models/brutalist-loft-e291067c353a492c8b84ddf4b20637a8`
- author: `Elin`
- license: `CC-BY-4.0`
- generator: `Sketchfab-12.67.0`

If used, attribution obligations should be preserved in project notes.

## What This Means

### Good signs

- already in the correct runtime-friendly source format: `GLB`
- no animation baggage
- no skinning baggage
- no camera baggage
- geometry complexity looks manageable
- appears to contain useful room/furniture separation
- includes shell-like elements and furniture-like elements

### Main risks

- too many `4k` textures for the first runtime pass
- materials likely need cleanup and consolidation
- embedded textures mean the source should be unpacked/cleaned in Blender before
  final runtime use
- no runtime anchor or interaction structure yet

## Candidate Suitability

### Suitable for

- base environment shell
- apartment/lounge style scene
- first lighting and framing benchmark
- anchor placement prototype
- seated interaction planning

### Not yet suitable for

- direct final runtime drop-in without optimization
- low-tier device profile use as-is
- final interaction production scene as-is

## Recommended Optimization Pass

### Keep

- room shell
- floor
- windows
- main furniture
- a limited set of hero props

### Review / possibly strip

- hidden or back-facing geometry
- decorative clutter with no interaction value
- duplicate materials
- oversized texture assignments on small props
- any built-in skybox or decorative element that is cheaper to replace

### Texture targets for this asset

Recommended conversion targets:

- hero room surfaces:
  - keep selected maps at `2048`
- standard shell and furniture:
  - reduce to `1024` or `2048`
- small props:
  - reduce to `512` or `1024`

For this specific candidate, the first optimization goal should be:

- reduce most `4096` maps to `2048`
- reduce small/secondary props to `1024`

## Integration Fit

This asset fits the locked environment plan well as:

- a first apartment/lounge candidate
- a reusable visual shell
- an anchor and interaction-point testbed

It is a stronger candidate for the "apartment/lounge" direction than for a
"shop/kiosk" direction.

## Recommended Next Step

Use this candidate as a `source shell`, not yet the final runtime shell.

Next step should be:

1. import into Blender
2. inspect object separation and material assignments
3. identify:
   - chair/couch/desk-like anchors
   - removable clutter
   - top texture offenders
4. export an optimized `GLB` runtime candidate

## Decision

Status:

- `GO for optimization pass`

Not yet:

- `GO for direct production runtime import`

## First Blender Optimization Pass

Completed on:

- `2026-04-23`

Tooling:

- `tools/optimize_environment_glb.py`
- Blender `4.2`

Outputs:

- optimized blend:
  - `data/environment/candidates/brutalist_loft/brutalist_loft_optimized_2k.blend`
- optimized glb:
  - `data/environment/candidates/brutalist_loft/brutalist_loft_optimized_2k.glb`
- optimization report:
  - `data/environment/candidates/brutalist_loft/brutalist_loft_optimized_2k.report.json`

### Result

Original source:

- `~64.8 MB`

Optimized runtime candidate:

- `~15.9 MB`

Reduction:

- about `75%` smaller

### What changed

- all `4096x4096` images were reduced to `2048x2048`
- existing `2048x2048` and `1024x1024` images were kept
- geometry, mesh count, material count, and scene structure were preserved

### Post-pass status

After the first Blender pass, this asset moves from:

- `GO for optimization pass`

to:

- `GO for runtime integration trial`

with the note that a second cleanup pass may still be useful later for:

- material consolidation
- clutter reduction
- anchor placement cleanup
- interactive prop separation

## Runtime Trial Status

Runtime integration trial completed on:

- `2026-04-23`

Follow-up record:

- `docs/ENVIRONMENT_BRUTALIST_LOFT_RUNTIME_INTEGRATION_2026-04-23.md`

Current result:

- the optimized loft is now wired into the live `work-lite` runtime as the laptop scene
- runtime placement uses filtered bounds only and excludes the sky shell outlier `Object_40` / `Skybox_17`
- no extra corrective runtime rotation or scale was added beyond the GLB's own root conversion

Still pending:

- operator visual confirmation of final room feel, framing, and clipping
