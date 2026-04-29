import json
import logging
import os

import bpy
import numpy as np
from bpy_extras import view3d_utils
from mathutils import Quaternion, Vector

from ...config import Config
from ...preferences import get_preferences
from . import retarget_functions as retarget_core
from .retarget_functions import blender_helper
from .retarget_functions.constants import (
    EULER_TYPE,
    STANDARD_BODY_JOINTS,
    STANDARD_HEAD_JOINTS,
    STANDARD_LEFT_ARM_JOINTS,
    STANDARD_LEFT_HAND_JOINTS,
    STANDARD_LEFT_LEG_JOINTS,
    STANDARD_RIGHT_ARM_JOINTS,
    STANDARD_RIGHT_HAND_JOINTS,
    STANDARD_RIGHT_LEG_JOINTS,
    STANDARD_ROOT,
    STANDARD_SKELETON_JOINTS,
)
from .retarget_functions.guard import GuardianMixin

logger = logging.getLogger("animoxtend")


""" Functions """


""" Automatic Align Rest Pose Functions """


def set_tracks_mute_status(armature, mute_status):
    if armature.animation_data is None or armature.animation_data.nla_tracks is None:
        return
    for track in armature.animation_data.nla_tracks:
        track.mute = mute_status


def _change_to_pose_mode(src_arm, tgt_arm):
    if bpy.context.active_object is not None and bpy.context.object.mode in [
        "POSE",
        "EDIT",
    ]:
        bpy.ops.object.mode_set(mode="OBJECT")

    bpy.ops.object.select_all(action="DESELECT")
    src_arm.select_set(True)
    bpy.context.view_layer.objects.active = src_arm
    tgt_arm.select_set(True)
    bpy.context.view_layer.objects.active = tgt_arm
    bpy.ops.object.mode_set(mode="POSE")


def set_restpose(armature, restpose_dict):
    quaternions = np.array(restpose_dict["bone_quaternions"])
    eulers = np.array(restpose_dict["bone_eulers"])
    locations = None

    if "bone_locations" in restpose_dict:
        locations = np.array(restpose_dict["bone_locations"])
    for i, bone_name in enumerate(restpose_dict["bone_names"]):
        bone = armature.pose.bones[bone_name]
        # set rotation
        if bone.rotation_mode == "QUATERNION":
            bone.rotation_quaternion = quaternions[i]
        elif bone.rotation_mode in EULER_TYPE:
            bone.rotation_euler = eulers[i]
        # set location
        if locations is not None:
            bone.location = locations[i]


def show_restpose(context, redefine_type, is_source=True):
    if is_source:
        armature = context.scene.source_arm
        restpose = context.scene.source_restpose
        temp_restpose = context.scene.temp_source_restpose
        init_restpose = context.scene.init_source_restpose
        tmp_action_name = context.scene.temp_source_action_name
    else:
        armature = context.scene.target_arm
        restpose = context.scene.target_restpose
        temp_restpose = context.scene.temp_target_restpose
        init_restpose = context.scene.init_target_restpose
        tmp_action_name = context.scene.temp_target_action_name

    # show align panel
    if context.scene.align_restpose_status:
        # set pose mode
        src_arm = context.scene.source_arm
        tgt_arm = context.scene.target_arm
        _change_to_pose_mode(src_arm, tgt_arm)

        if redefine_type == "SAVED" and len(temp_restpose) != 0:
            skl_dict = temp_restpose[0].get_restpose_dict()
            # clear motion
            if armature.animation_data and armature.animation_data.action:
                armature.animation_data.action = None
            # set restpose using quaternions in temp source_restpose
            set_restpose(armature, skl_dict)
            _change_to_pose_mode(src_arm, tgt_arm)
            init_restpose.clear()
            item = init_restpose.add()
            item.set_restpose_dict(skl_dict)
            return

        # extract restpose info
        skl_dict = blender_helper.extract_skeleton_info(armature)
        bone_names = list(armature.data.bones.keys())
        eulers = np.zeros((len(bone_names), 3))
        quaternions = np.zeros((len(bone_names), 4))
        quaternions[:, 0] = 1
        locations = np.zeros((len(bone_names), 3))

        # not first init
        if redefine_type == "CURRENT":
            for i, name in enumerate(bone_names):
                # save current rotation
                if armature.pose.bones[name].rotation_mode == "QUATERNION":
                    quat = armature.pose.bones[name].matrix_basis.to_quaternion()
                    quaternions[i] = np.array(quat)
                elif armature.pose.bones[name].rotation_mode in EULER_TYPE:
                    euler = armature.pose.bones[name].matrix_basis.to_euler(armature.pose.bones[name].rotation_mode)
                    eulers[i] = np.array(euler)
                else:
                    logger.error(
                        "Unsupported rotation mode: %s",
                        armature.pose.bones[name].rotation_mode,
                    )
                # save current location
                location = armature.pose.bones[name].location
                locations[i] = np.array(location)

        skl_dict["bone_names"] = bone_names
        skl_dict["bone_quaternions"] = quaternions
        skl_dict["bone_eulers"] = eulers
        skl_dict["bone_locations"] = locations

        # clear motion
        if armature.animation_data and armature.animation_data.action:
            action_name = armature.animation_data.action.name
            if is_source:
                context.scene.temp_source_action_name = action_name
            else:
                context.scene.temp_target_action_name = action_name
            armature.animation_data.action = None
            # mute tracks
            set_tracks_mute_status(armature, True)

        # record restpose
        if len(restpose) == 0 and len(temp_restpose) == 0:
            item = restpose.add()
            item.set_restpose_dict(skl_dict)
            # init temp restpose in show panel
            tmp_restpose_item = temp_restpose.add()
            tmp_restpose_item.set_restpose_dict(skl_dict)

        # set restpose using quaternions in temp source_restpose
        set_restpose(armature, skl_dict)
        _change_to_pose_mode(src_arm, tgt_arm)
        init_restpose.clear()
        item = init_restpose.add()
        item.set_restpose_dict(skl_dict)

        return

    else:
        # close align panel
        if bpy.context.active_object is not None and bpy.context.object.mode in [
            "POSE",
            "EDIT",
        ]:
            bpy.ops.object.mode_set(mode="OBJECT")
        # set motion on restpose
        for bone in armature.pose.bones:
            if bone.rotation_mode == "QUATERNION":
                bone.rotation_quaternion = (1, 0, 0, 0)
            elif bone.rotation_mode in EULER_TYPE:
                bone.rotation_euler = (0, 0, 0)
        if tmp_action_name != "":
            action = bpy.data.actions.get(tmp_action_name)
            armature.animation_data.action = action
            set_tracks_mute_status(armature, False)

        return


def update_temp_restpose_in_pose_mode(context, is_source=True):
    if is_source:
        armature = context.scene.source_arm
        temp_restpose = context.scene.temp_source_restpose
        bone_definition_list = context.scene.source_bone_definition_list
        tmp_action_name = context.scene.temp_source_action_name
    else:
        armature = context.scene.target_arm
        temp_restpose = context.scene.temp_target_restpose
        bone_definition_list = context.scene.target_bone_definition_list
        tmp_action_name = context.scene.temp_target_action_name

    skl_dict = temp_restpose[0].get_restpose_dict()
    bone_names = skl_dict["bone_names"]

    # set object mode
    if bpy.context.active_object is not None and bpy.context.object.mode in [
        "POSE",
        "EDIT",
    ]:
        bpy.ops.object.mode_set(mode="OBJECT")

    # update restpose dict: rest info for retargeting
    current_frame = context.scene.frame_current
    new_skl_dict = blender_helper.extract_skeleton_info_pose_mode(armature, current_frame)

    # update restpose dict: bone quaternions for show
    new_quaternions = np.zeros((len(bone_names), 4))
    new_quaternions[:, 0] = 1
    new_eulers = np.zeros((len(bone_names), 3))
    new_locations = np.zeros((len(bone_names), 3))
    for i, name in enumerate(bone_names):
        quat = armature.pose.bones[name].matrix_basis.to_quaternion()
        new_quaternions[i] = np.array(quat)
        if armature.pose.bones[name].rotation_mode in EULER_TYPE:
            euler = armature.pose.bones[name].matrix_basis.to_euler(armature.pose.bones[name].rotation_mode)
            new_eulers[i] = np.array(euler)
        location = armature.pose.bones[name].location
        new_locations[i] = np.array(location)
    new_skl_dict["bone_names"] = bone_names
    new_skl_dict["bone_quaternions"] = new_quaternions
    new_skl_dict["bone_eulers"] = new_eulers
    new_skl_dict["bone_locations"] = new_locations

    temp_restpose.clear()
    item = temp_restpose.add()
    item.set_restpose_dict(new_skl_dict)

    bone_mapping = {}
    for bone_item in bone_definition_list:
        key = bone_item.standard_bone_name
        value = bone_item.bone_name
        bone_mapping[key] = value

    if tmp_action_name != "":
        action = bpy.data.actions.get(tmp_action_name)
        armature.animation_data.action = action
    else:
        for bone in armature.pose.bones:
            if bone.rotation_mode == "QUATERNION":
                bone.rotation_quaternion = (1, 0, 0, 0)
            elif bone.rotation_mode in EULER_TYPE:
                bone.rotation_euler = (0, 0, 0)
            else:
                raise ValueError("Unsupported rotation mode")

    return


def apply_pose_as_restpose(context, is_source=True):
    if is_source:
        armature = context.scene.source_arm
        restpose = context.scene.source_restpose
        temp_restpose = context.scene.temp_source_restpose
        init_restpose = context.scene.init_source_restpose
        bone_definition_list = context.scene.source_bone_definition_list
        tmp_action_name = str(context.scene.temp_source_action_name)
    else:
        armature = context.scene.target_arm
        restpose = context.scene.target_restpose
        temp_restpose = context.scene.temp_target_restpose
        init_restpose = context.scene.init_target_restpose
        bone_definition_list = context.scene.target_bone_definition_list
        tmp_action_name = str(context.scene.temp_target_action_name)

    # get bone mapping
    bone_mapping = {}
    for bone_item in bone_definition_list:
        key = bone_item.standard_bone_name
        value = bone_item.bone_name
        bone_mapping[key] = value

    skl_dict = temp_restpose[0].get_restpose_dict()
    bone_names = skl_dict["bone_names"]

    # record quaternions
    saved_quaternions = np.zeros((len(bone_names), 4))
    saved_quaternions[:, 0] = 1
    saved_eulers = np.zeros((len(bone_names), 3))
    saved_location = np.zeros((len(bone_names), 3))
    for i, name in enumerate(bone_names):
        bone = armature.pose.bones[name]
        if bone.rotation_mode == "QUATERNION":
            saved_quaternions[i] = list(bone.rotation_quaternion)
        elif bone.rotation_mode in EULER_TYPE:
            saved_eulers[i] = list(bone.rotation_euler)
        else:
            raise ValueError("Unsupported rotation mode")
        saved_location[i] = list(bone.location)

    # set back motion
    action = bpy.data.actions.get(tmp_action_name)
    armature.animation_data.action = action
    start_frame = int(action.frame_range[0])
    # get motion dict
    motion_dict = blender_helper.extract_motion_dict(armature, bone_mapping[STANDARD_ROOT])
    motion_dict["start_frame"] = start_frame
    armature.animation_data.action = None
    bpy.data.actions.remove(action)

    # set saved quaternions back
    for i, name in enumerate(bone_names):
        bone = armature.pose.bones[name]
        if bone.rotation_mode == "QUATERNION":
            bone.rotation_quaternion = saved_quaternions[i]
        elif bone.rotation_mode in EULER_TYPE:
            bone.rotation_euler = saved_eulers[i]
        bone.location = saved_location[i]

    # apply pose as rest pose, update rest mesh
    blender_helper.apply_restpose(armature)
    bpy.ops.object.mode_set(mode="OBJECT")

    # clear bone quaternions
    identity_quaternions = np.zeros((len(bone_names), 4))
    identity_quaternions[:, 0] = 1
    zero_eulers = np.zeros((len(bone_names), 3))
    for i, name in enumerate(bone_names):
        bone = armature.pose.bones[name]
        if bone.rotation_mode == "QUATERNION":
            bone.rotation_quaternion = identity_quaternions[i]
        elif bone.rotation_mode in EULER_TYPE:
            bone.rotation_euler = zero_eulers[i]
        bone.location = (0, 0, 0)

    # update restpose with identity quaternion
    new_skl_dict = blender_helper.extract_skeleton_info(armature)
    new_skl_dict["bone_names"] = bone_names
    new_skl_dict["bone_quaternions"] = identity_quaternions
    new_skl_dict["bone_eulers"] = zero_eulers
    restpose.clear()
    item = restpose.add()
    item.set_restpose_dict(new_skl_dict.copy())
    temp_restpose.clear()
    temp_item = temp_restpose.add()
    temp_item.set_restpose_dict(new_skl_dict.copy())
    init_restpose.clear()
    init_item = init_restpose.add()
    init_item.set_restpose_dict(new_skl_dict.copy())

    # update action
    new_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
        motion_dict, skl_dict, new_skl_dict, bone_mapping
    )
    blender_helper.assign_npz_motion_to_armature(new_motion_dict, armature, bone_mapping[STANDARD_ROOT])

    # set action None again
    if is_source:
        context.scene.temp_source_action_name = armature.animation_data.action.name
    else:
        context.scene.temp_target_action_name = armature.animation_data.action.name
    armature.animation_data.action = None

    # clear quaterninos and locations
    for bone in armature.pose.bones:
        if bone.rotation_mode == "QUATERNION":
            bone.rotation_quaternion = (1, 0, 0, 0)
        elif bone.rotation_mode in EULER_TYPE:
            bone.rotation_euler = (0, 0, 0)
        bone.location = (0, 0, 0)

    _change_to_pose_mode(context.scene.source_arm, context.scene.target_arm)

    logger.info("Apply pose as rest pose successfully.")


