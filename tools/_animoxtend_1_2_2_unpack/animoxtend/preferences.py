import functools
import json
import logging
import webbrowser

import bpy

from .config import Config
from .modules.retarget.retarget_functions.guard import GuardianMixin
from .utils.bpy_tools import get_addon_version_str, get_prop, is_zh, set_prop
from .utils.http import XClient
from .utils.tools import compare_versions_str

logger = logging.getLogger("animoxtend")


class AnimoXtend_AddonPreferences(bpy.types.AddonPreferences):
    bl_idname = Config.get_addon_bl_name()

    server_host: bpy.props.StringProperty(
        name="Server Host",
        description="Server Host",
        default="",
    )
    api_key: bpy.props.StringProperty(
        name="API Key",
        description="API Key",
        default="",
    )
    api_key_valid: bpy.props.EnumProperty(
        name="API Key Valid",
        description="API Key Valid",
        items=[("VALID", "Valid", "Valid"), ("INVALID", "Invalid", "Invalid"), ("UNKNOWN", "Unknown", "Unknown")],
        default="UNKNOWN",
    )
    # debug: bpy.props.BoolProperty(
    #     name="Debug",
    #     description="Debug",
    #     default=False,
    # )

    tripo_api_key: bpy.props.StringProperty(
        name="Tripo API Key",
        description="The API key for the Tripo API",
        default="",
    )

    def draw(self, context):
        self._draw_api_key_check(context)
        self._draw_version_check(context)
        self._draw_links(context)

    def _draw_api_key_check(self, context):
        col = self.layout.column(align=True)
        if not self.api_key:
            if is_zh():
                h1 = "必须设置API Key才能使用AnimoXtend"
                o2 = "申请API Key"
            else:
                h1 = "API Key is required to use AnimoXtend"
                o2 = "Apply for API Key"
            row = col.row()
            row.label(text=h1, icon="ERROR")
            row.operator(OBJECT_OT_OpenHomepage.bl_idname, text=o2, icon="KEY_HLT")
            col.prop(self, "api_key")
        else:
            if self.api_key_valid == "UNKNOWN":
                if is_zh():
                    h1 = "API Key 尚未验证"
                    o2 = "验证API Key"
                else:
                    h1 = "API Key hasn't been validated yet"
                    o2 = "Validate API Key"
                col.prop(self, "api_key")
                col.separator()
                row = col.row()
                row.label(text=h1, icon="ERROR")
                row.operator(OBJECT_OT_ValidateAPIKey.bl_idname, text=o2, icon="RESTRICT_SELECT_OFF")
            elif self.api_key_valid == "INVALID":
                if is_zh():
                    h1 = "API Key 验证失败"
                    o2 = "重新验证"
                else:
                    h1 = "API Key validation failed"
                    o2 = "Revalidate"
                col.prop(self, "api_key")
                col.separator()
                row = col.row()
                row.label(text=h1, icon="ERROR")
                row.operator(OBJECT_OT_ValidateAPIKey.bl_idname, text=o2, icon="RESTRICT_SELECT_OFF")
            else:
                if is_zh():
                    h1 = "验证成功"
                    o2 = "重新验证"
                else:
                    h1 = "Key is Valid"
                    o2 = "Revalidate"
                col.prop(self, "api_key")
                col.separator()
                row = col.row()
                row.label(text=h1, icon="CHECKBOX_HLT")
                row.operator(OBJECT_OT_ValidateAPIKey.bl_idname, text=o2, icon="RESTRICT_SELECT_OFF")
        col.separator()

    def _draw_version_check(self, context: "bpy.types.Context"):
        from .modules.extra.constants import ExtraPropertyEnum

        col = self.layout.column(align=True)
        latest_version = get_prop(ExtraPropertyEnum.animoxtend_extra_latest_version, context=context)
        if is_zh():
            o1 = "检查更新"
            o2 = "获取新版插件"
        else:
            o1 = "Check for Updates"
            o2 = "Get the Latest Addon"
        if latest_version:
            compared = compare_versions_str(get_addon_version_str(), latest_version)
            if compared is None:
                t1 = "未获取到新版本" if is_zh() else "Failed to get newest version"
                col.operator(OBJECT_OT_CheckForUpdates.bl_idname, text=o1)
                col.label(text=t1, icon="QUESTION")
            elif compared >= 0:
                t1 = "已是最新版本" if is_zh() else "Already the latest version"
                col.operator(OBJECT_OT_CheckForUpdates.bl_idname, text=o1)
                col.label(text=t1, icon="CHECKBOX_HLT")
            else:
                t1 = f"更新可用（{latest_version}）" if is_zh() else f"Updates Available ({latest_version})"
                if get_prop(ExtraPropertyEnum.animoxtend_extra_download_url, context=context):
                    col.operator(OBJECT_OT_GetAddon.bl_idname, text=o2, icon="LINKED")
                else:
                    col.operator(OBJECT_OT_CheckForUpdates.bl_idname, text=o1)
                col.label(text=t1, icon="ERROR")
        else:
            col.operator(OBJECT_OT_CheckForUpdates.bl_idname, text=o1)
        col.separator()

    def _draw_links(self, context):
        col = self.layout.column(align=True)
        col.label(text="Links", icon="ADD")
        col.separator()
        if is_zh():
            o1 = "快速开始"
            # o2 = "加入 Discord"
        else:
            o1 = "Get Started"
            # o2 = "Join Discord"
        col.operator(OBJECT_OT_GetStarted.bl_idname, text=o1, icon="DOCUMENTS")
        col.separator()
        # col.operator(OBJECT_OT_OpenDiscord.bl_idname, text=o2)
        # col.separator()


