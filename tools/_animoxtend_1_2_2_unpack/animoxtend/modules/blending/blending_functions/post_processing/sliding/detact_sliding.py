import logging

import numpy as np

from .utils.skeleton import Skeleton as Skeleton

logger = logging.getLogger("animoxtend")


def cal_vel(x):
    # x: nframes, njoints, 3
    linear_vel = x[1:] - x[:-1]

    last_frame = linear_vel[-1]
    linear_vel = np.concatenate([linear_vel, last_frame[None]], axis=0)

    return linear_vel


def get_range(contact: np.ndarray, contact_state: bool | int = True) -> list:
    """Get contact range from contact info.

    Args:
        contact (np.ndarray): contact information.
        contact_state (bool, optional): contact state. Defaults to True.

    Returns:
        list: contact ranges.
    """
    contact_state = int(contact_state)
    frames = contact.shape[0]
    # get contact range
    contact_range = []
    for i in range(contact.shape[1]):
        rge = []
        start = -1
        end = -1
        for idx in range(frames):
            if contact[idx, i] != contact_state:
                continue
            if start == -1:
                start = idx
                end = idx
            else:
                if idx - end == 1:
                    end += 1
                else:
                    rge.append([start, end])
                    start = idx
                    end = idx
        if end != -1:
            rge.append([start, end])
        contact_range.append(rge)
    return contact_range


def check_slide(
    foot_gvel,
    contact,
    contact_range,
    sliding_ts: float = 0.10,
    mean_sliding_ts: float = 0.0005,
):
    """
    Check sliding ranges based on foot velocities and contact states using NumPy.

    Args:
        foot_gvel (np.ndarray): Foot velocities. Shape: (frames, num_feet, 3)
        contact (np.ndarray): Contact states. Shape: (frames, num_feet)
        contact_range (list of list of tuples): Ranges for each foot's contact period.
        sliding_ts (float): Sliding distance threshold.
        mean_sliding_ts (float): Mean sliding distance threshold.

    Returns:
        list: Detected sliding ranges for each foot.
    """
    # Compute the magnitude of the velocity
    foot_delta = np.linalg.norm(foot_gvel, axis=-1)
    sliding_range = []

    for i in range(len(contact_range)):
        cur_sliding_range = []
        for rge in contact_range[i]:
            # Compute sliding distance and mean sliding distance
            start, end = rge
            sliding_dis = np.sum(foot_delta[start : end + 1, i] * contact[start : end + 1, i])
            mean_sliding_dis = sliding_dis / (end - start + 1)

            # Check sliding thresholds
            if sliding_dis > sliding_ts and mean_sliding_dis > mean_sliding_ts:
                cur_sliding_range.append(rge)

        sliding_range.append(cur_sliding_range)

    return sliding_range


def extract_feet_contacts(global_pos, lfoot_idx, rfoot_idx, vel_threshold=0.03, smooth_factor=None):
    """
    Extracts binary tensors of feet contacts using NumPy.

    Args:
        global_pos (np.ndarray): Global positions of joints.
            Shape: (bs, frames, joints, 3)
        lfoot_idx (list or int): Left foot joint indices.
        rfoot_idx (list or int): Right foot joint indices.
        vel_threshold (float, optional): Velocity threshold to consider a
            joint as stationary. Defaults to 0.2.

    Returns:
        tuple: (contacts_l, contacts_r, lfoot_vel, rfoot_vel)
            contacts_l: Array indicating left foot contacts (bs, frames, len(lfoot_idx))
            contacts_r: Array indicating right foot contacts (bs, frames, len(rfoot_idx))
    """
    if smooth_factor is None:
        smooth_factor = 50

    # Ensure indices are lists for consistent indexing
    if isinstance(lfoot_idx, int):
        lfoot_idx = [lfoot_idx]
    if isinstance(rfoot_idx, int):
        rfoot_idx = [rfoot_idx]

    # Compute velocity for left and right foot joints
    lfoot_vel = np.linalg.norm(global_pos[:, 1:, lfoot_idx, :] - global_pos[:, :-1, lfoot_idx, :], axis=-1)
    rfoot_vel = np.linalg.norm(global_pos[:, 1:, rfoot_idx, :] - global_pos[:, :-1, rfoot_idx, :], axis=-1)

    # Smooth step function to approximate strict threshold behavior
    contacts_l = 1.0 - 1.0 / (1.0 + np.exp(-(lfoot_vel - vel_threshold) * smooth_factor))
    contacts_r = 1.0 - 1.0 / (1.0 + np.exp(-(rfoot_vel - vel_threshold) * smooth_factor))

    # Duplicate the last frame to maintain shape consistency
    contacts_l = np.concatenate([contacts_l, contacts_l[:, -1:, :]], axis=1)
    contacts_r = np.concatenate([contacts_r, contacts_r[:, -1:, :]], axis=1)

    return np.concatenate([contacts_l, contacts_r], axis=-1)


