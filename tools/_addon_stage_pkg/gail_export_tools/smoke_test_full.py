from __future__ import annotations

import importlib.util
from pathlib import Path

import bpy


REPO_ROOT = Path(__file__).resolve().parents[2]
ADDON_PATH = REPO_ROOT / "tools" / "blender-gail-export-addon" / "__init__.py"
ARMATURE_NAME = "VAMP Laurina for G8 Female"
IMPORT_SOURCE = REPO_ROOT / "playcanvas-app" / "assets" / "gail" / "avatar" / "base_face" / "gail_base_avatar.glb"
TEST_ACTION = "addon_nod_smoke_v1"
TEST_EXPORT = REPO_ROOT / "playcanvas-app" / "assets" / "animations" / "_tests" / f"{TEST_ACTION}.glb"


def load_addon_module():
    spec = importlib.util.spec_from_file_location("gail_export_tools_test_full", ADDON_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load add-on module from {ADDON_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def cleanup_temp_export():
    if TEST_EXPORT.exists():
        TEST_EXPORT.unlink()
    test_dir = TEST_EXPORT.parent
    if test_dir.exists() and not any(test_dir.iterdir()):
        test_dir.rmdir()


def main():
    addon = load_addon_module()
    addon.register()
    try:
        scene = bpy.context.scene
        scene.gail_repo_root = ""

        inferred_root = addon.get_repo_root(scene)
        if inferred_root != REPO_ROOT:
            raise RuntimeError(f"Repo root inference failed: expected {REPO_ROOT}, got {inferred_root}")

        scan_result = bpy.ops.gail.scan_scene()
        if "FINISHED" not in scan_result:
            raise RuntimeError(f"Scan operator failed: {scan_result}")
        if scene.gail_armature_name != ARMATURE_NAME:
            raise RuntimeError(f"Unexpected armature from scan: {scene.gail_armature_name}")

        if not IMPORT_SOURCE.exists():
            raise RuntimeError(f"Missing import source: {IMPORT_SOURCE}")
        object_count_before = len(bpy.data.objects)
        scene.gail_import_path = str(IMPORT_SOURCE)
        import_result = bpy.ops.gail.import_glb()
        if "FINISHED" not in import_result:
            raise RuntimeError(f"Import operator failed: {import_result}")
        object_count_after = len(bpy.data.objects)
        if object_count_after <= object_count_before:
            raise RuntimeError("Import operator did not add any objects to the scene")

        scene.gail_armature_name = ARMATURE_NAME
        scene.gail_armature_pick = ARMATURE_NAME
        scene.gail_generator_preset = "nod_small_v1"
        scene.gail_generator_action_name = TEST_ACTION
        scene.gail_generator_save_after_run = False

        generator_result = bpy.ops.gail.run_generator()
        if "FINISHED" not in generator_result:
            raise RuntimeError(f"Generator operator failed: {generator_result}")

        action = bpy.data.actions.get(TEST_ACTION)
        if action is None:
            raise RuntimeError(f"Missing generated action: {TEST_ACTION}")

        scene.gail_clip_name = TEST_ACTION
        scene.gail_clip_frame_start = int(action.frame_range[0])
        scene.gail_clip_frame_end = int(action.frame_range[1])
        scene.gail_clip_runtime_relative_path = f"animations/_tests/{TEST_ACTION}.glb"

        export_result = bpy.ops.gail.export_clip()
        if "FINISHED" not in export_result:
            raise RuntimeError(f"Export operator failed: {export_result}")
        if not TEST_EXPORT.exists():
            raise RuntimeError(f"Missing exported clip: {TEST_EXPORT}")

        print("FULL SMOKE TEST PASSED")
        print(f"Repo root inferred: {inferred_root}")
        print(f"Imported source: {IMPORT_SOURCE}")
        print(f"Generated action: {TEST_ACTION}")
        print(f"Exported clip: {TEST_EXPORT}")
    finally:
        cleanup_temp_export()
        addon.unregister()


if __name__ == "__main__":
    main()