def apply_pose_as_restpose_extend(armature):
    # get bone mapping
    bone_mapping = retarget_core.automatic_bone_mapping(armature)
    if bone_mapping[STANDARD_ROOT] not in ["", None]:
        root_name = bone_mapping[STANDARD_ROOT]
    else:
        root_name = armature.pose.bones[0].name

    motion_exist = bool(armature.animation_data and armature.animation_data.action)

    # extract motion info
    if motion_exist:
        motion_dict = blender_helper.extract_motion_dict(armature, root_name)

    # extract skeleton info
    skl_dict = blender_helper.extract_skeleton_info(armature)

    # apply pose as rest pose, update rest mesh
    blender_helper.apply_restpose(armature)
    bpy.ops.object.mode_set(mode="OBJECT")

    # update restpose with identity quaternion
    new_skl_dict = blender_helper.extract_skeleton_info(armature)

    # motion transfer
    if motion_exist:
        new_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
            motion_dict, skl_dict, new_skl_dict, bone_mapping
        )
        blender_helper.assign_npz_motion_to_armature(new_motion_dict, armature, root_name)


def get_intermidia_skeleton_info(pose_type="T-pose", blend_path="/../assets/RestposeLibrary.blend"):
    object_name = pose_type.replace("-", "")

    # append the humanoid armature
    file_dir = os.path.dirname(os.path.abspath(__file__))
    addon_directory = os.path.dirname(file_dir)
    filepath = addon_directory + blend_path

    # append object to scene
    bpy.ops.wm.append(
        filepath=os.path.join(filepath, "Object", object_name),
        directory=os.path.join(filepath, "Object"),
        filename=object_name,
    )

    obj = bpy.data.objects.get(object_name)
    if obj:
        intermidia_skl_info = blender_helper.extract_skeleton_info(obj)
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.delete()

        return intermidia_skl_info

    else:
        logger.warning(f"Cannot find {pose_type} intermidia armature object.")

        return None


""" Bone Mapping Functions """


def load_bone_mapping(self, is_source=True):
    scn = bpy.context.scene

    if is_source:
        armature = scn.source_arm
        bone_definition_list = scn.source_bone_definition_list
    else:
        armature = scn.target_arm
        bone_definition_list = scn.target_bone_definition_list

    filepath = self.filepath

    with open(filepath, "r") as infile:
        bone_mapping = json.load(infile)

    bone_definition_list.clear()

    exist_bone_names = list(armature.data.bones.keys())
    for key, value in bone_mapping.items():
        item = bone_definition_list.add()
        item.standard_bone_name = key
        if value in exist_bone_names:
            item.bone_name = value
        else:
            item.bone_name = ""

    logger.info("Load bone mapping successfully.")


def save_bone_mapping(filepath, is_source=True):
    scn = bpy.context.scene

    if is_source:
        bone_definition_list = scn.source_bone_definition_list
    else:
        bone_definition_list = scn.target_bone_definition_list

    if not filepath.endswith(".json"):
        filepath += ".json"

    bone_mapping = {}
    for bone_item in bone_definition_list:
        key = bone_item.standard_bone_name
        value = bone_item.bone_name
        bone_mapping[key] = value

    with open(filepath, "w") as outfile:
        json.dump(bone_mapping, outfile, indent=4)

    logger.info("Save bone mapping successfully.")


def clear_saved_dict(context):
    context.scene.source_restpose.clear()
    context.scene.temp_source_restpose.clear()
    context.scene.init_source_restpose.clear()
    context.scene.temp_source_action_name = ""

    context.scene.target_restpose.clear()
    context.scene.temp_target_restpose.clear()
    context.scene.init_target_restpose.clear()
    context.scene.temp_target_action_name = ""


def update_source_armature(self, context):
    arm_name = context.scene.source_arm_name
    if arm_name and arm_name in bpy.data.objects:
        context.scene.source_arm = bpy.data.objects[arm_name]
    else:
        context.scene.source_arm = None
        context.scene.expand_src_mapping = False
        context.scene.src_map_depress = False
        context.scene.src_check_mapping_result = ""
        context.scene.src_root_valid_status = False


def update_target_armature(self, context):
    arm_name = context.scene.target_arm_name
    if arm_name and arm_name in bpy.data.objects:
        context.scene.target_arm = bpy.data.objects[arm_name]
    else:
        context.scene.target_arm = None
        context.scene.expand_tgt_mapping = False
        context.scene.tgt_map_depress = False
        context.scene.tgt_check_mapping_result = ""
        context.scene.tgt_root_valid_status = False


def update_start_frame(self, context):
    source_arm = context.scene.source_arm
    if source_arm and source_arm.animation_data and source_arm.animation_data.action:
        frame_range = source_arm.animation_data.action.frame_range
        action_start, _ = map(int, frame_range)
        my_end_frame = context.scene.end_frame
        new_start = min(max(action_start, context.scene.start_frame), my_end_frame)
        if new_start != context.scene.start_frame:
            context.scene.start_frame = new_start
    else:
        context.scene.start_frame = 1


def update_end_frame(self, context):
    source_arm = context.scene.source_arm
    if source_arm and source_arm.animation_data and source_arm.animation_data.action:
        frame_range = source_arm.animation_data.action.frame_range
        _, action_end = map(int, frame_range)
        my_start_frame = context.scene.start_frame
        new_end = min(max(my_start_frame, context.scene.end_frame), action_end)
        if new_end != context.scene.end_frame:
            context.scene.end_frame = new_end
    else:
        context.scene.end_frame = 1


def reload_source_bone_mapping(self, context):
    obj = context.scene.source_arm
    if context.scene.source_arm:
        context.scene.src_root_valid_status = False

        bpy.ops.animoxtend.build_source_bone_list()
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

        clear_saved_dict(context)
        context.scene.expand_src_mapping = False
        context.scene.src_check_mapping_result = ""
        check_src_mapping_valid(None, context)

        if obj.type != "ARMATURE":
            logger.warning("Source must be a ARMATURE object.")
        else:
            # get frame range
            anim_data = obj.animation_data
            if anim_data and anim_data.action:
                action = anim_data.action
                frame_range = action.frame_range
                start_frame, end_frame = map(int, frame_range)
                context.scene.start_frame = start_frame
                context.scene.end_frame = end_frame


def reload_target_bone_mapping(self, context):
    if context.scene.target_arm:
        bpy.ops.animoxtend.build_target_bone_list()
        bpy.ops.object.select_all(action="DESELECT")
        armature = context.scene.target_arm
        armature.select_set(True)
        bpy.context.view_layer.objects.active = armature

        clear_saved_dict(context)
        context.scene.expand_tgt_mapping = False
        context.scene.tgt_check_mapping_result = ""
        check_tgt_mapping_valid(None, context)

        if context.scene.target_arm.type != "ARMATURE":
            logger.warning("Target must be a ARMATURE object.")


def check_bone_mapping(bone_mapping):
    # check root
    root_valid = False
    if bone_mapping[STANDARD_ROOT] not in ["", None]:
        root_valid = True

    # check body parts
    body_parts = {
        "Head": STANDARD_HEAD_JOINTS,
        "Body": STANDARD_BODY_JOINTS,
        "Left Arm": STANDARD_LEFT_ARM_JOINTS,
        "Right Arm": STANDARD_RIGHT_ARM_JOINTS,
        "Left Leg": STANDARD_LEFT_LEG_JOINTS,
        "Right Leg": STANDARD_RIGHT_LEG_JOINTS,
        "Left Hand": STANDARD_LEFT_HAND_JOINTS,
        "Right Hand": STANDARD_RIGHT_HAND_JOINTS,
    }
    missing_parts = []
    for key, bones in body_parts.items():
        if key == "Body":
            n_spine_missing = 0
            for bone in bones:
                if bone_mapping[bone] in ["", None] and "hips" in bone.lower():
                    missing_parts.append(key)
                    break
                elif bone_mapping[bone] in ["", None] and "spine" in bone.lower():
                    n_spine_missing += 1
            if n_spine_missing > 1:
                missing_parts.append(key)
        else:
            for bone in bones:
                if bone_mapping[bone] in ["", None] and "cup" not in bone.lower():
                    missing_parts.append(key)
                    break

    if len(missing_parts) > 0:
        missing_msg = f'Missing bones in: {", ".join(missing_parts)}.'
    else:
        missing_msg = ""

    return root_valid, missing_msg


def check_src_mapping_valid(self, context):
    n_bones = len(context.scene.source_bone_definition_list)
    if context.scene.source_arm and n_bones == len(STANDARD_SKELETON_JOINTS):
        src_mapping = {}
        for item in context.scene.source_bone_definition_list:
            key = item.standard_bone_name
            value = item.bone_name
            src_mapping[key] = value
        root_valid, missing_msg = check_bone_mapping(src_mapping)
        context.scene.src_root_valid_status = root_valid
        context.scene.src_check_mapping_result = missing_msg
    else:
        context.scene.src_root_valid_status = True
        context.scene.src_check_mapping_result = ""


def check_tgt_mapping_valid(self, context):
    n_bones = len(context.scene.target_bone_definition_list)
    if context.scene.target_arm and n_bones == len(STANDARD_SKELETON_JOINTS):
        tgt_mapping = {}
        for item in context.scene.target_bone_definition_list:
            key = item.standard_bone_name
            value = item.bone_name
            tgt_mapping[key] = value
        root_valid, missing_msg = check_bone_mapping(tgt_mapping)
        context.scene.tgt_root_valid_status = root_valid
        context.scene.tgt_check_mapping_result = missing_msg
    else:
        context.scene.tgt_root_valid_status = True
        context.scene.tgt_check_mapping_result = ""


def build_bone_list(context, is_source=True):
    if is_source:
        armature = context.scene.source_arm
        bone_definition_list = context.scene.source_bone_definition_list
    else:
        armature = context.scene.target_arm
        bone_definition_list = context.scene.target_bone_definition_list

    # clear the bone list
    bone_definition_list.clear()

    # match joints
    bone_mapping_dict = retarget_core.automatic_bone_mapping(armature)
    for standard_bone_name, bone_name in bone_mapping_dict.items():
        item = bone_definition_list.add()
        item.standard_bone_name = standard_bone_name
        item.bone_name = bone_name

    logger.info("Build bone list successfully.")


