"""
This file contains the UI panels and interface elements for the blending module.
"""

import bpy

from ...config import Config
from . import operators

EXT_CATEGORY = "AX Create"


class MA_UL_task_list(bpy.types.UIList):
    def draw_item(self, context, layout, data, item, icon, active_data, active_propname, index):
        if self.layout_type in {"DEFAULT", "COMPACT"}:
            # 计算反向索引，用于获取实际的任务项
            real_index = len(data.task_list) - index - 1
            item = data.task_list[real_index]

            # 使用split来创建等宽的列
            split = layout.split()

            # 第一列：Task ID
            col1 = split.column()
            row = col1.row()
            row.alignment = "CENTER"
            row.label(text=f"{item.task_id[:8]}...")

            # 第二列：Task 类型
            col2 = split.column()
            row = col2.row()
            row.alignment = "CENTER"
            row.label(text=item.task_type)

            # 第三列：任务进度
            col3 = split.column()
            row = col3.row()
            row.alignment = "CENTER"
            row.label(text=f"{item.task_progress:.0f}%")

            # 第四列：导入按钮
            col4 = split.column()
            row = col4.row()
            row.alignment = "CENTER"
            op = row.operator(operators.MESH_ARTIFICER_OT_IMPORT_RESULT.bl_idname, text="Import")
            op.task_id = item.task_id


class VIEW3D_PT_MANAGEMENT_Panel(bpy.types.Panel):
    bl_idname = Config.panel_prefix + "VIEW3D_PT_MANAGEMENT_Panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_label = "Management"
    bl_category = EXT_CATEGORY
    bl_order = 1

    def draw(self, context):
        scn = context.scene
        layout = self.layout
        row = layout.row()

        management_box = layout.box()
        row = management_box.row()
        row.prop(
            scn,
            "show_management_module",
            icon="HIDE_OFF" if scn.show_management_module else "HIDE_ON",
            text="Tripo API Management",
            emboss=False,
        )
        if scn.show_management_module:
            row = management_box.row()
            split = row.split(factor=0.8)
            split.prop(scn, "tripo_api_key")
            split.operator("mesh_artificer.check_wallet")

        # 添加列表标题
        header_row = layout.row()
        titles = ["Task ID", "Type", "Progress", "Actions"]
        # 使用 factor 参数来留出右侧空间
        split = header_row.split(factor=0.93)  # 调整这个值来匹配右侧按钮列的宽度
        header_split = split.split()

        for title in titles:
            col = header_split.column()
            row = col.row()
            row.alignment = "CENTER"
            row.label(text=title)

        # 添加一个空列来对齐右侧按钮
        split.column()

        # 任务列表
        row = layout.row()
        row.template_list(
            "MA_UL_task_list",
            "",
            scn.task_list,
            "task_list",
            scn.task_list,
            "active_task_index",
            rows=5,
        )

        col = row.column(align=True)
        col.operator(
            operators.MESH_ARTIFICER_OT_remove_task.bl_idname,
            text="",
            icon="REMOVE",
        )
        col.operator(operators.MESH_ARTIFICER_OT_clear_tasks.bl_idname, text="", icon="X")


