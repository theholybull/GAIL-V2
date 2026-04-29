import logging

import bpy

from ...config import Config

logger = logging.getLogger("animoxtend")


class OBJECT_OT_OpenAddonsPreferences(bpy.types.Operator):
    """Operator to open preferences."""

    bl_idname = "animoxtend.open_addons_preferences"
    bl_label = "Open Addon Preferences"
    bl_description = "Open AnimoXtend preferences"

    def execute(self, context):
        bpy.ops.screen.userpref_show("INVOKE_DEFAULT")  # type: ignore
        bpy.context.preferences.active_section = "ADDONS"
        bpy.data.window_managers["WinMan"].addon_search = Config.name
        return {"FINISHED"}


class OBJECT_OT_OpenBlenderPreferences(bpy.types.Operator):
    """Operator to open preferences."""

    bl_idname = "animoxtend.open_blender_preferences"
    bl_label = "Open Blender Preferences"
    bl_description = "Open Blender preferences"

    def execute(self, context):
        bpy.ops.screen.userpref_show("INVOKE_DEFAULT")  # type: ignore
        # TODO: Find a way to open Blender preferences
        bpy.context.preferences.active_section = "ADDONS"
        return {"FINISHED"}
