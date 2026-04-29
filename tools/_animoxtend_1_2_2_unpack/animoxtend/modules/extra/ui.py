import bpy

from ...config import Config
from ...preferences import (
    OBJECT_OT_CheckForUpdates,
    OBJECT_OT_GetAddon,
    OBJECT_OT_OpenHomepage,
    OBJECT_OT_ValidateAPIKey,
    get_preferences,
)
from ...utils.bpy_tools import get_addon_version_str, get_prop, is_zh
from ...utils.http import XClient
from ...utils.tools import compare_versions_str
from ..retarget.operators import get_api_key
from . import operators
from .constants import ExtraPropertyEnum

LABEL = "Hints"


class ANIMOXTEND_PT_AnimateHintsPanel(bpy.types.Panel):
    """Animoxtend AX_Animate Hints Panel."""

    bl_label = LABEL
    bl_idname = Config.panel_prefix + "ANIMOXTEND_Animate_Hints_Panel"
    bl_options = set()
    bl_category = "AX_Animate"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_order = 0  # make sure it's the first panel

    # custom properties
    api_key = ""

    def draw(self, context: 'bpy.types.Context') -> None:
        layout = self.layout
        _draw(layout, context)


class ANIMOXTEND_PT_CreateHintsPanel(bpy.types.Panel):
    """Animoxtend AX Create Hints Panel."""

    bl_label = LABEL
    bl_idname = Config.panel_prefix + "ANIMOXTEND_Create_Hints_Panel"
    bl_options = set()
    bl_category = "AX Create"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_order = 0  # make sure it's the first panel

    # custom properties
    api_key = ""

    def draw(self, context: 'bpy.types.Context'):
        layout = self.layout
        _draw(layout, context)


def _draw(layout: "bpy.types.UILayout", context: "bpy.types.Context") -> None:
    _draw_self_check(layout, context)
    _draw_system_info(layout, context)


def _draw_self_check(layout: "bpy.types.UILayout", context: "bpy.types.Context") -> None:
    col = layout.column(align=True)
    if not XClient.check_online_access():
        # show offline message and offer to open preferences
        if is_zh():
            t1 = "没有网络连接!"
            t2 = "请在“偏好设置”、“系统”中开启“允许联机访问”。"
            o1 = "打开偏好设置"
        else:
            t1 = "No internet connection!"
            t2 = "Please turn on blender online access."
            o1 = "Open Preferences"
        col.label(text=t1, icon="ERROR")
        col.label(text=t2, icon="ERROR")
        col.separator()
        col.operator(operators.OBJECT_OT_OpenBlenderPreferences.bl_idname, text=o1)
        return

    if not get_api_key(context):
        # show api key not set message and offer to open preferences
        if is_zh():
            t1 = "未设置API Key!"
            t2 = "请在插件偏好设置中添加API Key。"
            o1 = "打开偏好设置"
            o2 = "申请API Key"
        else:
            t1 = "API Key is not set!"
            t2 = "Open the addon preferences to enter your API Key."
            o1 = "Open Preferences"
            o2 = "Apply for API Key"
        col.label(text=t1, icon="ERROR")
        col.label(text=t2, icon="ERROR")
        col.separator()
        col.operator(operators.OBJECT_OT_OpenAddonsPreferences.bl_idname, text=o1)
        col.operator(OBJECT_OT_OpenHomepage.bl_idname, text=o2)
        return

    pref = get_preferences(context)
    if pref.api_key_valid == "UNKNOWN":
        # Hasn't been validated
        if is_zh():
            t1 = "API Key尚未验证。"
            o1 = "验证API Key"
        else:
            t1 = "API Key hasn't been validated yet."
            o1 = "Validate API Key"
        col.label(text=t1, icon="USER")
        col.operator(OBJECT_OT_ValidateAPIKey.bl_idname, text=o1)
        return
    elif pref.api_key_valid == "INVALID":
        # Invalid API Key
        if is_zh():
            t1 = "API Key无效!"
            t2 = "请在插件偏好设置中修改API Key。"
            o1 = "打开偏好设置"
            o2 = "验证API Key"
        else:
            t1 = "API Key is invalid!"
            t2 = "Open the addon preferences to modify your API Key."
            o1 = "Open Preferences"
            o2 = "Validate API Key"
        col.label(text=t1, icon="ERROR")
        col.label(text=t2, icon="ERROR")
        col.separator()
        col.operator(operators.OBJECT_OT_OpenAddonsPreferences.bl_idname, text=o1)
        col.operator(OBJECT_OT_ValidateAPIKey.bl_idname, text=o2)
        return

    # All good
    if is_zh():
        t1 = "一切正常。"
    else:
        t1 = "Every thing goes well."
    # col.label(text=t1, icon="CHECKBOX_HLT")


def _draw_system_info(layout: "bpy.types.UILayout", context: "bpy.types.Context"):
    vers_ = get_addon_version_str()
    t1 = f'AnimoXtend v{vers_}'

    row1 = layout.row(align=True)
    row2 = layout.row(align=True)

    col11 = row1.column(align=True)
    col11.label(text=t1)

    latest_version = get_prop(ExtraPropertyEnum.animoxtend_extra_latest_version, context=context)
    if is_zh():
        o1 = "检查更新"
        o2 = "获取新版插件"
    else:
        o1 = "Check Updates"
        o2 = "Get the Latest Addon"
    if latest_version:
        compared = compare_versions_str(get_addon_version_str(), latest_version)
        if compared is None:
            t1 = "未获取到新版本" if is_zh() else "Failed to get newest version"
            col12 = row1.column(align=True)
            col12.label(text=t1, icon="ERROR")
            row2.operator(OBJECT_OT_CheckForUpdates.bl_idname, text=o1)
        elif compared >= 0:
            t1 = "已是最新版本" if is_zh() else "Already the latest version"
            col12 = row1.column(align=True)
            col12.label(text=t1, icon="CHECKBOX_HLT")
            row2.operator(OBJECT_OT_CheckForUpdates.bl_idname, text=o1)
        else:
            t1 = f"更新可用（{latest_version}）" if is_zh() else f"Updates Available ({latest_version})"
            col12 = row1.column(align=True)
            col12.label(text=t1, icon="ERROR")
            if get_prop(ExtraPropertyEnum.animoxtend_extra_download_url, context=context):
                row2.operator(OBJECT_OT_GetAddon.bl_idname, text=o2, icon="LINKED")
            else:
                row2.operator(OBJECT_OT_CheckForUpdates.bl_idname, text=o1)
    else:
        row2.operator(OBJECT_OT_CheckForUpdates.bl_idname, text=o1)
    return
