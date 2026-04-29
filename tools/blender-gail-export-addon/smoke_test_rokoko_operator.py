import importlib.util
import pathlib
import sys

import bpy


REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
ADDON_INIT = REPO_ROOT / "tools" / "blender-gail-export-addon" / "__init__.py"
TEST_FBX = REPO_ROOT / "blender" / "animation_master" / "source" / "imports" / "raw" / "Idle.fbx"
TARGET_ARMATURE = "VAMP Laurina for G8 Female"
TEST_ACTION = "rokoko_idle_operator_test_v1"


def main():
    spec = importlib.util.spec_from_file_location(
        "gail_export_tools_test",
        ADDON_INIT,
        submodule_search_locations=[str(ADDON_INIT.parent)],
    )
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load add-on: {ADDON_INIT}")

    module = importlib.util.module_from_spec(spec)
    sys.modules["gail_export_tools_test"] = module
    spec.loader.exec_module(module)
    module.register()

    try:
        scene = bpy.context.scene
        scene.gail_repo_root = str(REPO_ROOT)
        scene.gail_armature_name = TARGET_ARMATURE
        scene.gail_rokoko_fbx_path = str(TEST_FBX)
        scene.gail_rokoko_clip_name = TEST_ACTION
        scene.gail_rokoko_category = "idle"
        scene.gail_rokoko_use_pose = "CURRENT"
        scene.gail_rokoko_auto_scale = False
        scene.gail_rokoko_keep_imported = False
        scene.gail_rokoko_save_after_run = False

        result = bpy.ops.gail.run_rokoko_retarget()
        print("ADDON_OPERATOR_RESULT", result)
        if bpy.data.actions.get(TEST_ACTION) is None:
            raise RuntimeError(f"Expected baked action not found: {TEST_ACTION}")
        print("ACTION_EXISTS", TEST_ACTION)
    finally:
        module.unregister()


if __name__ == "__main__":
    main()
