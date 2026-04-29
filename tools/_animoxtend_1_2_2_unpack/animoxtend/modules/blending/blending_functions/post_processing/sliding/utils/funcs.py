import numpy as np
from scipy.spatial.transform import Rotation as R

from ..blender_free_ik.Animation import Animation


def softmax(x, **kw):
    softness = kw.pop("softness", 1.0)
    maxi, mini = np.max(x, **kw), np.min(x, **kw)
    return maxi + np.log(softness + np.exp(mini - maxi))


def softmin(x, **kw):
    return -softmax(-x, **kw)


def alpha(t):
    return 2.0 * t * t * t - 3.0 * t * t + 1


def lerp(a, left, right):
    return (1 - a) * left + a * right


def slerp(t, q1, q2):
    """
    使用球形线性插值 (SLERP) 在两个四元数之间插值
    Args:
        t: 插值因子 (0 <= t <= 1)
        q1: 起始四元数
        q2: 目标四元数
    Returns:
        插值后的四元数
    """
    dot_product = np.dot(q1, q2)

    # 如果点积为负，翻转一个四元数以选择最短路径
    if dot_product < 0.0:
        q2 = -q2
        dot_product = -dot_product

    # 如果四元数非常接近，直接线性插值
    if dot_product > 0.9995:
        result = q1 + t * (q2 - q1)
        return result / np.linalg.norm(result)

    # 计算插值
    theta_0 = np.arccos(dot_product)  # 起始角度
    sin_theta_0 = np.sin(theta_0)

    theta = theta_0 * t  # 插值角度
    sin_theta = np.sin(theta)

    s1 = np.cos(theta) - dot_product * sin_theta / sin_theta_0
    s2 = sin_theta / sin_theta_0

    return s1 * q1 + s2 * q2


def quaternion_weighted_average(quaternions: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """
    使用 Markley 方法计算加权平均四元数
    Args:
        quaternions: 四元数数组 (n, 4)
        weights: 权重数组 (n,)
    Returns:
        平均四元数 (4,)
    """
    # 构建矩阵 M
    M = np.zeros((4, 4))
    for q, w in zip(quaternions, weights, strict=False):
        q = q[:, np.newaxis]  # 使 q 成为列向量
        M += w * (q @ q.T)

    # 计算特征值和特征向量
    eigenvalues, eigenvectors = np.linalg.eigh(M)
    # 选择具有最大特征值的特征向量
    avg_quaternion = eigenvectors[:, np.argmax(eigenvalues)]
    return avg_quaternion


def smooth_rotations_quaternion_average(
    rotations: np.ndarray, window_size: int = 5, smoothing_strength: float = 1.0
) -> np.ndarray:
    """
    使用加权平均方法平滑旋转矩阵
    Args:
        rotations: 旋转矩阵 (n, 3, 3)
        window_size: 平滑窗口大小
        smoothing_strength: 平滑力度 (0 < smoothing_strength <= 1)，越小平滑效果越强
    Returns:
        平滑后的旋转矩阵 (n, 3, 3)
    """
    # 转换为四元数 (n, 4)
    rotation_obj = R.from_matrix(rotations)
    quaternions = rotation_obj.as_quat()

    # 初始化平滑后的四元数列表
    smoothed_quaternions = []
    n = len(quaternions)
    half_window = window_size // 2

    # 对每个四元数进行平滑
    for i in range(n):
        # 定义窗口范围
        start = max(0, i - half_window)
        end = min(n, i + half_window + 1)
        window_quaternions = quaternions[start:end]
        weights = np.ones(len(window_quaternions)) / len(window_quaternions)
        avg_quaternion = quaternion_weighted_average(window_quaternions, weights)
        # 使用平滑力度进行插值
        smoothed_quaternion = slerp(smoothing_strength, quaternions[i], avg_quaternion)
        smoothed_quaternions.append(smoothed_quaternion)

    smoothed_quaternions = np.array(smoothed_quaternions)

    # 转换回旋转矩阵
    smoothed_rotations = R.from_quat(smoothed_quaternions).as_matrix()
    return smoothed_rotations


def extract_anim(ori_anim: Animation, target_frames):
    new_rotations = ori_anim.rotations[target_frames]
    new_positions = ori_anim.positions[target_frames]

    new_anim = Animation(
        rotations=new_rotations,
        positions=new_positions,
        orients=ori_anim.orients,
        offsets=ori_anim.offsets,
        parents=ori_anim.parents,
    )

    return new_anim


def rebuild_anim(ik_anim: Animation, ori_anim: Animation, target_frames):
    for i, frame in enumerate(target_frames):
        ori_anim.rotations[frame] = ik_anim.rotations[i]
        ori_anim.positions[frame] = ik_anim.positions[i]

    return ori_anim


def rebuild_anim_full(ik_anim: Animation, ori_anim: Animation, target_frames, target_joints_idx):
    for i, joint_idx in enumerate(target_joints_idx):
        for j, frame in enumerate(target_frames):
            ori_anim.rotations[frame, joint_idx] = ik_anim.rotations[j, i]
            ori_anim.positions[frame, joint_idx] = ik_anim.positions[j, i]

    return ori_anim
