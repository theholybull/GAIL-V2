import bpy

from .face_functions.face_utils import emotion_list

# def update_buffer_armature(self, context):
#     # 当点击吸管时，检查是否有选中的对象
#     if (
#         context.active_object
#         and context.active_object.type == "ARMATURE"
#         and context.active_object.select_get()
#     ):
#         self.buffer_armature = context.active_object


def update_motion_search(self, context):
    # 只有当关键词不为空时才触发搜索操作
    if context.scene.motion_keyword.strip():  # 使用strip()去除空白字符后判断
        bpy.ops.object.text2motion()


def define_properties():
    bpy.types.Scene.show_buffer_module = bpy.props.BoolProperty(name="Show Buffer Module", default=False)
    bpy.types.Scene.show_face_module = bpy.props.BoolProperty(name="Show Face Module", default=False)
    bpy.types.Scene.show_motion_module = bpy.props.BoolProperty(name="Show Motion Module", default=False)
    bpy.types.Scene.show_tripo_module = bpy.props.BoolProperty(name="Show Tripo Module", default=False)
    bpy.types.Scene.buffer_armature = bpy.props.PointerProperty(
        name="Buffer Armature",
        type=bpy.types.Object,
        description="The armature Used to generate buffer",
    )
    bpy.types.Scene.buffer_body = bpy.props.PointerProperty(
        name="Buffer Body",
        type=bpy.types.Object,
        description="The body mesh Used to generate buffer",
    )
    bpy.types.Scene.buffer_armature_name = bpy.props.StringProperty(default="")
    bpy.types.Scene.buffer_body_name = bpy.props.StringProperty(default="")
    bpy.types.Scene.tripo_armature = bpy.props.PointerProperty(
        name="Tripo Armature",
        type=bpy.types.Object,
        description="The armature from tripo",
    )
    bpy.types.Scene.tripo_body = bpy.props.PointerProperty(
        name="Tripo Body", type=bpy.types.Object, description="The body mesh from tripo"
    )
    bpy.types.Scene.face_anim_file = bpy.props.StringProperty(
        name="CSV File Path",
        description="Path to CSV file",
        default="",
        subtype="FILE_PATH",
    )
    bpy.types.Scene.face_audio_file = bpy.props.StringProperty(
        name="Audio File Path",
        description="Path to WAV file",
        default="",
        subtype="FILE_PATH",
    )
    bpy.types.Scene.batch_process_folder = bpy.props.StringProperty(
        name="Batch process folder",
        description="path to load batch wav",
        default="",
        subtype="FILE_PATH",
    )
    bpy.types.Scene.batch_output_folder = bpy.props.StringProperty(
        name="Batch output folder",
        description="path to save output file",
        default="",
        subtype="FILE_PATH",
    )
    bpy.types.Scene.face_model_ui = bpy.props.EnumProperty(
        name="Face Model List",
        description="Available models for face animation",
        items=get_face_model_items,
    )
    bpy.types.Scene.emotion_ui = bpy.props.EnumProperty(
        name="Emotion List",
        description="Available emotions based on the selected face model",
        items=get_emotion_items,
    )
    bpy.types.Scene.motion_ui = bpy.props.PointerProperty(type=MotionUI, name="motion_ui")
    bpy.types.Scene.motion_keyword = bpy.props.StringProperty(
        name="T2M Keyword",
        description="Enter your text here",
        default="",
        update=update_motion_search,
    )
    bpy.types.Scene.motion_topk = bpy.props.IntProperty(
        name="Topk",
        description="T2M Topk",
        default=3,
        min=1,
        max=10,
    )
    bpy.types.Scene.generate_tabs = bpy.props.EnumProperty(
        name="generate tabs",
        items=[
            ("Motion", "Motion", "Operators related to motion animation generate"),
            ("Face", "Face", "Operators related to face shapekey animation generate"),
        ],
        default="Motion",
    )
    bpy.types.Scene.motion_toggle_state = bpy.props.BoolProperty(name="Motion Toggle State", default=False)


class MotionUI(bpy.types.PropertyGroup):
    motion_buffer = None

    def get_motion_list(self, context):
        items = []
        motion_list = bpy.context.scene.get("t2m_annotation_list", [])
        if len(motion_list) > 0:
            for i, item in enumerate(motion_list):
                identifier = f"motion_{i}"
                name = item
                description = f"this is t2m motion: {item}"
                items.append((identifier, name, description))
        else:
            items.append(("待生成", "No Motion", "There is no Motion generated"))
        MotionUI.motion_buffer = items
        return MotionUI.motion_buffer

    motion_ui_list: bpy.props.EnumProperty(name="motion list ui", items=get_motion_list)


def get_face_model_items(self, context):
    items = []
    model_list = context.scene.get("face_model_list", [])
    if model_list:
        for item in model_list:
            identifier = item
            name = item
            description = f"this is {item}"
            items.append((identifier, name, description))
    else:
        items.append(("NONE", "No Model", "There is No Model to Use!"))
    return items


def get_emotion_items(self, context):
    if "_emo_" in context.scene.face_model_ui:
        emotions = emotion_list()
        formatted_emotions = [(emotion, emotion, f"Emotion: {emotion}") for emotion in emotions]
        return formatted_emotions
    else:
        return [("None", "Not Support", "This face model does not support emotions")]


def register():
    # Since classes are automatically registered via `auto_load.py`
    # there is only need to register other things
    define_properties()


def unregister():
    # Since classes are automatically unregistered via `auto_load.py`
    # there is only need to unregister other things
    pass