def remember_bone_mapping(context, is_source):
    scn = context.scene
    if scn.remember_mapping_name == "":
        return False
    # save the bone mapping as assets
    file_path = f'/../assets/bone_mapping/{scn.remember_mapping_name}.json'
    file_dir = os.path.dirname(os.path.abspath(__file__))
    addon_directory = os.path.dirname(file_dir)
    abs_filepath = addon_directory + file_path
    save_bone_mapping(abs_filepath, is_source)
    return True


""" Automatic Restpose Align Functions """


def auto_align_restpose(context, is_source=True, pose_type="Tpose"):
    if is_source:
        armature = context.scene.source_arm
        restpose = context.scene.source_restpose
        bone_definition_list = context.scene.source_bone_definition_list
    else:
        armature = context.scene.target_arm
        restpose = context.scene.target_restpose
        bone_definition_list = context.scene.target_bone_definition_list

    # get bone mapping
    bone_mapping = {}
    for bone_item in bone_definition_list:
        key = bone_item.standard_bone_name
        value = bone_item.bone_name
        bone_mapping[key] = value

    # get skeleton info for current pose
    skl_dict = blender_helper.extract_skeleton_info_pose_mode(armature)
    ori_skl_dict = restpose[0].get_restpose_dict()
    skl_dict["bone_names"] = list(armature.data.bones.keys())

    # adjust armature orientation, make it face -y axis
    rot_angle = retarget_core.get_rotation_to_normalize(skl_dict, bone_mapping)
    if bpy.context.active_object is not None and bpy.context.object.mode in [
        "POSE",
        "EDIT",
    ]:
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="DESELECT")
    root = armature.data.bones[bone_mapping[STANDARD_ROOT]]
    root.select = True
    armature.data.bones.active = root
    bpy.ops.transform.rotate(
        value=rot_angle,
        orient_axis="Z",
        orient_type="GLOBAL",
        orient_matrix=((1, 0, 0), (0, 1, 0), (0, 0, 1)),
        orient_matrix_type="GLOBAL",
        constraint_axis=(False, False, True),
    )

    new_skl_dict = blender_helper.extract_skeleton_info_pose_mode(armature)
    new_skl_dict["bone_names"] = list(armature.data.bones.keys())

    # extend blender and get intermidia skeleton info
    inter_skl_info = get_intermidia_skeleton_info(pose_type)

    if inter_skl_info:
        new_quaternions = retarget_core.auto_align_rest_pose(new_skl_dict, inter_skl_info, ori_skl_dict, bone_mapping)
        new_skl_dict["bone_quaternions"] = new_quaternions
        # convert quaternion to euler
        eulers = [Quaternion(q).to_euler("XYZ") for q in new_skl_dict["bone_quaternions"]]
        new_skl_dict["bone_eulers"] = np.array(eulers)

    _change_to_pose_mode(context.scene.source_arm, context.scene.target_arm)

    # re-show
    set_restpose(armature, new_skl_dict)

    if inter_skl_info:
        logger.info("Auto align rest pose successfully.")
    else:
        logger.warning("Auto align to %s rest pose failed.", pose_type)


def extract_face_normalized_skeleton_info(armature, bone_mapping):
    current_frame = bpy.context.scene.frame_current
    # set object mode
    if bpy.context.active_object is not None and bpy.context.object.mode in [
        "POSE",
        "EDIT",
    ]:
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")

    # duplicate armature copy
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.duplicate(linked=False, mode="TRANSLATION")
    duplicated_armature = bpy.context.active_object

    # clear motion
    duplicated_armature.animation_data_clear()
    for bone in duplicated_armature.pose.bones:
        bone.location = (0, 0, 0)
        if bone.rotation_mode == "QUATERNION":
            bone.rotation_quaternion = (1, 0, 0, 0)
        elif bone.rotation_mode in EULER_TYPE:
            bone.rotation_euler = (0, 0, 0)
        else:
            raise ValueError(f"Unknown rotation mode: {bone.rotation_mode}")
    skl_dict = blender_helper.extract_skeleton_info_pose_mode(duplicated_armature)
    skl_dict["bone_names"] = list(armature.data.bones.keys())

    # set pose mode
    bpy.ops.object.select_all(action="DESELECT")
    duplicated_armature.select_set(True)
    bpy.context.view_layer.objects.active = duplicated_armature
    bpy.ops.object.mode_set(mode="POSE")

    # adjust armature orientation, make it face -y axis
    rot_angle = retarget_core.get_rotation_to_normalize(skl_dict, bone_mapping)
    bpy.ops.pose.select_all(action="DESELECT")
    root = duplicated_armature.data.bones[bone_mapping[STANDARD_ROOT]]
    root.select = True
    duplicated_armature.data.bones.active = root
    bpy.ops.transform.rotate(
        value=rot_angle,
        orient_axis="Z",
        orient_type="GLOBAL",
        orient_matrix=((1, 0, 0), (0, 1, 0), (0, 0, 1)),
        orient_matrix_type="GLOBAL",
        constraint_axis=(False, False, True),
    )

    # extract motion dict in pose mode
    new_skl_dict = blender_helper.extract_skeleton_info_pose_mode(duplicated_armature)
    new_skl_dict["bone_names"] = list(duplicated_armature.data.bones.keys())

    # set object mode
    if bpy.context.active_object is not None and bpy.context.object.mode in [
        "POSE",
        "EDIT",
    ]:
        bpy.ops.object.mode_set(mode="OBJECT")

    # delete armature copy
    bpy.ops.object.select_all(action="DESELECT")
    duplicated_armature.select_set(True)
    bpy.context.view_layer.objects.active = duplicated_armature
    bpy.ops.object.delete()

    bpy.context.scene.frame_set(current_frame)

    return new_skl_dict


""" Retargeting Functions """


def single_retarget(context, src_arm, tgt_arm, auto_redefine_flag, *, api_key, server_host, **kwargs):
    res, msg = 0, ''
    src_restpose = context.scene.source_restpose
    src_temp_restpose = context.scene.temp_source_restpose
    tgt_restpose = context.scene.target_restpose
    tgt_temp_restpose = context.scene.temp_target_restpose

    # get source and target bone mapping
    src_mapping = {}
    for bone_item in context.scene.source_bone_definition_list:
        key = bone_item.standard_bone_name
        value = bone_item.bone_name
        src_mapping[key] = value
    tgt_mapping = {}
    for bone_item in context.scene.target_bone_definition_list:
        key = bone_item.standard_bone_name
        value = bone_item.bone_name
        tgt_mapping[key] = value

    # retarget config
    auto_scale = context.scene.automatic_scale
    optimize_spine = context.scene.optimize_mult_level_spines
    keep_target_place = context.scene.keep_target_place

    motion_dict = blender_helper.extract_motion_dict(src_arm, src_mapping[STANDARD_ROOT])
    src_skl_dict = blender_helper.extract_skeleton_info(src_arm)
    tgt_skl_dict = blender_helper.extract_skeleton_info(tgt_arm)

    # extract motion dict and restpose dict
    if auto_redefine_flag:
        # extract motion dict and restpose dict
        adj_src_skl_dict = extract_face_normalized_skeleton_info(src_arm, src_mapping)
        adj_tgt_skl_dict = extract_face_normalized_skeleton_info(tgt_arm, tgt_mapping)
        adj_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
            motion_dict, src_skl_dict, adj_src_skl_dict, src_mapping
        )

        # automatic retarget
        adj_tgt_motion_dict = retarget_core.animo_retarget(
            motion_dict=adj_motion_dict,
            src_skeleton_info=adj_src_skl_dict,
            tgt_skeleton_info=adj_tgt_skl_dict,
            src_bone_mapping=src_mapping,
            tgt_bone_mapping=tgt_mapping,
            auto_scale=auto_scale,
            optimize_spine=optimize_spine,
            auto_align_restpose=auto_redefine_flag,
            api_key=api_key,
            server_host=server_host,
        )

        tgt_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
            adj_tgt_motion_dict, adj_tgt_skl_dict, tgt_skl_dict, tgt_mapping
        )
        show_motion_dict = tgt_motion_dict
    elif not auto_redefine_flag and not context.scene.auto_align_depress:
        if len(src_temp_restpose) == 0:
            # update restpose and motion
            src_skl_dict = blender_helper.extract_skeleton_info(src_arm)
            src_names = list(src_arm.data.bones.keys())
            src_quats = np.zeros((len(src_names), 4))
            src_quats[:, 0] = 1
            src_eulers = np.zeros((len(src_names), 3))
            src_skl_dict["bone_names"] = src_names
            src_skl_dict["bone_quaternions"] = src_quats
            src_skl_dict["bone_eulers"] = src_eulers
            tgt_skl_dict = blender_helper.extract_skeleton_info(tgt_arm)
            tgt_names = list(tgt_arm.data.bones.keys())
            tgt_quats = np.zeros((len(tgt_names), 4))
            tgt_quats[:, 0] = 1
            tgt_eulers = np.zeros((len(tgt_names), 3))
            tgt_skl_dict["bone_names"] = tgt_names
            tgt_skl_dict["bone_quaternions"] = tgt_quats
            tgt_skl_dict["bone_eulers"] = tgt_eulers
            item = src_restpose.add()
            item.set_restpose_dict(src_skl_dict)
            item = src_temp_restpose.add()
            item.set_restpose_dict(src_skl_dict)
            item = tgt_restpose.add()
            item.set_restpose_dict(tgt_skl_dict)
            item = tgt_temp_restpose.add()
            item.set_restpose_dict(tgt_skl_dict)

        src_skl_dict = src_restpose[0].get_restpose_dict()
        tgt_skl_dict = tgt_restpose[0].get_restpose_dict()
        tmp_src_skl_dict = src_temp_restpose[0].get_restpose_dict()
        tmp_tgt_skl_dict = tgt_temp_restpose[0].get_restpose_dict()

        # get custom frame range
        real_start_frame = int(src_arm.animation_data.action.frame_range[0])
        start_idx = context.scene.start_frame - real_start_frame
        end_idx = context.scene.end_frame - real_start_frame + 1

        # update motion
        motion_dict["rotmat"] = motion_dict["rotmat"][start_idx:end_idx]
        motion_dict["transl"] = motion_dict["transl"][start_idx:end_idx]
        motion_dict["len"] = int(end_idx - start_idx)
        motion_dict["start_frame"] = context.scene.start_frame

        tmp_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
            motion_dict, src_skl_dict, tmp_src_skl_dict, src_mapping
        )

        # advanced retarget
        tmp_tgt_motion_dict = retarget_core.animo_retarget(
            motion_dict=tmp_motion_dict,
            src_skeleton_info=tmp_src_skl_dict,
            tgt_skeleton_info=tmp_tgt_skl_dict,
            src_bone_mapping=src_mapping,
            tgt_bone_mapping=tgt_mapping,
            auto_scale=auto_scale,
            optimize_spine=optimize_spine,
            auto_align_restpose=auto_redefine_flag,
            api_key=api_key,
            server_host=server_host,
        )

        # motion transfer
        ori_tgt_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
            tmp_tgt_motion_dict, tmp_tgt_skl_dict, tgt_skl_dict, tgt_mapping
        )
        show_motion_dict = ori_tgt_motion_dict

    elif not auto_redefine_flag and context.scene.auto_align_depress:
        # extract motion dict and restpose dict
        adj_src_skl_dict = extract_face_normalized_skeleton_info(src_arm, src_mapping)
        adj_tgt_skl_dict = extract_face_normalized_skeleton_info(tgt_arm, tgt_mapping)
        adj_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
            motion_dict, src_skl_dict, adj_src_skl_dict, src_mapping
        )

        # get custom frame range
        real_start_frame = int(src_arm.animation_data.action.frame_range[0])
        start_idx = context.scene.start_frame - real_start_frame
        end_idx = context.scene.end_frame - real_start_frame + 1

        # update motion
        adj_motion_dict["rotmat"] = adj_motion_dict["rotmat"][start_idx:end_idx]
        adj_motion_dict["transl"] = adj_motion_dict["transl"][start_idx:end_idx]
        adj_motion_dict["len"] = int(end_idx - start_idx)
        adj_motion_dict["start_frame"] = context.scene.start_frame

        # automatic retarget
        adj_tgt_motion_dict = retarget_core.animo_retarget(
            motion_dict=adj_motion_dict,
            src_skeleton_info=adj_src_skl_dict,
            tgt_skeleton_info=adj_tgt_skl_dict,
            src_bone_mapping=src_mapping,
            tgt_bone_mapping=tgt_mapping,
            auto_scale=auto_scale,
            optimize_spine=optimize_spine,
            auto_align_restpose=True,
            api_key=api_key,
            server_host=server_host,
        )

        tgt_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
            adj_tgt_motion_dict, adj_tgt_skl_dict, tgt_skl_dict, tgt_mapping
        )
        show_motion_dict = tgt_motion_dict

    # keep target place
    if keep_target_place:
        res_motion_dict = retarget_core.keep_rest_init_place(show_motion_dict, tgt_skl_dict, tgt_mapping)
        if res_motion_dict is not None:
            show_motion_dict = res_motion_dict
        else:
            res = 2
            msg = "Cannot keep target place."

    # assign returned motion on target armature
    blender_helper.assign_npz_motion_to_armature(show_motion_dict, tgt_arm, tgt_mapping[STANDARD_ROOT])

    return res, msg


