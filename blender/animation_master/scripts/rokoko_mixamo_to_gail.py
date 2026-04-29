import argparse
import importlib.util
import json
import os
import pathlib
import sys

import bpy


REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
DEFAULT_ROKOKO_ADDON = pathlib.Path(
    r"C:\Users\jbates\AppData\Roaming\Blender Foundation\Blender\4.1\scripts\addons\rokoko-studio-live-blender-master"
)
DEFAULT_BONE_MAP = REPO_ROOT / "blender" / "animation_master" / "manifests" / "bone_map.gail.json"
GAIL_MIXAMO_MAPPING = (
    ("Hips", "hip", "hip"),
    ("Hips", "pelvis", "hip"),
    ("Spine", "abdomenLower", "spine"),
    ("Spine1", "abdomenUpper", "spine"),
    ("Spine2", "chestLower", "chest"),
    ("Spine2", "chestUpper", "chest"),
    ("Neck", "neckUpper", "neck"),
    ("Head", "head", "head"),
    ("LeftShoulder", "lCollar", "leftShoulder"),
    ("LeftArm", "lShldrBend", "leftUpperArm"),
    ("LeftArm", "lShldrTwist", "leftUpperArm"),
    ("LeftForeArm", "lForearmBend", "leftLowerArm"),
    ("LeftForeArm", "lForearmTwist", "leftLowerArm"),
    ("LeftHand", "lHand", "leftHand"),
    ("LeftHandThumb1", "lThumb1", "leftThumbProximal"),
    ("LeftHandThumb2", "lThumb2", "leftThumbMedial"),
    ("LeftHandThumb3", "lThumb3", "leftThumbDistal"),
    ("LeftHandIndex1", "lIndex1", "leftIndexProximal"),
    ("LeftHandIndex2", "lIndex2", "leftIndexMedial"),
    ("LeftHandIndex3", "lIndex3", "leftIndexDistal"),
    ("LeftHandMiddle1", "lMid1", "leftMiddleProximal"),
    ("LeftHandMiddle2", "lMid2", "leftMiddleMedial"),
    ("LeftHandMiddle3", "lMid3", "leftMiddleDistal"),
    ("LeftHandRing1", "lRing1", "leftRingProximal"),
    ("LeftHandRing2", "lRing2", "leftRingMedial"),
    ("LeftHandRing3", "lRing3", "leftRingDistal"),
    ("LeftHandPinky1", "lPinky1", "leftLittleProximal"),
    ("LeftHandPinky2", "lPinky2", "leftLittleMedial"),
    ("LeftHandPinky3", "lPinky3", "leftLittleDistal"),
    ("RightShoulder", "rCollar", "rightShoulder"),
    ("RightArm", "rShldrBend", "rightUpperArm"),
    ("RightArm", "rShldrTwist", "rightUpperArm"),
    ("RightForeArm", "rForearmBend", "rightLowerArm"),
    ("RightForeArm", "rForearmTwist", "rightLowerArm"),
    ("RightHand", "rHand", "rightHand"),
    ("RightHandThumb1", "rThumb1", "rightThumbProximal"),
    ("RightHandThumb2", "rThumb2", "rightThumbMedial"),
    ("RightHandThumb3", "rThumb3", "rightThumbDistal"),
    ("RightHandIndex1", "rIndex1", "rightIndexProximal"),
    ("RightHandIndex2", "rIndex2", "rightIndexMedial"),
    ("RightHandIndex3", "rIndex3", "rightIndexDistal"),
    ("RightHandMiddle1", "rMid1", "rightMiddleProximal"),
    ("RightHandMiddle2", "rMid2", "rightMiddleMedial"),
    ("RightHandMiddle3", "rMid3", "rightMiddleDistal"),
    ("RightHandRing1", "rRing1", "rightRingProximal"),
    ("RightHandRing2", "rRing2", "rightRingMedial"),
    ("RightHandRing3", "rRing3", "rightRingDistal"),
    ("RightHandPinky1", "rPinky1", "rightLittleProximal"),
    ("RightHandPinky2", "rPinky2", "rightLittleMedial"),
    ("RightHandPinky3", "rPinky3", "rightLittleDistal"),
    ("LeftUpLeg", "lThighBend", "leftUpLeg"),
    ("LeftUpLeg", "lThighTwist", "leftUpLeg"),
    ("LeftLeg", "lShin", "leftLeg"),
    ("LeftFoot", "lFoot", "leftFoot"),
    ("LeftToeBase", "lToe", "leftToe"),
    ("RightUpLeg", "rThighBend", "rightUpLeg"),
    ("RightUpLeg", "rThighTwist", "rightUpLeg"),
    ("RightLeg", "rShin", "rightLeg"),
    ("RightFoot", "rFoot", "rightFoot"),
    ("RightToeBase", "rToe", "rightToe"),
)


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Retarget a Mixamo FBX to Gail using the Rokoko retarget tool.")
    parser.add_argument("--source-fbx", required=True, help="Absolute path to the Mixamo FBX file.")
    parser.add_argument("--clip-name", default="", help="Optional action name for the baked Gail clip.")
    parser.add_argument("--target-armature", default="", help="Optional target armature object name.")
    parser.add_argument("--use-pose", choices=["REST", "CURRENT"], default="CURRENT")
    parser.add_argument("--auto-scale", action="store_true", help="Enable Rokoko auto scale.")
    parser.add_argument("--keep-imported", action="store_true", help="Keep the imported Mixamo armature after bake.")
    parser.add_argument("--save", action="store_true", help="Save the current blend after retarget.")
    parser.add_argument("--rokoko-addon-dir", default=str(DEFAULT_ROKOKO_ADDON), help="Path to the Rokoko addon folder.")
    parser.add_argument("--mapping-mode", choices=["gail_explicit", "auto"], default="gail_explicit")
    return parser.parse_args(argv)


