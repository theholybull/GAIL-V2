import argparse
import bmesh
import json
import sys
import traceback
from pathlib import Path

import bpy
import mathutils
import numpy as np


def parse_args() -> argparse.Namespace:
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    return parser.parse_args(argv)


def read_json(path: Path):
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def ensure_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, obj) -> None:
    ensure_dir(path)
    path.write_text(json.dumps(obj, indent=2), encoding="utf-8")


def ensure_addon_registered(addon_root_parent: Path):
    if not addon_root_parent.exists():
        raise FileNotFoundError(f"Missing add-on root: {addon_root_parent}")

    addon_root_parent_str = str(addon_root_parent)
    if addon_root_parent_str not in sys.path:
        sys.path.insert(0, addon_root_parent_str)

    import animoxtend

    try:
        animoxtend.register()
    except Exception as exc:
        if "already registered" not in repr(exc).lower():
            raise

    return animoxtend


def find_armature(name: str):
    obj = bpy.data.objects.get(name)
    if obj and obj.type == "ARMATURE":
        return obj
    return None


def find_or_create_buffer_human(scene, expected_name: str):
    armature = find_armature(expected_name)
    if armature is not None:
        return armature

    bpy.ops.object.add_buffer_human()
    armature = find_armature(expected_name)
    if armature is not None:
        return armature

    for obj in bpy.data.objects:
        if obj.type == "ARMATURE" and obj.name.lower().startswith(expected_name.lower()):
            return obj

    raise RuntimeError(f"Could not find or create source armature '{expected_name}'")


def apply_target_mapping(scene, target_armature, mapping_path: Path) -> None:
    mapping = read_json(mapping_path)
    target_bones = {bone.name for bone in target_armature.data.bones}
    scene.target_bone_definition_list.clear()
    for standard_name, bone_name in mapping.items():
        item = scene.target_bone_definition_list.add()
        item.standard_bone_name = standard_name
        item.bone_name = bone_name if bone_name in target_bones else ""


def configure_scene(scene, source_armature, target_armature, target_mapping_path: Path) -> str:
    from animoxtend.modules.retarget.operators import check_src_mapping_valid, check_tgt_mapping_valid
    from animoxtend.modules.retarget.retarget_functions.constants import STANDARD_ROOT

    scene.source_arm = source_armature
    scene.source_arm_name = source_armature.name
    scene.target_arm = target_armature
    scene.target_arm_name = target_armature.name
    scene.automatic_scale = True
    scene.optimize_mult_level_spines = False
    scene.keep_target_place = True

    bpy.ops.animoxtend.build_source_bone_list()
    apply_target_mapping(scene, target_armature, target_mapping_path)

    check_src_mapping_valid(None, bpy.context)
    check_tgt_mapping_valid(None, bpy.context)

    if not bool(scene.src_root_valid_status) or scene.src_check_mapping_result:
        raise RuntimeError(f"Source mapping invalid: {scene.src_check_mapping_result}")
    if not bool(scene.tgt_root_valid_status) or scene.tgt_check_mapping_result:
        raise RuntimeError(f"Target mapping invalid: {scene.tgt_check_mapping_result}")

    for item in scene.source_bone_definition_list:
        if item.standard_bone_name == STANDARD_ROOT and item.bone_name:
            return item.bone_name

    raise RuntimeError("Could not resolve source root bone from source mapping")


def load_npz_dict(npz_path: Path) -> dict:
    with np.load(npz_path, allow_pickle=True) as npz_file:
        return {name: npz_file[name].copy() for name in npz_file.files}


def set_frame_range_from_action(action) -> tuple[int, int]:
    frame_start = int(action.frame_range[0])
    frame_end = int(action.frame_range[1])
    bpy.context.scene.frame_start = frame_start
    bpy.context.scene.frame_end = frame_end
    bpy.context.scene.frame_set(frame_start)
    return frame_start, frame_end


def load_source_motion(source_armature, npz_path: Path, action_name: str, source_root_name: str) -> tuple[int, int]:
    from animoxtend.modules.motion.motion_functions.motion_utils import load_npz

    npz_dict = load_npz_dict(npz_path)
    load_npz(npz_dict, source_armature, source_root_name)

    if source_armature.animation_data is None or source_armature.animation_data.action is None:
        raise RuntimeError(f"Source armature has no action after loading {npz_path}")

    source_armature.animation_data.action.name = f"src_{action_name}"
    return set_frame_range_from_action(source_armature.animation_data.action)


def retarget_to_target(scene, source_armature, target_armature, api_key: str, server_host: str, clip_name: str) -> tuple[int, int]:
    from animoxtend.modules.retarget.operators import single_retarget

    result, message = single_retarget(
        bpy.context,
        source_armature,
        target_armature,
        True,
        api_key=api_key,
        server_host=server_host,
    )
    if result not in (0, 2):
        raise RuntimeError(message or "Retarget failed")

    if target_armature.animation_data is None or target_armature.animation_data.action is None:
        raise RuntimeError(f"Target armature has no action after retarget for {clip_name}")

    target_armature.animation_data.action.name = clip_name
    return set_frame_range_from_action(target_armature.animation_data.action)