def paste_motion(context, src_arm, tgt_arm, *, api_key, server_host, **kwargs):
    # get source bone mapping
    src_mapping = {}
    for bone_item in context.scene.copy_bone_definition_list:
        key = bone_item.standard_bone_name
        value = bone_item.bone_name
        src_mapping[key] = value

    # check source mapping
    if src_mapping[STANDARD_ROOT] in ["", None]:
        error_msg = "Automatic bone mapping for source armature failed. Please do retargeting on the panel."
        return 1, error_msg

    # build target bone mapping
    tgt_mapping = retarget_core.automatic_bone_mapping(tgt_arm)

    # check target mapping
    if tgt_mapping[STANDARD_ROOT] in ["", None]:
        error_msg = "Automatic bone mapping for target armature failed. Please do retargeting on the panel."
        return 1, error_msg

    # extract motion dict and restpose dict
    motion_dict = blender_helper.extract_motion_dict(src_arm, src_mapping[STANDARD_ROOT])

    # extract skeleton info
    src_skl_dict = blender_helper.extract_skeleton_info(src_arm)
    tgt_skl_dict = blender_helper.extract_skeleton_info(tgt_arm)
    adj_src_skl_dict = extract_face_normalized_skeleton_info(src_arm, src_mapping)
    adj_tgt_skl_dict = extract_face_normalized_skeleton_info(tgt_arm, tgt_mapping)
    adj_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
        motion_dict, src_skl_dict, adj_src_skl_dict, src_mapping
    )

    # animo retarget
    adj_tgt_motion_dict = retarget_core.animo_retarget(
        motion_dict=adj_motion_dict,
        src_skeleton_info=adj_src_skl_dict,
        tgt_skeleton_info=adj_tgt_skl_dict,
        src_bone_mapping=src_mapping,
        tgt_bone_mapping=tgt_mapping,
        auto_scale=True,
        optimize_spine=False,
        auto_align_restpose=True,
        api_key=api_key,
        server_host=server_host,
    )

    # motion transfer
    tgt_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
        adj_tgt_motion_dict, adj_tgt_skl_dict, tgt_skl_dict, tgt_mapping
    )

    # keep place
    if (context.scene.keep_target_place and context.scene.expand_advanced_ui) or not context.scene.expand_advanced_ui:
        tgt_motion_dict = retarget_core.keep_rest_init_place(tgt_motion_dict, tgt_skl_dict, tgt_mapping)

    # assign returned motion on target armature
    blender_helper.assign_npz_motion_to_armature(tgt_motion_dict, tgt_arm, tgt_mapping[STANDARD_ROOT])

    # active target armature
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = tgt_arm
    tgt_arm.select_set(True)

    return 0, ''


def part_paste_motion(context, src_arm, tgt_arm, tgt_selected_bones, *, api_key, server_host, **kwargs):
    # get source bone mapping
    src_mapping = {}
    src_selected_bones = []
    for bone_item in context.scene.part_copy_bone_definition_list:
        key = bone_item.standard_bone_name
        value = bone_item.bone_name
        src_mapping[key] = value
        if bone_item.is_selected:
            src_selected_bones.append(value)

    # check source mapping
    if src_mapping[STANDARD_ROOT] in ["", None]:
        msg = "Automatic bone mapping for source armature failed. Please do retargeting on the panel."
        return 1, msg

    # build target bone mapping
    tgt_mapping = retarget_core.automatic_bone_mapping(tgt_arm)

    # check target mapping
    if tgt_mapping[STANDARD_ROOT] in ["", None]:
        msg = "Automatic bone mapping for target armature failed. Please do retargeting on the panel."
        return 1, msg

    # check selected bones
    filter_tgt_bones = []
    for key in tgt_mapping.keys():
        if tgt_mapping[key] in tgt_selected_bones and src_mapping[key] in src_selected_bones:
            filter_tgt_bones.append(tgt_mapping[key])
    if len(filter_tgt_bones) == 0:
        msg = "No valid bone mapping."
        return 1, msg

    # extract motion dict and restpose dict
    motion_dict = blender_helper.extract_motion_dict(src_arm, src_mapping[STANDARD_ROOT], src_selected_bones)

    # extract skeleton info
    src_skl_dict = blender_helper.extract_skeleton_info(src_arm)
    tgt_skl_dict = blender_helper.extract_skeleton_info(tgt_arm)
    adj_src_skl_dict = extract_face_normalized_skeleton_info(src_arm, src_mapping)
    adj_tgt_skl_dict = extract_face_normalized_skeleton_info(tgt_arm, tgt_mapping)
    adj_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
        motion_dict, src_skl_dict, adj_src_skl_dict, src_mapping
    )

    # animo retarget
    adj_tgt_motion_dict = retarget_core.animo_retarget(
        motion_dict=adj_motion_dict,
        src_skeleton_info=adj_src_skl_dict,
        tgt_skeleton_info=adj_tgt_skl_dict,
        src_bone_mapping=src_mapping,
        tgt_bone_mapping=tgt_mapping,
        auto_scale=True,
        optimize_spine=False,
        auto_align_restpose=True,
        selected_target_bones=filter_tgt_bones,
        api_key=api_key,
        server_host=server_host,
    )

    # motion transfer
    tgt_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
        adj_tgt_motion_dict, adj_tgt_skl_dict, tgt_skl_dict, tgt_mapping
    )

    # assign returned motion on target armature
    blender_helper.assign_npz_motion_to_armature(tgt_motion_dict, tgt_arm, tgt_mapping[STANDARD_ROOT])

    # set pose mode
    if bpy.context.active_object is not None and bpy.context.object.mode in [
        "POSE",
        "EDIT",
    ]:
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    tgt_arm.select_set(True)
    bpy.context.view_layer.objects.active = tgt_arm
    bpy.ops.object.mode_set(mode="POSE")

    return 0, ''


""" OPERATORS """


""" Operators For Build Bone Mapping """


class OBJECT_OT_SourceBuildBoneList(bpy.types.Operator):
    bl_idname = "animoxtend.build_source_bone_list"
    bl_label = "Build Source Bone List"
    bl_description = "Build source bone mapping"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    def execute(self, context):
        if context.scene.source_arm is None or context.scene.source_arm.type != "ARMATURE":
            return {"FINISHED"}

        # build bone list
        build_bone_list(context, is_source=True)

        if context.scene.source_bone_definition_list[0].bone_name not in ["", None]:
            context.scene.src_root_valid_status = True

        return {"FINISHED"}


class OBJECT_OT_TargetBuildBoneList(bpy.types.Operator):
    bl_idname = "animoxtend.build_target_bone_list"
    bl_label = "Build Target Bone List"
    bl_description = "Build target bone mapping"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    def execute(self, context):
        if context.scene.target_arm is None or context.scene.target_arm.type != "ARMATURE":
            return {"FINISHED"}

        # build bone list
        build_bone_list(context, is_source=False)

        if context.scene.target_bone_definition_list[0].bone_name not in ["", None]:
            context.scene.tgt_root_valid_status = True

        return {"FINISHED"}


class OBJECT_OT_ClearBoneList(bpy.types.Operator):
    bl_idname = "animoxtend.clear_bone_list"
    bl_label = "Clear Bone List"
    bl_description = "Clear bone list"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    pick_action: bpy.props.EnumProperty(
        items=(
            ("source", "source", ""),
            ("target", "target", ""),
        )
    )

    def execute(self, context):
        if self.pick_action == "source":
            bone_definition_list = context.scene.source_bone_definition_list
        else:
            bone_definition_list = context.scene.target_bone_definition_list

        for bone_item in bone_definition_list:
            bone_item.bone_name = ""

        return {"FINISHED"}


class OBJECT_OT_LoadBoneList(bpy.types.Operator):
    bl_idname = "animoxtend.load_bone_list"
    bl_label = "Load Bone List"
    bl_description = "Load bone list"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    filter_glob: bpy.props.StringProperty(default="*.json", options={"HIDDEN"})  # type: ignore
    filepath: bpy.props.StringProperty(subtype="FILE_PATH", default="json")  # type: ignore
    pick_action: bpy.props.EnumProperty(
        items=(
            ("source", "source", ""),
            ("target", "target", ""),
        )
    )

    def execute(self, context):
        load_bone_mapping(self, is_source=(self.pick_action == "source"))

        self.report({"INFO"}, f"Import {self.pick_action} bone mapping successfully.")

        return {"FINISHED"}

    def invoke(self, context, event):
        self.filepath = ""
        context.window_manager.fileselect_add(self)

        return {"RUNNING_MODAL"}


class OBJECT_OT_SourceSaveBoneList(bpy.types.Operator):
    bl_idname = "animoxtend.save_source_bone_list"
    bl_label = "Save Source Bone List"
    bl_description = "Save source bone list"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    filter_glob: bpy.props.StringProperty(default="*.json", options={"HIDDEN"})  # type: ignore
    filepath: bpy.props.StringProperty(subtype="FILE_PATH", default="json")  # type: ignore

    @classmethod
    def poll(cls, context):
        return context.scene.src_root_valid_status

    def execute(self, context):
        save_bone_mapping(self.filepath, is_source=True)

        self.report({"INFO"}, "Export source bone mapping successfully.")

        return {"FINISHED"}

    def invoke(self, context, event):
        self.filepath = "bone_mapping.json"
        context.window_manager.fileselect_add(self)

        return {"RUNNING_MODAL"}


class OBJECT_OT_TargetSaveBoneList(bpy.types.Operator):
    bl_idname = "animoxtend.save_target_bone_list"
    bl_label = "Save Target Bone List"
    bl_description = "Save target bone list"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    filter_glob: bpy.props.StringProperty(default="*.json", options={"HIDDEN"})  # type: ignore
    filepath: bpy.props.StringProperty(subtype="FILE_PATH", default="json")  # type: ignore

    @classmethod
    def poll(cls, context):
        return context.scene.tgt_root_valid_status

    def execute(self, context):
        save_bone_mapping(self.filepath, is_source=False)

        self.report({"INFO"}, "Export target bone mapping successfully.")

        return {"FINISHED"}

    def invoke(self, context, event):
        self.filepath = "bone_mapping.json"
        context.window_manager.fileselect_add(self)

        return {"RUNNING_MODAL"}


