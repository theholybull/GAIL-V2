import argparse
import json
import re
import sys
from pathlib import Path

import bpy


ACTION_NAME_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*_v[0-9]+$")


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    return parser.parse_args(argv)


def load_manifest(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_collections(manifest, errors):
    required = manifest.get("required_collections", None)
    if required is None:
        return
    for name in required:
        if bpy.data.collections.get(name) is None:
            errors.append(f"Missing collection: {name}")


def validate_armature(manifest, errors):
    armature_name = manifest["armature"]["object_name"]
    armature = bpy.data.objects.get(armature_name)
    if armature is None:
        errors.append(f"Missing armature object: {armature_name}")
        return None
    if armature.type != "ARMATURE":
        errors.append(f"Object is not an armature: {armature_name}")
        return None
    expected_data_name = manifest["armature"]["data_name"]
    if armature.data.name != expected_data_name:
        errors.append(
            f"Armature data mismatch: expected {expected_data_name}, got {armature.data.name}"
        )
    return armature


def validate_registered_actions(manifest, armature, errors):
    registered_names = set()
    for clip in manifest["clips"]:
        clip_name = clip["clip_name"]
        registered_names.add(clip_name)  # all clips, regardless of status
        if not ACTION_NAME_RE.match(clip_name):
            errors.append(f"Invalid clip name in manifest: {clip_name}")
        if clip.get("status") != "approved":
            continue  # only verify approved clips are present in the blend
        action = bpy.data.actions.get(clip_name)
        if action is None:
            errors.append(f"Registered action missing in blend: {clip_name}")
            continue
        if not action.use_fake_user:
            errors.append(f"Action missing fake user: {clip_name}")
        if clip["frame_end"] <= clip["frame_start"]:
            errors.append(f"Invalid frame range for {clip_name}")

    for action in bpy.data.actions:
        # skip import artifacts (src_ prefix) and Blender auto-generated names (contain |)
        if action.name.startswith("src_") or "|" in action.name:
            continue
        if not ACTION_NAME_RE.match(action.name):
            errors.append(f"Action name does not match naming rules: {action.name}")
        if action.name not in registered_names:
            errors.append(f"Unregistered production-looking action: {action.name}")

    if armature and armature.animation_data and armature.animation_data.action:
        active_name = armature.animation_data.action.name
        if "|" not in active_name and not active_name.startswith("src_") and active_name not in registered_names:
            errors.append(f"Active armature action is not registered: {active_name}")


def main():
    args = parse_args()
    manifest = load_manifest(Path(args.manifest))
    errors = []

    validate_collections(manifest, errors)
    armature = validate_armature(manifest, errors)
    validate_registered_actions(manifest, armature, errors)

    if errors:
        print("VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print("VALIDATION OK")


if __name__ == "__main__":
    main()