class VIEW3D_PT_GENERATE_Panel(bpy.types.Panel):
    bl_idname = Config.panel_prefix + "VIEW3D_PT_GENERATE_Panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_label = "Generate"
    bl_category = EXT_CATEGORY
    bl_order = 2

    def draw(self, context):
        layout = self.layout
        scn = context.scene
        input_box = layout.box()
        input_box.prop(scn, "text_prompt", text="Input Text")
        input_box.prop(scn, "generate_style_ui", text="Select Style")
        input_box.label(text="Upload Image:")
        MV_props = scn.multi_view_props
        # multi_view_box = input_box.box()
        preview_row = input_box.row(align=True)
        split = preview_row.split(factor=0.25)
        views = [
            (MV_props.front_view, "Front View"),
            (MV_props.back_view, "Back View"),
            (MV_props.left_view, "Left View"),
            (MV_props.right_view, "Right View"),
        ]
        for view_prop, view_label in views:
            col = split.column(align=True)

            label_row = col.row()
            label_row.alignment = "CENTER"
            label_row.label(text=view_label)

            image_row = col.row()
            image_row.alignment = "CENTER"
            if view_prop.show_preview and view_prop.ma_preview_image:
                image_row.template_ID_preview(
                    view_prop,
                    "ma_preview_image",
                    open="mesh_artificer.select_image",
                    rows=0,
                    cols=0,
                )
        button_row = input_box.row(align=True)
        for _view_prop, view_label in views:
            select_op = button_row.operator(
                operators.MESH_ARTIFICER_select_image.bl_idname,
                text="Select",
            )
            select_op.view_type = view_label

        # Info labels 行
        info_row = layout.row(align=True)
        split_info = info_row.split(factor=0.5)

        # 检查条件
        has_text = bool(context.scene.text_prompt)
        has_image = any(
            getattr(context.scene.multi_view_props, view).show_preview
            and getattr(context.scene.multi_view_props, view).ma_preview_image
            for view in ["front_view", "back_view", "left_view", "right_view"]
        )

        # Text to Model 的 info
        info_col1 = split_info.column()
        if not has_text:
            info_col1.label(text="You need to set input text", icon="INFO")

        # Image to Model 的 info
        info_col2 = split_info.column()
        if not has_image:
            info_col2.label(text="You need to set input image", icon="INFO")

        # Operators 行
        row = layout.row(align=True)
        split0 = row.split(factor=0.5)

        # Text to Model operator
        column1 = split0.column()
        column1.scale_y = 1.8  # 增加按钮高度
        column1.enabled = has_text  # 根据条件设置是否可用
        column1.operator(
            operators.MESH_ARTIFICER_text_to_model.bl_idname,
            text="Text to Model",
            icon="FILE_TEXT",
        )

        # Image to Model operator
        column2 = split0.column()
        column2.scale_y = 1.8  # 增加按钮高度
        column2.enabled = has_image  # 根据条件设置是否可用
        column2.operator(
            operators.MESH_ARTIFICER_image_to_model.bl_idname,
            text="Image to Model",
            icon="OUTLINER_OB_IMAGE",
        )


class VIEW3D_PT_POST_PROCESS_Panel(bpy.types.Panel):
    bl_idname = Config.panel_prefix + "VIEW3D_PT_POST_PROCESS_Panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_label = "Post Process"
    bl_category = EXT_CATEGORY
    bl_order = 3

    def draw(self, context):
        layout = self.layout
        scn = context.scene

        row1 = layout.row()
        split = row1.split(factor=0.5)
        split.operator(operators.MESH_ARTIFICER_texture_generate.bl_idname, icon="NODE_MATERIAL")
        split.operator(operators.MESH_ARTIFICER_stylize_model.bl_idname, icon="FILE_VOLUME")

        row2 = layout.row()
        split = row2.split(factor=0.5)
        split.operator(operators.MESH_ARTIFICER_convert_model.bl_idname, icon="MOD_DECIM")
        split.operator(operators.MESH_ARTIFICER_rig_model.bl_idname, icon="OUTLINER_DATA_ARMATURE")

        post_process_box = layout.box()
        row = post_process_box.row()
        row.prop(
            scn,
            "show_post_process_module",
            icon="HIDE_OFF" if scn.show_post_process_module else "HIDE_ON",
            text="Advanced Settings",
            emboss=False,
        )
        if scn.show_post_process_module:
            row = post_process_box.row()
            row.prop(scn, "texture_alignment_ui", text="Alignment")
            row.prop(scn, "texture_quality_ui", text="Quality")
            post_process_box.prop(scn, "pp_style_ui", text="Style")
            row = post_process_box.row()
            row.prop(scn, "quad_ui", text="Quad")
            row.prop(scn, "symmetry_ui", text="Symmetry")
            row.prop(scn, "face_limit_ui", text="Face Limit")
            # row = post_process_box.row()
            # row.operator(operators.MESH_ARTIFICER_rig_check.bl_idname)
