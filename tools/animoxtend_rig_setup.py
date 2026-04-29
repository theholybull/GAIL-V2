"""
DEPRECATED — AnimoXtend BufferArmature retargeting setup.

Genesis 8 Female and Victoria 8 share identical skeletons (170+ bones,
same DAZ bone names, root=hip).  Animations exported from the AnimoXtend
pipeline already carry the correct bone names and can be applied directly
to the mesh armature without retargeting.

Use  tools/test_direct_animation.py  or  tools/batch_test_cherry.py
for the simplified direct-transfer workflow instead.

Verified 2026-04-12:  9/9 animation categories pass on Cherry.blend
with 170/170 bone match, animation-only GLB ≤ 1.3 MB per clip.
"""

import argparse
import json
import sys
from pathlib import Path

import bpy


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--blend", required=True)
    parser.add_argument("--addon-zip", required=True)
    parser.add_argument("--target-map", required=True)
    parser.add_argument("--target-armature", default="Victoria 8")
    parser.add_argument("--source-armature", default="BufferArmature")
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--report", required=True)
    return parser.parse_args(argv)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def enable_addon(zip_path: Path):
    bpy.ops.preferences.addon_install(filepath=str(zip_path), overwrite=True)
    bpy.ops.preferences.addon_enable(module="animoxtend")


def find_armature(name: str):
    obj = bpy.data.objects.get(name)
    if obj and obj.type == "ARMATURE":
        return obj
    return None


def find_or_create_source_armature(expected_name: str):
    armature = find_armature(expected_name)
    if armature is not None:
        return armature

    # Newer Blender/AnimoXTend combinations may raise from this operator
    # even after appending BufferArmature successfully.
    try:
        bpy.ops.object.add_buffer_human()
    except Exception:
        pass

    armature = find_armature(expected_name)
    if armature is not None:
        return armature

    fallback_names = ("BufferArmature", "bufferarmature")
    for name in fallback_names:
        armature = find_armature(name)
        if armature is not None:
            return armature

    for obj in bpy.data.objects:
        if obj.type == "ARMATURE" and obj.name.lower().startswith(expected_name.lower()):
            return obj

    raise RuntimeError(f"Could not find or create source armature '{expected_name}'")


def apply_target_mapping(scene, target_armature, mapping_path: Path):
    mapping = load_json(mapping_path)
    target_bones = {bone.name for bone in target_armature.data.bones}
    scene.target_bone_definition_list.clear()
    missing = []
    for standard_name, bone_name in mapping.items():
        item = scene.target_bone_definition_list.add()
        item.standard_bone_name = standard_name
        if bone_name in target_bones:
            item.bone_name = bone_name
        else:
            item.bone_name = ""
            if bone_name:
                missing.append(bone_name)
    return missing


def validate_mapping(scene):
    from animoxtend.modules.retarget.operators import check_src_mapping_valid, check_tgt_mapping_valid

    check_src_mapping_valid(None, bpy.context)
    check_tgt_mapping_valid(None, bpy.context)
    return {
        "source_valid": bool(scene.src_root_valid_status) and (scene.src_check_mapping_result == ""),
        "target_valid": bool(scene.tgt_root_valid_status) and (scene.tgt_check_mapping_result == ""),
        "source_message": scene.src_check_mapping_result,
        "target_message": scene.tgt_check_mapping_result,
    }


def main():
    args = parse_args()
    blend_path = Path(args.blend)
    addon_zip = Path(args.addon_zip)
    target_map = Path(args.target_map)
    output_blend = Path(args.output_blend)
    report_path = Path(args.report)

    report = {
        "blend": str(blend_path),
        "target_armature": args.target_armature,
        "source_armature": args.source_armature,
        "addon_zip": str(addon_zip),
        "target_map": str(target_map),
        "output_blend": str(output_blend),
        "armatures": [],
        "target_missing_bones": [],
        "source_valid": False,
        "target_valid": False,
        "source_message": "",
        "target_message": "",
        "errors": [],
    }

    try:
        bpy.ops.wm.open_mainfile(filepath=str(blend_path))
        enable_addon(addon_zip)

        scene = bpy.context.scene
        source_armature = find_or_create_source_armature(args.source_armature)
        target_armature = find_armature(args.target_armature)
        if target_armature is None:
            raise RuntimeError(f"Target armature '{args.target_armature}' not found")

        scene.source_arm = source_armature
        scene.source_arm_name = source_armature.name
        scene.target_arm = target_armature
        scene.target_arm_name = target_armature.name

        bpy.ops.animoxtend.build_source_bone_list()
        report["target_missing_bones"] = apply_target_mapping(scene, target_armature, target_map)
        result = validate_mapping(scene)
        report.update(result)
        report["armatures"] = [obj.name for obj in bpy.data.objects if obj.type == "ARMATURE"]

        bpy.ops.wm.save_as_mainfile(filepath=str(output_blend), copy=False)
    except Exception as exc:
        report["errors"].append(repr(exc))

    write_json(report_path, report)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
