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
    parser.add_argument("--source-blend", required=True)
    parser.add_argument("--actions", required=True)
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def main():
    args = parse_args()
    source = Path(args.source_blend)
    names = [name.strip() for name in args.actions.split(",") if name.strip()]
    imported = []
    action_dir = str(source) + "\\Action\\"
    for name in names:
        if bpy.data.actions.get(name) is not None:
            imported.append(name)
            continue
        try:
            bpy.ops.wm.append(directory=action_dir, filename=name)
            if bpy.data.actions.get(name) is not None:
                imported.append(name)
        except Exception as exc:
            print(f"SKIP {name}: {exc}")
    print(f"IMPORTED {len(imported)} actions")
    for name in imported:
        print(f"- {name}")
    if args.save:
        bpy.ops.wm.save_mainfile()
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
