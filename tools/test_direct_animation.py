"""
Test direct animation application on a Genesis 8 / Victoria 8 rig.

Opens a blend file, imports a GLB animation, transfers the action to the
mesh armature by matching bone names (no retargeting needed since Gen8 and
Vic8 share the same skeleton), and exports a test GLB.

Usage (called from test_animation_on_cherry.ps1):
  blender Cherry.blend --background --python test_direct_animation.py -- \
      --animation <path-to-anim.glb> \
      --output <output.glb> \
      --report <report.json>
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import bpy


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--animation", required=True, help="Path to animation GLB")
    parser.add_argument("--output", required=True, help="Output GLB path")
    parser.add_argument("--report", required=True, help="Report JSON path")
    return parser.parse_args(argv)


def find_mesh_armature():
    """Find the armature that has meshes skinned to it."""
    for obj in bpy.data.objects:
        if obj.type != "ARMATURE":
            continue
        skinned = [
            m_obj for m_obj in bpy.data.objects
            if m_obj.type == "MESH"
            and any(mod.type == "ARMATURE" and mod.object == obj for mod in m_obj.modifiers)
        ]
        if skinned:
            return obj, skinned
    return None, []


def import_animation_glb(filepath):
    """Import a GLB and return any new armatures and actions."""
    before_objects = set(bpy.data.objects)
    before_actions = set(bpy.data.actions)

    bpy.ops.import_scene.gltf(filepath=filepath)

    new_objects = set(bpy.data.objects) - before_objects
    new_actions = set(bpy.data.actions) - before_actions
    new_armatures = [obj for obj in new_objects if obj.type == "ARMATURE"]

    return new_armatures, list(new_actions), list(new_objects)


def count_matching_bones(source_armature, target_armature):
    """Count how many bones match by name between two armatures."""
    source_bones = {b.name for b in source_armature.data.bones}
    target_bones = {b.name for b in target_armature.data.bones}
    matched = source_bones & target_bones
    source_only = source_bones - target_bones
    target_only = target_bones - source_bones
    return matched, source_only, target_only


def transfer_action(action, source_armature, target_armature):
    """
    Transfer an action from source to target armature.
    Since Gen8/Vic8 share bone names, we just re-assign the action.
    Bone name mismatches are logged but don't block — the action will
    simply skip channels for bones that don't exist on the target.
    """
    # Ensure target has animation data
    if target_armature.animation_data is None:
        target_armature.animation_data_create()

    target_armature.animation_data.action = action

    # Set frame range
    frame_start = int(action.frame_range[0])
    frame_end = int(action.frame_range[1])
    bpy.context.scene.frame_start = frame_start
    bpy.context.scene.frame_end = frame_end

    return frame_start, frame_end


def export_test_glb(filepath, armature, skinned_meshes, animation_only=True):
    """Export as GLB.  When animation_only is True export just the armature
    and action data — no meshes, skins, or shape keys — giving a small clip
    file suitable for PlayCanvas container loading."""
    filepath = Path(filepath)
    filepath.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature

    if not animation_only:
        for mesh in skinned_meshes:
            mesh.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_nla_strips=False,
        export_animation_mode="ACTIVE_ACTIONS",
        export_force_sampling=True,
        export_skins=not animation_only,
        export_morph=not animation_only,
        export_morph_animation=False,
        export_yup=True,
    )


def cleanup_imported(objects):
    """Remove imported objects (animation armature + proxy meshes)."""
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        if obj.name in bpy.data.objects:
            obj.select_set(True)
    bpy.ops.object.delete()


def main():
    args = parse_args()
    anim_path = Path(args.animation)
    output_path = Path(args.output)
    report_path = Path(args.report)

    report = {
        "timestamp": datetime.now().isoformat(),
        "animation_file": str(anim_path),
        "output_file": str(output_path),
        "status": "failed",
        "errors": [],
    }

    try:
        # Step 1: Find the mesh armature in the current blend
        mesh_armature, skinned_meshes = find_mesh_armature()
        if mesh_armature is None:
            raise RuntimeError("No armature with skinned meshes found in blend file")

        report["mesh_armature"] = mesh_armature.name
        report["mesh_armature_bones"] = len(mesh_armature.data.bones)
        report["skinned_meshes"] = [m.name for m in skinned_meshes]
        print(f"[test] Mesh armature: {mesh_armature.name} ({len(mesh_armature.data.bones)} bones)")
        print(f"[test] Skinned meshes: {[m.name for m in skinned_meshes]}")

        # Step 2: Import animation GLB
        print(f"[test] Importing animation: {anim_path.name}")
        new_armatures, new_actions, new_objects = import_animation_glb(str(anim_path))

        if not new_actions:
            raise RuntimeError(f"No actions found in animation GLB: {anim_path.name}")

        anim_armature = new_armatures[0] if new_armatures else None
        action = new_actions[0]

        report["imported_armature"] = anim_armature.name if anim_armature else None
        report["imported_armature_bones"] = len(anim_armature.data.bones) if anim_armature else 0
        report["action_name"] = action.name
        report["action_channels"] = len(action.fcurves)

        # Step 3: Check bone compatibility
        if anim_armature:
            matched, source_only, target_only = count_matching_bones(anim_armature, mesh_armature)
            report["bone_match"] = {
                "matched": len(matched),
                "source_only": len(source_only),
                "target_only": len(target_only),
                "source_only_names": sorted(source_only)[:10],
                "target_only_names": sorted(target_only)[:10],
            }
            print(f"[test] Bone match: {len(matched)} matched, {len(source_only)} source-only, {len(target_only)} target-only")
        else:
            report["bone_match"] = {"note": "No armature in animation GLB — action-only"}

        # Step 4: Transfer action to mesh armature
        print(f"[test] Transferring action '{action.name}' to '{mesh_armature.name}'")
        frame_start, frame_end = transfer_action(action, anim_armature, mesh_armature)
        report["frame_range"] = [frame_start, frame_end]
        print(f"[test] Frame range: {frame_start} - {frame_end}")

        # Step 5: Remove imported proxy objects (keep the action)
        cleanup_imported(new_objects)

        # Step 6: Export test GLB
        print(f"[test] Exporting: {output_path}")
        export_test_glb(output_path, mesh_armature, skinned_meshes)

        report["output_size_mb"] = round(output_path.stat().st_size / (1024 * 1024), 2)
        report["status"] = "success"
        print(f"[test] SUCCESS — {report['output_size_mb']} MB")

    except Exception as exc:
        report["errors"].append(repr(exc))
        print(f"[test] ERROR: {exc}")

    # Write report
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"[test] Report: {report_path}")


if __name__ == "__main__":
    main()
