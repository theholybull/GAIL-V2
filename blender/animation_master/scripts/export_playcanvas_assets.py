import argparse
import json
import sys
from pathlib import Path

import bpy


TEMP_EXPORT_SUFFIX = "__gail_export_tmp"

MEDIUM_KEEP_SUFFIXES = {
    "eCTRLEyesClosed",
    "eCTRLEyesClosedL",
    "eCTRLEyesClosedR",
    "eCTRLEyelidsLowerUpDown",
    "eCTRLEyelidsLowerUpDownL",
    "eCTRLEyelidsLowerUpDownR",
    "eCTRLEyelidsUpperUp-Down",
    "eCTRLEyelidsUpperUp-DownL",
    "eCTRLEyelidsUpperUp-DownR",
    "eCTRLJawOut-In",
    "eCTRLJawSide-Side",
    "eCTRLMouthClosed",
    "eCTRLMouthCornerUp-DownL",
    "eCTRLMouthCornerUp-DownR",
    "eCTRLMouthFrown",
    "eCTRLMouthOpen",
    "eCTRLMouthSmile",
    "eCTRLMouthSmileOpen",
    "eCTRLMouthSmileSimpleL",
    "eCTRLMouthSmileSimpleR",
    "eCTRLMouthWide-Narrow",
    "eCTRLBrowInnerUp-DownL",
    "eCTRLBrowInnerUp-DownR",
    "eCTRLBrowOuterUp-DownL",
    "eCTRLBrowOuterUp-DownR",
    "eCTRLBrowSqueezeL",
    "eCTRLBrowSqueezeR",
    "eCTRLLipsPart",
    "eCTRLLipsPartCenter",
    "eCTRLLipsPucker-Pressed",
    "eCTRLLipsPuckerWide",
    "eCTRLLipTopUp-Down",
    "eCTRLLipBottomUp-Down",
    "eCTRLvAA",
    "eCTRLvEE",
    "eCTRLvEH",
    "eCTRLvER",
    "eCTRLvF",
    "eCTRLvIH",
    "eCTRLvIY",
    "eCTRLvL",
    "eCTRLvM",
    "eCTRLvOW",
    "eCTRLvS",
    "eCTRLvSH",
    "eCTRLvT",
    "eCTRLvTH",
    "eCTRLvUW",
    "eCTRLvW",
}

EXPORT_PROFILES = {
    "high": {
        "label": "High / Host PC",
        "allow_avatar_morphs": True,
        "draco_enabled": False,
        "draco_level": 0,
    },
    "medium": {
        "label": "Medium / N150 Client",
        "allow_avatar_morphs": True,
        "draco_enabled": True,
        "draco_level": 4,
        "draco_position_quantization": 12,
        "draco_normal_quantization": 10,
        "draco_texcoord_quantization": 12,
        "draco_generic_quantization": 12,
    },
    "low": {
        "label": "Low / ESP32 Watch",
        "allow_avatar_morphs": False,
        "draco_enabled": True,
        "draco_level": 6,
        "draco_position_quantization": 11,
        "draco_normal_quantization": 8,
        "draco_texcoord_quantization": 10,
        "draco_generic_quantization": 10,
    },
}


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--partition-manifest", required=True)
    parser.add_argument("--shape-key-manifest", required=True)
    parser.add_argument("--profile", choices=sorted(EXPORT_PROFILES.keys()), default="high")
    parser.add_argument("--report-path")
    parser.add_argument("--apply-matte", action="store_true")
    return parser.parse_args(argv)


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def should_keep_shape_key(name: str, rules: dict) -> bool:
    if name in rules.get("keep_exact", []):
        return True
    suffix = name.split("__", 1)[1] if "__" in name else name
    if suffix in rules.get("keep_suffixes", []):
        return True
    for prefix in rules.get("keep_prefixes", []):
        if name.startswith(prefix):
            return True
    return False


def profile_settings(profile_name: str) -> dict:
    return EXPORT_PROFILES.get(profile_name, EXPORT_PROFILES["high"])


