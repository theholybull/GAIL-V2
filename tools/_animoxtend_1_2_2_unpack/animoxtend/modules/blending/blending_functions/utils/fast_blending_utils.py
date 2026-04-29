from copy import deepcopy

import numpy as np
from scipy.spatial.transform import Rotation as R

from ....retarget.retarget_functions.constants import STANDARD_LEFT_HAND_JOINTS, STANDARD_RIGHT_HAND_JOINTS
from .blend_bone_mapping import blend_bone_mapping


def orthogonalize_matrix(matrix):
    """
    对输入矩阵进行正交化。

    参数:
    - matrix (np.array): 需要正交化的矩阵。

    返回:
    - np.array: 正交化后的矩阵。
    """
    u, _, vh = np.linalg.svd(matrix)  # 对矩阵进行奇异值分解
    orthogonal_matrix = np.dot(u, vh)  # 重新组合得到正交化矩阵
    return orthogonal_matrix


def align_src_rotmat_to_tgt_restpose(
    rotmat: np.ndarray, src_restpose: dict, tgt_restpose: dict, root_idx_in_rotmat: int
):
    """将src rotmat对齐到tgt_restpose参考系下

    Args:
        rotmat (np.ndarray): _description_
        src_restpose (dict): _description_
        tgt_restpose (dict): _description_
    """
    tgt_matrix_world = np.array(tgt_restpose['matrix_world'])[:3, :3]
    src_matrix_world = np.array(src_restpose['matrix_world'])[:3, :3]

    tgt_matrix_world = orthogonalize_matrix(tgt_matrix_world)
    src_matrix_world = orthogonalize_matrix(src_matrix_world)

    src_2_tgt_mat = np.linalg.inv(src_matrix_world) @ tgt_matrix_world

    src_root_bone_name = src_restpose['root_bone_name']
    src_root_bone_idx = list(src_restpose['joint_names']).index(src_root_bone_name)

    src_top_bone_name = src_restpose['top_bone_name']
    src_top_bone_idx = list(src_restpose['joint_names']).index(src_top_bone_name)

    root_matrix_local = src_restpose['local_matrices'][src_root_bone_idx][:3, :3]

    if src_root_bone_name == src_top_bone_name:
        # hips无父骨骼
        root_matrix_basis = deepcopy(rotmat[:, root_idx_in_rotmat])
        root_arm_matrix = root_matrix_local @ root_matrix_basis

        root_arm_matrix = np.linalg.inv(src_2_tgt_mat) @ root_arm_matrix
        root_matrix_basis = np.linalg.inv(root_matrix_local) @ root_arm_matrix

        new_rotmat = deepcopy(rotmat)
        new_rotmat[:, root_idx_in_rotmat] = root_matrix_basis
    else:
        # hips有父骨骼
        top_matrix_local = src_restpose['local_matrices'][src_top_bone_idx][:3, :3]

        root_matrix_basis = deepcopy(rotmat[:, root_idx_in_rotmat])

        root_arm_matrix = top_matrix_local @ (root_matrix_local @ root_matrix_basis)

        new_root_arm_matrix = np.linalg.inv(src_2_tgt_mat) @ root_arm_matrix

        root_matrix_basis = np.linalg.inv(root_matrix_local) @ (np.linalg.inv(top_matrix_local) @ new_root_arm_matrix)

        new_rotmat = deepcopy(rotmat)
        new_rotmat[:, root_idx_in_rotmat] = root_matrix_basis

    return new_rotmat


def align_src_motion_to_tgt_restpose(
    src_motion_dict: dict,
    src_restpose: dict,
    tgt_restpose: dict,
):
    """将motion对齐到ref_restpose参考系下

    Args:
        motion_dict (dict): _description_
        ref_restpose (dict): _description_
        restpose (dict): _description_
    """
    ret_motion_dict = deepcopy(src_motion_dict)

    root_bone_name = src_restpose['root_bone_name']
    root_idx_in_rotmat = list(src_motion_dict['joint_names']).index(root_bone_name)

    # rotation
    rotmat = ret_motion_dict['rotmat']
    tgt_space_rotmat = align_src_rotmat_to_tgt_restpose(rotmat, src_restpose, tgt_restpose, root_idx_in_rotmat)

    ret_motion_dict['rotmat'] = tgt_space_rotmat

    return ret_motion_dict


