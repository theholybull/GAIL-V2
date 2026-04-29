import argparse
import json
import struct
import sys
from pathlib import Path

import bpy


IDENTITY_EPSILON = 1e-4

EXPORT_PROFILE_SETTINGS = {
    "high": {
        "max_texture_size": None,
    },
    "medium": {
        "max_texture_size": 2048,
    },
    "low": {
        "max_texture_size": 512,
    },
}

AVATAR_NAME_TOKENS = (
    "victoria 8.shape",
    "genesis 8 female.shape",
    "genesis 8 female eyelashes.shape",
    "genesis 8 female eyelashes (2).shape",
    "vamplaurinabrows.shape",
)

TOP_NAME_TOKENS = (
    "cach_3quarter_sweatshirt.shape",
    "cach_tubetop.shape",
    "mk short t-shirt.shape",
)

PANTS_NAME_TOKENS = (
    "hanging out pants.shape",
    "urban action pants.shape",
)

FOOTWEAR_NAME_TOKENS = (
    "b25cjheels.shape",
    "angie sneakers.shape",
)

ACCESSORY_NAME_TOKENS = (
    "urban action bracelets.shape",
)

HAIR_NAME_TOKENS = (
    "orphelia_hair.shape",
    "voss hair genesis 8 female.shape",
)


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--report-path", required=True)
    parser.add_argument("--profile", choices=tuple(EXPORT_PROFILE_SETTINGS.keys()), default="high")
    parser.add_argument("--max-texture-size", type=int, default=None)
    return parser.parse_args(argv)


def ensure_object_mode():
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def resolve_profile_settings(profile_name, override_max_texture_size):
    settings = dict(EXPORT_PROFILE_SETTINGS.get(profile_name, EXPORT_PROFILE_SETTINGS["high"]))
    if override_max_texture_size is not None:
        settings["max_texture_size"] = override_max_texture_size
    return settings


def mesh_material_names(obj):
    return [material.name for material in obj.data.materials if material]


def downscale_scene_images(report, max_texture_size):
    if not max_texture_size or max_texture_size <= 0:
        report["texture_scaling"] = {
            "applied": False,
            "max_texture_size": None,
            "images": [],
        }
        return

    scaled_images = []
    for image in bpy.data.images:
        if image.source not in {"FILE", "GENERATED"}:
            continue

        width, height = image.size[:]
        if width <= 0 or height <= 0:
            continue
        if width <= max_texture_size and height <= max_texture_size:
            continue

        scale_ratio = min(max_texture_size / width, max_texture_size / height)
        new_width = max(1, int(round(width * scale_ratio)))
        new_height = max(1, int(round(height * scale_ratio)))
        image.scale(new_width, new_height)
        scaled_images.append(
            {
                "name": image.name,
                "from": [int(width), int(height)],
                "to": [int(new_width), int(new_height)],
                "filepath": image.filepath,
            }
        )

    report["texture_scaling"] = {
        "applied": len(scaled_images) > 0,
        "max_texture_size": max_texture_size,
        "images": scaled_images,
    }


def detect_armature():
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if not armatures:
        return None, []

    scored = []
    for arm in armatures:
        skinned = []
        for obj in bpy.data.objects:
            if obj.type != "MESH":
                continue
            if any(mod.type == "ARMATURE" and mod.object == arm for mod in obj.modifiers):
                skinned.append(obj)
        scored.append((len(skinned), arm, skinned))

    scored.sort(key=lambda item: item[0], reverse=True)
    _, armature, skinned_meshes = scored[0]
    return armature, skinned_meshes


def object_has_non_identity_transform(obj):
    return (
        any(abs(value) > IDENTITY_EPSILON for value in obj.location)
        or any(abs(value) > IDENTITY_EPSILON for value in obj.rotation_euler)
        or any(abs(value - 1.0) > IDENTITY_EPSILON for value in obj.scale)
    )


