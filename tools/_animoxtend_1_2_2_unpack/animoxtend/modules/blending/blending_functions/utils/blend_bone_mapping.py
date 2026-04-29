from ....retarget.operators import check_bone_mapping
from ....retarget.retarget_functions.automatic_bone_mapping import automatic_bone_mapping
from ....retarget.retarget_functions.constants import STANDARD_ROOT


def blend_bone_mapping(armature):
    return automatic_bone_mapping(armature)


def blend_check_bone_mapping(bone_mapping_dict):
    root_valid, missing_msg = check_bone_mapping(bone_mapping_dict)
    return root_valid, missing_msg


def find_root_bone_name(armature):
    bone_mapping = blend_bone_mapping(armature)

    if bone_mapping[STANDARD_ROOT] not in ['', None]:
        root_name = bone_mapping[STANDARD_ROOT]
    else:
        root_name = armature.pose.bones[0].name

    return root_name
