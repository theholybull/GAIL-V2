# Brutalist Loft Runtime Integration

Date:

- `2026-04-23`

Goal:

- bring the optimized brutalist loft into the live `work-lite` stage without guessing on rotation, axis handling, or scale

## Source Files

- source candidate:
  - `D:\Gail 2.1\brutalist_loft.glb`
- optimized candidate:
  - `D:\Gail 2.1\working_copy\data\environment\candidates\brutalist_loft\brutalist_loft_optimized_2k.glb`
- runtime asset:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\environments\brutalist_loft\brutalist_loft_optimized_2k.glb`
- runtime profile:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\environments\environment-profiles.json`

## Measured Facts Used

- the optimized GLB still carries a Sketchfab-style scene root with a `-90` degree X-axis conversion at the GLB root level
- Blender import confirmed the room geometry itself is already coherent after import, so no extra runtime corrective rotation was added on top of the GLB
- runtime environment placement therefore stays:
  - rotation: `0, 0, 0`
  - scale: `1, 1, 1`
- the only bounds outlier found was:
  - entity `Object_40`
  - parent `Skybox_17`
- environment centering/flooring must ignore that sky shell or the room appears offset and vertically wrong

## Runtime Wiring

- `work-lite` now loads environment profiles from:
  - `/client-assets/environments/environment-profiles.json`
- the laptop device profile now selects:
  - `sceneId = brutalist_loft`
- the brutalist loft profile currently uses:
  - asset path `environments/brutalist_loft/brutalist_loft_optimized_2k.glb`
  - bounds ignore entity `Object_40`
  - bounds ignore parent `Skybox_17`
  - `hideGeneratedFloor = true`

## Placement Rule

The runtime now places the environment by measured filtered bounds only:

- `x = -centerX`
- `y = -minY`
- `z = -centerZ`

That means:

- the room floor is grounded to stage `y = 0`
- the room is centered around world origin
- Gail remains on the same known-good stage origin instead of being moved by guessed offsets

## What Was Not Changed

- no extra axis correction was added in PlayCanvas
- no extra scene scaling was added
- no avatar rotation change was introduced from the older device staging values
- no prop anchors or interaction points were added yet

## Verification Completed

- PlayCanvas build passed
- live `/client-assets/environments/environment-profiles.json` serves the brutalist loft profile
- live `/client-assets/environments/brutalist_loft/brutalist_loft_optimized_2k.glb` serves at `16625036` bytes
- live `/client/work-lite-rebuild.js` serves the new cache salt `20260423-env-loft1`
- live client JS contains:
  - `selectedSceneId`
  - `measureFilteredRenderBounds`
  - `brutalist_loft`

## Remaining Required Check

- operator visual confirmation in the browser is still required for:
  - room orientation
  - Gail placement inside the room
  - camera feel
  - clipping against nearby furniture or walls

Until that visual check is confirmed, this is a measured runtime integration pass, not yet a final locked staging calibration.

## Manual Tuning Mode

To speed up visual calibration without code edits, `work-lite` now includes a live:

- `Stage Tune -> Environment`

panel in the right-side column.

Current behavior:

- offset, rotation, and scale apply live to the loaded environment
- values persist locally in the browser per `sceneId`
- `Copy Values` copies the exact current scene tuning JSON so it can be promoted into config after operator confirmation

This manual panel is now the preferred first-pass calibration route whenever a room clearly loads but the orientation or placement is visually wrong.
