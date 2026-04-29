import argparse
import json
import sys
from pathlib import Path

import bpy


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--max-texture-size", type=int, default=2048)
    return parser.parse_args(argv)


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


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def main():
    args = parse_args()
    input_path = Path(args.input).resolve()
    output_glb_path = Path(args.output_glb).resolve()
    output_blend_path = Path(args.output_blend).resolve()
    report_path = Path(args.report).resolve()

    ensure_parent(output_glb_path)
    ensure_parent(output_blend_path)
    ensure_parent(report_path)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(input_path))

    pre_report = scene_report("imported")
    scaled_images = []
    for image in bpy.data.images:
        result = maybe_scale_image(image, args.max_texture_size)
        if result:
            scaled_images.append(result)

    post_report = scene_report("optimized")

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
    )

    report = {
        "input": str(input_path),
        "output_glb": str(output_glb_path),
        "output_blend": str(output_blend_path),
        "max_texture_size": args.max_texture_size,
        "scaled_images": scaled_images,
        "pre": pre_report,
        "post": post_report,
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