def normalize_export_space(report, armature, meshes):
    if armature is None:
        return

    targets = [armature, *meshes]
    dirty = [obj for obj in targets if object_has_non_identity_transform(obj)]
    if not dirty:
        report["normalization"] = {
            "applied": False,
            "objects": [],
        }
        return

    report["normalization"] = {
        "applied": True,
        "objects": [
            {
                "name": obj.name,
                "location": [float(v) for v in obj.location],
                "rotation_euler": [float(v) for v in obj.rotation_euler],
                "scale": [float(v) for v in obj.scale],
            }
            for obj in dirty
        ],
    }

    ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")
    for obj in targets:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def classify_meshes(meshes):
    buckets = {
        "avatar": [],
        "hair": [],
        "top": [],
        "pants": [],
        "sandals": [],
        "accessories": [],
        "other": [],
    }

    for mesh in meshes:
        name = mesh.name.lower()
        if name in AVATAR_NAME_TOKENS or "eyelash" in name or "brow" in name:
            buckets["avatar"].append(mesh)
        elif name in HAIR_NAME_TOKENS:
            buckets["hair"].append(mesh)
        elif name in TOP_NAME_TOKENS:
            buckets["top"].append(mesh)
        elif name in PANTS_NAME_TOKENS:
            buckets["pants"].append(mesh)
        elif name in FOOTWEAR_NAME_TOKENS:
            buckets["sandals"].append(mesh)
        elif name in ACCESSORY_NAME_TOKENS:
            buckets["accessories"].append(mesh)
        else:
            buckets["other"].append(mesh)

    return buckets


def mesh_record(mesh):
    return {
        "name": mesh.name,
        "materials": mesh_material_names(mesh),
        "armature_modifiers": [
            modifier.object.name
            for modifier in mesh.modifiers
            if modifier.type == "ARMATURE" and modifier.object
        ],
    }


def read_glb(path):
    raw = path.read_bytes()
    if raw[:4] != b"glTF":
        raise RuntimeError(f"Not a GLB file: {path}")

    json_length = struct.unpack_from("<I", raw, 12)[0]
    json_type = raw[16:20]
    if json_type != b"JSON":
        raise RuntimeError(f"Invalid GLB JSON chunk for {path}")

    json_start = 20
    json_end = json_start + json_length
    gltf = json.loads(raw[json_start:json_end].decode("utf-8"))

    bin_start = json_end
    if bin_start + 8 > len(raw):
        return gltf, bytearray(), raw

    bin_length = struct.unpack_from("<I", raw, bin_start)[0]
    bin_type = raw[bin_start + 4:bin_start + 8]
    if bin_type != b"BIN\x00":
        raise RuntimeError(f"Invalid GLB BIN chunk for {path}")

    payload_start = bin_start + 8
    payload_end = payload_start + bin_length
    return gltf, bytearray(raw[payload_start:payload_end]), raw


def write_glb(path, gltf, bin_payload):
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_padding = (4 - (len(json_bytes) % 4)) % 4
    json_chunk = json_bytes + (b" " * json_padding)

    bin_bytes = bytes(bin_payload)
    bin_padding = (4 - (len(bin_bytes) % 4)) % 4
    bin_chunk = bin_bytes + (b"\x00" * bin_padding)

    total_length = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    output = bytearray()
    output.extend(b"glTF")
    output.extend(struct.pack("<I", 2))
    output.extend(struct.pack("<I", total_length))
    output.extend(struct.pack("<I", len(json_chunk)))
    output.extend(b"JSON")
    output.extend(json_chunk)
    output.extend(struct.pack("<I", len(bin_chunk)))
    output.extend(b"BIN\x00")
    output.extend(bin_chunk)
    path.write_bytes(output)


def accessor_layout(gltf, accessor_index):
    accessor = gltf["accessors"][accessor_index]
    buffer_view = gltf["bufferViews"][accessor["bufferView"]]
    component_count = {
        "SCALAR": 1,
        "VEC2": 2,
        "VEC3": 3,
        "VEC4": 4,
        "MAT4": 16,
    }[accessor["type"]]
    component_size = {
        5120: 1,
        5121: 1,
        5122: 2,
        5123: 2,
        5125: 4,
        5126: 4,
    }[accessor["componentType"]]
    stride = buffer_view.get("byteStride", component_count * component_size)
    offset = buffer_view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    return accessor, offset, stride


