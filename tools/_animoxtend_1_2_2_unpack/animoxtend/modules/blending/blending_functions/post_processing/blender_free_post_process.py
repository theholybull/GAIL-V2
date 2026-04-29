import logging
import os
import time
from copy import deepcopy

import numpy as np

from .sliding.blender_free_ik.Animation import Animation
from .sliding.blender_free_ik.InverseKinematics import JacobianInverseKinematics
from .sliding.blender_free_ik.Quaternions_old import Quaternions
from .sliding.detact_sliding import detact_fs, get_contact_range
from .sliding.utils.funcs import (
    alpha,
    extract_anim,
    lerp,
    rebuild_anim,
    rebuild_anim_full,
    smooth_rotations_quaternion_average,
)
from .sliding.utils.skeleton import Skeleton as Skeleton

logger = logging.getLogger("animoxtend")


WEIGHTS = np.array(
    [
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [2.0, 2.0, 2.0],
        [2.0, 2.0, 2.0],
        [1.0, 1.0, 1.0],
        [1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0],
        [2.0, 2.0, 2.0],
        [2.0, 2.0, 2.0],
        [1.0, 1.0, 1.0],
        [1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0],
    ]
)


class SlidingProcesser:
    def __init__(self, skeleton: Skeleton):
        self.skeleton: Skeleton = skeleton

    def get_ik_chain(self, parents, target_joint, chain_length):
        chain = []
        current_joint = target_joint
        for _ in range(chain_length):
            chain.append(current_joint)
            current_joint = parents[current_joint]
            if current_joint == -1:  # 到达根节点或无效父节点
                break
        return chain  # 关节链从目标关节到根关节

    def detact_fs(self, motion_dict):
        sliding_range, foot_contacts, foot_contact_range = detact_fs(self.skeleton, motion_dict)
        return sliding_range, foot_contacts, foot_contact_range

    def lock_feet(self, sliding_range, joints_gpos, fid_l, fid_r, interp_length=4):
        joints_gpos = np.array(joints_gpos)

        nframes = len(joints_gpos)

        feet_idx = list(fid_l) + list(fid_r)
        fid_l, fid_r = np.array(fid_l), np.array(fid_r)

        target_frames = set()

        for i, foot_slide_range in enumerate(sliding_range):
            if len(foot_slide_range) == 0:
                logger.debug("No sliding detacted in %s foot", i)
                continue

            cur_foot_idx = feet_idx[i]

            # 锁住脚部位置为slide首帧的位置
            for rge in foot_slide_range:
                start, end = rge[0], rge[1]

                cur_foot_gpos = joints_gpos[:, cur_foot_idx]
                start_gpos = cur_foot_gpos[start]

                # locked foot pos

                ## option 1: lock foot z
                rge_foot_gpos = cur_foot_gpos[start : end + 1]
                # min_z = np.min(rge_foot_gpos[:, 2])
                # start_gpos[2] = min_z

                ## option 2: lock foot mean gpos
                mean_gpos = np.mean(rge_foot_gpos, axis=0, keepdims=True)
                start_gpos = mean_gpos

                cur_foot_gpos[start : end + 1] = start_gpos
                joints_gpos[start : end + 1, cur_foot_idx] = cur_foot_gpos[start : end + 1]

            ## ik 的渐入渐出，当前的淡入淡出是基于contact的
            cur_foot_slide_frames = []
            for start, end in foot_slide_range:
                cur_foot_slide_frames.extend(range(start, end + 1))

            for cur_frame in range(nframes):
                if cur_frame in cur_foot_slide_frames:
                    target_frames.add(cur_frame)
                    continue

                left, right = None, None
                consl, consr = False, False
                for k in range(interp_length):
                    if cur_frame - k - 1 < 0:
                        break
                    if cur_frame - k - 1 in cur_foot_slide_frames:
                        left = cur_frame - k - 1
                        consl = True
                        break
                for k in range(interp_length):
                    if cur_frame + k + 1 >= nframes:
                        break
                    if cur_frame + k + 1 in cur_foot_slide_frames:
                        right = cur_frame + k + 1
                        consr = True
                        break

                if not consl and not consr:
                    continue

                target_frames.add(cur_frame)

                if consl and consr:
                    litp = lerp(
                        alpha(1.0 * (cur_frame - left + 1) / (interp_length + 1)),
                        joints_gpos[cur_frame, cur_foot_idx],
                        joints_gpos[left, cur_foot_idx],
                    )
                    ritp = lerp(
                        alpha(1.0 * (right - cur_frame + 1) / (interp_length + 1)),
                        joints_gpos[cur_frame, cur_foot_idx],
                        joints_gpos[right, cur_foot_idx],
                    )
                    itp = lerp(alpha(1.0 * (cur_frame - left + 1) / (right - left + 1)), ritp, litp)
                    joints_gpos[cur_frame, cur_foot_idx] = itp.copy()
                    continue
                if consl:
                    litp = lerp(
                        alpha(1.0 * (cur_frame - left + 1) / (interp_length + 1)),
                        joints_gpos[cur_frame, cur_foot_idx],
                        joints_gpos[left, cur_foot_idx],
                    )
                    joints_gpos[cur_frame, cur_foot_idx] = litp.copy()
                    continue
                if consr:
                    ritp = lerp(
                        alpha(1.0 * (right - cur_frame + 1) / (interp_length + 1)),
                        joints_gpos[cur_frame, cur_foot_idx],
                        joints_gpos[right, cur_foot_idx],
                    )
                    joints_gpos[cur_frame, cur_foot_idx] = ritp.copy()

        target_frames = sorted(list(target_frames))

        return joints_gpos, target_frames

    def extract_target_anim(
        self,
        root_gpos,
        joints_matrix_basis,
        tgt_frames: list,
        tgt_joints_idx: list,
    ):
        parent_relative_rot = self.skeleton.get_parent_relative_rotation(joints_matrix_basis)
        joints_gpos, joints_grot = self.skeleton.standard_fk_np(root_gpos, parent_relative_rot, space='world')

        new_parents = []
        for joint_idx in tgt_joints_idx:
            parent_idx = self.skeleton.parents_idx[joint_idx]
            if parent_idx in tgt_joints_idx:
                new_parents.append(tgt_joints_idx.index(parent_idx))
            else:
                new_parents.append(-1)

        nframes = len(tgt_frames)
        njoints = len(tgt_joints_idx)

        new_root_idx = tgt_joints_idx[0]
        new_root_gpos = joints_gpos[tgt_frames, new_root_idx]

        anim_positions = new_root_gpos
        anim_positions = np.repeat(anim_positions[:, np.newaxis, :], njoints, axis=1)

        offsets = self.skeleton.joints_world_offset[tgt_joints_idx]
        anim_positions[:, 1:] = np.repeat(offsets[np.newaxis, ...], nframes, axis=0)[:, 1:]
        anim_positions = np.array(anim_positions)

        anim_offsets = self.skeleton.joints_world_offset[tgt_joints_idx]
        anim_offsets = np.array(anim_offsets)

        anim_parents = np.array(new_parents)

        anim_orients = Quaternions.id(njoints)

        new_root_rotations = np.array(joints_grot[tgt_frames, new_root_idx])
        anim_rotations = np.repeat(new_root_rotations[:, np.newaxis, :], njoints, axis=1)

        child_rotations = np.array(parent_relative_rot[tgt_frames])
        child_rotations = child_rotations[:, tgt_joints_idx]

        anim_rotations[:, 1:] = np.array(child_rotations[:, 1:])
        anim_rotations = Quaternions.from_transforms(np.array(anim_rotations))
        return Animation(anim_rotations, anim_positions, anim_orients, anim_offsets, anim_parents)

    def remove_sliding_in_range(
        self,
        anim: Animation,
        sliding_range,
        joints_gpos,
        fid_l,
        fid_r,
        interp_length=4,
    ):
        locked_joints_gpos, target_frames = self.lock_feet(sliding_range, joints_gpos, fid_l, fid_r, interp_length)

        target_frame_joints_gpos = locked_joints_gpos[target_frames]
        target_anim = extract_anim(anim, target_frames)

        targetmap = {}

        targetmap[fid_l[0]] = target_frame_joints_gpos[:, fid_l[0]]
        targetmap[fid_r[0]] = target_frame_joints_gpos[:, fid_r[0]]

        weights = np.zeros(len(self.skeleton.parents_idx))

        left_id = [16, 17, 18, 19, 20]
        right_id = [21, 22, 23, 24, 25]
        l_dif_weights = np.array([2, 2, 1, 0.8, 0.0])
        r_dif_weights = np.array([2, 2, 1, 0.8, 0.0])

        weights[left_id] = l_dif_weights
        weights[right_id] = r_dif_weights

        weights_trans = weights

        ##### origin
        ik = JacobianInverseKinematics(
            target_anim,
            targetmap,
            iterations=500,
            damping=1,
            weights=weights,
            weights_translate=weights_trans,
            translate=False,
            silent=False,
        )
        ik()

        anim = rebuild_anim(target_anim, ori_anim=anim, target_frames=target_frames)

        return anim

    def remove_sliding_in_range_chain(
        self,
        anim: Animation,
        sliding_range,
        joints_gpos,
        root_gpos,
        joints_matrix_basis,
        fid_l,
        fid_r,
        interp_length=4,
        l_chain_length=6,
        r_chain_length=6,
    ):
        locked_joints_gpos, target_frames = self.lock_feet(sliding_range, joints_gpos, fid_l, fid_r, interp_length)

        target_frame_joints_gpos = locked_joints_gpos[target_frames]

        l_foot_idx = fid_l[0]
        r_foot_idx = fid_r[0]
        l_chain = self.get_ik_chain(anim.parents, target_joint=l_foot_idx, chain_length=l_chain_length)
        r_chain = self.get_ik_chain(anim.parents, target_joint=r_foot_idx, chain_length=r_chain_length)

        l_chain = sorted(l_chain)
        r_chain = sorted(r_chain)

        chain = set(l_chain + r_chain)
        chain_idx = sorted(list(chain))

        idx_map = {idx: i for i, idx in enumerate(chain_idx)}

        tgt_anim = self.extract_target_anim(root_gpos, joints_matrix_basis, target_frames, chain_idx)

        tgt_map = {}
        tgt_map[idx_map[l_foot_idx]] = target_frame_joints_gpos[:, l_foot_idx]
        tgt_map[idx_map[r_foot_idx]] = target_frame_joints_gpos[:, r_foot_idx]

        weights = WEIGHTS[chain_idx]
        weights_trans = WEIGHTS[chain_idx]

        ik = JacobianInverseKinematics(
            tgt_anim,
            tgt_map,
            iterations=1000,
            damping=1,
            recalculate=True,
            weights=weights,
            weights_translate=weights_trans,
            translate=False,
            silent=False,
        )
        ik()

        anim = rebuild_anim_full(tgt_anim, ori_anim=anim, target_frames=target_frames, target_joints_idx=chain_idx)

        return anim

    def remove_sliding(self, motion_dict, interp_length=4, l_chain_length=None, r_chain_length=None):
        tik = time.time()

        anim, _ = self.skeleton.get_animation_from_dict(motion_dict)

        root_gpos = motion_dict["transl"]
        joints_matrix_basis = motion_dict["rotmat"][:, self.skeleton.skeleton_idx]

        joints_gpos, _ = self.skeleton.fk_np(
            root_gpos=root_gpos,
            joints_lrot=joints_matrix_basis,
            space="world",
            root_rot_space="basis",
        )

        ## detact sliding
        sliding_range, foot_contacts, foot_contact_range = self.detact_fs(motion_dict)
        foot_contacts = foot_contacts[0].T

        fid_l = [self.skeleton.left_foot_idx[1]]
        fid_r = [self.skeleton.right_foot_idx[1]]

        if not any(sliding_range):
            return motion_dict

        if l_chain_length is not None and r_chain_length is not None:
            anim = self.remove_sliding_in_range_chain(
                anim,
                sliding_range,
                joints_gpos,
                root_gpos,
                joints_matrix_basis,
                fid_l,
                fid_r,
                interp_length,
                l_chain_length,
                r_chain_length,
            )
        else:
            anim = self.remove_sliding_in_range(anim, sliding_range, joints_gpos, fid_l, fid_r, interp_length)

        new_motion_dict = self.skeleton.extract_dict_from_animation(anim, motion_dict)

        tok = time.time()
        logger.debug("Remove Sliding: %.4fs", tok - tik)

        return new_motion_dict


