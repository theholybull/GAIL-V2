import argparse
import json
import sys
import traceback
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
    parser.add_argument("--api-key-file", required=True)
    parser.add_argument("--fbx", required=True)
    parser.add_argument("--target-armature", default="Ai")
    parser.add_argument("--target-map", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--server-host", default="https://zoe-api.sensetime.com/animoxtend")
    return parser.parse_args(argv)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def enable_addon(zip_path: Path):
    bpy.ops.preferences.addon_install(filepath=str(zip_path), overwrite=True)
    bpy.ops.preferences.addon_enable(module="animoxtend")


def find_armature(name: str):
    obj = bpy.data.objects.get(name)
    if obj and obj.type == "ARMATURE":
        return obj
    return None


def import_fbx_and_get_source_armature(fbx_path: Path, existing_names: set[str]):
    bpy.ops.import_scene.fbx(filepath=str(fbx_path), use_manual_orientation=False)
    new_armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE" and obj.name not in existing_names]
    if new_armatures:
        return new_armatures[0]
    # Fallback: choose a non-target armature if import preserved an existing name.
    for obj in bpy.data.objects:
        if obj.type == "ARMATURE":
            return obj
    raise RuntimeError("No source armature found after FBX import")


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


def validate(scene):
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
    api_key_file = Path(args.api_key_file)
    fbx_path = Path(args.fbx)
    target_map = Path(args.target_map)
    output_blend = Path(args.output_blend)
    report_path = Path(args.report)

    report = {
        "blend": str(blend_path),
        "fbx": str(fbx_path),
        "target_armature": args.target_armature,
        "target_map": str(target_map),
        "output_blend": str(output_blend),
        "source_armature": None,
        "target_missing_bones": [],
        "source_valid": False,
        "target_valid": False,
        "source_message": "",
        "target_message": "",
        "retarget_result_code": None,
        "retarget_message": "",
        "target_action": None,
        "frame_start": None,
        "frame_end": None,
        "fcurve_count": 0,
        "pass": False,
        "errors": [],
    }

    try:
        api_key = api_key_file.read_text(encoding="utf-8").strip()
        if not api_key:
            raise RuntimeError("AnimoXTend API key file is empty")

        bpy.ops.wm.open_mainfile(filepath=str(blend_path))
        enable_addon(addon_zip)

        target_armature = find_armature(args.target_armature)
        if target_armature is None:
            raise RuntimeError(f"Target armature not found: {args.target_armature}")

        existing_names = {obj.name for obj in bpy.data.objects if obj.type == "ARMATURE"}
        source_armature = import_fbx_and_get_source_armature(fbx_path, existing_names)
        report["source_armature"] = source_armature.name

        scene = bpy.context.scene
        scene.source_arm = source_armature
        scene.source_arm_name = source_armature.name
        scene.target_arm = target_armature
        scene.target_arm_name = target_armature.name
        scene.automatic_scale = True
        scene.optimize_mult_level_spines = False
        scene.keep_target_place = True

        bpy.ops.animoxtend.build_source_bone_list()
        report["target_missing_bones"] = apply_target_mapping(scene, target_armature, target_map)

        validation = validate(scene)
        report.update(validation)
        if not report["source_valid"] or not report["target_valid"]:
            raise RuntimeError(
                f"Mapping invalid src='{report['source_message']}' tgt='{report['target_message']}'"
            )

        from animoxtend.modules.retarget.operators import single_retarget

        result_code, message = single_retarget(
            bpy.context,
            source_armature,
            target_armature,
            True,
            api_key=api_key,
            server_host=args.server_host,
        )
        report["retarget_result_code"] = result_code
        report["retarget_message"] = message or ""
        if result_code not in (0, 2):
            raise RuntimeError(message or f"Retarget failed with code {result_code}")

        if target_armature.animation_data is None or target_armature.animation_data.action is None:
            raise RuntimeError("Target armature has no action after retarget")

        action = target_armature.animation_data.action
        action.name = "lucy_idle_retarget_test_v1"
        report["target_action"] = action.name
        report["frame_start"] = int(action.frame_range[0])
        report["frame_end"] = int(action.frame_range[1])
        report["fcurve_count"] = len(action.fcurves)
        report["pass"] = report["fcurve_count"] > 0 and (report["frame_end"] - report["frame_start"]) >= 1

        output_blend.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(output_blend), copy=False)
    except Exception as exc:
        report["errors"].append(repr(exc))
        report["traceback"] = traceback.format_exc()

    write_json(report_path, report)
    print(json.dumps(report, indent=2))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