def align_motion_dicts_to_blend(
    src_motion_dict1: dict, src_motion_dict2: dict, src_restpose1: dict, src_restpose2: dict, tgt_restpose: dict
):
    new_motion_dict1 = align_src_motion_to_tgt_restpose(
        src_motion_dict1,
        src_restpose1,
        tgt_restpose,
    )
    new_motion_dict2 = align_src_motion_to_tgt_restpose(
        src_motion_dict2,
        src_restpose2,
        tgt_restpose,
    )

    return new_motion_dict1, new_motion_dict2


def slerp(t, q0, q1):
    """
    Perform spherical linear interpolation (SLERP) between two quaternions.

    Args:
        t (float): Interpolation parameter between 0 and 1.
        q0 (np.ndarray): Starting quaternion (4,).
        q1 (np.ndarray): Ending quaternion (4,).

    Returns:
        np.ndarray: Interpolated quaternion (4,).
    """
    # Compute the dot product (cosine of the angle between quaternions)
    dot = np.dot(q0, q1)

    # Clamp the dot product to avoid numerical errors
    dot = np.clip(dot, -1.0, 1.0)

    # If the dot product is negative, negate one quaternion to take the shorter path
    if dot < 0.0:
        q1 = -q1
        dot = -dot

    DOT_THRESHOLD = 0.9995
    if dot > DOT_THRESHOLD:
        # The quaternions are very close, use linear interpolation
        result = q0 + t * (q1 - q0)
        return result / np.linalg.norm(result)

    # Calculate the angle between the quaternions
    theta_0 = np.arccos(dot)  # Initial angle
    sin_theta_0 = np.sin(theta_0)

    theta = theta_0 * t  # Angle at interpolation point
    sin_theta = np.sin(theta)
    sin_theta_m = np.sin(theta_0 - theta)

    s0 = sin_theta_m / sin_theta_0
    s1 = sin_theta / sin_theta_0

    return (s0 * q0) + (s1 * q1)


def interpolate_rotmat(start_rotmat, end_rotmat, frames):
    """
    Interpolate between two sets of rotation matrices using SLERP.

    Args:
        start_rotmat (np.ndarray): Starting rotation matrices, shape [1, num_joints, 3, 3].
        end_rotmat (np.ndarray): Ending rotation matrices, shape [1, num_joints, 3, 3].
        frames (int): Number of interpolation frames.

    Returns:
        np.ndarray: Interpolated rotation matrices, shape [frames, num_joints, 3, 3].
    """
    num_joints = start_rotmat.shape[1]  # 获取关节数量

    # 初始化插值后的旋转矩阵数组
    interpolated_rotmats = np.zeros((frames, num_joints, 3, 3), dtype=np.float32)

    # 生成时间插值参数 t_values
    t_values = np.linspace(0, 1, frames)

    # 遍历每个关节
    for j in range(num_joints):
        # 单个关节的开始和结束旋转矩阵
        single_start_rotmat = start_rotmat[0, j]
        single_end_rotmat = end_rotmat[0, j]

        # 转换为四元数
        start_quat = R.from_matrix(single_start_rotmat).as_quat()
        end_quat = R.from_matrix(single_end_rotmat).as_quat()

        # 四元数归一化
        start_quat = start_quat / np.linalg.norm(start_quat)
        end_quat = end_quat / np.linalg.norm(end_quat)

        # 进行 SLERP 插值
        interpolated_quats = np.array([slerp(t, start_quat, end_quat) for t in t_values])

        # 将插值后的四元数转换回旋转矩阵
        interpolated_single_rotmats = R.from_quat(interpolated_quats).as_matrix()

        # 存储插值结果
        interpolated_rotmats[:, j, :, :] = interpolated_single_rotmats

    return interpolated_rotmats


