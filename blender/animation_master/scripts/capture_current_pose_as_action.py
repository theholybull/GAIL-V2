import argparse
import sys

import bpy


DEFAULT_ARMATURE = "VAMP Laurina for G8 Female"


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--armature", default=DEFAULT_ARMATURE)
    parser.add_argument("--action-name", required=True)
    parser.add_argument("--frame", type=int, default=1)
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def ensure_armature(name: str):
    obj = bpy.data.objects.get(name)
    if obj is None or obj.type != "ARMATURE":
        raise RuntimeError(f"Missing armature: {name}")
    if obj.animation_data is None:
        obj.animation_data_create()
    return obj


def ensure_action(name: str):
    action = bpy.data.actions.get(name)
    if action is None:
        action = bpy.data.actions.new(name=name)
    while action.fcurves:
        action.fcurves.remove(action.fcurves[0])
    action.use_fake_user = True
    return action


def key_pose_bone(pose_bone, frame: int):
    pose_bone.keyframe_insert(data_path="location", frame=frame)
    if pose_bone.rotation_mode == "QUATERNION":
        pose_bone.keyframe_insert(data_path="rotation_quaternion", frame=frame)
    elif pose_bone.rotation_mode == "AXIS_ANGLE":
        pose_bone.keyframe_insert(data_path="rotation_axis_angle", frame=frame)
    else:
        pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)
    pose_bone.keyframe_insert(data_path="scale", frame=frame)


def main():
    args = parse_args()
    armature = ensure_armature(args.armature)
    action = ensure_action(args.action_name)
    armature.animation_data.action = action

    bpy.context.view_layer.objects.active = armature
    bpy.context.scene.frame_set(args.frame)
    bpy.context.view_layer.update()

    for pose_bone in armature.pose.bones:
        key_pose_bone(pose_bone, args.frame)

    action["gail_type"] = "pose"
    action["gail_pose_name"] = args.action_name
    action["gail_pose_frame"] = args.frame
    action["gail_generated_by"] = "capture_current_pose_as_action.py"

    print(f"CAPTURED {args.action_name} on frame {args.frame}")
    if args.save:
        try:
            bpy.ops.wm.save_mainfile()
        except RuntimeError:
            bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, copy=False)
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
