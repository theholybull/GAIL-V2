"""
This file contains the UI panels and interface elements for the blending module.
"""

import bpy

from ...config import Config
from ...preferences import get_preferences
from . import operators

EXT_CATEGORY = "AX Create"


class ANIMOXTEND_PT_ExampleHelloWorldPanel(bpy.types.Panel):
    bl_idname = Config.panel_prefix + "ExampleHelloWorldPanel"
    bl_label = "Example Panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = EXT_CATEGORY

    @classmethod
    def poll(cls, context):
        """Only show this panel when the AddonPreferences.debug is True."""
        prefs = get_preferences()
        return bool(getattr(prefs, "debug", False))

    def draw(self, context):
        layout = self.layout
        col = layout.column(align=True)
        col.operator(operators.OBJECT_OT_ExampleHelloWorld.bl_idname)
        col.prop(
            bpy.context.scene,
            "animoxtend_example_name",
        )

        col.separator()
        if not operators.OBJECT_OT_ExampleRequest.poll(context):
            col.label(
                text='Please enable network access',
                icon="INFO",
            )
            # col.label(text="Edit->Preferences->System->Network->Allow Network Access", icon="INFO")
        col.operator(
            operators.OBJECT_OT_ExampleRequest.bl_idname,
        )

        col.separator()
        col.operator(operators.OBJECT_OT_ExampleUsePreferences.bl_idname)

        col.separator()
        col.operator(
            operators.OBJECT_OT_ExampleOpenPreferences.bl_idname,
            icon="PREFERENCES",
        )