def linear_interp(
    motion_dict_a: dict, motion_dict_b: dict, front_change_frames: int = None, back_change_frames: int = None
):
    transl_front = motion_dict_a['transl']
    transl_back = motion_dict_b['transl']

    rotmat_front = motion_dict_a['rotmat']
    rotmat_back = motion_dict_b['rotmat']

    if front_change_frames is None:
        front_change_frames = len(transl_front) // 2
    if back_change_frames is None:
        back_change_frames = len(transl_back) // 2

    inter_frames = front_change_frames + back_change_frames

    transl_interp = np.linspace(transl_front[-front_change_frames], transl_back[back_change_frames], inter_frames)
    rotmat_interp = interpolate_rotmat(
        rotmat_front[-front_change_frames].reshape(1, -1, 3, 3),
        rotmat_back[:back_change_frames].reshape(1, -1, 3, 3),
        inter_frames,
    )

    ret_trans = np.concatenate(
        (transl_front[:-front_change_frames], transl_interp, transl_back[back_change_frames:]), axis=0
    )
    ret_rotmat = np.concatenate(
        (rotmat_front[:-front_change_frames], rotmat_interp, rotmat_back[back_change_frames:]), axis=0
    )

    assert len(ret_trans) == len(transl_front) + len(transl_back)

    ret_motion = deepcopy(motion_dict_a)
    ret_motion['transl'] = ret_trans
    ret_motion['rotmat'] = ret_rotmat
    ret_motion['len'] = len(transl_front) + len(transl_back)

    return ret_motion


def linear_interp_rotmat(
    motion_dict: dict, front_change_frames: int, back_change_frames: int, mid_idx: int, tgt_joints_idx=None
):
    rotmat = motion_dict['rotmat']
    ret_rotmat = deepcopy(rotmat)

    rotmat_front = rotmat[: mid_idx - front_change_frames, ...]
    if rotmat_front.shape[0] == 0:
        rotmat_front = rotmat[0].reshape(1, -1, 3, 3)
    rotmat_back = rotmat[mid_idx + back_change_frames :, ...]
    if rotmat_back.shape[0] == 0:
        rotmat_back = rotmat[-1].reshape(1, -1, 3, 3)

    if front_change_frames is None:
        front_change_frames = len(rotmat_front) // 2
    if back_change_frames is None:
        back_change_frames = len(rotmat_front) // 2

    inter_frames = front_change_frames + back_change_frames

    rotmat_interp = interpolate_rotmat(
        rotmat_front[-1].reshape(1, -1, 3, 3),
        rotmat_back[0].reshape(1, -1, 3, 3),
        inter_frames,
    )

    ret_rotmat[mid_idx - front_change_frames : mid_idx + back_change_frames, tgt_joints_idx, ...] = rotmat_interp[
        :, tgt_joints_idx, ...
    ]

    assert len(ret_rotmat) == len(rotmat)

    ret_motion = deepcopy(motion_dict)
    ret_motion['rotmat'] = ret_rotmat

    return ret_motion