class OBJECT_OT_MemorizeBoneMapping(bpy.types.Operator):
    bl_idname = "animoxtend.memorize_bone_list"
    bl_label = "Keep Current Bone Mapping in Memory"
    bl_description = "Memorize current bone mapping. Once memorized, it will be used for auto mapping"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    pick_action: bpy.props.EnumProperty(
        items=(
            ("source", "source", ""),
            ("target", "target", ""),
        )
    )

    def __init__(self):
        self.mapping_names = []
        self.root_names = []

    def execute(self, context):
        res = remember_bone_mapping(context, self.pick_action == "source")
        if res:
            self.report(
                {"INFO"}, "Memorize current bone mapping successfully. Saved in 'animoxtend/assets/bone_mapping/.'."
            )
            self._refresh_mapping_list(context)
        else:
            self.report({"ERROR"}, "Failed to memorize current bone mapping. Mapping name cannot be empty.")

        return {"FINISHED"}

    def draw(self, context):
        layout = self.layout
        row = layout.row(align=True)
        split = row.split(factor=0.33)
        split.label(text="Mapping Name:")
        split.prop(context.scene, "remember_mapping_name", text="")
        row = layout.row(align=True)
        row.label(text="Memorized mapping will enhance auto mapping.", icon="INFO")

        layout.separator()
        row = layout.row(align=True)
        split = row.split(factor=0.5)
        split.label(text="Memorized Mapping:")
        split.label(text="Hips Name:")
        row = layout.row(align=True)
        row.template_list(
            ANIMOXTEND_UL_MappingInMemory.bl_idname,
            "Mapping In Memory",
            bpy.context.scene,
            "mapping_memory_list",
            bpy.context.scene,
            "mapping_memory_index",
            rows=2,
            maxrows=10,
        )
        row = layout.row(align=True)
        row.operator(OBJECT_OT_DeleteMemoryItem.bl_idname, text="Delete Mapping")

    def invoke(self, context, event):
        context.scene.remember_mapping_name = ''
        self._refresh_mapping_list(context)
        wm = context.window_manager
        return wm.invoke_props_dialog(self, width=313)

    def _refresh_mapping_list(self, context):
        # get mapping assets directory
        rel_assets_path = '/../assets/bone_mapping/'
        file_dir = os.path.dirname(os.path.abspath(__file__))
        addon_directory = os.path.dirname(file_dir)
        abs_assets_path = addon_directory + rel_assets_path
        if not os.path.exists(abs_assets_path):
            os.makedirs(abs_assets_path)
        # get mapping in memory
        self.mapping_names = []
        self.root_names = []
        for file_name in os.listdir(abs_assets_path):
            if not file_name.endswith(".json"):
                continue
            file_path = os.path.join(abs_assets_path, file_name)
            with open(file_path, "r") as infile:
                bone_mapping = json.load(infile)
            root_name = bone_mapping.get(STANDARD_ROOT, "")
            self.mapping_names.append(file_name[:-5])
            self.root_names.append(root_name)
        mapping_memory_list = context.scene.mapping_memory_list
        mapping_memory_list.clear()
        for i in range(len(self.mapping_names)):
            item = mapping_memory_list.add()
            item.mapping_name = self.mapping_names[i]
            item.root_name = self.root_names[i]


class OBJECT_OT_DeleteMemoryItem(bpy.types.Operator):
    bl_idname = "animoxtend.delete_memory_item"
    bl_label = "Delete Mapping"
    bl_description = "Delete mapping in memory"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    def execute(self, context):
        mapping_memory_list = context.scene.mapping_memory_list
        # delete file
        rel_assets_path = (
            f'/../assets/bone_mapping/{mapping_memory_list[context.scene.mapping_memory_index].mapping_name}.json'
        )
        file_dir = os.path.dirname(os.path.abspath(__file__))
        addon_directory = os.path.dirname(file_dir)
        abs_assets_path = addon_directory + rel_assets_path
        os.remove(abs_assets_path)
        # delete item and update index
        mapping_memory_list.remove(context.scene.mapping_memory_index)
        if context.scene.mapping_memory_index >= len(mapping_memory_list):
            context.scene.mapping_memory_index = len(mapping_memory_list) - 1
        return {"FINISHED"}


class ANIMOXTEND_UL_MappingInMemory(bpy.types.UIList):
    bl_idname = Config.ui_list_prefix + "MappingInMemory_UI_List"

    def draw_item(self, context, layout, data, item, icon, active_data, active_propname, index):
        row = layout.row(align=True)
        split = row.split(factor=0.5)
        split.label(text=item.mapping_name)
        split.label(text=item.root_name)


""" Operators For Retargeting """


class OBJECT_OT_SingleRetarget(bpy.types.Operator, GuardianMixin):
    bl_idname = "animoxtend.single_retarget"
    bl_label = "Retarget Animation"
    bl_description = "Retarget animation"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    @classmethod
    def poll(cls, context):
        cls.api_key = get_api_key(context)
        cls.server_host = get_server_host(context)
        if not cls.is_authenticated():
            return False
        src_arm = context.scene.source_arm
        tgt_arm = context.scene.target_arm
        if (
            src_arm
            and src_arm.type == "ARMATURE"
            and tgt_arm
            and tgt_arm.type == "ARMATURE"
            and src_arm.animation_data
            and src_arm.animation_data.action
            and context.scene.src_root_valid_status
            and context.scene.tgt_root_valid_status
            and src_arm.name != tgt_arm.name
        ):
            return True
        return False

    def execute(self, context):
        auto_redefine_flag = not context.scene.expand_advanced_ui

        # get armatures
        src_arm = context.scene.source_arm
        tgt_arm = context.scene.target_arm

        # retarget
        res, msg = single_retarget(
            context, src_arm, tgt_arm, auto_redefine_flag, api_key=self.api_key, server_host=self.server_host
        )
        if res == 2:
            self.report({"WARNING"}, msg)

        # check constraint exist
        for bone in tgt_arm.pose.bones:
            if bone.constraints and len(bone.constraints) > 0:
                self.report(
                    {"WARNING"},
                    "Retarget animation successfully. But constraints exist in target armature, "
                    "which may affect the retarget result.",
                )
                return {"FINISHED"}

        logger.info("Retarget animation successfully.")
        self.report({"INFO"}, "Retarget animation successfully.")

        return {"FINISHED"}


class OBJECT_OT_AutoBoneOrientation(bpy.types.Operator, GuardianMixin):
    bl_idname = "animoxtend.auto_bone_orientation"
    bl_label = "Automatic bone orientation"
    bl_description = "Connect all bones"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    @classmethod
    def poll(cls, context):
        cls.api_key = get_api_key(context)
        cls.server_host = get_server_host(context)
        if not cls.is_authenticated():
            return False
        if context.active_object and context.selected_objects:
            if context.active_object.type == "ARMATURE":
                return True
        return False

    def execute(self, context):
        armature = context.active_object
        current_frame = context.scene.frame_current

        # get bone mapping
        bone_mapping = retarget_core.automatic_bone_mapping(armature, False)

        # extract motion dict
        if armature.animation_data and armature.animation_data.action:
            motion_dict = blender_helper.extract_motion_dict(armature, bone_mapping[STANDARD_ROOT])
            start_frame = int(armature.animation_data.action.frame_range[0])
        else:
            motion_dict = None
            start_frame = 1

        # extract armature restpose dict
        skl_dict = blender_helper.extract_skeleton_info(armature)
        ctd_motion_dict, ctd_tails_dict = retarget_core.auto_bone_orientation(
            motion_dict, skl_dict, bone_mapping, api_key=self.api_key, server_host=self.server_host
        )
        ctd_motion_dict["start_frame"] = start_frame

        # create connected armature
        bpy.ops.object.select_all(action="DESELECT")
        armature.select_set(True)
        bpy.context.view_layer.objects.active = armature
        bpy.ops.object.duplicate(linked=False, mode="TRANSLATION")
        ctd_armature = bpy.context.active_object
        bpy.ops.object.select_all(action="DESELECT")
        blender_helper.update_tail_nodes(ctd_armature, ctd_tails_dict)

        if ctd_motion_dict:
            # assign returned motion on target armature
            blender_helper.assign_npz_motion_to_armature(ctd_motion_dict, ctd_armature, bone_mapping[STANDARD_ROOT])

        # set back to the initial frame
        context.scene.frame_set(current_frame)

        logger.info("Automatic bone orientation successfully.")
        self.report({"INFO"}, "Automatic bone orientation successfully.")

        return {"FINISHED"}


""" Operators For Restpose Redefine """


class OBJECT_OT_SelectReferencePoseSource(bpy.types.Operator):
    bl_idname = "animoxtend.select_redefine_source"
    bl_label = "Align reference pose, start with:"
    bl_description = "Select the pose mode to align with"
    bl_options = {"UNDO"}

    src_rest_pose: bpy.props.EnumProperty(
        items=(
            ("REST", "Rest", "rest pose"),
            ("CURRENT", "Current", "current pose"),
            ("SAVED", "Saved", "saved pose"),
        ),
        default="REST",
    )  # type: ignore

    tgt_rest_pose: bpy.props.EnumProperty(
        items=(
            ("REST", "Rest", "rest pose"),
            ("CURRENT", "Current", "current pose"),
            ("SAVED", "Saved", "saved pose"),
        ),
        default="REST",
    )  # type: ignore

    @classmethod
    def poll(self, context):
        return context.scene.source_arm and context.scene.target_arm and not context.scene.auto_align_depress

    def draw(self, context):
        layout = self.layout
        row = layout.row(align=True)
        row.label(text="Source:")
        row.prop(self, "src_rest_pose", expand=True)

        row = layout.row(align=True)
        row.label(text="Target:")
        row.prop(self, "tgt_rest_pose", expand=True)

    def invoke(self, context, event):
        wm = context.window_manager

        return wm.invoke_props_dialog(self, width=313)

    def execute(self, context):
        context.scene.align_restpose_status = True

        show_restpose(context, self.src_rest_pose, is_source=True)
        show_restpose(context, self.tgt_rest_pose, is_source=False)

        return {"FINISHED"}


class OBJECT_OT_ResetInitPose(bpy.types.Operator):
    bl_idname = "animoxtend.reset_init_pose"
    bl_label = "Rest Init Pose"
    bl_description = "Reset init pose"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    pick_action: bpy.props.EnumProperty(
        items=(
            ("source", "source", ""),
            ("target", "target", ""),
        )
    )

    def execute(self, context):
        if self.pick_action == "source":
            armature = context.scene.source_arm
            skl_dict = context.scene.init_source_restpose[0].get_restpose_dict()
        else:
            armature = context.scene.target_arm
            skl_dict = context.scene.init_target_restpose[0].get_restpose_dict()

        set_restpose(armature, skl_dict)

        return {"FINISHED"}


class OBJECT_OT_SourceAutoPose(bpy.types.Operator):
    bl_idname = "animoxtend.auto_src_pose"
    bl_label = "Auto Set Source Reference Pose"
    bl_description = "Auto align source reference pose"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    pose_type: bpy.props.StringProperty(default="T-pose")  # type: ignore

    def execute(self, context):
        context.scene.src_restpose_type = self.pose_type

        auto_align_restpose(context, is_source=True, pose_type=context.scene.src_restpose_type)

        return {"FINISHED"}


class OBJECT_OT_TargetAutoPose(bpy.types.Operator):
    bl_idname = "animoxtend.auto_tgt_pose"
    bl_label = "Auto Set Target Reference Pose"
    bl_description = "Auto align target reference pose"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    pose_type: bpy.props.StringProperty(default="T-pose")  # type: ignore

    def execute(self, context):
        context.scene.tgt_restpose_type = self.pose_type

        auto_align_restpose(context, is_source=False, pose_type=context.scene.tgt_restpose_type)

        return {"FINISHED"}


class OBJECT_OT_ApplyRedefine(bpy.types.Operator):
    bl_idname = "animoxtend.apply_redefine"
    bl_label = "Apply Rest Pose"
    bl_description = "Apply current pose as new rest pose"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    pick_action: bpy.props.EnumProperty(
        items=(
            ("source", "source", ""),
            ("target", "target", ""),
        )
    )

    def draw(self, context):
        layout = self.layout
        layout.label(text="The operation will apply the modified rest pose as the", icon="INFO")
        layout.label(text="new rest pose permanently, without changing the motion.")
        layout.label(text="Are you sure to continue?")

    def invoke(self, context, event):
        wm = context.window_manager

        return wm.invoke_props_dialog(self, width=313)

    def execute(self, context):
        # apply pose as restpose
        apply_pose_as_restpose(context, is_source=(self.pick_action == "source"))

        self.report({"INFO"}, f"Apply {self.pick_action} rest pose successfully.")

        return {"FINISHED"}


