from __future__ import annotations

bl_info = {
    "name": "Gail Production Workbench",
    "author": "OpenAI Codex",
    "version": (0, 1, 0),
    "blender": (4, 1, 0),
    "location": "View3D > Sidebar > Gail Prod",
    "description": "Loop pose control, avatar partitioning, material tuning, and texture/export prep",
    "category": "Animation",
}

import json
from pathlib import Path

import bpy
import mathutils


PARTITION_KEYWORDS = {
    "hair": ("hair", "brow", "lash", "beard"),
    "clothing": (
        "shirt", "pant", "skirt", "dress", "sock", "shoe", "boot", "glove", "coat", "underwear", "vest", "jacket",
        "collar", "pocket", "button", "strap", "belt",
    ),
    "accessories": ("earring", "ring", "necklace", "bracelet", "bracelets", "hat", "glass", "bag", "belt", "watch", "prop"),
}


def armature_items(_self, _context):
    items = [(obj.name, obj.name, "") for obj in bpy.data.objects if obj.type == "ARMATURE"]
    return items or [("__none__", "None", "")]


def action_items(_self, _context):
    items = [(action.name, action.name, "") for action in bpy.data.actions]
    return items or [("__none__", "None", "")]


def ensure_action(name: str):
    action = bpy.data.actions.get(name)
    if action is None:
        action = bpy.data.actions.new(name=name)
    while action.fcurves:
        action.fcurves.remove(action.fcurves[0])
    action.use_fake_user = True
    return action


def require_pose_action(name: str):
    action = bpy.data.actions.get(name)
    if action is None:
        raise RuntimeError(f"Missing pose action: {name}")
    return action


def ensure_animation_data(obj):
    if obj.animation_data is None:
        obj.animation_data_create()
    return obj.animation_data


def capture_pose_snapshot(armature):
    snapshot = {}
    for pose_bone in armature.pose.bones:
        entry = {
            "rotation_mode": pose_bone.rotation_mode,
            "location": tuple(pose_bone.location),
            "scale": tuple(pose_bone.scale),
        }
        if pose_bone.rotation_mode == "QUATERNION":
            entry["rotation_quaternion"] = tuple(pose_bone.rotation_quaternion)
        elif pose_bone.rotation_mode == "AXIS_ANGLE":
            entry["rotation_axis_angle"] = tuple(pose_bone.rotation_axis_angle)
        else:
            entry["rotation_euler"] = tuple(pose_bone.rotation_euler)
        snapshot[pose_bone.name] = entry
    return snapshot


def snapshot_from_pose_action(armature, action):
    frame = int(action.get("gail_pose_frame", 1))
    ensure_animation_data(armature).action = action
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    return capture_pose_snapshot(armature)


def apply_pose_snapshot(armature, snapshot, frame):
    bpy.context.scene.frame_set(frame)
    for bone_name, entry in snapshot.items():
        pose_bone = armature.pose.bones.get(bone_name)
        if pose_bone is None:
            continue
        pose_bone.rotation_mode = entry["rotation_mode"]
        pose_bone.location = entry["location"]
        pose_bone.scale = entry["scale"]
        if pose_bone.rotation_mode == "QUATERNION":
            pose_bone.rotation_quaternion = entry["rotation_quaternion"]
            pose_bone.keyframe_insert(data_path="rotation_quaternion", frame=frame)
        elif pose_bone.rotation_mode == "AXIS_ANGLE":
            pose_bone.rotation_axis_angle = entry["rotation_axis_angle"]
            pose_bone.keyframe_insert(data_path="rotation_axis_angle", frame=frame)
        else:
            pose_bone.rotation_euler = entry["rotation_euler"]
            pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)
        pose_bone.keyframe_insert(data_path="location", frame=frame)
        pose_bone.keyframe_insert(data_path="scale", frame=frame)


def set_bezier(action):
    for fcurve in action.fcurves:
        for point in fcurve.keyframe_points:
            point.interpolation = "BEZIER"


def active_armature_from_settings(context):
    settings = context.scene.gail_prod
    obj = settings.armature
    if obj is None:
        obj = context.object
    if obj is None or obj.type != "ARMATURE":
        raise RuntimeError("Select or assign an armature")
    return obj


def child_meshes_for_armature(armature):
    meshes = []
    queue = list(armature.children)
    while queue:
        obj = queue.pop(0)
        queue.extend(list(obj.children))
        if obj.type == "MESH":
            meshes.append(obj)
    return meshes


def classify_mesh(obj_name: str):
    lower = obj_name.lower()
    if "victoria 8.shape" in lower or "victoria8.shape" in lower or "genesis 8 female.shape" in lower:
        return "body"
    if "casual style jacket.shape" in lower:
        return "other"
    if any(token in lower for token in ("zipper", "puller", "buckle", "loop")):
        return "other"
    for label, keywords in PARTITION_KEYWORDS.items():
        if any(keyword in lower for keyword in keywords):
            return label
    if any(token in lower for token in ("tear", "body", "skin", "torso", "genesis 8", "rosa maria 8.1.shape")):
        return "body"
    return "other"


def ensure_child_collection(parent, name: str):
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
    if collection.name not in parent.children.keys():
        parent.children.link(collection)
    return collection


def material_nodes_for_obj(obj):
    for slot in obj.material_slots:
        material = slot.material
        if material and material.use_nodes and material.node_tree:
            yield material, material.node_tree.nodes.get("Principled BSDF")


def sanitize_slug(value: str):
    cleaned = "".join(ch.lower() if ch.isalnum() else "_" for ch in value).strip("_")
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned or "unnamed"


