import os

import bpy
import numpy as np

from .....assets.resource_manager import Config
from .....utils.logging import logger
from ....retarget.retarget_functions.constants import STANDARD_RIGHT_LEG_JOINTS
from .blend_bone_mapping import blend_bone_mapping


def add_qt_armature():
    folder_path = Config.folder_path
    blend_path = os.path.join(folder_path, "QingTong.blend")

    appended_objects = []
    with bpy.data.libraries.load(blend_path) as (data_from, data_to):
        data_to.objects = data_from.objects
    for obj in data_to.objects:
        if obj is not None:
            bpy.context.collection.objects.link(obj)
            appended_objects.append(obj)
    logger.debug("Add armature: %s", [obj.name for obj in appended_objects])
    qt_armature_name = appended_objects[-1].name
    return qt_armature_name


def delete_object(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.delete()


def delete_object_completely(obj):
    if not obj:
        return

    # Record the object's name and data name for reference after deletion
    obj_name = obj.name
    data_name = obj.data.name if obj.data else None

    # Clear the object's animation data (if any)
    if obj.animation_data:
        obj.animation_data_clear()

    # Remove the object from the scene
    if obj_name in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)

    # Delete the object's Armature data block (if any)
    if data_name and data_name in bpy.data.armatures:
        bpy.data.armatures.remove(bpy.data.armatures[data_name], do_unlink=True)

    # Delete actions (animations) related to the object
    for action in list(bpy.data.actions):
        if action.users == 0:  # Only delete actions that are not referenced by other objects
            bpy.data.actions.remove(action, do_unlink=True)
    logger.debug(f"Object {obj_name} and its related data have been deleted.")


def switch_mode(obj, target_mode):
    if obj is None:
        return

    current_mode = obj.mode

    if current_mode != target_mode:
        bpy.ops.object.mode_set(mode=target_mode)


def check_armature_vaild(self, context, armature: bpy.types.Object, check_animation: bool = True):
    if not armature:
        self.report({'ERROR'}, "Please select armatare.")
        return False

    if armature.type != 'ARMATURE':
        self.report({'ERROR'}, f"Selected object '{armature.name}' is not an Armature.")
        return False

    if armature.hide_viewport:
        self.report({'ERROR'}, f"Armature '{armature.name}' is hidden in the viewport.")
        return False

    view_layer = context.view_layer
    if not armature.visible_get(view_layer=view_layer):
        self.report({'ERROR'}, f"Armature '{armature.name}' is not available in current view layer.")
        return False

    if check_animation:
        if not (armature.animation_data and armature.animation_data.action):
            self.report({'ERROR'}, f"Armature {armature.name} has no animation data.")
            return False

    return True


def set_nla_strips_influence(armature: bpy.types.Object, track_name="Merged_Fix_Sliding_Track", influence=1.0):
    """
    Set the influence of all NLA strips in the specified track to a given value.

    Args:
        armature (bpy.types.Object): The armature object.
        track_name (str): The name of the NLA track.
        influence (float): The influence value to set.
    """
    if not armature.animation_data:
        return

    for track in armature.animation_data.nla_tracks:
        if track.name == track_name:
            for strip in track.strips:
                strip.influence = influence


