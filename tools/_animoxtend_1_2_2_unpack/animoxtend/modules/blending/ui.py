"""
This file contains the UI panels and interface elements for the blending module.
"""

import bpy

from ...config import Config
from ...utils.http import XClient
from ..retarget.retarget_functions.guard import GuardianMixin
from .operators import (
    OBJECT_OT_BlendingCustomEyedropper,
    OBJECT_OT_motion_blend,
    OBJECT_OT_motion_blend_reset,
    OBJECT_OT_motion_inbetween,
    OBJECT_OT_motion_inbetween_reset,
    get_api_key,
    get_server_host,
)

EXT_CATEGORY = "AX_Animate"


class VIEW3D_PT_motion_blending_panel(bpy.types.Panel, GuardianMixin):
    """AnimoXtend Smart Blend Panel."""

    bl_label = "Smart Blend"
    bl_idname = Config.panel_prefix + "VIEW3D_PT_UI_BLENDING_Template_Panel"
    bl_options = {"DEFAULT_CLOSED"}
    bl_category = EXT_CATEGORY
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_order = 3

    @classmethod
    def poll(cls, context):
        cls.api_key = get_api_key(context)
        cls.server_host = get_server_host(context)
        return True

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        layout.use_property_split = False
        row = layout.row(align=True)
        row.prop(scene, "blend_tab", expand=True)

        if scene.blend_tab == "CONCAT":
            self.draw_concat_tab(layout, scene)
        else:
            self.draw_inbetween_tab(layout, scene)

    def draw_concat_tab(self, layout, scene):
        """
        绘制 CONCAT 功能的设置面板。
        """
        # Armature 1
        armature_row = layout.row(align=True)
        armature_row.prop_search(
            scene,
            "armature1_name",
            bpy.data,
            "objects",
            text="Pre Armature",
        )
        armature_row.operator(
            OBJECT_OT_BlendingCustomEyedropper.bl_idname,
            text="",
            icon="EYEDROPPER",
        ).action = "armature1"

        # Armature 2
        armature_row = layout.row(align=True)
        armature_row.prop_search(
            scene,
            "armature2_name",
            bpy.data,
            "objects",
            text="Next Armature",
        )
        armature_row.operator(
            OBJECT_OT_BlendingCustomEyedropper.bl_idname,
            text="",
            icon="EYEDROPPER",
        ).action = "armature2"

        # operator
        self.draw_blending_operators(layout, scene)

        # advanced settings
        if scene.blend_mode == "NEURAL":
            self.draw_blending_settings(
                layout,
                scene,
            )

    def draw_blending_operators(self, layout, scene):
        """
        绘制 Motion Blending 的 按钮。
        """
        layout.prop(scene, "blend_mode", text="Blend Mode")

        info_text = ""

        if not (scene.armature1_name and scene.armature2_name):
            info_text = "Please select two armatures."

        if scene.armature1_name and scene.armature2_name:
            if scene.blend_mode == "FAST":
                info_text = "Perform Fast Blending."
            elif scene.show_neural_settings is False:
                info_text = "Perform Neural Blending Automatically."
            elif scene.show_neural_settings is True:
                info_text = "Perform Neural Blending Using Advanced Settings."

            if scene.blending_settings.trans_len == 0:
                info_text = "Current Neural Blending Generate Frame will be zero!"

            if XClient.check_online_access() is False:
                info_text = "Please turn on blender online access."

            info_row = layout.row(align=True)
            info_row.label(text=info_text, icon="INFO")

        # check if api key is valid
        if not self.is_authenticated():
            apikey_row = layout.row(align=True)
            apikey_row.label(text="Please setup a valid API key!", icon="ERROR")

        # Blend operator
        blend_box = layout.row(align=True)
        blend_box.scale_y = 1.8

        split = blend_box.row(align=True).split(factor=4 / 5)
        col1 = split.column()
        col1.operator(OBJECT_OT_motion_blend.bl_idname, text="Blend Armatures", icon="BLENDER")

        col2 = split.column()
        col2.operator(OBJECT_OT_motion_blend_reset.bl_idname, text="", icon="LOOP_BACK")
        # rest_operator.armature_name = armature_name

    def draw_blending_settings(self, layout, scene):
        """
        绘制 Motion Blending 的 advanced settings。
        """
        if scene.blend_mode == "NEURAL":
            settings = scene.blending_settings

            main_box = layout.box()
            settings_row = main_box.row(align=True)
            settings_row.prop(
                scene,
                "show_neural_settings",
                icon="HIDE_OFF" if scene.show_neural_settings else "HIDE_ON",
                text="Advanced Neural Settings",
                emboss=False,
            )

            if scene.show_neural_settings:
                settings_box = main_box.box()

                # Generate frames
                trans_len_row = settings_box.row(align=True)
                trans_len_row.scale_y = 0.9

                split = trans_len_row.split(factor=0.8)

                ## 左侧 generate frames
                col = split.column(align=True)
                sub_row = col.row(align=True)
                sub_row.label(text="Generate Frames:")
                sub_row.prop(settings, "trans_len", text="", expand=True)

                ## 右侧 Auto Update
                col = split.column(align=True)
                col.scale_x = 0.8
                col.prop(settings, "auto_update_trans_len", text="Auto Update")

                # State Machine
                state_machine_row = settings_box.row(align=True)
                state_machine_row.scale_y = 0.9
                state_machine_row.prop(settings, "use_state_machine", text="Use State Machine")

                if settings.use_state_machine:
                    row = settings_box.row(align=True)
                    row.scale_y = 0.9
                    row.prop(settings, "pre_text", text="Pre Motion Text")

                    row = settings_box.row(align=True)
                    row.scale_y = 0.9
                    row.prop(settings, "next_text", text="Next Motion Text")

                # Post Processing
                post_process_row = settings_box.row(align=True)
                post_process_row.scale_y = 0.9
                post_process_row.prop(settings, "post_processing", text="Enable Post Processing")

                if settings.post_processing:
                    row = settings_box.row(align=True)
                    row.scale_y = 0.9
                    row.prop(settings, "post_processing_mode", text="Process Mode")

    def draw_inbetween_tab(self, layout, scene):
        """
        绘制 INBETWEEN 功能的设置面板。
        """
        # armature
        armature_row = layout.row(align=True)
        armature_row.prop_search(
            scene,
            "armature_inbetween_name",
            bpy.data,
            "objects",
            text="Armature",
        )
        armature_row.operator(
            OBJECT_OT_BlendingCustomEyedropper.bl_idname,
            text="",
            icon="EYEDROPPER",
        ).action = "armature_inbetween"

        armature_obj = getattr(scene, "armature_inbetween")
        armature_name = armature_obj.name if armature_obj else "None"

        # info
        if scene.armature_inbetween:
            info_text = "Inbetweening using selected K_Frames or NLA_strips."

            if scene.show_inbetween_settings:
                info_text = "Inbetweening with Advanced Settings."

            if XClient.check_online_access() is False:
                info_text = "Please turn on blender online access."

            info_row = layout.row(align=True)
            info_row.scale_y = 0.9
            info_row.label(text=info_text, icon="INFO")

        # check if api key is valid
        if not self.is_authenticated():
            apikey_row = layout.row(align=True)
            apikey_row.label(text="Please setup a valid API key!", icon="ERROR")

        # operator
        inbetween_row = layout.row()
        inbetween_row.scale_y = 1.8

        split = inbetween_row.row(align=True).split(factor=4 / 5)
        col1 = split.column()
        op = col1.operator(OBJECT_OT_motion_inbetween.bl_idname, text="Motion Inbetween", icon="BLENDER")
        op.armature_name = armature_name

        col2 = split.column()
        col2.operator(OBJECT_OT_motion_inbetween_reset.bl_idname, text="", icon="LOOP_BACK")

        # Advanced Inbetween Settings
        settings_box = layout.box()
        settings_row = settings_box.row(align=True)
        settings_row.scale_y = 0.9
        settings_row.prop(
            scene,
            "show_inbetween_settings",
            icon="HIDE_OFF" if scene.show_neural_settings else "HIDE_ON",
            text="Advanced Inbetween Settings",
            emboss=False,
        )

        if scene.show_inbetween_settings:
            box = settings_box.box()

            post_process_row = box.row(align=True)

            inbetween_settings = scene.inbetween_settings

            # Post Processing 设置
            post_process_row.scale_y = 0.9
            post_process_row.prop(inbetween_settings, "post_processing", text="Enable Post Processing")

            if inbetween_settings.post_processing:
                post_process_row = box.row(align=True)
                post_process_row.scale_y = 0.9
                post_process_row.prop(inbetween_settings, "post_processing_mode", text="Process Mode")