def save_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def active_action_name(armature):
    if armature.animation_data and armature.animation_data.action:
        return armature.animation_data.action.name
    return ""


def object_exists(name: str, expected_type: str | None = None):
    if not name or name == "__none__":
        return False
    obj = bpy.data.objects.get(name)
    if obj is None:
        return False
    if expected_type and obj.type != expected_type:
        return False
    return True


def action_exists(name: str):
    return bool(name and name != "__none__" and bpy.data.actions.get(name) is not None)


def selected_meshes(context):
    return [obj for obj in context.selected_objects if obj.type == "MESH"]


def selected_clothing_meshes(context, armature):
    armature_mesh_names = {mesh.name for mesh in child_meshes_for_armature(armature)}
    return [
        obj for obj in selected_meshes(context)
        if obj.name in armature_mesh_names and classify_mesh(obj.name) == "clothing"
    ]


def texture_scope_meshes(context, armature, scope: str):
    meshes = child_meshes_for_armature(armature)
    if scope == "BODY_ONLY":
        return [mesh for mesh in meshes if classify_mesh(mesh.name) == "body"]
    if scope == "CLOTHING_ONLY":
        return [mesh for mesh in meshes if classify_mesh(mesh.name) == "clothing"]
    if scope == "SELECTED_CLOTHING":
        return selected_clothing_meshes(context, armature)
    return meshes


def package_root(settings):
    return Path(bpy.path.abspath(settings.output_root))


def world_height_for_meshes(meshes):
    min_z = float("inf")
    max_z = float("-inf")
    for mesh in meshes:
        if mesh.type != "MESH":
            continue
        for corner in mesh.bound_box:
            world = mesh.matrix_world @ mathutils.Vector(corner)
            min_z = min(min_z, world.z)
            max_z = max(max_z, world.z)
    if min_z == float("inf") or max_z == float("-inf"):
        return 0.0
    return max(0.0, max_z - min_z)


def compute_export_scale_factor(settings, buckets):
    if not settings.lock_export_scale:
        return 1.0, None
    body_meshes = buckets.get("body") or []
    source_meshes = body_meshes if body_meshes else [mesh for meshes in buckets.values() for mesh in meshes]
    source_height = world_height_for_meshes(source_meshes)
    if source_height <= 0.0001:
        return 1.0, None
    factor = float(settings.export_target_height_m) / source_height
    return factor, source_height


def write_package_manifest(settings, armature, last_action_name: str):
    root = package_root(settings)
    package = {
        "package_name": settings.package_name.strip() or armature.name,
        "armature": armature.name,
        "active_action": last_action_name,
        "output_root": str(root),
        "avatar_parts_manifest": str(root / "avatar_package" / "parts" / "avatar_parts_manifest.json"),
        "partition_manifest": str(root / "avatar_package" / "avatar_partition_manifest.json"),
        "texture_manifest": str(root / "avatar_package" / "textures" / "texture_manifest.json"),
        "loop_settings": {
            "start_pose_action": settings.start_pose_action,
            "mid_pose_action": settings.mid_pose_action,
            "end_pose_action": settings.end_pose_action,
            "frame_start": settings.frame_start,
            "frame_mid": settings.frame_mid,
            "frame_end": settings.frame_end,
        },
        "packaging_settings": {
            "clothing_export_mode": settings.clothing_export_mode,
            "selected_clothing_set_name": settings.selected_clothing_set_name,
            "texture_export_scope": settings.texture_export_scope,
            "texture_sizes": {
                "low": settings.low_texture_size,
                "medium": settings.medium_texture_size,
                "high": settings.high_texture_size,
            },
            "scale_lock": {
                "enabled": bool(settings.lock_export_scale),
                "target_height_m": float(settings.export_target_height_m),
            },
        },
    }
    save_json(root / "package_manifest.json", package)


def guided_scene_summary(settings):
    armature_name = settings.armature.name if settings.armature else "None"
    return {
        "armature": armature_name,
        "start_pose": settings.start_pose_action,
        "mid_pose": settings.mid_pose_action,
        "end_pose": settings.end_pose_action,
        "blend_a": settings.blend_action_a,
        "blend_b": settings.blend_action_b,
        "output_root": settings.output_root,
    }


