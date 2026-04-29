import bpy
from bpy.props import (
    BoolProperty,
    CollectionProperty,
    FloatProperty,
    IntProperty,
    PointerProperty,
    StringProperty,
)
from bpy.types import PropertyGroup

from .api import tripo_api


def update_preview_image(self, context):
    """当预览图片被更改时调用"""
    if self.ma_preview_image is None:
        self.show_preview = False
        self.image_path = ""
        self.image_token = ""


class ImagePreviewProps(PropertyGroup):
    image_path: StringProperty(name="图片路径", description="选择的图片路径", subtype="FILE_PATH", default="")

    show_preview: BoolProperty(name="显示预览", description="切换图片预览显示", default=False)

    ma_preview_image: PointerProperty(type=bpy.types.Image, name="预览图片", update=update_preview_image)

    image_token: StringProperty(
        name="Image Token",
        description="The token of the image",
        default="",
    )


class MultiViewProps(PropertyGroup):
    front_view: PointerProperty(
        type=ImagePreviewProps,
        name="front_view_image",
        description="front view properties",
    )
    back_view: PointerProperty(
        type=ImagePreviewProps,
        name="back_view_image",
        description="back view properties",
    )
    left_view: PointerProperty(
        type=ImagePreviewProps,
        name="left_view_image",
        description="left_view_properties",
    )
    right_view: PointerProperty(
        type=ImagePreviewProps,
        name="right_view_image",
        description="right_view_properties",
    )


class TaskItem(PropertyGroup):
    task_id: StringProperty(
        name="Task ID",
        description="The ID of the task",
        default="",
    )
    task_type: StringProperty(
        name="Task Type",
        description="The type of the task",
        default="",
    )
    task_progress: FloatProperty(
        name="Task Progress",
        description="The progress of the task",
        default=0,
        min=0,
        max=100,
    )
    is_monitoring: BoolProperty(
        name="Is Monitoring",
        description="Whether the task is being monitored",
        default=False,
    )


class TaskListProps(PropertyGroup):
    task_list: CollectionProperty(
        name="Task List",
        description="The list of the tasks",
        type=TaskItem,
    )
    active_task_index: IntProperty(
        name="Active Task Index",
        description="The index of the active task",
        default=-1,
    )


def get_pp_style_items(self, context):
    style_list = tripo_api.pp_style_list
    return [(style, style, style) for style in style_list]


def get_generate_style_items(self, context):
    style_list = tripo_api.generate_style_list
    return [(style, style, style) for style in style_list]


def get_convert_items(self, context):
    convert_list = tripo_api.convert_list
    return [(convert, convert, convert) for convert in convert_list]


def get_texture_alignment_items(self, context):
    texture_alignment_list = tripo_api.texture_alignment_list
    return [(texture_alignment, texture_alignment, texture_alignment) for texture_alignment in texture_alignment_list]


def get_texture_quality_items(self, context):
    texture_quality_list = tripo_api.texture_quality_list
    return [(texture_quality, texture_quality, texture_quality) for texture_quality in texture_quality_list]


def define_properties():
    bpy.types.Scene.upload_image_props = bpy.props.PointerProperty(
        type=ImagePreviewProps,
        description="The properties of the image preview",
    )
    bpy.types.Scene.multi_view_props = bpy.props.PointerProperty(
        type=MultiViewProps,
        description="The properties of the multi view",
    )
    bpy.types.Scene.task_list = PointerProperty(
        type=TaskListProps,
        description="The properties of the task list",
        name="Task List",
    )
    bpy.types.Scene.tripo_api_key = bpy.props.StringProperty(
        name="Tripo API Key",
        description="The API key for the Tripo API",
        default="",
    )
    bpy.types.Scene.text_prompt = bpy.props.StringProperty(
        name="Text to Model Prompt",
        description="The prompt for the Text to Model",
        default="",
    )
    bpy.types.Scene.show_management_module = bpy.props.BoolProperty(
        name="Show management Module",
        description="Show the management Module",
        default=False,
    )
    bpy.types.Scene.show_generate_module = bpy.props.BoolProperty(
        name="Show generate Module",
        description="Show the generate Module",
        default=False,
    )
    bpy.types.Scene.show_post_process_module = bpy.props.BoolProperty(
        name="Show post process Module",
        description="Show the post process Module",
        default=False,
    )
    bpy.types.Scene.show_animation_module = bpy.props.BoolProperty(
        name="Show animation Module",
        description="Show the animation Module",
        default=False,
    )
    bpy.types.Scene.image_token = bpy.props.StringProperty(
        name="Image Token",
        description="The token of the image",
        default="",
    )
    bpy.types.Scene.task_id = bpy.props.StringProperty(
        name="Task ID",
        description="The ID of the task",
        default="",
    )
    bpy.types.Scene.task_progress = bpy.props.FloatProperty(
        name="Task Progress",
        min=0,
        max=100,
        default=0,
        subtype="PERCENTAGE",
        options={"SKIP_SAVE"},
    )
    bpy.types.Scene.generate_style_ui = bpy.props.EnumProperty(
        name="Generate Style UI",
        description="The style of the UI",
        items=get_generate_style_items,
        default=0,
    )
    bpy.types.Scene.pp_style_ui = bpy.props.EnumProperty(
        name="Post Process Style UI",
        description="The style of the UI",
        items=get_pp_style_items,
        default=0,
    )
    bpy.types.Scene.texture_alignment_ui = bpy.props.EnumProperty(
        name="Texture Alignment UI",
        description="The alignment of the texture",
        items=get_texture_alignment_items,
        default=0,
    )
    bpy.types.Scene.texture_quality_ui = bpy.props.EnumProperty(
        name="Texture Quality UI",
        description="The quality of the texture",
        items=get_texture_quality_items,
        default=0,
    )
    bpy.types.Scene.convert_ui = bpy.props.EnumProperty(
        name="Convert UI",
        description="The convert of the UI",
        items=get_convert_items,
        default=0,
    )
    bpy.types.Scene.quad_ui = bpy.props.BoolProperty(
        name="Quad UI",
        description="The quad of the UI",
        default=False,
    )
    bpy.types.Scene.symmetry_ui = bpy.props.BoolProperty(
        name="Symmetry UI",
        description="The symmetry of the UI",
        default=False,
    )
    bpy.types.Scene.face_limit_ui = bpy.props.IntProperty(
        name="Face Limit UI",
        description="The face limit of the UI",
        default=10000,
        min=100,
        max=100000,
    )


def register():
    # Since classes are automatically registered via `auto_load.py`
    # there is only need to register other things
    define_properties()


def unregister():
    # Since classes are automatically unregistered via `auto_load.py`
    # there is only need to unregister other things
    pass
