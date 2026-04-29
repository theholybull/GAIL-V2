import bpy
import numpy as np
from mathutils import Matrix, Vector

from .blend_bone_mapping import find_root_bone_name

EULER_TYPE = ['XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX']


def get_fcurve(data_path: str, index: int, fcurves_map, action):
    """get curr frame motion fcurve.

    Args:pyton
        data_path (str):  a string that describes the corres bone motion
        index (int): the index of the component of the corres bone motion
        (including rotation and location)
        fcurves_map_ (_type_):
        a dictionary that stores animation curves for an object
        action_ (_type_): obj.animation_data.action

    Returns:
        _type_: FCurve object
    """
    fcurve_key = (data_path, index)

    if fcurve_key in fcurves_map:
        fcurve = fcurves_map[fcurve_key]
    else:
        fcurve = fcurves_map.setdefault(fcurve_key, action.fcurves.new(data_path, index=index))
        # fcurve.keyframe_points.add(num_frames)
    return fcurve


def set_motion(armature, motion_rot_dict, motion_loc, root_name, start_frame):
    # Get armature scale fcurve
    sca = armature.scale[0]

    # Get animation data
    anim_data = armature.animation_data
    if anim_data is None:
        anim_data = armature.animation_data_create()
    # Add new action
    anim_data.action = None
    action = bpy.data.actions.new('Action')
    anim_data.action = action

    # Insert motion data to armature
    anim_data = armature.animation_data_create()
    action = bpy.data.actions.new('Action')
    anim_data.action = action
    fcurves_map = {(fc.data_path, fc.array_index): fc for fc in action.fcurves}
    n_frames = motion_rot_dict[list(motion_rot_dict.keys())[0]].shape[0]
    frame_base = start_frame

    # Set fcurves
    for bone_name in armature.pose.bones.keys():
        if bone_name not in motion_rot_dict:
            continue
        # Get rotation mode
        rotation_mode = armature.pose.bones[bone_name].rotation_mode
        if rotation_mode == 'QUATERNION':
            data_path = f'pose.bones["{bone_name}"].rotation_quaternion'
            dims = 4
            default_rot = [1, 0, 0, 0]
        elif rotation_mode in EULER_TYPE:
            data_path = f'pose.bones["{bone_name}"].rotation_euler'
            dims = 3
            default_rot = [0, 0, 0]
        else:
            raise NotImplementedError

        for idx in range(dims):
            fcurve = get_fcurve(data_path=data_path, index=idx, fcurves_map=fcurves_map, action=action)
            fcurve.keyframe_points.add(count=n_frames)
            # Set value
            for f in range(n_frames):
                rot_mat = motion_rot_dict[bone_name][f]
                cur_mat = np.zeros((4, 4))
                cur_mat[:3, :3] = rot_mat[:3, :3]
                cur_mat = Matrix(cur_mat)
                if rotation_mode == 'QUATERNION':
                    rot = cur_mat.to_quaternion()
                else:
                    rot = cur_mat.to_euler(rotation_mode)  # type: ignore
                if bone_name in motion_rot_dict:
                    val = rot[idx]
                else:
                    val = default_rot[idx]
                fcurve.keyframe_points[f].co = (f + frame_base, val)
            fcurve.update()

        if motion_loc is not None:
            if bone_name == root_name:
                root_data_path = f'pose.bones["{bone_name}"].location'
                for idx in range(3):
                    fcurve = get_fcurve(data_path=root_data_path, index=idx, fcurves_map=fcurves_map, action=action)
                    fcurve.keyframe_points.add(count=n_frames)
                    # Set value
                    for f in range(n_frames):
                        val = motion_loc[f][idx]
                        fcurve.keyframe_points[f].co = (f + frame_base, val)
                    fcurve.update()

    # Set armature scale fcurve
    sca_data_path = 'scale'
    for idx in range(3):
        fcurve = get_fcurve(data_path=sca_data_path, index=idx, fcurves_map=fcurves_map, action=action)
        fcurve.keyframe_points.add(count=n_frames)
        # Set value
        for f in range(n_frames):
            fcurve.keyframe_points[f].co = (f + frame_base, sca)
        fcurve.update()

    # Set frame range
    action.frame_start = frame_base
    action.frame_end = n_frames


def load_npz(
    npz_dict: dict,
    armature: bpy.types.Object,
    root_substring: str = None,
    frame_base: int = 1,
) -> bpy.types.Object:
    """Assign npz motion to armature.

    Args:
        npz_dict (dict): input motion npz.
        armature (bpy.types.Object): An armature object.
        root_substring (str): substring in root bone name.

    Returns:
        armature (bpy.types.Object): armature with motion.
    """
    # Read motion, avoid modifying the input arrays
    joint_names_key = 'joint_names'
    joint_rotmat_key = 'rotmat'
    root_position_key = 'transl'
    # start_frame_key = 'start_frame'
    # Get current frame
    current_frame = bpy.context.scene.frame_current
    # Get motion data
    joint_rotmat = npz_dict[joint_rotmat_key].copy()
    motion_rot = joint_rotmat
    joint_names = list(npz_dict[joint_names_key])
    n_frames = motion_rot.shape[0]
    # Construct motion dict
    motion_rot_dict = {}
    for i, name in enumerate(joint_names):
        motion_rot_dict[name] = motion_rot[:, i]
    # Get root bone
    root = armature.pose.bones[0]
    if root_substring is None:
        root_substring = find_root_bone_name(armature)

    root_substring_lower = root_substring.lower()
    # get all tree-root bones
    top_boens = []
    for bone in armature.pose.bones:
        if bone.parent is None:
            top_boens.append(bone)
    joint_list = top_boens.copy()
    while joint_list:
        cur = joint_list.pop(0)
        if root_substring_lower in cur.name.lower():
            root = cur
            break
        else:
            for child in cur.children:
                joint_list.append(child)
    # Access basis location
    if root_position_key in npz_dict:
        motion_loc = npz_dict[root_position_key].copy()
        for i in range(n_frames):
            loc = motion_loc[i]
            rest_mat = armature.matrix_world @ root.bone.matrix_local
            mat = Matrix.Translation(Vector(loc))
            loc = (rest_mat.inverted() @ mat).to_translation()
            motion_loc[i] = loc.to_tuple()
    else:
        motion_loc = None

    # Get start and end frame
    start_frame = frame_base

    # Set motion
    set_motion(armature, motion_rot_dict, motion_loc, root.name, start_frame)

    # Set back current frame
    bpy.context.scene.frame_set(current_frame)
    return armature
