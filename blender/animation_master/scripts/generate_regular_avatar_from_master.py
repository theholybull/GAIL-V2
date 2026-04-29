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
    parser.add_argument("--report-path")
    return parser.parse_args(argv)


def load_manifest(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def remove_collection(name: str, removed: list[str]) -> None:
    collection = bpy.data.collections.get(name)
    if collection is None:
        return
    bpy.data.collections.remove(collection, do_unlink=True)
    removed.append(f"collection:{name}")


def remove_object(name: str, removed: list[str]) -> None:
    obj = bpy.data.objects.get(name)
    if obj is None:
        return
    bpy.data.objects.remove(obj, do_unlink=True)
    removed.append(f"object:{name}")


def should_keep_shape_key(name: str, rules: dict) -> bool:
    if name in rules.get("keep_exact", []):
        return True
    suffix = name.split("__", 1)[1] if "__" in name else name
    if suffix in rules.get("keep_suffixes", []):
        return True
    for prefix in rules.get("keep_prefixes", []):
        if name.startswith(prefix):
            return True
    return False


def prune_shape_keys(rules: dict, removed: list[str]) -> None:
    for obj in bpy.data.objects:
        if obj.type != "MESH" or obj.data.shape_keys is None:
            continue

        if bpy.context.object is not None and bpy.context.object.mode != "OBJECT":
            bpy.ops.object.mode_set(mode="OBJECT")
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        key_blocks = obj.data.shape_keys.key_blocks
        removable_names = [
            block.name
            for block in key_blocks
            if block.name != "Basis" and not should_keep_shape_key(block.name, rules)
        ]

        for key_name in removable_names:
            obj.active_shape_key_index = key_blocks.find(key_name)
            bpy.ops.object.shape_key_remove(all=False)
            removed.append(f"shape_key:{obj.name}:{key_name}")
        obj.select_set(False)


def purge_orphans() -> None:
    for _ in range(3):
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)


def main():
    args = parse_args()
    manifest_path = Path(args.manifest)
    manifest = load_manifest(manifest_path)

    source_path = Path(manifest["source_master_file"]).resolve(strict=False)
    output_path = Path(manifest["output_regular_file"]).resolve(strict=False)
    current_path = Path(bpy.data.filepath).resolve(strict=False)
    if current_path != source_path:
        raise RuntimeError(
            f"Open blend does not match manifest source_master_file: open={current_path} expected={source_path}"
        )

    removed = []

    for collection_name in manifest.get("collections_to_remove", []):
        remove_collection(collection_name, removed)

    for object_name in manifest.get("objects_to_remove", []):
        remove_object(object_name, removed)

    prune_shape_keys(manifest["shape_key_rules"], removed)
    purge_orphans()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(output_path), copy=True)

    report = {
        "source_master_file": str(source_path),
        "output_regular_file": str(output_path),
        "removed": removed,
        "armature_object": manifest["armature_object"],
    }

    report_path = (
        Path(args.report_path)
        if args.report_path
        else manifest_path.parent.parent / "exports" / "reports" / "regular_avatar_build_report.json"
    )
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)

    print(f"GENERATED {output_path}")
    print(f"REPORT {report_path}")
    print(f"REMOVED {len(removed)} items")


if __name__ == "__main__":
    main()