class GailProdSettings(bpy.types.PropertyGroup):
    armature: bpy.props.PointerProperty(name="Armature", type=bpy.types.Object)
    armature_pick: bpy.props.EnumProperty(name="Armature Pick", items=armature_items)
    start_pose_action: bpy.props.StringProperty(name="Start Pose", default="pose_idle_confident_v1")
    mid_pose_action: bpy.props.StringProperty(name="Mid Pose", default="")
    end_pose_action: bpy.props.StringProperty(name="End Pose", default="pose_idle_confident_v1")
    start_pose_pick: bpy.props.EnumProperty(name="Start Pose Pick", items=action_items)
    mid_pose_pick: bpy.props.EnumProperty(name="Mid Pose Pick", items=action_items)
    end_pose_pick: bpy.props.EnumProperty(name="End Pose Pick", items=action_items)
    loop_action_name: bpy.props.StringProperty(name="Loop Action", default="loop_custom_v1")
    blend_action_a: bpy.props.StringProperty(name="Blend Action A", default="")
    blend_action_b: bpy.props.StringProperty(name="Blend Action B", default="")
    blend_action_a_pick: bpy.props.EnumProperty(name="Blend Action A Pick", items=action_items)
    blend_action_b_pick: bpy.props.EnumProperty(name="Blend Action B Pick", items=action_items)
    blended_action_name: bpy.props.StringProperty(name="Blended Action", default="blend_custom_v1")
    blend_factor: bpy.props.FloatProperty(name="Blend Factor", default=0.5, min=0.0, max=1.0)
    frame_start: bpy.props.IntProperty(name="Start Frame", default=1)
    frame_mid: bpy.props.IntProperty(name="Mid Frame", default=48)
    frame_end: bpy.props.IntProperty(name="End Frame", default=96)
    output_root: bpy.props.StringProperty(
        name="Output Root",
        default=r"D:\gail_production_package",
        subtype="DIR_PATH",
    )
    package_name: bpy.props.StringProperty(name="Package Name", default="gail_production_package")
    scan_message: bpy.props.StringProperty(name="Scan Status", default="Click Scan Scene to auto-fill the workflow.")
    last_run_summary: bpy.props.StringProperty(name="Last Run", default="")
    skin_roughness: bpy.props.FloatProperty(name="Skin Roughness", default=0.55, min=0.0, max=1.0)
    skin_specular: bpy.props.FloatProperty(name="Skin Specular", default=0.4, min=0.0, max=1.0)
    skin_subsurface: bpy.props.FloatProperty(name="Skin Subsurface", default=0.1, min=0.0, max=1.0)
    flat_base_color: bpy.props.FloatVectorProperty(
        name="Flat Base Color",
        subtype="COLOR",
        default=(0.72, 0.68, 0.65),
        min=0.0,
        max=1.0,
        size=3,
    )
    low_texture_size: bpy.props.IntProperty(name="Low", default=512, min=64)
    medium_texture_size: bpy.props.IntProperty(name="Medium", default=2048, min=64)
    high_texture_size: bpy.props.IntProperty(name="High", default=4096, min=64)
    clothing_export_mode: bpy.props.EnumProperty(
        name="Clothing Export",
        items=(
            ("BUNDLED", "Bundled", "Export all detected clothing as one GLB"),
            ("INDIVIDUAL", "Individual Items", "Export each clothing mesh as its own GLB"),
            ("SELECTED_SET", "Selected Set", "Export only selected clothing meshes as one clothing set GLB"),
        ),
        default="BUNDLED",
    )
    selected_clothing_set_name: bpy.props.StringProperty(
        name="Selected Set Name",
        default="outfit_set_v1",
    )
    lock_export_scale: bpy.props.BoolProperty(
        name="Lock Export Scale",
        description="Normalize avatar export scale to a fixed target height for stable runtime staging",
        default=True,
    )
    export_target_height_m: bpy.props.FloatProperty(
        name="Target Height (m)",
        description="Canonical avatar height baked into exported parts",
        default=1.72,
        min=0.25,
        max=3.0,
        precision=3,
    )
    texture_export_scope: bpy.props.EnumProperty(
        name="Texture Scope",
        items=(
            ("ALL", "All", "Export texture tiers for the full avatar package"),
            ("BODY_ONLY", "Body Only", "Export texture tiers only for body materials"),
            ("CLOTHING_ONLY", "Clothing Only", "Export texture tiers only for clothing materials"),
            ("SELECTED_CLOTHING", "Selected Clothing", "Export texture tiers only for selected clothing meshes"),
        ),
        default="ALL",
    )


def action_snapshot_at_frame(armature, action, frame):
    ensure_animation_data(armature).action = action
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    return capture_pose_snapshot(armature)


def blend_snapshots(snapshot_a, snapshot_b, factor: float):
    result = {}
    bone_names = set(snapshot_a.keys()) | set(snapshot_b.keys())
    for bone_name in bone_names:
        a = snapshot_a.get(bone_name)
        b = snapshot_b.get(bone_name)
        if a is None:
            result[bone_name] = b
            continue
        if b is None:
            result[bone_name] = a
            continue
        entry = {
            "rotation_mode": a["rotation_mode"],
            "location": tuple((1 - factor) * a["location"][i] + factor * b["location"][i] for i in range(3)),
            "scale": tuple((1 - factor) * a["scale"][i] + factor * b["scale"][i] for i in range(3)),
        }
        if a["rotation_mode"] == "QUATERNION" and "rotation_quaternion" in a and "rotation_quaternion" in b:
            qa = mathutils.Quaternion(a["rotation_quaternion"])
            qb = mathutils.Quaternion(b["rotation_quaternion"])
            entry["rotation_quaternion"] = tuple(qa.slerp(qb, factor))
        elif a["rotation_mode"] == "AXIS_ANGLE" and "rotation_axis_angle" in a and "rotation_axis_angle" in b:
            entry["rotation_axis_angle"] = tuple((1 - factor) * a["rotation_axis_angle"][i] + factor * b["rotation_axis_angle"][i] for i in range(4))
        elif "rotation_euler" in a and "rotation_euler" in b:
            entry["rotation_euler"] = tuple((1 - factor) * a["rotation_euler"][i] + factor * b["rotation_euler"][i] for i in range(3))
        result[bone_name] = entry
    return result


def root_bone_for_armature(armature):
    preferred = ("hip", "root", "hips", "pelvis")
    for name in preferred:
        bone = armature.pose.bones.get(name)
        if bone is not None:
            return bone
    return armature.pose.bones[0] if armature.pose.bones else None


def sync_settings_from_picks(settings):
    if object_exists(settings.armature_pick, "ARMATURE"):
        settings.armature = bpy.data.objects[settings.armature_pick]
    for attr, pick in (
        ("start_pose_action", settings.start_pose_pick),
        ("mid_pose_action", settings.mid_pose_pick),
        ("end_pose_action", settings.end_pose_pick),
        ("blend_action_a", settings.blend_action_a_pick),
        ("blend_action_b", settings.blend_action_b_pick),
    ):
        if action_exists(pick):
            setattr(settings, attr, pick)


