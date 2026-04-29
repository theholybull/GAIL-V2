import bpy
import numpy as np

from .npz_export import find_root_bone_name


def extract_skeleton_info(armature):
    joint_names = armature.pose.bones.keys()
    n_joints = len(joint_names)
    # Init skeleton info
    rest_heads = np.zeros((n_joints, 3))
    rest_tails = np.zeros((n_joints, 3))
    rel_heads = np.zeros((n_joints, 3))
    rel_tails = np.zeros((n_joints, 3))
    local_matrices = np.zeros((n_joints, 4, 4))
    matrix_world = np.array(armature.matrix_world)
    parents = []
    rolls = []
    lengths = []

    # set pose mode
    if bpy.context.active_object is not None and bpy.context.object.mode in ['POSE', 'EDIT']:
        bpy.ops.object.mode_set(mode='OBJECT')

    # Set edit mode
    bpy.ops.object.select_all(action='DESELECT')
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode='EDIT')
    # Get skeleton info
    for i, bone in enumerate(armature.data.bones):
        rest_heads[i] = bone.head_local
        rest_tails[i] = bone.tail_local
        rel_heads[i] = bone.head
        rel_tails[i] = bone.tail
        local_matrices[i] = bone.matrix_local
        if bone.parent is not None:
            parents.append(bone.parent.name)
        else:
            parents.append('')
        edit_bone = armature.data.edit_bones[bone.name]
        rolls.append(edit_bone.roll)
        lengths.append(bone.length)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')

    root_bone_name = find_root_bone_name(armature)
    root_bone = armature.pose.bones[root_bone_name]
    top_bone_name = root_bone_name if root_bone.parent is None else root_bone.parent.name

    # Get skeleton info
    skeleton_info = dict(
        joint_names=joint_names,
        rest_heads=rest_heads,
        rest_tails=rest_tails,
        rel_heads=rel_heads,
        rel_tails=rel_tails,
        lengths=lengths,
        rolls=rolls,
        local_matrices=local_matrices,
        matrix_world=matrix_world,
        parents=parents,
        root_bone_name=root_bone_name,
        top_bone_name=top_bone_name,
    )
    return skeleton_info


def extract_skeleton_info_pose_mode(armature, frame_idx=None):
    # set pose mode
    if bpy.context.active_object is not None and bpy.context.object.mode in ['POSE', 'EDIT']:
        bpy.ops.object.mode_set(mode='OBJECT')
    # Set edit mode
    bpy.ops.object.select_all(action='DESELECT')

    if frame_idx:
        bpy.context.scene.frame_set(frame_idx)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    # duplicate armature copy
    bpy.ops.object.duplicate(linked=False, mode='TRANSLATION')
    duplicated_armature = bpy.context.active_object
    bpy.ops.object.select_all(action='DESELECT')
    duplicated_armature.select_set(True)
    bpy.context.view_layer.objects.active = duplicated_armature
    bpy.ops.object.mode_set(mode='POSE')
    # set current pose as rest pose
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    # extract restpose dict
    skeleton_info = extract_skeleton_info(duplicated_armature)
    # delete armature copy
    bpy.ops.object.select_all(action='DESELECT')
    duplicated_armature.select_set(True)
    bpy.context.view_layer.objects.active = duplicated_armature
    bpy.ops.object.delete()

    return skeleton_info