def bake_specific_nla_track_to_keyframes(
    armature: bpy.types.Object,
    target_track_name: str,
    baked_action_name: str = "Baked_Specific_Action",
    start_frame: int = 1,
    end_frame: int = 250,
):
    """
    Bake only the specified NLA track to keyframes.

    Parameters:
        armature (bpy.types.Object): The armature object.
        target_track_name (str): The name of the target NLA track to bake.
        baked_action_name (str): The name of the baked action.
        start_frame (int): The starting frame for baking.
        end_frame (int): The ending frame for baking.
    """
    if not armature.animation_data:
        logger.error("Armature has no animation data.")
        return

    nla_tracks = armature.animation_data.nla_tracks

    # Check if the target track exists
    target_track = None
    for track in nla_tracks:
        if track.name == target_track_name:
            target_track = track
            break
    if not target_track:
        logger.error(f"NLA track '{target_track_name}' not found.")
        return

    # Save the current mute states of all tracks
    original_mute_states = {track: track.mute for track in nla_tracks}

    try:
        # Unmute only the target track, mute all others
        for track in nla_tracks:
            if track == target_track:
                track.mute = False
            else:
                track.mute = True

        # Create a new action for baking
        baked_action = bpy.data.actions.new(name=baked_action_name)
        armature.animation_data.action = baked_action

        # Switch to POSE mode and ensure all bones are selected
        bpy.ops.object.mode_set(mode="OBJECT")
        bpy.ops.object.mode_set(mode="POSE")
        bpy.ops.pose.select_all(action='SELECT')

        # Perform the baking operation, writing the result into the new action
        bpy.ops.nla.bake(
            frame_start=int(start_frame),
            frame_end=int(end_frame),
            step=1,
            visual_keying=True,
            clear_constraints=True,
            use_current_action=True,  # Write baking results into the current action
            bake_types={"POSE"},
        )
        logger.debug(f"The NLA track '{target_track_name}' has been baked into the action '{baked_action_name}'.")

        # Check if the baked action contains any F-Curves
        if not baked_action.fcurves:
            logger.error(f"The baked action '{baked_action_name}' does not contain any F-Curves.")
            return

        logger.debug(f"The action '{baked_action_name}' contains {len(baked_action.fcurves)} F-Curves.")

        nla_tracks.remove(target_track)
        logger.debug(f"The target NLA track '{target_track_name}' has been removed.")

    finally:
        # Restore the original mute states
        for track, mute in original_mute_states.items():
            track.mute = mute


def merge_strips_and_bake(
    armature: bpy.types.Object,
    strips_names: list,
    target_track_name: str = "Merged_Track",
    baked_action_name: str = "Baked_Merged_Action",
    start_frame: int = 1,
    end_frame: int = 250,
):
    """
    将指定的三个 NLA 条带合并到一个 NLA 轨道中，并将其烘焙为一个新的动作。

    参数:
        armature (bpy.types.Object): 骨架对象。
        strip_names (list): 要合并的三个 NLA 条带的名称列表。
        target_track_name (str): 目标 NLA 轨道的名称。
        baked_action_name (str): 烘焙后的动作名称。
        start_frame (int): 烘焙的起始帧。
        end_frame (int): 烘焙的结束帧。
    """
    if not armature.animation_data:
        logger.error("Armature has no animation data.")
        return

    nla_tracks = armature.animation_data.nla_tracks

    # 获取现有轨道和动作的名称
    existing_track_names = {track.name for track in nla_tracks}
    existing_action_names = {action.name for action in bpy.data.actions}

    # 根据提供的名称检索条带
    strips_to_merge = []
    for strip_name in strips_names:
        found = False
        for track in nla_tracks:
            for strip in track.strips:
                if strip.name == strip_name:
                    strips_to_merge.append(strip)
                    found = True
                    break
            if found:
                break
        if not found:
            logger.error(f"NLA strip named '{strip_name}' not found.")
            return

    # 获取或创建目标 NLA 轨道
    target_track = None
    for track in nla_tracks:
        if track.name == target_track_name:
            target_track = track
            break
    if not target_track:
        unique_track_name = get_unique_name(existing_track_names, target_track_name)
        target_track = nla_tracks.new()
        target_track.name = unique_track_name
        logger.debug(f"New NLA track '{unique_track_name}' has been created.")

    def move_strip_to_track(strip, target_track):
        """
        将一个 NLA 条带移动到目标轨道。

        参数:
            strip (bpy.types.NlaStrip): 要移动的条带。
            target_track (bpy.types.NlaTrack): 目标 NLA 轨道。
        """
        logger.debug(f"Moving strip '{strip.name}' to track '{target_track.name}'.")

        # 在目标轨道上创建一个新的条带，复制原条带的属性
        new_strip = target_track.strips.new(name=strip.name, start=int(strip.frame_start), action=strip.action)

        # 复制其他属性
        new_strip.action_frame_start = strip.action_frame_start
        new_strip.action_frame_end = strip.action_frame_end

    # 移动每个条带到目标轨道
    for strip in strips_to_merge:
        move_strip_to_track(strip, target_track)

    target_track.mute = False

    # 设置目标轨道中所有条带的影响力为 1.0
    set_nla_strips_influence(armature, track_name=target_track.name, influence=1.0)

    # 创建唯一的烘焙动作名称
    unique_action_name = get_unique_name(existing_action_names, baked_action_name)

    # 烘焙合并后的 NLA 轨道到关键帧
    bake_specific_nla_track_to_keyframes(
        armature=armature,
        target_track_name=target_track.name,
        baked_action_name=unique_action_name,
        start_frame=start_frame,
        end_frame=end_frame,
    )

    logger.debug(
        f"Strips {strips_names} merged into track '{target_track.name}' and baked into action '{unique_action_name}'."
    )


