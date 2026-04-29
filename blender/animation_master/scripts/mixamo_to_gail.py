import argparse
import json
import re
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


DEFAULT_BONE_MAP = Path(__file__).resolve().parent.parent / "manifests" / "bone_map.gail.json"
DEFAULT_MIXAMO_MAP = Path(__file__).resolve().parent.parent / "manifests" / "mixamo_bone_map.gail.json"
DEFAULT_CLIP_REGISTRY = Path(__file__).resolve().parent.parent / "manifests" / "clip_registry.gail.example.json"

TARGET_DISTRIBUTION = {
    "hip": [("hip", 0.5, True), ("pelvis", 0.5, False)],
    "chest": [("chestLower", 0.5, False), ("chestUpper", 0.5, False)],
    "left_shoulder": [("lShldrBend", 0.5, False), ("lShldrTwist", 0.5, False)],
    "right_shoulder": [("rShldrBend", 0.5, False), ("rShldrTwist", 0.5, False)],
    "left_forearm": [("lForearmBend", 0.5, False), ("lForearmTwist", 0.5, False)],
    "right_forearm": [("rForearmBend", 0.5, False), ("rForearmTwist", 0.5, False)],
    "left_thigh": [("lThighBend", 0.5, False), ("lThighTwist", 0.5, False)],
    "right_thigh": [("rThighBend", 0.5, False), ("rThighTwist", 0.5, False)],
}


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--source-fbx")
    parser.add_argument("--source-dir")
    parser.add_argument("--source-armature")
    parser.add_argument("--target-armature")
    parser.add_argument("--clip-name")
    parser.add_argument("--category", default="gesture")
    parser.add_argument("--status", default="review")
    parser.add_argument("--version", type=int, default=1)
    parser.add_argument("--loop", action="store_true")
    parser.add_argument("--cleanup-pass", default="mixamo_import")
    parser.add_argument("--retargeted-by", default="gail_mixamo_pass_01")
    parser.add_argument("--bone-map", default=str(DEFAULT_BONE_MAP))
    parser.add_argument("--mixamo-map", default=str(DEFAULT_MIXAMO_MAP))
    parser.add_argument("--clip-registry", default=str(DEFAULT_CLIP_REGISTRY))
    parser.add_argument("--register", action="store_true")
    parser.add_argument("--save", action="store_true")
    parser.add_argument("--keep-imported", action="store_true")
    return parser.parse_args(argv)


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", value).strip("_").lower()
    return cleaned or "mixamo_clip"


