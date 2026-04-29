import argparse
import sys
from pathlib import Path

import bpy


ARMATURE_NAME = "VAMP Laurina for G8 Female"
BODY_MESH = "VAMP Laurina for G8 Female.Shape"
LASH_MESH = "Genesis 8 Female Eyelashes.Shape"
BROW_MESH = "VAMPLaurinaBrows.Shape"


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--body-action", default="idle_base_v1")
    parser.add_argument("--face-body-action", default="idle_face_body_v1")
    parser.add_argument("--face-lashes-action", default="idle_face_lashes_v1")
    parser.add_argument("--face-brows-action", default="idle_face_brows_v1")
    parser.add_argument("--frame-start", type=int, default=1)
    parser.add_argument("--frame-end", type=int, default=96)
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def assign_shape_action(obj_name: str, action_name: str) -> None:
    obj = bpy.data.objects.get(obj_name)
    action = bpy.data.actions.get(action_name)
    if obj is None or obj.type != "MESH" or obj.data.shape_keys is None:
        raise RuntimeError(f"Missing shape-key mesh: {obj_name}")
    if action is None:
        raise RuntimeError(f"Missing shape-key action: {action_name}")
    keys = obj.data.shape_keys
    if keys.animation_data is None:
        keys.animation_data_create()
    keys.animation_data.action = action


def main():
    args = parse_args()
    arm = bpy.data.objects.get(ARMATURE_NAME)
    if arm is None or arm.type != "ARMATURE":
        raise RuntimeError(f"Missing armature: {ARMATURE_NAME}")

    body_action = bpy.data.actions.get(args.body_action)
    if body_action is None:
        raise RuntimeError(f"Missing action: {args.body_action}")

    arm.animation_data_create()
    arm.animation_data.action = body_action
    bpy.context.scene.frame_start = args.frame_start
    bpy.context.scene.frame_end = args.frame_end
    bpy.context.view_layer.objects.active = arm

    assign_shape_action(BODY_MESH, args.face_body_action)
    assign_shape_action(LASH_MESH, args.face_lashes_action)
    assign_shape_action(BROW_MESH, args.face_brows_action)

    bpy.ops.object.select_all(action="DESELECT")
    for name in (ARMATURE_NAME, BODY_MESH, LASH_MESH, BROW_MESH):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.select_set(True)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_nla_strips=False,
        export_animation_mode="ACTIONS",
        export_force_sampling=True,
        export_skins=True,
        export_morph=True,
        export_morph_animation=True,
        export_yup=True,
    )
    print(f"EXPORTED {output}")
    if args.save:
        try:
            bpy.ops.wm.save_mainfile()
        except RuntimeError:
            bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, copy=False)
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
