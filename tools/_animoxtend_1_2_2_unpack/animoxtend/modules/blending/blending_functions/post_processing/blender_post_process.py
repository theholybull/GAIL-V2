import logging

import bpy

from ..utils.blend_bone_mapping import blend_bone_mapping
from ..utils.npz_export import export_npz_dict_from_armature
from .sliding.blender_ik.blender_ik import fix_sliding_multiple_segments

logger = logging.getLogger("animoxtend")


############### rm ik bones && bake animation ################
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


def merge_actions(action_a, action_b, new_action_name="Merged_Action"):
    """
    Merge two actions into a new action.
    """
    new_action = bpy.data.actions.new(name=new_action_name)

    # Merge fcurves from action_a
    for fcurve in action_a.fcurves:
        new_fcurve = new_action.fcurves.new(data_path=fcurve.data_path, index=fcurve.array_index)
        for keyframe in fcurve.keyframe_points:
            new_fcurve.keyframe_points.insert(keyframe.co.x, keyframe.co.y)

    # Merge fcurves from action_b
    for fcurve in action_b.fcurves:
        new_fcurve = new_action.fcurves.new(data_path=fcurve.data_path, index=fcurve.array_index)
        for keyframe in fcurve.keyframe_points:
            new_fcurve.keyframe_points.insert(keyframe.co.x, keyframe.co.y)

    return new_action


def merge_fix_sliding_tracks(armature: bpy.types.Object):
    """
    Merge all Fix_Sliding_Track NLA tracks into a single track with merged actions.
    """
    if not armature.animation_data:
        return

    nla_tracks = armature.animation_data.nla_tracks
    merged_track = nla_tracks.new()
    merged_track.name = "Merged_Fix_Sliding_Track"

    # Collect all strips from Fix_Sliding_Track
    sliding_strips = []
    for track in nla_tracks:
        if track.name.startswith("Fix_Sliding_Track"):
            sliding_strips.extend(track.strips[:])
            nla_tracks.remove(track)  # Remove the track after collecting strips

    # If no strips found, return
    if not sliding_strips:
        return

    # Merge all collected actions
    merged_action = sliding_strips[0].action
    for strip in sliding_strips[1:]:
        merged_action = merge_actions(merged_action, strip.action, new_action_name="Merged_Fix_Sliding_Action")

    # Add the merged action as a new strip to the merged track
    merged_strip = merged_track.strips.new(
        name="Merged_Fix_Sliding_Strip",
        start=int(sliding_strips[0].frame_start),
        action=merged_action,
    )
    merged_strip.action_frame_start = sliding_strips[0].action_frame_start
    merged_strip.action_frame_end = sliding_strips[-1].action_frame_end


def unmute_nla_tracks(armature: bpy.types.Object):
    """
    Unmute all NLA tracks of the armature.
    """
    if not armature.animation_data:
        return

    for track in armature.animation_data.nla_tracks:
        track.mute = False


def bake_nla_to_keyframes(armature: bpy.types.Object, start_frame: int, end_frame: int):
    """
    Bake NLA track modifications to keyframes.

    Args:
        armature (bpy.types.Object): The armature object.
        start_frame (int): The start frame of baking.
        end_frame (int): The end frame of baking.
    """
    unmute_nla_tracks(armature)
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    # scene.view_layers[0].objects.active = arm

    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")

    if not armature.animation_data or not armature.animation_data.nla_tracks:
        logger.debug("No NLA tracks found. Cannot bake.")
        return

    merged_track = None
    for track in armature.animation_data.nla_tracks:
        if track.name == "Merged_Fix_Sliding_Track":
            merged_track = track
            track.mute = False  # Enable the merged track
        else:
            track.mute = True  # Mute other tracks

    if not merged_track:
        logger.debug("Merged_Fix_Sliding_Track not found.")
        return

    # Bake the NLA effects to keyframes
    bpy.ops.nla.bake(
        frame_start=start_frame,
        frame_end=end_frame,
        step=1,
        visual_keying=True,
        clear_constraints=True,
        use_current_action=False,
        bake_types={"POSE"},
    )
    logger.debug("Baked NLA track modifications to keyframes from frame %s to %s.", start_frame, end_frame)


def delete_ik_assist_bone(armature: bpy.types.Object, ik_assist_bone_names: str):
    """
    Delete the IK assist bone from the armature.

    Args:
        armature (bpy.types.Object): The armature object.
        ik_assist_bone_name (str): The name of the IK assist bone to delete.
    """
    bpy.ops.object.mode_set(mode="EDIT")
    edit_bones = armature.data.edit_bones

    for name in ik_assist_bone_names:
        if name in edit_bones:
            edit_bones.remove(edit_bones[name])
            logger.debug("Deleted IK assist bone %s.", name)
        else:
            logger.debug("IK assist bone %s not found.", name)

    bpy.ops.object.mode_set(mode="POSE")


