import argparse
import json
import sys
from pathlib import Path

import bpy


DEFAULT_CONFIG = Path(__file__).resolve().parent.parent / "manifests" / "clip_tuning.idle_base_v1.json"


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--save", action="store_true")
    return parser.parse_args(argv)


def load_json(path):
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def ensure_action(name):
    action = bpy.data.actions.get(name)
    if action is None:
        action = bpy.data.actions.new(name=name)
    while action.fcurves:
        action.fcurves.remove(action.fcurves[0])
    action.use_fake_user = True
    return action


def ensure_key_action(obj_name, action_name):
    obj = bpy.data.objects[obj_name]
    keys = obj.data.shape_keys
    if keys.animation_data is None:
        keys.animation_data_create()
    action = ensure_action(action_name)
    keys.animation_data.action = action
    return obj, keys, action


def set_key(obj, key_name, value, frame):
    key_block = obj.data.shape_keys.key_blocks.get(key_name)
    if key_block is None:
        return
    key_block.value = value
    key_block.keyframe_insert(data_path="value", frame=frame)


def set_suffix(obj, suffix, value, frame):
    for key_name in obj.data.shape_keys.key_blocks.keys():
        if key_name.endswith(suffix):
            set_key(obj, key_name, value, frame)


def blink(obj, start, close_value):
    for frame, value in ((start, 0.0), (start + 2, close_value), (start + 4, 0.0)):
        set_suffix(obj, "eCTRLEyesClosedL", value, frame)
        set_suffix(obj, "eCTRLEyesClosedR", value, frame)
        set_suffix(obj, "eCTRLEyelidsUpperUp-DownL", value * 0.22, frame)
        set_suffix(obj, "eCTRLEyelidsUpperUp-DownR", value * 0.22, frame)
        set_suffix(obj, "eCTRLEyelidsLowerUpDownL", value * 0.14, frame)
        set_suffix(obj, "eCTRLEyelidsLowerUpDownR", value * 0.14, frame)


def set_micro_face(
    obj,
    frame,
    brow_l,
    brow_r,
    lips,
    smile_l,
    smile_r,
    mouth_l,
    mouth_r,
    jaw,
    squint_l=0.0,
    squint_r=0.0,
    eyes_side=0.0,
    eyes_up=0.0,
):
    set_suffix(obj, "eCTRLBrowInnerUp-DownL", brow_l, frame)
    set_suffix(obj, "eCTRLBrowInnerUp-DownR", brow_r, frame)
    set_suffix(obj, "eCTRLBrowOuterUp-DownL", brow_l * 0.7, frame)
    set_suffix(obj, "eCTRLBrowOuterUp-DownR", brow_r * 0.7, frame)
    set_suffix(obj, "eCTRLEyelidsUpperUp-DownL", squint_l, frame)
    set_suffix(obj, "eCTRLEyelidsUpperUp-DownR", squint_r, frame)
    set_suffix(obj, "eCTRLEyelidsLowerUpDownL", squint_l * 0.55, frame)
    set_suffix(obj, "eCTRLEyelidsLowerUpDownR", squint_r * 0.55, frame)
    set_suffix(obj, "eCTRLEyesSideSide", eyes_side, frame)
    set_suffix(obj, "eCTRLEyesUpDown", eyes_up, frame)
    set_suffix(obj, "eCTRLLipsPart", lips, frame)
    set_suffix(obj, "eCTRLMouthCornerUp-DownL", mouth_l, frame)
    set_suffix(obj, "eCTRLMouthCornerUp-DownR", mouth_r, frame)
    set_suffix(obj, "eCTRLCheekEyeFlexL", smile_l, frame)
    set_suffix(obj, "eCTRLCheekEyeFlexR", smile_r, frame)
    set_suffix(obj, "eCTRLCheekCrease", max(smile_l, smile_r) * 0.7, frame)
    set_suffix(obj, "eCTRLJawOut-In", jaw, frame)
    set_suffix(obj, "eCTRLMouthOpen", lips * 0.45, frame)


def main():
    args = parse_args()
    clip_config = load_json(args.config)
    bone_map = load_json(clip_config["bone_map_file"])
    meshes = bone_map["face_meshes"]
    face_cfg = clip_config["face"]
    action_names = clip_config.get(
        "face_actions",
        {
            "body": "idle_face_body_v1",
            "lashes": "idle_face_lashes_v1",
            "brows": "idle_face_brows_v1",
        },
    )

    body_obj, _, body_action = ensure_key_action(meshes["body"], action_names["body"])
    lash_obj, _, lash_action = ensure_key_action(meshes["lashes"], action_names["lashes"])
    brow_obj, _, brow_action = ensure_key_action(meshes["brows"], action_names["brows"])

    for frame in face_cfg["neutral_frames"]:
        set_micro_face(body_obj, frame, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
        set_micro_face(brow_obj, frame, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)

    for key in face_cfg["micro_keys"]:
        set_micro_face(
            body_obj,
            key["frame"],
            key["brow_l"],
            key["brow_r"],
            key["lips"],
            key["smile_l"],
            key["smile_r"],
            key["mouth_l"],
            key["mouth_r"],
            key["jaw"],
            key.get("squint_l", 0.0),
            key.get("squint_r", 0.0),
            key.get("eyes_side", 0.0),
            key.get("eyes_up", 0.0),
        )
        set_micro_face(
            brow_obj,
            key["frame"],
            key["brow_l"] * 0.9,
            key["brow_r"] * 0.9,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            key.get("squint_l", 0.0) * 0.85,
            key.get("squint_r", 0.0) * 0.85,
            0.0,
            0.0,
        )

    for blink_start in face_cfg["blink_frames"]:
        blink(body_obj, blink_start, face_cfg["blink_close"])
        blink(lash_obj, blink_start, face_cfg["blink_close"])
        reaction = face_cfg["blink_reaction"]
        set_micro_face(
            body_obj,
            blink_start + 2,
            reaction["brow_l"],
            reaction["brow_r"],
            reaction["lips"],
            reaction["smile_l"],
            reaction["smile_r"],
            reaction["mouth_l"],
            reaction["mouth_r"],
            reaction["jaw"],
            reaction.get("squint_l", 0.0),
            reaction.get("squint_r", 0.0),
            reaction.get("eyes_side", 0.0),
            reaction.get("eyes_up", 0.0),
        )

    body_action["gail_partition"] = "face"
    lash_action["gail_partition"] = "face"
    brow_action["gail_partition"] = "face"
    body_action["gail_clip_name"] = clip_config["clip"]
    lash_action["gail_clip_name"] = clip_config["clip"]
    brow_action["gail_clip_name"] = clip_config["clip"]

    print("Generated face idle actions")
    print(f"- {action_names['body']}")
    print(f"- {action_names['lashes']}")
    print(f"- {action_names['brows']}")
    if args.save:
        try:
            bpy.ops.wm.save_mainfile()
        except RuntimeError:
            bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, copy=False)
        print(f"SAVED {bpy.data.filepath}")


if __name__ == "__main__":
    main()
