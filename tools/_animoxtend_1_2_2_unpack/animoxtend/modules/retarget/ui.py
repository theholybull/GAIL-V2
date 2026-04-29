import bpy

from ...config import Config
from . import operators
from .retarget_functions.guard import GuardianMixin

EXT_CATEGORY = "AX_Animate"


""" Retarget Panel """


class ANIMOXTEND_PT_RetargetPanel(bpy.types.Panel, GuardianMixin):
    """Animoxtend Retarget Panel."""

    bl_label = "Retarget"
    bl_idname = Config.panel_prefix + "VIEW3D_Retarget_Panel"
    bl_options = {"DEFAULT_CLOSED"}
    bl_category = EXT_CATEGORY
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_order = 2

    @classmethod
    def poll(cls, context):
        cls.api_key = operators.get_api_key(context)
        cls.server_host = operators.get_server_host(context)
        return True

    def draw(self, context):
        layout = self.layout
        layout.use_property_split = False

        layout.prop(context.scene, "tabs", expand=True)

        if context.scene.tabs == "RETARGET":
            use_redefine_panel = context.scene.align_restpose_status
            if not use_redefine_panel:
                # select source armature
                row = layout.row(align=True)
                split = row.split(factor=0.44)
                left_col = split.column()
                left_col.label(text="Source armature:")
                sub_row = left_col.row(align=True)
                sub_split1 = sub_row.split(factor=0.86)
                row = sub_split1.row(align=True)
                row.prop_search(context.scene, "source_arm_name", bpy.data, "objects", text="")
                row.operator(
                    operators.OBJECT_OT_CustomEyedropper.bl_idname,
                    text="",
                    icon="EYEDROPPER",
                ).pick_action = "source"

                # check auto bone mapping status
                if not context.scene.src_root_valid_status:
                    src_map_icon = "X"
                elif context.scene.src_check_mapping_result != "":
                    src_map_icon = "ERROR"
                elif context.scene.src_check_mapping_result == "" and context.scene.src_root_valid_status:
                    src_map_icon = "CHECKMARK"
                elif context.scene.source_arm is None:
                    src_map_icon = None
                else:
                    pass
                sub_split1.operator(
                    operators.OBJECT_OT_SourceMappingTooltip.bl_idname,
                    icon=src_map_icon,
                    text="",
                    depress=context.scene.src_map_depress,
                )

                # mid column
                remaining = split.split(factor=0.182)
                mid_col = remaining.column()
                mid_col.scale_y = 2
                # blender 4.2: icon_value=972, blender 3.6: icon_valu=4
                if bpy.app.version < (4, 2):
                    icon_value = 4
                else:
                    icon_value = 972
                mid_col.template_icon(icon_value=icon_value)

                # select target armature
                right_col = remaining.column()
                right_col.label(text="Target armature:")
                sub_row = right_col.row()
                sub_split2 = sub_row.split(factor=0.86)
                row = sub_split2.row(align=True)
                row.prop_search(context.scene, "target_arm_name", bpy.data, "objects", text="")
                row.operator(
                    operators.OBJECT_OT_CustomEyedropper.bl_idname,
                    text="",
                    icon="EYEDROPPER",
                ).pick_action = "target"
                # check auto bone mapping status
                if not context.scene.tgt_root_valid_status:
                    tgt_map_icon = "X"
                elif context.scene.tgt_check_mapping_result != "":
                    tgt_map_icon = "ERROR"
                elif context.scene.tgt_check_mapping_result == "" and context.scene.tgt_root_valid_status:
                    tgt_map_icon = "CHECKMARK"
                elif context.scene.target_arm is None or context.scene.target_arm.type != "ARMATURE":
                    tgt_map_icon = None
                else:
                    pass
                sub_split2.operator(
                    operators.OBJECT_OT_TargetMappingTooltip.bl_idname,
                    icon=tgt_map_icon,
                    text="",
                    depress=context.scene.tgt_map_depress,
                )

                # check if animation exist
                if context.scene.source_arm and context.scene.source_arm.type != "ARMATURE":
                    row = layout.row(align=True)
                    row.label(text="Only armature object can be selected.", icon="INFO")
                    return

                # check if animation exist
                if context.scene.target_arm:
                    if context.scene.target_arm.type != "ARMATURE":
                        row = layout.row(align=True)
                        row.label(text="Only armature object can be selected.", icon="INFO")
                        return

                # check if api key is valid
                if not self.is_authenticated():
                    row = layout.row(align=True)
                    row.label(text="Please setup a valid API key!", icon="ERROR")

                # retarget animation
                if context.scene.source_arm and context.scene.target_arm:
                    if not context.scene.expand_advanced_ui:
                        info_text = "Retarget Automatically."
                    else:
                        info_text = "Retarget Using Advanced Settings."
                    row = layout.row(align=True)
                    row.label(text=info_text, icon="INFO")
                row = layout.row(align=True)
                row.scale_y = 2
                row.operator(
                    operators.OBJECT_OT_SingleRetarget.bl_idname,
                    text="Retarget Animation",
                    icon="PLAY",
                )

                # show source bone mapping
                if context.scene.expand_src_mapping:
                    box = layout.box()
                    row = box.row(align=True)
                    row.label(text="Source Bone Mapping:")
                    row = box.row(align=True)
                    split = row.split(factor=0.5)
                    row = split.row(align=True)
                    row.scale_y = 1.2
                    row.operator(
                        operators.OBJECT_OT_SourceBuildBoneList.bl_idname,
                        text="Auto Bone Mapping",
                        icon="GROUP_BONE",
                    )
                    row.scale_y = 1.2
                    row.alignment = "RIGHT"
                    row.operator(
                        operators.OBJECT_OT_ClearBoneList.bl_idname,
                        text="",
                        icon="X",
                    ).pick_action = "source"
                    row = split.row(align=True)
                    row.scale_y = 1.2
                    row.operator(
                        operators.OBJECT_OT_MemorizeBoneMapping.bl_idname,
                        text="Memorize Mapping",
                        icon="SOLO_ON",
                    ).pick_action = "source"
                    # import and export mapping
                    row.operator(
                        operators.OBJECT_OT_LoadBoneList.bl_idname,
                        text="",
                        icon="IMPORT",
                    ).pick_action = "source"
                    row.operator(
                        operators.OBJECT_OT_SourceSaveBoneList.bl_idname,
                        text="",
                        icon="EXPORT",
                    )
                    row = box.row(align=True)
                    split = row.split(factor=0.5)
                    split.label(text="Standard Bones:")
                    split.label(text="Source Bones:")
                    row = box.row(align=True)
                    row.template_list(
                        ANIMOXTEND_UL_SourceBoneList.bl_idname,
                        "Source Bone List",
                        bpy.context.scene,
                        "source_bone_definition_list",
                        bpy.context.scene,
                        "source_bone_list_index",
                        rows=1,
                        maxrows=4,
                    )
                    if (
                        not context.scene.src_root_valid_status
                        and context.scene.source_arm
                        and context.scene.source_arm.type == "ARMATURE"
                    ):
                        row = box.row(align=True)
                        row.label(text="No valid source 'Hips' bone found.", icon="X")

                    if context.scene.src_check_mapping_result != "" and context.scene.source_arm is not None:
                        row = box.row(align=True)
                        row.label(text=context.scene.src_check_mapping_result, icon="ERROR")

                # show target bone mapping
                if context.scene.expand_tgt_mapping:
                    box = layout.box()
                    row = box.row(align=True)
                    row.label(text="Target Bone Mapping:")
                    row = box.row(align=True)
                    split = row.split(factor=0.5)
                    row = split.row(align=True)
                    row.scale_y = 1.2
                    row.operator(
                        operators.OBJECT_OT_TargetBuildBoneList.bl_idname,
                        text="Auto Bone Mapping",
                        icon="GROUP_BONE",
                    )
                    row.scale_y = 1.2
                    row.alignment = "RIGHT"
                    row.operator(
                        operators.OBJECT_OT_ClearBoneList.bl_idname,
                        text="",
                        icon="X",
                    ).pick_action = "target"
                    row = split.row(align=True)
                    row.scale_y = 1.2
                    row.operator(
                        operators.OBJECT_OT_MemorizeBoneMapping.bl_idname,
                        text="Memorize Mapping",
                        icon="SOLO_ON",
                    ).pick_action = "target"
                    # import and export mapping
                    row.operator(
                        operators.OBJECT_OT_LoadBoneList.bl_idname,
                        text="",
                        icon="IMPORT",
                    ).pick_action = "target"
                    row.operator(
                        operators.OBJECT_OT_TargetSaveBoneList.bl_idname,
                        text="",
                        icon="EXPORT",
                    )
                    row = box.row(align=True)
                    split = row.split(factor=0.5)
                    split.label(text="Standard Bones:")
                    split.label(text="Target Bones:")
                    row = box.row(align=True)
                    row.template_list(
                        ANIMOXTEND_UL_TargetBoneList.bl_idname,
                        "Target Bone List",
                        bpy.context.scene,
                        "target_bone_definition_list",
                        bpy.context.scene,
                        "target_bone_list_index",
                        rows=1,
                        maxrows=4,
                    )
                    if (
                        not context.scene.tgt_root_valid_status
                        and context.scene.target_arm
                        and context.scene.target_arm.type == "ARMATURE"
                    ):
                        row = box.row(align=True)
                        row.label(text="No valid target 'Hips' bone found.", icon="X")

                    if context.scene.tgt_check_mapping_result != "" and context.scene.target_arm is not None:
                        row = box.row(align=True)
                        row.label(text=context.scene.tgt_check_mapping_result, icon="ERROR")

                # advanced options
                box = layout.box()
                row = box.row()
                row.prop(
                    context.scene,
                    "expand_advanced_ui",
                    icon="HIDE_OFF" if context.scene.expand_advanced_ui else "HIDE_ON",
                    icon_only=True,
                    text="Advanced Settings",
                    emboss=False,
                )
                if context.scene.expand_advanced_ui:
                    # align reference pose
                    row = box.row(align=True)
                    row.operator(
                        operators.OBJECT_OT_SelectReferencePoseSource.bl_idname,
                        text="Align Reference Pose",
                    )
                    auto_icon = "RADIOBUT_ON" if context.scene.auto_align_depress else "RADIOBUT_OFF"
                    row.operator(
                        operators.OBJECT_OT_ChangeAutoAlignStatus.bl_idname,
                        text="",
                        icon=auto_icon,
                        depress=context.scene.auto_align_depress,
                    )
                    # custom frame range
                    row = box.row(align=True)
                    row.label(text="Frame Range:")
                    row.prop(context.scene, "start_frame", text="start")
                    row.prop(context.scene, "end_frame", text="end")
                    # other options
                    row = box.row(align=True)
                    row.prop(context.scene, "automatic_scale", text="Auto Scale")
                    row.prop(context.scene, "keep_target_place", text="Keep Target Place")
                    row.prop(
                        context.scene,
                        "optimize_mult_level_spines",
                        text="Optimize Spine Chain",
                    )

            else:
                # auto align rest pose
                row = layout.row(align=True)
                row.label(text="Align reference pose.", icon="INFO")
                box = layout.box()
                row = box.row(align=True)
                row.label(text="Source Reference Pose:")
                row = box.row(align=True)
                row.operator(
                    operators.OBJECT_OT_SourceAutoPose.bl_idname,
                    text=f"Auto {context.scene.src_restpose_type}",
                    icon="ARMATURE_DATA",
                )
                row.menu(
                    ANIMOXTEND_MT_AutoPoseSrcMenu.bl_idname,
                    text="",
                    icon="DOWNARROW_HLT",
                )
                row = box.row(align=True)
                row.operator(
                    operators.OBJECT_OT_ResetInitPose.bl_idname,
                    text="Reset",
                    icon="LOOP_BACK",
                ).pick_action = "source"
                row.operator(
                    operators.OBJECT_OT_ApplyRedefine.bl_idname,
                    text="Apply Rest Pose",
                    icon="EDITMODE_HLT",
                ).pick_action = "source"

                # auto align rest pose
                box = layout.box()
                row = box.row(align=True)
                row.label(text="Target Reference Pose:")
                row = box.row(align=True)
                row.operator(
                    operators.OBJECT_OT_TargetAutoPose.bl_idname,
                    text=f"Auto {context.scene.tgt_restpose_type}",
                    icon="ARMATURE_DATA",
                )
                row.menu(
                    ANIMOXTEND_MT_AutoPoseTgtMenu.bl_idname,
                    text="",
                    icon="DOWNARROW_HLT",
                )
                row = box.row(align=True)
                row.operator(
                    operators.OBJECT_OT_ResetInitPose.bl_idname,
                    text="Reset",
                    icon="LOOP_BACK",
                ).pick_action = "target"
                row.operator(
                    operators.OBJECT_OT_ApplyRedefine.bl_idname,
                    text="Apply Rest Pose",
                    icon="EDITMODE_HLT",
                ).pick_action = "target"

                layout.separator()
                row = layout.row(align=True)
                row.operator(operators.OBJECT_OT_CancelRedefine.bl_idname, text="Cancel")
                row.operator(operators.OBJECT_OT_SaveRedefine.bl_idname, text="Save")

        else:
            # batch retarget
            row = layout.row(align=True)
            split = row.split(factor=0.3)
            split.label(text="Source motion folder:")
            split.prop(context.scene, "source_folder", text="")
            row = layout.row(align=True)
            split = row.split(factor=0.3)
            split.label(text="Source file type:")
            split = split.split(factor=0.3)
            split.prop(context.scene.motion_format, "type_dropdown", text="")

            row = layout.row(align=True)
            split = row.split(factor=0.3)
            split.label(text="Target armature file:")
            split.prop(context.scene, "target_file", text="")

            row = layout.row(align=True)
            split = row.split(factor=0.3)
            split.label(text="Output motion folder:")
            split.prop(context.scene, "output_folder", text="")

            # advanced options
            row = layout.row(align=True)
            row.prop(
                context.scene,
                "use_single_retarget_config",
                text="Use Single Retarget Config",
            )

            # retarget animation
            layout.separator()
            row = layout.row(align=True)
            row.scale_y = 2

            # check if api key is valid
            if not self.is_authenticated():
                row = layout.row(align=True)
                row.label(text="Please setup a valid API key!", icon="ERROR")

            row.operator(
                operators.OBJECT_OT_BatchRetarget.bl_idname,
                text="Batch Retarget Animation",
                icon="PLAY",
            )

            row = layout.row(align=True)
            row.label(text="Recommend to install better-fbx addon.", icon="INFO")


