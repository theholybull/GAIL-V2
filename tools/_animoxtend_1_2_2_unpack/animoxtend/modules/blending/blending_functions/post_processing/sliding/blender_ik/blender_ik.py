import logging

import bpy
import numpy as np
from mathutils import Matrix

from ....utils.npz_export import find_root_bone_name

logger = logging.getLogger("animoxtend")


############## add ik constraints ################
def create_ik_assist_bone(armature: bpy.types.Object, src_bone_name, ik_assist_bone_name='foot_ik'):
    """
    Create an IK auxiliary bone. The auxiliary bone is used to control ik chain.

    Args:
        armature (bpy.types.Object): The armature object.
        foot_toe_child_bone_name (str): The name of the foot_toe_child bone.
        foot_ik_bone_name (str, optional): The name of the IK auxiliary bone. Defaults to 'foot_ik'.

    Returns:
        bpy.types.PoseBone: The created IK auxiliary bone.
    """
    bpy.ops.object.mode_set(mode='EDIT')
    edit_bones: bpy.types.ArmatureEditBones = armature.data.edit_bones

    if ik_assist_bone_name not in edit_bones:
        try:
            src_edit_bone: bpy.types.EditBone = edit_bones[src_bone_name]
            logger.debug("Found child edit bone %s.", src_bone_name)
        except KeyError:
            logger.exception(f"Bone '{src_bone_name}' not found in armature '{armature.name}'.")
            bpy.ops.object.mode_set(mode='POSE')
            return None

        # 创建 foot_ik_bone
        ik_assist_bone = edit_bones.new(ik_assist_bone_name)
        ik_assist_bone.head = src_edit_bone.head.copy()
        ik_assist_bone.tail = src_edit_bone.tail.copy()
        ik_assist_bone.roll = src_edit_bone.roll
        ik_assist_bone.use_connect = False
        ik_assist_bone.parent = None  # 可以根据需要设置父级
        logger.debug("Created new edit bone %s at location %s.", ik_assist_bone_name, ik_assist_bone.head)
    else:
        ik_assist_bone = edit_bones[ik_assist_bone_name]
        logger.debug("Edit bone %s already exists.", ik_assist_bone_name)

    bpy.ops.object.mode_set(mode='POSE')
    return armature.pose.bones.get(ik_assist_bone_name)


def setup_ik_constraints(armature: bpy.types.Object, tgt_bone_name, ik_assist_bone_name, chain_length=4):
    """
    Set up IK constraints to the foot_toe_bone.

    Args:
        armature (bpy.types.Object): The armature object.
        tgt_bone_name (str): The name of the bone need to add ik constraints.
        ik_assist_bone_name (str): The name of the IK auxiliary bone.
        chain_length (int, optional): The chain length. Defaults to 4.

    Return:
        ik constraint: The IK constraint object.
    """
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode='POSE')

    pose_bones = armature.pose.bones

    tgt_bone = pose_bones.get(tgt_bone_name)
    ik_assist_bone = pose_bones.get(ik_assist_bone_name)

    if not tgt_bone or not ik_assist_bone:
        logger.debug("Target bone not found !")
        return None

    # 添加 IK 约束到 foot_toe_bone
    ik_constraint = tgt_bone.constraints.get('Foot_IK_Constraint')
    if not ik_constraint:
        ik_constraint = tgt_bone.constraints.new(type='IK')
        ik_constraint.name = 'Foot_IK_Constraint'
        ik_constraint.target = armature
        ik_constraint.subtarget = ik_assist_bone_name
        ik_constraint.chain_count = int(chain_length)
        ik_constraint.use_tail = True
        ik_constraint.use_stretch = True
        ik_constraint.influence = 0.0  # 初始影响力为 0
        logger.debug("Added IK constraint to %s.", tgt_bone_name)
    else:
        logger.debug("IK constraint already exists on %s.", tgt_bone_name)

    return ik_constraint


