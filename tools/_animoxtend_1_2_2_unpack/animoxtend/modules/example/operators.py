"""
Operators to handle the addon functionality.
"""

import logging

import bpy
import bpy.types

from ...preferences import get_preferences
from ...utils.http import OfflineError, XClient

logger = logging.getLogger("animoxtend")


class OBJECT_OT_ExampleHelloWorld(bpy.types.Operator):
    """Operator to print a message to the console."""

    bl_idname = "animoxtend.example_hello_world"
    bl_label = "Hello World"
    bl_description = 'Output "Hello World" message to the console'

    def execute(self, context):
        name = bpy.context.scene.animoxtend_example_name
        msg = f"Hello {name}!"
        # show a message
        self.report({"INFO"}, msg)
        logger.info(msg)
        return {"FINISHED"}


class OBJECT_OT_ExampleRequest(bpy.types.Operator):
    """Operator to make a http request."""

    bl_idname = "animoxtend.example_request"
    bl_label = "HTTP Request"
    bl_description = "Make a http request"

    @classmethod
    def poll(cls, context):
        return XClient.check_online_access()

    def execute(self, context):
        try:
            client = XClient(
                base_url="https://www.baidu.com",
            )
        except OfflineError:
            self.report({"ERROR"}, "AnimoXtend is in offline mode.")
            return {"CANCELLED"}

        r = client.get("/")
        msg = f"Got response: {r.text}"
        # show a message
        self.report({"INFO"}, msg)
        logger.info(msg)
        return {"FINISHED"}


class OBJECT_OT_ExampleUsePreferences(bpy.types.Operator):
    """Operator to use preferences."""

    bl_idname = "animoxtend.example_use_preferences"
    bl_label = "Use Preferences"
    bl_description = "Use preferences"

    def execute(self, context):
        preferences = get_preferences()
        msg = f"preferences API Key: {preferences.api_key}"
        # show a message
        self.report({"INFO"}, msg)
        logger.info(msg)
        return {"FINISHED"}


class OBJECT_OT_ExampleOpenPreferences(bpy.types.Operator):
    """Operator to open preferences."""

    bl_idname = "animoxtend.example_open_preferences"
    bl_label = "AnimoXtend Preferences"
    bl_description = "Open AnimoXtend preferences"

    def execute(self, context):
        from ...config import Config

        bpy.ops.screen.userpref_show("INVOKE_DEFAULT")  # type: ignore
        bpy.context.preferences.active_section = "ADDONS"
        bpy.data.window_managers["WinMan"].addon_search = Config.name
        return {"FINISHED"}
