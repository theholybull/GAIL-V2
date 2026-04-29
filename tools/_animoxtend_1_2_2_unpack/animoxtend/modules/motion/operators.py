"""
Operators and functions to handle the addon functionality.
"""

import threading
from typing import Optional

import bpy
import bpy.types

from .face_functions.face_utils import audio2face, face_anim_import, refresh_model_list
from .motion_functions.motion_utils import download_motion, text2motion
from .pipeline_functions.buffer_human_utils import (
    add_buffer_human,
    auto_driver,
    check_active_armature_object,
    check_active_mesh_object,
    setup_template_collection,
)


class OBJECT_OT_ADD_HUMAN(bpy.types.Operator):
    bl_idname = "object.add_buffer_human"
    bl_label = "ADDHUMAN"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        armature, body = add_buffer_human(self, context)
        context.scene.buffer_armature = armature
        context.scene.buffer_body = body
        return {"FINISHED"}


class OBJECT_OT_AUTO_DRIVER(bpy.types.Operator):
    bl_idname = "object.auto_driver"
    bl_label = "AUTODRIVER"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        buffer_skeleton = context.scene.buffer_armature
        buffer_body = context.scene.buffer_body
        auto_driver(buffer_skeleton, buffer_body)
        return {"FINISHED"}


class OBJECT_OT_IMPORT_FACEANIM(bpy.types.Operator):
    bl_idname = "object.import_face_anim"
    bl_label = "IMPORTFACEANIM"
    bl_options = {"REGISTER", "UNDO"}
    bl_description = "Set .npz face animation to your character"

    def execute(self, context):
        face_anim_import(context)
        return {"FINISHED"}


class OBJECT_OT_REFRESHFACEMODEL(bpy.types.Operator):
    bl_idname = "object.refresh_face_model"
    bl_label = "Refresh face model list"
    bl_description = "Refresh face model list from server"

    def execute(self, context):
        refresh_model_list(self, context)
        return {"FINISHED"}


class OBJECT_OT_AUDIO_TO_FACE(bpy.types.Operator):
    bl_idname = "object.audio2face"
    bl_label = "AUDIOTOFACE"
    bl_options = {"REGISTER", "UNDO"}
    bl_description = "Generate mpz animation file from audio"

    def execute(self, context):
        audio2face(context)
        return {"FINISHED"}


class OBJECT_OT_GENERATE_FACE(bpy.types.Operator):
    bl_idname = "object.generate_face"
    bl_label = "GENERATEFACE"
    bl_options = {"REGISTER", "UNDO"}
    bl_description = "Generate face animation from audio, then set to your character"

    def execute(self, context):
        # 保存当前状态
        original_mode = None
        original_active = context.active_object
        original_selected = [obj for obj in context.selected_objects]

        if original_active:
            original_mode = original_active.mode
            # 如果不在 OBJECT 模式，切换到 OBJECT 模式
            if original_mode != "OBJECT":
                # 直接使用 select_set 而不是 operator
                for obj in context.selected_objects:
                    obj.select_set(False)
                original_active.select_set(True)
                context.view_layer.objects.active = original_active
                bpy.ops.object.mode_set(mode="OBJECT")

        try:
            # 原有的操作逻辑
            if context.scene.buffer_body is None:
                valid_mesh = check_active_mesh_object(context)
                if valid_mesh:
                    context.scene.buffer_body = valid_mesh
                    if valid_mesh.name != "BufferBody":
                        template_collection = bpy.data.collections.get("Template")
                        template_collection.hide_viewport = True
                        template_collection.hide_render = True
                else:
                    buffer_armature, buffer_body, buffer_eye = setup_template_collection(self, context)
                    context.scene.buffer_body = buffer_body
            audio2face(context)
            face_anim_import(context)

        finally:
            # 恢复原来的状态
            if original_mode and original_mode != "OBJECT":
                # 直接使用 select_set 而不是 operator
                for obj in context.selected_objects:
                    obj.select_set(False)
                for obj in original_selected:
                    obj.select_set(True)
                # 恢复活动对象
                if original_active:
                    context.view_layer.objects.active = original_active
                    # 恢复原来的模式
                    bpy.ops.object.mode_set(mode=original_mode)

        return {"FINISHED"}