def translate_gail_hair_vertices_to_head_space(target_path):
    gltf, bin_payload, _ = read_glb(target_path)
    skins = gltf.get("skins") or []
    nodes = gltf.get("nodes") or []
    meshes = gltf.get("meshes") or []
    accessors = gltf.get("accessors") or []

    if not skins or not meshes:
        return {
            "applied": False,
            "reason": "missing skin or mesh data",
        }

    skin = skins[0]
    joint_indices = skin.get("joints") or []
    head_joint_slot = next(
        (index for index, node_index in enumerate(joint_indices) if nodes[node_index].get("name") == "head"),
        None,
    )
    if head_joint_slot is None:
        return {
            "applied": False,
            "reason": "head joint not found",
        }

    inverse_bind_accessor_index = skin.get("inverseBindMatrices")
    if inverse_bind_accessor_index is None:
        return {
            "applied": False,
            "reason": "inverse bind matrices missing",
        }

    inverse_bind_accessor, inverse_bind_offset, inverse_bind_stride = accessor_layout(gltf, inverse_bind_accessor_index)
    if inverse_bind_accessor["componentType"] != 5126 or inverse_bind_accessor["type"] != "MAT4":
        return {
            "applied": False,
            "reason": "inverse bind matrices must be FLOAT MAT4",
        }

    matrix_base = inverse_bind_offset + head_joint_slot * inverse_bind_stride
    offset = (
        -struct.unpack_from("<f", bin_payload, matrix_base + 48)[0],
        -struct.unpack_from("<f", bin_payload, matrix_base + 52)[0],
        -struct.unpack_from("<f", bin_payload, matrix_base + 56)[0],
    )

    current_min_y = None
    current_max_y = None
    for mesh in meshes:
        for primitive in mesh.get("primitives") or []:
            position_accessor_index = primitive.get("attributes", {}).get("POSITION")
            if position_accessor_index is None:
                continue

            position_accessor, position_offset, position_stride = accessor_layout(gltf, position_accessor_index)
            if position_accessor["componentType"] != 5126 or position_accessor["type"] != "VEC3":
                continue

            for vertex_index in range(position_accessor["count"]):
                base = position_offset + vertex_index * position_stride
                y = struct.unpack_from("<f", bin_payload, base + 4)[0]
                current_min_y = y if current_min_y is None else min(current_min_y, y)
                current_max_y = y if current_max_y is None else max(current_max_y, y)

    if current_max_y is not None and current_max_y > 1.0:
        return {
            "applied": False,
            "reason": "hair vertices already appear to be in head/body space",
            "current_y_bounds": [float(current_min_y), float(current_max_y)],
            "skipped_head_rest_offset": [float(offset[0]), float(offset[1]), float(offset[2])],
        }

    translated_accessors = set()
    for mesh in meshes:
        for primitive in mesh.get("primitives") or []:
            position_accessor_index = primitive.get("attributes", {}).get("POSITION")
            if position_accessor_index is None or position_accessor_index in translated_accessors:
                continue

            position_accessor, position_offset, position_stride = accessor_layout(gltf, position_accessor_index)
            if position_accessor["componentType"] != 5126 or position_accessor["type"] != "VEC3":
                continue

            for vertex_index in range(position_accessor["count"]):
                base = position_offset + vertex_index * position_stride
                struct.pack_into("<f", bin_payload, base + 0, struct.unpack_from("<f", bin_payload, base + 0)[0] + offset[0])
                struct.pack_into("<f", bin_payload, base + 4, struct.unpack_from("<f", bin_payload, base + 4)[0] + offset[1])
                struct.pack_into("<f", bin_payload, base + 8, struct.unpack_from("<f", bin_payload, base + 8)[0] + offset[2])

            if isinstance(position_accessor.get("min"), list) and len(position_accessor["min"]) >= 3:
                position_accessor["min"] = [
                    float(position_accessor["min"][0] + offset[0]),
                    float(position_accessor["min"][1] + offset[1]),
                    float(position_accessor["min"][2] + offset[2]),
                ]
            if isinstance(position_accessor.get("max"), list) and len(position_accessor["max"]) >= 3:
                position_accessor["max"] = [
                    float(position_accessor["max"][0] + offset[0]),
                    float(position_accessor["max"][1] + offset[1]),
                    float(position_accessor["max"][2] + offset[2]),
                ]

            translated_accessors.add(position_accessor_index)

    write_glb(target_path, gltf, bin_payload)
    return {
        "applied": True,
        "head_rest_offset": [float(offset[0]), float(offset[1]), float(offset[2])],
        "translated_accessor_count": len(translated_accessors),
    }


