# PlayCanvas Manual Setup (No Viewer)

This flow ignores the local work-lite viewer completely.

## 1) Prepare package
Run:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\Gail\tools\prepare-playcanvas-manual-package.ps1"
```

Package path:

`D:\Gail\data\runtime\playcanvas_manual_package`

## 2) Import in PlayCanvas Editor
1. Create/open your PlayCanvas project.
2. Create a new empty scene.
3. Drag these files from the package into Assets:
- `parts/body.glb`
- `parts/hair.glb`
- `parts/clothing.glb`
- `parts/accessories.glb`

## 3) Build hierarchy
1. Add empty entity `AvatarRoot`.
2. Add each imported GLB render under `AvatarRoot`.
3. Add camera + light:
- Camera position start: `(0, 1.6, 3.2)`
- Camera look target: `(0, 1.2, 0)`
- Directional light intensity: about `2.0`

## 4) Manual orientation and framing
Start from this orientation on `AvatarRoot`:
- Rotation X: `180`
- Rotation Y: `0`
- Rotation Z: `90`

If needed, adjust only one axis at a time in 90-degree steps until:
- avatar is upright
- avatar faces camera
- full body is in frame

## 5) Save
When it looks right, save the scene and keep those exact Euler values.

Optional: copy those values into:
`D:\Gail\playcanvas-app\assets\handoffs\playcanvas_handoff_20260330\manifests\integration_asset_manifest.json`
under `runtime_profile.orientation_angles`.
