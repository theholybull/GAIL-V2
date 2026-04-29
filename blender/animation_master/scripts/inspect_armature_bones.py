import argparse
import json
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
    parser.add_argument("--armature", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args(argv)


def category(name: str) -> str:
    lowered = name.lower()
    if "head" in lowered:
        return "head"
    if "neck" in lowered:
        return "neck"
    if "chest" in lowered or "spine" in lowered:
        return "spine"
    if "face" in lowered or "jaw" in lowered or "tongue" in lowered:
        return "face"
    return "other"


def main():
    args = parse_args()
    armature = bpy.data.objects.get(args.armature)
    if armature is None or armature.type != "ARMATURE":
        raise RuntimeError(f"Armature not found: {args.armature}")

    bones = []
    for bone in armature.data.bones:
        bones.append(
            {
                "name": bone.name,
                "parent": bone.parent.name if bone.parent else "",
                "use_deform": bone.use_deform,
                "category": category(bone.name),
            }
        )

    report = {
        "blend_file": bpy.data.filepath,
        "armature": armature.name,
        "bone_count": len(bones),
        "bones": sorted(bones, key=lambda item: item["name"]),
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)

    print(f"ARMATURE_REPORT {output_path}")
    print(f"BONES {len(bones)}")
    for wanted in ("head", "neck", "spine", "face"):
        names = [bone["name"] for bone in bones if bone["category"] == wanted]
        print(f"{wanted.upper()} {len(names)}")
        for name in names[:20]:
            print(f"- {name}")


if __name__ == "__main__":
    main()