class ANIMOXTEND_UL_SourceBoneList(bpy.types.UIList):
    bl_idname = Config.ui_list_prefix + "SourceBone_UI_List"

    def draw_item(self, context, layout, data, item, icon, active_data, active_propname, index):
        armature = bpy.context.scene.source_arm
        layout = layout.split(factor=0.5, align=True)
        layout.label(text=item.standard_bone_name)
        if armature:
            layout.prop_search(item, "bone_name", armature.pose, "bones", text="")


class ANIMOXTEND_UL_TargetBoneList(bpy.types.UIList):
    bl_idname = Config.ui_list_prefix + "TargetBone_UI_List"

    def draw_item(self, context, layout, data, item, icon, active_data, active_propname, index):
        armature = bpy.context.scene.target_arm
        layout = layout.split(factor=0.5, align=True)
        layout.label(text=item.standard_bone_name)
        if armature:
            layout.prop_search(item, "bone_name", armature.pose, "bones", text="")


class ANIMOXTEND_MT_AutoPoseSrcMenu(bpy.types.Menu):
    bl_idname = Config.menu_prefix + "AutoPoseSrc_Menu"
    bl_label = "Auto redefine source pose type"

    def draw(self, context):
        layout = self.layout
        layout.operator(operators.OBJECT_OT_SourceAutoPose.bl_idname, text="T-pose").pose_type = "T-pose"
        layout.operator(operators.OBJECT_OT_SourceAutoPose.bl_idname, text="TX-pose").pose_type = "TX-pose"
        layout.operator(operators.OBJECT_OT_SourceAutoPose.bl_idname, text="A-pose_30").pose_type = "A-pose_30"
        layout.operator(operators.OBJECT_OT_SourceAutoPose.bl_idname, text="A-pose_45").pose_type = "A-pose_45"
        layout.operator(operators.OBJECT_OT_SourceAutoPose.bl_idname, text="AX-pose_30").pose_type = "AX-pose_30"
        layout.operator(operators.OBJECT_OT_SourceAutoPose.bl_idname, text="AX-pose_45").pose_type = "AX-pose_45"


