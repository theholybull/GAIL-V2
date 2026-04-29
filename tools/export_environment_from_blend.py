import argparse
import json
import sys
from pathlib import Path

import bpy
import mathutils


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--max-texture-size", type=int, default=2048)
    parser.add_argument("--root-object", action="append", default=[])
    parser.add_argument("--exclude-root-object", action="append", default=[])
    parser.add_argument("--normalize-root-transform", action="store_true")
    parser.add_argument("--glass-material-pattern", action="append", default=[])
    parser.add_argument("--glass-alpha", type=float, default=None)
    return parser.parse_args(argv)


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def image_info(image: bpy.types.Image) -> dict:
    width = int(image.size[0]) if image.size else 0
    height = int(image.size[1]) if image.size else 0
    return {
        "name": image.name,
        "width": width,
        "height": height,
        "channels": int(getattr(image, "channels", 0) or 0),
        "alpha_mode": getattr(image, "alpha_mode", None),
        "source": getattr(image, "source", None),
        "file_format": getattr(image, "file_format", None),
        "packed": image.packed_file is not None,
    }


def material_info(material: bpy.types.Material) -> dict:
    info = {
        "name": material.name,
        "use_nodes": bool(material.use_nodes),
        "blend_method": getattr(material, "blend_method", None),
    }
    if material.use_nodes and material.node_tree:
        for node in material.node_tree.nodes:
            if node.type != "BSDF_PRINCIPLED":
                continue
            roughness_input = node.inputs.get("Roughness")
            metallic_input = node.inputs.get("Metallic")
            specular_input = node.inputs.get("Specular") or node.inputs.get("Specular IOR Level")
            info["roughness"] = float(roughness_input.default_value) if roughness_input else None
            info["metallic"] = float(metallic_input.default_value) if metallic_input else None
            info["specular"] = float(specular_input.default_value) if specular_input else None
            break
    return info


def scene_report(stage: str) -> dict:
    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    total_vertices = sum(len(obj.data.vertices) for obj in meshes)
    total_polygons = sum(len(obj.data.polygons) for obj in meshes)
    return {
        "stage": stage,
        "object_count": len(bpy.data.objects),
        "mesh_count": len(meshes),
        "material_count": len(bpy.data.materials),
        "image_count": len(bpy.data.images),
        "total_vertices": total_vertices,
        "total_polygons": total_polygons,
        "materials": [material_info(material) for material in bpy.data.materials],
        "images": [image_info(image) for image in bpy.data.images],
    }


def collect_hierarchy(root: bpy.types.Object) -> set[bpy.types.Object]:
    stack = [root]
    objects = set()
    while stack:
        current = stack.pop()
        if current in objects:
            continue
        objects.add(current)
        stack.extend(list(current.children))
    return objects