def remove_ik_constraint(armature: bpy.types.Object, tgt_bone_name: str, constraint_name="Foot_IK_Constraint"):
    """
    Remove IK constraint from the target bone.

    Args:
        armature (bpy.types.Object): The armature object.
        tgt_bone_name (str): The name of the target bone with the IK constraint.
        constraint_name (str, optional): The name of the IK constraint to remove. Defaults to 'Foot_IK_Constraint'.
    """
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")

    tgt_bone = armature.pose.bones.get(tgt_bone_name)
    if not tgt_bone:
        logger.debug("Bone %s not found.", tgt_bone_name)
        return

    constraint = tgt_bone.constraints.get(constraint_name)
    if constraint:
        tgt_bone.constraints.remove(constraint)
        logger.debug("Removed IK constraint %s from bone %s.", constraint_name, tgt_bone_name)
    else:
        logger.debug("No IK constraint %s found on bone %s.", constraint_name, tgt_bone_name)


def remove_foot_sliding(
    armature,
    sliding_range,
    l_src_bone_name,
    l_tgt_bone_name,
    r_src_bone_name,
    r_tgt_bone_name,
    fade=5,
    chain_length=4,
):
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)

    if armature.animation_data and armature.animation_data.action:
        frame_range = armature.animation_data.action.frame_range
        frame_start = int(frame_range[0])  # Start frame
        frame_end = int(frame_range[1])  # End frame
    else:
        raise ValueError("No animation data found for the armature.")

    start_fade = fade
    end_fade = fade

    assist_bone_names = []
    tgt_bone_names = []

    for idx in range(len(sliding_range)):
        cur_segmeants = []

        if len(sliding_range[idx]) == 0:
            logger.debug("No sliding detected in foot %s !", idx)
            continue

        for i in range(len(sliding_range[idx])):
            cur_sliding_rage = sliding_range[idx][i]
            cur_segmeants.append((cur_sliding_rage[0], cur_sliding_rage[1], start_fade, end_fade))

        logger.debug("idx: %s, cur_segmeants: %s", idx, cur_segmeants)
        tgt_bone_name = None
        ik_assist_bone_name = None

        if idx == 0:
            logger.debug("-------------------- Processing left foot ! --------------------")
            tgt_bone_name = l_tgt_bone_name
            src_bone_name = l_src_bone_name
            chain_length = chain_length  # 根据实际骨骼链长度调整
            ik_assist_bone_name = "foot_ik"
        else:
            logger.debug("-------------------- Processing right foot ! --------------------")
            tgt_bone_name = r_tgt_bone_name
            src_bone_name = r_src_bone_name
            chain_length = chain_length
            ik_assist_bone_name = "foot_ik1"

        if tgt_bone_name is not None:
            tgt_bone_names.append(tgt_bone_name)
            assist_bone_names.append(ik_assist_bone_name)

        fix_sliding_multiple_segments(
            armature_name=armature.name,
            tgt_bone_name=tgt_bone_name,
            src_bone_name=src_bone_name,
            segments=cur_segmeants,
            chain_length=chain_length,
            ik_assist_bone_name=ik_assist_bone_name,
        )

    merge_fix_sliding_tracks(armature)

    bake_nla_to_keyframes(armature, start_frame=frame_start, end_frame=frame_end)

    fixed_motion_dict = export_npz_dict_from_armature(armature.name, scale=armature.scale.x)

    if len(tgt_bone_names) > 0:
        for tgt_bone_name in tgt_bone_names:
            remove_ik_constraint(armature, tgt_bone_name)

    if len(assist_bone_names) > 0:
        delete_ik_assist_bone(armature, assist_bone_names)

    merged_track = None
    for track in armature.animation_data.nla_tracks:
        if track.name == "Merged_Fix_Sliding_Track":
            merged_track = track
    armature.animation_data.nla_tracks.remove(merged_track)

    bpy.ops.object.mode_set(mode="OBJECT")

    return fixed_motion_dict


def blender_auto_post_process(
    armature,
    sliding_range,
):
    bone_mapping_dict = blend_bone_mapping(armature)

    left_upleg_bone_name = bone_mapping_dict['LeftUpLeg']
    left_toe_bone_name = bone_mapping_dict["LeftToes"]
    # right_upleg_bone_name = bone_mapping_dict['RightUpLeg']
    right_toe_bone_name = bone_mapping_dict["RightToes"]

    chain_length = 0
    tmp_bone = armature.pose.bones[left_toe_bone_name]
    while tmp_bone.name != left_upleg_bone_name:
        chain_length += 1
        tmp_bone = tmp_bone.parent

    left_toe_bone = armature.pose.bones[left_toe_bone_name]
    right_toe_bone = armature.pose.bones[right_toe_bone_name]

    if len(left_toe_bone.children) > 0:
        l_tgt_bone_name = left_toe_bone.name
        l_src_bone_name = left_toe_bone.children[0].name

        r_tgt_bone_name = right_toe_bone.name
        r_src_bone_name = right_toe_bone.children[0].name

        chain_length += 1
    else:
        l_tgt_bone_name = left_toe_bone.parent.name
        l_src_bone_name = left_toe_bone.name

        r_tgt_bone_name = right_toe_bone.parent.name
        r_src_bone_name = right_toe_bone.name

    ret_motion_dict = remove_foot_sliding(
        armature,
        sliding_range,
        l_src_bone_name,
        l_tgt_bone_name,
        r_src_bone_name,
        r_tgt_bone_name,
        fade=5,
        chain_length=chain_length,
    )

    return ret_motion_dict