class GAILPROD_OT_scan_scene(bpy.types.Operator):
    bl_idname = "gail_prod.scan_scene"
    bl_label = "Scan Scene"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod

        armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
        if not armatures:
            raise RuntimeError("No armature found in this scene")

        preferred = context.object if context.object and context.object.type == "ARMATURE" else None
        armature = settings.armature or preferred or armatures[0]
        settings.armature = armature
        settings.armature_pick = armature.name

        current_action = active_action_name(armature)
        if current_action:
            if not settings.blend_action_a:
                settings.blend_action_a = current_action
                settings.blend_action_a_pick = current_action
            if not settings.start_pose_action:
                settings.start_pose_action = current_action
                settings.start_pose_pick = current_action

        actions = [action.name for action in bpy.data.actions]
        pose_like = [name for name in actions if name.startswith("pose_")]
        if pose_like:
            first_pose = pose_like[0]
            if not settings.start_pose_action or not action_exists(settings.start_pose_action):
                settings.start_pose_action = first_pose
                settings.start_pose_pick = first_pose
            if not settings.end_pose_action or not action_exists(settings.end_pose_action):
                settings.end_pose_action = first_pose
                settings.end_pose_pick = first_pose
            if len(pose_like) > 1 and (not settings.mid_pose_action or not action_exists(settings.mid_pose_action)):
                settings.mid_pose_action = pose_like[1]
                settings.mid_pose_pick = pose_like[1]

        root = package_root(settings)
        settings.scan_message = (
            f"Ready: armature '{armature.name}', {len(actions)} actions, "
            f"{len(child_meshes_for_armature(armature))} skinned meshes, output '{root}'."
        )
        self.report({"INFO"}, settings.scan_message)
        return {"FINISHED"}


class GAILPROD_OT_use_picks(bpy.types.Operator):
    bl_idname = "gail_prod.use_picks"
    bl_label = "Use Selected Picks"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod
        sync_settings_from_picks(settings)
        settings.scan_message = "Workflow picks applied."
        self.report({"INFO"}, settings.scan_message)
        return {"FINISHED"}


class GAILPROD_OT_capture_pose_action(bpy.types.Operator):
    bl_idname = "gail_prod.capture_pose_action"
    bl_label = "Capture Current Pose"
    bl_options = {"REGISTER", "UNDO"}

    action_name: bpy.props.StringProperty(name="Action Name", default="pose_idle_confident_v1")
    frame: bpy.props.IntProperty(name="Pose Frame", default=1)

    def execute(self, context):
        armature = active_armature_from_settings(context)
        action = ensure_action(self.action_name)
        ensure_animation_data(armature).action = action
        snapshot = capture_pose_snapshot(armature)
        apply_pose_snapshot(armature, snapshot, self.frame)
        action["gail_pose_frame"] = self.frame
        self.report({"INFO"}, f"Captured pose action {action.name}")
        return {"FINISHED"}


class GAILPROD_OT_build_loop_action(bpy.types.Operator):
    bl_idname = "gail_prod.build_loop_action"
    bl_label = "Build Loop Action"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod
        armature = active_armature_from_settings(context)
        start_action = require_pose_action(settings.start_pose_action)
        end_action = require_pose_action(settings.end_pose_action or settings.start_pose_action)
        mid_action = require_pose_action(settings.mid_pose_action) if settings.mid_pose_action else None

        start_snapshot = snapshot_from_pose_action(armature, start_action)
        mid_snapshot = snapshot_from_pose_action(armature, mid_action) if mid_action else None
        end_snapshot = snapshot_from_pose_action(armature, end_action)

        action = ensure_action(settings.loop_action_name)
        ensure_animation_data(armature).action = action
        context.scene.frame_start = settings.frame_start
        context.scene.frame_end = settings.frame_end
        apply_pose_snapshot(armature, start_snapshot, settings.frame_start)
        if mid_snapshot:
            apply_pose_snapshot(armature, mid_snapshot, settings.frame_mid)
        apply_pose_snapshot(armature, end_snapshot, settings.frame_end)
        set_bezier(action)

        action["gail_loop"] = settings.start_pose_action == (settings.end_pose_action or settings.start_pose_action)
        action["gail_start_pose"] = settings.start_pose_action
        action["gail_end_pose"] = settings.end_pose_action or settings.start_pose_action
        if settings.mid_pose_action:
            action["gail_mid_pose"] = settings.mid_pose_action

        self.report({"INFO"}, f"Built loop action {action.name}")
        return {"FINISHED"}


class GAILPROD_OT_anchor_active_action(bpy.types.Operator):
    bl_idname = "gail_prod.anchor_active_action"
    bl_label = "Anchor Active Action Ends"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod
        armature = active_armature_from_settings(context)
        anim = ensure_animation_data(armature)
        if anim.action is None:
            raise RuntimeError("Armature has no active action")

        active_action = anim.action
        start_snapshot = snapshot_from_pose_action(armature, require_pose_action(settings.start_pose_action))
        end_snapshot = snapshot_from_pose_action(armature, require_pose_action(settings.end_pose_action or settings.start_pose_action))
        anim.action = active_action
        apply_pose_snapshot(armature, start_snapshot, settings.frame_start)
        apply_pose_snapshot(armature, end_snapshot, settings.frame_end)
        set_bezier(anim.action)
        self.report({"INFO"}, f"Anchored action {anim.action.name}")
        return {"FINISHED"}