class OBJECT_OT_ApplyRedefineExtend(bpy.types.Operator):
    bl_idname = "animoxtend.apply_redefine_extend"
    bl_label = "Apply as Rest Pose"
    bl_description = "Apply current pose as new rest pose"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    @classmethod
    def poll(self, context):
        if context.active_object:
            if len(context.selected_objects) > 0:
                if context.active_object.type == "ARMATURE":
                    return True

    def draw(self, context):
        layout = self.layout
        layout.label(text="The operation will apply the modified rest pose as the", icon="INFO")
        layout.label(text="new rest pose permanently, without changing the motion.")
        layout.label(text="Are you sure to continue?")

    def invoke(self, context, event):
        wm = context.window_manager

        return wm.invoke_props_dialog(self, width=313)

    def execute(self, context):
        # apply pose as restpose
        armature = context.active_object
        apply_pose_as_restpose_extend(armature)

        self.report({"INFO"}, "Apply rest pose successfully.")

        return {"FINISHED"}


class OBJECT_OT_CancelRedefine(bpy.types.Operator):
    bl_idname = "animoxtend.cancel_redefine"
    bl_label = "Cancel"
    bl_description = "Cancel align reference pose"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    def execute(self, context):
        # change ui
        context.scene.align_restpose_status = False

        show_restpose(context, None, is_source=True)
        show_restpose(context, None, is_source=False)

        return {"FINISHED"}


class OBJECT_OT_SaveRedefine(bpy.types.Operator):
    bl_idname = "animoxtend.save_redefine"
    bl_label = "Save Reference Pose"
    bl_description = "Save current pose as reference pose"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    def execute(self, context):
        # change ui
        context.scene.align_restpose_status = False

        # update temp restpose in pose mode
        update_temp_restpose_in_pose_mode(context, is_source=True)
        update_temp_restpose_in_pose_mode(context, is_source=False)

        return {"FINISHED"}


class OBJECT_OT_ChangeAutoAlignStatus(bpy.types.Operator):
    bl_idname = "animoxtend.change_auto_align_status"
    bl_label = "Auto Align Reference Pose"
    bl_description = "Use automatic alignment or manual alignment. Pressed means automatic alignment"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    def execute(self, context):
        # change auto reference pose alignment status in advanced ui
        context.scene.auto_align_depress = not context.scene.auto_align_depress
        return {"FINISHED"}


""" Quick Operators to Copy and Paste Motion """


class OBJECT_OT_CopyMotion(bpy.types.Operator):
    bl_idname = "animoxtend.copy_motion"
    bl_label = "Copy Motion"
    bl_description = "Copy source motion"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    @classmethod
    def poll(self, context):
        obj = context.active_object
        if obj and obj.type == "ARMATURE" and obj.animation_data and obj.animation_data.action:
            return True

    def execute(self, context):
        armature = context.active_object
        context.scene.copy_armature = armature
        bone_definition_list = context.scene.copy_bone_definition_list

        # clear the bone list
        bone_definition_list.clear()

        # match joints
        bone_mapping_dict = retarget_core.automatic_bone_mapping(armature)
        for standard_bone_name, bone_name in bone_mapping_dict.items():
            item = bone_definition_list.add()
            item.standard_bone_name = standard_bone_name
            item.bone_name = bone_name

        self.report({"INFO"}, "Motion copied successfully.")

        return {"FINISHED"}


class OBJECT_OT_PasteMotion(bpy.types.Operator, GuardianMixin):
    bl_idname = "animoxtend.paste_motion"
    bl_label = "Paste Motion"
    bl_description = "Paste motion to target"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    @classmethod
    def poll(cls, context):
        cls.api_key = get_api_key(context)
        cls.server_host = get_server_host(context)
        if not cls.is_authenticated():
            return False
        src_arm = context.scene.copy_armature
        obj = context.active_object
        if (
            src_arm
            and src_arm.type == "ARMATURE"
            and src_arm.animation_data
            and src_arm.animation_data.action
            and obj
            and obj.type == "ARMATURE"
        ):
            return True
        return False

    def execute(self, context):
        src_arm = context.scene.copy_armature
        tgt_arm = context.active_object

        res, msg = paste_motion(context, src_arm, tgt_arm, api_key=self.api_key, server_host=self.server_host)
        if res == 1:
            self.report({"ERROR"}, msg)
            return {"CANCELLED"}

        self.report(
            {"INFO"},
            f'Quick retargeting from armature "{src_arm.name}" to armature "{tgt_arm.name}" completed.',
        )

        return {"FINISHED"}


class OBJECT_OT_PartCopyMotion(bpy.types.Operator):
    bl_idname = "animoxtend.part_copy_motion"
    bl_label = "Part Copy Motion"
    bl_description = "Part copy source motion"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    @classmethod
    def poll(self, context):
        selected_bones = context.selected_pose_bones
        armatures = []
        for bone in selected_bones:
            if bone.id_data.type == "ARMATURE" and bone.id_data not in armatures:
                armatures.append(bone.id_data)
        if len(armatures) == 1 and armatures[0].animation_data and armatures[0].animation_data.action:
            return True

    def execute(self, context):
        selected_bones = context.selected_pose_bones
        selected_bone_names = [bone.name for bone in selected_bones]
        armature = selected_bones[0].id_data
        context.scene.part_copy_armature = armature
        bone_definition_list = context.scene.part_copy_bone_definition_list

        # clear the bone list
        bone_definition_list.clear()

        # match joints
        bone_mapping_dict = retarget_core.automatic_bone_mapping(armature)
        for standard_bone_name, bone_name in bone_mapping_dict.items():
            item = bone_definition_list.add()
            item.standard_bone_name = standard_bone_name
            item.bone_name = bone_name
            if bone_name in selected_bone_names:
                item.is_selected = True

        self.report({"INFO"}, "Part motion copied successfully.")

        return {"FINISHED"}


class OBJECT_OT_PartPasteMotion(bpy.types.Operator, GuardianMixin):
    bl_idname = "animoxtend.part_paste_motion"
    bl_label = "Part Paste Motion"
    bl_description = "Part paste motion to target"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    @classmethod
    def poll(cls, context):
        cls.api_key = get_api_key(context)
        cls.server_host = get_server_host(context)
        if not cls.is_authenticated():
            return False
        src_arm = context.scene.part_copy_armature
        selected_bones = context.selected_pose_bones
        armatures = []
        for bone in selected_bones:
            if bone.id_data.type == "ARMATURE" and bone.id_data not in armatures:
                armatures.append(bone.id_data)
        if len(armatures) != 1:
            return False
        arm = armatures[0]
        if src_arm and arm.name != src_arm.name and len(context.scene.part_copy_bone_definition_list) != 0:
            return True
        return False

    def execute(self, context):
        src_arm = context.scene.part_copy_armature
        selected_bones = context.selected_pose_bones
        tgt_selected_bones = [bone.name for bone in selected_bones]
        tgt_arm = selected_bones[0].id_data

        # part paste motion
        res, msg = part_paste_motion(
            context, src_arm, tgt_arm, tgt_selected_bones, api_key=self.api_key, server_host=self.server_host
        )
        if res == 1:
            self.report({"ERROR"}, msg)
            return {"CANCELLED"}

        self.report(
            {"INFO"},
            f'Part quick retargeting from armature "{src_arm.name}" to armature "{tgt_arm.name}" completed.',
        )

        return {"FINISHED"}


""" Adjust Arm Space """


class OBJECT_OT_AdjustArmSpace(bpy.types.Operator, GuardianMixin):
    bl_idname = "animoxtend.apply_adjust_arm_space_degrees"
    bl_label = "Adjust Arm Space"
    bl_description = "Adjust arm space"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    @classmethod
    def poll(cls, context):
        cls.api_key = get_api_key(context)
        cls.server_host = get_server_host(context)
        if not cls.is_authenticated():
            return False
        obj = context.active_object
        if (
            obj is not None
            and obj.type == "ARMATURE"
            and obj.animation_data
            and obj.animation_data.action
            and context.scene.arm_space_degrees != 0
        ):
            return True

    def execute(self, context):
        degrees = float(context.scene.arm_space_degrees)
        armature = context.active_object
        max_degrees = 50
        amplitude = degrees / max_degrees

        # get current mode
        old_mode = bpy.context.object.mode

        # get bone mapping
        bone_mapping = retarget_core.automatic_bone_mapping(armature)
        motion_dict = blender_helper.extract_motion_dict(armature, bone_mapping[STANDARD_ROOT])
        skl_info_dict = blender_helper.extract_skeleton_info(armature)
        new_motion_dict = retarget_core.adjust_arm_space(
            motion_dict, skl_info_dict, bone_mapping, amplitude, api_key=self.api_key, server_host=self.server_host
        )

        # select and active armature
        bpy.ops.object.mode_set(mode="OBJECT")
        bpy.ops.object.select_all(action="DESELECT")
        armature.select_set(True)
        bpy.context.view_layer.objects.active = armature
        if old_mode == "POSE":
            bpy.ops.object.mode_set(mode="POSE")

        if new_motion_dict is not None:
            blender_helper.assign_npz_motion_to_armature(new_motion_dict, armature, bone_mapping[STANDARD_ROOT])
        else:
            self.report({"ERROR"}, "Adjust arm space failed. Please check the arm bones naming.")

        return {"FINISHED"}


""" Bone Additive Layer Animation """


class OBJECT_OT_BoneRotateModal(bpy.types.Operator):
    bl_idname = "object.bone_rotate_modal"
    bl_label = "Bone Rotate Modal"
    bl_description = "Rotate selected pose bone with mouse movement. Only works in Pose Mode"
    bl_options = {"REGISTER", "GRAB_CURSOR", "BLOCKING", "UNDO", "INTERNAL"}

    def __init__(self):
        self.start_mouse = None
        self.last_mouse = None
        self.start_rotation = None
        self.pose_bone = None
        self.delta_quat = None
        self.axis_constraint = None
        self.sum_quat = None

    def modal(self, context, event):
        # additive layer animation fot pose bone
        if event.type in {"LEFTMOUSE"}:
            armature = self.pose_bone.id_data
            blender_helper.animation_layer_blending(
                armature,
                self.sum_quat.copy(),
                self.pose_bone.name,
            )
            return {"FINISHED"}

        if event.type in {"X", "Y", "Z"} and event.value == "PRESS":
            self.axis_constraint = event.type
            self.report({"INFO"}, f"Axis Constraint: {self.axis_constraint}")

        if event.type in {"RIGHTMOUSE", "ESC"}:
            return self.cancel(context)

        if event.type == "MOUSEMOVE":
            delta_x = event.mouse_x - self.last_mouse[0]
            delta_y = event.mouse_y - self.last_mouse[1]
            rotation_factor = 0.005

            if self.axis_constraint and self.pose_bone:
                delta_angle = (delta_x + delta_y) * rotation_factor
                local_axis = self.get_local_axis(self.pose_bone, self.axis_constraint)
                delta_quat = Quaternion(local_axis, delta_angle)
            elif self.pose_bone:
                delta_rotation_x = delta_y * rotation_factor
                delta_rotation_z = delta_x * rotation_factor
                rot_x = Quaternion((1.0, 0.0, 0.0), delta_rotation_x)
                rot_z = Quaternion((0.0, 0.0, 1.0), delta_rotation_z)
                delta_quat = rot_z @ rot_x
            cur_quat = self.pose_bone.rotation_quaternion.copy()
            self.pose_bone.rotation_quaternion = delta_quat @ cur_quat
            self.delta_quat = delta_quat
            self.sum_quat = delta_quat @ self.sum_quat
            self.last_mouse = (event.mouse_x, event.mouse_y)
            context.view_layer.update()

        return {"RUNNING_MODAL"}

    def get_local_axis(self, pose_bone, axis):
        matrix = pose_bone.matrix_basis
        if axis == "X":
            return matrix.col[0].to_3d().normalized()
        elif axis == "Y":
            return matrix.col[1].to_3d().normalized()
        elif axis == "Z":
            return matrix.col[2].to_3d().normalized()
        return Vector((0, 0, 0))

    def invoke(self, context, event):
        if context.object.mode != "POSE":
            self.report({"WARNING"}, "Must be in Pose Mode")
            return {"CANCELLED"}

        pose_bones = context.selected_pose_bones
        if not pose_bones:
            self.report({"WARNING"}, "No bone selected")
            return {"CANCELLED"}

        self.pose_bone = pose_bones[0]
        self.start_mouse = (event.mouse_x, event.mouse_y)
        self.last_mouse = self.start_mouse
        if self.pose_bone.rotation_mode == "QUATERNION":
            self.start_rotation = self.pose_bone.rotation_quaternion.copy()
        elif self.pose_bone.rotation_mode in EULER_TYPE:
            self.start_rotation = self.pose_bone.rotation_euler.to_quaternion().copy()
        else:
            self.report({"ERROR"}, "Unsupported rotation mode")
            return {"CANCELLED"}
        self.delta_quat = None
        self.axis_constraint = None
        self.sum_quat = Quaternion()

        context.window_manager.modal_handler_add(self)
        return {"RUNNING_MODAL"}

    def cancel(self, context):
        if self.pose_bone and self.start_rotation:
            if self.pose_bone.rotation_mode == "QUATERNION":
                self.pose_bone.rotation_quaternion = self.start_rotation
            elif self.pose_bone.rotation_mode in EULER_TYPE:
                self.pose_bone.rotation_euler = self.start_rotation.to_euler(self.pose_bone.rotation_mode)
            context.view_layer.update()

        self.report({"INFO"}, "Rotation canceled and reverted")

        return {"CANCELLED"}


