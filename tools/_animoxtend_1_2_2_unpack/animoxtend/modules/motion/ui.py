"""
This file contains the UI panels and interface elements for the motion module.
"""

import bpy

from ...config import Config
from . import operators

EXT_CATEGORY = "AX_Animate"


class VIEW3D_PT_SAI_Panel(bpy.types.Panel):
    bl_idname = Config.panel_prefix + "VIEW3D_PT_SAI_Panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_label = "Generate"
    bl_category = EXT_CATEGORY
    bl_order = 1

    def draw(self, context):
        scn = context.scene
        layout = self.layout

        layout.use_property_split = False
        layout.prop(context.scene, "generate_tabs", expand=True)

        if context.scene.generate_tabs == "Motion":
            object_row = layout.row(align=True)
            sub_row = object_row.row(align=True)

            sub_row.prop_search(
                context.scene,
                "buffer_armature_name",
                context.scene,
                "objects",
                text="Target Armature",
            )

            # 添加过滤器
            if context.scene.buffer_armature_name:
                obj = context.scene.objects.get(context.scene.buffer_armature_name)
                if obj and obj.type != "ARMATURE":
                    context.scene.buffer_armature_name = ""
            # else:
            #     sub_row.prop(
            #         context.scene, "buffer_armature_name", text="Target Armature"
            #     )
            sub_row.operator(
                operators.OBJECT_OT_MotionCustomEyedropper.bl_idname,
                text="",
                icon="EYEDROPPER",
            ).action = "armature"

            sub_row.operator(
                operators.OBJECT_OT_MotionCustomToggle.bl_idname,
                text="",
                icon="RADIOBUT_ON" if context.scene.motion_toggle_state else "RADIOBUT_OFF",
                depress=context.scene.motion_toggle_state,
            )

            t2m_row = layout.row(align=True)
            split = t2m_row.split(factor=0.7)
            split.prop(scn, "motion_keyword", text="Text")
            split.prop(scn, "motion_topk", text="")

            t2m_row2 = layout.row(align=True)
            split = t2m_row2.split(factor=0.7)
            split.prop(scn.motion_ui, "motion_ui_list", text="Motions")
            split.operator(
                operators.OBJECT_OT_TEXT_TO_MOTION.bl_idname,
                text="Search",
                icon="VIEWZOOM",
            )

            # 检查条件
            has_armature = bool(context.scene.buffer_armature_name)
            has_motion = bool(scn.motion_ui.motion_ui_list) and scn.motion_ui.motion_ui_list != "待生成"

            # Info labels 行
            info_row = layout.row(align=True)

            if not has_armature:
                info_row.label(text="You need to set target armature", icon="INFO")

            elif not has_motion:
                info_row.label(text="You need to select a motion", icon="INFO")

            # Generate Motion 按钮行
            t2m_row3 = layout.row(align=True)
            t2m_row3.scale_y = 1.8
            t2m_row3.enabled = has_armature and has_motion  # 根据条件设置是否可用
            t2m_row3.operator(
                operators.OBJECT_OT_DOWNLOAD_MOTION.bl_idname,
                text="Generate Motion Anim !",
                icon="ARMATURE_DATA",
            )
        else:
            face_target_row = layout.row(align=True)

            face_target_row.prop_search(
                context.scene,
                "buffer_body_name",
                context.scene,
                "objects",  # 使用 meshes 而不是 objects
                text="Target Face Mesh",
            )

            face_target_row.operator(
                operators.OBJECT_OT_MotionCustomEyedropper.bl_idname,
                text="",
                icon="EYEDROPPER",
            ).action = "body"
            layout.prop(scn, "face_audio_file", text="Audio Path(wav)")

            # 检查条件
            has_face_mesh = bool(context.scene.buffer_body_name)
            has_audio = bool(context.scene.face_audio_file)

            # Info labels 行
            info_row = layout.row(align=True)

            # Face Mesh 的 info

            if not has_face_mesh:
                info_row.label(text="You need to set target face mesh", icon="INFO")

            # Audio 的 info
            elif not has_audio:
                info_row.label(text="You need to set audio file", icon="INFO")

            # Generate Face 按钮行
            face_operator_row = layout.row(align=True)
            face_operator_row.scale_y = 1.8
            face_operator_row.enabled = has_face_mesh and has_audio  # 根据条件设置是否可用
            face_operator_row.operator(
                operators.OBJECT_OT_GENERATE_FACE.bl_idname,
                text="Generate Face Anim !",
                icon="MONKEY",
            )

            face_box = layout.box()
            row = face_box.row()
            row.prop(
                scn,
                "show_face_module",
                icon="TRIA_DOWN" if scn.show_face_module else "TRIA_RIGHT",
                text="Advanced",
                emboss=False,
            )

            if scn.show_face_module:
                face_model_row = face_box.row(align=True)
                face_model_row.prop(scn, "face_model_ui", text="Face Model")
                face_model_row.operator(
                    operators.OBJECT_OT_REFRESHFACEMODEL.bl_idname,
                    text="",
                    icon="FILE_REFRESH",
                )
                face_box.prop(scn, "emotion_ui", text="Emotion")
                face_box.operator(
                    operators.OBJECT_OT_AUDIO_TO_FACE.bl_idname,
                    text="Audio2Face",
                    icon="MONKEY",
                )
                face_box.prop(scn, "face_anim_file", text="Face Data Path")
                face_box.operator(
                    operators.OBJECT_OT_IMPORT_FACEANIM.bl_idname,
                    text="Import Face Anim",
                    icon="IMPORT",
                )
