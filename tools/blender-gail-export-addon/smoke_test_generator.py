from __future__ import annotations

import importlib.util
from pathlib import Path

import bpy


REPO_ROOT = Path(__file__).resolve().parents[2]
ADDON_PATH = REPO_ROOT / "tools" / "blender-gail-export-addon" / "__init__.py"
TEST_ACTION = "addon_nod_smoke_v1"


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
        if action.get("gail_base_pose_action") != "pose_idle_confident_v1":
            raise RuntimeError("Generated nod action missing expected base pose anchor")
        if not action.get("gail_tag_body_grouped_motion"):
            raise RuntimeError("Generated nod action missing grouped-motion tag")

        print(f"SMOKE TEST PASSED: {TEST_ACTION}")
    finally:
        addon.unregister()


if __name__ == "__main__":
    main()