class GAILPROD_OT_blend_actions(bpy.types.Operator):
    bl_idname = "gail_prod.blend_actions"
    bl_label = "Blend Two Actions"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod
        armature = active_armature_from_settings(context)
        action_a = require_pose_action(settings.blend_action_a)
        action_b = require_pose_action(settings.blend_action_b)
        new_action = ensure_action(settings.blended_action_name)
        ensure_animation_data(armature).action = new_action

        for frame in range(settings.frame_start, settings.frame_end + 1):
            snap_a = action_snapshot_at_frame(armature, action_a, frame)
            snap_b = action_snapshot_at_frame(armature, action_b, frame)
            blended = blend_snapshots(snap_a, snap_b, settings.blend_factor)
            ensure_animation_data(armature).action = new_action
            apply_pose_snapshot(armature, blended, frame)

        set_bezier(new_action)
        ensure_animation_data(armature).action = new_action
        self.report({"INFO"}, f"Built blended action {new_action.name}")
        return {"FINISHED"}


class GAILPROD_OT_normalize_root_loop(bpy.types.Operator):
    bl_idname = "gail_prod.normalize_root_loop"
    bl_label = "Normalize Root For Loop"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod
        armature = active_armature_from_settings(context)
        anim = ensure_animation_data(armature)
        if anim.action is None:
            raise RuntimeError("Armature has no active action")

        root_bone = root_bone_for_armature(armature)
        if root_bone is None:
            raise RuntimeError("Could not find root bone")

        bpy.context.scene.frame_set(settings.frame_start)
        bpy.context.view_layer.update()
        start_loc = tuple(root_bone.location)
        start_rot_mode = root_bone.rotation_mode
        start_rot_euler = tuple(root_bone.rotation_euler)
        start_rot_quat = tuple(root_bone.rotation_quaternion) if root_bone.rotation_mode == "QUATERNION" else None

        bpy.context.scene.frame_set(settings.frame_end)
        bpy.context.view_layer.update()
        root_bone.location = start_loc
        if start_rot_mode == "QUATERNION" and start_rot_quat is not None:
            root_bone.rotation_quaternion = start_rot_quat
            root_bone.keyframe_insert(data_path="rotation_quaternion", frame=settings.frame_end)
        else:
            root_bone.rotation_euler = start_rot_euler
            root_bone.keyframe_insert(data_path="rotation_euler", frame=settings.frame_end)
        root_bone.keyframe_insert(data_path="location", frame=settings.frame_end)
        set_bezier(anim.action)
        self.report({"INFO"}, f"Normalized root for {anim.action.name}")
        return {"FINISHED"}


class GAILPROD_OT_partition_avatar(bpy.types.Operator):
    bl_idname = "gail_prod.partition_avatar"
    bl_label = "Partition Avatar"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod
        armature = active_armature_from_settings(context)
        root_collection = ensure_child_collection(context.scene.collection, "GPW_AvatarParts")
        groups = {
            "body": ensure_child_collection(root_collection, "GPW_Body"),
            "hair": ensure_child_collection(root_collection, "GPW_Hair"),
            "clothing": ensure_child_collection(root_collection, "GPW_Clothing"),
            "accessories": ensure_child_collection(root_collection, "GPW_Accessories"),
            "other": ensure_child_collection(root_collection, "GPW_Other"),
        }

        manifest = {
            "armature": armature.name,
            "parts": [],
        }
        for mesh in child_meshes_for_armature(armature):
            bucket = classify_mesh(mesh.name)
            target_collection = groups[bucket]
            if mesh.name not in target_collection.objects.keys():
                target_collection.objects.link(mesh)
            manifest["parts"].append({
                "object": mesh.name,
                "bucket": bucket,
                "materials": [slot.material.name for slot in mesh.material_slots if slot.material],
            })

        output_root = Path(bpy.path.abspath(settings.output_root))
        save_json(output_root / "avatar_package" / "avatar_partition_manifest.json", manifest)
        self.report({"INFO"}, "Partitioned avatar and wrote manifest")
        return {"FINISHED"}


