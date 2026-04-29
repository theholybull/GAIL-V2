import argparse
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
    parser.add_argument("--source-fbx", required=True)
    return parser.parse_args(argv)


def main():
    args = parse_args()
    source_fbx = Path(args.source_fbx)
    before_objects = set(bpy.data.objects.keys())
    before_actions = set(bpy.data.actions.keys())
    bpy.ops.import_scene.fbx(filepath=str(source_fbx))
    imported_objects = [obj for obj in bpy.data.objects if obj.name not in before_objects]
    imported_actions = [action for action in bpy.data.actions if action.name not in before_actions]

    print(f"IMPORTED {source_fbx.name}")
    print("OBJECTS")
    for obj in imported_objects:
        print(f"- {obj.name} [{obj.type}]")
        if obj.type == "ARMATURE":
            print("  BONES")
            for bone in obj.pose.bones:
                print(f"  - {bone.name}")
    print("ACTIONS")
    for action in imported_actions:
        print(f"- {action.name} [{int(action.frame_range[0])}-{int(action.frame_range[1])}]")


if __name__ == "__main__":
    main()
