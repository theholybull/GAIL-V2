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
    parser.add_argument("--armature", required=True)
    parser.add_argument("--action", required=True)
    parser.add_argument("--frame-start", type=int)
    parser.add_argument("--frame-end", type=int)
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def main():
    args = parse_args()
    armature = bpy.data.objects.get(args.armature)
    if armature is None or armature.type != "ARMATURE":
        raise RuntimeError(f"Missing armature: {args.armature}")

    action = bpy.data.actions.get(args.action)
    if action is None:
        raise RuntimeError(f"Missing action: {args.action}")

    armature.animation_data_create()
    armature.animation_data.action = action

    if args.frame_start is not None:
        bpy.context.scene.frame_start = args.frame_start
    if args.frame_end is not None:
        bpy.context.scene.frame_end = args.frame_end

    print(f"ASSIGNED {armature.name} -> {action.name}")
    if args.save:
        bpy.ops.wm.save_mainfile()
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