class JiterProcesser:
    def __init__(self, skeleton: Skeleton):
        self.skeleton: Skeleton = skeleton

    def fix_jitter(
        self,
        motion_dict: dict,
        max_peaks_num: int = 10,
        peaks_rate_ts: float = 0.12,
    ):
        from scipy.signal import find_peaks

        transl, rotmat = motion_dict['transl'], motion_dict['rotmat']
        rotmat = rotmat[:, self.skeleton.skeleton_idx, ...]

        _, foot_contact_range, _, joints_gpos = get_contact_range(self.skeleton, transl, rotmat)

        for idx in range(len(foot_contact_range)):
            if len(foot_contact_range[idx]) == 0:
                logger.debug("No contact detected in foot %s !", idx)

            if idx == 0:
                cur_foot_idx = self.skeleton.left_toe_idx
            else:
                cur_foot_idx = self.skeleton.right_toe_idx

            cur_foot_gpos = joints_gpos[:, cur_foot_idx]

            for rge in foot_contact_range[idx]:
                start, end = rge[0], rge[1]

                cur_rge_foot_gz = cur_foot_gpos[start : end + 1, 2]

                peaks, _ = find_peaks(cur_rge_foot_gz)

                if len(peaks) > max_peaks_num and len(peaks) / len(cur_rge_foot_gz) > peaks_rate_ts:
                    logger.debug("Jitter detected in foot %s in range [%s]!", idx, rge)

                    item = 2  # 从 toe end -> toe ->  foot
                    for i in range(item):
                        smooth_idx = cur_foot_idx - i

                        cur_rge_foot_rotmat = rotmat[start : end + 1, smooth_idx]
                        cur_rge_foot_rotmat = cur_rge_foot_rotmat.reshape(-1, 3, 3)
                        cur_rge_foot_rotmat = smooth_rotations_quaternion_average(
                            cur_rge_foot_rotmat, smoothing_strength=1
                        )
                        rotmat[start : end + 1, smooth_idx] = cur_rge_foot_rotmat

        motion_dict['rotmat'] = rotmat

        return motion_dict


