import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

import bpy


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--mesh", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args(argv)


def classify_shape_key(name: str) -> str:
    if name == "Basis":
        return "basis"
    lowered = name.lower()
    if "__ectrlv" in lowered:
        return "viseme"
    if "__ectrl" in lowered:
        return "expression"
    if "__pctrl" in lowered:
        return "pose_corrective"
    if "__pjcm" in lowered or "__jcm" in lowered:
        return "joint_corrective"
    if "__ppbm" in lowered or "__pbm" in lowered:
        return "body_morph"
    if "__phm" in lowered or "__ephm" in lowered:
        return "hd_morph"
    return "other"


def prefix_bucket(name: str) -> str:
    if "__" in name:
        return name.split("__", 1)[1]
    return name


def main():
    args = parse_args()
    mesh = bpy.data.objects.get(args.mesh)
    if mesh is None or mesh.type != "MESH":
        raise RuntimeError(f"Mesh not found: {args.mesh}")
    if mesh.data.shape_keys is None:
        raise RuntimeError(f"Mesh has no shape keys: {args.mesh}")

    shape_keys = [key.name for key in mesh.data.shape_keys.key_blocks]
    by_category = Counter()
    by_prefix = Counter()
    grouped = defaultdict(list)

    for name in shape_keys:
        category = classify_shape_key(name)
        by_category[category] += 1
        if name != "Basis":
            bucket = prefix_bucket(name)
            by_prefix[bucket] += 1
            grouped[category].append(name)

    report = {
        "blend_file": bpy.data.filepath,
        "mesh": mesh.name,
        "shape_key_count": len(shape_keys),
        "categories": dict(sorted(by_category.items())),
        "top_prefix_buckets": [
            {"name": name, "count": count}
            for name, count in by_prefix.most_common(40)
        ],
        "shape_keys_by_category": {
            category: sorted(names) for category, names in sorted(grouped.items())
        },
        "all_shape_keys": shape_keys,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)

    print(f"SHAPE_KEY_REPORT {output_path}")
    print(f"MESH {mesh.name}")
    print(f"SHAPE_KEYS {len(shape_keys)}")
    for category, count in sorted(by_category.items()):
        print(f"{category.upper()} {count}")


if __name__ == "__main__":
    main()