class GAILPROD_OT_export_avatar_parts(bpy.types.Operator):
    bl_idname = "gail_prod.export_avatar_parts"
    bl_label = "Export Avatar Parts"
    bl_options = {"REGISTER"}

    def execute(self, context):
        settings = context.scene.gail_prod
        armature = active_armature_from_settings(context)
        output_root = Path(bpy.path.abspath(settings.output_root)) / "avatar_package" / "parts"
        output_root.mkdir(parents=True, exist_ok=True)

        buckets = {"body": [], "hair": [], "clothing": [], "accessories": [], "other": []}
        for mesh in child_meshes_for_armature(armature):
            buckets[classify_mesh(mesh.name)].append(mesh)

        exported = []
        previous_selection = list(bpy.context.selected_objects)
        previous_active = bpy.context.view_layer.objects.active
        original_armature_scale = armature.scale.copy()
        scale_factor, source_height = compute_export_scale_factor(settings, buckets)
        applied_scale_lock = bool(settings.lock_export_scale and source_height and abs(scale_factor - 1.0) > 0.0005)
        if applied_scale_lock:
            armature.scale = mathutils.Vector(
                (
                    original_armature_scale.x * scale_factor,
                    original_armature_scale.y * scale_factor,
                    original_armature_scale.z * scale_factor,
                )
            )
            bpy.context.view_layer.update()
        for obj in bpy.data.objects:
            obj.select_set(False)
        try:
            for bucket, meshes in buckets.items():
                if not meshes:
                    continue
                if bucket == "clothing" and settings.clothing_export_mode == "INDIVIDUAL":
                    for mesh in meshes:
                        for obj in [armature, mesh]:
                            obj.select_set(True)
                        bpy.context.view_layer.objects.active = armature
                        item_slug = sanitize_slug(mesh.name)
                        path = output_root / "clothing" / "items" / f"{item_slug}.glb"
                        path.parent.mkdir(parents=True, exist_ok=True)
                        bpy.ops.export_scene.gltf(
                            filepath=str(path),
                            export_format="GLB",
                            use_selection=True,
                            export_animations=False,
                            export_nla_strips=False,
                            export_force_sampling=True,
                            export_apply=True,
                            export_yup=True,
                        )
                        exported.append({
                            "bucket": bucket,
                            "mode": "INDIVIDUAL",
                            "item": mesh.name,
                            "path": str(path),
                            "mesh_count": 1,
                            "scale_factor_applied": scale_factor,
                            "target_height_m": float(settings.export_target_height_m),
                            "source_height_m": source_height,
                        })
                        for obj in [armature, mesh]:
                            if obj.name in bpy.data.objects:
                                obj.select_set(False)
                    continue
                if bucket == "clothing" and settings.clothing_export_mode == "SELECTED_SET":
                    selected_set_meshes = selected_clothing_meshes(context, armature)
                    if not selected_set_meshes:
                        raise RuntimeError("Selected clothing set export requires one or more selected clothing meshes")
                    for obj in [armature, *selected_set_meshes]:
                        obj.select_set(True)
                    bpy.context.view_layer.objects.active = armature
                    set_slug = sanitize_slug(settings.selected_clothing_set_name)
                    path = output_root / "clothing" / "sets" / f"{set_slug}.glb"
                    path.parent.mkdir(parents=True, exist_ok=True)
                    bpy.ops.export_scene.gltf(
                        filepath=str(path),
                        export_format="GLB",
                        use_selection=True,
                        export_animations=False,
                        export_nla_strips=False,
                        export_force_sampling=True,
                        export_apply=True,
                        export_yup=True,
                    )
                    exported.append({
                        "bucket": bucket,
                        "mode": "SELECTED_SET",
                        "set_name": settings.selected_clothing_set_name,
                        "items": [mesh.name for mesh in selected_set_meshes],
                        "path": str(path),
                        "mesh_count": len(selected_set_meshes),
                        "scale_factor_applied": scale_factor,
                        "target_height_m": float(settings.export_target_height_m),
                        "source_height_m": source_height,
                    })
                    for obj in [armature, *selected_set_meshes]:
                        if obj.name in bpy.data.objects:
                            obj.select_set(False)
                    continue
                for obj in [armature, *meshes]:
                    obj.select_set(True)
                bpy.context.view_layer.objects.active = armature
                path = output_root / bucket / f"{armature.name}_{bucket}.glb"
                path.parent.mkdir(parents=True, exist_ok=True)
                bpy.ops.export_scene.gltf(
                    filepath=str(path),
                    export_format="GLB",
                    use_selection=True,
                    export_animations=False,
                    export_nla_strips=False,
                    export_force_sampling=True,
                    export_apply=True,
                    export_yup=True,
                )
                exported.append({
                    "bucket": bucket,
                    "mode": "BUNDLED" if bucket == "clothing" else "DEFAULT",
                    "path": str(path),
                    "mesh_count": len(meshes),
                    "scale_factor_applied": scale_factor,
                    "target_height_m": float(settings.export_target_height_m),
                    "source_height_m": source_height,
                })
                for obj in [armature, *meshes]:
                    if obj.name in bpy.data.objects:
                        obj.select_set(False)
        finally:
            armature.scale = original_armature_scale
            bpy.context.view_layer.update()
            for obj in previous_selection:
                if obj.name in bpy.data.objects:
                    obj.select_set(True)
            if previous_active and previous_active.name in bpy.data.objects:
                bpy.context.view_layer.objects.active = bpy.data.objects[previous_active.name]

        save_json(output_root / "avatar_parts_manifest.json", {"armature": armature.name, "exports": exported})
        if applied_scale_lock:
            self.report({"INFO"}, f"Exported {len(exported)} avatar part bundles (scale lock {scale_factor:.4f} to {settings.export_target_height_m:.3f}m)")
            return {"FINISHED"}
        self.report({"INFO"}, f"Exported {len(exported)} avatar part bundles")
        return {"FINISHED"}


class GAILPROD_OT_tune_skin_materials(bpy.types.Operator):
    bl_idname = "gail_prod.tune_skin_materials"
    bl_label = "Tune Skin Materials"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod
        armature = active_armature_from_settings(context)
        tuned = 0
        for mesh in child_meshes_for_armature(armature):
            if classify_mesh(mesh.name) != "body":
                continue
            for _, principled in material_nodes_for_obj(mesh):
                if principled is None:
                    continue
                if "Roughness" in principled.inputs:
                    principled.inputs["Roughness"].default_value = settings.skin_roughness
                if "Specular IOR Level" in principled.inputs:
                    principled.inputs["Specular IOR Level"].default_value = settings.skin_specular
                elif "Specular" in principled.inputs:
                    principled.inputs["Specular"].default_value = settings.skin_specular
                if "Subsurface Weight" in principled.inputs:
                    principled.inputs["Subsurface Weight"].default_value = settings.skin_subsurface
                tuned += 1
        self.report({"INFO"}, f"Tuned {tuned} material nodes")
        return {"FINISHED"}


