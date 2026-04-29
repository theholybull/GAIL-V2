from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import bpy


REPO_ROOT = Path(__file__).resolve().parents[2]
ADDON_PATH = REPO_ROOT / "tools" / "blender-gail-export-addon" / "__init__.py"
ARMATURE_NAME = "VAMP Laurina for G8 Female"
TEST_POSE = "pose_addon_smoke_v1"


def load_addon_module():
    spec = importlib.util.spec_from_file_location("gail_export_tools_test_pose", ADDON_PATH)
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
        scene.gail_pose_name = TEST_POSE
        scene.gail_pose_type = "base_pose"
        scene.gail_pose_status = "review"
        scene.gail_pose_frame = 1
        scene.gail_pose_notes = "addon smoke test pose"
        scene.gail_pose_save_after_capture = False

        capture_result = bpy.ops.gail.capture_pose()
        print("CAPTURE_RESULT", capture_result)
        if "FINISHED" not in capture_result:
            raise RuntimeError(f"Capture pose failed: {capture_result}")

        action = bpy.data.actions.get(TEST_POSE)
        if action is None:
            raise RuntimeError(f"Missing pose action: {TEST_POSE}")
        if action.get("gail_type") != "pose":
            raise RuntimeError("Pose action missing gail_type=pose")

        scene.gail_pose_pick = TEST_POSE
        apply_result = bpy.ops.gail.apply_pose()
        print("APPLY_RESULT", apply_result)
        if "FINISHED" not in apply_result:
            raise RuntimeError(f"Apply pose failed: {apply_result}")

        registry_path = REPO_ROOT / "blender" / "animation_master" / "manifests" / "pose_registry.gail.json"
        payload = json.loads(registry_path.read_text(encoding="utf-8"))
        if TEST_POSE not in (payload.get("pose_actions") or {}):
            raise RuntimeError(f"Pose registry missing {TEST_POSE}")

        print("POSE_LIBRARY_SMOKE_PASSED")
    finally:
        addon.unregister()


if __name__ == "__main__":
    main()