def build_shape_rules(base_rules: dict, profile_name: str) -> dict:
    if profile_name == "high":
        return base_rules
    if profile_name == "low":
        payload = dict(base_rules)
        payload["keep_exact"] = ["Basis"]
        payload["keep_suffixes"] = []
        return payload

    payload = dict(base_rules)
    payload["keep_exact"] = [
        name
        for name in base_rules.get("keep_exact", [])
        if name == "Basis" or (name.split("__", 1)[1] if "__" in name else name) in MEDIUM_KEEP_SUFFIXES
    ]
    payload["keep_suffixes"] = [
        suffix for suffix in base_rules.get("keep_suffixes", []) if suffix in MEDIUM_KEEP_SUFFIXES
    ]
    payload["notes"] = "Medium runtime keep set for N150-class clients."
    return payload


def purge_orphans() -> None:
    for _ in range(3):
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)


def clone_materials_for_object(obj: bpy.types.Object) -> None:
    if obj.type != "MESH":
        return
    for slot in obj.material_slots:
        if slot.material is not None:
            slot.material = slot.material.copy()


def apply_matte_to_material(material: bpy.types.Material) -> None:
    if material is None:
        return

    if hasattr(material, "metallic"):
        material.metallic = 0.0
    if hasattr(material, "roughness"):
        material.roughness = max(float(getattr(material, "roughness", 0.0)), 0.82)
    if hasattr(material, "specular_intensity"):
        material.specular_intensity = min(float(getattr(material, "specular_intensity", 0.0)), 0.18)

    if not material.use_nodes or material.node_tree is None:
        return

    def force_socket_value(node: bpy.types.Node, input_name: str, value: float) -> None:
        socket = node.inputs.get(input_name)
        if socket is None:
            return
        if socket.is_linked:
            for link in list(material.node_tree.links):
                if link.to_socket == socket:
                    material.node_tree.links.remove(link)
        socket.default_value = value

    for node in material.node_tree.nodes:
        if node.type != "BSDF_PRINCIPLED":
            continue

        force_socket_value(node, "Metallic", 0.0)
        force_socket_value(node, "Roughness", 0.9)
        force_socket_value(node, "Specular", 0.08)
        force_socket_value(node, "Specular IOR Level", 0.08)
        force_socket_value(node, "Sheen", 0.0)
        force_socket_value(node, "Sheen Weight", 0.0)
        force_socket_value(node, "Clearcoat", 0.0)
        force_socket_value(node, "Coat Weight", 0.0)
        force_socket_value(node, "Clearcoat Roughness", 0.0)
        force_socket_value(node, "Coat Roughness", 0.0)


def apply_matte_to_object(obj: bpy.types.Object) -> None:
    if obj.type != "MESH":
        return
    clone_materials_for_object(obj)
    for slot in obj.material_slots:
        if slot.material is not None:
            apply_matte_to_material(slot.material)


def select_for_export(armature_name: str, object_names: list[str]) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    arm = bpy.data.objects.get(armature_name)
    if arm is None:
        raise RuntimeError(f"Missing armature: {armature_name}")
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    for name in object_names:
        obj = bpy.data.objects.get(name)
        if obj is None:
            raise RuntimeError(f"Missing export object: {name}")
        obj.select_set(True)


def duplicate_armature_for_export(armature_name: str) -> bpy.types.Object:
    source = bpy.data.objects.get(armature_name)
    if source is None or source.type != "ARMATURE":
        raise RuntimeError(f"Missing armature: {armature_name}")
    duplicate = source.copy()
    duplicate.data = source.data.copy()
    duplicate.animation_data_clear()
    duplicate.name = f"{source.name}{TEMP_EXPORT_SUFFIX}"
    bpy.context.scene.collection.objects.link(duplicate)
    duplicate.matrix_world = source.matrix_world.copy()
    duplicate.parent = None
    return duplicate


