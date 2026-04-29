import logging
from pathlib import Path
from typing import Any

import bpy
from mathutils import Matrix, Quaternion, Vector

from ...retarget.retarget_functions.automatic_bone_mapping import (
    automatic_bone_mapping,
)
from ...retarget.retarget_functions.constants import STANDARD_ROOT
from ..pipeline_functions.buffer_human_utils import setup_template_collection
from .client import retrieve_motion_by_text, save_npz

logger = logging.getLogger("animoxtend")


def get_fcurve(data_path: str, index: int, fcurves_map, action):
    """Get or create an fcurve for the current frame motion."""
    fcurve_key = (data_path, index)
    if fcurve_key in fcurves_map:
        fcurve = fcurves_map[fcurve_key]
    else:
        fcurve = fcurves_map.setdefault(fcurve_key, action.fcurves.new(data_path, index=index))
    return fcurve


def set_motion(armature, motion_rot_dict, motion_loc, root_name):
    import numpy as np

    """Apply motion data to armature."""
    anim_data = armature.animation_data
    armature.animation_data_clear()
    anim_data = armature.animation_data_create()
    action = bpy.data.actions.new("Action")
    anim_data.action = action
    fcurves_map = {(fc.data_path, fc.array_index): fc for fc in action.fcurves}

    n_frames, _ = motion_loc.shape
    default_quat = np.array([[1, 0, 0, 0]] * n_frames)  # 修改为数组形式
    frame_base = bpy.context.scene.frame_current

    for bone_name in armature.pose.bones.keys():
        data_path = f'pose.bones["{bone_name}"].rotation_quaternion'
        for idx in range(4):
            fcurve = get_fcurve(data_path=data_path, index=idx, fcurves_map=fcurves_map, action=action)
            fcurve.keyframe_points.add(count=n_frames)
            for f in range(n_frames):
                val = motion_rot_dict.get(bone_name, default_quat)
                if not isinstance(val, (list, np.ndarray)) or len(val) <= f:
                    logger.error(f"Error: {bone_name} at frame {f} has invalid value {val}")
                    val = default_quat[f][idx]
                else:
                    val = val[f][idx]
                fcurve.keyframe_points[f].co = (f + frame_base, val)
            fcurve.update()
        if bone_name == root_name:
            root_data_path = f'pose.bones["{bone_name}"].location'
            for idx in range(3):
                fcurve = get_fcurve(
                    data_path=root_data_path,
                    index=idx,
                    fcurves_map=fcurves_map,
                    action=action,
                )
                fcurve.keyframe_points.add(count=n_frames)
                for f in range(n_frames):
                    val = motion_loc[f][idx]
                    fcurve.keyframe_points[f].co = (f + frame_base, val)
                fcurve.update()

    action.frame_start = frame_base
    action.frame_end = frame_base + n_frames - 1


def load_npz(npz_dict: dict[str, Any], armature: "bpy.types.Object", root_name: str):
    import numpy as np

    """Load npz file and apply bone animations to the armature."""
    motion_rotmat = npz_dict["rotmat"]
    motion_loc = npz_dict["transl"]
    bone_names = list(npz_dict["joint_names"])
    #    root_name = str(npz_dict['root_name'])

    for b in armature.pose.bones:
        b.rotation_mode = "QUATERNION"

    T, J, _, _ = motion_rotmat.shape
    motion_quat = np.zeros((T, J, 4))
    for i in range(T):
        for j in range(J):
            mat = np.zeros((4, 4))
            mat[:3, :3] = motion_rotmat[i, j][:3, :3]
            mat = Matrix(mat)
            quat = mat.to_quaternion()
            motion_quat[i, j, :] = list(quat)

    motion_rot_dict = {}
    for i, name in enumerate(bone_names):
        motion_rot_dict[name] = motion_quat[:, i]

    root = armature.pose.bones.get(root_name)

    for i in range(T):
        loc = motion_loc[i]
        rest_mat = armature.matrix_world @ root.bone.matrix_local
        mat = Matrix.Translation(Vector(loc))
        loc = (rest_mat.inverted() @ mat).to_translation()
        motion_loc[i] = list(loc)

    set_motion(armature, motion_rot_dict, motion_loc, root.name)
    return armature


def text2motion(self, context) -> tuple[list[None] | None, list[None] | None]:
    """Get motions by user-input text."""
    keyword = context.scene.motion_keyword
    topk = context.scene.motion_topk
    if all("\u0000" <= char <= "\u007f" for char in keyword):
        language = "en"
    else:
        language = "ch"
    annotation_list, motion_url_list, error = retrieve_motion_by_text(keyword=keyword, topk=topk, language=language)

    if annotation_list is not None:
        # 不直接修改 scene，而是返回数据
        self.report({"INFO"}, "Motion Refreshed")
        return annotation_list, motion_url_list
    else:
        self.report({"ERROR"}, f"Refresh text motions: {error}")
        return None, None


