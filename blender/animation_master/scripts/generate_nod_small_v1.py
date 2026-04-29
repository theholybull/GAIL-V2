import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Quaternion


DEFAULT_ARMATURE = "VAMP Laurina for G8 Female"
DEFAULT_ACTION = "ack_nod_small_v1"
DEFAULT_CONFIG = Path(__file__).resolve().parent.parent / "manifests" / "clip_tuning.ack_nod_small_v1.json"


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--armature", default=DEFAULT_ARMATURE)
    parser.add_argument("--action-name", default=DEFAULT_ACTION)
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--frame-start", type=int, default=1)
    parser.add_argument("--frame-end", type=int, default=24)
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def load_json(path):
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def ensure_armature(name):
    armature = bpy.data.objects.get(name)
    if armature is None or armature.type != "ARMATURE":
        raise RuntimeError(f"Missing armature: {name}")
    if armature.animation_data is None:
        armature.animation_data_create()
    return armature


def ensure_action(name):
    action = bpy.data.actions.get(name)
    if action is None:
        action = bpy.data.actions.new(name=name)
    while action.fcurves:
        action.fcurves.remove(action.fcurves[0])
    action.use_fake_user = True
    action["gail_clip_name"] = name
    action["gail_generated_by"] = "generate_nod_small_v1.py"
    return action


def capture_pose_snapshot(armature):
    snapshot = {}
    for pose_bone in armature.pose.bones:
        entry = {
            "rotation_mode": pose_bone.rotation_mode,
            "location": tuple(pose_bone.location),
            "scale": tuple(pose_bone.scale),
        }
        if pose_bone.rotation_mode == "QUATERNION":
            entry["rotation_quaternion"] = tuple(pose_bone.rotation_quaternion)
        elif pose_bone.rotation_mode == "AXIS_ANGLE":
            entry["rotation_axis_angle"] = tuple(pose_bone.rotation_axis_angle)
        else:
            entry["rotation_euler"] = tuple(pose_bone.rotation_euler)
        snapshot[pose_bone.name] = entry
    return snapshot


def apply_pose_snapshot(armature, snapshot, frame=None):
    for bone_name, entry in snapshot.items():
        pose_bone = armature.pose.bones.get(bone_name)
        if pose_bone is None:
            continue
        pose_bone.rotation_mode = entry["rotation_mode"]
        pose_bone.location = entry["location"]
        pose_bone.scale = entry["scale"]
        if pose_bone.rotation_mode == "QUATERNION":
            pose_bone.rotation_quaternion = entry["rotation_quaternion"]
        elif pose_bone.rotation_mode == "AXIS_ANGLE":
            pose_bone.rotation_axis_angle = entry["rotation_axis_angle"]
        else:
            pose_bone.rotation_euler = entry["rotation_euler"]
        if frame is not None:
            pose_bone.keyframe_insert(data_path="location", frame=frame)
            if pose_bone.rotation_mode == "QUATERNION":
                pose_bone.keyframe_insert(data_path="rotation_quaternion", frame=frame)
            elif pose_bone.rotation_mode == "AXIS_ANGLE":
                pose_bone.keyframe_insert(data_path="rotation_axis_angle", frame=frame)
            else:
                pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)
            pose_bone.keyframe_insert(data_path="scale", frame=frame)


def snapshot_rotation_euler(snapshot_entry):
    if "rotation_euler" in snapshot_entry:
        return tuple(snapshot_entry["rotation_euler"])
    if "rotation_quaternion" in snapshot_entry:
        quat = Quaternion(snapshot_entry["rotation_quaternion"])
        return tuple(quat.to_euler("XYZ"))
    if "rotation_axis_angle" in snapshot_entry:
        angle, axis_x, axis_y, axis_z = snapshot_entry["rotation_axis_angle"]
        quat = Quaternion((axis_x, axis_y, axis_z), angle)
        return tuple(quat.to_euler("XYZ"))
    return (0.0, 0.0, 0.0)


def set_bezier(action):
    for fcurve in action.fcurves:
        for point in fcurve.keyframe_points:
            point.interpolation = "BEZIER"