def normalize_armature_for_export(armature_obj: bpy.types.Object) -> bool:
    if armature_obj.type != "ARMATURE":
        return False
    has_rotation = any(abs(float(value)) > 1e-6 for value in armature_obj.rotation_euler)
    has_scale = any(abs(float(value) - 1.0) > 1e-6 for value in armature_obj.scale)
    if not has_rotation and not has_scale:
        return False

    bpy.ops.object.select_all(action="DESELECT")
    armature_obj.select_set(True)
    bpy.context.view_layer.objects.active = armature_obj
    if bpy.context.object is not None and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    armature_obj.select_set(False)
    return True


def export_glb(output_path: Path, export_morph: bool, settings: dict) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    export_kwargs = {
        "filepath": str(output_path),
        "export_format": "GLB",
        "use_selection": True,
        "export_animations": False,
        "export_nla_strips": False,
        "export_force_sampling": True,
        "export_skins": True,
        "export_all_influences": False,
        "export_morph": export_morph,
        "export_morph_animation": False,
        "export_yup": True,
    }
    if settings.get("draco_enabled"):
        export_kwargs.update(
            {
                "export_draco_mesh_compression_enable": True,
                "export_draco_mesh_compression_level": settings["draco_level"],
                "export_draco_position_quantization": settings["draco_position_quantization"],
                "export_draco_normal_quantization": settings["draco_normal_quantization"],
                "export_draco_texcoord_quantization": settings["draco_texcoord_quantization"],
                "export_draco_generic_quantization": settings["draco_generic_quantization"],
            }
        )
    bpy.ops.export_scene.gltf(**export_kwargs)


def normalized_output_path(group: dict) -> Path:
    if group.get("output_path"):
        return Path(group["output_path"])
    folder = Path(group["output_folder"])
    file_name = group.get("file_name") or f"{group['name']}.glb"
    return folder / file_name


def export_group(
    armature_name: str,
    group: dict,
    kind: str,
    export_morph: bool,
    report: dict,
    avatar_id: str,
    settings: dict,
    apply_matte: bool,
) -> None:
    output_path = normalized_output_path(group)
    temp_names = []
    try:
        try:
            export_armature_name, object_names, temp_names, normalized_armature = create_normalized_export_rig(
                armature_name,
                group["objects"],
                apply_matte,
            )
        except RuntimeError as exc:
            if "Missing avatar export object" not in str(exc):
                raise
            warning = {
                "avatar_id": avatar_id,
                "name": group.get("name", "unknown"),
                "type": kind,
                "error": str(exc),
            }
            report.setdefault("warnings", []).append(warning)
            print(f"WARNING skipped export group '{group.get('name', 'unknown')}': {exc}")
            return

        select_for_export(export_armature_name, object_names)
        export_glb(output_path, export_morph=export_morph, settings=settings)
        report["exports"].append(
            {
                "avatar_id": avatar_id,
                "name": group["name"],
                "type": kind,
                "path": str(output_path),
                "relative_path": group.get("relative_path"),
                "objects": group["objects"],
                "temp_objects": temp_names,
                "profile": settings["label"],
                "matte_applied": apply_matte,
                "armature_normalized": normalized_armature,
            }
        )
        print(f"EXPORTED {output_path}")
    finally:
        cleanup_temp_objects(temp_names)


def duplicate_object_for_avatar_export(obj_name: str, target_armature: bpy.types.Object | None = None) -> bpy.types.Object:
    source = bpy.data.objects.get(obj_name)
    if source is None:
        raise RuntimeError(f"Missing avatar export object: {obj_name}")
    duplicate = source.copy()
    duplicate.data = source.data.copy()
    duplicate.animation_data_clear()
    duplicate.name = f"{source.name}{TEMP_EXPORT_SUFFIX}"
    bpy.context.scene.collection.objects.link(duplicate)
    duplicate.parent = None
    duplicate.location = source.location.copy()
    duplicate.scale = source.scale.copy()
    duplicate.rotation_mode = source.rotation_mode
    if duplicate.rotation_mode == "QUATERNION":
        duplicate.rotation_quaternion = source.rotation_quaternion.copy()
    elif duplicate.rotation_mode == "AXIS_ANGLE":
        duplicate.rotation_axis_angle = source.rotation_axis_angle[:]
    else:
        duplicate.rotation_euler = source.rotation_euler.copy()

    if target_armature is not None and source.find_armature() is not None:
        duplicate.parent = target_armature
        duplicate.parent_type = "OBJECT"
        duplicate.matrix_parent_inverse = target_armature.matrix_world.inverted()
        duplicate.matrix_world = source.matrix_world.copy()
    else:
        duplicate.matrix_world = source.matrix_world.copy()

    for modifier in duplicate.modifiers:
        if modifier.type == "ARMATURE" and source.find_armature() is not None:
            modifier.object = target_armature or source.find_armature()
    return duplicate