class ANIMOXTEND_MT_AutoPoseTgtMenu(bpy.types.Menu):
    bl_idname = Config.menu_prefix + "AutoPoseTgt_Menu"
    bl_label = "Auto redefine Target pose type"

    def draw(self, context):
        layout = self.layout
        layout.operator(operators.OBJECT_OT_TargetAutoPose.bl_idname, text="T-pose").pose_type = "T-pose"
        layout.operator(operators.OBJECT_OT_TargetAutoPose.bl_idname, text="TX-pose").pose_type = "TX-pose"
        layout.operator(operators.OBJECT_OT_TargetAutoPose.bl_idname, text="A-pose_30").pose_type = "A-pose_30"
        layout.operator(operators.OBJECT_OT_TargetAutoPose.bl_idname, text="A-pose_45").pose_type = "A-pose_45"
        layout.operator(operators.OBJECT_OT_TargetAutoPose.bl_idname, text="AX-pose_30").pose_type = "AX-pose_30"
        layout.operator(operators.OBJECT_OT_TargetAutoPose.bl_idname, text="AX-pose_45").pose_type = "AX-pose_45"


""" Extension Tool Panel """


class ANIMOXTEND_PT_ExtenstionToolPanel(bpy.types.Panel, GuardianMixin):
    """Animoxtend Extension Tool Panel."""

    bl_label = "Extension Tools"
    bl_idname = Config.panel_prefix + "VIEW3D_ExtensionTool_Panel"
    bl_options = {"DEFAULT_CLOSED"}
    bl_category = EXT_CATEGORY
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_order = 5

    @classmethod
    def poll(cls, context):
        cls.api_key = operators.get_api_key(context)
        cls.server_host = operators.get_server_host(context)
        return True

    def draw(self, context):
        layout = self.layout
        layout.use_property_split = False

        # apply rest pose
        row = layout.row(align=True)
        split = row.split(factor=0.5)
        split.operator(
            operators.OBJECT_OT_ApplyRedefineExtend.bl_idname,
            text="Apply as Rest Pose",
            icon="ARMATURE_DATA",
        )
        # auto bone orientation
        split.operator(
            operators.OBJECT_OT_AutoBoneOrientation.bl_idname,
            text="Auto Bone Orientation",
            icon="AUTO",
        )
        # additive layer edit bone, rotation
        row = layout.row()
        split = row.split(factor=0.5)
        cur_mode = context.mode
        condition = (
            cur_mode == "POSE"
            and context.active_object is not None
            and context.active_object.type == "ARMATURE"
            and len(context.selected_pose_bones) == 1
        )
        subrow = split.row(align=True)
        subrow.enabled = condition
        subrow.operator(
            operators.OBJECT_OT_BoneRotateModal.bl_idname,
            text="Additive Bone Rotation",
            icon="BONE_DATA",
        )

        # additive layer edit bone, location
        subrow = split.row(align=True)
        subrow.enabled = condition
        subrow.operator(
            operators.OBJECT_OT_BoneLocateModal.bl_idname,
            text="Additive Bone Location",
            icon="GROUP_BONE",
        )

        # arm space panel
        row = layout.row(align=True)
        condition = context.active_object is not None and context.active_object.type == "ARMATURE"
        row.enabled = condition
        text = "" if context.scene.expand_arm_space else "Adjust Arm Space"
        icon = "HIDE_OFF" if context.scene.expand_arm_space else "HIDE_ON"
        row.prop(context.scene, "expand_arm_space", icon=icon, text=text)
        if context.scene.expand_arm_space:
            subrow = row.row(align=True)
            subrow.prop(context.scene, "arm_space_degrees", text="degree:")
            button_text = "Expand Space" if context.scene.arm_space_degrees > 0 else "Shrink Space"
            space_icon = "FULLSCREEN_ENTER" if context.scene.arm_space_degrees > 0 else "FULLSCREEN_EXIT"
            subrow.operator(
                operators.OBJECT_OT_AdjustArmSpace.bl_idname,
                text=button_text,
                icon=space_icon,
            )
