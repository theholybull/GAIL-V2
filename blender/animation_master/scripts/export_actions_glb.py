import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import bpy


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--profile", required=True)
    parser.add_argument("--include-review", action="store_true")
    parser.add_argument("--report-dir")
    return parser.parse_args(argv)


def load_manifest(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def get_profile(manifest: dict, profile_name: str) -> dict:
    for profile in manifest["export_profiles"]:
        if profile["name"] == profile_name:
            return profile
    raise ValueError(f"Unknown export profile: {profile_name}")


def ensure_staging_selection(collection_name: str) -> None:
    collection = bpy.data.collections.get(collection_name)
    if collection is None:
        return

    bpy.ops.object.select_all(action="DESELECT")
    objects = list(collection.all_objects)
    if not objects:
        raise RuntimeError(f"Export collection is empty: {collection_name}")
    for obj in objects:
        obj.select_set(True)


def select_armature_export_set(armature_name: str, collection_name: str) -> str:
    collection = bpy.data.collections.get(collection_name)
    if collection is not None:
        ensure_staging_selection(collection_name)
        return f"collection:{collection_name}"

    # Fallback: select only the armature for animation-only export.
    # Previous behaviour selected ALL skinned meshes which bloated GLBs to 500MB+.
    armature = bpy.data.objects.get(armature_name)
    if armature is None or armature.type != "ARMATURE":
        raise RuntimeError(f"Missing armature: {armature_name}")

    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature

    return f"armature_only:{armature_name}"


def set_active_action(armature_name: str, action_name: str, frame_start: int, frame_end: int) -> None:
    armature = bpy.data.objects.get(armature_name)
    if armature is None or armature.type != "ARMATURE":
        raise RuntimeError(f"Missing armature: {armature_name}")

    action = bpy.data.actions.get(action_name)
    if action is None:
        raise RuntimeError(f"Missing action: {action_name}")
    if not action.use_fake_user:
        raise RuntimeError(f"Action must have fake user before export: {action_name}")

    if armature.animation_data is None:
        armature.animation_data_create()
    armature.animation_data.action = action
    bpy.context.scene.frame_start = frame_start
    bpy.context.scene.frame_end = frame_end
    bpy.context.view_layer.objects.active = armature


def export_glb(filepath: Path, animation_only: bool = True) -> None:
    filepath.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_nla_strips=False,
        export_animation_mode="ACTIVE_ACTIONS",
        export_force_sampling=True,
        export_skins=not animation_only,
        export_morph=not animation_only,
        export_morph_animation=False,
        export_yup=True,
    )


def main():
    args = parse_args()
    manifest = load_manifest(Path(args.manifest))
    profile = get_profile(manifest, args.profile)
    export_root = Path(profile["path_root"])
    report_dir = Path(args.report_dir) if args.report_dir else export_root.parents[1] / "reports"
    armature_name = manifest["armature"]["object_name"]
    allowed_statuses = set(profile.get("include_statuses", []))
    if args.include_review:
        allowed_statuses.add("review")

    exported = []
    for clip in manifest["clips"]:
        if clip["status"] not in allowed_statuses:
            continue
        if clip["partition"] != "body":
            continue

        target_path = export_root / clip["export"]["relative_path"]
        set_active_action(
            armature_name=armature_name,
            action_name=clip["clip_name"],
            frame_start=clip["frame_start"],
            frame_end=clip["frame_end"],
        )
        selection_mode = select_armature_export_set(
            armature_name=armature_name,
            collection_name=clip["export"]["collection"],
        )
        # Animation-only when using armature fallback (no staging collection)
        anim_only = selection_mode.startswith("armature_only:")
        export_glb(target_path, animation_only=anim_only)
        exported.append(
            {
                "clip_name": clip["clip_name"],
                "status": clip["status"],
                "target_path": str(target_path),
                "selection_mode": selection_mode,
            }
        )

    print(f"EXPORTED {len(exported)} clips")
    for item in exported:
        print(f"- {item['target_path']}")

    report_dir.mkdir(parents=True, exist_ok=True)
    report_path = report_dir / (
        f"export_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    report = {
        "profile": args.profile,
        "armature": armature_name,
        "include_review": args.include_review,
        "exported": exported,
    }
    with report_path.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(f"REPORT {report_path}")


if __name__ == "__main__":
    main()
