# Gail DAZ Export Scripts

Standalone DAZ Studio scripts for one-at-a-time export workflows.

Current scripts:

- `export_avatar_fbx.dsa`
- `export_all_clothing_fbx.dsa`
- `export_fitted_wearables_fbx.dsa`
- `export_selected_clothing_fbx.dsa`
- `export_selected_hair_fbx.dsa`
- `export_current_pose_preset.dsa`
- `export_current_animation_preset.dsa`

Target output root:

- `F:\Gail\blender\animation_master\source\exports\daz\`

Each script exports one asset at a time and writes a JSON sidecar next to the export.

Suggested DAZ install location:

- `C:\Users\jbates\AppData\Roaming\DAZ 3D\Studio4\scripts\Gail Export\`

Usage in DAZ Studio:

1. Open the `Content Library` pane.
2. Browse to `DAZ Studio Formats > My DAZ 3D Library > Scripts > Gail Export`.
3. Double-click the script you want to run.

What to select first:

- `export_avatar_fbx.dsa`
  - Select the figure root or any bone on the figure.
  - Exports the selected figure with rig, morphs, and copied textures.
- `export_all_clothing_fbx.dsa`
  - Select the figure root or any bone on the figure.
  - Exports all fitted clothing items one-by-one.
  - Hair is excluded.
- `export_fitted_wearables_fbx.dsa`
  - Select the figure root or any bone on the figure.
  - Exports all fitted wearables one-by-one.
  - Hair is detected by name keywords; everything else is treated as clothing.
- `export_selected_clothing_fbx.dsa`
  - Select exactly one fitted clothing item.
- `export_selected_hair_fbx.dsa`
  - Select exactly one fitted hair item.
- `export_current_pose_preset.dsa`
  - Select the figure root or any bone on the figure.
  - Exports the current frame only.
- `export_current_animation_preset.dsa`
  - Select the figure root or any bone on the figure.
  - Exports the current DAZ play range.

Output folders:

- `F:\Gail\blender\animation_master\source\exports\daz\avatar\`
- `F:\Gail\blender\animation_master\source\exports\daz\clothing\`
- `F:\Gail\blender\animation_master\source\exports\daz\hair\`
- `F:\Gail\blender\animation_master\source\exports\daz\poses\`
- `F:\Gail\blender\animation_master\source\exports\daz\animations\`

Each export writes:

- the exported asset file
- a sidecar `.json` metadata file