def prune_shape_keys_for_object(obj_name: str, rules: dict) -> list[str]:
    removed = []
    obj = bpy.data.objects.get(obj_name)
    if obj is None or obj.type != "MESH" or obj.data.shape_keys is None:
        return removed
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    key_blocks = obj.data.shape_keys.key_blocks
    removable_names = [
        block.name
        for block in key_blocks
        if block.name != "Basis" and not should_keep_shape_key(block.name, rules)
    ]
    for key_name in removable_names:
        obj.active_shape_key_index = key_blocks.find(key_name)
        bpy.ops.object.shape_key_remove(all=False)
        removed.append(key_name)
    obj.select_set(False)
    return removed


def cleanup_temp_objects(temp_names: list[str]) -> None:
    for obj_name in temp_names:
        obj = bpy.data.objects.get(obj_name)
        if obj is None:
            continue
        obj_type = obj.type
        data_block = obj.data if obj_type in {"MESH", "ARMATURE"} else None
        bpy.data.objects.remove(obj, do_unlink=True)
        if data_block is not None and data_block.users == 0:
            if obj_type == "MESH":
                bpy.data.meshes.remove(data_block)
            elif obj_type == "ARMATURE":
                bpy.data.armatures.remove(data_block)
    purge_orphans()


def create_normalized_export_rig(armature_name: str, object_names: list[str], apply_matte: bool) -> tuple[str, list[str], list[str], bool]:
    temp_armature = duplicate_armature_for_export(armature_name)
    normalized_armature = normalize_armature_for_export(temp_armature)
    temp_names = [temp_armature.name]
    temp_object_names = []

    for obj_name in object_names:
        duplicate = duplicate_object_for_avatar_export(obj_name, target_armature=temp_armature)
        if apply_matte:
            apply_matte_to_object(duplicate)
        temp_names.append(duplicate.name)
        temp_object_names.append(duplicate.name)

    return temp_armature.name, temp_object_names, temp_names, normalized_armature


def export_avatar_base(
    armature_name: str,
    group: dict,
    shape_rules: dict,
    report: dict,
    avatar_id: str,
    settings: dict,
    apply_matte: bool,
) -> None:
    temp_names = []
    removed_shape_keys = {}
    try:
        try:
            export_armature_name, temp_object_names, temp_names, normalized_armature = create_normalized_export_rig(
                armature_name,
                group["objects"],
                apply_matte,
            )
        except RuntimeError as exc:
            if "Missing avatar export object" not in str(exc):
                raise
            warning = {
                "avatar_id": avatar_id,
                "name": group.get("name", "gail_base_avatar"),
                "type": "avatar",
                "error": str(exc),
            }
            report.setdefault("warnings", []).append(warning)
            print(f"WARNING skipped avatar export '{group.get('name', 'gail_base_avatar')}': {exc}")
            return

        for obj_name, duplicate_name in zip(group["objects"], temp_object_names):
            duplicate = bpy.data.objects.get(duplicate_name)
            if duplicate is None:
                raise RuntimeError(f"Missing temporary export object: {duplicate_name}")
            if settings["allow_avatar_morphs"]:
                removed_shape_keys[obj_name] = prune_shape_keys_for_object(duplicate.name, shape_rules)
            else:
                removed_shape_keys[obj_name] = []

        output_path = normalized_output_path(group)
        select_for_export(export_armature_name, temp_object_names)
        export_glb(output_path, export_morph=settings["allow_avatar_morphs"], settings=settings)
        report["exports"].append(
            {
                "avatar_id": avatar_id,
                "name": group["name"],
                "type": "avatar",
                "path": str(output_path),
                "relative_path": group.get("relative_path"),
                "source_objects": group["objects"],
                "temp_objects": temp_names,
                "removed_shape_keys": removed_shape_keys,
                "profile": settings["label"],
                "matte_applied": apply_matte,
                "armature_normalized": normalized_armature,
            }
        )
        print(f"EXPORTED {output_path}")
    finally:
        cleanup_temp_objects(temp_names)