class MotionPostProcesser:
    def __init__(self):
        assets_path = os.path.abspath(os.path.join(__file__, '../../../../../../animoxtend/assets'))

        skeleton_path = os.path.join(assets_path, 'qingtong_skeleton.npz')
        skeleton_info_path = os.path.join(assets_path, 'qingtong_skeleton_info.json')

        self.skeleton: Skeleton = Skeleton(skeleton_info_path, skeleton_path, use_hand=False)

        self.sliding_processer = SlidingProcesser(self.skeleton)
        self.jiter_processer = JiterProcesser(self.skeleton)

    def reorder_motion_data(self, source_names, target_names, source_dict):
        """
        Reorders motion data to match the order of target_names based on source_names.

        Args:
            smplx_names (list): List of joint names.
            target_names (list): List of joint names.
            motion_data (np.ndarray): Motion data with shape (frames, num_joints, 3).

        Returns:
            np.ndarray: Reordered motion data matching the order of target_names.
        """
        ret_dict = deepcopy(source_dict)

        source_rotmat = ret_dict['rotmat']

        source_names = list(source_names)
        target_names = list(target_names)

        assert len(source_names) == source_rotmat.shape[1], (
            "Number of joints in source_names must match the number of columns in source_rotmat."
        )

        name_to_index = {name: source_names.index(name) for name in target_names if name in source_names}

        num_frames = source_rotmat.shape[0]
        num_joints = len(target_names)

        identity_matrix = np.eye(3)
        reordered_rotmat = np.tile(identity_matrix, (num_frames, num_joints, 1, 1))

        for idx, name in enumerate(target_names):
            if name in name_to_index:
                source_index = name_to_index[name]
                reordered_rotmat[:, idx, ...] = source_rotmat[:, source_index, ...]

        ret_dict['rotmat'] = reordered_rotmat
        ret_dict['joint_names'] = target_names

        return ret_dict

    def __call__(self, motion_dict):
        src_names = motion_dict['joint_names']
        tgt_names = self.skeleton.full_names

        reorder_motion_dict = self.reorder_motion_data(
            source_names=src_names, target_names=tgt_names, source_dict=motion_dict
        )

        fixed_motion_dict = self.sliding_processer.remove_sliding(
            motion_dict=reorder_motion_dict,
            l_chain_length=6,
            r_chain_length=6,
        )
        # TODO：加速去抖动
        # motion_dict = self.jiter_processer.fix_jitter(motion_dict)

        src_names = fixed_motion_dict['joint_names']
        tgt_names = motion_dict['joint_names']

        fixed_reorder_motion_dict = self.reorder_motion_data(
            source_names=src_names, target_names=tgt_names, source_dict=fixed_motion_dict
        )

        return fixed_reorder_motion_dict
