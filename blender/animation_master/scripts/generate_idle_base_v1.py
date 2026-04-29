import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Quaternion


DEFAULT_ARMATURE = "VAMP Laurina for G8 Female"
DEFAULT_ACTION = "idle_base_v1"
DEFAULT_CONFIG = Path(__file__).resolve().parent.parent / "manifests" / "clip_tuning.idle_base_v1.json"


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--armature", default=DEFAULT_ARMATURE)
    parser.add_argument("--action-name", default=DEFAULT_ACTION)
    parser.add_argument("--head-bone", default="head")
    parser.add_argument("--neck-bone", default="neckUpper")
    parser.add_argument("--chest-bone", default="chestUpper")
    parser.add_argument("--frame-start", type=int, default=1)
    parser.add_argument("--frame-end", type=int, default=96)
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def load_json(path):
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


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
    action["gail_generated_by"] = "generate_idle_base_v1.py"
    return action


def key_euler_xz(pose_bone, base_rotation, x_deg, z_deg, frame):
    if pose_bone.rotation_mode != "XYZ":
        pose_bone.rotation_mode = "XYZ"
    rotation = Euler(base_rotation, "XYZ")
    rotation.x += math.radians(x_deg)
    rotation.z += math.radians(z_deg)
    pose_bone.rotation_euler = rotation
    pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)


def key_euler_xyz(pose_bone, base_rotation, x_deg, y_deg, z_deg, frame):
    if pose_bone.rotation_mode != "XYZ":
        pose_bone.rotation_mode = "XYZ"
    rotation = Euler(base_rotation, "XYZ")
    rotation.x += math.radians(x_deg)
    rotation.y += math.radians(y_deg)
    rotation.z += math.radians(z_deg)
    pose_bone.rotation_euler = rotation
    pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)


def key_location_xyz(pose_bone, base_location, x_off, y_off, z_off, frame):
    pose_bone.location = (
        base_location[0] + x_off,
        base_location[1] + y_off,
        base_location[2] + z_off,
    )
    pose_bone.keyframe_insert(data_path="location", frame=frame)


def set_bezier(action):
    for fcurve in action.fcurves:
        for point in fcurve.keyframe_points:
            point.interpolation = "BEZIER"


