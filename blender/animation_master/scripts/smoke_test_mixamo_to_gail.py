import importlib.util
from pathlib import Path

import bpy


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT_PATH = REPO_ROOT / "blender" / "animation_master" / "scripts" / "mixamo_to_gail.py"
TEST_ACTION = "gesture_smoke_v1"


def load_script_module():
    spec = importlib.util.spec_from_file_location("mixamo_to_gail_test", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load script module from {SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def create_armature(name: str, bone_names: list[str]):
    arm_data = bpy.data.armatures.new(f"{name}_data")
    arm_obj = bpy.data.objects.new(name, arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    y = 0.0
    for bone_name in bone_names:
        bone = arm_data.edit_bones.new(bone_name)
        bone.head = (0.0, y, 0.0)
        bone.tail = (0.0, y + 0.1, 0.0)
        y += 0.15
    bpy.ops.object.mode_set(mode="OBJECT")
    return arm_obj


def key_source_animation(source_armature):
    if source_armature.animation_data is None:
        source_armature.animation_data_create()
    action = bpy.data.actions.new(name="mixamo_source")
    source_armature.animation_data.action = action
    bpy.context.view_layer.objects.active = source_armature
    bpy.ops.object.mode_set(mode="POSE")

    hips = source_armature.pose.bones["Hips"]
    arm = source_armature.pose.bones["LeftArm"]
    hips.rotation_mode = "XYZ"
    arm.rotation_mode = "XYZ"

    bpy.context.scene.frame_set(1)
    hips.location = (0.0, 0.0, 0.0)
    hips.rotation_euler = (0.0, 0.0, 0.0)
    arm.rotation_euler = (0.0, 0.0, 0.0)
    hips.keyframe_insert(data_path="location", frame=1)
    hips.keyframe_insert(data_path="rotation_euler", frame=1)
    arm.keyframe_insert(data_path="rotation_euler", frame=1)

    bpy.context.scene.frame_set(12)
    hips.location = (0.0, 0.2, 0.0)
    hips.rotation_euler = (0.0, 0.0, 0.1)
    arm.rotation_euler = (0.4, 0.0, 0.0)
    hips.keyframe_insert(data_path="location", frame=12)
    hips.keyframe_insert(data_path="rotation_euler", frame=12)
    arm.keyframe_insert(data_path="rotation_euler", frame=12)
    bpy.ops.object.mode_set(mode="OBJECT")
    return action


def main():
    script = load_script_module()
    clear_scene()

    source_bones = [
        "Hips",
        "Spine",
        "Spine1",
        "Spine2",
        "Neck",
        "Head",
        "LeftShoulder",
        "RightShoulder",
        "LeftArm",
        "RightArm",
        "LeftForeArm",
        "RightForeArm",
        "LeftHand",
        "RightHand",
        "LeftUpLeg",
        "RightUpLeg",
        "LeftLeg",
        "RightLeg",
    ]
    target_bones = [
        "hip",
        "abdomenLower",
        "abdomenUpper",
        "chestUpper",
        "neckUpper",
        "head",
        "lCollar",
        "rCollar",
        "lShldrBend",
        "rShldrBend",
        "lForearmBend",
        "rForearmBend",
        "lHand",
        "rHand",
        "lThighBend",
        "rThighBend",
        "lShin",
        "rShin",
    ]
    source_armature = create_armature("mixamo_source_armature", source_bones)
    target_armature = create_armature("VAMP Laurina for G8 Female", target_bones)
    source_action = key_source_animation(source_armature)

    bone_map = {
        "armature_object": target_armature.name,
        "body": {
            "hip": "hip",
            "abdomen_lower": "abdomenLower",
            "abdomen_upper": "abdomenUpper",
            "chest": "chestUpper",
            "neck": "neckUpper",
            "head": "head",
            "left_collar": "lCollar",
            "right_collar": "rCollar",
            "left_shoulder": "lShldrBend",
            "right_shoulder": "rShldrBend",
            "left_forearm": "lForearmBend",
            "right_forearm": "rForearmBend",
            "left_hand": "lHand",
            "right_hand": "rHand",
            "left_thigh": "lThighBend",
            "right_thigh": "rThighBend",
            "left_shin": "lShin",
            "right_shin": "rShin",
        },
    }
    mixamo_map = {
        "body": {
            "hip": ["Hips"],
            "abdomen_lower": ["Spine"],
            "abdomen_upper": ["Spine1"],
            "chest": ["Spine2"],
            "neck": ["Neck"],
            "head": ["Head"],
            "left_collar": ["LeftShoulder"],
            "right_collar": ["RightShoulder"],
            "left_shoulder": ["LeftArm"],
            "right_shoulder": ["RightArm"],
            "left_forearm": ["LeftForeArm"],
            "right_forearm": ["RightForeArm"],
            "left_hand": ["LeftHand"],
            "right_hand": ["RightHand"],
            "left_thigh": ["LeftUpLeg"],
            "right_thigh": ["RightUpLeg"],
            "left_shin": ["LeftLeg"],
            "right_shin": ["RightLeg"],
        }
    }

    action, frame_start, frame_end = script.retarget_action(
        source_armature=source_armature,
        target_armature=target_armature,
        source_action=source_action,
        output_action_name=TEST_ACTION,
        bone_map=bone_map,
        mixamo_map=mixamo_map,
    )

    if action.name != TEST_ACTION:
        raise RuntimeError(f"Unexpected action name: {action.name}")
    if frame_start != 1 or frame_end != 12:
        raise RuntimeError(f"Unexpected frame range: {frame_start}-{frame_end}")
    if not action.fcurves:
        raise RuntimeError("Retargeted action has no fcurves")
    if target_armature.pose.bones["lShldrBend"].constraints:
        raise RuntimeError("Retarget constraints were not removed after bake")

    print("MIXAMO TO GAIL SMOKE TEST PASSED")
    print(f"ACTION {action.name}")
    print(f"FRAMES {frame_start}-{frame_end}")


if __name__ == "__main__":
    main()