def get_keyframe_points_from_strips(armature, strips_names: list):
    """
    获取多个指定 NLA Strips 上的关键帧
    :param armature: Blender 对象，通常为 Armature
    :param strips_names: 目标 NLA Strips 名称列表
    :return: 所有关键帧时间点的集合
    """
    # 确保对象有动画数据
    if not armature.animation_data or not armature.animation_data.nla_tracks:
        logger.debug("No NLA tracks available.")
        return set()  # 返回空集合

    # 初始化关键帧集合
    keyframe_points = set()

    # 遍历所有轨道和条目
    for track in armature.animation_data.nla_tracks:
        for strip in track.strips:
            if strip.name in strips_names:  # 检查是否在目标列表中
                action = strip.action
                if action is None:
                    logger.debug(f"Strip '{strip.name}' has no associated action.")
                    continue

                # 取得这个 Strip 在原 Action 中使用到的帧区间
                act_start = strip.action_frame_start
                act_end = strip.action_frame_end

                for fcurve in action.fcurves:
                    for keyframe in fcurve.keyframe_points:
                        frame = keyframe.co[0]
                        # 只添加位于 strip 用到的 [act_start, act_end] 范围内的关键帧
                        if act_start <= frame <= act_end:
                            keyframe_points.add(frame)

    # 返回所有关键帧时间点的集合
    logger.debug(f"Collected keyframes for strips {strips_names}: {sorted(keyframe_points)}")
    return sorted(list(keyframe_points))


def trim_action_frames(armature, start_frame, end_frame):
    """
    在指定的动作上删除帧范围外的关键帧，并将结果 Push Down 到 NLA 轨道。

    参数:
        armature (bpy.types.Object): 目标骨架对象。
        start_frame (float): 起始帧。
        end_frame (float): 结束帧。
    """
    # 检查动画数据和动作
    if not armature.animation_data or not armature.animation_data.action:
        logger.warning("Armature has no animation data.")
        return

    action = armature.animation_data.action

    # 遍历所有 F-Curve 并删除帧范围外的关键帧
    for fcurve in action.fcurves:
        keyframes_to_keep = []  # 需要保留的关键帧索引
        for i, keyframe in enumerate(fcurve.keyframe_points):
            frame = keyframe.co[0]
            if start_frame <= frame <= end_frame:
                keyframes_to_keep.append(i)

        # 删除关键帧范围外的帧
        for i in reversed(range(len(fcurve.keyframe_points))):
            if i not in keyframes_to_keep:
                fcurve.keyframe_points.remove(fcurve.keyframe_points[i])

    logger.debug(f"Keyframes outside range [{start_frame}, {end_frame}] have been removed from '{action.name}'.")