def ensure_object_mode():
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def set_active_object(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def import_fbx(filepath: Path):
    before_objects = set(bpy.data.objects.keys())
    before_actions = set(bpy.data.actions.keys())
    bpy.ops.import_scene.fbx(filepath=str(filepath))
    imported_objects = [obj for obj in bpy.data.objects if obj.name not in before_objects]
    imported_actions = [action for action in bpy.data.actions if action.name not in before_actions]
    return imported_objects, imported_actions


def find_source_armature(imported_objects, explicit_name, mixamo_map):
    if explicit_name:
        obj = bpy.data.objects.get(explicit_name)
        if obj is None or obj.type != "ARMATURE":
            raise RuntimeError(f"Missing source armature: {explicit_name}")
        return obj

    for obj in imported_objects:
        if obj.type == "ARMATURE":
            return obj

    candidates = mixamo_map.get("source_armature_candidates", [])
    for candidate in candidates:
        obj = bpy.data.objects.get(candidate)
        if obj is not None and obj.type == "ARMATURE":
            return obj

    for obj in bpy.data.objects:
        if obj.type == "ARMATURE":
            return obj

    raise RuntimeError("Unable to resolve imported Mixamo armature")


def find_target_armature(explicit_name, bone_map):
    armature_name = explicit_name or bone_map.get("armature_object", "")
    obj = bpy.data.objects.get(armature_name)
    if obj is None or obj.type != "ARMATURE":
        raise RuntimeError(f"Missing target armature: {armature_name}")
    return obj


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
            raw_name = bone.name
            suffix = raw_name.split(":")[-1].split("|")[-1]
            if suffix == source_name:
                return bone
    raise RuntimeError(f"Unable to resolve Mixamo source bone for {semantic_key}")


def clear_action(action):
    while action.fcurves:
        action.fcurves.remove(action.fcurves[0])


def ensure_action(name: str):
    action = bpy.data.actions.get(name)
    if action is None:
        action = bpy.data.actions.new(name=name)
    else:
        clear_action(action)
    action.use_fake_user = True
    return action


def add_constraint(target_bone, constraint_type, source_armature, source_bone_name, name):
    constraint = target_bone.constraints.new(constraint_type)
    constraint.name = name
    constraint.target = source_armature
    constraint.subtarget = source_bone_name
    if hasattr(constraint, "target_space"):
        constraint.target_space = "LOCAL"
    if hasattr(constraint, "owner_space"):
        constraint.owner_space = "LOCAL"
    return constraint


def remove_constraints(target_armature):
    for pose_bone in target_armature.pose.bones:
        for constraint in list(pose_bone.constraints):
            if constraint.name.startswith("gail_mixamo_retarget_"):
                pose_bone.constraints.remove(constraint)


def key_pose_bone(pose_bone, frame: int):
    pose_bone.keyframe_insert(data_path="location", frame=frame)
    pose_bone.keyframe_insert(data_path="rotation_quaternion", frame=frame)
    pose_bone.keyframe_insert(data_path="scale", frame=frame)


def reset_target_pose(target_armature):
    for pose_bone in target_armature.pose.bones:
        pose_bone.rotation_mode = "QUATERNION"
        pose_bone.location = (0.0, 0.0, 0.0)
        pose_bone.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        pose_bone.scale = (1.0, 1.0, 1.0)
        pose_bone.matrix_basis = Matrix.Identity(4)


def weighted_delta(loc: Vector, rot, weight: float):
    identity = rot.copy()
    identity.identity()
    return loc * weight, identity.slerp(rot, weight)


def local_rest_matrix(pose_bone) -> Matrix:
    bone = pose_bone.bone
    if bone.parent is None:
        return bone.matrix_local.copy()
    return bone.parent.matrix_local.inverted() @ bone.matrix_local


def local_pose_matrix(pose_bone) -> Matrix:
    if pose_bone.parent is None:
        return pose_bone.matrix.copy()
    return pose_bone.parent.matrix.inverted() @ pose_bone.matrix


def retarget_basis_matrix(source_pose_bone, target_pose_bone, include_translation: bool, weight: float) -> Matrix:
    source_rest_local = local_rest_matrix(source_pose_bone)
    source_pose_local = local_pose_matrix(source_pose_bone)
    source_delta_local = source_rest_local.inverted() @ source_pose_local

    target_rest_local = local_rest_matrix(target_pose_bone)
    alignment = target_rest_local.inverted() @ source_rest_local

    src_loc, src_rot, _src_scale = source_delta_local.decompose()
    align_rot = alignment.to_quaternion()
    src_loc, src_rot = weighted_delta(src_loc, src_rot, weight)
    target_rot = align_rot @ src_rot @ align_rot.inverted()
    if include_translation:
        target_loc = align_rot.to_matrix() @ src_loc
    else:
        target_loc = Vector((0.0, 0.0, 0.0))

    target_delta_local = Matrix.Translation(target_loc) @ target_rot.to_matrix().to_4x4()
    return target_delta_local


def upsert_clip_registry(
    registry_path: Path,
    clip_name: str,
    category: str,
    version: int,
    status: str,
    frame_start: int,
    frame_end: int,
    loop: bool,
    source_file: str,
    retargeted_by: str,
    cleanup_pass: str,
):
    payload = load_json(registry_path)
    payload.setdefault("manifest_version", "v1")
    payload.setdefault("project", "gail")
    payload.setdefault("clips", [])

    clip_entry = {
        "clip_name": clip_name,
        "category": category,
        "version": version,
        "status": status,
        "owner": "animation",
        "partition": "body",
        "frame_start": frame_start,
        "frame_end": frame_end,
        "loop": loop,
        "tags": ["mixamo", category],
        "source": {
            "source_type": "mixamo",
            "source_name": "Mixamo",
            "source_file": source_file,
            "source_clip": "mixamo.com",
            "retargeted_by": retargeted_by,
            "cleanup_pass": cleanup_pass,
        },
        "export": {
            "profile": "playcanvas_glb",
            "relative_path": f"{status}\\{category}\\{clip_name}.glb",
            "collection": "EXP_clip_preview",
        },
        "notes": "Imported from Mixamo and retargeted to Gail.",
    }

    replaced = False
    for index, entry in enumerate(payload["clips"]):
        if entry.get("clip_name") == clip_name:
            payload["clips"][index] = clip_entry
            replaced = True
            break
    if not replaced:
        payload["clips"].append(clip_entry)

    save_json(registry_path, payload)


def collect_import_roots(imported_objects):
    roots = []
    for obj in imported_objects:
        current = obj
        while current.parent is not None:
            current = current.parent
        if current not in roots:
            roots.append(current)
    return roots


def delete_imported_objects(imported_objects):
    ensure_object_mode()
    roots = collect_import_roots(imported_objects)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in roots:
        if obj.name in bpy.data.objects:
            obj.select_set(True)
    bpy.ops.object.delete()


def resolve_source_action(source_armature, imported_actions):
    if source_armature.animation_data and source_armature.animation_data.action:
        return source_armature.animation_data.action
    if imported_actions:
        return imported_actions[0]
    raise RuntimeError(f"Missing source action on {source_armature.name}")


def retarget_action(
    source_armature,
    target_armature,
    source_action,
    output_action_name: str,
    bone_map: dict,
    mixamo_map: dict,
):
    if source_armature.animation_data is None:
        source_armature.animation_data_create()
    source_armature.animation_data.action = source_action

    if target_armature.animation_data is None:
        target_armature.animation_data_create()

    output_action = ensure_action(output_action_name)
    target_armature.animation_data.action = output_action

    frame_start = int(source_action.frame_range[0])
    frame_end = int(source_action.frame_range[1])
    bpy.context.scene.frame_start = frame_start
    bpy.context.scene.frame_end = frame_end

    mapped_bones = []
    for semantic_key, target_bone_name in bone_map["body"].items():
        if semantic_key not in mixamo_map["body"]:
            continue
        source_bone = resolve_source_bone(source_armature, semantic_key, mixamo_map)
        target_bindings = TARGET_DISTRIBUTION.get(
            semantic_key,
            [(target_bone_name, 1.0, semantic_key == "hip")],
        )
        for binding_name, weight, include_translation in target_bindings:
            target_bone = target_armature.pose.bones.get(binding_name)
            if target_bone is None:
                continue
            target_bone.rotation_mode = "QUATERNION"
            mapped_bones.append((semantic_key, source_bone, target_bone, weight, include_translation))

    def bone_depth(item):
        _semantic_key, _source_bone, target_bone, _weight, _include_translation = item
        depth = 0
        current = target_bone.parent
        while current is not None:
            depth += 1
            current = current.parent
        return depth

    mapped_bones.sort(key=bone_depth)

    ensure_object_mode()
    set_active_object(target_armature)
    bpy.ops.object.mode_set(mode="POSE")

    for frame in range(frame_start, frame_end + 1):
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        reset_target_pose(target_armature)
        for _semantic_key, source_bone, target_bone, weight, include_translation in mapped_bones:
            target_basis = retarget_basis_matrix(
                source_pose_bone=source_bone,
                target_pose_bone=target_bone,
                include_translation=include_translation,
                weight=weight,
            )
            target_bone.matrix_basis = target_basis
            key_pose_bone(target_bone, frame)

    bpy.ops.object.mode_set(mode="OBJECT")

    baked_action = target_armature.animation_data.action
    baked_action.name = output_action_name
    baked_action.use_fake_user = True
    baked_action["gail_clip_name"] = output_action_name
    baked_action["gail_source_type"] = "mixamo"
    baked_action["gail_source_action"] = source_action.name
    return baked_action, frame_start, frame_end


def process_file(source_fbx: Path, args, bone_map, mixamo_map):
    imported_objects, imported_actions = import_fbx(source_fbx)
    source_armature = find_source_armature(imported_objects, args.source_armature, mixamo_map)
    target_armature = find_target_armature(args.target_armature, bone_map)
    source_action = resolve_source_action(source_armature, imported_actions)

    output_name = args.clip_name or f"{slugify(source_fbx.stem)}_v{args.version}"
    output_action, frame_start, frame_end = retarget_action(
        source_armature=source_armature,
        target_armature=target_armature,
        source_action=source_action,
        output_action_name=output_name,
        bone_map=bone_map,
        mixamo_map=mixamo_map,
    )

    output_action["gail_category"] = args.category
    output_action["gail_status"] = args.status
    output_action["gail_partition"] = "body"
    output_action["gail_frame_start"] = frame_start
    output_action["gail_frame_end"] = frame_end
    output_action["gail_loop"] = args.loop
    output_action["gail_retargeted_by"] = args.retargeted_by
    output_action["gail_cleanup_pass"] = args.cleanup_pass

    if args.register:
        upsert_clip_registry(
            registry_path=Path(args.clip_registry),
            clip_name=output_name,
            category=args.category,
            version=args.version,
            status=args.status,
            frame_start=frame_start,
            frame_end=frame_end,
            loop=args.loop,
            source_file=source_fbx.name,
            retargeted_by=args.retargeted_by,
            cleanup_pass=args.cleanup_pass,
        )

    if not args.keep_imported:
        delete_imported_objects(imported_objects)

    print(f"RETARGETED {source_fbx.name} -> {output_name} [{frame_start}-{frame_end}]")


def collect_source_files(args):
    if args.source_fbx:
        return [Path(args.source_fbx)]
    if args.source_dir:
        directory = Path(args.source_dir)
        return sorted(directory.glob("*.fbx"))
    raise RuntimeError("Pass --source-fbx or --source-dir")


def main():
    args = parse_args()
    bone_map = load_json(Path(args.bone_map))
    mixamo_map = load_json(Path(args.mixamo_map))
    source_files = collect_source_files(args)
    if not source_files:
        raise RuntimeError("No source FBX files found")

    for source_fbx in source_files:
        if not source_fbx.exists():
            raise RuntimeError(f"Missing source FBX: {source_fbx}")
        process_file(source_fbx, args, bone_map, mixamo_map)

    if args.save:
        bpy.ops.wm.save_mainfile()
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
