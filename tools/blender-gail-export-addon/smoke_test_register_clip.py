from __future__ import annotations

import importlib.util
from pathlib import Path

import bpy


REPO_ROOT = Path(__file__).resolve().parents[2]
ADDON_PATH = REPO_ROOT / "tools" / "blender-gail-export-addon" / "__init__.py"
ARMATURE_NAME = "VAMP Laurina for G8 Female"
TEST_ACTION = "addon_register_clip_smoke_v1"


def load_addon_module():
    spec = importlib.util.spec_from_file_location("gail_export_tools_test_register", ADDON_PATH)
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
        scene.gail_armature_name = ARMATURE_NAME
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
        scene.gail_clip_display_name = TEST_ACTION
        scene.gail_clip_category = "idle"
        scene.gail_clip_status = "review"
        scene.gail_clip_version = 1
        scene.gail_clip_frame_start = int(action.frame_range[0])
        scene.gail_clip_frame_end = int(action.frame_range[1])
        scene.gail_clip_loop = True
        scene.gail_register_clip_as_runtime_asset = True
        scene.gail_clip_runtime_relative_path = f"animations/_tests/{TEST_ACTION}.glb"

        register_result = bpy.ops.gail.register_clip()
        print("REGISTER_RESULT", register_result)
        if "FINISHED" not in register_result:
            raise RuntimeError(f"Register operator failed: {register_result}")

        print("REGISTER_CLIP_SMOKE_PASSED")
    finally:
        addon.unregister()


if __name__ == "__main__":
    main()