def legacy_avatar_export(partition: dict) -> dict:
    return {
        "avatar_id": partition.get("avatar_id", "gail_default"),
        "armature_object": partition["armature_object"],
        "export_mode": "new_avatar",
        "body_face_group": {
            "name": "gail_base_avatar",
            "objects": partition["body_face_group"]["objects"],
            "output_folder": partition["body_face_group"]["output_folder"],
            "file_name": "gail_base_avatar.glb",
        },
        "hair_groups": partition.get("hair_groups", []),
        "clothing_groups": partition.get("clothing_groups", []),
        "clothing_sets": partition.get("clothing_sets", []),
        "accessory_groups": partition.get("accessory_groups", []),
    }


def iter_avatar_exports(partition: dict) -> list[dict]:
    avatar_exports = partition.get("avatar_exports")
    if isinstance(avatar_exports, dict):
        return list(avatar_exports.values())
    if isinstance(avatar_exports, list):
        return avatar_exports
    return [legacy_avatar_export(partition)]


def main():
    args = parse_args()
    partition = load_json(Path(args.partition_manifest))
    settings = profile_settings(args.profile)
    shape_rules = build_shape_rules(load_json(Path(args.shape_key_manifest)), args.profile)
    current_path = Path(bpy.data.filepath).resolve(strict=False)
    expected_source = Path(partition["source_master_file"]).resolve(strict=False)
    if current_path != expected_source:
        raise RuntimeError(
            f"Open blend does not match manifest source_master_file: open={current_path} expected={expected_source}"
        )

    report = {"profile": args.profile, "profile_label": settings["label"], "exports": [], "warnings": []}

    for avatar in iter_avatar_exports(partition):
        avatar_id = avatar.get("avatar_id", "gail_default")
        armature_name = avatar.get("armature_object") or partition.get("armature_object")
        if not armature_name:
            raise RuntimeError(f"Missing armature for avatar export '{avatar_id}'")

        for group in avatar.get("hair_groups", []):
            export_group(armature_name, group, "hair", export_morph=False, report=report, avatar_id=avatar_id, settings=settings, apply_matte=args.apply_matte)

        for group in avatar.get("clothing_groups", []):
            export_group(armature_name, group, "clothing_piece", export_morph=False, report=report, avatar_id=avatar_id, settings=settings, apply_matte=args.apply_matte)

        for group in avatar.get("clothing_sets", []):
            export_group(armature_name, group, "clothing_set", export_morph=False, report=report, avatar_id=avatar_id, settings=settings, apply_matte=args.apply_matte)

        for group in avatar.get("accessory_groups", []):
            export_group(armature_name, group, "accessory", export_morph=False, report=report, avatar_id=avatar_id, settings=settings, apply_matte=args.apply_matte)

        body_face_group = avatar.get("body_face_group")
        if avatar.get("export_mode", "new_avatar") == "new_avatar" and body_face_group:
            export_avatar_base(armature_name, body_face_group, shape_rules, report, avatar_id, settings, args.apply_matte)

    report_path = (
        Path(args.report_path)
        if args.report_path
        else Path(args.partition_manifest).parent.parent / "exports" / "reports" / "playcanvas_asset_export_report.json"
    )
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(f"REPORT {report_path}")


if __name__ == "__main__":
    main()