def auto_set_ik_keyframes_with_fade(
    armature: bpy.types.Object,
    tgt_bone_name,
    start_frame,
    end_frame,
    ik_constraint_name='Foot_IK_Constraint',
    start_fade=5,
    end_fade=5,
):
    """
    Automatically set IK keyframes with fade.
    Mainly used to adjust ik influence.

    Args:
        armature (bpy.types.Object): The armature object.
        tgt_bone_name (str): The name of the bone with ik constraints which needs to adjust influence.
        start_frame (int): The start frame.
        end_frame (int): The end frame.
        ik_constraint_name (str, optional): The name of the IK constraint. Defaults to 'Foot_IK_Constraint'.
        start_fade (int, optional): The start fade frame. Defaults to 5.
        end_fade (int, optional): The end fade frame. Defaults to 5.

    Return:
        None
    """
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode='POSE')

    pose_bones = armature.pose.bones
    tgt_bone = pose_bones.get(tgt_bone_name)

    if not tgt_bone:
        logger.debug("Bone %s not found.", tgt_bone_name)
        return

    ik_constraint = tgt_bone.constraints.get(ik_constraint_name)
    if not ik_constraint:
        logger.debug("IK Constraint %s not found on bone %s.", ik_constraint_name, tgt_bone_name)
        return

    # 在 start_frame - fade_length 到 start_frame 之间渐变到 1.0
    for i in range(start_fade + 1):
        frame = start_frame - start_fade + i
        influence = i / start_fade
        bpy.context.scene.frame_set(frame)
        ik_constraint.influence = influence
        ik_constraint.keyframe_insert(data_path='influence', frame=frame)

    # 在 end_frame 到 end_frame + fade_length 之间渐变回 0.0
    for i in range(end_fade + 1):
        frame = end_frame + i
        influence = 1.0 - (i / end_fade)
        bpy.context.scene.frame_set(frame)
        ik_constraint.influence = influence
        ik_constraint.keyframe_insert(data_path='influence', frame=frame)


############## make ik influence to nla ###########
def fk_frame(armature: bpy.types.Object, tgt_bone_name: str, tgt_frame: int):
    """
    Get target global matrix at target frame. i.e.
    Mainly used to get tgt bone global pos at target frame.
    Note: This is from tgt bone to root

    Args:
        armature (bpy.types.Object): The armature object.
        tgt_bone_name (str): The name of the target bone.
        tgt_frame (int): The target frame.

    Return:
        Matrix: The target global matrix at target frame.
    """
    tgt_bone = armature.pose.bones.get(tgt_bone_name)

    chain = []
    root_bone_name = find_root_bone_name(armature)
    root_bone = armature.pose.bones.get(root_bone_name)

    # 构建从 target_bone 到 root_bone 的骨骼链
    chain = []
    cur_bone = tgt_bone

    while cur_bone:
        chain.append(cur_bone)
        if cur_bone == root_bone:
            break
        cur_bone = cur_bone.parent

    bpy.context.scene.frame_set(tgt_frame)
    matrixs = []
    for i, bone in enumerate(reversed(chain)):
        if i == 0:
            matrixs.append(armature.matrix_world @ bone.bone.matrix_local @ bone.matrix_basis)
        else:
            relative_matrix = matrixs[i - 1] @ bone.parent.bone.matrix_local.inverted() @ bone.bone.matrix_local
            matrixs.append(relative_matrix @ bone.matrix_basis)

    return matrixs[-1]


