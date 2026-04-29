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
    parser.add_argument("--source-fbx", required=True)
    parser.add_argument("--bone-map", required=True)
    parser.add_argument("--mixamo-map", required=True)
    return parser.parse_args(argv)


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def import_fbx(filepath: Path):
    before_objects = set(bpy.data.objects.keys())
    bpy.ops.import_scene.fbx(filepath=str(filepath))
    imported_objects = [obj for obj in bpy.data.objects if obj.name not in before_objects]
    return imported_objects


def candidate_source_bone_names(base_name: str) -> list[str]:
    names = [base_name]
    prefixes = ("mixamorig:", "mixamorig_", "Armature|mixamorig:", "mixamo.com|mixamorig:")
    for prefix in prefixes:
        names.append(f"{prefix}{base_name}")
    return names


def resolve_source_bone(source_armature, semantic_key, mixamo_map):
    source_names = mixamo_map["body"].get(semantic_key, [])
    for source_name in source_names:
        for candidate in candidate_source_bone_names(source_name):
            bone = source_armature.pose.bones.get(candidate)
            if bone is not None:
                return bone
        for bone in source_armature.pose.bones:
            suffix = bone.name.split(":")[-1].split("|")[-1]
            if suffix == source_name:
                return bone
    return None


def local_rest_matrix(pose_bone):
    bone = pose_bone.bone
    if bone.parent is None:
        return bone.matrix_local.copy()
    return bone.parent.matrix_local.inverted() @ bone.matrix_local


def main():
    args = parse_args()
    bone_map = load_json(Path(args.bone_map))
    mixamo_map = load_json(Path(args.mixamo_map))
    imported_objects = import_fbx(Path(args.source_fbx))
    source_armature = next(obj for obj in imported_objects if obj.type == "ARMATURE")
    target_armature = bpy.data.objects[bone_map["armature_object"]]

    keys = [
        "left_shoulder",
        "left_forearm",
        "left_thigh",
        "left_shin",
        "right_shoulder",
        "right_forearm",
        "right_thigh",
        "right_shin",
    ]
    for key in keys:
        source_bone = resolve_source_bone(source_armature, key, mixamo_map)
        target_bone = target_armature.pose.bones.get(bone_map["body"][key])
        if source_bone is None or target_bone is None:
            continue
        s_local = local_rest_matrix(source_bone).to_3x3()
        t_local = local_rest_matrix(target_bone).to_3x3()
        print(f"[{key}]")
        print(f"source: {source_bone.name}")
        print(f"target: {target_bone.name}")
        print(f"source_x: {tuple(round(v, 4) for v in s_local.col[0])}")
        print(f"source_y: {tuple(round(v, 4) for v in s_local.col[1])}")
        print(f"source_z: {tuple(round(v, 4) for v in s_local.col[2])}")
        print(f"target_x: {tuple(round(v, 4) for v in t_local.col[0])}")
        print(f"target_y: {tuple(round(v, 4) for v in t_local.col[1])}")
        print(f"target_z: {tuple(round(v, 4) for v in t_local.col[2])}")


if __name__ == "__main__":
    main()
