import bpy
from bpy.props import StringProperty


def define_properties():
    bpy.types.Scene.animoxtend_example_name = StringProperty(
        name="Example Name",
        description="Example Name",
        default="John",
    )


def register():
    # Since classes are automatically registered via `auto_load.py`
    # there is only need to register other things
    define_properties()


def unregister():
    # Since classes are automatically unregistered via `auto_load.py`
    # there is only need to unregister other things
    pass
