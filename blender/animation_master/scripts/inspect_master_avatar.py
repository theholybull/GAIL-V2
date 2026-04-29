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
    parser.add_argument("--output", required=True)
    return parser.parse_args(argv)


def object_collections(obj):
    return sorted({collection.name for collection in obj.users_collection})


def collect_mesh_entry(obj):
    shape_keys = []
    if obj.data.shape_keys is not None:
        shape_keys = [key.name for key in obj.data.shape_keys.key_blocks]

    return {
        "name": obj.name,
        "vertex_count": len(obj.data.vertices),
        "materials": [slot.material.name if slot.material else "" for slot in obj.material_slots],
        "collections": object_collections(obj),
        "parent": obj.parent.name if obj.parent else "",
        "armature_modifiers": [
            modifier.object.name
            for modifier in obj.modifiers
            if modifier.type == "ARMATURE" and modifier.object is not None
        ],
        "shape_key_count": len(shape_keys),
        "shape_keys": shape_keys,
    }


def main():
    args = parse_args()
    output_path = Path(args.output)

    collections = sorted(collection.name for collection in bpy.data.collections)
    armatures = []
    meshes = []

    for obj in bpy.data.objects:
        if obj.type == "ARMATURE":
            armatures.append(
                {
                    "name": obj.name,
                    "data_name": obj.data.name,
                    "bone_count": len(obj.data.bones),
                    "collections": object_collections(obj),
                }
            )
        elif obj.type == "MESH":
            meshes.append(collect_mesh_entry(obj))

    report = {
        "blend_file": bpy.data.filepath,
        "collection_count": len(collections),
        "collections": collections,
        "armature_count": len(armatures),
        "armatures": sorted(armatures, key=lambda item: item["name"]),
        "mesh_count": len(meshes),
        "meshes": sorted(meshes, key=lambda item: item["name"]),
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)

    print(f"INSPECTION_REPORT {output_path}")
    print(f"COLLECTIONS {len(collections)}")
    print(f"ARMATURES {len(armatures)}")
    print(f"MESHES {len(meshes)}")


if __name__ == "__main__":
    main()
