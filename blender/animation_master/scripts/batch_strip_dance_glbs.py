"""
Batch-strip dance animation GLBs to animation-only format.

Removes meshes, cameras, lights, and skins from dance GLBs so they
match the clean per-bone animation format used by idle/talk/listen/ack.

Usage (headless):
  blender --background --python batch_strip_dance_glbs.py -- \
      --source <dir-with-dance-glbs> --dest <output-dir>

If --dest is omitted the files are overwritten in-place.
"""

import argparse
import sys
from pathlib import Path

import bpy


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    parser = argparse.ArgumentParser(description="Strip dance GLBs to animation-only")
    parser.add_argument("--source", required=True, help="Directory containing source dance GLBs")
    parser.add_argument("--dest", default=None, help="Output directory (default: overwrite in place)")
    return parser.parse_args(argv)


def clear_scene():
    """Remove all objects, actions, meshes, armatures from the scene."""
    # Delete objects via data API (works reliably in background mode)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for block_type in (bpy.data.meshes, bpy.data.cameras, bpy.data.lights,
                       bpy.data.armatures, bpy.data.actions, bpy.data.materials,
                       bpy.data.images):
        for block in list(block_type):
            try:
                block_type.remove(block)
            except Exception:
                pass


def strip_and_export(source_path: Path, dest_path: Path) -> bool:
    """Import a dance GLB, strip non-animation data, re-export."""
    clear_scene()

    # Import the GLB
    result = bpy.ops.import_scene.gltf(filepath=str(source_path))
    if "FINISHED" not in result:
        print(f"  SKIP (import failed): {source_path.name}")
        return False

    # Find the armature
    armature = None
    for obj in bpy.data.objects:
        if obj.type == "ARMATURE":
            armature = obj
            break

    if armature is None:
        print(f"  SKIP (no armature): {source_path.name}")
        return False

    # Find the action – prefer the one assigned to the armature,
    # otherwise pick the longest action available.
    action = None
    if armature.animation_data and armature.animation_data.action:
        action = armature.animation_data.action
    elif bpy.data.actions:
        action = max(bpy.data.actions, key=lambda a: float(a.frame_range[1] - a.frame_range[0]))
        armature.animation_data_create()
        armature.animation_data.action = action

    if action is None:
        print(f"  SKIP (no action): {source_path.name}")
        return False

    # Remove all non-armature objects (meshes, cameras, lights, empties)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in list(bpy.data.objects):
        if obj.type != "ARMATURE":
            bpy.data.objects.remove(obj, do_unlink=True)

    # Clean up orphaned mesh/material/image data
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        if mat.users == 0:
            bpy.data.materials.remove(mat)
    for img in list(bpy.data.images):
        if img.users == 0:
            bpy.data.images.remove(img)
    for cam in list(bpy.data.cameras):
        if cam.users == 0:
            bpy.data.cameras.remove(cam)
    for light in list(bpy.data.lights):
        if light.users == 0:
            bpy.data.lights.remove(light)

    # Set frame range from the action
    frame_start = int(round(float(action.frame_range[0])))
    frame_end = int(round(float(action.frame_range[1])))
    bpy.context.scene.frame_start = frame_start
    bpy.context.scene.frame_end = frame_end

    # Select only the armature for export
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature

    # Export as animation-only GLB (matching the format of idle_base_v1.glb)
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(dest_path),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_animation_mode="ACTIVE_ACTIONS",
        export_nla_strips=False,
        export_force_sampling=True,
        export_anim_slide_to_zero=True,
        export_skins=False,
        export_morph=False,
        export_morph_animation=False,
        export_yup=True,
    )
    return True


def main():
    args = parse_args()
    source_dir = Path(args.source).resolve()
    dest_dir = Path(args.dest).resolve() if args.dest else source_dir

    glbs = sorted(source_dir.glob("*.glb"))
    if not glbs:
        print(f"No GLB files found in {source_dir}")
        return

    print(f"Processing {len(glbs)} dance GLBs from {source_dir}")
    print(f"Output to {dest_dir}")

    ok = 0
    fail = 0
    for glb in glbs:
        out_path = dest_dir / glb.name
        try:
            if strip_and_export(glb, out_path):
                size_kb = out_path.stat().st_size / 1024
                print(f"  OK ({size_kb:.0f} KB): {glb.name}")
                ok += 1
            else:
                fail += 1
        except Exception as exc:
            print(f"  ERROR: {glb.name}: {exc}")
            fail += 1

    print(f"\nDone: {ok} converted, {fail} failed out of {len(glbs)} total")


if __name__ == "__main__":
    main()
