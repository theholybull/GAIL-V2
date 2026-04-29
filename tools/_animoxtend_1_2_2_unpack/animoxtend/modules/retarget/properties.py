import json

import bpy
import numpy as np
from bpy.props import (
    BoolProperty,
    CollectionProperty,
    EnumProperty,
    FloatProperty,
    IntProperty,
    PointerProperty,
    StringProperty,
)

from . import operators


class QuickBoneListItem(bpy.types.PropertyGroup):
    """Properties of the bone list items"""

    standard_bone_name: StringProperty()  # type: ignore
    bone_name: StringProperty()  # type: ignore
    is_selected: BoolProperty(default=False)  # type: ignore


class SourceBoneListItem(bpy.types.PropertyGroup):
    """Properties of the bone list items"""

    standard_bone_name: StringProperty()  # type: ignore
    bone_name: StringProperty(update=operators.check_src_mapping_valid)  # type: ignore


class TargetBoneListItem(bpy.types.PropertyGroup):
    """Properties of the bone list items"""

    standard_bone_name: StringProperty()  # type: ignore
    bone_name: StringProperty(update=operators.check_tgt_mapping_valid)  # type: ignore


class PoseModeRestpose(bpy.types.PropertyGroup):
    """Properties of restpose"""

    restpose_json: StringProperty(default="{}")  # type: ignore

    def get_restpose_dict(self):
        restpose_dict = json.loads(self.restpose_json)
        for key in restpose_dict.keys():
            if key in [
                'rest_heads',
                'rest_tails',
                'rel_heads',
                'rel_tails',
                'local_matrices',
                'matrix_world',
                'bone_quaternions',
            ]:
                restpose_dict[key] = np.array(restpose_dict[key])
        return restpose_dict

    def set_restpose_dict(self, value):
        value = value.copy()
        for key in value.keys():
            if isinstance(value[key], np.ndarray):
                value[key] = value[key].tolist()
        self.restpose_json = json.dumps(value)


class Motion(bpy.types.PropertyGroup):
    """Properties of motion"""

    motion_json: StringProperty(default="{}")  # type: ignore

    def get_motion_dict(self):
        motion_dict = json.loads(self.motion_json)
        for key in motion_dict.keys():
            if key in ['rotmat', 'transl']:
                motion_dict[key] = np.array(motion_dict[key])
        return motion_dict

    def set_motion_dict(self, value):
        value = value.copy()
        for key in value.keys():
            if isinstance(value[key], np.ndarray):
                value[key] = value[key].tolist()
        self.motion_json = json.dumps(value)


class FileTypeProperties(bpy.types.PropertyGroup):
    type_dropdown: EnumProperty(
        name="Select File Type",
        description="Choose a file type from the dropdown",
        items=[
            ('FBX', "fbx", "fbx file type"),
            ('BVH', "bvh", "bvh file type"),
        ],
        default='FBX',
    )  # type: ignore


class MappingInMemoryItem(bpy.types.PropertyGroup):
    mapping_name: StringProperty()  # type: ignore
    root_name: StringProperty()  # type: ignore