def create_fix_action(armature: bpy.types.Object, ik_assist_bone_name, src_bone_name, start_frame, end_frame):
    """
    Add ik assist bone fix position to action.

    Args:
        armature (bpy.types.Object): The armature object.
        ik_assist_bone_name (str): The name of the ik assist bone.
        src_bone_name (str): The name of the source bone, i.e. the bone that the ik assist bone is attached to.
        start_frame (int): The start frame of the action.
        end_frame (int): The end frame of the action.

    Returns:
        fix_strip(bpy.types.NlaStrip): The created fix strip.
    """
    # 创建一个新的动作
    fix_action = bpy.data.actions.new(name="Fix_Sliding_Action")

    # 创建一个新的 NLA 轨道并添加动作条
    if not armature.animation_data:
        armature.animation_data_create()
    nla_track = armature.animation_data.nla_tracks.new()
    nla_track.name = "Fix_Sliding_Track"

    # 添加动作条到 NLA 轨道
    fix_strip = nla_track.strips.new(name="Fix_Sliding_Strip", start=start_frame, action=fix_action)
    fix_strip.action_frame_start = 0  # 动作在 Strip 内的开始帧
    fix_strip.action_frame_end = end_frame - start_frame  # 动作在 Strip 内的持续帧数

    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode='POSE')

    ik_assist_bone = armature.pose.bones.get(ik_assist_bone_name)
    if not ik_assist_bone:
        logger.debug("Bone %s not found.", ik_assist_bone_name)
        return None

    loc = None

    src_glb_matrix = fk_frame(armature, src_bone_name, start_frame)
    src_glb_matrix = np.array(src_glb_matrix)

    # 不使用0来约束
    # src_glb_matrix[2, 3] = 0
    src_glb_matrix = Matrix(src_glb_matrix)

    ik_assist_arm_matrix = (
        ik_assist_bone.bone.matrix_local.inverted() @ armature.matrix_world.inverted() @ src_glb_matrix
    )

    ik_assist_local_pos = ik_assist_arm_matrix.to_translation()

    # todo: use mean 管理赋值
    # range_src_glb_matrixs = []
    # for frame in range(start_frame, end_frame + 1):
    #     src_glb_matrix = fk_frame(armature, src_bone_name, start_frame)
    #     src_glb_matrix = np.array(src_glb_matrix)

    #     range_src_glb_matrixs.append(src_glb_matrix)

    # range_src_glb_matrixs = np.array(range_src_glb_matrixs)
    # range_src_glb_mean_pos = np.mean(range_src_glb_matrixs[:, :3, 3], axis=0, keepdims=True)

    # mean_pos = Vector(range_src_glb_mean_pos[0, :3])

    # if start_frame == 131 and end_frame == 151:
    #     mean_pos = Vector([ 0.11123204, -6.85253659,  0.02014402])

    # src_bone = armature.pose.bones.get(src_bone_name)
    # a = 1

    # # ground height
    # # src_glb_matrix[2, 3] = 0
    # src_glb_matrix = Matrix(src_glb_matrix)

    # tmp_matrix = ik_assist_bone.bone.matrix_local.inverted() @ armature.matrix_world.inverted()

    # ik_assist_arm_matrix = (
    #     tmp_matrix @ src_glb_matrix
    # )

    # ik_assist_local_pos = ik_assist_arm_matrix.to_translation()

    # ik_assist_local_pos = tmp_matrix.to_3x3() @ mean_pos

    # 锁定位置和旋转，并插入关键帧（相对于动作的开始）
    for _, frame in enumerate(range(start_frame, end_frame + 1)):
        bpy.context.scene.frame_set(frame)
        # 保持当前位置和旋转
        if loc is None:
            loc = ik_assist_local_pos

        ik_assist_bone.location = loc
        ik_assist_bone.keyframe_insert(data_path="location", frame=frame)

    return fix_strip  # 返回创建的 Strip


def add_fix_action_to_nla(fix_strip: bpy.types.NlaStrip):
    if not fix_strip:
        logger.debug("Fix_Sliding_Strip 不存在，无法添加。")
        return False

    # 设置叠加模式
    fix_strip.blend_type = 'REPLACE'  # 使用 blend_type 代替 action_blend
    fix_strip.influence = 1.0

    return True


############## fix sliding segments func ##############
def fix_sliding_auto_ik_animation_layer(
    armature_name,
    tgt_bone_name,
    src_bone_name,
    ik_assist_bone_name='foot_ik',
    start_frame=0,
    end_frame=0,
    chain_length=4,
    start_fade=5,
    end_fade=5,
):
    """
    Fix sliding by using Auto IK Keyframes + Animation Layer Editing

    Args:
        armature_name (str): The name of the armature object.
        tgt_bone_name (str): The name of the target bone.
                            Note: this is the bone that need to add ik constraint !!!
        src_bone_name (str): The name of the source bone,
                            Note: this is the bone that the ik assist bone is created used,
                                                and it should be the child of the target bone !!!
        ik_assist_bone_name (str): The name of the ik assist bone. Defaults to 'foot_ik'.
        start_frame (int): The start frame of the action. Defaults to 0.
        end_frame (int): The end frame of the action. Defaults to 0.
        chain_length (int): The length of the ik chain. Defaults to 4.
        start_fade (int): The start frame of the fade. Defaults to 5.
        end_fade (int): The end frame of the fade. Defaults to 5.
    """
    logger.debug("Start using Auto IK Keyframes + Animation Layer Editing to fix sliding ......")

    armature = bpy.data.objects.get(armature_name)
    if not armature:
        logger.debug("Armature %s not found.", armature_name)
        return

    # 创建 IK 辅助骨骼
    ik_assist_bone = create_ik_assist_bone(armature, src_bone_name, ik_assist_bone_name)
    if not ik_assist_bone:
        logger.debug("Failed to create IK assist bone. ")
        return

    # 设置 IK 约束
    ik_constraint = setup_ik_constraints(armature, tgt_bone_name, ik_assist_bone_name, int(chain_length))
    if not ik_constraint:
        logger.debug("Failed to setup IK constraints. ")
        return

    # 自动设置 IK 关键帧，并实现渐变
    auto_set_ik_keyframes_with_fade(
        armature,
        tgt_bone_name,
        start_frame,
        end_frame,
        ik_constraint_name='Foot_IK_Constraint',
        start_fade=start_fade,
        end_fade=end_fade,
    )

    # 创建修正动作并获取 Strip
    fix_strip = create_fix_action(
        armature,
        ik_assist_bone_name,
        src_bone_name,
        start_frame,
        end_frame,
    )
    if not fix_strip:
        logger.debug("Failed to create fix action. ")
        return

    # 叠加修正动作到 NLA
    flag = add_fix_action_to_nla(fix_strip)

    if flag:
        logger.debug("Finished using Auto IK Keyframes + Animation Layer Editing to fix sliding. ")
    else:
        logger.debug("Failed to add fix action to NLA. ")