PROXY_PREFIX = "AXPreviewProxy_"
PROXY_MATERIAL = "AXPreviewProxyMaterial"


def get_proxy_material():
    material = bpy.data.materials.get(PROXY_MATERIAL)
    if material is None:
        material = bpy.data.materials.new(PROXY_MATERIAL)
        material.use_nodes = True

    material.diffuse_color = (0.72, 0.74, 0.76, 1.0)
    if material.node_tree is not None:
        principled = material.node_tree.nodes.get("Principled BSDF")
        if principled is not None:
            if "Base Color" in principled.inputs:
                principled.inputs["Base Color"].default_value = (0.72, 0.74, 0.76, 1.0)
            if "Roughness" in principled.inputs:
                principled.inputs["Roughness"].default_value = 0.88
    return material


def remove_existing_proxy_objects() -> None:
    for obj in list(bpy.data.objects):
        if not obj.name.startswith(PROXY_PREFIX):
            continue
        mesh = obj.data if obj.type == "MESH" else None
        bpy.data.objects.remove(obj, do_unlink=True)
        if mesh is not None and mesh.users == 0:
            bpy.data.meshes.remove(mesh)


def standard_bone_map(scene) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in scene.target_bone_definition_list:
        if item.bone_name:
            result[item.standard_bone_name] = item.bone_name
    return result


def gather_target_meshes(target_armature):
    meshes = []
    queue = list(target_armature.children)
    while queue:
        obj = queue.pop(0)
        queue.extend(list(obj.children))
        if obj.type == "MESH":
            meshes.append(obj)
    return meshes


def strip_proxy_mesh(obj, target_armature) -> None:
    material = get_proxy_material()
    obj.data.materials.clear()
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True

    if obj.data.shape_keys is not None:
        obj.shape_key_clear()

    for modifier in list(obj.modifiers):
        if modifier.type != "ARMATURE":
            obj.modifiers.remove(modifier)
        else:
            modifier.object = target_armature


def find_proxy_body_source(target_armature):
    preferred = bpy.data.objects.get(f"{target_armature.name}.Shape")
    if preferred and preferred.type == "MESH" and preferred.find_armature() == target_armature:
        return preferred

    meshes = gather_target_meshes(target_armature)
    filtered = []
    for mesh_obj in meshes:
        name = mesh_obj.name.lower()
        if "hair" in name or "ponytail" in name or "eyelash" in name or "lash" in name:
            continue
        filtered.append(mesh_obj)
    if not filtered:
        filtered = meshes
    if not filtered:
        raise RuntimeError("Preview proxy export mode could not find a target body mesh")
    return max(filtered, key=lambda obj: len(obj.data.vertices))


def duplicate_proxy_body_mesh(target_armature):
    source_obj = find_proxy_body_source(target_armature)
    duplicate = source_obj.copy()
    duplicate.data = source_obj.data.copy()
    duplicate.animation_data_clear()
    duplicate.name = f"{PROXY_PREFIX}Humanoid"
    bpy.context.scene.collection.objects.link(duplicate)
    duplicate.matrix_world = source_obj.matrix_world.copy()
    strip_proxy_mesh(duplicate, target_armature)
    return duplicate


def create_proxy_preview_objects(scene, target_armature):
    remove_existing_proxy_objects()
    return [target_armature, duplicate_proxy_body_mesh(target_armature)]


def gather_export_objects(scene, target_armature, export_mode: str):
    objects = [target_armature]
    if export_mode == "armature":
        return objects
    if export_mode == "proxy":
        return create_proxy_preview_objects(scene, target_armature)
    if export_mode == "full":
        queue = list(target_armature.children)
        while queue:
            obj = queue.pop(0)
            queue.extend(list(obj.children))
            if obj.type in {"MESH", "ARMATURE"}:
                objects.append(obj)
        return objects
    raise RuntimeError(f"Unsupported export mode: {export_mode}")


def select_objects(objects) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def export_fbx(output_path: Path, objects) -> None:
    ensure_dir(output_path)
    select_objects(objects)
    bpy.ops.export_scene.fbx(
        filepath=str(output_path),
        use_selection=True,
        object_types={"ARMATURE", "MESH"},
        use_mesh_modifiers=True,
        apply_scale_options="FBX_SCALE_UNITS",
        use_armature_deform_only=True,
        add_leaf_bones=False,
        bake_anim=True,
        bake_anim_use_all_actions=False,
        bake_anim_use_nla_strips=False,
        bake_anim_force_startend_keying=True,
        path_mode="COPY",
        embed_textures=False,
        axis_forward="-Z",
        axis_up="Y",
    )


