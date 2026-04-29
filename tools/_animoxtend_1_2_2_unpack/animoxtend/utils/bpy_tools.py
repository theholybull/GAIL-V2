import typing
from enum import Enum

import bpy

from .. import bl_info


def is_zh():
    return bpy.app.translations.locale.startswith("zh_HAN")


def get_addon_version():
    return bl_info["version"]


def get_addon_version_str():
    return ".".join(map(str, get_addon_version()))


def def_prop(key: 'str | Enum', prop):
    assert key, "Key must not be empty"
    setattr(
        bpy.types.Scene,
        _prop_key_to_str(key),
        prop,
    )


def del_prop(key: 'str | Enum'):
    assert key, "Key must not be empty"
    try:
        delattr(
            bpy.types.Scene,
            _prop_key_to_str(key),
        )
    except AttributeError:
        pass


def get_prop(key: 'str | Enum', *, context: "bpy.types.Context | None" = None) -> "typing.Any":
    assert key, "Key must not be empty"
    context = context or bpy.context
    if not context:
        return None
    scene = context.scene
    return getattr(
        scene,
        _prop_key_to_str(key),
        None,
    )


def set_prop(key: 'str | Enum', value: "typing.Any", *, context: "bpy.types.Context | None" = None):
    assert key, "Key must not be empty"
    context = context or bpy.context
    if not context:
        raise RuntimeError("No context")
    scene = context.scene
    setattr(
        scene,
        _prop_key_to_str(key),
        value,
    )


def _prop_key_to_str(key: 'str | Enum') -> str:
    return key.value if isinstance(key, Enum) else key