def restore_hands(npz_dict_list, result_npz_dict, qt_armature, blend_setting):
    """_summary_

    Args:
        npz_dict_list (_type_): qt骨骼
        result_npz_dict (_type_): qt骨骼
        qt_armature (_type_): _description_
        blend_setting (_type_):
        blend_setting = {
            "trans_len": scene_blend_setting.trans_len,
            "pre_context_len": scene_blend_setting.pre_context_len,
            "pre_mask_len": scene_blend_setting.pre_mask_len,
            "next_context_len": scene_blend_setting.next_context_len,
            "next_mask_len": scene_blend_setting.next_mask_len,
        }
    """
    bone_mapping = blend_bone_mapping(qt_armature)

    left_hands = STANDARD_LEFT_HAND_JOINTS[2:]
    right_hands = STANDARD_RIGHT_HAND_JOINTS[2:]
    hand_names = left_hands + right_hands
    tgt_joints_names = list(result_npz_dict['joint_names'])

    for i in range(len(npz_dict_list)):
        npz_dict = npz_dict_list[i]
        src_joints_names = list(npz_dict['joint_names'])

        if i == 0:
            ret_slice = slice(0, npz_dict['len'] - blend_setting['pre_mask_len'])
            src_slice = slice(0, npz_dict['len'] - blend_setting['pre_mask_len'])
            mid_idx = npz_dict['len'] - blend_setting['pre_mask_len']
            front_change = min(3, blend_setting['pre_context_len'] - blend_setting['pre_mask_len'])
            back_change = 1
        else:
            start = npz_dict_list[0]['len'] + blend_setting['trans_len']
            ret_slice = slice(start + blend_setting['next_mask_len'], start + npz_dict_list[1]['len'])
            src_slice = slice(blend_setting['next_mask_len'], npz_dict_list[1]['len'])

            mid_idx = start + blend_setting['next_mask_len']
            front_change = 1
            back_change = min(3, blend_setting['next_context_len'] - blend_setting['next_mask_len'])

        tgt_hands_idx = []
        for hand_name in hand_names:
            qt_hand_name = bone_mapping[hand_name]

            if qt_hand_name in src_joints_names and qt_hand_name in tgt_joints_names:
                src_idx = src_joints_names.index(qt_hand_name)
                tgt_idx = tgt_joints_names.index(qt_hand_name)

                result_npz_dict['rotmat'][ret_slice, tgt_idx] = npz_dict['rotmat'][src_slice, src_idx]
                tgt_hands_idx.append(tgt_idx)

        result_npz_dict = linear_interp_rotmat(
            result_npz_dict,
            front_change_frames=front_change,
            back_change_frames=back_change,
            mid_idx=mid_idx,
            tgt_joints_idx=tgt_hands_idx,
        )

    return result_npz_dict


def restore_hands_v1(src_dict, tgt_dict, armature, seq_slice: list):
    """restore src hands to tgt

    Args:
        npz_dict_list (_type_): qt骨骼
        result_npz_dict (_type_): qt骨骼
        qarmature (_type_): qt armature
        blend_setting (_type_):
        blend_setting = {
            "trans_len": scene_blend_setting.trans_len,
            "pre_context_len": scene_blend_setting.pre_context_len,
            "pre_mask_len": scene_blend_setting.pre_mask_len,
            "next_context_len": scene_blend_setting.next_context_len,
            "next_mask_len": scene_blend_setting.next_mask_len,
        }
    """
    left_hands = STANDARD_LEFT_HAND_JOINTS[2:]
    right_hands = STANDARD_RIGHT_HAND_JOINTS[2:]
    hand_names = left_hands + right_hands

    src_joints_names = list(src_dict['joint_names'])
    tgt_joints_names = list(tgt_dict['joint_names'])

    pre_slice = slice(0, seq_slice[0])
    next_slice = slice(seq_slice[1], tgt_dict['len'])

    tgt_hands_idx = []
    for hand_name in hand_names:
        if hand_name in src_joints_names and hand_name in tgt_joints_names:
            src_idx = src_joints_names.index(hand_name)
            tgt_idx = tgt_joints_names.index(hand_name)
            tgt_hands_idx.append(tgt_idx)

            tgt_dict['rotmat'][pre_slice, tgt_idx] = src_dict['rotmat'][pre_slice, src_idx]
            tgt_dict['rotmat'][next_slice, tgt_idx] = src_dict['rotmat'][next_slice, src_idx]

    for i in range(2):
        if i == 0:
            front_change_frames = min(3, seq_slice[0])
            back_change_frames = 1
        else:
            front_change_frames = 1
            back_change_frames = min(3, tgt_dict['len'] - seq_slice[1])

        tgt_dict = linear_interp_rotmat(
            motion_dict=tgt_dict,
            front_change_frames=front_change_frames,
            back_change_frames=back_change_frames,
            mid_idx=seq_slice[i],
            tgt_joints_idx=tgt_hands_idx,
        )

    return tgt_dict
