from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import bpy


REPO_ROOT = Path(__file__).resolve().parents[2]
ADDON_PATH = REPO_ROOT / "tools" / "blender-gail-export-addon" / "__init__.py"
ARMATURE_NAME = "VAMP Laurina for G8 Female"
START_POSE = "pose_loop_start_smoke_v1"
MID_POSE = "pose_loop_mid_smoke_v1"
LOOP_ACTION = "loop_pose_smoke_v1"


def load_addon_module():
    spec = importlib.util.spec_from_file_location("gail_export_tools_test_pose_loop", ADDON_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load add-on module from {ADDON_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def remove_registry_entries(*names: str):
    registry_path = REPO_ROOT / "blender" / "animation_master" / "manifests" / "pose_registry.gail.json"
    payload = json.loads(registry_path.read_text(encoding="utf-8"))
    changed = False
    for name in names:
        if name in (payload.get("pose_actions") or {}):
            del payload["pose_actions"][name]
            changed = True
    if changed:
        registry_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def main():
    addon = load_addon_module()
    addon.register()
    try:
        scene = bpy.context.scene
        scene.gail_repo_root = str(REPO_ROOT)
        scene.gail_armature_name = ARMATURE_NAME
        armature = bpy.data.objects[ARMATURE_NAME]

        scene.gail_pose_name = START_POSE
        scene.gail_pose_family = "neutral_idle"
        scene.gail_pose_role = "loop_anchor"
        capture_result = bpy.ops.gail.capture_pose()
        if "FINISHED" not in capture_result:
            raise RuntimeError(f"Start pose capture failed: {capture_result}")

        head = armature.pose.bones["head"]
        if head.rotation_mode != "XYZ":
            head.rotation_mode = "XYZ"
        head.rotation_euler.x += 0.12

        scene.gail_pose_name = MID_POSE
        scene.gail_pose_role = "loop_midpoint"
        scene.gail_pose_loop_usage = "short_loop"
        capture_result = bpy.ops.gail.capture_pose()
        if "FINISHED" not in capture_result:
            raise RuntimeError(f"Mid pose capture failed: {capture_result}")

        scene.gail_pose_pick = START_POSE
        apply_result = bpy.ops.gail.apply_pose()
        if "FINISHED" not in apply_result:
            raise RuntimeError(f"Apply start pose failed: {apply_result}")

        scene.gail_loop_action_name = LOOP_ACTION
        scene.gail_loop_category = "idle"
        scene.gail_loop_start_pose = START_POSE
        scene.gail_loop_mid_pose = MID_POSE
        scene.gail_loop_end_pose = START_POSE
        scene.gail_loop_frame_start = 1
        scene.gail_loop_frame_mid = 24
        scene.gail_loop_frame_end = 48

        loop_result = bpy.ops.gail.generate_pose_loop()
        if "FINISHED" not in loop_result:
            raise RuntimeError(f"Pose loop generation failed: {loop_result}")

        action = bpy.data.actions.get(LOOP_ACTION)
        if action is None:
            raise RuntimeError(f"Missing loop action: {LOOP_ACTION}")
        if action.get("gail_start_pose") != START_POSE:
            raise RuntimeError("Loop action missing expected start pose")
        if action.get("gail_mid_pose") != MID_POSE:
            raise RuntimeError("Loop action missing expected midpoint pose")
        if action.get("gail_end_pose") != START_POSE:
            raise RuntimeError("Loop action missing expected end pose")

        print("POSE_LOOP_SMOKE_PASSED")
    finally:
        remove_registry_entries(START_POSE, MID_POSE)
        addon.unregister()


if __name__ == "__main__":
    main()
