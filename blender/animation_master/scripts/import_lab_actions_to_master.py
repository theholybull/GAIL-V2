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
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--include-review", action="store_true")
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def load_manifest(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def append_action_from_lab(lab_file: Path, action_name: str) -> None:
    if bpy.data.actions.get(action_name) is not None:
        return

    with bpy.data.libraries.load(str(lab_file), link=False) as (data_from, data_to):
        if action_name not in data_from.actions:
            print(f"SKIP missing action in source file: {action_name}")
            return
        data_to.actions = [action_name]


def main():
    args = parse_args()
    manifest = load_manifest(Path(args.manifest))
    lab_file = Path(manifest["lab_file"])
    allowed_statuses = {"approved"}
    if args.include_review:
        allowed_statuses.add("review")

    imported = []
    for item in manifest["transfers"]:
        if not item.get("approved_for_master", False):
            continue
        if item["status"] not in allowed_statuses:
            continue

        body_action = item.get("body_action", "")
        if body_action:
            append_action_from_lab(lab_file, body_action)
            action = bpy.data.actions.get(body_action)
            if action is not None:
                action.use_fake_user = True
                action["gail_clip_name"] = item["clip_name"]
                action["gail_transfer_source"] = str(lab_file)
                action["gail_transfer_status"] = item["status"]
                imported.append(body_action)

    print(f"IMPORTED {len(imported)} actions")
    for name in imported:
        print(f"- {name}")
    if args.save:
        bpy.ops.wm.save_mainfile()
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
