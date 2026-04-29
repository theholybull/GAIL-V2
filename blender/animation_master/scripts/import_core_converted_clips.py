import argparse
import json
import sys
from pathlib import Path

import bpy


EXPECTED_COLLECTIONS = [
    "00_REFERENCE",
    "01_RIG",
    "02_BODY",
    "03_HAIR",
    "04_CLOTHES",
    "05_ACCESSORIES",
    "06_FACE_TEST",
    "07_ANIM_LIBRARY",
    "08_IMPORT_SOURCES",
    "09_EXPORT_STAGING",
    "10_QA",
    "90_ARCHIVE",
    "99_DEPRECATED",
]


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--mapping", required=True)
    parser.add_argument("--registry", required=True)
    parser.add_argument("--target-armature", default="Victoria 8")
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def resolve_source_path(raw_path: str, mapping_path: Path, repo_root: Path) -> Path:
    candidate = Path(raw_path)
    if candidate.is_absolute():
        return candidate

    from_mapping = (mapping_path.parent / candidate).resolve()
    if from_mapping.exists():
        return from_mapping

    return (repo_root / candidate).resolve()


def ensure_collections() -> None:
    scene_root = bpy.context.scene.collection
    for name in EXPECTED_COLLECTIONS:
        collection = bpy.data.collections.get(name)
        if collection is None:
            collection = bpy.data.collections.new(name)
        if collection.name not in scene_root.children.keys():
            scene_root.children.link(collection)


def remove_object_and_data(obj: bpy.types.Object) -> None:
    obj_type = obj.type
    data_block = obj.data if obj_type in {"MESH", "ARMATURE"} else None
    bpy.data.objects.remove(obj, do_unlink=True)
    if data_block is None or data_block.users != 0:
        return
    if obj_type == "MESH":
        bpy.data.meshes.remove(data_block)
    elif obj_type == "ARMATURE":
        bpy.data.armatures.remove(data_block)


def import_clip_action(source_glb: Path, clip_name: str, target_armature: bpy.types.Object):
    if not source_glb.exists():
        raise RuntimeError(f"Missing source clip: {source_glb}")

    before_action_names = set(action.name for action in bpy.data.actions)
    before_object_names = set(obj.name for obj in bpy.data.objects)

    result = bpy.ops.import_scene.gltf(filepath=str(source_glb))
    if "FINISHED" not in result:
        raise RuntimeError(f"GLB import failed for {source_glb}")

    imported_actions = [action for action in bpy.data.actions if action.name not in before_action_names]
    if not imported_actions:
        raise RuntimeError(f"No new action imported from {source_glb}")

    imported_objects = [obj for obj in bpy.data.objects if obj.name not in before_object_names]

    # Prefer longest imported action when glTF includes multiple channels/actions.
    source_action = max(
        imported_actions,
        key=lambda action: float(action.frame_range[1] - action.frame_range[0]),
    )
    target_action = source_action.copy()
    target_action.name = clip_name
    target_action.use_fake_user = True

    frame_start = int(round(float(target_action.frame_range[0])))
    frame_end = int(round(float(target_action.frame_range[1])))
    if frame_end <= frame_start:
        frame_end = frame_start + 1

    target_armature.animation_data_create()
    target_armature.animation_data.action = target_action

    for action in imported_actions:
        if action.users == 0:
            bpy.data.actions.remove(action)

    for obj in imported_objects:
        if obj.name in bpy.data.objects:
            remove_object_and_data(obj)

    return target_action, frame_start, frame_end


def main():
    args = parse_args()

    mapping_path = Path(args.mapping).resolve()
    registry_path = Path(args.registry).resolve()
    repo_root = Path(__file__).resolve().parents[3]

    mapping = load_json(mapping_path)
    clips = mapping.get("clips", [])
    if not clips:
        raise RuntimeError("Mapping file contains no clips.")

    target_armature = bpy.data.objects.get(args.target_armature)
    if target_armature is None or target_armature.type != "ARMATURE":
        raise RuntimeError(f"Missing target armature: {args.target_armature}")

    ensure_collections()

    # Remove existing clip actions before import so registry/action set stays deterministic.
    existing_clip_names = {clip.get("clip_name") for clip in clips if clip.get("clip_name")}
    if target_armature.animation_data and target_armature.animation_data.action:
        if target_armature.animation_data.action.name in existing_clip_names:
            target_armature.animation_data.action = None

    for action in list(bpy.data.actions):
        if action.name in existing_clip_names:
            try:
                bpy.data.actions.remove(action)
            except RuntimeError:
                pass

    imported_registry_clips = []
    for clip in clips:
        clip_name = clip["clip_name"]
        source_path = resolve_source_path(clip["source_glb"], mapping_path, repo_root)
        _, frame_start, frame_end = import_clip_action(source_path, clip_name, target_armature)

        imported_registry_clips.append(
            {
                "clip_name": clip_name,
                "category": clip.get("category", "other"),
                "status": clip.get("status", "approved"),
                "partition": clip.get("partition", "body"),
                "loop": bool(clip.get("loop", True)),
                "frame_start": frame_start,
                "frame_end": frame_end,
                "source_glb": str(source_path).replace("\\", "/"),
                "export": {
                    "profile": "playcanvas_glb",
                    "collection": "EXP_clip_preview",
                    "relative_path": clip["relative_path"],
                },
            }
        )
        print(f"IMPORTED {clip_name} from {source_path}")

    registry_payload = {
        "manifest_version": "v1",
        "project": "gail",
        "master_file": "gail_rig.blend",
        "armature": {
            "object_name": target_armature.name,
            "data_name": target_armature.data.name,
            "lock_contract": False,
        },
        "export_profiles": [
            {
                "name": "playcanvas_glb",
                "format": "glb",
                "path_root": "blender/animation_master/exports/glb/clips",
                "collection": "EXP_clip_preview",
                "include_statuses": ["approved"],
            }
        ],
        "clips": imported_registry_clips,
    }

    registry_path.parent.mkdir(parents=True, exist_ok=True)
    with registry_path.open("w", encoding="utf-8") as handle:
        json.dump(registry_payload, handle, indent=2)
    print(f"REGISTRY {registry_path}")

    if args.save:
        try:
            bpy.ops.wm.save_mainfile()
        except RuntimeError:
            bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, copy=False)
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
