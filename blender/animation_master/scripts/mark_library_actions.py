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
    return parser.parse_args(argv)


def load_manifest(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main():
    args = parse_args()
    manifest = load_manifest(Path(args.manifest))
    updated = []

    for clip in manifest["clips"]:
        action = bpy.data.actions.get(clip["clip_name"])
        if action is None:
            print(f"SKIP missing action: {clip['clip_name']}")
            continue

        action.use_fake_user = True
        action["gail_clip_name"] = clip["clip_name"]
        action["gail_category"] = clip["category"]
        action["gail_status"] = clip["status"]
        action["gail_partition"] = clip["partition"]
        action["gail_export_profile"] = clip["export"]["profile"]
        action["gail_export_path"] = clip["export"]["relative_path"]
        updated.append(action.name)

    print(f"UPDATED {len(updated)} actions")
    for name in updated:
        print(f"- {name}")


if __name__ == "__main__":
    main()
