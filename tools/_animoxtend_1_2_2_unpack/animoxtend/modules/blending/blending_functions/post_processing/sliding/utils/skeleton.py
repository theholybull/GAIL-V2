import json
from copy import deepcopy
from typing import Tuple

import numpy as np

from ..blender_free_ik.Animation import Animation
from ..blender_free_ik.Quaternions_old import Quaternions


class Skeleton(object):
    def __init__(self, skeleton_info_path, skeleton_path, use_hand=False):
        self.skeleton_info_path = skeleton_info_path
        self.skeleton_path = skeleton_path
        self.use_hand = use_hand

        self.load_qt_skeleton_info()
        self.load_qt_skeleton()

        self.pre_cal_martics()

    #################### skeleton prepare #################
    def load_qt_skeleton_info(self):
        with open(self.skeleton_info_path) as f:
            skeleton_info = json.load(f)["skeleton_info"]
            self.skeleton_info = skeleton_info

            self.joint_names = np.array(skeleton_info["joint_names"])
            self.full_names = np.array(skeleton_info["joint_names"])

            self.left_foot = skeleton_info["left_foot"]
            self.right_foot = skeleton_info["right_foot"]

            self.parents_idx = np.array(skeleton_info["w_hand_parents"])  # parent idx
            self.skeleton_idx = np.arange(len(self.joint_names), dtype=int)

            if not self.use_hand:
                self.parents_idx = np.array(skeleton_info["wo_hand_parents"])
                self.skeleton_idx = np.array(skeleton_info["skeleton_idx"])
                self.joint_names = self.joint_names[self.skeleton_idx]

            names = list(self.joint_names)
            self.left_foot_idx = [names.index(joint) for joint in self.left_foot]
            self.right_foot_idx = [names.index(joint) for joint in self.right_foot]
            self.foot_idx = self.left_foot_idx + self.right_foot_idx

            self.left_toe_idx = self.left_foot_idx[1]
            self.right_toe_idx = self.right_foot_idx[1]
            self.toe_idx = [self.left_toe_idx, self.right_toe_idx]

    def load_qt_skeleton(self):
        """
        Load skeleton.

        Args:
            skeleton_path (str): Skeleton file path.

        Returns:
            parents (np.ndarray): Parents of each joint.
            offsets (np.ndarray): Offsets of each joint.
        """
        with np.load(self.skeleton_path, allow_pickle=True) as data:
            data = deepcopy(dict(data))

            self.matrix_local = data["local_matrices"]
            self.matrix_world = data["matrix_world"]

        if not self.use_hand:
            self.matrix_local = self.matrix_local[self.skeleton_idx]

        self.root_matrix_local = self.matrix_local[0]

    def pre_cal_martics(self):
        self.matrix_local_inv = np.linalg.inv(self.matrix_local)
        self.root_matrix_local_inv = np.linalg.inv(self.root_matrix_local)
        self.matrix_world_inv = np.linalg.inv(self.matrix_world)
        self.root_global2basis_matrix = self.root_matrix_local_inv @ self.matrix_world_inv
        self._cal_joints_offsets()

    def _cal_joints_offsets(
        self,
    ):
        joints_arm_gpos = self.matrix_local[:, :3, 3]
        joints_arm_grot = self.matrix_local[:, :3, :3]

        num_joints = len(self.parents_idx)
        offsets = np.zeros(shape=(num_joints, 3))

        for i in range(num_joints):
            if self.parents_idx[i] == -1:
                offsets[i] = joints_arm_gpos[i]
            else:
                parent_gpos = joints_arm_gpos[self.parents_idx[i]]
                parent_grot = joints_arm_grot[self.parents_idx[i]]

                cur_offset = np.linalg.inv(parent_grot) @ (joints_arm_gpos[i] - parent_gpos)
                offsets[i] = cur_offset

        self.joints_arm_offset = offsets
        self.joints_world_offset = (self.matrix_world[:3, :3] @ offsets.T).T

    def update_root_basis_transl(self, matrices_basis, global_root_transl):
        """
        Updates the root basis with the global root translation, supporting both NumPy and PyTorch.

        Args:
            matrices_basis (np.ndarray or torch.Tensor):
                The current basis matrices, shape (bs, nframes, njoints, 4, 4) or (nframes, njoints, 4, 4)
            global_root_transl (np.ndarray or torch.Tensor):
                The global root translation, shape (bs, nframes, 3) or (nframes, 3)

        Returns:
            np.ndarray or torch.Tensor: Updated matrices_basis with the new root translation.
        """
        # Ensure that global_root_transl has a batch dimension (bs) if necessary
        if global_root_transl.ndim == 2:  # No batch dimension
            global_root_transl = global_root_transl.unsqueeze(0)  # Add batch dimension (bs, nframes, 3)

        n_batches = global_root_transl.shape[0]
        n_frames = global_root_transl.shape[1]

        if isinstance(matrices_basis, np.ndarray):
            # For NumPy
            identity = np.identity(4)

            # Create global translation matrix for each frame in the batch
            global_trans_mat = np.tile(identity, (n_batches, n_frames, 1, 1))  # shape: (bs, nframes, 4, 4)
            global_trans_mat[:, :, :3, 3] = global_root_transl  # Set the translation part

            # Broadcasting root_global2basis_matrix to handle batch
            # Use einsum for batch matrix multiplication: batch dot-product between matrices
            if self.root_global2basis_matrix.ndim == 2:
                root_global2basis_matrix = self.root_global2basis_matrix[None, None, ...]
            else:
                root_global2basis_matrix = self.root_global2basis_matrix[None, ...]
            root_basis_loc = (root_global2basis_matrix @ global_trans_mat)[:, :, :3, 3]

            matrices_basis[:, :, 0, :3, 3] = root_basis_loc

        return matrices_basis

    #################### fk ###############################
    def fk_np(
        self,
        root_gpos: np.ndarray,
        joints_lrot: np.ndarray,
        space: str = "world",
        root_rot_space: str = "world",
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Fk with NumPy

        Args:
            root_gpos (np.ndarray): bs, nframes, 3 or nframes, 3
            joints_lrot (np.ndarray): bs, nframes, njoints, 3, 3 or nframes, njoints, 3, 3

        Returns:
            global_positions: bs, nframes, njoints, 3 or nframes, njoints, 3
            global_rotations: bs, nframes, njoints, 3, 3 or nframes, njoints, 3, 3
        """
        # Check if batch dimension exists (bs)
        if root_gpos.ndim == 2:  # No batch dimension
            root_gpos = root_gpos[None]  # Add batch dimension (bs, nframes, 3)
            joints_lrot = joints_lrot[None]  # Add batch dimension (bs, nframes, njoints, 3, 3)

        bs, nframes, njoints = joints_lrot.shape[:3]

        # Initialize global positions and rotations with batch dimension
        joints_gpos = np.zeros((bs, nframes, njoints, 3))
        joints_grot = np.zeros((bs, nframes, njoints, 3, 3))

        matrices_basis = np.tile(np.identity(4), (bs, nframes, njoints, 1, 1))

        # Assign rotation matrices to the corresponding part of basis matrices
        matrices_basis[:, :, :, :3, :3] = joints_lrot
        if root_rot_space == "world":
            # Convert root rotation to basis for easier calculation
            matrices_basis[:, :, 0, :3, :3] = (
                self.root_global2basis_matrix[:3, :3][None, None, ...] @ matrices_basis[:, :, 0, :3, :3]
            )

        # Update root basis with translation
        matrices_basis = self.update_root_basis_transl(matrices_basis, root_gpos)

        global_matrices = np.zeros_like(matrices_basis)

        for joint in range(njoints):
            parent_idx = self.parents_idx[joint]

            if joint == 0:  # Root joint
                joint_global_matrix = self.root_matrix_local[None, None, ...] @ matrices_basis[:, :, joint]
                if space == "world":
                    joint_global_matrix = self.matrix_world[None, None, ...] @ joint_global_matrix
            else:  # Other joints
                # Use parent's global matrix to compute the current joint's global matrix
                parent_global_matrix = global_matrices[:, :, parent_idx]
                relative_matrix = (
                    parent_global_matrix
                    @ self.matrix_local_inv[parent_idx][None, None, ...]
                    @ self.matrix_local[joint][None, None, ...]
                )
                joint_global_matrix = relative_matrix @ matrices_basis[:, :, joint]

            global_matrices[:, :, joint] = joint_global_matrix

            # Extract global positions and rotations
            joints_grot[:, :, joint] = joint_global_matrix[:, :, :3, :3]
            joints_gpos[:, :, joint] = joint_global_matrix[:, :, :3, 3]

        # If there was no batch dimension, return without the batch dimension
        if root_gpos.shape[0] == 1:
            joints_gpos = joints_gpos[0]
            joints_grot = joints_grot[0]

        return joints_gpos, joints_grot

    def standard_fk_np(
        self,
        root_gpos: np.array,  # frames, 3
        joints_parent_relative_rot: np.array,  # frames, joints, 3, 3
        space: str = "world",  # root gpos in which space
    ):
        nframes = root_gpos.shape[0]

        if space == "world":
            offsets = self.joints_world_offset
        elif space == "arm":
            offsets = self.joints_arm_offset

        joints_gpos = np.zeros(shape=(nframes, len(self.parents_idx), 3))
        joints_grot = np.zeros(shape=(nframes, len(self.parents_idx), 3, 3))

        for i in range(len(self.parents_idx)):
            parent_idx = self.parents_idx[i]

            if parent_idx == -1:
                joints_gpos[:, i] = root_gpos
                joints_grot[:, i] = joints_parent_relative_rot[:, i]
            else:
                parent_gpos = joints_gpos[:, parent_idx]
                parent_grot = joints_grot[:, parent_idx]

                joint_grot = parent_grot @ joints_parent_relative_rot[:, i]
                joint_gpos = parent_gpos + parent_grot @ offsets[i]

                joints_gpos[:, i] = joint_gpos
                joints_grot[:, i] = joint_grot

        return joints_gpos, joints_grot

    def get_parent_relative_rotation(
        self,
        joints_basis_rotation: np.array,
    ):
        parent_relative_rot = np.zeros(shape=joints_basis_rotation.shape)

        for i in range(len(self.parents_idx)):
            parent_idx = self.parents_idx[i]
            if parent_idx == -1:
                parent_relative_rot[:, i] = self.matrix_local[i][:3, :3] @ joints_basis_rotation[:, i]
            else:
                parent_relative_rot[:, i] = (
                    self.matrix_local_inv[parent_idx][:3, :3]
                    @ self.matrix_local[i][:3, :3]
                    @ joints_basis_rotation[:, i]
                )

        return parent_relative_rot

    #################### load data for ik ########################
    def load_qt_npz(self, npz_path, start=None, end=None, window=None):
        """Load qt npz file

        Args:
            npz_path (_type_): _description_
            start (_type_, optional): _description_. Defaults to None.
            end (_type_, optional): _description_. Defaults to None.
            window (_type_, optional): _description_. Defaults to None.

        Returns:
            root_global_pos: nframes, 1, 3
            rotations: nframes, njoints, 3, 3 (0 -> root, global, joints -> matrix basis)
        """
        with np.load(npz_path) as data:
            npz_data = dict(data)
            transl = npz_data["transl"]
            rotmat = npz_data["rotmat"]

            # exclude hand
            if not self.use_hand:
                rotmat = rotmat[:, self.skeleton_idx]

            frames = rotmat.shape[0]

            if window is not None and window > frames:
                return None, None

            if end is not None:
                transl = transl[:end]
                rotmat = rotmat[:end]
                frames = len(transl)

            if start is not None:
                transl = transl[start:]
                rotmat = rotmat[start:]
                frames = len(transl)

            if window is not None and window > len(transl):
                return None, None

            # root_global_rot = np.matmul(self.root_matrix_local[:3, :3], root_mat_basis)
            # root_global_rot = (self.matrix_world @ self.root_matrix_local)[:3, :3] @ root_mat_basis

            # rotmat[:, 0] = root_global_rot

            root_global_pos = transl
            rotations = rotmat

            return root_global_pos, rotations

    def get_animation_from_path(self, npz_path):
        root_gpos, joints_basis_rotation = self.load_qt_npz(npz_path)
        return self._get_animation(root_gpos, joints_basis_rotation)

    def get_animation_from_dict(self, npz_dict):
        root_gpos = npz_dict["transl"]
        joints_basis_rotation = npz_dict["rotmat"]

        # exclude hand
        if not self.use_hand:
            joints_basis_rotation = joints_basis_rotation[:, self.skeleton_idx]

        return self._get_animation(root_gpos, joints_basis_rotation)

    def _get_animation(self, root_gpos, joints_basis_rotation):
        #### anim rotations
        parent_relative_rot = self.get_parent_relative_rotation(joints_basis_rotation)
        anim_rotations = Quaternions.from_transforms(np.array(parent_relative_rot))

        ### anim positons
        anim_positions = root_gpos
        nframes, njoints = joints_basis_rotation.shape[:2]
        anim_positions = np.repeat(anim_positions[:, np.newaxis, :], njoints, axis=1)

        offsets = self.joints_world_offset
        anim_positions[:, 1:] = np.repeat(offsets[np.newaxis, ...], nframes, axis=0)[:, 1:]
        anim_positions = np.array(anim_positions)

        ### anim offsets
        anim_offsets = self.joints_world_offset
        anim_offsets = np.array(anim_offsets)

        ### anim parents
        anim_parents = np.array(self.parents_idx)

        ### anim orients
        anim_orients = Quaternions.id(njoints)

        joints_gpos, _ = self.standard_fk_np(
            root_gpos=root_gpos,
            joints_parent_relative_rot=parent_relative_rot,
            space="world",
        )

        return (
            Animation(anim_rotations, anim_positions, anim_orients, anim_offsets, anim_parents),
            joints_gpos,
        )

    #################### extract dict from animation #######################
    def _get_matrix_basis(self, joints_parent_rel_rotmat):
        nframes, njoints = joints_parent_rel_rotmat.shape[:2]

        joints_matrix_basis = np.zeros((nframes, njoints, 3, 3))

        for i in range(njoints):
            parent_idx = self.parents_idx[i]
            cur_rel_rotmat = joints_parent_rel_rotmat[:, i, :3, :3]

            if parent_idx == -1:
                joint_matrix_basis = self.root_matrix_local_inv[:3, :3] @ cur_rel_rotmat
            else:
                joint_matrix_basis = (
                    self.matrix_local_inv[i][:3, :3] @ self.matrix_local[parent_idx][:3, :3] @ cur_rel_rotmat
                )

            joints_matrix_basis[:, i, :, :] = joint_matrix_basis

        return joints_matrix_basis

    def extract_dict_from_animation(self, anim: Animation, ori_dict):
        root_transl = anim.positions[:, 0]

        joints_parent_rel_rotmat = Quaternions.transforms(anim.rotations)
        joints_rotmat = self._get_matrix_basis(joints_parent_rel_rotmat)

        transl = np.array(root_transl)
        rotmat = np.array(joints_rotmat)

        if not self.use_hand:
            nframes = rotmat.shape[0]

            rotmat_w_hand = np.tile(np.eye(3).reshape(1, 1, 3, 3), (nframes, len(self.full_names), 1, 1))
            skeleton_idx_list = list(self.skeleton_idx)

            for i in range(len(self.full_names)):
                if i in self.skeleton_idx:
                    rotmat_w_hand[:, i] = rotmat[:, skeleton_idx_list.index(i)]
                else:
                    rotmat_w_hand[:, i] = ori_dict['rotmat'][:, i]

            rotmat = rotmat_w_hand

        new_dict = deepcopy(ori_dict)
        new_dict["transl"] = transl
        new_dict["rotmat"] = rotmat
        new_dict["len"] = nframes

        return new_dict


#################### utils func #######################
