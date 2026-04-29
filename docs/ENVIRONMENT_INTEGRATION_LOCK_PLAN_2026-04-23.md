# Environment Integration Lock Plan

Date: 2026-04-23

## Purpose

This document locks the environment integration approach for Gail so we stop
drifting between ideas and can move into implementation with a fixed plan.

It covers:

- where the first environment should come from
- whether DAZ environments are usable
- texture target sizes to aim for
- what optimization is required before runtime use
- how environment assets plug into the Gail runtime

## Locked Decisions

### 1. Use a reuse-first base environment

The first real environment should be imported from an existing source and then
adapted, not modeled entirely from scratch.

Approved source priority:

1. PlayCanvas Asset Store / Sketchfab base environment
2. Existing DAZ apartment or shop environment
3. Custom environment authored later

### 2. Treat imported environments as a shell, not the logic system

Imported environments may provide:

- room geometry
- furniture
- decorative props
- rough materials
- collision candidates
- lighting references

They do not define:

- Gail anchors
- interaction points
- trigger routing
- emotion behavior
- action safety rules

Those remain repo-owned systems.

### 3. Runtime target format is GLB

Locked runtime target:

- `GLB` for runtime use in PlayCanvas

Reason:

- PlayCanvas officially recommends `.glb`
- PlayCanvas supports `.fbx`, but converts it on import
- GLB is the correct final handoff format for the runtime client

### 4. DAZ environment files are usable, but not directly

DAZ environment content can be used if it is exported and cleaned.

Locked ruling:

- raw DAZ scene files are not a direct runtime format for PlayCanvas
- DAZ environment content must go through:
  - DAZ export
  - Blender cleanup/optimization
  - GLB export

### 5. Start with one environment only

Do not build apartment, shop, lounge, and studio in parallel.

First environment should be one of:

- apartment
- shop
- studio/work room

Pick one, get the pipeline working, then replicate.

## Official Compatibility Notes

Per official PlayCanvas documentation:

- `.glb` is the recommended 3D model format
- `.fbx` is supported, but imported through conversion
- PlayCanvas Asset Store includes PlayCanvas assets, textures, skyboxes,
  templates, and Sketchfab integration
- PlayCanvas supports texture compression using Basis and transcodes to device
  formats like ASTC / DXT / ETC2 at runtime

Sources:

- PlayCanvas Supported Formats:
  - https://developer.playcanvas.com/user-manual/assets/supported-formats/
- PlayCanvas Exporting Assets:
  - https://developer.playcanvas.com/user-manual/assets/models/exporting/
- PlayCanvas Asset Store:
  - https://developer.playcanvas.com/user-manual/editor/assets/asset-store/
- PlayCanvas Sketchfab integration:
  - https://developer.playcanvas.com/user-manual/editor/assets/asset-store/sketchfab/
- PlayCanvas Texture Compression:
  - https://developer.playcanvas.com/user-manual/optimization/texture-compression/

## What This Means For DAZ Environments

### Usable

Your DAZ apartment and shop are usable as source content if:

- you export only the pieces you need
- you reduce material/mesh complexity
- you rework textures where needed
- you export a cleaned result to GLB

### Not usable as-is

Do not expect the DAZ files to drop straight into PlayCanvas in production form.

Risks with using DAZ environments raw:

- too many materials
- too many draw calls
- too many high-resolution textures
- oversized meshes
- unnecessary hidden geometry
- poor runtime culling boundaries
- bad light/material setup for web rendering

### Correct path

Locked environment pipeline:

1. choose environment source
2. export selected environment assets from DAZ as FBX
3. import into Blender
4. strip hidden/unneeded geometry
5. merge or simplify materials where practical
6. resize and repack textures
7. separate interaction props from static shell
8. export optimized GLB
9. import to PlayCanvas runtime
10. add Gail anchors and interaction points

## Texture Targets

These are recommended target sizes for the first pass.

These values are not a hard engine limit.
They are the production targets we should aim for based on web/runtime cost and
the current device matrix in this repo.

### Environment shell textures

- hero wall/floor/large visible surface:
  - `2048` preferred
  - `4096` only for one or two truly hero surfaces on high-end desktop/kiosk
- standard room surfaces:
  - `1024` to `2048`
- small repeating surfaces:
  - `1024`

### Props and furniture

- hero prop close to camera:
  - `2048`
- standard furniture:
  - `1024`
- minor prop:
  - `512` to `1024`

### Device-downscaled targets

For later scaling/export tiers:

- high tier:
  - allow some `2048`, rare `4096`
- medium tier:
  - clamp most textures to `1024`
- low tier:
  - clamp most textures to `512`

### Practical rule

Do not start by baking every environment map at `4k`.

Start with:

- shell:
  - mostly `2k`
- furniture:
  - mostly `1k`
