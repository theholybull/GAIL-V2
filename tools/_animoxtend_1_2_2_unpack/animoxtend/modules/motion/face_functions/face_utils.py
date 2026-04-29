import io
import logging
import os
import re
from pathlib import Path

import bpy

from ....assets.resource_manager import Config
from ..pipeline_functions.file_utils import load_json
from .client import generate, get_support_model_list

logger = logging.getLogger("animoxtend")

EmotionList = [
    "Angry",
    "Contempt",
    "Disgust",
    "Fear",
    "Happy",
    "Neutral",
    "Sad",
    "Surprise",
    "Calm",
    "Singing",
    "Undefined_Natural",
    "Other_Unknown",
]

folder_path = Config.folder_path
shape_key_map_path = os.path.join(folder_path, "buffer_human_shapekey_map.json")
shape_key_mapping = load_json(shape_key_map_path)


def emotion_list() -> list:
    return EmotionList


def emotion_id(name: str) -> int:
    return EmotionList.index(name)


def save_data(data: bytes, wav_filepath: Path, temp_dir: Path) -> Path:
    from datetime import datetime

    import numpy as np

    with io.BytesIO(data) as file:
        data_dict = dict(np.load(file, allow_pickle=True))
        wav_name = wav_filepath.stem
        now_str = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        num_frame = data_dict["n_frames"]

        save_path = temp_dir / f"f_{wav_name}_{now_str}_{num_frame!s}.npz"
        # save_path = os.path.join(temp_dir, "temp_face_data.npz")
        # with open(save_path, "wb") as file:
        #     file.write(data)
        save_path.write_bytes(data)
        return save_path


def generate_face_data(wav_file: str, model_name: str, emo_name: str, save_path: Path, callback=None) -> Path | None:
    emo_id = emotion_id(emo_name)
    results: Path | None = None
    err = None
    wav_filepath = Path(wav_file)
    face_npz, err = generate(wav_filepath, model_name, emo_id)
    if face_npz:
        results = save_data(face_npz, wav_filepath, save_path)
        err = None
        return results
    if callback:
        callback(results, err)


def refresh_model_list(self, context):
    new_list, error = get_support_model_list()
    if new_list is not None:
        context.scene["face_model_list"] = new_list
        self.report({"INFO"}, "Face Model Refreshed")
        if len(new_list) > 0:
            context.scene.face_model_ui = new_list[0]
        return {"FINISHED"}
    else:
        self.report({"ERROR"}, f"Refresh face model: {error}")
        return {"CANCELLED"}


def create_fcurve_for_shape_key(obj, key, frame_count):
    """
    为指定的形状键创建一个新的 fcurve，并根据帧数插入空的关键帧。
    """
    if obj.data.shape_keys.animation_data is None:
        obj.data.shape_keys.animation_data_create()

    action = obj.data.shape_keys.animation_data.action
    if action is None:
        action = bpy.data.actions.new(name="ShapeKeyAction")
        obj.data.shape_keys.animation_data.action = action

    fcurve_name = f'key_blocks["{key}"].value'
    fcurve = None
    for fc in action.fcurves:
        if fc.data_path == fcurve_name:
            fcurve = fc
            break

    if fcurve is None:
        fcurve = action.fcurves.new(data_path=fcurve_name, index=0)

    fcurve.keyframe_points.clear()
    for frame in range(frame_count):
        fcurve.keyframe_points.insert(frame, 0.0)
    return fcurve


def process_csv_data(csv_path):
    import pandas as pd

    csv = pd.read_csv(csv_path)
    headers = csv.columns.tolist()
    data = {}
    frame_count = len(csv)
    for header in headers[2:]:
        key = "A_" + header[0].lower() + header[1:]  # 转换列名为形状键名称
        data[key] = csv[header].tolist()
    return data, frame_count


def process_npz_data(npz_path):
    import numpy as np

    npz_data = np.load(npz_path)
    data = {}
    frame_count = npz_data["Timecode"].shape[0]
    for key in npz_data:
        if key not in ["Timecode", "BlendShapeCount", "n_frames"]:  # 跳过非形状键的数据
            shape_key_b_format = shape_key_mapping.get(key)
            if shape_key_b_format:
                data[shape_key_b_format] = npz_data[key].tolist()
            else:
                logger.warning(f"No B format mapping found for '{key}'")
    return data, frame_count


def audio2face(context):
    wav_file: str = context.scene.face_audio_file
    folder_path = Path(__file__).parent
    model_name: str = context.scene.face_model_ui
    emo_name: str = context.scene.emotion_ui
    save_path = folder_path / "temp_data"
    os.makedirs(save_path, exist_ok=True)
    if emo_name == "" or emo_name == "None":
        results = generate_face_data(wav_file, model_name, "Undefined_Natural", save_path, callback=None)
    else:
        results = generate_face_data(wav_file, model_name, emo_name, save_path, callback=None)
    context.scene.face_anim_file = str(results or "")


def face_anim_import(context):
    obj = context.scene.buffer_body
    file_path = context.scene.face_anim_file
    _, ext = os.path.splitext(file_path)

    if ext == ".csv":
        data, frame_count = process_csv_data(file_path)
    elif ext == ".npz":
        data, frame_count = process_npz_data(file_path)
    else:
        logger.error(f"Unsupported file format: {ext}")
        return

    for key, values in data.items():
        if key in obj.data.shape_keys.key_blocks:
            logger.debug(f"Processing key: {key}")
            fcurve = create_fcurve_for_shape_key(obj, key, frame_count)

            for i, keyframe in enumerate(fcurve.keyframe_points):
                frame = int(keyframe.co.x)
                value = values[i]
                keyframe.co.y = value
                logger.debug(f"frame: {frame}, value: {value}")
        no_prefix = re.sub(r"^A\d+_", "", key)
        parts = no_prefix.split("_")
        key = parts[0].lower() + "".join(word.capitalize() for word in parts[1:])
        if key in obj.data.shape_keys.key_blocks:
            logger.debug(f"Processing key: {key}")
            fcurve = create_fcurve_for_shape_key(obj, key, frame_count)

            for i, keyframe in enumerate(fcurve.keyframe_points):
                frame = int(keyframe.co.x)
                value = values[i]
                if key.startswith("mouth"):
                    keyframe.co.y = value
                elif key.startswith("brow"):
                    keyframe.co.y = value * 1.5
                else:
                    keyframe.co.y = value
                logger.debug(f"frame: {frame}, value: {value}")
