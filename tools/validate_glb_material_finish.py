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
    parser.add_argument("--glb", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--roughness-min", type=float, default=0.75)
    parser.add_argument("--metallic-max", type=float, default=0.05)
    return parser.parse_args(argv)


def read_material_metrics(material: bpy.types.Material) -> dict:
    roughness = None
    metallic = None
    specular = None

    if hasattr(material, "roughness"):
        roughness = float(material.roughness)
    if hasattr(material, "metallic"):
        metallic = float(material.metallic)

    if material.use_nodes and material.node_tree:
        for node in material.node_tree.nodes:
            if node.type != "BSDF_PRINCIPLED":
                continue
            roughness_input = node.inputs.get("Roughness")
            metallic_input = node.inputs.get("Metallic")
            specular_input = node.inputs.get("Specular") or node.inputs.get("Specular IOR Level")
            if roughness_input is not None:
                roughness = float(roughness_input.default_value)
            if metallic_input is not None:
                metallic = float(metallic_input.default_value)
            if specular_input is not None:
                specular = float(specular_input.default_value)
            break

    return {
        "name": material.name,
        "roughness": roughness,
        "metallic": metallic,
        "specular": specular,
    }


def main():
    args = parse_args()
    glb_path = Path(args.glb).resolve()
    report_path = Path(args.report).resolve()

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb_path))

    materials = []
    for material in bpy.data.materials:
        materials.append(read_material_metrics(material))

    bad_materials = []
    for material in materials:
        roughness = material.get("roughness")
        metallic = material.get("metallic")
        if roughness is None or metallic is None:
            continue
        if roughness < args.roughness_min or metallic > args.metallic_max:
            bad_materials.append(material)

    report = {
        "glb": str(glb_path),
        "roughness_min_required": args.roughness_min,
        "metallic_max_allowed": args.metallic_max,
        "material_count": len(materials),
        "materials": materials,
        "bad_materials": bad_materials,
        "pass": len(bad_materials) == 0,
    }

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