class OBJECT_OT_BoneLocateModal(bpy.types.Operator):
    bl_idname = "object.bone_locate_modal"
    bl_label = "Bone Locate Modal"
    bl_description = "Move selected pose bone with mouse movement. Only works in Pose Mode"
    bl_options = {"REGISTER", "GRAB_CURSOR", "BLOCKING", "UNDO", "INTERNAL"}

    def __init__(self):
        self.start_mouse = None
        self.start_location = None
        self.pose_bone = None
        self.armature = None
        self.delta = None
        self.axis_constraint = None
        self.start_3d_location = None

    def modal(self, context, event):
        # additive layer animation fot pose bone
        if event.type in {"LEFTMOUSE"}:
            try:
                blender_helper.animation_layer_location_blending(
                    self.armature,
                    self.delta,
                    self.pose_bone.name,
                )
            except Exception:
                self.report({"ERROR"}, f"Additive layer animation editing failed. {Exception}")
                return self.cancel(context)

            bpy.context.space_data.overlay.show_axis_x = True
            bpy.context.space_data.overlay.show_axis_y = True
            bpy.context.space_data.overlay.show_axis_z = False
            return {"FINISHED"}

        if event.type in {"X", "Y", "Z"} and event.value == "PRESS":
            self.axis_constraint = event.type
            # Set axis color to highlight
            if self.axis_constraint == 'X':
                bpy.context.space_data.overlay.show_axis_x = True
                bpy.context.space_data.overlay.show_axis_y = False
                bpy.context.space_data.overlay.show_axis_z = False
            elif self.axis_constraint == 'Y':
                bpy.context.space_data.overlay.show_axis_x = False
                bpy.context.space_data.overlay.show_axis_y = True
                bpy.context.space_data.overlay.show_axis_z = False
            elif self.axis_constraint == 'Z':
                bpy.context.space_data.overlay.show_axis_x = False
                bpy.context.space_data.overlay.show_axis_y = False
                bpy.context.space_data.overlay.show_axis_z = True
            self.report({"INFO"}, f"Axis Constraint: {self.axis_constraint}")

        if event.type in {"RIGHTMOUSE", "ESC"}:
            return self.cancel(context)

        if event.type == "MOUSEMOVE":
            current_mouse = (event.mouse_x, event.mouse_y)
            cur_3d_loc = self.get_world_coordinates(context, current_mouse)
            if self.axis_constraint is None:
                # get mouse location in 3D space
                delta = cur_3d_loc - self.last_3d_location
            else:
                # calculate mouse movement delta
                mouse_delta = (current_mouse[0] - self.last_mouse[0], current_mouse[1] - self.last_mouse[1])
                speed_factor = 0.25
                if self.axis_constraint == 'X':
                    direction = Vector((1, 0, 0))
                elif self.axis_constraint == 'Y':
                    direction = Vector((0, 1, 0))
                else:
                    direction = Vector((0, 0, 1))
                if sum(mouse_delta) < 0:
                    speed_factor *= -1
                delta = direction * speed_factor

            # get global location
            global_location = (self.armature.matrix_world @ self.pose_bone.matrix).to_translation()
            global_location += delta

            # convert to local location
            parent = self.pose_bone.parent
            if parent:
                local_location = (
                    self.pose_bone.bone.matrix_local.inverted()
                    @ parent.bone.matrix_local
                    @ parent.matrix.inverted()
                    @ self.armature.matrix_world.inverted()
                    @ global_location
                )
            else:
                local_location = (
                    self.pose_bone.bone.matrix_local.inverted()
                    @ self.armature.matrix_world.inverted()
                    @ global_location
                )

            self.pose_bone.location = local_location
            self.delta = local_location - self.start_location
            self.last_mouse = current_mouse
            self.last_3d_location = cur_3d_loc

            context.view_layer.update()

        return {"RUNNING_MODAL"}

    def invoke(self, context, event):
        if context.object.mode != "POSE":
            self.report({"WARNING"}, "Must be in Pose Mode")
            return {"CANCELLED"}

        pose_bones = context.selected_pose_bones
        if not pose_bones:
            self.report({"WARNING"}, "No bone selected")
            return {"CANCELLED"}

        self.pose_bone = pose_bones[0]
        self.armature = self.pose_bone.id_data
        self.start_location = self.pose_bone.location.copy()
        self.start_mouse = (event.mouse_x, event.mouse_y)
        self.last_mouse = (event.mouse_x, event.mouse_y)
        self.start_3d_location = self.get_world_coordinates(context, self.start_mouse)
        self.last_3d_location = self.start_3d_location

        self.report({"INFO"}, f"Move pose bone {self.pose_bone.name}")

        context.window_manager.modal_handler_add(self)

        return {"RUNNING_MODAL"}

    def cancel(self, context):
        if self.pose_bone and self.start_location:
            self.pose_bone.location = self.start_location
            context.view_layer.update()

        bpy.context.space_data.overlay.show_axis_x = True
        bpy.context.space_data.overlay.show_axis_y = True
        bpy.context.space_data.overlay.show_axis_z = False

        self.report({"INFO"}, "Move canceled and reverted")

        return {"CANCELLED"}

    def get_world_coordinates(self, context, mouse_pos):
        region = context.region
        rv3d = context.space_data.region_3d
        new_location = view3d_utils.region_2d_to_location_3d(region, rv3d, mouse_pos, rv3d.view_location)
        return new_location


""" Operators for Batch Retarget """


class SkeletonConsistencyCheck:
    def __init__(self, skeleton_dict):
        self.skeleton_info = skeleton_dict

    def check_consistency(self, skeleton_dict):
        # check bone names
        ori_names = self.skeleton_info["joint_names"]
        check_names = skeleton_dict["joint_names"]
        left_names = [name for name in check_names if name not in ori_names]

        if len(left_names) > 0 or len(check_names) != len(ori_names):
            return False

        return True


