import argparse
import json
import shutil
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
    parser.add_argument("--blend", required=True)
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--addon-dir", required=True)
    parser.add_argument("--armature", default="Victoria 8")
    parser.add_argument("--package-name", default="Gail")
    parser.add_argument("--target-height-m", type=float, default=1.72)
    parser.add_argument("--low-size", type=int, default=512)
    parser.add_argument("--medium-size", type=int, default=2048)
    parser.add_argument("--high-size", type=int, default=4096)
    return parser.parse_args(argv)


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def enable_local_addon(addon_dir: Path):
    scripts_root = Path(bpy.utils.user_resource("SCRIPTS"))
    addons_root = scripts_root / "addons"
    addons_root.mkdir(parents=True, exist_ok=True)
    target = addons_root / "gail_production_workbench"
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(addon_dir, target)
    bpy.ops.preferences.addon_enable(module="gail_production_workbench")


def ensure_armature(name: str):
    arm = bpy.data.objects.get(name)
    if arm is None or arm.type != "ARMATURE":
        raise RuntimeError(f"Missing armature: {name}")
    if arm.animation_data is None:
        arm.animation_data_create()
    return arm


def main():
    args = parse_args()
    blend_path = Path(args.blend)
    output_root = Path(args.output_root)
    report_path = Path(args.report)
    addon_dir = Path(args.addon_dir)

    report = {
        "blend": str(blend_path),
        "output_root": str(output_root),
        "addon_dir": str(addon_dir),
        "armature": args.armature,
        "package_name": args.package_name,
        "steps": {},
        "errors": [],
    }

    try:
        output_root.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.open_mainfile(filepath=str(blend_path))
        enable_local_addon(addon_dir)
        import gail_production_workbench as gpw

        armature = ensure_armature(args.armature)
        scene = bpy.context.scene
        scene.gail_prod.armature = armature
        scene.gail_prod.output_root = str(output_root)
        scene.gail_prod.package_name = args.package_name
        scene.gail_prod.lock_export_scale = True
        scene.gail_prod.export_target_height_m = float(args.target_height_m)
        scene.gail_prod.low_texture_size = int(args.low_size)
        scene.gail_prod.medium_texture_size = int(args.medium_size)
        scene.gail_prod.high_texture_size = int(args.high_size)

        report["steps"]["scan_scene"] = list(bpy.ops.gail_prod.scan_scene())
        report["steps"]["partition_avatar"] = list(bpy.ops.gail_prod.partition_avatar())
        report["steps"]["export_avatar_parts"] = list(bpy.ops.gail_prod.export_avatar_parts())
        report["steps"]["tune_skin_materials"] = list(bpy.ops.gail_prod.tune_skin_materials())
        report["steps"]["export_texture_tiers"] = list(bpy.ops.gail_prod.export_texture_tiers())
        gpw.write_package_manifest(scene.gail_prod, armature, "")
        report["steps"]["write_package_manifest"] = ["FINISHED"]

        report["package_manifest"] = str(output_root / "package_manifest.json")
        report["avatar_package"] = str(output_root / "avatar_package")
        report["texture_tiers"] = {
            "low": int(args.low_size),
            "medium": int(args.medium_size),
            "high": int(args.high_size),
        }
    except Exception as exc:  # pragma: no cover
        report["errors"].append(str(exc))
    finally:
        write_json(report_path, report)

    if report["errors"]:
        raise RuntimeError("; ".join(report["errors"]))


if __name__ == "__main__":
    main()
