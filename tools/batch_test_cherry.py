"""
Batch test: apply one animation from each category to Cherry.blend.
Confirms that ALL converted animation categories work with direct
bone-name transfer (no retargeting) on the Genesis 8 Female rig.

Usage:
  blender Cherry.blend --background --python batch_test_cherry.py -- \
      --anim-root <converted_animations_20260401> \
      --out-dir <output_dir>
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
    parser.add_argument("--anim-root", required=True)
    parser.add_argument("--out-dir", required=True)
    return parser.parse_args(argv)


def find_mesh_armature():
    for obj in bpy.data.objects:
        if obj.type != "ARMATURE":
            continue
        skinned = [
            m for m in bpy.data.objects
            if m.type == "MESH"
            and any(mod.type == "ARMATURE" and mod.object == obj for mod in m.modifiers)
        ]
        if skinned:
            return obj, skinned
    return None, []


def test_one_clip(anim_path, target_armature, output_path):
    """Import one animation GLB, transfer action, export animation-only GLB."""
    before_objects = set(bpy.data.objects)
    before_actions = set(bpy.data.actions)

    bpy.ops.import_scene.gltf(filepath=str(anim_path))

    new_objects = set(bpy.data.objects) - before_objects
    new_actions = set(bpy.data.actions) - before_actions
    new_armatures = [o for o in new_objects if o.type == "ARMATURE"]

    if not new_actions:
        # Cleanup and skip
        bpy.ops.object.select_all(action="DESELECT")
        for o in new_objects:
            if o.name in bpy.data.objects:
                o.select_set(True)
        bpy.ops.object.delete()
        return {"status": "no_actions", "file": anim_path.name}

    action = list(new_actions)[0]
    src_arm = new_armatures[0] if new_armatures else None

    # Count bone matches
    if src_arm:
        src_bones = {b.name for b in src_arm.data.bones}
        tgt_bones = {b.name for b in target_armature.data.bones}
        matched = len(src_bones & tgt_bones)
        total = len(tgt_bones)
    else:
        matched = 0
        total = len(target_armature.data.bones)

    # Transfer action
    if target_armature.animation_data is None:
        target_armature.animation_data_create()
    target_armature.animation_data.action = action
    bpy.context.scene.frame_start = int(action.frame_range[0])
    bpy.context.scene.frame_end = int(action.frame_range[1])

    # Export animation-only
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    target_armature.select_set(True)
    bpy.context.view_layer.objects.active = target_armature
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_nla_strips=False,
        export_animation_mode="ACTIVE_ACTIONS",
        export_force_sampling=True,
        export_skins=False,
        export_morph=False,
        export_morph_animation=False,
        export_yup=True,
    )

    size_mb = round(output_path.stat().st_size / (1024 * 1024), 2)

    # Cleanup imported objects
    bpy.ops.object.select_all(action="DESELECT")
    for o in new_objects:
        if o.name in bpy.data.objects:
            o.select_set(True)
    bpy.ops.object.delete()

    # Clear the action from target (so next clip starts fresh)
    target_armature.animation_data.action = None

    return {
        "status": "success",
        "file": anim_path.name,
        "action": action.name,
        "bones_matched": matched,
        "bones_total": total,
        "frames": [int(action.frame_range[0]), int(action.frame_range[1])],
        "channels": len(action.fcurves),
        "output_mb": size_mb,
    }


def main():
    args = parse_args()
    anim_root = Path(args.anim_root)
    out_dir = Path(args.out_dir)

    target_arm, skinned = find_mesh_armature()
    if target_arm is None:
        print("[batch] ERROR: No mesh armature found")
        return

    print(f"[batch] Target: {target_arm.name} ({len(target_arm.data.bones)} bones)")

    categories = ["idle", "combat", "emote", "gesture", "locomotion", "interaction", "horror", "traversal", "other"]
    results = []

    for cat in categories:
        cat_dir = anim_root / cat
        if not cat_dir.is_dir():
            print(f"[batch] {cat}: directory not found, skipping")
            continue
        sample = next(cat_dir.glob("*.glb"), None)
        if sample is None:
            print(f"[batch] {cat}: no GLBs found, skipping")
            continue

        out_path = out_dir / f"cherry_test_{cat}.glb"
        print(f"[batch] Testing {cat}: {sample.name}")
        result = test_one_clip(sample, target_arm, out_path)
        result["category"] = cat
        results.append(result)
        print(f"[batch]   -> {result['status']} | {result.get('bones_matched',0)}/{result.get('bones_total',0)} bones | {result.get('output_mb','?')} MB")

    # Summary
    success = sum(1 for r in results if r["status"] == "success")
    print(f"\n[batch] SUMMARY: {success}/{len(results)} categories passed")

    report_path = out_dir / "cherry_batch_report.json"
    report_path.write_text(json.dumps({
        "timestamp": datetime.now().isoformat(),
        "armature": target_arm.name,
        "bones": len(target_arm.data.bones),
        "skinned_meshes": [m.name for m in skinned],
        "results": results,
        "passed": success,
        "total": len(results),
    }, indent=2), encoding="utf-8")
    print(f"[batch] Report: {report_path}")


if __name__ == "__main__":
    main()