class OBJECT_OT_BatchRetarget(bpy.types.Operator, GuardianMixin):
    bl_idname = "animoxtend.batch_retarget"
    bl_label = "Batch Retarget Animations"
    bl_description = "Batch retarget animations"
    bl_options = {"REGISTER", "UNDO", "INTERNAL"}

    @classmethod
    def poll(cls, context):
        cls.api_key = get_api_key(context)
        cls.server_host = get_server_host(context)
        if not cls.is_authenticated():
            return False
        return bool(
            context.scene.source_folder != "" and context.scene.target_file != "" and context.scene.output_folder != ""
        )

    def execute(self, context):
        if bpy.context.active_object is not None and bpy.context.object.mode in [
            "POSE",
            "EDIT",
        ]:
            bpy.ops.object.mode_set(mode="OBJECT")

        # enable better fbx
        better_fbx_enabled = "better_fbx" in bpy.context.preferences.addons
        if better_fbx_enabled:
            bpy.ops.preferences.addon_enable(module="better_fbx")
            self.report({"INFO"}, "Better FBX enabled.")

        # import target armature
        target_file = context.scene.target_file
        prev_objects = set(bpy.context.scene.objects)
        if better_fbx_enabled:
            bpy.ops.better_import.fbx(filepath=target_file, use_auto_bone_orientation=False)
        else:
            bpy.ops.import_scene.fbx(filepath=target_file)
        current_objects = set(bpy.context.scene.objects)
        remaining_objects = list(current_objects - prev_objects)
        tgt_arm = blender_helper.get_armature(remaining_objects)
        if tgt_arm is None:
            self.report({"ERROR"}, f"Cannot find target armature. File path: {target_file}")
            return {"CANCELLED"}

        # get data
        file_type = context.scene.motion_format.type_dropdown
        source_folder = context.scene.source_folder
        output_folder = context.scene.output_folder
        all_motion_paths = blender_helper.get_files(source_folder, f".{file_type}", [])
        n_files = len(all_motion_paths)
        n_success = 0

        if not context.scene.use_single_retarget_config:
            # automatic retargeting
            for i, motion_path in enumerate(all_motion_paths):
                logger.info(f"Retargeting {i + 1}/{n_files}: {motion_path}")
                output_path = motion_path.replace(source_folder, output_folder)

                # import motion
                prev_objects = set(bpy.context.scene.objects)
                if better_fbx_enabled:
                    bpy.ops.better_import.fbx(filepath=motion_path, use_auto_bone_orientation=False)
                else:
                    bpy.ops.import_scene.fbx(filepath=motion_path)
                current_objects = set(bpy.context.scene.objects)
                remaining_objects = list(current_objects - prev_objects)
                src_arm = blender_helper.get_armature(remaining_objects)
                if src_arm is None:
                    self.report(
                        {"ERROR"},
                        f"Cannot find source armature. File path: {motion_path}",
                    )
                    continue

                # copy motion
                bpy.ops.object.select_all(action="DESELECT")
                src_arm.select_set(True)
                bpy.context.view_layer.objects.active = src_arm
                bpy.ops.animoxtend.copy_motion()
                src_arm.select_set(False)
                bpy.context.view_layer.objects.active = None

                # paste motion
                bpy.ops.object.select_all(action="DESELECT")
                tgt_arm.select_set(True)
                bpy.context.view_layer.objects.active = tgt_arm
                bpy.ops.animoxtend.paste_motion()

                # output
                bpy.context.view_layer.objects.active = tgt_arm
                tgt_arm.select_set(True)
                blender_helper.export_fbx(
                    armature_name=tgt_arm.name,
                    save_path=output_path,
                    with_mesh=True,
                    use_better_fbx=better_fbx_enabled,
                )

                # delete imported objects
                bpy.ops.object.select_all(action="DESELECT")
                bpy.context.view_layer.objects.active = src_arm
                bpy.ops.object.select_grouped(type="CHILDREN_RECURSIVE")
                src_arm.select_set(True)
                bpy.ops.object.delete()
                bpy.ops.object.select_all(action="DESELECT")

                n_success += 1

        else:
            # retarget using single retarget config
            # check if single retarget config is valid
            is_config_valid = (
                context.scene.source_arm
                and context.scene.target_arm
                and context.scene.source_bone_definition_list
                and context.scene.target_bone_definition_list
            )
            if not is_config_valid:
                self.report({"ERROR"}, "Invalid single retarget config.")
                return {"CANCELLED"}

            # check if reference pose is valid
            is_reference_valid = (
                len(context.scene.temp_source_restpose) > 0 and len(context.scene.temp_target_restpose) > 0
            )
            if not is_reference_valid and not context.scene.auto_align_depress:
                self.report({"ERROR"}, "Invalid single retarget config. Please align reference pose.")
                return {"CANCELLED"}
            elif not is_reference_valid and context.scene.auto_align_depress:
                # init temp restpose
                src_skl_dict = blender_helper.extract_skeleton_info(context.scene.source_arm)
                tmp_src_item = context.scene.temp_source_restpose.add()
                tmp_src_item.set_restpose_dict(src_skl_dict)
                tgt_skl_dict = blender_helper.extract_skeleton_info(context.scene.target_arm)
                tmp_tgt_item = context.scene.temp_target_restpose.add()
                tmp_tgt_item.set_restpose_dict(tgt_skl_dict)

            # retarget config
            auto_scale = context.scene.automatic_scale
            optimize_spine = context.scene.optimize_mult_level_spines
            keep_target_place = context.scene.keep_target_place

            tmp_src_restpose = context.scene.temp_source_restpose
            tmp_tgt_restpose = context.scene.temp_target_restpose
            src_bone_definiton_list = context.scene.source_bone_definition_list
            tgt_bone_definiton_list = context.scene.target_bone_definition_list
            tmp_src_skl_dict = tmp_src_restpose[0].get_restpose_dict()
            tmp_tgt_skl_dict = tmp_tgt_restpose[0].get_restpose_dict()
            src_skl_checker = SkeletonConsistencyCheck(tmp_src_skl_dict)
            tgt_skl_checker = SkeletonConsistencyCheck(tmp_tgt_skl_dict)
            src_mapping = {}
            tgt_mapping = {}
            for bone_item in src_bone_definiton_list:
                key = bone_item.standard_bone_name
                value = bone_item.bone_name
                src_mapping[key] = value
            for bone_item in tgt_bone_definiton_list:
                key = bone_item.standard_bone_name
                value = bone_item.bone_name
                tgt_mapping[key] = value

            # check if target armature is consistent with single retarget
            tgt_skl_dict = blender_helper.extract_skeleton_info(tgt_arm)
            if not tgt_skl_checker.check_consistency(tgt_skl_dict):
                self.report(
                    {"ERROR"},
                    "Target armature is inconsistent with single retarget config.",
                )
                return {"CANCELLED"}

            # retarget using single retarget config
            for _, motion_path in enumerate(all_motion_paths):
                output_path = motion_path.replace(source_folder, output_folder)

                # import motion
                prev_objects = set(bpy.context.scene.objects)
                if better_fbx_enabled:
                    bpy.ops.better_import.fbx(filepath=motion_path, use_auto_bone_orientation=False)
                else:
                    bpy.ops.import_scene.fbx(filepath=motion_path)
                current_objects = set(bpy.context.scene.objects)
                remaining_objects = list(current_objects - prev_objects)
                src_arm = blender_helper.get_armature(remaining_objects)
                if src_arm is None:
                    self.report(
                        {"ERROR"},
                        f"Cannot find source armature. File path: {motion_path}",
                    )
                    continue

                # check if armature is consistent with single retarget
                src_skl_dict = blender_helper.extract_skeleton_info(src_arm)
                if not src_skl_checker.check_consistency(src_skl_dict):
                    self.report(
                        {"ERROR"},
                        f"Source armature is inconsistent with single retarget config. File path: {motion_path}",
                    )
                    # delete imported objects
                    bpy.ops.object.select_all(action="DESELECT")
                    bpy.context.view_layer.objects.active = src_arm
                    bpy.ops.object.select_grouped(type="CHILDREN_RECURSIVE")
                    src_arm.select_set(True)
                    bpy.ops.object.delete()
                    bpy.ops.object.select_all(action="DESELECT")
                    continue

                # extract motion and skeleton dict
                src_motion_dict = blender_helper.extract_motion_dict(src_arm, src_mapping[STANDARD_ROOT])

                if not context.scene.auto_align_depress:
                    # transfer motion
                    tmp_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
                        src_motion_dict, src_skl_dict, tmp_src_skl_dict, src_mapping
                    )

                    # retarget
                    tmp_tgt_motion_dict = retarget_core.animo_retarget(
                        motion_dict=tmp_motion_dict,
                        src_skeleton_info=tmp_src_skl_dict,
                        tgt_skeleton_info=tmp_tgt_skl_dict,
                        src_bone_mapping=src_mapping,
                        tgt_bone_mapping=tgt_mapping,
                        auto_scale=auto_scale,
                        optimize_spine=optimize_spine,
                        auto_align_restpose=False,
                        api_key=self.api_key,
                        server_host=self.server_host,
                    )

                    # motion transfer
                    tgt_motion_dict = retarget_core.motion_transfer_after_restpose_changed(
                        tmp_tgt_motion_dict, tmp_tgt_skl_dict, tgt_skl_dict, tgt_mapping
                    )

                else:
                    # retarget
                    tgt_motion_dict = retarget_core.animo_retarget(
                        motion_dict=src_motion_dict,
                        src_skeleton_info=src_skl_dict,
                        tgt_skeleton_info=tgt_skl_dict,
                        src_bone_mapping=src_mapping,
                        tgt_bone_mapping=tgt_mapping,
                        auto_scale=auto_scale,
                        optimize_spine=optimize_spine,
                        auto_align_restpose=True,
                        api_key=self.api_key,
                        server_host=self.server_host,
                    )

                # keep target place
                if keep_target_place:
                    res_motion_dict = retarget_core.keep_rest_init_place(tgt_motion_dict, tgt_skl_dict, tgt_mapping)
                    if res_motion_dict is not None:
                        tgt_motion_dict = res_motion_dict
                    else:
                        self.report({"WARNING"}, "Cannot keep target place.")

                # assign returned motion on target armature
                blender_helper.assign_npz_motion_to_armature(tgt_motion_dict, tgt_arm, tgt_mapping[STANDARD_ROOT])

                # output
                bpy.context.view_layer.objects.active = tgt_arm
                tgt_arm.select_set(True)
                blender_helper.export_fbx(
                    armature_name=tgt_arm.name,
                    save_path=output_path,
                    with_mesh=True,
                    use_better_fbx=better_fbx_enabled,
                )

                # delete imported objects
                bpy.ops.object.select_all(action="DESELECT")
                bpy.context.view_layer.objects.active = src_arm
                bpy.ops.object.select_grouped(type="CHILDREN_RECURSIVE")
                src_arm.select_set(True)
                bpy.ops.object.delete()
                bpy.ops.object.select_all(action="DESELECT")

                n_success += 1

            if not is_reference_valid and context.scene.auto_align_depress:
                context.scene.temp_source_restpose.clear()
                context.scene.temp_target_restpose.clear()

        # delete imported objects
        bpy.context.view_layer.objects.active = tgt_arm
        bpy.ops.object.select_grouped(type="CHILDREN_RECURSIVE")
        tgt_arm.select_set(True)
        bpy.ops.object.delete()
        bpy.ops.object.select_all(action="DESELECT")

        self.report({"INFO"}, f"[{n_success}/{n_files}] motion files retargeted successfully.")

        return {"FINISHED"}


""" Operators for Bone Mapping Tooltip """


class OBJECT_OT_SourceMappingTooltip(bpy.types.Operator):
    bl_idname = "animoxtend.src_mapping_tooltip"
    bl_label = "Auto Bone Mapping Status"
    bl_description = "If you want to edit bone mapping, you can click the button to expand it"

    @classmethod
    def poll(self, context):
        source_arm = context.scene.source_arm

        return source_arm is not None and source_arm.type == "ARMATURE"

    def execute(self, context):
        context.scene.expand_src_mapping = not context.scene.expand_src_mapping
        context.scene.src_map_depress = not context.scene.src_map_depress

        return {"FINISHED"}


class OBJECT_OT_TargetMappingTooltip(bpy.types.Operator):
    bl_idname = "animoxtend.tgt_mapping_tooltip"
    bl_label = "Auto Bone Mapping Status"
    bl_description = "If you want to edit bone mapping, you can click the button to expand it"

    @classmethod
    def poll(self, context):
        target_arm = context.scene.target_arm

        return target_arm is not None and target_arm.type == "ARMATURE"

    def execute(self, context):
        context.scene.expand_tgt_mapping = not context.scene.expand_tgt_mapping
        context.scene.tgt_map_depress = not context.scene.tgt_map_depress

        return {"FINISHED"}


class OBJECT_OT_CustomEyedropper(bpy.types.Operator):
    """Custom Eyedropper to select an armature object"""

    bl_idname = "animoxtend.custom_eyedropper"
    bl_label = "Custom Eyedropper"
    bl_description = "Select an object"

    pick_action: bpy.props.EnumProperty(
        items=(
            ("source", "source", ""),
            ("target", "target", ""),
        )
    )

    def modal(self, context, event):
        context.window.cursor_modal_set("EYEDROPPER")

        if event.type == "LEFTMOUSE" and event.value == "PRESS":
            coord = (event.mouse_region_x, event.mouse_region_y)

            if not context.region_data:
                context.window.cursor_modal_restore()
                self.report({"WARNING"}, "Must use in 3D View")
                return {"CANCELLED"}

            # get selected object and mode
            selected_objs = []
            for obj in context.selected_objects:
                selected_objs.append(obj)
            old_active_obj = context.active_object
            old_mode = None
            if old_active_obj:
                old_mode = bpy.context.object.mode

            # Use view3d.select operator to select object under cursor
            bpy.context.view_layer.objects.active = None
            bpy.ops.view3d.select(extend=False, deselect=True, location=coord)

            # Check if selected object is an armature
            active_obj = context.active_object
            if active_obj:
                if self.pick_action == "source":
                    context.scene.source_arm_name = active_obj.name
                    context.scene.source_arm = active_obj
                    context.scene.src_map_depress = False
                elif self.pick_action == "target":
                    context.scene.target_arm_name = active_obj.name
                    context.scene.target_arm = active_obj
                    context.scene.tgt_map_depress = False
                self.report({"INFO"}, f"Selected armature: {active_obj.name}")
                # restore the old object and mode
                if old_active_obj and old_mode in ["POSE", "EDIT"]:
                    self.restore_object_mode(selected_objs, old_mode)
                context.window.cursor_modal_restore()
                return {"FINISHED"}
            else:
                # restore the old object and mode
                if old_active_obj and old_mode in ["POSE", "EDIT"]:
                    self.restore_object_mode(selected_objs, old_mode)
                context.window.cursor_modal_restore()
                self.report({"INFO"}, "No object under cursor")
                return {"CANCELLED"}

        elif event.type in {"ESC", "RIGHTMOUSE"}:
            context.window.cursor_modal_restore()
            self.report({"INFO"}, "Eyedropper cancelled")
            return {"CANCELLED"}

        return {"RUNNING_MODAL"}

    def invoke(self, context, event):
        # If an object is already active and selected
        active_object = context.active_object
        if active_object and active_object.select_get() and bpy.context.object.mode == "OBJECT":
            if self.pick_action == "source":
                context.scene.source_arm_name = active_object.name
                context.scene.source_arm = active_object
                context.scene.src_map_depress = False
            elif self.pick_action == "target":
                context.scene.target_arm_name = active_object.name
                context.scene.target_arm = active_object
                context.scene.tgt_map_depress = False
            self.report({"INFO"}, f"Active object: {active_object.name}")

            return {"FINISHED"}

        # Enable eyedropper mode
        context.window_manager.modal_handler_add(self)
        self.report({"INFO"}, "Eyedropper activated. Click on an object to select.")

        return {"RUNNING_MODAL"}

    def restore_object_mode(self, objects, mode):
        # Deselect everything first
        bpy.ops.object.select_all(action="DESELECT")
        # Select all previously selected objects
        for obj in objects:
            obj.select_set(True)
        # Set the last selected object as active
        if len(objects) > 0:
            bpy.context.view_layer.objects.active = objects[-1]
            # Set the mode for all selected objects
            bpy.ops.object.mode_set(mode=mode)


def get_api_key(context: bpy.types.Context):
    pref = get_preferences(context)
    return pref.get('api_key', '')


def get_server_host(context: bpy.types.Context):
    pref = get_preferences(context)
    return pref.get('server_host', '').rstrip('/')
