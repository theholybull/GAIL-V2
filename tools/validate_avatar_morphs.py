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
    return parser.parse_args(argv)


def contains_any(name: str, parts: list[str]) -> bool:
    lower_name = name.lower()
    return any(part in lower_name for part in parts)


def collect_mesh_data():
    meshes = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue

        shape_keys = []
        if obj.data.shape_keys and obj.data.shape_keys.key_blocks:
            shape_keys = [key.name for key in obj.data.shape_keys.key_blocks]

        armature_modifiers = []
        for modifier in obj.modifiers:
            if modifier.type == "ARMATURE" and modifier.object:
                armature_modifiers.append(modifier.object.name)

        meshes.append(
            {
                "name": obj.name,
                "vertex_count": len(obj.data.vertices),
                "shape_key_count": len(shape_keys),
                "shape_keys": shape_keys,
                "armature_modifiers": armature_modifiers,
                "find_armature": obj.find_armature().name if obj.find_armature() else None,
            }
        )
    return meshes


def summarize_morphs(shape_keys: list[str]):
    blink_left = [name for name in shape_keys if contains_any(name, ["eyeblinkl", "eyesclosedl", "blink_l", "blinkleft"])]
    blink_right = [name for name in shape_keys if contains_any(name, ["eyeblinkr", "eyesclosedr", "blink_r", "blinkright"])]
    mouth_open = [name for name in shape_keys if contains_any(name, ["mouthopen", "jawopen", "vow", "vaa", "vee", "vm", "mouthclose"])]
    visemes = [
        name
        for name in shape_keys
        if contains_any(
            name,
            ["vaa", "vee", "veh", "ver", "vf", "vih", "viy", "vl", "vm", "vow", "vs", "vsh", "vt", "vth", "vuw", "vw"],
        )
    ]
    return {
        "blink_left_matches": blink_left,
        "blink_right_matches": blink_right,
        "mouth_matches": mouth_open,
        "viseme_matches": visemes,
        "blink_left_ok": len(blink_left) > 0,
        "blink_right_ok": len(blink_right) > 0,
        "mouth_ok": len(mouth_open) > 0,
        "viseme_ok": len(visemes) > 0,
    }


def main():
    args = parse_args()
    glb_path = Path(args.glb).resolve()
    report_path = Path(args.report).resolve()

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb_path))

    armatures = [obj.name for obj in bpy.data.objects if obj.type == "ARMATURE"]
    meshes = collect_mesh_data()
    primary_mesh = max(meshes, key=lambda mesh: mesh["shape_key_count"]) if meshes else None

    morph_summary = summarize_morphs(primary_mesh["shape_keys"]) if primary_mesh else {}
    rig_bound = bool(primary_mesh and (primary_mesh["find_armature"] or primary_mesh["armature_modifiers"]))
    pass_status = bool(
        primary_mesh
        and rig_bound
        and morph_summary.get("blink_left_ok")
        and morph_summary.get("blink_right_ok")
        and morph_summary.get("mouth_ok")
    )

    report = {
        "glb": str(glb_path),
        "armatures": armatures,
        "mesh_count": len(meshes),
        "primary_mesh": primary_mesh["name"] if primary_mesh else None,
        "primary_shape_key_count": primary_mesh["shape_key_count"] if primary_mesh else 0,
        "rig_bound": rig_bound,
        "morph_summary": morph_summary,
        "pass": pass_status,
        "meshes": meshes,
    }

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
