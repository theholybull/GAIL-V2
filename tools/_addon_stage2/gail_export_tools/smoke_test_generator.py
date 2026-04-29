from __future__ import annotations

import importlib.util
from pathlib import Path

import bpy


REPO_ROOT = Path(__file__).resolve().parents[2]
ADDON_PATH = REPO_ROOT / "tools" / "blender-gail-export-addon" / "__init__.py"
TEST_ACTION = "addon_nod_smoke_v1"
TEST_EXPORT = REPO_ROOT / "playcanvas-app" / "assets" / "animations" / "_tests" / f"{TEST_ACTION}.glb"


def load_addon_module():
    spec = importlib.util.spec_from_file_location("gail_export_tools_test", ADDON_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load add-on module from {ADDON_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    addon = load_addon_module()
    addon.register()
    try:
        scene = bpy.context.scene
        scene.gail_repo_root = str(REPO_ROOT)
        scene.gail_armature_name = "VAMP Laurina for G8 Female"
        scene.gail_armature_pick = "VAMP Laurina for G8 Female"
        scene.gail_generator_preset = "nod_small_v1"
        scene.gail_generator_action_name = TEST_ACTION
        scene.gail_generator_save_after_run = False

        result = bpy.ops.gail.run_generator()
        if "FINISHED" not in result:
            raise RuntimeError(f"Generator operator failed: {result}")

        action = bpy.data.actions.get(TEST_ACTION)
        if action is None:
            raise RuntimeError(f"Missing generated action: {TEST_ACTION}")

        scene.gail_clip_name = TEST_ACTION
        scene.gail_clip_frame_start = int(action.frame_range[0])
        scene.gail_clip_frame_end = int(action.frame_range[1])
        scene.gail_clip_runtime_relative_path = f"animations/_tests/{TEST_ACTION}.glb"

        result = bpy.ops.gail.export_clip()
        if "FINISHED" not in result:
            raise RuntimeError(f"Export operator failed: {result}")

        if not TEST_EXPORT.exists():
            raise RuntimeError(f"Missing exported test clip: {TEST_EXPORT}")

        print(f"SMOKE TEST PASSED: {TEST_ACTION}")
        print(f"EXPORTED {TEST_EXPORT}")
        TEST_EXPORT.unlink()
        test_dir = TEST_EXPORT.parent
        if test_dir.exists() and not any(test_dir.iterdir()):
            test_dir.rmdir()
        print("CLEANED temporary export")
    finally:
        addon.unregister()


if __name__ == "__main__":
    main()
