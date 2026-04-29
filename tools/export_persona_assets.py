import argparse
import json
import sys
from pathlib import Path

import bpy


IDENTITY_EPSILON = 1e-4


BODY_NAME_TOKENS = (
    "victoria 8.shape",
    "genesis 8 female.shape",
)

BODY_EXTRA_NAME_TOKENS = (
    "eyelash",
    "brow",
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

NON_HAIR_NAME_TOKENS = (
    "heel",
    "boot",
    "shoe",
    "pant",
    "shirt",
    "vest",
    "bracelet",
    "skirt",
    "blazer",
    "button",
    "top",
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
    parser.add_argument("--persona-id", required=True)
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--report-path", required=True)
    return parser.parse_args(argv)


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


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
    _, chosen_armature, skinned_meshes = scored[0]
    return chosen_armature, skinned_meshes


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


def mesh_material_names(obj):
    return [material.name for material in obj.data.materials if material]


def is_body_mesh(obj):
    name = obj.name.lower()
    if name in BODY_NAME_TOKENS:
        return True
    if any(token in name for token in BODY_EXTRA_NAME_TOKENS):
        return True

    materials = [material.lower() for material in mesh_material_names(obj)]
    return "torso" in materials and "face" in materials


def is_hair_mesh(obj):
    name = obj.name.lower()
    if "brow" in name or "eyelash" in name:
        return False
    if any(token in name for token in NON_HAIR_NAME_TOKENS):
        return False
    if "hair" in name:
        return True
    if any(token in name for token in HAIR_NAME_TOKENS):
        return True

    materials = [material.lower() for material in mesh_material_names(obj)]
    if any(any(token in material for token in NON_HAIR_MATERIAL_TOKENS) for material in materials):
        return False
    return any(any(token in material for token in HAIR_MATERIAL_TOKENS) for material in materials)


def classify_meshes(meshes):
    avatar = []
    hair = []
    clothes = []

    for mesh in meshes:
        if is_body_mesh(mesh):
            avatar.append(mesh)
        elif is_hair_mesh(mesh):
            hair.append(mesh)
        else:
            clothes.append(mesh)

    return {
        "avatar": avatar,
        "hair": hair,
        "clothes": clothes,
    }


def ensure_object_mode():
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def export_group(label, persona_id, output_root, armature, meshes, export_morph):
    relative_path = Path(label) / f"{persona_id}_{label}.glb"
    target_path = output_root / relative_path
    target_path.parent.mkdir(parents=True, exist_ok=True)

    if not meshes:
        return {
            "status": "skipped",
            "label": label,
            "relative_path": str(relative_path).replace("\\", "/"),
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
        "label": label,
        "relative_path": str(relative_path).replace("\\", "/"),
        "target_path": str(target_path),
        "size_bytes": target_path.stat().st_size,
        "mesh_names": [mesh.name for mesh in meshes],
    }


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


def main():
    args = parse_args()
    output_root = Path(args.output_root)
    report_path = Path(args.report_path)

    report = {
        "persona_id": args.persona_id,
        "blend_path": bpy.data.filepath,
        "output_root": str(output_root),
        "armatures": [obj.name for obj in bpy.data.objects if obj.type == "ARMATURE"],
        "warnings": [],
        "categories": {},
        "exports": {},
        "errors": [],
    }

    try:
        output_root.mkdir(parents=True, exist_ok=True)
        armature, skinned_meshes = detect_armature()
        all_meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]

        if armature is not None:
            report["selected_armature"] = armature.name
        else:
            report["warnings"].append("No armature detected in blend.")

        if not skinned_meshes and armature is not None:
            report["warnings"].append(
                f"Selected armature '{armature.name}' has no mesh armature modifiers; export may be static."
            )

        normalize_export_space(report, armature, skinned_meshes)

        classified = classify_meshes(all_meshes)
        for label, meshes in classified.items():
            report["categories"][label] = [mesh_record(mesh) for mesh in meshes]

        report["exports"]["avatar"] = export_group(
            "avatar",
            args.persona_id,
            output_root,
            armature,
            classified["avatar"],
            export_morph=True,
        )
        report["exports"]["hair"] = export_group(
            "hair",
            args.persona_id,
            output_root,
            armature,
            classified["hair"],
            export_morph=False,
        )
        report["exports"]["clothes"] = export_group(
            "clothes",
            args.persona_id,
            output_root,
            armature,
            classified["clothes"],
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