def download_motion(self, context: "bpy.types.Context"):
    import numpy as np

    folder_path = Path(__file__).absolute().parent
    save_path = folder_path / "motion" / "temp_data"
    motion_target = context.scene.motion_ui.motion_ui_list
    index = motion_target.split("_")[-1]
    motion_url: str = context.scene["t2m_url_list"][int(index)]
    buffer_armature, buffer_body, buffer_eye = setup_template_collection(self, context)
    template_collection = bpy.data.collections.get("Template")

    target_armature = context.scene.buffer_armature
    target_root_name = None
    last_frame_root_transform = None

    # 检查是否有现有动画需要处理
    if target_armature.animation_data and target_armature.animation_data.action:
        # 如果toggle开启，记录root transform
        if context.scene.motion_toggle_state:
            # 获取目标骨架的root bone name
            bone_mapping = automatic_bone_mapping(target_armature)
            if bone_mapping[STANDARD_ROOT] not in ["", None]:
                target_root_name = bone_mapping[STANDARD_ROOT]
            else:
                target_root_name = target_armature.pose.bones[0].name

            if target_root_name and target_root_name in target_armature.pose.bones:
                current_action = target_armature.animation_data.action
                frame_end = int(current_action.frame_range[1])

                # 存储当前帧
                current_frame = context.scene.frame_current

                # 跳到最后一帧
                context.scene.frame_set(frame_end)

                root_bone = target_armature.pose.bones[target_root_name]
                last_frame_root_transform = {
                    "location": root_bone.location.copy(),
                    "rotation": root_bone.rotation_quaternion.copy(),
                }

                # 恢复当前帧
                context.scene.frame_set(current_frame)

        # 无论toggle状态如何，都处理NLA相关操作
        current_action = target_armature.animation_data.action
        frame_start = int(current_action.frame_range[0])
        frame_end = int(current_action.frame_range[1])
        track = target_armature.animation_data.nla_tracks.new()
        track.name = current_action.name
        strip = track.strips.new(name=current_action.name, start=frame_start, action=current_action)
        strip.frame_end = frame_end
        target_armature.animation_data.action = None

    # 下载并应用新动画
    if motion_url is not None:
        npz_file = save_npz(url=motion_url, save_folder=save_path, filename="tempfile.npz")
        npz_dict = dict(np.load(npz_file, allow_pickle=True))
        root_name = "pelvis"
        load_npz(npz_dict, buffer_armature, root_name)

        # 获取动画的帧数范围
        if buffer_armature.animation_data and buffer_armature.animation_data.action:
            frame_range = buffer_armature.animation_data.action.frame_range
            context.scene.frame_start = 0
            context.scene.frame_end = int(frame_range[0] + frame_range[1])
            context.scene.frame_current = int(frame_range[0])
    else:
        self.report({"ERROR"}, "Download_motion_error")
        return {"CANCELLED"}

    if target_armature.name != "BufferArmature":
        # 复制动画到buffer
        bpy.ops.object.select_all(action="DESELECT")
        buffer_armature.select_set(True)
        bpy.context.view_layer.objects.active = buffer_armature
        bpy.ops.animoxtend.copy_motion()
        buffer_armature.select_set(False)

        # 重定向到目标骨骼
        target_armature.select_set(True)
        bpy.context.view_layer.objects.active = target_armature
        try:
            bpy.ops.animoxtend.paste_motion()

            # 在重定向后，如果有记录的transform，应用到新动画
            if (
                last_frame_root_transform
                and target_root_name
                and target_root_name in target_armature.pose.bones
                and target_armature.animation_data
                and target_armature.animation_data.action
            ):
                action = target_armature.animation_data.action
                root_bone = target_armature.pose.bones[target_root_name]

                # 获取location和rotation的FCurves
                loc_fcurves = [
                    action.fcurves.find(f'pose.bones["{target_root_name}"].location', index=i) for i in range(3)
                ]
                rot_fcurves = [
                    action.fcurves.find(f'pose.bones["{target_root_name}"].rotation_quaternion', index=i)
                    for i in range(4)
                ]

                # 修改每一帧的值
                for frame in range(int(action.frame_range[0]), int(action.frame_range[1]) + 1):
                    # 修改location
                    for i in range(3):
                        if loc_fcurves[i]:
                            for kf in loc_fcurves[i].keyframe_points:
                                if kf.co[0] == frame:
                                    kf.co[1] += last_frame_root_transform["location"][i]

                    # 修改rotation (quaternion multiplication)
                    for i in range(4):
                        if rot_fcurves[i]:
                            for kf in rot_fcurves[i].keyframe_points:
                                if kf.co[0] == frame:
                                    current_quat = Quaternion([rot_fcurves[j].evaluate(frame) for j in range(4)])
                                    new_quat = last_frame_root_transform["rotation"] @ current_quat
                                    kf.co[1] = new_quat[i]

                # 更新FCurves
                for fc in loc_fcurves + rot_fcurves:
                    if fc:
                        fc.update()

        except RuntimeError as e:
            self.report({"ERROR"}, f"Retarget failed: {str(e)}")
            return {"CANCELLED"}

        template_collection.hide_viewport = True
        template_collection.hide_render = True

    return {"FINISHED"}