def key_euler_xyz(pose_bone, base_rotation, offsets, frame):
    if pose_bone is None or base_rotation is None:
        return
    if pose_bone.rotation_mode != "XYZ":
        pose_bone.rotation_mode = "XYZ"
    rotation = Euler(base_rotation, "XYZ")
    rotation.x += math.radians(offsets[0])
    rotation.y += math.radians(offsets[1])
    rotation.z += math.radians(offsets[2])
    pose_bone.rotation_euler = rotation
    pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)


def key_location_xyz(pose_bone, base_location, offsets, frame):
    if pose_bone is None or base_location is None:
        return
    pose_bone.location = (
        base_location[0] + offsets[0],
        base_location[1] + offsets[1],
        base_location[2] + offsets[2],
    )
    pose_bone.keyframe_insert(data_path="location", frame=frame)


def main():
    args = parse_args()
    clip_config = load_json(args.config)
    bone_map = load_json(clip_config["bone_map_file"])
    armature_name = bone_map.get("armature_object", args.armature)
    bones = bone_map["body"]

    armature = ensure_armature(armature_name)

    chain_names = {
        "hip": bones.get("hip"),
        "abdomen_lower": bones.get("abdomen_lower"),
        "abdomen_upper": bones.get("abdomen_upper"),
        "chest": bones.get("chest"),
        "neck": bones.get("neck"),
        "head": bones.get("head"),
        "left_collar": bones.get("left_collar"),
        "right_collar": bones.get("right_collar"),
        "left_shoulder": bones.get("left_shoulder"),
        "right_shoulder": bones.get("right_shoulder"),
    }
    chain = {key: armature.pose.bones.get(name) for key, name in chain_names.items() if name}

    frame_start = clip_config.get("frame_start", args.frame_start)
    frame_end = clip_config.get("frame_end", args.frame_end)

    base_pose_action_name = clip_config.get("base_pose_action")
    if not base_pose_action_name:
        raise RuntimeError("clip config is missing base_pose_action")
    base_pose_action = bpy.data.actions.get(base_pose_action_name)
    if base_pose_action is None:
        raise RuntimeError(f"Missing base pose action: {base_pose_action_name}")

    bpy.context.view_layer.objects.active = armature
    armature.animation_data.action = base_pose_action
    bpy.context.scene.frame_set(frame_start)
    bpy.context.view_layer.update()
    base_snapshot = capture_pose_snapshot(armature)

    action = ensure_action(args.action_name)
    armature.animation_data.action = action
    bpy.context.scene.frame_start = frame_start
    bpy.context.scene.frame_end = frame_end
    apply_pose_snapshot(armature, base_snapshot, frame_start)
    apply_pose_snapshot(armature, base_snapshot, frame_end)

    rotation_bases = {}
    location_bases = {}
    for key, pose_bone in chain.items():
        rotation_bases[key] = snapshot_rotation_euler(base_snapshot[pose_bone.name])
        location_bases[key] = tuple(base_snapshot[pose_bone.name]["location"])

    for key in clip_config["body"].get("group_keys", []):
        frame = key["frame"]
        for group_name, pose_bone in chain.items():
            offsets = key.get(group_name)
            if offsets is None:
                continue
            key_euler_xyz(pose_bone, rotation_bases.get(group_name), offsets, frame)
            loc_key = f"{group_name}_loc"
            if loc_key in key:
                key_location_xyz(pose_bone, location_bases.get(group_name), key[loc_key], frame)

    set_bezier(action)
    for tag in clip_config.get("compatibility_tags", []):
        action[f"gail_tag_{tag}"] = True
    action["gail_category"] = clip_config.get("category", "ack")
    action["gail_status"] = clip_config.get("status", "review")
    action["gail_partition"] = clip_config.get("partition", "body")
    action["gail_frame_start"] = frame_start
    action["gail_frame_end"] = frame_end
    action["gail_loop"] = clip_config.get("loop", False)
    action["gail_base_pose_action"] = base_pose_action_name

    print(f"Generated action: {action.name}")
    print(f"Frame range: {frame_start}-{frame_end}")
    print(f"Base pose: {base_pose_action_name}")
    print("Driven groups:", ", ".join(sorted(chain.keys())))
    if args.save:
        try:
            bpy.ops.wm.save_mainfile()
        except RuntimeError:
            bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, copy=False)
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
