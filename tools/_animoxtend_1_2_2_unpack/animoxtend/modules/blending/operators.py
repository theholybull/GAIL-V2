"""
Operators to handle the addon functionality.
"""

import bpy
from bpy.types import Context

from ...preferences import get_preferences
from ...utils.http import XClient
from ..retarget.retarget_functions.guard import GuardianMixin
from .blending_functions.operator_funcs import (
    KEYFRAMES_BACKUP,
    MotionBlend,
    MotionInbetween,
    motion_blend_reset,
    motion_inbetween_reset,
)


class OBJECT_OT_motion_blend(bpy.types.Operator, GuardianMixin):
    bl_idname = "object.motion_blend"
    bl_label = "Blend Armatures"
    bl_description = "Motion blending between two armatures"

    @classmethod
    def poll(cls, context: Context) -> bool:
        if XClient.check_online_access() is False:
            return False

        cls.api_key = get_api_key(context)
        cls.server_host = get_server_host(context)
        if not cls.is_authenticated():
            return False

        armature1 = getattr(context.scene, 'armature1')
        armature2 = getattr(context.scene, 'armature2')
        if armature1 and armature1.type == 'ARMATURE' and armature2 and armature2.type == 'ARMATURE':
            return True
        return False

    def execute(self, context):
        executer = MotionBlend(self, context)
        executer()
        return {'FINISHED'}


class OBJECT_OT_motion_blend_reset(bpy.types.Operator):
    bl_idname = "object.motion_blend_reset"
    bl_label = "Rest Armature"
    bl_description = "Rest Armature with storaged motion"

    @classmethod
    def poll(cls, context: Context) -> bool:
        armature1 = getattr(context.scene, 'armature1')
        armature2 = getattr(context.scene, 'armature2')
        if (
            armature1
            and armature1.type == 'ARMATURE'
            and armature2
            and armature2.type == 'ARMATURE'
            and armature1.name in KEYFRAMES_BACKUP
            and KEYFRAMES_BACKUP[armature1.name] is not None
        ):
            return True
        return False

    def execute(self, context):
        motion_blend_reset(self, context)
        return {'FINISHED'}


class OBJECT_OT_motion_inbetween(bpy.types.Operator, GuardianMixin):
    bl_idname = "object.motion_inbetween"
    bl_label = "Motion Inbetween"
    bl_description = "Motion Inbetween"

    armature_name: bpy.props.StringProperty()  # type: ignore # 用来指定操作哪个 armature

    @classmethod
    def poll(cls, context: Context) -> bool:
        if XClient.check_online_access() is False:
            return False

        cls.api_key = get_api_key(context)
        cls.server_host = get_server_host(context)
        if not cls.is_authenticated():
            return False

        armature = getattr(context.scene, 'armature_inbetween')
        return bool(armature)

    def execute(self, context):
        inbetweener = MotionInbetween(self, context)
        inbetweener()
        return {'FINISHED'}


class OBJECT_OT_motion_inbetween_reset(bpy.types.Operator):
    bl_idname = "object.motion_inbetween_reset"
    bl_label = "Inbetween Reset"
    bl_description = "Inbetween Reset"

    @classmethod
    def poll(cls, context: Context) -> bool:
        if not XClient.check_online_access():
            return False

        armature = context.scene.armature_inbetween
        if armature is None:
            return False

        inbetween_pre_mode = context.scene.inbetween_pre_mode
        nla_new_track_name = context.scene.nla_new_track_name

        if inbetween_pre_mode is None:
            return False

        if inbetween_pre_mode == 'KFRAMES':
            return armature.name in KEYFRAMES_BACKUP and KEYFRAMES_BACKUP[armature.name] is not None

        if inbetween_pre_mode == 'NLA':
            if nla_new_track_name is None:
                return False

        return True

    def execute(self, context: Context):
        motion_inbetween_reset(self, context)
        return {'FINISHED'}


class OBJECT_OT_BlendingCustomEyedropper(bpy.types.Operator):
    """Custom Eyedropper to select an armature object"""

    bl_idname = "object.blend_custom_eyedropper"
    bl_label = "Blend Custom Eyedropper"
    bl_description = "Select an object"

    action: bpy.props.EnumProperty(
        items=(
            ("armature1", "armature1", ""),  # 添加 armature1
            ("armature2", "armature2", ""),
            ("armature_inbetween", "armature_inbetween", ""),
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
                if self.action == "armature1":
                    context.scene.armature1_name = active_obj.name
                    context.scene.armature1 = active_obj
                elif self.action == "armature2":
                    context.scene.armature2_name = active_obj.name
                    context.scene.armature2 = active_obj
                elif self.action == "armature_inbetween":
                    context.scene.armature_inbetween_name = active_obj.name
                    context.scene.armature_inbetween = active_obj
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
            if self.action == "armature1":
                context.scene.armature1_name = active_object.name
                context.scene.armature1 = active_object
            elif self.action == "armature2":
                context.scene.armature2_name = active_object.name
                context.scene.armature2 = active_object
            elif self.action == "armature_inbetween":
                context.scene.armature_inbetween_name = active_object.name
                context.scene.armature_inbetween = active_object
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
