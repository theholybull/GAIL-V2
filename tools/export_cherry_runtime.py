import argparse
import json
import sys
from pathlib import Path

import bpy


IDENTITY_EPSILON = 1e-4
BODY_NAME_TOKENS = (
    "genesis 8 female.shape",
    "genesis 8 female eyelashes.shape",
)
SHOE_NAME_TOKENS = (
    "heel",
    "shoe",
    "boot",
    "sandal",
)
HAIR_NAME_TOKENS = (
    " hair",
    "hair ",
    "hair.",
    "hair_",
    "hair-",
)
HAIR_MATERIAL_TOKENS = (
    "hair",
    "scalp",
    "bang",
    "strand",
    "curl",
    "ponytail",
    "braid",
)
NON_HAIR_MATERIAL_TOKENS = (
    "heel",
    "sole",
    "toe",
    "zipper",
    "buckle",
    "button",
    "belt",
    "pant",
    "shirt",
    "jacket",
    "collar",
    "strap",
    "thread",
    "bracelet",
    "boot",
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
    return parser.parse_args(argv)


def ensure_object_mode():
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def mesh_material_names(obj):
    return [material.name for material in obj.data.materials if material]


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


def is_body_mesh(mesh):
    return mesh.name.lower() in BODY_NAME_TOKENS


def is_shoe_mesh(mesh):
    name = mesh.name.lower()
    materials = [material.lower() for material in mesh_material_names(mesh)]
    if any(token in name for token in SHOE_NAME_TOKENS):
        return True
    return any(any(token in material for token in SHOE_NAME_TOKENS) for material in materials)


def is_hair_mesh(mesh):
    name = mesh.name.lower()
    if any(token in name for token in SHOE_NAME_TOKENS):
        return False
    if "hair" in name or any(token in name for token in HAIR_NAME_TOKENS):
        return True

    materials = [material.lower() for material in mesh_material_names(mesh)]
    if any(any(token in material for token in NON_HAIR_MATERIAL_TOKENS) for material in materials):
        return False
    return any(any(token in material for token in HAIR_MATERIAL_TOKENS) for material in materials)


def classify_meshes(meshes):
    avatar = []
    hair = []
    shoes = []
    dress = []

    for mesh in meshes:
        if is_body_mesh(mesh):
            avatar.append(mesh)
        elif is_hair_mesh(mesh):
            hair.append(mesh)
        elif is_shoe_mesh(mesh):
            shoes.append(mesh)
        else:
            dress.append(mesh)

    return {
        "avatar": avatar,
        "hair": hair,
        "dress": dress,
        "shoes": shoes,
    }


def mesh_record(mesh):
    return {
        "name": mesh.name,
        "materials": mesh_material_names(mesh),
    }


def export_group(label, target_path, armature, meshes, export_morph):
    target_path.parent.mkdir(parents=True, exist_ok=True)
    if not meshes:
        return {
            "status": "skipped",
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

    return {
        "status": "ok",
        "target_path": str(target_path),
        "size_bytes": target_path.stat().st_size,
        "mesh_names": [mesh.name for mesh in meshes],
        "label": label,
    }


def main():
    args = parse_args()
    output_root = Path(args.output_root)
    report_path = Path(args.report_path)

    report = {
        "blend_path": bpy.data.filepath,
        "output_root": str(output_root),
        "armatures": [obj.name for obj in bpy.data.objects if obj.type == "ARMATURE"],
        "categories": {},
        "exports": {},
        "errors": [],
        "warnings": [],
    }

    armature, meshes = detect_armature()
    if armature is None:
        report["errors"].append("No armature with skinned meshes found.")
        write_json(report_path, report)
        raise SystemExit(1)

    report["selected_armature"] = armature.name
    normalize_export_space(report, armature, meshes)
    groups = classify_meshes(meshes)
    report["categories"] = {label: [mesh_record(mesh) for mesh in group] for label, group in groups.items()}

    targets = {
        "avatar": output_root / "avatar" / "base_face" / "cherry_base_avatar.glb",
        "hair": output_root / "hair" / "cherry_hair.glb",
        "dress": output_root / "clothing" / "girlfriend_dress.glb",
        "shoes": output_root / "clothing" / "girlfriend_shoes.glb",
    }

    report["exports"]["avatar"] = export_group("avatar", targets["avatar"], armature, groups["avatar"], export_morph=True)
    report["exports"]["hair"] = export_group("hair", targets["hair"], armature, groups["hair"], export_morph=False)
    report["exports"]["dress"] = export_group("dress", targets["dress"], armature, groups["dress"], export_morph=False)
    report["exports"]["shoes"] = export_group("shoes", targets["shoes"], armature, groups["shoes"], export_morph=False)

    write_json(report_path, report)
    if report["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
