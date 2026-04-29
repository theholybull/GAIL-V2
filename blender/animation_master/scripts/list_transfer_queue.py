import argparse
import json
import sys
from pathlib import Path


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--include-review", action="store_true")
    return parser.parse_args(argv)


def main():
    args = parse_args()
    manifest_path = Path(args.manifest)
    with manifest_path.open("r", encoding="utf-8") as handle:
        manifest = json.load(handle)

    allowed_statuses = {"approved"}
    if args.include_review:
        allowed_statuses.add("review")

    queued = []
    for item in manifest["transfers"]:
        if not item.get("approved_for_master", False):
            continue
        if item["status"] not in allowed_statuses:
            continue
        queued.append(item)

    print(f"TRANSFER QUEUE {len(queued)}")
    for item in queued:
        print(
            f"- {item['clip_name']} | {item['status']} | {item['body_action']} | {item['source_file']}"
        )


if __name__ == "__main__":
    main()
