import bpy

from ...utils.bpy_tools import def_prop, del_prop
from .constants import ExtraPropertyEnum


def define_properties():
    def_prop(
        ExtraPropertyEnum.animoxtend_extra_latest_version,
        bpy.props.StringProperty(
            name="Latest Version",
            description="The latest version of AnimoXtend",
            default="",
        ),
    )
    def_prop(
        ExtraPropertyEnum.animoxtend_extra_download_url,
        bpy.props.StringProperty(
            name="Download URL",
            description="The download URL of AnimoXtend",
            default="",
        ),
    )
    def_prop(
        ExtraPropertyEnum.animoxtend_extra_discord_link,
        bpy.props.StringProperty(
            name="Discord Link",
            description="The Discord link of AnimoXtend",
            default="",
        ),
    )


def register():
    # Since classes are automatically registered via `auto_load.py`
    # there is only need to register other things
    define_properties()


def unregister():
    # Since classes are automatically unregistered via `auto_load.py`
    # there is only need to unregister other things
    for prop in ExtraPropertyEnum:
        del_prop(prop.value)