def get_preferences(context: 'bpy.types.Context | None' = None) -> "AnimoXtend_AddonPreferences":
    try:
        addon = _get_addon()
    except RuntimeError:
        return {}
    preferences: "AnimoXtend_AddonPreferences" = addon.preferences  # type: ignore
    return preferences


@functools.lru_cache(maxsize=1)
def _get_addon():
    addon_name = Config.get_addon_bl_name()
    context = bpy.context
    assert context
    addon = context.preferences.addons[addon_name]
    if not addon:
        raise RuntimeError(f"Addon {addon_name} not found")
    return addon


#################
# Operators
#################
class OBJECT_OT_ValidateAPIKey(bpy.types.Operator):
    """Operator to validate API Key."""

    bl_idname = "animoxtend.validate_api_key"
    bl_label = "Validate API Key"
    bl_description = "Validate API Key"

    def execute(self, context):
        api_key_valid = None
        pref = get_preferences(context)
        api_key = pref.api_key
        server_host = pref.server_host
        if GuardianMixin.is_authenticated(api_key, server_host, validate=False):
            api_key_valid = GuardianMixin.is_authenticated(api_key, server_host, validate=True)
        else:
            api_key_valid = False
        if api_key_valid is None:
            pref.api_key_valid = "UNKNOWN"
        elif api_key_valid:
            pref.api_key_valid = "VALID"
        else:
            pref.api_key_valid = "INVALID"
        return {"FINISHED"}


class OBJECT_OT_OpenHomepage(bpy.types.Operator):
    """Operator to jump to animoxtend homepage"""

    bl_idname = "animoxtend.open_homepage"
    bl_label = "Open Homepage"
    bl_description = "Open animoxtend homepage"

    def execute(self, context):
        homepage_url = Config.get_addon_homepage()
        if not bpy.app.translations.locale.startswith("zh_HAN"):
            homepage_url = homepage_url.rstrip("/") + "/en/"
        webbrowser.open(homepage_url)
        return {'FINISHED'}


class OBJECT_OT_GetStarted(bpy.types.Operator):
    """Operator to get started with animoxtend"""

    bl_idname = "animoxtend.get_started"
    bl_label = "Get Started"
    bl_description = "Get started with animoxtend"

    def execute(self, context):
        homepage_url = Config.get_addon_homepage()
        if not bpy.app.translations.locale.startswith("zh_HAN"):
            url = homepage_url.rstrip("/") + "/en/_get-started"
        else:
            url = homepage_url.rstrip("/") + "/zh/_get-started"
        webbrowser.open(url)
        return {'FINISHED'}


class OBJECT_OT_CheckForUpdates(bpy.types.Operator):
    """Operator to check updates."""

    bl_idname = "animoxtend.check_for_updates"
    bl_label = "Check Updates"
    bl_description = "Check for updates of AnimoXtend"

    def execute(self, context):
        from .modules.extra.constants import ExtraPropertyEnum

        homepage_url = Config.get_addon_homepage()
        # Get latest version
        latest_version = ""
        try:
            resp = XClient('').get(f"{homepage_url}/plugin_version.txt", verify=True)
            resp.raise_for_status()
        except Exception:
            logger.exception("Failed to check for updates.")
            return {'CANCELLED'}
        if resp.status_code == 200:
            txt = resp.text
            if txt:
                versions = txt.splitlines()
                versions.reverse()
                for v in versions:
                    if v:
                        latest_version = v
                        break
        # Get addon download link
        try:
            resp = XClient('').get(f"{homepage_url}/addon_info.json", verify=True)
            resp.raise_for_status()
        except Exception:
            logger.exception("Failed to get addon_info.json")
            return {'CANCELLED'}
        info = {}
        if resp.status_code == 200:
            txt = resp.text
            info = json.loads(txt)
        download_url = info.get("download_url", "")

        # Set latest version
        if get_prop(ExtraPropertyEnum.animoxtend_extra_latest_version, context=context) != latest_version:
            set_prop(ExtraPropertyEnum.animoxtend_extra_latest_version, latest_version, context=context)
        # Set download URL
        if get_prop(ExtraPropertyEnum.animoxtend_extra_download_url, context=context) != download_url:
            set_prop(ExtraPropertyEnum.animoxtend_extra_download_url, download_url, context=context)
        return {'FINISHED'}


class OBJECT_OT_GetAddon(bpy.types.Operator):
    """Operator to get addon."""

    bl_idname = "animoxtend.get_addon"
    bl_label = "Get Addon"
    bl_description = "Get AnimoXtend addon"

    def execute(self, context):
        from .modules.extra.constants import ExtraPropertyEnum

        download_url = get_prop(ExtraPropertyEnum.animoxtend_extra_download_url, context=context)
        if download_url:
            webbrowser.open(download_url)
            return {'FINISHED'}
        else:
            return {'CANCELLED'}