def export_glb(output_path: Path, objects) -> None:
    ensure_dir(output_path)
    select_objects(objects)
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        use_selection=True,
        export_texcoords=False,
        export_normals=False,
        export_materials="NONE",
        export_attributes=False,
        export_cameras=False,
        export_extras=False,
        export_animations=True,
        export_animation_mode="ACTIVE_ACTIONS",
        export_nla_strips=False,
        export_force_sampling=True,
        export_optimize_animation_size=True,
        export_morph=False,
        export_morph_normal=False,
        export_morph_animation=False,
        export_lights=False,
        export_apply=True,
        export_yup=True,
    )


def main() -> int:
    args = parse_args()
    manifest_path = Path(args.manifest)
    manifest = read_json(manifest_path)

    report_path = Path(manifest["report_path"])
    progress_path = Path(manifest["progress_path"])
    total_clips = len(manifest["clips"])
    report = {
        "blend_file": bpy.data.filepath,
        "manifest_path": str(manifest_path),
        "report_path": str(report_path),
        "processed": [],
        "errors": [],
    }
    progress = {
        "status": "starting",
        "total": total_clips,
        "completed": 0,
        "failed": 0,
        "current_clip": None,
        "percent": 0,
        "report_path": str(report_path),
    }
    write_json(progress_path, progress)

    try:
        addon_root_parent = Path(manifest["addon_root_parent"])
        api_key = Path(manifest["api_key_file"]).read_text(encoding="utf-8").strip()
        if not api_key:
            raise RuntimeError("API key file is empty")

        ensure_addon_registered(addon_root_parent)

        scene = bpy.context.scene
        source_armature = find_or_create_buffer_human(scene, manifest.get("source_armature_name", "BufferArmature"))
        target_armature = find_armature(manifest["target_armature_name"])
        if target_armature is None:
            raise RuntimeError(f"Target armature not found: {manifest['target_armature_name']}")

        source_root_name = configure_scene(scene, source_armature, target_armature, Path(manifest["target_mapping_path"]))

        export_mode = manifest.get("export_mode")
        if export_mode is None:
            export_mode = "full" if bool(manifest.get("export_include_meshes", True)) else "armature"
        export_objects = gather_export_objects(scene, target_armature, export_mode)
        server_host = manifest.get("server_host", "https://zoe-api.sensetime.com/animoxtend")

        for clip in manifest["clips"]:
            progress["status"] = "running"
            progress["current_clip"] = clip["clip_name"]
            progress["percent"] = int((progress["completed"] / total_clips) * 100) if total_clips else 100
            write_json(progress_path, progress)
            clip_report = {
                "id": clip["id"],
                "annotation": clip["annotation"],
                "clip_name": clip["clip_name"],
                "npz_path": clip["npz_path"],
                "fbx_path": clip.get("fbx_path"),
                "glb_path": clip.get("glb_path"),
            }
            try:
                load_source_motion(source_armature, Path(clip["npz_path"]), clip["clip_name"], source_root_name)
                frame_start, frame_end = retarget_to_target(
                    scene,
                    source_armature,
                    target_armature,
                    api_key,
                    server_host,
                    clip["clip_name"],
                )
                clip_report["frame_start"] = frame_start
                clip_report["frame_end"] = frame_end

                if clip.get("fbx_path"):
                    export_fbx(Path(clip["fbx_path"]), export_objects)
                if clip.get("glb_path"):
                    export_glb(Path(clip["glb_path"]), export_objects)

                report["processed"].append(clip_report)
                progress["completed"] += 1
                progress["percent"] = int((progress["completed"] / total_clips) * 100) if total_clips else 100
                write_json(progress_path, progress)
                print(f"PIPELINE_EXPORTED {clip['clip_name']}")
            except Exception as exc:
                clip_report["error"] = repr(exc)
                clip_report["traceback"] = traceback.format_exc()
                report["errors"].append(clip_report)
                progress["failed"] += 1
                progress["completed"] += 1
                progress["percent"] = int((progress["completed"] / total_clips) * 100) if total_clips else 100
                write_json(progress_path, progress)
                print(f"PIPELINE_ERROR {clip['clip_name']} {exc}")

    except Exception as exc:
        report["fatal_error"] = repr(exc)
        report["fatal_traceback"] = traceback.format_exc()
        progress["status"] = "failed"

    ensure_dir(report_path)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    if report.get("fatal_error"):
        progress["status"] = "failed"
    elif report["errors"]:
        progress["status"] = "completed_with_errors"
    else:
        progress["status"] = "completed"
    progress["current_clip"] = None
    progress["percent"] = 100 if total_clips else 0
    write_json(progress_path, progress)
    print(f"PIPELINE_REPORT {report_path}")

    return 0 if (not report.get("fatal_error") and not report["errors"]) else 1


if __name__ == "__main__":
    raise SystemExit(main())