def convert_action_to_nla_track(armature: bpy.types.Object):
    """
    直接把action推到NLA中
    """
    if not armature.animation_data or not armature.animation_data.action:
        logger.warning("Armature has no animation data.")
        return

    anim_data = armature.animation_data
    action = anim_data.action

    # 新建一个 NLA Track
    track = anim_data.nla_tracks.new()

    track_name = f"inbetween_{action.name}"
    track.name = track_name

    # 在此Track中新建一个Strip
    _ = track.strips.new(name=f"Transition_{action.name}", start=int(action.frame_range[0]), action=action)

    # 最后记得把当前action移除，否则依然算是绑定在Armature上
    anim_data.action = None

    logger.debug(f"Action {action.name} has been pushed down to NLA. ")
    return track_name


def get_selected_keyframes(armature):
    # 确保对象有动画数据
    if not armature or not armature.animation_data or not armature.animation_data.action:
        return None

    action = armature.animation_data.action

    # 提取选中的关键帧
    selected_keyframes = set()
    for fcurve in action.fcurves:
        for keyframe in fcurve.keyframe_points:
            if keyframe.select_control_point:  # 检查关键帧是否被选中
                selected_keyframes.add(int(keyframe.co[0]))  # 添加帧号

    # 按帧号排序并输出
    sorted_keyframes = list(sorted(selected_keyframes))
    return sorted_keyframes


def select_target_keyframes(armature, target_frames):
    # 确保对象有动画数据
    if not armature.animation_data or not armature.animation_data.action:
        return

    action = armature.animation_data.action

    # 转换目标帧为集合，方便快速查询
    target_frames = set(target_frames)

    # 遍历所有 F-Curve
    for fcurve in action.fcurves:
        # 遍历 F-Curve 的所有关键帧
        for keyframe in fcurve.keyframe_points:
            frame = int(keyframe.co[0])
            # 如果帧号在目标列表中，设置为选中状态
            if frame in target_frames:
                keyframe.select_control_point = True  # 选中关键帧
            else:
                keyframe.select_control_point = False  # 取消选中其他帧

    # 刷新 Blender 视图
    bpy.context.area.tag_redraw()


def get_selected_nla_strips(armature):
    """
    获取当前选中的 NLA Strips
    :param armature: Blender 对象，通常为 Armature
    :return: 选中的 NLA Strip 列表
    """
    if not armature or not armature.animation_data or not armature.animation_data.nla_tracks:
        return None

    selected_strips = []

    # 遍历所有 NLA 轨道
    for track in armature.animation_data.nla_tracks:
        for strip in track.strips:
            if strip.select:  # 检查 NLA Strip 是否被选中
                selected_strips.append(strip)

    return selected_strips


""" utils funcs """


def get_unique_name(existing_names, base_name):
    """
    为目标名称生成唯一的名称，避免与现有名称冲突。

    参数:
        existing_names (set): 已存在的名称集合。
        base_name (str): 基础名称。

    返回:
        str: 唯一名称。
    """
    if base_name not in existing_names:
        return base_name

    counter = 1
    while f"{base_name}.{counter}" in existing_names:
        counter += 1
    return f"{base_name}.{counter}"


def get_leg_length(armature: bpy.types.Object):
    bone_mapping_dict = blend_bone_mapping(armature)

    right_leg_names = [bone_mapping_dict[name] for name in STANDARD_RIGHT_LEG_JOINTS[:-1] if name in bone_mapping_dict]

    if len(right_leg_names) <= 1:
        return 0

    leg_length = 0.0
    for i in range(1, len(right_leg_names)):
        bone_head = armature.pose.bones[right_leg_names[i]].head
        parent_bone_head = armature.pose.bones[right_leg_names[i - 1]].head

        bone_len = np.linalg.norm(np.array(bone_head) - np.array(parent_bone_head))
        leg_length += bone_len

    return leg_length


def get_scale(src_arm: bpy.types.Object, tgt_arm: bpy.types.Object):
    src_leg_len = get_leg_length(src_arm)
    tgt_leg_len = get_leg_length(tgt_arm)

    scale = tgt_leg_len / (src_leg_len + 1e-6)

    return scale