def extract_contact_from_z(foot_gpos, height_ts=0.03):
    """
    Extracts binary tensors of feet contacts using NumPy.

    Args:
        foot_gpos (_type_): _description_
        height_ts (float, optional): _description_. Defaults to 0.03.
    """
    contact = foot_gpos[:, :, 2] < height_ts
    return contact


def correct_range(contact_range):
    """
    every range start end + 1 to match npz loader, because npz loader start from 0

    Args:
        contact_range (): _description_
    """
    new_contact_range = []
    for rge in contact_range:
        cur_full_rge = []
        for s_e in rge:
            cur_full_rge.append([s_e[0] + 1, s_e[1] + 1])
        new_contact_range.append(cur_full_rge)
    return new_contact_range


def get_contact_range(skeleton: Skeleton, transl, rotmat):
    joints_gpos, _ = skeleton.fk_np(transl, rotmat, space="world", root_rot_space="basis")
    joints_gvel = cal_vel(joints_gpos)
    toe_gvel = joints_gvel[:, skeleton.toe_idx]

    # 用toe end 判断速度, qt joints idx 20, 25 -> toe end
    foot_contacts = extract_feet_contacts(
        joints_gpos[None],
        skeleton.left_toe_idx,
        skeleton.right_toe_idx,
        vel_threshold=0.0,
    )
    foot_contacts = (foot_contacts > 0.182).astype(int)

    # 用 toe判断高度, qt joints idx 19, 24 -> toe (这里为foot)
    height_ts = 0.035

    foot_idx = [skeleton.left_foot_idx[0], skeleton.right_foot_idx[0]]

    foot_contacts_height = extract_contact_from_z(joints_gpos[:, foot_idx], height_ts=height_ts)
    foot_contacts = (foot_contacts_height[None] & foot_contacts).astype(float)

    foot_contact_range = get_range(foot_contacts[0])

    return foot_contacts, foot_contact_range, toe_gvel, joints_gpos


def detact_fs(skeleton: Skeleton, motion_dict):
    # current_dir = os.path.dirname(os.path.abspath(__file__))

    # # 动态构造文件的绝对路径
    # skeleton_path = os.path.join(current_dir, "data", "qingtong_skeleton.npz")
    # skeleton_info_path = os.path.join(current_dir, "data", "qingtong_skeleton_info.json")
    # skeleton = Skeleton(skeleton_info_path, skeleton_path, use_hand=False)

    transl, rotmat = motion_dict["transl"], motion_dict["rotmat"]
    rotmat = rotmat[:, skeleton.skeleton_idx, ...]

    foot_contacts, foot_contact_range, foot_gvel, _ = get_contact_range(skeleton, transl, rotmat)
    sliding_range = check_slide(foot_gvel, foot_contacts[0], foot_contact_range)

    logger.debug("Contact ranges: ")
    for i in range(len(foot_contact_range)):
        logger.debug(foot_contact_range[i])

    logger.debug("Sliding ranges: ")
    for i in range(len(sliding_range)):
        logger.debug(sliding_range[i])

    return sliding_range, foot_contacts, foot_contact_range
