import os

import bpy

from ....assets.resource_manager import Config
from ....utils.logging import logger
from .blender_utils import append_blend
from .file_utils import load_json

shape_key_mapping = {}


def check_active_mesh_object(context):
    """检查当前active object是否是合适的mesh对象"""
    if context.active_object and context.active_object.select_get() and context.active_object.type == "MESH":
        # 检查是否有shape keys
        if context.active_object.data.shape_keys and len(context.active_object.data.shape_keys.key_blocks) > 0:
            return context.active_object
    return None


def check_active_armature_object(context):
    """检查当前active object是否是合适的armature对象"""
    if context.active_object and context.active_object.select_get() and context.active_object.type == "ARMATURE":
        return context.active_object
    return None


def add_buffer_human(self, context):
    folder_path = Config.folder_path
    blend_path = os.path.join(folder_path, "BufferHuman.blend")
    appended_objects = []
    with bpy.data.libraries.load(blend_path) as (data_from, data_to):
        data_to.objects = data_from.objects
    for obj in data_to.objects:
        if obj is not None:
            bpy.context.collection.objects.link(obj)
            appended_objects.append(obj)
    logger.debug("已追加的对象: %s", [obj.name for obj in appended_objects])
    buffer_armature = appended_objects[-1]
    buffer_body = appended_objects[-2]
    buffer_eye = appended_objects[-3]
    return buffer_armature, buffer_eye, buffer_body


def setup_template_collection(self, context):
    """设置或创建Template_human collection及其对象"""
    # 检查是否存在Template collection
    template_collection = bpy.data.collections.get("Template")
    if not template_collection:
        template_collection = bpy.data.collections.new("Template")
        context.scene.collection.children.link(template_collection)

    # 检查场景中是否已存在buffer human对象
    buffer_armature = None
    buffer_body = None
    buffer_eye = None

    for obj in bpy.data.objects:
        if obj.name.startswith("BufferArmature"):
            buffer_armature = obj
        elif obj.name.startswith("BufferBody"):
            buffer_body = obj
        elif obj.name.startswith("BufferEye"):
            buffer_eye = obj

    # 如果没有找到完整的buffer human，则创建新的
    if not (buffer_armature and buffer_body and buffer_eye):
        buffer_armature, buffer_eye, buffer_body = add_buffer_human(self, context)

    # 将对象从当前collection中移除并添加到template collection
    for obj in [buffer_armature, buffer_eye, buffer_body]:
        # 从其他collection中移除
        for col in obj.users_collection:
            col.objects.unlink(obj)
        # 添加到Template collection
        template_collection.objects.link(obj)
    template_collection.hide_viewport = False
    template_collection.hide_render = False
    return buffer_armature, buffer_body, buffer_eye


def add_smplx_hand(target_name):
    folder_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    blend_path = os.path.join(folder_path, "resource", "SmplxHand.blend")
    SmplxArmature = append_blend(blend_path, "Object", "SmplxArmature")
    left_hand = append_blend(blend_path, "Object", "left_hand")
    right_hand = append_blend(blend_path, "Object", "right_hand")
    left_hand.name = target_name + "_left_hand"
    right_hand.name = target_name + "_right_hand"
    return SmplxArmature, left_hand, right_hand


def load_driver_presets():
    json_path = Config().load_driver_presets()
    driver_presets = load_json(json_path)
    return driver_presets


def auto_driver(CC_Armature, CC_Mesh):
    driver_presets = load_driver_presets()
    for bone_name in driver_presets:
        bone = CC_Armature.pose.bones[bone_name]
        for driver in driver_presets[bone_name]:
            key_name, key_axis = driver.rsplit("_", 1)
            fcurve = bone.driver_add(key_name, int(key_axis))
            while fcurve.driver.variables:
                fcurve.driver.variables.remove(fcurve.driver.variables[0])
            expression_parts = []
            for shapekey in driver_presets[bone_name][driver]:
                for key in shapekey:
                    var = fcurve.driver.variables.new()
                    var.name = key
                    var.type = "SINGLE_PROP"
                    target = var.targets[0]
                    target.id_type = "KEY"
                    target.id = CC_Mesh.data.shape_keys
                    target.data_path = f'key_blocks["{key}"].value'
                    expression_parts.append(f"{var.name} * {shapekey[key]}")
            final_expression = "+".join(expression_parts)
            fcurve.driver.expression = final_expression
            logger.info(f"Added driver for {bone_name}: {final_expression}")
