from typing import Optional

import bpy
import numpy as np

from .blend_bone_mapping import find_root_bone_name


def export_npz_dict_from_armature(
    armature_name: str,
    frame_start: Optional[int] = None,
    frame_end: Optional[int] = None,
    scale: float = None,
    skeleton_key: str = 'default',
) -> dict:
    armature = bpy.context.scene.objects[armature_name]

    root_bone_name = find_root_bone_name(armature)

    # Automatically determine frame_start and frame_end if not provided
    if armature.animation_data and armature.animation_data.action:
        frame_range = armature.animation_data.action.frame_range
        if frame_start is None:
            frame_start = int(frame_range[0])  # Start frame
        if frame_end is None:
            frame_end = int(frame_range[1])  # End frame
    else:
        raise ValueError("No animation data found for the armature.")

    joint_names = armature.pose.bones.keys()

    n_joints = len(joint_names)
    n_frames = frame_end - frame_start + 1

    motion_rotmat = np.zeros((n_frames, n_joints, 3, 3))
    motion_loc = np.zeros((n_frames, 3))

    # Extract root transformation matrix and root height (these don't change per frame)
    root_bone = armature.pose.bones[root_bone_name]
    armature_mat_world = armature.matrix_world
    root_trans_mat = armature_mat_world @ root_bone.bone.matrix_local
    root_height = root_trans_mat.to_translation()

    scale = armature.scale.x if scale is None else scale

    for f in range(frame_start, frame_end + 1):
        bpy.context.scene.frame_set(f)

        for j, name in enumerate(joint_names):
            bone = armature.pose.bones[name]
            bone_matrix_basis = bone.matrix_basis

            motion_rotmat[f - frame_start, j] = bone_matrix_basis.to_3x3()

            if bone.name == root_bone_name:
                loc = (armature.matrix_world @ bone.matrix).to_translation()
                motion_loc[f - frame_start] = loc

    npz_dict = {
        'joint_names': joint_names,
        'rotmat': motion_rotmat,
        'transl': motion_loc,
        'len': len(motion_loc),
        'root_name': root_bone_name,
        'root_height': root_height,
        'root_trans_mat': root_trans_mat,
        'priority': 0,
        'restpose_name': skeleton_key,
    }

    return npz_dict


# if __name__ == '__main__':
#     npz_dict = export_npz_dict_from_armature(armature_name="Armature", scale=0.01)

#     save_path = r'D:\Peter\blender\AddOn\neural_blending\tmp\test_1.npz'
#     np.savez(save_path, **npz_dict)
