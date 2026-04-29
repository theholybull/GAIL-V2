import argparse
import sys

import bpy


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--armature", default="VAMP Laurina for G8 Female")
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def assign_shape_action(obj_name, action_name):
    obj = bpy.data.objects.get(obj_name)
    action = bpy.data.actions.get(action_name)
    if obj is None or obj.data.shape_keys is None or action is None:
        return False
    keys = obj.data.shape_keys
    if keys.animation_data is None:
        keys.animation_data_create()
    keys.animation_data.action = action
    return True


def main():
    args = parse_args()
    arm = bpy.data.objects[args.armature]
    arm.animation_data_create()
    arm.animation_data.action = bpy.data.actions["idle_base_v1"]
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 96

    assigned = []
    if assign_shape_action("VAMP Laurina for G8 Female.Shape", "idle_face_body_v1"):
        assigned.append("idle_face_body_v1")
    if assign_shape_action("Genesis 8 Female Eyelashes.Shape", "idle_face_lashes_v1"):
        assigned.append("idle_face_lashes_v1")
    if assign_shape_action("VAMPLaurinaBrows.Shape", "idle_face_brows_v1"):
        assigned.append("idle_face_brows_v1")

    print("ASSIGNED idle bundle")
    print("- idle_base_v1")
    for name in assigned:
        print(f"- {name}")
    if args.save:
        bpy.ops.wm.save_mainfile()
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