def main():
    args = parse_args()
    clip_config = load_json(args.config)
    bone_map = load_json(clip_config["bone_map_file"])
    armature_name = bone_map.get("armature_object", args.armature)
    bones = bone_map["body"]

    armature = ensure_armature(armature_name)
    hip = armature.pose.bones.get(bones["hip"])
    abdomen_lower = armature.pose.bones.get(bones["abdomen_lower"])
    abdomen_upper = armature.pose.bones.get(bones["abdomen_upper"])
    head = armature.pose.bones[bones["head"]]
    neck = armature.pose.bones[bones["neck"]]
    chest = armature.pose.bones[bones["chest"]]
    l_collar = armature.pose.bones.get(bones["left_collar"])
    r_collar = armature.pose.bones.get(bones["right_collar"])
    l_shldr = armature.pose.bones.get(bones["left_shoulder"])
    r_shldr = armature.pose.bones.get(bones["right_shoulder"])
    l_forearm = armature.pose.bones.get(bones["left_forearm"])
    r_forearm = armature.pose.bones.get(bones["right_forearm"])
    l_hand = armature.pose.bones.get(bones["left_hand"])
    r_hand = armature.pose.bones.get(bones["right_hand"])
    l_thumb = armature.pose.bones.get(bones["left_thumb_1"])
    r_thumb = armature.pose.bones.get(bones["right_thumb_1"])
    l_index = armature.pose.bones.get(bones["left_index_1"])
    r_index = armature.pose.bones.get(bones["right_index_1"])
    l_mid = armature.pose.bones.get(bones["left_mid_1"])
    r_mid = armature.pose.bones.get(bones["right_mid_1"])
    l_thigh = armature.pose.bones.get(bones["left_thigh"])
    r_thigh = armature.pose.bones.get(bones["right_thigh"])
    l_shin = armature.pose.bones.get(bones["left_shin"])
    r_shin = armature.pose.bones.get(bones["right_shin"])

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

    hip_base = snapshot_rotation_euler(base_snapshot[hip.name]) if hip else None
    abdomen_lower_base = snapshot_rotation_euler(base_snapshot[abdomen_lower.name]) if abdomen_lower else None
    abdomen_upper_base = snapshot_rotation_euler(base_snapshot[abdomen_upper.name]) if abdomen_upper else None
    hip_loc_base = tuple(base_snapshot[hip.name]["location"]) if hip else None
    abdomen_lower_loc_base = tuple(base_snapshot[abdomen_lower.name]["location"]) if abdomen_lower else None
    abdomen_upper_loc_base = tuple(base_snapshot[abdomen_upper.name]["location"]) if abdomen_upper else None
    head_base = snapshot_rotation_euler(base_snapshot[head.name])
    neck_base = snapshot_rotation_euler(base_snapshot[neck.name])
    chest_base = snapshot_rotation_euler(base_snapshot[chest.name])
    l_collar_base = snapshot_rotation_euler(base_snapshot[l_collar.name]) if l_collar else None
    r_collar_base = snapshot_rotation_euler(base_snapshot[r_collar.name]) if r_collar else None
    l_shldr_base = snapshot_rotation_euler(base_snapshot[l_shldr.name]) if l_shldr else None
    r_shldr_base = snapshot_rotation_euler(base_snapshot[r_shldr.name]) if r_shldr else None
    l_forearm_base = snapshot_rotation_euler(base_snapshot[l_forearm.name]) if l_forearm else None
    r_forearm_base = snapshot_rotation_euler(base_snapshot[r_forearm.name]) if r_forearm else None
    l_hand_base = snapshot_rotation_euler(base_snapshot[l_hand.name]) if l_hand else None
    r_hand_base = snapshot_rotation_euler(base_snapshot[r_hand.name]) if r_hand else None
    l_collar_loc_base = tuple(base_snapshot[l_collar.name]["location"]) if l_collar else None
    r_collar_loc_base = tuple(base_snapshot[r_collar.name]["location"]) if r_collar else None
    l_shldr_loc_base = tuple(base_snapshot[l_shldr.name]["location"]) if l_shldr else None
    r_shldr_loc_base = tuple(base_snapshot[r_shldr.name]["location"]) if r_shldr else None
    l_forearm_loc_base = tuple(base_snapshot[l_forearm.name]["location"]) if l_forearm else None
    r_forearm_loc_base = tuple(base_snapshot[r_forearm.name]["location"]) if r_forearm else None
    l_hand_loc_base = tuple(base_snapshot[l_hand.name]["location"]) if l_hand else None
    r_hand_loc_base = tuple(base_snapshot[r_hand.name]["location"]) if r_hand else None
    l_thumb_base = snapshot_rotation_euler(base_snapshot[l_thumb.name]) if l_thumb else None
    r_thumb_base = snapshot_rotation_euler(base_snapshot[r_thumb.name]) if r_thumb else None
    l_index_base = snapshot_rotation_euler(base_snapshot[l_index.name]) if l_index else None
    r_index_base = snapshot_rotation_euler(base_snapshot[r_index.name]) if r_index else None
    l_mid_base = snapshot_rotation_euler(base_snapshot[l_mid.name]) if l_mid else None
    r_mid_base = snapshot_rotation_euler(base_snapshot[r_mid.name]) if r_mid else None
    l_thigh_base = snapshot_rotation_euler(base_snapshot[l_thigh.name]) if l_thigh else None
    r_thigh_base = snapshot_rotation_euler(base_snapshot[r_thigh.name]) if r_thigh else None
    l_shin_base = snapshot_rotation_euler(base_snapshot[l_shin.name]) if l_shin else None
    r_shin_base = snapshot_rotation_euler(base_snapshot[r_shin.name]) if r_shin else None

    for key in clip_config["body"].get("breathing_keys", []):
        frame = key["frame"]
        chest_x, chest_z = key["chest"]
        neck_x, neck_z = key["neck"]
        head_x, head_z = key["head"]
        key_euler_xz(chest, chest_base, chest_x, chest_z, frame)
        key_euler_xz(neck, neck_base, neck_x, neck_z, frame)
        key_euler_xz(head, head_base, head_x, head_z, frame)

    for key in clip_config["body"].get("hip_keys", []):
        frame = key["frame"]
        hip_x, hip_y, hip_z = key["hip"]
        abd_lower_x, abd_lower_y, abd_lower_z = key["abdomen_lower"]
        abd_upper_x, abd_upper_y, abd_upper_z = key["abdomen_upper"]
        hip_loc = key.get("hip_loc", [0.0, 0.0, 0.0])
        abd_lower_loc = key.get("abdomen_lower_loc", [0.0, 0.0, 0.0])
        abd_upper_loc = key.get("abdomen_upper_loc", [0.0, 0.0, 0.0])
        if hip and hip_base:
            key_euler_xyz(hip, hip_base, hip_x, hip_y, hip_z, frame)
            if hip_loc_base:
                key_location_xyz(hip, hip_loc_base, hip_loc[0], hip_loc[1], hip_loc[2], frame)
        if abdomen_lower and abdomen_lower_base:
            key_euler_xyz(abdomen_lower, abdomen_lower_base, abd_lower_x, abd_lower_y, abd_lower_z, frame)
            if abdomen_lower_loc_base:
                key_location_xyz(
                    abdomen_lower,
                    abdomen_lower_loc_base,
                    abd_lower_loc[0],
                    abd_lower_loc[1],
                    abd_lower_loc[2],
                    frame,
                )
        if abdomen_upper and abdomen_upper_base:
            key_euler_xyz(abdomen_upper, abdomen_upper_base, abd_upper_x, abd_upper_y, abd_upper_z, frame)
            if abdomen_upper_loc_base:
                key_location_xyz(
                    abdomen_upper,
                    abdomen_upper_loc_base,
                    abd_upper_loc[0],
                    abd_upper_loc[1],
                    abd_upper_loc[2],
                    frame,
                )

    for key in clip_config["body"].get("arm_keys", []):
        frame = key["frame"]
        l_collar_x, l_collar_y, l_collar_z = key["left_collar"]
        r_collar_x, r_collar_y, r_collar_z = key["right_collar"]
        l_shldr_x, l_shldr_y, l_shldr_z = key["left_shoulder"]
        r_shldr_x, r_shldr_y, r_shldr_z = key["right_shoulder"]
        l_forearm_x, l_forearm_y, l_forearm_z = key["left_forearm"]
        r_forearm_x, r_forearm_y, r_forearm_z = key["right_forearm"]
        _, l_hand_y, l_hand_z = key["left_hand"]
        _, r_hand_y, r_hand_z = key["right_hand"]
        l_collar_loc = key.get("left_collar_loc", [0.0, 0.0, 0.0])
        r_collar_loc = key.get("right_collar_loc", [0.0, 0.0, 0.0])
        l_shldr_loc = key.get("left_shoulder_loc", [0.0, 0.0, 0.0])
        r_shldr_loc = key.get("right_shoulder_loc", [0.0, 0.0, 0.0])
        l_forearm_loc = key.get("left_forearm_loc", [0.0, 0.0, 0.0])
        r_forearm_loc = key.get("right_forearm_loc", [0.0, 0.0, 0.0])
        l_hand_loc = key.get("left_hand_loc", [0.0, 0.0, 0.0])
        r_hand_loc = key.get("right_hand_loc", [0.0, 0.0, 0.0])
        if l_collar and l_collar_base:
            key_euler_xyz(l_collar, l_collar_base, l_collar_x, l_collar_y, l_collar_z, frame)
            if l_collar_loc_base:
                key_location_xyz(l_collar, l_collar_loc_base, l_collar_loc[0], l_collar_loc[1], l_collar_loc[2], frame)
        if r_collar and r_collar_base:
            key_euler_xyz(r_collar, r_collar_base, r_collar_x, r_collar_y, r_collar_z, frame)
            if r_collar_loc_base:
                key_location_xyz(r_collar, r_collar_loc_base, r_collar_loc[0], r_collar_loc[1], r_collar_loc[2], frame)
        if l_shldr and l_shldr_base:
            key_euler_xyz(l_shldr, l_shldr_base, l_shldr_x, l_shldr_y, l_shldr_z, frame)
            if l_shldr_loc_base:
                key_location_xyz(l_shldr, l_shldr_loc_base, l_shldr_loc[0], l_shldr_loc[1], l_shldr_loc[2], frame)
        if r_shldr and r_shldr_base:
            key_euler_xyz(r_shldr, r_shldr_base, r_shldr_x, r_shldr_y, r_shldr_z, frame)
            if r_shldr_loc_base:
                key_location_xyz(r_shldr, r_shldr_loc_base, r_shldr_loc[0], r_shldr_loc[1], r_shldr_loc[2], frame)
        if l_forearm and l_forearm_base:
            key_euler_xyz(l_forearm, l_forearm_base, l_forearm_x, l_forearm_y, l_forearm_z, frame)
            if l_forearm_loc_base:
                key_location_xyz(
                    l_forearm,
                    l_forearm_loc_base,
                    l_forearm_loc[0],
                    l_forearm_loc[1],
                    l_forearm_loc[2],
                    frame,
                )
        if r_forearm and r_forearm_base:
            key_euler_xyz(r_forearm, r_forearm_base, r_forearm_x, r_forearm_y, r_forearm_z, frame)
            if r_forearm_loc_base:
                key_location_xyz(
                    r_forearm,
                    r_forearm_loc_base,
                    r_forearm_loc[0],
                    r_forearm_loc[1],
                    r_forearm_loc[2],
                    frame,
                )
        if l_hand and l_hand_base:
            key_euler_xyz(l_hand, l_hand_base, 0.0, l_hand_y, l_hand_z, frame)
            if l_hand_loc_base:
                key_location_xyz(l_hand, l_hand_loc_base, l_hand_loc[0], l_hand_loc[1], l_hand_loc[2], frame)
        if r_hand and r_hand_base:
            key_euler_xyz(r_hand, r_hand_base, 0.0, r_hand_y, r_hand_z, frame)
            if r_hand_loc_base:
                key_location_xyz(r_hand, r_hand_loc_base, r_hand_loc[0], r_hand_loc[1], r_hand_loc[2], frame)

    for key in clip_config["body"].get("finger_keys", []):
        frame = key["frame"]
        thumb = key["thumb"]
        index = key["index"]
        mid = key["mid"]
        right_scale = key["right_scale"]
        if l_thumb and l_thumb_base:
            key_euler_xyz(l_thumb, l_thumb_base, thumb, 0.0, 0.0, frame)
        if r_thumb and r_thumb_base:
            key_euler_xyz(r_thumb, r_thumb_base, thumb * right_scale, 0.0, 0.0, frame)
        if l_index and l_index_base:
            key_euler_xyz(l_index, l_index_base, index, 0.0, 0.0, frame)
        if r_index and r_index_base:
            key_euler_xyz(r_index, r_index_base, index * right_scale, 0.0, 0.0, frame)
        if l_mid and l_mid_base:
            key_euler_xyz(l_mid, l_mid_base, mid, 0.0, 0.0, frame)
        if r_mid and r_mid_base:
            key_euler_xyz(r_mid, r_mid_base, mid * right_scale, 0.0, 0.0, frame)

    for key in clip_config["body"].get("leg_keys", []):
        frame = key["frame"]
        thigh_x = key["left_thigh_x"]
        shin_x = key["left_shin_x"]
        right_thigh_x = key["right_thigh_x"]
        right_shin_x = key["right_shin_x"]
        if l_thigh and l_thigh_base:
            key_euler_xyz(l_thigh, l_thigh_base, thigh_x, 0.0, 0.0, frame)
        if l_shin and l_shin_base:
            key_euler_xyz(l_shin, l_shin_base, shin_x, 0.0, 0.0, frame)
        if r_thigh and r_thigh_base:
            key_euler_xyz(r_thigh, r_thigh_base, right_thigh_x, 0.0, 0.0, frame)
        if r_shin and r_shin_base:
            key_euler_xyz(r_shin, r_shin_base, right_shin_x, 0.0, 0.0, frame)

    set_bezier(action)
    action["gail_category"] = clip_config.get("category", "idle")
    action["gail_status"] = clip_config.get("status", "review")
    action["gail_partition"] = clip_config.get("partition", "body")
    action["gail_frame_start"] = frame_start
    action["gail_frame_end"] = frame_end
    action["gail_loop"] = clip_config.get("loop", True)

    print(f"Generated action: {action.name}")
    print(f"Frame range: {frame_start}-{frame_end}")
    if args.save:
        try:
            bpy.ops.wm.save_mainfile()
        except RuntimeError:
            bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, copy=False)
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