class OBJECT_OT_MotionCustomEyedropper(bpy.types.Operator):
    """Custom Eyedropper to select an armature object"""

    bl_idname = "object.motion_custom_eyedropper"
    bl_label = "Motion Custom Eyedropper"
    bl_description = "Select an object"

    action: bpy.props.EnumProperty(
        items=(
            ("armature", "armature", ""),
            ("body", "body", ""),
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

            bpy.context.view_layer.objects.active = None
            # Use view3d.select operator to select object under cursor
            bpy.ops.view3d.select(extend=False, deselect=True, location=coord)

            # Check if selected object is an armature
            active_obj = context.active_object
            if active_obj:
                if self.action == "armature":
                    context.scene.buffer_armature = active_obj
                    context.scene.buffer_armature_name = active_obj.name
                elif self.action == "body":
                    context.scene.buffer_body = active_obj
                    context.scene.buffer_body_name = active_obj.name
                self.report({"INFO"}, f"Selected object: {active_obj.name}")
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
            if self.action == "armature":
                context.scene.buffer_armature = active_object
                context.scene.buffer_armature_name = active_object.name
            elif self.action == "body":
                context.scene.buffer_body = active_object
                context.scene.buffer_body_name = active_object.name
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


class OBJECT_OT_TEXT_TO_MOTION(bpy.types.Operator):
    bl_idname = "object.text2motion"
    bl_label = "TEXTTOMOTION"
    bl_options = {"REGISTER"}
    bl_description = "Search motion with Keyword"

    _timer = None
    _thread = None
    _running = False
    _finished = False
    _result = None
    _error = None
    # 新增：用于存储动作列表
    _motion_list: tuple[Optional[list[str]], Optional[list[str]]] | None = None

    def modal(self, context, event):
        if event.type == "TIMER":
            if not self._thread.is_alive():
                if self._error:
                    self.report({"ERROR"}, str(self._error))
                    self.cancel(context)
                    return {"CANCELLED"}

                if self._finished and self._motion_list is not None:
                    # 在主线程中更新数据
                    try:
                        annotation_list, motion_url_list = self._motion_list
                        if annotation_list is not None:
                            context.scene["t2m_annotation_list"] = annotation_list
                            context.scene["t2m_url_list"] = motion_url_list
                            context.scene.motion_ui.motion_ui_list = "motion_0"  # 重置选择
                    except Exception as e:
                        self.report({"ERROR"}, f"Failed to update motion list: {str(e)}")

                    self.cancel(context)
                    return {"FINISHED"}

            context.area.tag_redraw()

        return {"PASS_THROUGH"}

    def execute(self, context):
        # 添加计时器
        wm = context.window_manager
        self._timer = wm.event_timer_add(0.1, window=context.window)
        wm.modal_handler_add(self)

        # 启动线程
        self._thread = threading.Thread(target=self.background_task, args=(context,))
        self._thread.start()

        return {"RUNNING_MODAL"}

    def background_task(self, context):
        try:
            self._running = True
            # 修改 text2motion 函数，让它返回动作列表而不是直接设置
            self._motion_list = text2motion(self, context)
            self._finished = True
        except Exception as e:
            self._error = str(e)
        finally:
            self._running = False

    def cancel(self, context):
        if self._timer:
            wm = context.window_manager
            wm.event_timer_remove(self._timer)
        return {"CANCELLED"}


class OBJECT_OT_DOWNLOAD_MOTION(bpy.types.Operator):
    bl_idname = "object.download_motion"
    bl_label = "DOWNLOADMOTION"
    bl_options = {"REGISTER", "UNDO"}
    bl_description = "Set motion to your character"

    def execute(self, context):
        # 保存当前状态
        original_mode = None
        original_active = context.active_object
        original_selected = [obj for obj in context.selected_objects]

        if original_active:
            original_mode = original_active.mode
            # 如果不在 OBJECT 模式，切换到 OBJECT 模式
            if original_mode != "OBJECT":
                bpy.ops.object.mode_set(mode="OBJECT")

        try:
            # 原有的操作逻辑
            if context.scene.buffer_armature is None:
                valid_armature = check_active_armature_object(context)
                if valid_armature:
                    context.scene.buffer_armature = valid_armature
                else:
                    buffer_armature, buffer_body, buffer_eye = setup_template_collection(self, context)
                    context.scene.buffer_armature = buffer_armature
            download_motion(self, context)

        finally:
            # 恢复原来的状态
            # 1. 首先取消所有选择
            for obj in context.selected_objects:
                obj.select_set(False)

            # 2. 重新选择原来选中的对象
            for obj in original_selected:
                obj.select_set(True)

            # 3. 设置活动对象
            if original_active:
                context.view_layer.objects.active = original_active

            # 4. 最后恢复模式
            if original_mode and original_mode != "OBJECT":
                bpy.ops.object.mode_set(mode=original_mode)

        return {"FINISHED"}


class WM_OT_CustomObjectPicker(bpy.types.Operator):
    bl_idname = "wm.custom_object_picker"
    bl_label = "Pick Object"
    bl_options = {"REGISTER", "UNDO"}

    # 定义属性来存储目标数据路径
    data_path: bpy.props.StringProperty()

    def invoke(self, context, event):
        # 检查是否已有选中的合适对象
        if context.active_object and context.active_object.type == "ARMATURE" and context.active_object.select_get():
            # 直接设置属性
            exec(f"context.scene.{self.data_path} = context.active_object")
            return {"FINISHED"}
        else:
            # 进入标准吸管模式
            context.window_manager.modal_handler_add(self)
            return {"RUNNING_MODAL"}

    def modal(self, context, event):
        if event.type == "LEFTMOUSE":
            if event.value == "PRESS":
                # 检查鼠标下的对象
                if context.active_object and context.active_object.type == "ARMATURE":
                    exec(f"context.scene.{self.data_path} = context.active_object")
                    return {"FINISHED"}
        elif event.type in {"RIGHTMOUSE", "ESC"}:
            return {"CANCELLED"}

        return {"RUNNING_MODAL"}


class OBJECT_OT_MotionCustomToggle(bpy.types.Operator):
    bl_idname = "object.motion_custom_toggle"
    bl_label = "Motion Toggle"
    bl_description = "Toggle motion state"

    def execute(self, context):
        context.scene.motion_toggle_state = not context.scene.motion_toggle_state
        return {"FINISHED"}
