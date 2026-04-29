import argparse
import sys

import bpy


DEFAULT_ARMATURE = "VAMP Laurina for G8 Female"
DEFAULT_ACTION = "loop_custom_v1"


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--armature", default=DEFAULT_ARMATURE)
    parser.add_argument("--action-name", default=DEFAULT_ACTION)
    parser.add_argument("--start-pose", required=True)
    parser.add_argument("--mid-pose")
    parser.add_argument("--end-pose")
    parser.add_argument("--frame-start", type=int, default=1)
    parser.add_argument("--frame-mid", type=int, default=48)
    parser.add_argument("--frame-end", type=int, default=96)
    parser.add_argument("--category", default="idle")
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


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
    return action


def ensure_pose_action(name):
    action = bpy.data.actions.get(name)
    if action is None:
        raise RuntimeError(f"Missing pose action: {name}")
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


def apply_pose_snapshot(armature, snapshot, frame):
    for bone_name, entry in snapshot.items():
        pose_bone = armature.pose.bones.get(bone_name)
        if pose_bone is None:
            continue
        pose_bone.rotation_mode = entry["rotation_mode"]
        pose_bone.location = entry["location"]
        pose_bone.scale = entry["scale"]
        if pose_bone.rotation_mode == "QUATERNION":
            pose_bone.rotation_quaternion = entry["rotation_quaternion"]
            pose_bone.keyframe_insert(data_path="rotation_quaternion", frame=frame)
        elif pose_bone.rotation_mode == "AXIS_ANGLE":
            pose_bone.rotation_axis_angle = entry["rotation_axis_angle"]
            pose_bone.keyframe_insert(data_path="rotation_axis_angle", frame=frame)
        else:
            pose_bone.rotation_euler = entry["rotation_euler"]
            pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)
        pose_bone.keyframe_insert(data_path="location", frame=frame)
        pose_bone.keyframe_insert(data_path="scale", frame=frame)


def set_bezier(action):
    for fcurve in action.fcurves:
        for point in fcurve.keyframe_points:
            point.interpolation = "BEZIER"


def snapshot_from_pose_action(armature, action):
    frame = int(action.get("gail_pose_frame", 1))
    armature.animation_data.action = action
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    return capture_pose_snapshot(armature)


def main():
    args = parse_args()
    armature = ensure_armature(args.armature)
    start_action = ensure_pose_action(args.start_pose)
    mid_action = ensure_pose_action(args.mid_pose) if args.mid_pose else None
    end_action = ensure_pose_action(args.end_pose) if args.end_pose else start_action

    bpy.context.view_layer.objects.active = armature

    start_snapshot = snapshot_from_pose_action(armature, start_action)
    mid_snapshot = snapshot_from_pose_action(armature, mid_action) if mid_action else None
    end_snapshot = snapshot_from_pose_action(armature, end_action)

    action = ensure_action(args.action_name)
    armature.animation_data.action = action
    bpy.context.scene.frame_start = args.frame_start
    bpy.context.scene.frame_end = args.frame_end

    apply_pose_snapshot(armature, start_snapshot, args.frame_start)
    if mid_snapshot is not None:
        apply_pose_snapshot(armature, mid_snapshot, args.frame_mid)
    apply_pose_snapshot(armature, end_snapshot, args.frame_end)

    set_bezier(action)
    action["gail_clip_name"] = args.action_name
    action["gail_generated_by"] = "generate_pose_loop_clip.py"
    action["gail_category"] = args.category
    action["gail_status"] = "review"
    action["gail_partition"] = "body"
    action["gail_frame_start"] = args.frame_start
    action["gail_frame_end"] = args.frame_end
    action["gail_loop"] = args.start_pose == (args.end_pose or args.start_pose)
    action["gail_start_pose"] = args.start_pose
    if args.mid_pose:
        action["gail_mid_pose"] = args.mid_pose
    action["gail_end_pose"] = args.end_pose or args.start_pose

    print(f"Generated action: {action.name}")
    print(f"Start pose: {args.start_pose}")
    print(f"Mid pose: {args.mid_pose or 'None'}")
    print(f"End pose: {args.end_pose or args.start_pose}")
    if args.save:
        try:
            bpy.ops.wm.save_mainfile()
        except RuntimeError:
            bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, copy=False)
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
