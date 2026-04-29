import argparse
import json
import shutil
import sys
import time
from pathlib import Path

import bpy
import mathutils


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
    return parser.parse_args(argv)


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def clear_directory_contents(path: Path):
    path.mkdir(parents=True, exist_ok=True)
    for child in path.iterdir():
        if child.is_dir():
            shutil.rmtree(child, ignore_errors=False)
        else:
            child.unlink()


def ensure_directory_with_retry(path: Path, attempts: int = 10, delay: float = 0.5):
    last_error = None
    for _ in range(attempts):
        try:
            path.mkdir(parents=True, exist_ok=True)
            return
        except PermissionError as exc:
            last_error = exc
            time.sleep(delay)
    if last_error is not None:
        raise last_error


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


def set_test_pose(armature):
    scene = bpy.context.scene
    scene.frame_set(1)
    left = armature.pose.bones.get("lShldrBend")
    right = armature.pose.bones.get("rShldrBend")
    head = armature.pose.bones.get("head")
    hip = armature.pose.bones.get("hip")
    for bone in (left, right, head, hip):
        if bone:
            bone.rotation_mode = "XYZ"
    if left:
        left.rotation_euler[0] = -0.45
        left.rotation_euler[2] = 0.55
    if right:
        right.rotation_euler[0] = 0.35
        right.rotation_euler[2] = -0.48
    if head:
        head.rotation_euler[1] = 0.18
    if hip:
        hip.location[0] = 0.08
        hip.rotation_euler[2] = 0.12
    bpy.context.view_layer.update()


def mesh_bounds_world(armature):
    min_corner = None
    max_corner = None
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        if obj.find_armature() != armature:
            continue
        for corner in obj.bound_box:
            world = obj.matrix_world @ mathutils.Vector(corner)
            if min_corner is None:
                min_corner = world.copy()
                max_corner = world.copy()
            else:
                min_corner.x = min(min_corner.x, world.x)
                min_corner.y = min(min_corner.y, world.y)
                min_corner.z = min(min_corner.z, world.z)
                max_corner.x = max(max_corner.x, world.x)
                max_corner.y = max(max_corner.y, world.y)
                max_corner.z = max(max_corner.z, world.z)
    return min_corner, max_corner


