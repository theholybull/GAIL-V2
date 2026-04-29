# Gail Production Workbench

This is the current guided Blender add-on for building loop-ready actions and packaging avatars in a way that is simple enough for non-technical operators.

## What it is now

The workbench is no longer just a loose set of operators. It now has a guided flow:

1. Scan the scene and auto-detect the armature
2. Confirm pose and action picks from simple dropdowns
3. Build a loop-ready action from start, mid, and end anchors
4. Optionally blend two actions together
5. Force clean start/end anchoring and normalize root motion
6. Partition the avatar into runtime-friendly groups
7. Export avatar parts and texture tiers
8. Write a package manifest for downstream tools

## Guided UI

Location:

- `View3D > Sidebar > Gail Prod`

Panels:

1. `Guided Setup`
2. `Animation Builder`
3. `Avatar Packaging`

The most important buttons for normal use are:

1. `Scan Scene`
2. `Use Selected Picks`
3. `Build Animation`
4. `Package Avatar`
5. `Run Full Guided Build`

## Current features

1. Auto-detect the main armature in the scene
2. Pick start, mid, end, and blend actions from dropdowns
3. Capture the current armature pose as a one-frame action
4. Build a seamless loop action from start/mid/end pose actions
5. Blend two actions into a new action
6. Re-anchor an active action to approved start/end poses
7. Normalize root location/rotation at the loop seam
8. Partition an avatar into body, hair, clothing, accessories, and other
9. Export avatar part bundles as GLBs
10. Export clothing in three modes:
   - bundled clothing pack
   - one clothing item at a time
   - selected clothing set
11. Tune skin material roughness/specular/subsurface
12. Export texture tiers:
   - flat base-avatar texture
   - low (`512`)
   - medium (`2048`)
   - high (`4096`)
   - all meshes, body only, clothing only, or selected clothing
13. Write `package_manifest.json` for downstream packaging/runtime work

## Device tier policy

Use these sizes consistently unless a specific delivery target proves it needs a different contract:

- `low = 512`
  - watch-class clients
  - tiny displays
  - lightweight previews
- `medium = 2048`
  - phones
  - tablets
  - general web delivery
  - low-power client hardware
- `high = 4096`
  - host machine
  - studio review
  - kiosk/demo capture
  - high-detail staging

## Install

In Blender:

1. Preferences
2. Add-ons
3. Install from:
   - `D:\blender\animation_master\addons\gail_production_workbench`

Or zip the folder and install the zip.

## Tested status

This guided workflow has been validated headless on:

- `D:\animation_builder_test\test_avatar.blend`

Test runner:

- `D:\tools\run-gail-production-workbench-test.ps1`

Validation script:

- `D:\tools\test_gail_production_workbench.py`

Generated test package:

- `D:\animation_builder_test`

## Important note

This is the current guided workbench, not the finished end-user production appliance yet. It is meant to be:

1. much easier to use than the older export add-on
2. strong enough for real validation and packaging work
3. the foundation for the next pass of PlayCanvas/package integration
