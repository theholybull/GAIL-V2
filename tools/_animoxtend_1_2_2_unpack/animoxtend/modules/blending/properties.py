import bpy

from .blending_functions.operator_funcs import clean_old_backups_timer, monitor_armature_changes

POST_PROCESSING_MODES = [
    ('FASTER', "Faster", "Use Blender Free Processing"),
    ('MORE_ACCURATE', "More Accurate", "Use blender auto post processing"),
]


def update_armature1(self, context):
    arm1_name = context.scene.armature1_name
    if arm1_name and arm1_name in bpy.data.objects:
        context.scene.armature1 = bpy.data.objects[arm1_name]
    else:
        context.scene.armature1 = None


def update_armature2(self, context):
    arm2_name = context.scene.armature2_name
    if arm2_name and arm2_name in bpy.data.objects:
        context.scene.armature2 = bpy.data.objects[arm2_name]
    else:
        context.scene.armature2 = None


def update_inbetween_armature(self, context):
    inbetween_arm_name = context.scene.armature_inbetween_name
    if inbetween_arm_name and inbetween_arm_name in bpy.data.objects:
        context.scene.armature_inbetween = bpy.data.objects[inbetween_arm_name]
    else:
        context.scene.armature_inbetween = None


class BlendingSettings(bpy.types.PropertyGroup):
    # Blending Settings
    trans_len: bpy.props.IntProperty(
        name="Transition Length", default=8, min=0, description="Transition Length in frames between two armatures."
    )  # type: ignore

    auto_update_trans_len: bpy.props.BoolProperty(
        name="Auto Update Transition Length", default=True, description="Allow automatic updates to Transition Length"
    )

    pre_context_len: bpy.props.IntProperty(name="Pre Context Length", default=8)  # type: ignore
    pre_mask_len: bpy.props.IntProperty(
        name="Armature 1 tail motion mask frame length",
        default=0,
        min=0,
        description="The number of frames to mask the tail motion of armature 1.",
    )  # type: ignore

    next_context_len: bpy.props.IntProperty(name="Next Context Length", default=8)  # type: ignore
    next_mask_len: bpy.props.IntProperty(
        name="Armature 2 head motion mask frame length",
        default=0,
        min=0,
        description="The number of frames to mask the head motion of armature 2.",
    )  # type: ignore

    pre_text: bpy.props.StringProperty(name="Pre Motion description", default="")  # type: ignore
    next_text: bpy.props.StringProperty(name="Next Motion description", default="")  # type: ignore
    use_state_machine: bpy.props.BoolProperty(
        name="Use state machine to blend",
        default=False,
        description="State machine to automatically generate transition motion.",
    )  # type: ignore
    post_processing: bpy.props.BoolProperty(
        name="Post Processing", default=True, description="Post Processing to fix sliding and jitter"
    )  # type: ignore

    post_processing_mode: bpy.props.EnumProperty(
        name="Post Processing Mode",
        description="Choose post processing mode",
        items=POST_PROCESSING_MODES,
        default='FASTER',
    )


class IntItem(bpy.types.PropertyGroup):
    value: bpy.props.IntProperty(name="Value", default=0)


class InbetweenSettings(bpy.types.PropertyGroup):
    cond_frames_idx: bpy.props.CollectionProperty(type=IntItem)
    context_len: bpy.props.IntProperty(name="Context Length", default=0)
    target_idx: bpy.props.IntProperty(name="Target Index", default=0)
    start_idx: bpy.props.IntProperty(name="Start Index", default=0)
    end_idx: bpy.props.IntProperty(name="End Index", default=0)

    post_processing: bpy.props.BoolProperty(
        name="Post Processing", default=True, description="Post Processing to fix sliding and jitter"
    )  # type: ignore

    post_processing_mode: bpy.props.EnumProperty(
        name="Post Processing Mode",
        description="Choose post processing mode",
        items=POST_PROCESSING_MODES,
        default='FASTER',
    )

    def add_cond_frame(self, value: int):
        item = self.cond_frames_idx.add()
        item.value = value


def define_properties():
    bpy.types.Scene.blend_tab = bpy.props.EnumProperty(
        name="Blend Tab",
        description="Select inbetween mode",
        items=[
            ('INBETWEEN', "In-between", "In-between"),
            ('CONCAT', "Smart concat", "Smart concat"),
        ],
        default='INBETWEEN',
    )

    bpy.types.Scene.armature1 = bpy.props.PointerProperty(
        name="Armature 1",
        type=bpy.types.Object,
        description="Pre Armature to blend",
        poll=lambda self, obj: obj.type == 'ARMATURE',  # 只允许选择 Armature
    )
    bpy.types.Scene.armature2 = bpy.props.PointerProperty(
        name="Armature 2",
        type=bpy.types.Object,
        description="Next Armature to blend",
        poll=lambda self, obj: obj.type == 'ARMATURE',  # 只允许选择 Armature
    )

    bpy.types.Scene.armature1_name = bpy.props.StringProperty(
        default='',
        name="Pre Armature",
        description="Name of the Pre Armature to blend",
        update=update_armature1,
    )

    bpy.types.Scene.armature2_name = bpy.props.StringProperty(
        default='',
        name="Next Armature",
        description="Name of the Next Armature to blend",
        update=update_armature2,
    )
    # -------------------------------- blending settings --------------------------------
    # Blend mode selection (Fast / Neural)
    bpy.types.Scene.blend_mode = bpy.props.EnumProperty(
        name="Blend Mode",
        description="Select blending mode",
        items=[
            ('FAST', "Fast", "Fast blending mode"),
            ('NEURAL', "Neural", "Neural blending mode"),
        ],
        default='NEURAL',
    )

    bpy.types.Scene.show_neural_settings = bpy.props.BoolProperty(name="Neural Advanced", default=False)
    bpy.types.Scene.blending_settings = bpy.props.PointerProperty(type=BlendingSettings)

    # -------------------------------- inbetween settings --------------------------------
    bpy.types.Scene.armature_inbetween_name = bpy.props.StringProperty(
        default='',
        name="Inbetween Armature",
        description="Name of the Inbetween Armature",
        update=update_inbetween_armature,
    )
    bpy.types.Scene.armature_inbetween = bpy.props.PointerProperty(
        name="Armature Inbetween",
        type=bpy.types.Object,
        poll=lambda self, obj: obj.type == 'ARMATURE',  # 只允许选择 Armature
    )

    bpy.types.Scene.show_inbetween_settings = bpy.props.BoolProperty(
        name="Show Inbetween Settings",
        default=False,
    )

    bpy.types.Scene.inbetween_settings = bpy.props.PointerProperty(type=InbetweenSettings)

    bpy.types.Scene.inbetween_pre_mode = bpy.props.StringProperty(
        default='None',
    )
    bpy.types.Scene.nla_new_track_name = bpy.props.StringProperty(
        default='None',
    )


def register_handlers():
    bpy.app.handlers.depsgraph_update_post.append(monitor_armature_changes)
    bpy.app.timers.register(clean_old_backups_timer)


def unregister_handlers():
    bpy.app.handlers.depsgraph_update_post.remove(monitor_armature_changes)
    bpy.app.timers.unregister(clean_old_backups_timer)


def register():
    # Since classes are automatically registered via `auto_load.py`
    # there is only need to register other things

    define_properties()
    register_handlers()


def unregister():
    # Since classes are automatically unregistered via `auto_load.py`
    # there is only need to unregister other things
    # pass
    if monitor_armature_changes in bpy.app.handlers.depsgraph_update_post:
        bpy.app.handlers.depsgraph_update_post.remove(monitor_armature_changes)