class GAILPROD_OT_export_texture_tiers(bpy.types.Operator):
    bl_idname = "gail_prod.export_texture_tiers"
    bl_label = "Export Texture Tiers"
    bl_options = {"REGISTER"}

    def execute(self, context):
        settings = context.scene.gail_prod
        armature = active_armature_from_settings(context)
        output_root = Path(bpy.path.abspath(settings.output_root)) / "avatar_package" / "textures"
        output_root.mkdir(parents=True, exist_ok=True)
        scoped_meshes = texture_scope_meshes(context, armature, settings.texture_export_scope)
        if not scoped_meshes:
            raise RuntimeError("No meshes matched the selected texture export scope")

        base_color = tuple(settings.flat_base_color) + (1.0,)
        flat_image = bpy.data.images.get("GPW_FlatBaseAvatar")
        if flat_image is None:
            flat_image = bpy.data.images.new("GPW_FlatBaseAvatar", width=8, height=8, alpha=True)
        pixels = list(base_color) * (flat_image.size[0] * flat_image.size[1])
        flat_image.pixels = pixels
        flat_path = output_root / "base_avatar_flat.png"
        flat_image.filepath_raw = str(flat_path)
        flat_image.file_format = "PNG"
        flat_image.save()

        image_manifest = {
            "armature": armature.name,
            "flat_base_color": list(settings.flat_base_color),
            "scope": settings.texture_export_scope,
            "tiers": {
                "low": settings.low_texture_size,
                "medium": settings.medium_texture_size,
                "high": settings.high_texture_size,
            },
            "source_images": [],
        }

        seen = set()
        for mesh in scoped_meshes:
            for material, _ in material_nodes_for_obj(mesh):
                for node in material.node_tree.nodes:
                    if node.type != "TEX_IMAGE" or node.image is None:
                        continue
                    image = node.image
                    if image.name in seen:
                        continue
                    seen.add(image.name)

                    for label, size in (("low", settings.low_texture_size), ("medium", settings.medium_texture_size), ("high", settings.high_texture_size)):
                        copy = image.copy()
                        copy.scale(size, size)
                        out_path = output_root / label / f"{image.name}.png"
                        out_path.parent.mkdir(parents=True, exist_ok=True)
                        copy.filepath_raw = str(out_path)
                        copy.file_format = "PNG"
                        copy.save()
                        bpy.data.images.remove(copy)

                    image_manifest["source_images"].append({
                        "image": image.name,
                        "material_users": [
                            obj.name for obj in scoped_meshes
                            if any(slot.material and slot.material.name == material.name for slot in obj.material_slots)
                        ],
                    })

        save_json(output_root / "texture_manifest.json", image_manifest)
        self.report({"INFO"}, f"Exported texture tiers to {output_root}")
        return {"FINISHED"}


class GAILPROD_OT_guided_build_animation(bpy.types.Operator):
    bl_idname = "gail_prod.guided_build_animation"
    bl_label = "Build Animation"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod
        sync_settings_from_picks(settings)
        armature = active_armature_from_settings(context)

        if not action_exists(settings.start_pose_action):
            raise RuntimeError("Pick a valid start pose action")
        if not action_exists(settings.end_pose_action):
            settings.end_pose_action = settings.start_pose_action

        results = []
        results.append(("build_loop_action", list(bpy.ops.gail_prod.build_loop_action())))

        if action_exists(settings.blend_action_a) and action_exists(settings.blend_action_b):
            results.append(("blend_actions", list(bpy.ops.gail_prod.blend_actions())))
            ensure_animation_data(armature).action = bpy.data.actions.get(settings.blended_action_name)
        else:
            ensure_animation_data(armature).action = bpy.data.actions.get(settings.loop_action_name)

        results.append(("anchor_active_action", list(bpy.ops.gail_prod.anchor_active_action())))
        results.append(("normalize_root_loop", list(bpy.ops.gail_prod.normalize_root_loop())))

        active_name = active_action_name(armature)
        write_package_manifest(settings, armature, active_name)
        settings.last_run_summary = (
            f"Animation ready: '{active_name}' frames "
            f"{settings.frame_start}-{settings.frame_end}."
        )
        self.report({"INFO"}, settings.last_run_summary)
        return {"FINISHED"}


class GAILPROD_OT_guided_package_avatar(bpy.types.Operator):
    bl_idname = "gail_prod.guided_package_avatar"
    bl_label = "Package Avatar"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod
        sync_settings_from_picks(settings)
        armature = active_armature_from_settings(context)

        bpy.ops.gail_prod.partition_avatar()
        bpy.ops.gail_prod.tune_skin_materials()
        bpy.ops.gail_prod.export_avatar_parts()
        bpy.ops.gail_prod.export_texture_tiers()

        write_package_manifest(settings, armature, active_action_name(armature))
        settings.last_run_summary = f"Avatar package exported to '{package_root(settings)}'."
        self.report({"INFO"}, settings.last_run_summary)
        return {"FINISHED"}


class GAILPROD_OT_guided_run_all(bpy.types.Operator):
    bl_idname = "gail_prod.guided_run_all"
    bl_label = "Run Full Guided Build"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        settings = context.scene.gail_prod
        bpy.ops.gail_prod.guided_build_animation()
        bpy.ops.gail_prod.guided_package_avatar()
        settings.last_run_summary = "Full guided build finished."
        self.report({"INFO"}, settings.last_run_summary)
        return {"FINISHED"}


