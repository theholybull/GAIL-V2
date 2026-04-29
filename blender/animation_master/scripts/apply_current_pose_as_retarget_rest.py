import argparse
import sys
from pathlib import Path

import bpy


DEFAULT_ARMATURE = "VAMP Laurina for G8 Female"
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "source" / "gail_rig_master_retarget_tpose.blend"


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--armature", default=DEFAULT_ARMATURE)
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--in-place", action="store_true")
    return parser.parse_args(argv)


def ensure_armature(name: str):
    armature = bpy.data.objects.get(name)
    if armature is None or armature.type != "ARMATURE":
        raise RuntimeError(f"Missing armature: {name}")
    return armature


def main():
    args = parse_args()
    armature = ensure_armature(args.armature)

    output_path = Path(args.output).resolve()
    current_path = Path(bpy.data.filepath).resolve() if bpy.data.filepath else None

    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")

    bpy.ops.pose.armature_apply(selected=False)

    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.context.view_layer.update()

    if args.in_place:
        bpy.ops.wm.save_mainfile()
        print(f"UPDATED {bpy.data.filepath}")
        return

    if current_path is None or current_path != output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(output_path), copy=False)
    else:
        bpy.ops.wm.save_mainfile()
    print(f"SAVED {output_path}")


if __name__ == "__main__":
    main()