def fix_sliding_multiple_segments(
    armature_name: str,
    tgt_bone_name: str,
    src_bone_name: str,
    ik_assist_bone_name: str = 'foot_ik',
    segments: list = None,
    chain_length: int = 4,
):
    """
    修复多个时间段内的滑步问题，复用辅助骨骼和约束。

    Args:
        armature_name (str): 骨架对象名称
        foot_toe_bone_name (str): 目标骨骼名称
        foot_toe_child_bone_name (str): 子骨骼名称
        segments (list): 每个区间的信息列表，包含 (start_frame, end_frame, start_fade, end_fade)
        chain_length (int): IK 链长度
        foot_ik_bone_name (str): 辅助 IK 骨骼名称
    """
    logger.debug("Starting to fix multiple segments sliding ......")

    armature = bpy.data.objects.get(armature_name)
    if not armature:
        logger.debug("Armature %s not found.", armature_name)
        return

    ik_assist_bone = create_ik_assist_bone(armature, src_bone_name, ik_assist_bone_name)
    if not ik_assist_bone:
        logger.debug("Failed to create IK assist bone. ")
        return

    # 创建或获取 IK 约束
    ik_constraint = setup_ik_constraints(armature, tgt_bone_name, ik_assist_bone_name, int(chain_length))
    if not ik_constraint:
        logger.debug("Failed to setup IK constraints. ")
        return

    flag = True

    # 按区间修复滑步
    for segment in segments:
        start_frame, end_frame, start_fade, end_fade = segment

        # 自动设置 IK 关键帧，并实现渐变
        auto_set_ik_keyframes_with_fade(
            armature,
            tgt_bone_name,
            start_frame,
            end_frame,
            ik_constraint_name='Foot_IK_Constraint',
            start_fade=start_fade,
            end_fade=end_fade,
        )

        # 创建修正动作并获取 Strip
        fix_strip = create_fix_action(
            armature,
            ik_assist_bone_name,
            src_bone_name,
            start_frame,
            end_frame,
        )
        if not fix_strip:
            logger.debug("Failed to create fix action. ")
            continue

        # 叠加修正动作到 NLA
        cur_flag = add_fix_action_to_nla(fix_strip)
        flag = cur_flag & flag

    if flag:
        logger.debug("All segments have been fixed. ")
    else:
        logger.debug("Failed to add fix action to NLA. ")


def main():
    armature_name = 'Armature.005'
    #    foot_toe_bone_name = 'skeleton_0_LeftToeBase'
    #    foot_toe_child_bone_name = 'skeleton_0_LeftToeBaseEnd'

    foot_toe_bone_name = 'LeftToeBase'
    foot_toe_child_bone_name = 'LeftToe_End'

    chain_length = 4  # 根据实际骨骼链长度调整
    foot_ik_bone_name = 'foot_ik'

    # 定义时间段，每段为 (start_frame, end_frame, start_fade, end_fade)
    segments = [
        (41, 50, 2, 4),
        (71, 86, 1, 3),
    ]

    #    fix_sliding_multiple_segments(
    #        armature_name,
    #        foot_toe_bone_name,
    #        foot_toe_child_bone_name,
    #        segments,
    #        chain_length,
    #        foot_ik_bone_name,
    #    )

    foot_toe_bone_name = 'RightToeBase'
    foot_toe_child_bone_name = 'RightToe_End'
    chain_length = 4
    foot_ik_bone_name = 'foot_ik1'

    segments = [
        (31, 37, 2, 4),
    ]
    fix_sliding_multiple_segments(
        armature_name,
        foot_toe_bone_name,
        foot_toe_child_bone_name,
        foot_ik_bone_name,
        segments,
        chain_length,
    )


if __name__ == '__main__':
    main()