class GAILPROD_PT_guided_setup(bpy.types.Panel):
    bl_label = "Guided Setup"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Gail Prod"

    def draw(self, context):
        layout = self.layout
        settings = context.scene.gail_prod
        layout.label(text="Step 1: Scan the scene")
        layout.operator("gail_prod.scan_scene", text="Scan Scene", icon="VIEWZOOM")
        layout.label(text=settings.scan_message)
        layout.separator()
        layout.label(text="Step 2: Confirm armature and output")
        layout.prop(settings, "armature")
        layout.prop(settings, "armature_pick")
        layout.prop(settings, "output_root")
        layout.prop(settings, "package_name")
        layout.operator("gail_prod.use_picks", text="Use Selected Picks", icon="CHECKMARK")


class GAILPROD_PT_loop_tools(bpy.types.Panel):
    bl_label = "Animation Builder"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Gail Prod"

    def draw(self, context):
        layout = self.layout
        settings = context.scene.gail_prod
        layout.label(text="Step 3: Pick loop anchor poses")
        layout.prop(settings, "start_pose_pick")
        layout.prop(settings, "start_pose_action")
        layout.prop(settings, "mid_pose_pick")
        layout.prop(settings, "mid_pose_action")
        layout.prop(settings, "end_pose_pick")
        layout.prop(settings, "end_pose_action")
        layout.prop(settings, "loop_action_name")
        row = layout.row(align=True)
        row.prop(settings, "frame_start")
        row.prop(settings, "frame_mid")
        row.prop(settings, "frame_end")
        op = layout.operator("gail_prod.capture_pose_action", text="Capture Current Pose")
        op.action_name = settings.start_pose_action or "pose_idle_confident_v1"
        layout.separator()
        layout.label(text="Step 4: Optional action blend")
        layout.prop(settings, "blend_action_a_pick")
        layout.prop(settings, "blend_action_a")
        layout.prop(settings, "blend_action_b_pick")
        layout.prop(settings, "blend_action_b")
        layout.prop(settings, "blended_action_name")
        layout.prop(settings, "blend_factor")
        layout.separator()
        layout.label(text="Step 5: Build clean looping action")
        layout.operator("gail_prod.guided_build_animation", text="Build Animation", icon="ACTION")
        row = layout.row(align=True)
        row.operator("gail_prod.build_loop_action", text="Loop Only")
        row.operator("gail_prod.blend_actions", text="Blend Only")
        row = layout.row(align=True)
        row.operator("gail_prod.anchor_active_action", text="Anchor Ends")
        row.operator("gail_prod.normalize_root_loop", text="Normalize Root")


class GAILPROD_PT_avatar_tools(bpy.types.Panel):
    bl_label = "Avatar Packaging"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Gail Prod"

    def draw(self, context):
        layout = self.layout
        settings = context.scene.gail_prod
        layout.label(text="Step 6: Prepare avatar package")
        layout.operator("gail_prod.guided_package_avatar", text="Package Avatar", icon="PACKAGE")
        row = layout.row(align=True)
        row.operator("gail_prod.partition_avatar", text="Partition")
        row.operator("gail_prod.export_avatar_parts", text="Export Parts")
        layout.separator()
        scale_row = layout.row(align=True)
        scale_row.prop(settings, "lock_export_scale", text="Lock Export Scale")
        target_row = layout.row(align=True)
        target_row.enabled = settings.lock_export_scale
        target_row.prop(settings, "export_target_height_m", text="Target Height (m)")
        layout.separator()
        layout.label(text="Look tuning")
        layout.prop(settings, "skin_roughness")
        layout.prop(settings, "skin_specular")
        layout.prop(settings, "skin_subsurface")
        layout.operator("gail_prod.tune_skin_materials", text="Tune Skin Materials")
        layout.separator()
        layout.label(text="Texture tiers")
        layout.prop(settings, "flat_base_color")
        row = layout.row(align=True)
        row.prop(settings, "low_texture_size")
        row.prop(settings, "medium_texture_size")
        row.prop(settings, "high_texture_size")
        layout.separator()
        layout.label(text="Clothing packaging")
        layout.prop(settings, "clothing_export_mode")
        if settings.clothing_export_mode == "SELECTED_SET":
            layout.prop(settings, "selected_clothing_set_name")
        layout.label(text="Texture export scope")
        layout.prop(settings, "texture_export_scope")
        layout.operator("gail_prod.export_texture_tiers", text="Export Texture Tiers")
        layout.separator()
        layout.label(text="Step 7: One-click run")
        layout.operator("gail_prod.guided_run_all", text="Run Full Guided Build", icon="PLAY")
        if settings.last_run_summary:
            layout.label(text=settings.last_run_summary)


classes = (
    GailProdSettings,
    GAILPROD_OT_scan_scene,
    GAILPROD_OT_use_picks,
    GAILPROD_OT_capture_pose_action,
    GAILPROD_OT_build_loop_action,
    GAILPROD_OT_anchor_active_action,
    GAILPROD_OT_blend_actions,
    GAILPROD_OT_normalize_root_loop,
    GAILPROD_OT_partition_avatar,
    GAILPROD_OT_export_avatar_parts,
    GAILPROD_OT_tune_skin_materials,
    GAILPROD_OT_export_texture_tiers,
    GAILPROD_OT_guided_build_animation,
    GAILPROD_OT_guided_package_avatar,
    GAILPROD_OT_guided_run_all,
    GAILPROD_PT_guided_setup,
    GAILPROD_PT_loop_tools,
    GAILPROD_PT_avatar_tools,
)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.gail_prod = bpy.props.PointerProperty(type=GailProdSettings)


def unregister():
    del bpy.types.Scene.gail_prod
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