def filter_scene(include_roots: list[str], exclude_roots: list[str]) -> dict:
    include_objects: set[bpy.types.Object] | None = None
    missing_include = []
    if include_roots:
        include_objects = set()
        for root_name in include_roots:
            root = bpy.data.objects.get(root_name)
            if root is None:
                missing_include.append(root_name)
                continue
            include_objects.update(collect_hierarchy(root))
    if missing_include:
        raise RuntimeError(f"Missing include roots: {', '.join(missing_include)}")

    exclude_objects: set[bpy.types.Object] = set()
    missing_exclude = []
    for root_name in exclude_roots:
        root = bpy.data.objects.get(root_name)
        if root is None:
            missing_exclude.append(root_name)
            continue
        exclude_objects.update(collect_hierarchy(root))
    if missing_exclude:
        raise RuntimeError(f"Missing exclude roots: {', '.join(missing_exclude)}")

    if include_objects is None:
        keep_objects = set(bpy.data.objects)
    else:
        keep_objects = set(include_objects)
    keep_objects.difference_update(exclude_objects)

    removed_names = []
    for obj in list(bpy.data.objects):
        if obj in keep_objects:
            continue
        removed_names.append(obj.name)
        bpy.data.objects.remove(obj, do_unlink=True)

    bpy.ops.outliner.orphans_purge(do_recursive=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        obj.select_set(True)

    return {
        "include_roots": include_roots,
        "exclude_roots": exclude_roots,
        "kept_object_count": len(bpy.data.objects),
        "removed_object_count": len(removed_names),
        "removed_objects": sorted(removed_names),
    }


def has_non_identity_transform(obj: bpy.types.Object) -> bool:
    location = obj.location
    rotation = obj.rotation_quaternion if obj.rotation_mode == "QUATERNION" else obj.rotation_euler.to_quaternion()
    scale = obj.scale
    return (
        any(abs(float(value)) > 1e-6 for value in location)
        or any(abs(float(value)) > 1e-6 for value in rotation[:3])
        or abs(float(rotation[3]) - 1.0) > 1e-6
        or any(abs(float(value) - 1.0) > 1e-6 for value in scale)
    )


def normalize_root_transforms(root_names: list[str]) -> list[dict]:
    normalized = []
    for root_name in root_names:
        root = bpy.data.objects.get(root_name)
        if root is None or not has_non_identity_transform(root):
            continue
        replacement = bpy.data.objects.new(f"{root.name}__normalized", None)
        bpy.context.scene.collection.objects.link(replacement)
        replacement.matrix_world = mathutils.Matrix.Identity(4)
        replacement.empty_display_type = getattr(root, "empty_display_type", "PLAIN_AXES")
        replacement.empty_display_size = getattr(root, "empty_display_size", 1.0)

        children = list(root.children)
        for child in children:
            world_matrix = child.matrix_world.copy()
            child.parent = replacement
            child.matrix_parent_inverse = replacement.matrix_world.inverted()
            child.matrix_world = world_matrix

        normalized.append({
            "root_name": root.name,
            "replacement_name": replacement.name,
            "child_count": len(children),
            "location": [float(value) for value in root.location],
            "rotation_quaternion": [float(value) for value in (root.rotation_quaternion if root.rotation_mode == "QUATERNION" else root.rotation_euler.to_quaternion())],
            "scale": [float(value) for value in root.scale],
        })

        bpy.data.objects.remove(root, do_unlink=True)
        replacement.name = root_name

    bpy.ops.outliner.orphans_purge(do_recursive=True)
    return normalized


def tune_glass_materials(material_patterns: list[str], target_alpha: float | None) -> list[dict]:
    if not material_patterns or target_alpha is None:
      return []

    normalized_patterns = [pattern.lower() for pattern in material_patterns if pattern]
    if not normalized_patterns:
      return []

    updated = []
    clamped_alpha = max(0.01, min(0.99, float(target_alpha)))
    for material in bpy.data.materials:
        if not material or not material.use_nodes or not material.node_tree:
            continue
        material_name = material.name.lower()
        if not any(pattern in material_name for pattern in normalized_patterns):
            continue

        principled = next((node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
        if principled is None:
            continue

        alpha_input = principled.inputs.get("Alpha")
        transmission_input = principled.inputs.get("Transmission") or principled.inputs.get("Transmission Weight")
        roughness_input = principled.inputs.get("Roughness")
        metallic_input = principled.inputs.get("Metallic")
        specular_input = principled.inputs.get("Specular") or principled.inputs.get("Specular IOR Level")

        if alpha_input is not None:
            alpha_input.default_value = clamped_alpha
        if transmission_input is not None:
            transmission_input.default_value = 1.0
        if roughness_input is not None:
            roughness_input.default_value = min(float(roughness_input.default_value), 0.08)
        if metallic_input is not None:
            metallic_input.default_value = 0.0
        if specular_input is not None:
            specular_input.default_value = max(float(specular_input.default_value), 0.5)

        material.blend_method = "BLEND"
        if hasattr(material, "shadow_method"):
            material.shadow_method = "NONE"
        if hasattr(material, "use_backface_culling"):
            material.use_backface_culling = False

        updated.append({
            "name": material.name,
            "alpha": clamped_alpha,
            "blend_method": getattr(material, "blend_method", None),
            "shadow_method": getattr(material, "shadow_method", None),
        })

    return updated


def maybe_scale_image(image: bpy.types.Image, max_size: int) -> dict | None:
    width = int(image.size[0]) if image.size else 0
    height = int(image.size[1]) if image.size else 0
    if width <= 0 or height <= 0:
        return None
    largest = max(width, height)
    if largest <= max_size:
        return None

    scale_factor = max_size / largest
    target_width = max(1, int(round(width * scale_factor)))
    target_height = max(1, int(round(height * scale_factor)))
    image.scale(target_width, target_height)
    image.update()
    return {
        "name": image.name,
        "from": [width, height],
        "to": [target_width, target_height],
    }


def main():
    args = parse_args()
    input_path = Path(args.input).resolve()
    output_glb_path = Path(args.output_glb).resolve()
    output_blend_path = Path(args.output_blend).resolve()
    report_path = Path(args.report).resolve()

    ensure_parent(output_glb_path)
    ensure_parent(output_blend_path)
    ensure_parent(report_path)

    bpy.ops.wm.open_mainfile(filepath=str(input_path))

    pre_report = scene_report("opened")
    filter_report = filter_scene(args.root_object, args.exclude_root_object)
    normalized_roots = normalize_root_transforms(args.root_object) if args.normalize_root_transform else []
    tuned_glass_materials = tune_glass_materials(args.glass_material_pattern, args.glass_alpha)
    filtered_report = scene_report("filtered")
    scaled_images = []
    for image in bpy.data.images:
        result = maybe_scale_image(image, args.max_texture_size)
        if result:
            scaled_images.append(result)

    post_report = scene_report("optimized")

    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(output_blend_path))
    bpy.ops.export_scene.gltf(
        filepath=str(output_glb_path),
        export_format="GLB",
        export_cameras=False,
        export_lights=False,
        export_yup=True,
        export_apply=False,
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_materials="EXPORT",
        export_image_format="AUTO",
        use_selection=True,
    )

    report = {
        "input": str(input_path),
        "output_glb": str(output_glb_path),
        "output_blend": str(output_blend_path),
        "max_texture_size": args.max_texture_size,
        "filter": filter_report,
        "normalized_roots": normalized_roots,
        "tuned_glass_materials": tuned_glass_materials,
        "scaled_images": scaled_images,
        "pre": pre_report,
        "filtered": filtered_report,
        "post": post_report,
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
