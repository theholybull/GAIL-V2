"""Export Cherry.blend as a mesh-only avatar GLB (body + garments, no animation)."""
import sys
from pathlib import Path
import bpy


def find_mesh_armature():
    for obj in bpy.data.objects:
        if obj.type != "ARMATURE":
            continue
        skinned = [
            m for m in bpy.data.objects
            if m.type == "MESH"
            and any(mod.type == "ARMATURE" and mod.object == obj for mod in m.modifiers)
        ]
        if skinned:
            return obj, skinned
    return None, []


def main():
    output = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else None
    if not output:
        print("[export] ERROR: pass output path after --")
        return

    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)

    arm, meshes = find_mesh_armature()
    if not arm:
        print("[export] ERROR: No armature found")
        return

    print(f"[export] Armature: {arm.name} ({len(arm.data.bones)} bones)")
    print(f"[export] Meshes: {[m.name for m in meshes]}")

    # Clear any actions so we export mesh-only
    if arm.animation_data:
        arm.animation_data.action = None

    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    for m in meshes:
        m.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_skins=True,
        export_morph=True,
        export_morph_animation=False,
        export_yup=True,
    )

    size_mb = round(output.stat().st_size / (1024 * 1024), 2)
    print(f"[export] SUCCESS: {output.name} ({size_mb} MB)")


if __name__ == "__main__":
    main()