- small props:
  - `512` or `1k`

Then upscale only the surfaces that visibly fail in runtime review.

## Texture / Material Policy

### First-pass texture budget policy

Environment base should aim for:

- albedo/base color where needed
- normal maps only when they materially improve visible depth
- roughness maps selectively
- metallic maps only for actually metallic surfaces

Avoid carrying over unnecessary DAZ material complexity.

### Material cleanup rules

- remove accidental metallic values on non-metal surfaces
- reduce gloss/plastic look
- standardize roughness by material class
- collapse duplicate materials when visual difference is negligible
- prefer fewer, cleaner materials over DAZ-authored material sprawl

### Compression policy

Use PlayCanvas texture compression for runtime delivery once the imported set is
stable.

That means:

- keep source textures clean
- compress for runtime after import
- review artifacts on hair, skin, glossy props, and signage

## Environment Asset Structure

Locked recommendation:

- static shell
- furniture and large props
- interactive props
- decals/signage
- lighting references / skybox

Recommended runtime split:

- one shell asset
- several furniture clusters
- separate interactive props
- optional separate signage/decals

Do not ship the whole environment as one giant monolith if it can be split
cleanly.

## What To Look For In A Base Environment

### Best first environment types

If searching externally, start here:

1. studio / work room
2. apartment lounge
3. small shop / kiosk

### What to prioritize

- clean readable layout
- moderate texture count
- not overly cluttered
- furniture that supports obvious anchor points
- believable lighting structure
- easy separation of props

### What to avoid

- huge open worlds
- film-quality interiors with dozens of unique 4k materials
- scenes with heavy baked lighting assumptions
- environments where every object is merged into one unusable mesh

## Best Source To Start Looking

Start in this order:

### 1. PlayCanvas Asset Store / Sketchfab

Why:

- fastest way to get a usable base shell
- easiest to preview for PlayCanvas compatibility
- good for first-pass room shell and props

Look for:

- studio interior
- office room
- apartment room
- shop interior
- lounge interior

### 2. Your DAZ apartment or shop

Use these if:

- they already match the visual direction you want
- you are willing to run them through Blender cleanup
- texture quality is good enough to justify optimization work

### 3. Blend / hybrid approach

Use:

- external base shell
- DAZ props or furniture
- custom Gail-specific interactive props layered on top

This is likely the best long-term approach.

## Integration Steps

### Phase E1: Source evaluation

For each candidate environment:

- inspect total texture count
- inspect top texture resolutions
- inspect material count
- inspect whether shell and props can be separated
- inspect whether there are obvious chair / couch / desk anchors

### Phase E2: Blender cleanup

- remove hidden geometry
- remove non-visible rooms/areas
- split static shell from interactive pieces
- simplify materials
- resize textures to target tiers
- export optimized GLB

### Phase E3: Runtime import

- import shell into PlayCanvas assets
- import separate prop clusters
- assign staging/environment profile id
- test camera framing against device profiles

### Phase E4: Gail integration

- add `idle_anchor`
- add `camera_focus_anchor`
- add `desk/chair/couch` anchors as available
- add interaction points
- add emotion/trigger mappings by zone or object

### Phase E5: Quality review

- clipping
- grounding
- texture sharpness
- material finish
- framerate / responsiveness
- device-tier compatibility

## Pass / Fail Gates

### ENV1: Source viability

Pass when:

- environment is separable and not absurdly heavy

### ENV2: Texture sanity

Pass when:

- shell and furniture textures fit target ranges
- no blanket 4k-for-everything approach

### ENV3: Runtime import viability

Pass when:

- optimized GLB imports and renders correctly in PlayCanvas

### ENV4: Device fit

Pass when:

- framing holds on laptop, phone, kiosk, and watch-class policies as relevant

### ENV5: Gail integration readiness

Pass when:

- environment has usable anchors and at least one interaction point family

## Immediate Recommendation

### What to look at first

Start by looking for a:

- studio/work room
or
- apartment lounge

in PlayCanvas Asset Store / Sketchfab first.

Why:

- fastest compatibility path
- easiest to test as a base shell
- gives us a good benchmark against your DAZ scenes

### What to do with the DAZ environments

Do not discard them.

Use them as:

- fallback source
- prop source
- visual benchmark
- possible phase-two environment import

If the DAZ apartment or shop already looks substantially better than store
assets, then it is worth optimizing through Blender.

## Locked Starting Guidance

Start environment scouting with this target profile:

- room type:
  - `studio/work room` or `apartment lounge`
- shell texture target:
  - mostly `2k`
- furniture texture target:
  - mostly `1k`
- small props:
  - `512` to `1k`
- runtime target:
  - optimized `GLB`
- DAZ compatibility:
  - `yes, through Blender cleanup and export`
  - `no, not as raw direct runtime files`