def load_json(path: pathlib.Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def ensure_rokoko_loaded(addon_dir: pathlib.Path):
    if hasattr(bpy.types.Scene, "rsl_retargeting_armature_source"):
        return

    init_py = addon_dir / "__init__.py"
    if not init_py.exists():
        raise RuntimeError(f"Rokoko addon not found: {init_py}")

    module_name = "rokoko_studio_live_blender_master_local"
    spec = importlib.util.spec_from_file_location(
        module_name,
        init_py,
        submodule_search_locations=[str(addon_dir)],
    )
    if not spec or not spec.loader:
        raise RuntimeError(f"Failed to load Rokoko addon spec from {init_py}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    module.register()


def get_target_armature_name():
    try:
        bone_map = load_json(DEFAULT_BONE_MAP)
        return bone_map.get("armature_object", "")
    except FileNotFoundError:
        return ""


def import_fbx(source_fbx: str):
    before = {obj.name for obj in bpy.data.objects}
    bpy.ops.import_scene.fbx(filepath=source_fbx, automatic_bone_orientation=False)
    imported_objects = [obj for obj in bpy.data.objects if obj.name not in before]
    imported_armatures = [obj for obj in imported_objects if obj.type == "ARMATURE"]
    if not imported_armatures:
        raise RuntimeError("No armature was imported from the FBX.")
    return imported_objects, imported_armatures[0]


def find_target_armature(source_armature, explicit_name: str):
    if explicit_name:
        obj = bpy.data.objects.get(explicit_name)
        if not obj or obj.type != "ARMATURE":
            raise RuntimeError(f"Target armature not found: {explicit_name}")
        return obj

    preferred_name = get_target_armature_name()
    if preferred_name:
        obj = bpy.data.objects.get(preferred_name)
        if obj and obj.type == "ARMATURE":
            return obj

    for obj in bpy.data.objects:
        if obj.type == "ARMATURE" and obj != source_armature:
            return obj

    raise RuntimeError("Could not find a target Gail armature in the current blend.")


def ensure_animation_data(obj):
    if not obj.animation_data:
        obj.animation_data_create()
    if not obj.animation_data or not obj.animation_data.action:
        raise RuntimeError(f"Armature has no active action: {obj.name}")


def dump_bone_list(scene):
    lines = []
    for item in scene.rsl_retargeting_bone_list:
        if item.bone_name_source and item.bone_name_target:
            lines.append(f"{item.bone_name_source} -> {item.bone_name_target} ({item.bone_name_key})")
    return lines


def normalize_source_bone_name(name: str) -> str:
    if ":" in name:
        name = name.split(":")[-1]
    return name.strip().lower()


def apply_gail_mapping(scene, source_armature, target_armature):
    source_lookup = {
        normalize_source_bone_name(bone.name): bone.name for bone in source_armature.pose.bones
    }

    scene.rsl_retargeting_bone_list.clear()
    added = 0
    missing = []
    for source_key, target_name, bone_key in GAIL_MIXAMO_MAPPING:
        source_name = source_lookup.get(source_key.lower())
        if not source_name:
            missing.append(f"source:{source_key}")
            continue
        if target_armature.pose.bones.get(target_name) is None:
            missing.append(f"target:{target_name}")
            continue
        item = scene.rsl_retargeting_bone_list.add()
        item.bone_name_source = source_name
        item.bone_name_target = target_name
        item.bone_name_key = bone_key
        added += 1
    return added, missing


def remove_imported_objects(imported_objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in imported_objects:
        if obj.name in bpy.data.objects:
            obj.select_set(True)
    if bpy.context.view_layer.objects.active and bpy.context.view_layer.objects.active.name not in bpy.data.objects:
        bpy.context.view_layer.objects.active = None
    remaining = [obj for obj in imported_objects if obj.name in bpy.data.objects]
    if not remaining:
        return
    bpy.context.view_layer.objects.active = remaining[0]
    bpy.ops.object.delete()


def main():
    args = parse_args()
    source_fbx = pathlib.Path(args.source_fbx).resolve()
    if not source_fbx.exists():
        raise RuntimeError(f"Source FBX not found: {source_fbx}")

    ensure_rokoko_loaded(pathlib.Path(args.rokoko_addon_dir))

    scene = bpy.context.scene
    imported_objects, source_armature = import_fbx(str(source_fbx))
    target_armature = find_target_armature(source_armature, args.target_armature)

    ensure_animation_data(source_armature)

    scene.rsl_retargeting_armature_source = source_armature
    scene.rsl_retargeting_armature_target = target_armature
    scene.rsl_retargeting_auto_scaling = args.auto_scale
    scene.rsl_retargeting_use_pose = args.use_pose

    if args.mapping_mode == "auto":
        build_result = bpy.ops.rsl.build_bone_list()
        if "CANCELLED" in build_result:
            raise RuntimeError("Rokoko bone-list build was cancelled.")
    else:
        added, missing = apply_gail_mapping(scene, source_armature, target_armature)
        if not added:
            raise RuntimeError("Explicit Gail mapping produced no usable bone mappings.")
        print("ROKOKO EXPLICIT MAP COUNT:", added)
        if missing:
            print("ROKOKO EXPLICIT MAP MISSING:", ", ".join(missing))

    mappings = dump_bone_list(scene)
    print("ROKOKO SOURCE:", source_armature.name)
    print("ROKOKO TARGET:", target_armature.name)
    print("ROKOKO USE POSE:", args.use_pose)
    print("ROKOKO MAPPING MODE:", args.mapping_mode)
    print("ROKOKO BONE COUNT:", len(mappings))
    for line in mappings:
        print("MAP", line)

    retarget_result = bpy.ops.rsl.retarget_animation()
    if "CANCELLED" in retarget_result:
        raise RuntimeError("Rokoko retarget was cancelled.")

    ensure_animation_data(target_armature)
    action = target_armature.animation_data.action
    if args.clip_name:
        action.name = args.clip_name
    print("ROKOKO ACTION:", action.name)

    if not args.keep_imported:
        remove_imported_objects(imported_objects)

    if args.save:
        bpy.ops.wm.save_mainfile()


if __name__ == "__main__":
    main()