def define_properties():
    Scene = bpy.types.Scene

    Scene.tabs = bpy.props.EnumProperty(
        name='Retarget tabs',
        items=[
            ('RETARGET', 'Retarget', "Operators related to retarget"),
            ('BATCH_RETARGET', "Batch Retarget", "Operators related to batch retarget"),
        ],
        default='RETARGET',
    )

    # armatures
    Scene.source_arm = PointerProperty(
        name='Source Armature',
        description='Select the source armature to retarget',
        type=bpy.types.Object,
        update=operators.reload_source_bone_mapping,
    )
    Scene.source_arm_name = StringProperty(
        name='Source Armature Name', default='', update=operators.update_source_armature
    )
    Scene.target_arm = PointerProperty(
        name='Target Armature',
        description='Select the target armature to retarget',
        type=bpy.types.Object,
        update=operators.reload_target_bone_mapping,
    )
    Scene.target_arm_name = StringProperty(
        name='Target Armature Name', default='', update=operators.update_target_armature
    )

    # source bone mapping
    Scene.source_bone_definition_list = CollectionProperty(type=SourceBoneListItem)
    Scene.source_bone_list_index = IntProperty(name='Index for the source bone list', default=0)
    Scene.expand_src_mapping = BoolProperty(name='Expand source mapping panel', default=False)
    Scene.src_check_mapping_result = StringProperty(default='')
    Scene.src_root_valid_status = BoolProperty(default=False)
    Scene.src_map_depress = BoolProperty(default=False)

    # target bone mapping
    Scene.target_bone_definition_list = CollectionProperty(type=TargetBoneListItem)
    Scene.target_bone_list_index = IntProperty(name='Index for the target bone list', default=0)
    Scene.expand_tgt_mapping = BoolProperty(name='Expand target mapping panel', default=False)
    Scene.tgt_check_mapping_result = StringProperty(default='')
    Scene.tgt_root_valid_status = BoolProperty(default=False)
    Scene.tgt_map_depress = BoolProperty(default=False)

    # advanced panel
    Scene.expand_advanced_ui = BoolProperty(
        name='Expand advanced ui.',
        description='Expand the advanced panel',
        default=False,
    )
    Scene.automatic_scale = BoolProperty(
        name='Automatic scale.',
        description='When turn on, the scale of the target armature will be automatically adjusted to match '
        'the source armature',
        default=True,
    )
    Scene.keep_target_place = BoolProperty(
        name='Keep Place.',
        description='When turn on, the target armature will keep its rest position and rotation',
        default=True,
    )
    Scene.optimize_mult_level_spines = BoolProperty(
        name='Optimize Spine Chain.',
        description='When turn on, all spine bones (in or not in mapping) will be optimized automatically',
        default=False,
    )
    # custom frame range
    Scene.start_frame = IntProperty(
        name='Start Frame',
        description='The start frame of the motion',
        default=0,
        min=0,
        update=operators.update_start_frame,
    )
    Scene.end_frame = IntProperty(
        name='End Frame',
        description='The end frame of the motion',
        default=0,
        min=0,
        update=operators.update_end_frame,
    )
    Scene.auto_align_depress = BoolProperty(default=True)

    # align rest pose panel
    Scene.align_restpose_status = BoolProperty(name='Change to redefine ui.', default=False)
    Scene.source_restpose = CollectionProperty(type=PoseModeRestpose)
    Scene.temp_source_restpose = CollectionProperty(type=PoseModeRestpose)
    Scene.init_source_restpose = CollectionProperty(type=PoseModeRestpose)
    Scene.target_restpose = CollectionProperty(type=PoseModeRestpose)
    Scene.temp_target_restpose = CollectionProperty(type=PoseModeRestpose)
    Scene.init_target_restpose = CollectionProperty(type=PoseModeRestpose)
    Scene.temp_source_action_name = StringProperty(default='')
    Scene.temp_target_action_name = StringProperty(default='')
    Scene.src_restpose_type = StringProperty(default='T-pose')
    Scene.tgt_restpose_type = StringProperty(default='T-pose')

    # adjust arm space
    Scene.expand_arm_space = BoolProperty(name='Expand arm space panel.', default=False)
    Scene.arm_space_degrees = FloatProperty(name='Degrees', default=0.0, min=-50.0, max=+50.0, step=250.0)

    # properties for motion copy and paste
    Scene.copy_armature = PointerProperty(type=bpy.types.Object)
    Scene.copy_bone_definition_list = CollectionProperty(type=QuickBoneListItem)

    # properties for part motion copy and paste
    Scene.part_copy_armature = PointerProperty(type=bpy.types.Object)
    Scene.part_copy_bone_definition_list = CollectionProperty(type=QuickBoneListItem)

    # properties for batch retarget
    Scene.expand_batch_retarget_ui = BoolProperty(
        name='Expand batch retarget ui.',
        description='Expand the batch retarget',
        default=False,
    )
    Scene.source_folder = StringProperty(
        name='Input Folder', description='Select the input motion folder', subtype='DIR_PATH', update=None
    )
    Scene.target_file = StringProperty(
        name='Target Armature File',
        description='Select the target armature to retarget',
        subtype='FILE_PATH',
        update=None,
    )
    Scene.output_folder = StringProperty(
        name='Output Folder', description='Input the output folder', subtype='DIR_PATH', update=None
    )
    Scene.use_single_retarget_config = BoolProperty(name="Use Single Retarget Config.", default=False)
    Scene.motion_format = PointerProperty(type=FileTypeProperties)

    # properties for remember bone mapping
    Scene.remember_mapping_name = StringProperty(name='Mapping Name', default='')
    Scene.mapping_memory_list = CollectionProperty(type=MappingInMemoryItem)
    Scene.mapping_memory_index = IntProperty(name='Index for the mapping memory list', default=0)


def add_to_object_context_menu(self, context):
    layout = self.layout
    layout.separator()
    layout.operator(operators.OBJECT_OT_CopyMotion.bl_idname, text='Copy Motion')
    layout = self.layout
    layout.operator(operators.OBJECT_OT_PasteMotion.bl_idname, text='Paste Motion')


def add_to_pose_context_menu(self, context):
    layout = self.layout
    layout.separator()
    layout.operator(operators.OBJECT_OT_PartCopyMotion.bl_idname, text='Part Copy Motion')
    layout = self.layout
    layout.operator(operators.OBJECT_OT_PartPasteMotion.bl_idname, text='Part Paste Motion')


# Global variable to store the keymap item
addon_keymaps = []


def register():
    # Since classes are automatically registered via `auto_load.py`
    # there is only need to register other things
    define_properties()

    # Quick retageting on context menu
    bpy.types.VIEW3D_MT_object_context_menu.append(add_to_object_context_menu)

    # Partial quick retageting on context menu
    bpy.types.VIEW3D_MT_pose_context_menu.append(add_to_pose_context_menu)

    # Add the shortcut
    wm = bpy.context.window_manager
    km = wm.keyconfigs.addon.keymaps.new(name="Object Mode", space_type="EMPTY")
    kmi = km.keymap_items.new(operators.OBJECT_OT_CopyMotion.bl_idname, type='C', value='PRESS', alt=True)
    addon_keymaps.append((km, kmi))
    km = wm.keyconfigs.addon.keymaps.new(name="Object Mode", space_type="EMPTY")
    kmi = km.keymap_items.new(operators.OBJECT_OT_PasteMotion.bl_idname, type='V', value='PRESS', alt=True)
    addon_keymaps.append((km, kmi))


def unregister():
    # Since classes are automatically unregistered via `auto_load.py`
    # there is only need to unregister other things

    # Remove the menu item
    bpy.types.VIEW3D_MT_object_context_menu.remove(add_to_object_context_menu)
    bpy.types.VIEW3D_MT_pose_context_menu.remove(add_to_pose_context_menu)

    # Remove the shortcuts
    for km, kmi in addon_keymaps:
        km.keymap_items.remove(kmi)
    addon_keymaps.clear()