def frame_camera_to_armature(scene, cam, armature):
    min_corner, max_corner = mesh_bounds_world(armature)
    if min_corner is None or max_corner is None:
        cam.location = (2.9, -5.8, 1.8)
        cam.rotation_euler = (1.25, 0.0, 0.52)
        return

    center = (min_corner + max_corner) * 0.5
    size = max_corner - min_corner
    height = max(size.z, 1.7)
    width = max(size.x, 0.8)

    cam.data.lens = 45
    distance = max(height * 2.2, width * 2.6, 3.8)
    cam.location = (
        center.x + distance * 0.52,
        center.y - distance * 1.08,
        center.z + height * 0.22,
    )
    direction = center - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def render_action_proof(output_path: Path, action_name: str, armature_name: str, frame: int):
    armature = bpy.data.objects.get(armature_name)
    if armature is None:
        raise RuntimeError(f"Missing armature {armature_name}")
    action = bpy.data.actions.get(action_name)
    if action is None:
        raise RuntimeError(f"Missing action {action_name}")
    armature.animation_data.action = action
    scene = bpy.context.scene
    available_engines = {item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    if "BLENDER_EEVEE_NEXT" in available_engines:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    elif "BLENDER_EEVEE" in available_engines:
        scene.render.engine = "BLENDER_EEVEE"
    else:
        scene.render.engine = next(iter(available_engines))
    scene.render.filepath = str(output_path)
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.frame_set(frame)
    bpy.context.view_layer.update()

    if bpy.data.cameras.get("GPW_TestCam") is None:
        cam_data = bpy.data.cameras.new("GPW_TestCam")
        cam = bpy.data.objects.new("GPW_TestCam", cam_data)
        bpy.context.scene.collection.objects.link(cam)
    else:
        cam = bpy.data.objects["GPW_TestCam"]

    frame_camera_to_armature(scene, cam, armature)
    scene.camera = cam

    if bpy.data.lights.get("GPW_TestLight") is None:
        light_data = bpy.data.lights.new("GPW_TestLight", type="SUN")
        light = bpy.data.objects.new("GPW_TestLight", light_data)
        bpy.context.scene.collection.objects.link(light)
    else:
        light = bpy.data.objects["GPW_TestLight"]
    light.rotation_euler = (0.7, 0.0, 0.6)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(write_still=True)


def continuity_report(armature, action_name: str, frame_start: int, frame_end: int):
    action = bpy.data.actions.get(action_name)
    if action is None:
        raise RuntimeError(f"Missing action {action_name}")
    armature.animation_data.action = action
    scene = bpy.context.scene
    scene.frame_set(frame_start)
    bpy.context.view_layer.update()
    root = armature.pose.bones.get("hip") or armature.pose.bones[0]
    start_loc = tuple(root.location)
    start_rot = tuple(root.rotation_euler)
    scene.frame_set(frame_end)
    bpy.context.view_layer.update()
    end_loc = tuple(root.location)
    end_rot = tuple(root.rotation_euler)
    return {
        "action": action_name,
        "start_frame": frame_start,
        "end_frame": frame_end,
        "start_location": start_loc,
        "end_location": end_loc,
        "delta_location": [end_loc[i] - start_loc[i] for i in range(3)],
        "start_rotation_euler": start_rot,
        "end_rotation_euler": end_rot,
        "delta_rotation_euler": [end_rot[i] - start_rot[i] for i in range(3)],
    }


def main():
    args = parse_args()
    blend_path = Path(args.blend)
    output_root = Path(args.output_root)
    report_path = Path(args.report)
    addon_dir = Path(args.addon_dir)

    ensure_directory_with_retry(output_root)
    package_root = output_root / "workbench_outputs"
    clear_directory_contents(package_root)

    bpy.ops.wm.open_mainfile(filepath=str(blend_path))
    enable_local_addon(addon_dir)

    import gail_production_workbench as gpw

    armature = ensure_armature(args.armature)
    scene = bpy.context.scene
    scene.gail_prod.armature = armature
    scene.gail_prod.output_root = str(package_root)
    scene.gail_prod.start_pose_action = "pose_test_start_v1"
    scene.gail_prod.mid_pose_action = "pose_test_mid_v1"
    scene.gail_prod.end_pose_action = "pose_test_end_v1"
    scene.gail_prod.loop_action_name = "loop_test_v1"
    scene.gail_prod.frame_start = 1
    scene.gail_prod.frame_mid = 12
    scene.gail_prod.frame_end = 24
    scene.gail_prod.skin_roughness = 0.62
    scene.gail_prod.skin_specular = 0.28
    scene.gail_prod.skin_subsurface = 0.06
    scene.gail_prod.flat_base_color = (0.67, 0.66, 0.64)
    scene.gail_prod.low_texture_size = 128
    scene.gail_prod.medium_texture_size = 256
    scene.gail_prod.high_texture_size = 512
    scene.gail_prod.package_name = "animation_builder_test_package"

    report = {
        "blend": str(blend_path),
        "output_root": str(output_root),
        "package_root": str(package_root),
        "armature": armature.name,
        "functions": {},
        "errors": [],
    }

    try:
        bpy.context.view_layer.objects.active = armature
        bpy.ops.object.mode_set(mode="POSE")
    except Exception:
        pass

    try:
        report["functions"]["scan_scene"] = list(bpy.ops.gail_prod.scan_scene())

        set_test_pose(armature)
        report["functions"]["capture_start_pose"] = list(
            bpy.ops.gail_prod.capture_pose_action(action_name="pose_test_start_v1", frame=1)
        )

        set_test_pose(armature)
        armature.pose.bones["head"].rotation_euler[1] = -0.15
        bpy.context.view_layer.update()
        report["functions"]["capture_mid_pose"] = list(
            bpy.ops.gail_prod.capture_pose_action(action_name="pose_test_mid_v1", frame=1)
        )

        set_test_pose(armature)
        armature.pose.bones["hip"].location[0] = 0.0
        armature.pose.bones["head"].rotation_euler[1] = 0.0
        bpy.context.view_layer.update()
        report["functions"]["capture_end_pose"] = list(
            bpy.ops.gail_prod.capture_pose_action(action_name="pose_test_end_v1", frame=1)
        )

        scene.gail_prod.start_pose_pick = "pose_test_start_v1"
        scene.gail_prod.mid_pose_pick = "pose_test_mid_v1"
        scene.gail_prod.end_pose_pick = "pose_test_end_v1"
        report["functions"]["use_pose_picks"] = list(bpy.ops.gail_prod.use_picks())

        report["functions"]["build_loop_action"] = list(bpy.ops.gail_prod.build_loop_action())

        scene.gail_prod.blend_action_a = "loop_test_v1"
        scene.gail_prod.blend_action_a_pick = "loop_test_v1"
        scene.gail_prod.loop_action_name = "loop_test_b_v1"
        scene.gail_prod.start_pose_action = "pose_test_end_v1"
        scene.gail_prod.mid_pose_action = "pose_test_mid_v1"
        scene.gail_prod.end_pose_action = "pose_test_start_v1"
        report["functions"]["build_loop_action_b"] = list(bpy.ops.gail_prod.build_loop_action())

        scene.gail_prod.blend_action_a = "loop_test_v1"
        scene.gail_prod.blend_action_b = "loop_test_b_v1"
        scene.gail_prod.blend_action_a_pick = "loop_test_v1"
        scene.gail_prod.blend_action_b_pick = "loop_test_b_v1"
        scene.gail_prod.blended_action_name = "blend_test_v1"
        scene.gail_prod.blend_factor = 0.5
        report["functions"]["blend_actions"] = list(bpy.ops.gail_prod.blend_actions())

        ensure_anim = armature.animation_data
        ensure_anim.action = bpy.data.actions.get("blend_test_v1")
        report["functions"]["anchor_active_action"] = list(bpy.ops.gail_prod.anchor_active_action())
        ensure_anim.action = bpy.data.actions.get("blend_test_v1")
        report["functions"]["normalize_root_loop"] = list(bpy.ops.gail_prod.normalize_root_loop())

        report["functions"]["partition_avatar"] = list(bpy.ops.gail_prod.partition_avatar())
        report["functions"]["export_avatar_parts"] = list(bpy.ops.gail_prod.export_avatar_parts())

        report["functions"]["tune_skin_materials"] = list(bpy.ops.gail_prod.tune_skin_materials())

        report["functions"]["export_texture_tiers"] = list(bpy.ops.gail_prod.export_texture_tiers())

        scene.gail_prod.loop_action_name = "guided_loop_test_v1"
        scene.gail_prod.blended_action_name = "guided_blend_test_v1"
        scene.gail_prod.start_pose_action = "pose_test_start_v1"
        scene.gail_prod.mid_pose_action = "pose_test_mid_v1"
        scene.gail_prod.end_pose_action = "pose_test_end_v1"
        scene.gail_prod.start_pose_pick = "pose_test_start_v1"
        scene.gail_prod.mid_pose_pick = "pose_test_mid_v1"
        scene.gail_prod.end_pose_pick = "pose_test_end_v1"
        scene.gail_prod.blend_action_a = "loop_test_v1"
        scene.gail_prod.blend_action_b = "loop_test_b_v1"
        scene.gail_prod.blend_action_a_pick = "loop_test_v1"
        scene.gail_prod.blend_action_b_pick = "loop_test_b_v1"
        report["functions"]["guided_build_animation"] = list(bpy.ops.gail_prod.guided_build_animation())
        report["functions"]["guided_package_avatar"] = list(bpy.ops.gail_prod.guided_package_avatar())
        report["functions"]["guided_run_all"] = list(bpy.ops.gail_prod.guided_run_all())

        continuity_path = output_root / "workbench_outputs" / "continuity_report.json"
        continuity = continuity_report(armature, "guided_blend_test_v1", scene.gail_prod.frame_start, scene.gail_prod.frame_end)
        write_json(continuity_path, continuity)

        proof_dir = output_root / "workbench_outputs" / "proof_renders"
        render_action_proof(proof_dir / "blend_test_start.png", "guided_blend_test_v1", armature.name, scene.gail_prod.frame_start)
        render_action_proof(proof_dir / "blend_test_mid.png", "guided_blend_test_v1", armature.name, scene.gail_prod.frame_mid)
        render_action_proof(proof_dir / "blend_test_end.png", "guided_blend_test_v1", armature.name, scene.gail_prod.frame_end)

        ensure_anim.action = bpy.data.actions.get("guided_blend_test_v1")
        output_blend = output_root / "animation_builder_test_output.blend"
        bpy.ops.wm.save_as_mainfile(filepath=str(output_blend), copy=False)
        report["output_blend"] = str(output_blend)

        loop_action = bpy.data.actions.get("guided_blend_test_v1")
        if loop_action:
            report["loop_action"] = {
                "name": loop_action.name,
                "frame_range": [float(loop_action.frame_range[0]), float(loop_action.frame_range[1])],
                "fcurve_count": len(loop_action.fcurves),
            }

        partition_manifest = package_root / "avatar_package" / "avatar_partition_manifest.json"
        texture_manifest = package_root / "avatar_package" / "textures" / "texture_manifest.json"
        report["artifacts"] = {
            "partition_manifest": str(partition_manifest) if partition_manifest.exists() else None,
            "avatar_parts_manifest": str(package_root / "avatar_package" / "parts" / "avatar_parts_manifest.json"),
            "texture_manifest": str(texture_manifest) if texture_manifest.exists() else None,
            "flat_texture": str(package_root / "avatar_package" / "textures" / "base_avatar_flat.png"),
            "continuity_report": str(continuity_path),
            "proof_dir": str(proof_dir),
            "package_manifest": str(package_root / "package_manifest.json"),
        }
    except Exception as exc:
        report["errors"].append(repr(exc))

    write_json(report_path, report)
    print(json.dumps(report, indent=2))
    sys.stdout.flush()
    try:
        bpy.ops.wm.quit_blender()
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
