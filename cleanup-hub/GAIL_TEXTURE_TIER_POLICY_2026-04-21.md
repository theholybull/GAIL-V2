# Gail Texture Tier Policy

Date: `2026-04-21`

## Active Policy

Use these three texture tiers as the repo-wide export default unless a specific target proves it needs an exception:

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

## Where It Is Enforced

- `tools/export_avatar_pack_with_ior.py`
- `tools/run_gail_workbench_package.py`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/blender/addons/gail_production_workbench/__init__.py`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/blender/addons/gail_production_workbench/README.md`
- `tools/blender-gail-export-addon/README.md`

## Verified Package Run

Verified on:

- source blend: `D:\Avatars\Gail\gail.blend`
- package run root: `cleanup-hub/gail-package-refresh-20260421-135422`
- package report: `cleanup-hub/gail-package-refresh-20260421-135422/gail-package-report.json`
- package manifest: `cleanup-hub/gail-package-refresh-20260421-135422/package/package_manifest.json`
- texture manifest: `cleanup-hub/gail-package-refresh-20260421-135422/package/avatar_package/textures/texture_manifest.json`

The generated manifest confirms:

- `low = 512`
- `medium = 2048`
- `high = 4096`

Spot-checked emitted files also confirm the actual raster sizes, not just folder labels:

- `blond2.jpg.jpg.png`
  - low: `512 x 512`
  - medium: `2048 x 2048`
  - high: `4096 x 4096`
- `sCCSweatshirt03.jpg.jpg.png`
  - low: `512 x 512`
  - medium: `2048 x 2048`
  - high: `4096 x 4096`
- `d2_G8FBaseTorsoMapD...png`
  - low: `512 x 512`
  - medium: `2048 x 2048`
  - high: `4096 x 4096`

## Current Caveat

The workbench package path now emits the correct tiers, but the live runtime still loads one active asset set from `playcanvas-app/assets/...`.

So the current state is:

- live runtime refresh: working
- tiered package export: working
- automatic device-based runtime switching between those tiers: not implemented yet