def export_group(label, target_path, armature, meshes, export_morph):
    target_path.parent.mkdir(parents=True, exist_ok=True)
    if not meshes:
        return {
            "status": "skipped",
            "label": label,
            "target_path": str(target_path),
            "reason": "no meshes classified",
        }

    ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")
    if armature is not None:
        armature.select_set(True)
        bpy.context.view_layer.objects.active = armature

    for mesh in meshes:
        mesh.select_set(True)
        if bpy.context.view_layer.objects.active is None:
            bpy.context.view_layer.objects.active = mesh

    bpy.ops.export_scene.gltf(
        filepath=str(target_path),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_skins=True,
        export_morph=export_morph,
        export_morph_animation=False,
        export_yup=True,
    )

    glb_fix = None
    if label == "hair":
        glb_fix = translate_gail_hair_vertices_to_head_space(target_path)

    result = {
        "status": "ok",
        "label": label,
        "target_path": str(target_path),
        "size_bytes": target_path.stat().st_size,
        "mesh_names": [mesh.name for mesh in meshes],
    }
    if glb_fix:
        result["glb_fix"] = glb_fix
    return result


def main():
    args = parse_args()
    output_root = Path(args.output_root)
    report_path = Path(args.report_path)
    profile_settings = resolve_profile_settings(args.profile, args.max_texture_size)

    report = {
        "blend_path": bpy.data.filepath,
        "output_root": str(output_root),
        "profile": args.profile,
        "profile_settings": profile_settings,
        "armatures": [obj.name for obj in bpy.data.objects if obj.type == "ARMATURE"],
        "categories": {},
        "exports": {},
        "warnings": [],
        "errors": [],
    }

    try:
        output_root.mkdir(parents=True, exist_ok=True)
        armature, meshes = detect_armature()
        if armature is None:
            raise RuntimeError("No armature with skinned meshes found.")

        report["selected_armature"] = armature.name
        downscale_scene_images(report, profile_settings.get("max_texture_size"))
        normalize_export_space(report, armature, meshes)

        groups = classify_meshes(meshes)
        report["categories"] = {label: [mesh_record(mesh) for mesh in group] for label, group in groups.items()}

        for label in ("hair", "top", "pants", "sandals"):
            if not groups[label]:
                report["warnings"].append(f"No meshes classified for '{label}'.")
        if groups["other"]:
            report["warnings"].append(
                "Unclassified meshes remain: " + ", ".join(mesh.name for mesh in groups["other"])
            )

        targets = {
            "avatar": output_root / "avatar" / "base_face" / "gail_base_avatar.glb",
            "hair": output_root / "hair" / "meili_hair" / "meili_hair.glb",
            "top": output_root / "clothes" / "gail_top" / "gail_top.glb",
            "pants": output_root / "clothes" / "gail_pants" / "gail_pants.glb",
            "sandals": output_root / "clothes" / "gail_sandals" / "gail_sandals.glb",
            "accessories": output_root / "accessories" / "gail_bundle" / "gail_accessories.glb",
        }

        report["exports"]["avatar"] = export_group("avatar", targets["avatar"], armature, groups["avatar"], export_morph=True)
        report["exports"]["hair"] = export_group("hair", targets["hair"], armature, groups["hair"], export_morph=False)
        report["exports"]["top"] = export_group("top", targets["top"], armature, groups["top"], export_morph=False)
        report["exports"]["pants"] = export_group("pants", targets["pants"], armature, groups["pants"], export_morph=False)
        report["exports"]["sandals"] = export_group(
            "sandals",
            targets["sandals"],
            armature,
            groups["sandals"],
            export_morph=False,
        )
        report["exports"]["accessories"] = export_group(
            "accessories",
            targets["accessories"],
            armature,
            groups["accessories"],
            export_morph=False,
        )
    except Exception as exc:
        report["errors"].append(str(exc))
    finally:
        write_json(report_path, report)

    if report["errors"]:
        raise RuntimeError("; ".join(report["errors"]))


if __name__ == "__main__":
    main()
