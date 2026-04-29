bl_info = {
    "name": "Gail Export Tools",
    "author": "OpenAI Codex",
    "version": (0, 1, 0),
    "blender": (4, 1, 0),
    "location": "View3D > Sidebar > Gail Export",
    "description": "Register and export Gail modules and animation clips",
    "category": "Import-Export",
}

import json
import importlib.util
import re
import subprocess
import sys
from pathlib import Path

import bpy
from bpy.props import BoolProperty, EnumProperty, IntProperty, StringProperty
from bpy_extras.io_utils import ImportHelper


REPO_SENTINELS = (
    "blender",
    "playcanvas-app",
    "backend",
)


EXPORT_PROFILE_SETTINGS = {
    "high": {
        "label": "High / Host PC",
        "description": "Full-fidelity runtime export for the RTX 4050 host laptop.",
        "allow_module_morphs": True,
        "allow_clip_morphs": True,
        "draco_enabled": False,
        "draco_level": 0,
        "image_format": "AUTO",
    },
    "medium": {
        "label": "Medium / N150 Client",
        "description": "Compressed runtime export for low-power x86 clients.",
        "allow_module_morphs": True,
        "allow_clip_morphs": True,
        "draco_enabled": False,
        "draco_level": 4,
        "draco_position_quantization": 12,
        "draco_normal_quantization": 10,
        "draco_texcoord_quantization": 12,
        "draco_generic_quantization": 12,
        "image_format": "JPEG",
        "image_quality": 70,
        "jpeg_quality": 70,
    },
    "low": {
        "label": "Low / ESP32 Watch",
        "description": "Minimal export for tiny display clients; no morph targets.",
        "allow_module_morphs": False,
        "allow_clip_morphs": False,
        "draco_enabled": False,
        "draco_level": 6,
        "draco_position_quantization": 11,
        "draco_normal_quantization": 8,
        "draco_texcoord_quantization": 10,
        "draco_generic_quantization": 10,
        "image_format": "JPEG",
        "image_quality": 50,
        "jpeg_quality": 50,
    },
}


def export_profile_items(_self, _context):
    return [
        (profile_id, settings["label"], settings["description"])
        for profile_id, settings in EXPORT_PROFILE_SETTINGS.items()
    ]


def get_export_profile_settings(profile_name: str) -> dict:
    return EXPORT_PROFILE_SETTINGS.get(profile_name, EXPORT_PROFILE_SETTINGS["high"])


def infer_repo_root() -> Path:
    blend_path = getattr(bpy.data, "filepath", "")
    if blend_path:
        blend_file = Path(blend_path).resolve()
        for parent in blend_file.parents:
            if all((parent / item).exists() for item in REPO_SENTINELS):
                return parent

    here = Path(__file__).resolve()
    for parent in here.parents:
        if all((parent / item).exists() for item in REPO_SENTINELS):
            return parent
    return Path.cwd()


def get_repo_root(scene: bpy.types.Scene) -> Path:
    raw = scene.gail_repo_root.strip()
    if raw:
        candidate = Path(bpy.path.abspath(raw)).resolve()
        if all((candidate / item).exists() for item in REPO_SENTINELS):
            return candidate
    return infer_repo_root()


def get_assets_root(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "playcanvas-app" / "assets"


def get_modules_manifest_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "playcanvas-app" / "config" / "work-lite-modules.gail.json"


def get_partition_manifest_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "blender" / "animation_master" / "manifests" / "asset_partition.gail.json"


def get_clip_registry_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "blender" / "animation_master" / "manifests" / "clip_registry.gail.example.json"


def get_pose_registry_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "blender" / "animation_master" / "manifests" / "pose_registry.gail.json"


def get_pose_plan_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "blender" / "animation_master" / "manifests" / "pose_plan.gail.json"


def get_bone_map_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "blender" / "animation_master" / "manifests" / "bone_map.gail.json"


def get_pipeline_script_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "tools" / "export-playcanvas-pipeline.ps1"


def get_rokoko_retarget_script_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "blender" / "animation_master" / "scripts" / "rokoko_mixamo_to_gail.py"


def get_master_blend_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "gail_rig_master.blend"


def get_regular_blend_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "gail_rig.blend"


def get_current_or_master_blend_path(scene: bpy.types.Scene) -> Path:
    blend_path = getattr(bpy.data, "filepath", "")
    if blend_path:
        return Path(blend_path)
    return get_master_blend_path(scene)


def resolve_scene_path(scene: bpy.types.Scene, raw_path: str) -> Path:
    cleaned = raw_path.strip()
    if not cleaned:
        return Path()
    candidate = Path(bpy.path.abspath(cleaned))
    if candidate.is_absolute() and candidate.exists():
        return candidate.resolve()

    repo_root = get_repo_root(scene)
    normalized = cleaned.replace("/", "\\").lstrip("\\")
    if normalized.lower().startswith("blender\\") or normalized.lower().startswith("playcanvas-app\\") or normalized.lower().startswith("backend\\") or normalized.lower().startswith("tools\\"):
        repo_candidate = (repo_root / normalized).resolve()
        if repo_candidate.exists():
            return repo_candidate

    repo_candidate = (repo_root / cleaned).resolve()
    if repo_candidate.exists():
        return repo_candidate
    return candidate.resolve()


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", value).strip("_").lower()
    return cleaned or "module"


def selected_meshes(context: bpy.types.Context) -> list[bpy.types.Object]:
    return [obj for obj in context.selected_objects if obj.type == "MESH"]


def find_armature(context: bpy.types.Context, armature_name: str) -> bpy.types.Object | None:
    if armature_name:
        obj = bpy.data.objects.get(armature_name)
        if obj and obj.type == "ARMATURE":
            return obj
    active = context.view_layer.objects.active
    if active and active.type == "ARMATURE":
        return active
    for obj in context.selected_objects:
        if obj.type == "ARMATURE":
            return obj
    for obj in bpy.data.objects:
        if obj.type == "ARMATURE":
            return obj
    return None


def armature_items(_self, _context):
    items = [(obj.name, obj.name, "") for obj in bpy.data.objects if obj.type == "ARMATURE"]
    return items or [("__none__", "None", "")]


def action_items(_self, _context):
    items = [(action.name, action.name, "") for action in bpy.data.actions]
    return items or [("__none__", "None", "")]


def pose_action_items(self, context):
    scene = context.scene if context else None
    items = []
    seen = set()
    if scene is not None:
        registry = load_json(get_pose_registry_path(scene))
        for name in sorted((registry.get("pose_actions") or {}).keys()):
            items.append((name, name, ""))
            seen.add(name)

    for action in sorted(bpy.data.actions, key=lambda item: item.name.lower()):
        if action.name in seen:
            continue
        if action.get("gail_type") == "pose" or action.name.startswith("pose_"):
            items.append((action.name, action.name, ""))
            seen.add(action.name)
    return items or [("__none__", "None", "")]


def load_pose_plan(scene: bpy.types.Scene) -> list[dict]:
    payload = load_json(get_pose_plan_path(scene))
    return payload.get("pose_plan", [])


def pose_plan_items(self, context):
    scene = context.scene if context else None
    if scene is None:
        return [("__none__", "None", "")]
    items = []
    for entry in load_pose_plan(scene):
        pose_id = entry.get("id")
        if not pose_id:
            continue
        label = entry.get("label") or pose_id
        description = f"{entry.get('role', '')} {entry.get('family', '')}".strip()
        items.append((pose_id, label, description))
    return items or [("__none__", "None", "")]


def meshes_skinned_to_armature(armature: bpy.types.Object) -> list[bpy.types.Object]:
    results = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        if any(mod.type == "ARMATURE" and mod.object == armature for mod in obj.modifiers):
            results.append(obj)
    return results


def ensure_object_mode() -> None:
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def active_avatar_id(scene: bpy.types.Scene) -> str:
    raw = scene.gail_avatar_id.strip() or scene.gail_avatar_folder.strip() or "gail_default"
    return slugify(raw)


def normalized_object_module_id(object_name: str, kind: str) -> str:
    name = object_name.removesuffix(".Shape").removesuffix(".shape")
    prefix_map = {
        "clothing": "geo_cloth_",
        "hair": "geo_hair_",
        "accessory": "geo_acc_",
    }
    prefix = prefix_map.get(kind, "")
    if prefix and name.lower().startswith(prefix):
        name = name[len(prefix) :]
    return slugify(name)


def choose_module_relative_path(scene: bpy.types.Scene, module_id: str | None = None) -> str:
    if scene.gail_module_relative_path.strip():
        return scene.gail_module_relative_path.strip().replace("\\", "/")

    module_id = slugify(module_id or scene.gail_module_id)
    kind = scene.gail_module_kind
    avatar_id = active_avatar_id(scene)
    if kind == "avatar":
        return f"gail/avatars/{avatar_id}/base/{avatar_id}_base_avatar.glb"
    if kind == "hair":
        return f"gail/avatars/{avatar_id}/hair/{module_id}/{module_id}.glb"
    if kind == "clothing":
        if scene.gail_clothing_export_mode == "set":
            set_id = slugify(scene.gail_clothing_set_id) or module_id
            return f"gail/avatars/{avatar_id}/clothing/sets/{set_id}/{set_id}.glb"
        return f"gail/avatars/{avatar_id}/clothing/pieces/{module_id}/{module_id}.glb"
    if kind == "accessory":
        return f"gail/avatars/{avatar_id}/accessories/{module_id}/{module_id}.glb"
    if kind == "animation":
        return f"animations/{module_id}.glb"
    return f"backgrounds/{module_id}.jpg"


def choose_clip_runtime_path(scene: bpy.types.Scene) -> str:
    if scene.gail_clip_runtime_relative_path.strip():
        return scene.gail_clip_runtime_relative_path.strip().replace("\\", "/")
    return f"animations/{slugify(scene.gail_clip_name)}.glb"


def module_search_directories(kind: str, relative_path: str) -> list[str]:
    directory = str(Path(relative_path).parent).replace("\\", "/")
    parts = Path(relative_path).parts
    if len(parts) >= 3 and parts[0] == "gail" and parts[1] == "avatars":
        avatar_root = "/".join(parts[:3])
        if kind == "avatar":
            return ["gail/avatars", avatar_root, f"{avatar_root}/base"]
        if kind == "hair":
            return ["gail/avatars", avatar_root, f"{avatar_root}/hair"]
        if kind == "clothing":
            return ["gail/avatars", avatar_root, f"{avatar_root}/clothing"]
        if kind == "accessory":
            return ["gail/avatars", avatar_root, f"{avatar_root}/accessories"]
    if kind == "animation":
        return ["animations"]
    if kind == "background":
        return ["backgrounds"]
    return [directory]


def default_extensions(kind: str) -> list[str]:
    if kind == "background":
        return [".jpg", ".jpeg", ".png", ".webp"]
    return [".glb", ".gltf"]


def upsert_work_lite_asset(scene: bpy.types.Scene, asset_entry: dict) -> None:
    manifest_path = get_modules_manifest_path(scene)
    payload = load_json(manifest_path)
    payload.setdefault("coreAssetIds", [])
    payload.setdefault("assets", [])

    assets = payload["assets"]
    replaced = False
    for index, entry in enumerate(assets):
        if entry.get("id") == asset_entry["id"]:
            assets[index] = asset_entry
            replaced = True
            break
    if not replaced:
        assets.append(asset_entry)

    core_ids = payload["coreAssetIds"]
    if asset_entry.get("required"):
        if asset_entry["id"] not in core_ids:
            core_ids.append(asset_entry["id"])
    else:
        payload["coreAssetIds"] = [item for item in core_ids if item != asset_entry["id"]]

    save_json(manifest_path, payload)


def upsert_partition_group(scene: bpy.types.Scene, kind: str, module_id: str, mesh_names: list[str], relative_path: str, armature_name: str) -> None:
    manifest_path = get_partition_manifest_path(scene)
    payload = load_json(manifest_path)
    avatar_id = active_avatar_id(scene)
    payload.setdefault("project", "gail")
    payload.setdefault("manifest_version", "v2")
    payload.setdefault("source_master_file", str(get_master_blend_path(scene)))
    payload.setdefault("regular_avatar_file", str(get_regular_blend_path(scene)))
    payload["armature_object"] = armature_name
    payload.setdefault("avatar_exports", {})

    output_folder = str((get_assets_root(scene) / Path(relative_path).parent).resolve())
    output_path = str((get_assets_root(scene) / relative_path).resolve())
    file_name = Path(relative_path).name
    avatar_entry = payload["avatar_exports"].setdefault(
        avatar_id,
        {
            "avatar_id": avatar_id,
            "armature_object": armature_name,
            "export_mode": scene.gail_avatar_export_mode,
            "body_face_group": None,
            "hair_groups": [],
            "clothing_groups": [],
            "clothing_sets": [],
            "accessory_groups": [],
        },
    )
    avatar_entry["armature_object"] = armature_name
    avatar_entry["export_mode"] = scene.gail_avatar_export_mode

    if kind == "avatar":
        avatar_entry["body_face_group"] = {
            "name": f"{avatar_id}_base_avatar",
            "objects": mesh_names,
            "output_folder": output_folder,
            "output_path": output_path,
            "file_name": file_name,
            "relative_path": relative_path,
        }
        save_json(manifest_path, payload)
        return

    key_map = {
        "hair": "hair_groups",
        "clothing": "clothing_sets" if scene.gail_clothing_export_mode == "set" else "clothing_groups",
        "accessory": "accessory_groups",
    }
    list_key = key_map.get(kind)
    if not list_key:
        save_json(manifest_path, payload)
        return

    avatar_entry.setdefault(list_key, [])
    group_entry = {
        "name": module_id,
        "objects": mesh_names,
        "output_folder": output_folder,
        "output_path": output_path,
        "file_name": file_name,
        "relative_path": relative_path,
        "avatar_id": avatar_id,
        "slot": scene.gail_module_slot.strip() or None,
    }
    if kind == "clothing":
        group_entry["export_mode"] = scene.gail_clothing_export_mode
        if scene.gail_clothing_export_mode == "set":
            group_entry["set_id"] = slugify(scene.gail_clothing_set_id) or module_id

    replaced = False
    for index, entry in enumerate(avatar_entry[list_key]):
        if entry.get("name") == module_id:
            avatar_entry[list_key][index] = group_entry
            replaced = True
            break
    if not replaced:
        avatar_entry[list_key].append(group_entry)

    save_json(manifest_path, payload)


def upsert_clip_registry(scene: bpy.types.Scene, clip_name: str, frame_start: int, frame_end: int) -> None:
    manifest_path = get_clip_registry_path(scene)
    payload = load_json(manifest_path)
    payload.setdefault("manifest_version", "v1")
    payload.setdefault("project", "gail")
    payload.setdefault("master_file", str(get_current_or_master_blend_path(scene)))
    payload.setdefault(
        "armature",
        {
            "object_name": scene.gail_armature_name,
            "data_name": scene.gail_armature_data_name or scene.gail_armature_name,
            "lock_contract": False,
        },
    )
    payload.setdefault(
        "export_profiles",
        [
            {
                "name": "playcanvas_glb",
                "format": "glb",
                "path_root": str((get_repo_root(scene) / "blender" / "animation_master" / "exports" / "glb" / "clips").resolve()),
                "collection": "EXP_clip_preview",
                "include_statuses": ["approved"],
            }
        ],
    )
    payload.setdefault("clips", [])

    relative_path = f"{scene.gail_clip_status}/{scene.gail_clip_category}/{clip_name}.glb"
    clip_entry = {
        "clip_name": clip_name,
        "category": scene.gail_clip_category,
        "version": scene.gail_clip_version,
        "status": scene.gail_clip_status,
        "owner": "animation",
        "partition": "body",
        "frame_start": frame_start,
        "frame_end": frame_end,
        "loop": scene.gail_clip_loop,
        "tags": [scene.gail_clip_category],
        "source": {
            "source_type": "custom",
            "source_name": "gail_export_tools",
            "source_file": get_current_or_master_blend_path(scene).name,
            "source_clip": clip_name,
            "retargeted_by": "",
            "cleanup_pass": "",
        },
        "export": {
            "profile": "playcanvas_glb",
            "relative_path": relative_path.replace("/", "\\"),
            "collection": "EXP_clip_preview",
        },
        "notes": scene.gail_clip_notes,
    }

    replaced = False
    for index, entry in enumerate(payload["clips"]):
        if entry.get("clip_name") == clip_name:
            payload["clips"][index] = clip_entry
            replaced = True
            break
    if not replaced:
        payload["clips"].append(clip_entry)

    save_json(manifest_path, payload)


def upsert_pose_registry(scene: bpy.types.Scene, pose_name: str, frame: int) -> None:
    manifest_path = get_pose_registry_path(scene)
    payload = load_json(manifest_path)
    payload.setdefault("project", "gail")
    payload["master_file"] = str(get_current_or_master_blend_path(scene))
    payload["armature_object"] = scene.gail_armature_name
    payload.setdefault("pose_actions", {})
    payload["pose_actions"][pose_name] = {
        "status": scene.gail_pose_status,
        "type": scene.gail_pose_type,
        "role": scene.gail_pose_role,
        "family": scene.gail_pose_family,
        "loop_usage": scene.gail_pose_loop_usage,
        "frame": frame,
        "notes": [scene.gail_pose_notes] if scene.gail_pose_notes.strip() else [],
    }
    save_json(manifest_path, payload)


def seed_pose_registry_from_plan(scene: bpy.types.Scene) -> int:
    manifest_path = get_pose_registry_path(scene)
    payload = load_json(manifest_path)
    payload.setdefault("project", "gail")
    payload["master_file"] = str(get_current_or_master_blend_path(scene))
    payload["armature_object"] = scene.gail_armature_name
    payload.setdefault("pose_actions", {})

    added = 0
    for entry in load_pose_plan(scene):
        pose_id = entry.get("id")
        if not pose_id or pose_id in payload["pose_actions"]:
            continue
        payload["pose_actions"][pose_id] = {
            "status": "capture_next",
            "type": "base_pose",
            "role": entry.get("role", "loop_anchor"),
            "family": entry.get("family", ""),
            "loop_usage": entry.get("loop_usage", "seamless"),
            "frame": 1,
            "notes": [entry.get("notes", "Capture this pose in gail_rig_master.blend.")],
        }
        added += 1

    save_json(manifest_path, payload)
    return added


def build_asset_entry(scene: bpy.types.Scene, module_id: str, relative_path: str) -> dict:
    asset_entry = {
        "id": module_id,
        "name": scene.gail_module_display_name.strip() or module_id.replace("_", " "),
        "kind": scene.gail_module_kind,
        "slot": scene.gail_module_slot.strip() or None,
        "required": scene.gail_module_required,
        "autoLoad": scene.gail_module_auto_load,
        "expectedPath": relative_path,
        "searchDirectories": module_search_directories(scene.gail_module_kind, relative_path),
        "extensions": default_extensions(scene.gail_module_kind),
    }
    if scene.gail_module_kind in {"avatar", "hair", "clothing", "accessory"}:
        asset_entry["avatarId"] = active_avatar_id(scene)
        asset_entry["exportIntent"] = scene.gail_avatar_export_mode
    if scene.gail_module_kind == "clothing":
        asset_entry["clothingExportMode"] = scene.gail_clothing_export_mode
        if scene.gail_clothing_export_mode == "set":
            asset_entry["clothingSetId"] = slugify(scene.gail_clothing_set_id) or module_id
    return asset_entry


def export_selected_objects(filepath: Path, export_morph: bool, export_animations: bool, profile_name: str) -> None:
    filepath.parent.mkdir(parents=True, exist_ok=True)
    settings = get_export_profile_settings(profile_name)
    final_export_morph = export_morph and (
        settings["allow_clip_morphs"] if export_animations else settings["allow_module_morphs"]
    )
    export_kwargs = {
        "filepath": str(filepath),
        "export_format": "GLB",
        "use_selection": True,
        "export_animations": export_animations,
        "export_nla_strips": False,
        "export_animation_mode": "ACTIVE_ACTIONS",
        "export_force_sampling": True,
        "export_skins": True,
        "export_all_influences": False,
        "export_morph": final_export_morph,
        "export_morph_animation": export_animations and final_export_morph,
        "export_yup": True,
        "export_image_format": settings.get("image_format", "AUTO"),
    }
    if settings.get("image_quality") is not None:
        export_kwargs["export_image_quality"] = settings["image_quality"]
    if settings.get("jpeg_quality") is not None:
        export_kwargs["export_jpeg_quality"] = settings["jpeg_quality"]
    if settings.get("draco_enabled"):
        export_kwargs.update(
            {
                "export_draco_mesh_compression_enable": True,
                "export_draco_mesh_compression_level": settings["draco_level"],
                "export_draco_position_quantization": settings["draco_position_quantization"],
                "export_draco_normal_quantization": settings["draco_normal_quantization"],
                "export_draco_texcoord_quantization": settings["draco_texcoord_quantization"],
                "export_draco_generic_quantization": settings["draco_generic_quantization"],
            }
        )
    bpy.ops.export_scene.gltf(**export_kwargs)


def run_blender_script_in_process(script_path: Path, args: list[str]) -> None:
    spec = importlib.util.spec_from_file_location(f"gail_inline_{script_path.stem}", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load script: {script_path}")

    module = importlib.util.module_from_spec(spec)
    old_argv = sys.argv[:]
    try:
        sys.argv = ["blender", "--", *args]
        spec.loader.exec_module(module)
        if hasattr(module, "main"):
            module.main()
    finally:
        sys.argv = old_argv


def generator_script_and_args(scene: bpy.types.Scene) -> tuple[Path, list[str], str]:
    repo_root = get_repo_root(scene)
    scripts_root = repo_root / "blender" / "animation_master" / "scripts"
    manifests_root = repo_root / "blender" / "animation_master" / "manifests"
    armature_name = scene.gail_armature_pick if scene.gail_armature_pick != "__none__" else scene.gail_armature_name
    action_name = scene.gail_generator_action_name.strip() or scene.gail_clip_name.strip()
    bone_map = load_json(get_bone_map_path(scene))
    body_bones = bone_map.get("body", {})

    preset = scene.gail_generator_preset
    if preset == "capture_pose":
        final_name = action_name or "pose_custom_v1"
        args = ["--armature", armature_name, "--action-name", final_name, "--frame", "1"]
        if scene.gail_generator_save_after_run:
            args.append("--save")
        return scripts_root / "capture_current_pose_as_action.py", args, final_name

    if preset == "nod_small_v1":
        final_name = action_name or "ack_nod_small_v1"
        config = scene.gail_generator_config_path.strip() or str(manifests_root / "clip_tuning.ack_nod_small_v1.json")
        args = ["--armature", armature_name, "--action-name", final_name, "--config", config]
        if scene.gail_generator_save_after_run:
            args.append("--save")
        return scripts_root / "generate_nod_small_v1.py", args, final_name

    if preset == "idle_body":
        final_name = action_name or "idle_base_v1"
        config = scene.gail_generator_config_path.strip() or str(manifests_root / "clip_tuning.idle_base_v1.json")
        args = ["--armature", armature_name, "--action-name", final_name, "--config", config]
        if scene.gail_generator_save_after_run:
            args.append("--save")
        return scripts_root / "generate_idle_base_v1.py", args, final_name

    if preset == "idle_face":
        config = scene.gail_generator_config_path.strip() or str(manifests_root / "clip_tuning.idle_base_v1.json")
        args = ["--config", config]
        if scene.gail_generator_save_after_run:
            args.append("--save")
        return scripts_root / "generate_idle_face_v1.py", args, "idle_face_body_v1"

    if preset == "listen_body":
        final_name = action_name or "listen_base_v1"
        config = scene.gail_generator_config_path.strip() or str(manifests_root / "clip_tuning.listen_base_v1.json")
        args = ["--armature", armature_name, "--action-name", final_name, "--config", config]
        if scene.gail_generator_save_after_run:
            args.append("--save")
        return scripts_root / "generate_idle_base_v1.py", args, final_name

    if preset == "talk_body":
        final_name = action_name or "talk_base_v1"
        config = scene.gail_generator_config_path.strip() or str(manifests_root / "clip_tuning.talk_base_v1.json")
        args = ["--armature", armature_name, "--action-name", final_name, "--config", config]
        if scene.gail_generator_save_after_run:
            args.append("--save")
        return scripts_root / "generate_idle_base_v1.py", args, final_name

    raise RuntimeError(f"Unsupported generator preset: {preset}")


class GAIL_OT_scan_scene(bpy.types.Operator):
    bl_idname = "gail.scan_scene"
    bl_label = "Scan Scene"
    bl_description = "Populate Gail export fields from the current Blender scene"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        armature = find_armature(context, scene.gail_armature_name)
        if armature:
            scene.gail_armature_name = armature.name
            scene.gail_armature_data_name = armature.data.name
            scene.gail_armature_pick = armature.name

        meshes = selected_meshes(context)
        if meshes and not scene.gail_module_id:
            scene.gail_module_id = slugify(meshes[0].name)
        if meshes and not scene.gail_module_display_name:
            scene.gail_module_display_name = meshes[0].name
        if not scene.gail_module_relative_path:
            scene.gail_module_relative_path = choose_module_relative_path(scene)

        action = None
        if armature and armature.animation_data and armature.animation_data.action:
            action = armature.animation_data.action
        elif bpy.data.actions:
            action = bpy.data.actions[0]

        if action and not scene.gail_clip_name:
            scene.gail_clip_name = action.name
        if action:
            scene.gail_action_pick = action.name
        if action:
            scene.gail_clip_frame_start = int(action.frame_range[0])
            scene.gail_clip_frame_end = int(action.frame_range[1])
        if not scene.gail_clip_runtime_relative_path:
            scene.gail_clip_runtime_relative_path = choose_clip_runtime_path(scene)

        self.report({"INFO"}, "Scene scan complete.")
        return {"FINISHED"}


class GAIL_OT_apply_picks(bpy.types.Operator):
    bl_idname = "gail.apply_picks"
    bl_label = "Use Picked Armature/Action"
    bl_description = "Copy the selected armature and action picks into the text fields"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        if scene.gail_armature_pick and scene.gail_armature_pick != "__none__":
            scene.gail_armature_name = scene.gail_armature_pick
            armature = bpy.data.objects.get(scene.gail_armature_pick)
            if armature and armature.type == "ARMATURE":
                scene.gail_armature_data_name = armature.data.name
        if scene.gail_action_pick and scene.gail_action_pick != "__none__":
            scene.gail_clip_name = scene.gail_action_pick
            scene.gail_generator_action_name = scene.gail_action_pick
            action = bpy.data.actions.get(scene.gail_action_pick)
            if action is not None:
                scene.gail_clip_frame_start = int(action.frame_range[0])
                scene.gail_clip_frame_end = int(action.frame_range[1])
        self.report({"INFO"}, "Applied current picks.")
        return {"FINISHED"}


class GAIL_OT_import_glb(bpy.types.Operator, ImportHelper):
    bl_idname = "gail.import_glb"
    bl_label = "Import GLB"
    bl_description = "Import a GLB/GLTF file into the current scene"

    filename_ext = ".glb"
    filepath: bpy.props.StringProperty(subtype="FILE_PATH")
    filter_glob: bpy.props.StringProperty(default="*.glb;*.gltf", options={"HIDDEN"})

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        raw_path = self.filepath or scene.gail_import_path
        filepath = resolve_scene_path(scene, raw_path)
        if not filepath.exists():
            self.report({"ERROR"}, "Pick a .glb or .gltf file to import.")
            return {"CANCELLED"}
        scene.gail_import_path = str(filepath)
        bpy.ops.import_scene.gltf(filepath=str(filepath))
        self.report({"INFO"}, f"Imported {filepath.name}")
        return {"FINISHED"}


class GAIL_OT_register_module(bpy.types.Operator):
    bl_idname = "gail.register_module"
    bl_label = "Register Module"
    bl_description = "Register selected meshes as a Gail runtime module and optionally sync the partition manifest"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        meshes = selected_meshes(context)
        if not meshes:
            self.report({"ERROR"}, "Select one or more mesh objects.")
            return {"CANCELLED"}

        armature = find_armature(context, scene.gail_armature_name)
        if scene.gail_sync_partition_manifest and not armature:
            self.report({"ERROR"}, "No armature found for partition sync.")
            return {"CANCELLED"}

        if scene.gail_module_kind == "clothing" and scene.gail_clothing_export_mode == "pieces":
            registered = []
            for mesh in meshes:
                piece_id = (
                    slugify(scene.gail_module_id)
                    if len(meshes) == 1 and scene.gail_module_id.strip()
                    else normalized_object_module_id(mesh.name, "clothing")
                )
                relative_path = choose_module_relative_path(scene, module_id=piece_id)
                asset_entry = build_asset_entry(scene, piece_id, relative_path)
                upsert_work_lite_asset(scene, asset_entry)
                if scene.gail_sync_partition_manifest:
                    upsert_partition_group(
                        scene,
                        scene.gail_module_kind,
                        piece_id,
                        [mesh.name],
                        relative_path,
                        armature.name,
                    )
                registered.append(piece_id)
            scene.gail_module_id = registered[-1]
            scene.gail_module_relative_path = ""
            self.report({"INFO"}, f"Registered {len(registered)} clothing piece exports for {active_avatar_id(scene)}")
            return {"FINISHED"}

        module_id = slugify(scene.gail_module_id or meshes[0].name)
        relative_path = choose_module_relative_path(scene, module_id=module_id)
        asset_entry = build_asset_entry(scene, module_id, relative_path)
        upsert_work_lite_asset(scene, asset_entry)

        if scene.gail_sync_partition_manifest:
            upsert_partition_group(
                scene,
                scene.gail_module_kind,
                module_id,
                [obj.name for obj in meshes],
                relative_path,
                armature.name,
            )

        scene.gail_module_id = module_id
        scene.gail_module_relative_path = relative_path
        self.report({"INFO"}, f"Registered module {module_id}")
        return {"FINISHED"}


class GAIL_OT_export_module(bpy.types.Operator):
    bl_idname = "gail.export_module"
    bl_label = "Export Module"
    bl_description = "Export the selected module directly to the configured PlayCanvas asset path"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        ensure_object_mode()
        armature = find_armature(context, scene.gail_armature_name)
        meshes = selected_meshes(context)
        if not meshes:
            self.report({"ERROR"}, "Select one or more mesh objects to export.")
            return {"CANCELLED"}
        if armature is None and scene.gail_module_kind != "background":
            self.report({"ERROR"}, "No armature found for export.")
            return {"CANCELLED"}

        if scene.gail_module_kind == "clothing" and scene.gail_clothing_export_mode == "pieces":
            exported = []
            for mesh in meshes:
                filepath = get_assets_root(scene) / choose_module_relative_path(
                    scene,
                    module_id=normalized_object_module_id(mesh.name, "clothing"),
                )
                bpy.ops.object.select_all(action="DESELECT")
                if armature is not None:
                    armature.select_set(True)
                    context.view_layer.objects.active = armature
                mesh.select_set(True)
                export_selected_objects(
                    filepath=filepath,
                    export_morph=False,
                    export_animations=False,
                    profile_name=scene.gail_export_profile,
                )
                exported.append(filepath.name)
            self.report({"INFO"}, f"Exported {len(exported)} clothing pieces for {active_avatar_id(scene)}")
            return {"FINISHED"}

        filepath = get_assets_root(scene) / choose_module_relative_path(scene)
        bpy.ops.object.select_all(action="DESELECT")
        if armature is not None:
            armature.select_set(True)
            context.view_layer.objects.active = armature
        for obj in meshes:
            obj.select_set(True)

        export_selected_objects(
            filepath=filepath,
            export_morph=scene.gail_module_kind == "avatar",
            export_animations=False,
            profile_name=scene.gail_export_profile,
        )
        self.report({"INFO"}, f"Exported module to {filepath}")
        return {"FINISHED"}


class GAIL_OT_register_clip(bpy.types.Operator):
    bl_idname = "gail.register_clip"
    bl_label = "Register Clip"
    bl_description = "Register the active clip in the clip registry and as an optional runtime animation asset"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        clip_name = slugify(scene.gail_clip_name)
        if not clip_name:
            self.report({"ERROR"}, "Clip name is required.")
            return {"CANCELLED"}

        upsert_clip_registry(
            scene=scene,
            clip_name=clip_name,
            frame_start=scene.gail_clip_frame_start,
            frame_end=scene.gail_clip_frame_end,
        )

        if scene.gail_register_clip_as_runtime_asset:
            relative_path = choose_clip_runtime_path(scene)
            asset_entry = {
                "id": clip_name,
                "name": scene.gail_clip_display_name.strip() or clip_name.replace("_", " "),
                "kind": "animation",
                "slot": scene.gail_clip_category,
                "required": scene.gail_clip_required,
                "autoLoad": scene.gail_clip_auto_load,
                "expectedPath": relative_path,
                "searchDirectories": ["animations"],
                "extensions": [".glb", ".gltf"],
            }
            upsert_work_lite_asset(scene, asset_entry)
            scene.gail_clip_runtime_relative_path = relative_path

        self.report({"INFO"}, f"Registered clip {clip_name}")
        return {"FINISHED"}


class GAIL_OT_capture_pose(bpy.types.Operator):
    bl_idname = "gail.capture_pose"
    bl_label = "Capture Pose"
    bl_description = "Capture the current Gail pose as a pose action and register it in the pose registry"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        armature = find_armature(context, scene.gail_armature_name)
        if armature is None:
            self.report({"ERROR"}, "No armature found.")
            return {"CANCELLED"}

        pose_name = slugify(scene.gail_pose_name)
        if not pose_name:
            self.report({"ERROR"}, "Pose name is required.")
            return {"CANCELLED"}

        script_path = get_repo_root(scene) / "blender" / "animation_master" / "scripts" / "capture_current_pose_as_action.py"
        args = [
            "--armature",
            armature.name,
            "--action-name",
            pose_name,
            "--frame",
            str(scene.gail_pose_frame),
        ]
        if scene.gail_pose_save_after_capture:
            args.append("--save")

        try:
            run_blender_script_in_process(script_path, args)
            upsert_pose_registry(scene, pose_name, scene.gail_pose_frame)
        except Exception as exc:  # noqa: BLE001
            self.report({"ERROR"}, str(exc))
            return {"CANCELLED"}

        scene.gail_pose_name = pose_name
        scene.gail_pose_pick = pose_name
        self.report({"INFO"}, f"Captured pose {pose_name}")
        return {"FINISHED"}


class GAIL_OT_use_pose_plan(bpy.types.Operator):
    bl_idname = "gail.use_pose_plan"
    bl_label = "Use Planned Pose"
    bl_description = "Load one of the planned anchor or midpoint poses into the pose capture fields"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        pose_id = scene.gail_pose_plan_pick
        if not pose_id or pose_id == "__none__":
            self.report({"ERROR"}, "Choose a planned pose first.")
            return {"CANCELLED"}

        plan_entry = next((entry for entry in load_pose_plan(scene) if entry.get("id") == pose_id), None)
        if plan_entry is None:
            self.report({"ERROR"}, f"Missing planned pose: {pose_id}")
            return {"CANCELLED"}

        scene.gail_pose_name = pose_id
        scene.gail_pose_type = "base_pose"
        scene.gail_pose_role = plan_entry.get("role", "loop_anchor")
        scene.gail_pose_family = plan_entry.get("family", "")
        scene.gail_pose_loop_usage = plan_entry.get("loop_usage", "seamless")
        scene.gail_pose_notes = plan_entry.get("notes", "")
        if bpy.data.actions.get(pose_id):
            scene.gail_pose_pick = pose_id
        self.report({"INFO"}, f"Loaded planned pose {pose_id}")
        return {"FINISHED"}


class GAIL_OT_seed_pose_plan(bpy.types.Operator):
    bl_idname = "gail.seed_pose_plan"
    bl_label = "Seed Pose Registry"
    bl_description = "Preload the pose registry with planned loop anchors and midpoint poses"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        added = seed_pose_registry_from_plan(scene)
        self.report({"INFO"}, f"Seeded {added} planned poses")
        return {"FINISHED"}


class GAIL_OT_apply_pose(bpy.types.Operator):
    bl_idname = "gail.apply_pose"
    bl_label = "Apply Pose"
    bl_description = "Apply a saved Gail pose action to the current armature"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        armature = find_armature(context, scene.gail_armature_name)
        if armature is None:
            self.report({"ERROR"}, "No armature found.")
            return {"CANCELLED"}

        pose_name = scene.gail_pose_pick if scene.gail_pose_pick != "__none__" else scene.gail_pose_name.strip()
        action = bpy.data.actions.get(pose_name)
        if not pose_name or action is None:
            self.report({"ERROR"}, f"Missing pose action: {pose_name or 'None'}")
            return {"CANCELLED"}

        frame = scene.gail_pose_frame
        if "gail_pose_frame" in action:
            try:
                frame = int(action["gail_pose_frame"])
            except (TypeError, ValueError):
                pass

        if armature.animation_data is None:
            armature.animation_data_create()
        armature.animation_data.action = action
        scene.frame_set(frame)
        context.view_layer.update()

        scene.gail_pose_name = pose_name
        scene.gail_action_pick = pose_name
        self.report({"INFO"}, f"Applied pose {pose_name}")
        return {"FINISHED"}


class GAIL_OT_import_pose_library(bpy.types.Operator, ImportHelper):
    bl_idname = "gail.import_pose_library"
    bl_label = "Import Pose Library"
    bl_description = "Append pose actions from another Blender file into the current master scene"

    filename_ext = ".blend"
    filepath: bpy.props.StringProperty(subtype="FILE_PATH")
    filter_glob: bpy.props.StringProperty(default="*.blend", options={"HIDDEN"})

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        filepath = resolve_scene_path(scene, self.filepath or scene.gail_pose_library_path)
        if not filepath.exists() or filepath.suffix.lower() != ".blend":
            self.report({"ERROR"}, "Choose a valid .blend pose library.")
            return {"CANCELLED"}

        prefix = scene.gail_pose_import_prefix.strip()
        imported = []
        existing = set(bpy.data.actions.keys())

        try:
            with bpy.data.libraries.load(str(filepath), link=False) as (data_from, data_to):
                names = []
                for name in data_from.actions:
                    if prefix and not name.startswith(prefix):
                        continue
                    if not prefix and not name.startswith("pose_"):
                        continue
                    names.append(name)
                data_to.actions = names
        except Exception as exc:  # noqa: BLE001
            self.report({"ERROR"}, f"Import failed: {exc}")
            return {"CANCELLED"}

        for action in bpy.data.actions:
            if action.name not in existing and (action.name.startswith(prefix) if prefix else action.name.startswith("pose_")):
                action.use_fake_user = True
                action["gail_type"] = "pose"
                imported.append(action.name)

        scene.gail_pose_library_path = str(filepath)
        if imported:
            scene.gail_pose_pick = imported[0]
            scene.gail_pose_name = imported[0]
        self.report({"INFO"}, f"Imported {len(imported)} pose actions")
        return {"FINISHED"}


class GAIL_OT_generate_pose_loop(bpy.types.Operator):
    bl_idname = "gail.generate_pose_loop"
    bl_label = "Generate Pose Clip"
    bl_description = "Build a short loop or sequence clip directly from captured start, midpoint, and end poses"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        armature_name = scene.gail_armature_pick if scene.gail_armature_pick != "__none__" else scene.gail_armature_name
        script_path = get_repo_root(scene) / "blender" / "animation_master" / "scripts" / "generate_pose_loop_clip.py"
        start_pose = scene.gail_loop_start_pose if scene.gail_loop_start_pose != "__none__" else ""
        mid_pose = scene.gail_loop_mid_pose if scene.gail_loop_mid_pose != "__none__" else ""
        end_pose = scene.gail_loop_end_pose if scene.gail_loop_end_pose != "__none__" else ""
        action_name = scene.gail_loop_action_name.strip() or scene.gail_clip_name.strip() or "loop_custom_v1"

        if not start_pose:
            self.report({"ERROR"}, "Choose a start pose.")
            return {"CANCELLED"}

        args = [
            "--armature",
            armature_name,
            "--action-name",
            action_name,
            "--start-pose",
            start_pose,
            "--frame-start",
            str(scene.gail_loop_frame_start),
            "--frame-mid",
            str(scene.gail_loop_frame_mid),
            "--frame-end",
            str(scene.gail_loop_frame_end),
            "--category",
            scene.gail_loop_category.strip() or "idle",
        ]
        if mid_pose:
            args.extend(["--mid-pose", mid_pose])
        if end_pose:
            args.extend(["--end-pose", end_pose])
        if scene.gail_generator_save_after_run:
            args.append("--save")

        try:
            run_blender_script_in_process(script_path, args)
        except Exception as exc:  # noqa: BLE001
            self.report({"ERROR"}, str(exc))
            return {"CANCELLED"}

        scene.gail_clip_name = action_name
        scene.gail_generator_action_name = action_name
        scene.gail_action_pick = action_name if bpy.data.actions.get(action_name) else scene.gail_action_pick
        if bpy.data.actions.get(action_name) is not None:
            action = bpy.data.actions[action_name]
            scene.gail_clip_frame_start = int(action.frame_range[0])
            scene.gail_clip_frame_end = int(action.frame_range[1])
            scene.gail_clip_category = scene.gail_loop_category
        self.report({"INFO"}, f"Generated pose clip {action_name}")
        return {"FINISHED"}


class GAIL_OT_export_clip(bpy.types.Operator):
    bl_idname = "gail.export_clip"
    bl_label = "Export Clip"
    bl_description = "Export the active clip directly to the configured PlayCanvas animation path"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        ensure_object_mode()
        armature = find_armature(context, scene.gail_armature_name)
        if armature is None:
            self.report({"ERROR"}, "No armature found.")
            return {"CANCELLED"}

        action = bpy.data.actions.get(scene.gail_clip_name)
        if action is None:
            self.report({"ERROR"}, f"Missing action: {scene.gail_clip_name}")
            return {"CANCELLED"}

        if armature.animation_data is None:
            armature.animation_data_create()
        armature.animation_data.action = action
        context.scene.frame_start = scene.gail_clip_frame_start
        context.scene.frame_end = scene.gail_clip_frame_end

        bpy.ops.object.select_all(action="DESELECT")
        armature.select_set(True)
        context.view_layer.objects.active = armature
        for obj in meshes_skinned_to_armature(armature):
            obj.select_set(True)

        filepath = get_assets_root(scene) / choose_clip_runtime_path(scene)
        export_selected_objects(
            filepath=filepath,
            export_morph=True,
            export_animations=True,
            profile_name=scene.gail_export_profile,
        )
        self.report({"INFO"}, f"Exported clip to {filepath}")
        return {"FINISHED"}


class GAIL_OT_run_pipeline(bpy.types.Operator):
    bl_idname = "gail.run_pipeline"
    bl_label = "Run Full Pipeline"
    bl_description = "Run the repo-level PlayCanvas export pipeline script"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        script_path = get_pipeline_script_path(scene)
        if not script_path.exists():
            self.report({"ERROR"}, f"Missing pipeline script: {script_path}")
            return {"CANCELLED"}

        command = [
            "powershell",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(script_path),
        ]
        if scene.gail_pipeline_include_review:
            command.append("-IncludeReview")
        command.extend(["-RuntimeProfile", scene.gail_export_profile])

        try:
            completed = subprocess.run(
                command,
                cwd=str(get_repo_root(scene)),
                capture_output=True,
                text=True,
                check=False,
            )
        except OSError as exc:
            self.report({"ERROR"}, f"Failed to start pipeline: {exc}")
            return {"CANCELLED"}

        if completed.returncode != 0:
            self.report({"ERROR"}, completed.stderr[-240:] or f"Pipeline failed with code {completed.returncode}")
            return {"CANCELLED"}

        self.report({"INFO"}, "Pipeline finished successfully.")
        return {"FINISHED"}


class GAIL_OT_run_generator(bpy.types.Operator):
    bl_idname = "gail.run_generator"
    bl_label = "Run Generator"
    bl_description = "Run one of the repo's existing animation generators in the current Blender session"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        try:
            script_path, args, output_name = generator_script_and_args(scene)
            run_blender_script_in_process(script_path, args)
        except Exception as exc:  # noqa: BLE001
            self.report({"ERROR"}, str(exc))
            return {"CANCELLED"}

        scene.gail_clip_name = output_name
        scene.gail_generator_action_name = output_name
        if bpy.data.actions.get(output_name) is not None:
            scene.gail_action_pick = output_name
            action = bpy.data.actions[output_name]
            if hasattr(action, "frame_range"):
                scene.gail_clip_frame_start = int(action.frame_range[0])
                scene.gail_clip_frame_end = int(action.frame_range[1])

        self.report({"INFO"}, f"Generated {output_name}")
        return {"FINISHED"}


class GAIL_OT_run_rokoko_retarget(bpy.types.Operator):
    bl_idname = "gail.run_rokoko_retarget"
    bl_label = "Import And Retarget FBX"
    bl_description = "Import a source FBX clip and retarget it onto Gail using the current Rokoko-based backend"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        script_path = get_rokoko_retarget_script_path(scene)
        source_fbx = resolve_scene_path(scene, scene.gail_rokoko_fbx_path.strip())
        if not str(source_fbx):
            self.report({"ERROR"}, "Choose a source FBX first.")
            return {"CANCELLED"}
        if not script_path.exists():
            self.report({"ERROR"}, f"Missing FBX retarget script: {script_path}")
            return {"CANCELLED"}
        if not source_fbx.exists():
            self.report({"ERROR"}, f"Missing source FBX: {source_fbx}")
            return {"CANCELLED"}

        clip_name = scene.gail_rokoko_clip_name.strip()
        args = [
            "--source-fbx",
            str(source_fbx),
            "--use-pose",
            scene.gail_rokoko_use_pose,
        ]

        if scene.gail_armature_name.strip():
            args.extend(["--target-armature", scene.gail_armature_name.strip()])
        if clip_name:
            args.extend(["--clip-name", clip_name])
        if scene.gail_rokoko_auto_scale:
            args.append("--auto-scale")
        if scene.gail_rokoko_keep_imported:
            args.append("--keep-imported")
        if scene.gail_rokoko_save_after_run:
            args.append("--save")

        try:
            run_blender_script_in_process(script_path, args)
        except Exception as exc:  # noqa: BLE001
            self.report({"ERROR"}, str(exc))
            return {"CANCELLED"}

        final_name = clip_name or f"{source_fbx.stem.lower().replace(' ', '_')}_retarget"
        scene.gail_clip_name = final_name
        scene.gail_action_pick = final_name if bpy.data.actions.get(final_name) else scene.gail_action_pick
        scene.gail_generator_action_name = final_name
        if scene.gail_rokoko_category.strip():
            scene.gail_clip_category = scene.gail_rokoko_category.strip()
        if bpy.data.actions.get(final_name) is not None:
            action = bpy.data.actions[final_name]
            scene.gail_clip_frame_start = int(action.frame_range[0])
            scene.gail_clip_frame_end = int(action.frame_range[1])

        self.report({"INFO"}, "FBX retarget complete.")
        return {"FINISHED"}


class GAIL_PT_export_tools(bpy.types.Panel):
    bl_label = "Gail Export"
    bl_idname = "GAIL_PT_export_tools"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Gail Export"
    bl_context = "objectmode"

    def draw(self, context: bpy.types.Context):
        layout = self.layout
        scene = context.scene

        box = layout.box()
        box.label(text="Paths")
        box.label(text="Author In gail_rig_master.blend")
        box.prop(scene, "gail_repo_root")
        box.prop(scene, "gail_import_path")
        box.operator("gail.import_glb", icon="IMPORT")
        box.operator("gail.scan_scene", icon="VIEWZOOM")
        box.prop(scene, "gail_armature_pick")
        box.prop(scene, "gail_action_pick")
        box.operator("gail.apply_picks", icon="CHECKMARK")

        meshes = selected_meshes(context)
        armature = find_armature(context, scene.gail_armature_name)
        info = layout.box()
        info.label(text="Scene")
        info.label(text=f"Selected Meshes: {len(meshes)}")
        info.label(text=f"Armature: {armature.name if armature else 'None'}")
        info.prop(scene, "gail_export_profile")

        module = layout.box()
        module.label(text="Module Builder")
        module.prop(scene, "gail_module_id")
        module.prop(scene, "gail_module_display_name")
        module.prop(scene, "gail_module_kind")
        module.prop(scene, "gail_avatar_id")
        module.prop(scene, "gail_avatar_export_mode")
        module.prop(scene, "gail_module_slot")
        if scene.gail_module_kind == "clothing":
            module.prop(scene, "gail_clothing_export_mode")
            if scene.gail_clothing_export_mode == "set":
                module.prop(scene, "gail_clothing_set_id")
        module.prop(scene, "gail_module_relative_path")
        module.prop(scene, "gail_module_required")
        module.prop(scene, "gail_module_auto_load")
        module.prop(scene, "gail_sync_partition_manifest")
        module.operator("gail.register_module", icon="FILE_TICK")
        module.operator("gail.export_module", icon="EXPORT")

        clip = layout.box()
        clip.label(text="Animation Builder")
        clip.prop(scene, "gail_clip_name")
        clip.prop(scene, "gail_clip_display_name")
        clip.prop(scene, "gail_clip_category")
        clip.prop(scene, "gail_clip_status")
        clip.prop(scene, "gail_clip_version")
        clip.prop(scene, "gail_clip_frame_start")
        clip.prop(scene, "gail_clip_frame_end")
        clip.prop(scene, "gail_clip_loop")
        clip.prop(scene, "gail_clip_notes")
        clip.prop(scene, "gail_register_clip_as_runtime_asset")
        if scene.gail_register_clip_as_runtime_asset:
            clip.prop(scene, "gail_clip_runtime_relative_path")
            clip.prop(scene, "gail_clip_required")
            clip.prop(scene, "gail_clip_auto_load")
        clip.operator("gail.register_clip", icon="ACTION")
        clip.operator("gail.export_clip", icon="ANIM")

        pose = layout.box()
        pose.label(text="Pose Planner")
        pose.prop(scene, "gail_pose_plan_pick")
        pose.operator("gail.use_pose_plan", icon="PRESET")
        pose.operator("gail.seed_pose_plan", icon="OUTLINER_DATA_ARMATURE")
        pose.separator()
        pose.label(text="Pose Library")
        pose.prop(scene, "gail_pose_pick")
        pose.prop(scene, "gail_pose_name")
        pose.prop(scene, "gail_pose_type")
        pose.prop(scene, "gail_pose_role")
        pose.prop(scene, "gail_pose_family")
        pose.prop(scene, "gail_pose_loop_usage")
        pose.prop(scene, "gail_pose_status")
        pose.prop(scene, "gail_pose_frame")
        pose.prop(scene, "gail_pose_notes")
        pose.prop(scene, "gail_pose_save_after_capture")
        pose.operator("gail.capture_pose", icon="ARMATURE_DATA")
        pose.operator("gail.apply_pose", icon="POSE_HLT")
        pose.prop(scene, "gail_pose_library_path")
        pose.prop(scene, "gail_pose_import_prefix")
        pose.operator("gail.import_pose_library", icon="IMPORT")

        loop_builder = layout.box()
        loop_builder.label(text="Pose Clip Builder")
        loop_builder.prop(scene, "gail_loop_action_name")
        loop_builder.prop(scene, "gail_loop_category")
        loop_builder.prop(scene, "gail_loop_start_pose")
        loop_builder.prop(scene, "gail_loop_mid_pose")
        loop_builder.prop(scene, "gail_loop_end_pose")
        loop_builder.prop(scene, "gail_loop_frame_start")
        loop_builder.prop(scene, "gail_loop_frame_mid")
        loop_builder.prop(scene, "gail_loop_frame_end")
        loop_builder.operator("gail.generate_pose_loop", icon="ACTION")

        generator = layout.box()
        generator.label(text="Legacy Generators")
        generator.prop(scene, "gail_generator_preset")
        generator.prop(scene, "gail_generator_action_name")
        generator.prop(scene, "gail_generator_config_path")
        generator.prop(scene, "gail_generator_save_after_run")
        generator.operator("gail.run_generator", icon="MODIFIER")

        rokoko = layout.box()
        rokoko.label(text="FBX Retarget")
        rokoko.prop(scene, "gail_rokoko_fbx_path")
        rokoko.prop(scene, "gail_rokoko_clip_name")
        rokoko.prop(scene, "gail_rokoko_category")
        rokoko.prop(scene, "gail_rokoko_use_pose")
        rokoko.prop(scene, "gail_rokoko_auto_scale")
        rokoko.prop(scene, "gail_rokoko_keep_imported")
        rokoko.prop(scene, "gail_rokoko_save_after_run")
        rokoko.label(text="Current backend: Rokoko retarget script")
        rokoko.operator("gail.run_rokoko_retarget", icon="CONSTRAINT_BONE")

        pipeline = layout.box()
        pipeline.label(text="Pipeline")
        pipeline.prop(scene, "gail_pipeline_include_review")
        pipeline.operator("gail.run_pipeline", icon="PLAY")


CLASSES = (
    GAIL_OT_scan_scene,
    GAIL_OT_apply_picks,
    GAIL_OT_import_glb,
    GAIL_OT_register_module,
    GAIL_OT_export_module,
    GAIL_OT_register_clip,
    GAIL_OT_capture_pose,
    GAIL_OT_use_pose_plan,
    GAIL_OT_seed_pose_plan,
    GAIL_OT_apply_pose,
    GAIL_OT_import_pose_library,
    GAIL_OT_generate_pose_loop,
    GAIL_OT_export_clip,
    GAIL_OT_run_pipeline,
    GAIL_OT_run_generator,
    GAIL_OT_run_rokoko_retarget,
    GAIL_PT_export_tools,
)


def register_properties() -> None:
    bpy.types.Scene.gail_repo_root = StringProperty(
        name="Repo Root",
        subtype="DIR_PATH",
        default=str(infer_repo_root()),
    )
    bpy.types.Scene.gail_import_path = StringProperty(
        name="GLB Path",
        subtype="FILE_PATH",
        default="",
    )
    bpy.types.Scene.gail_armature_pick = EnumProperty(name="Armature Pick", items=armature_items)
    bpy.types.Scene.gail_action_pick = EnumProperty(name="Action Pick", items=action_items)
    bpy.types.Scene.gail_armature_name = StringProperty(name="Armature", default="")
    bpy.types.Scene.gail_armature_data_name = StringProperty(name="Armature Data", default="")
    bpy.types.Scene.gail_module_id = StringProperty(name="Module ID", default="")
    bpy.types.Scene.gail_module_display_name = StringProperty(name="Display Name", default="")
    bpy.types.Scene.gail_module_kind = EnumProperty(
        name="Kind",
        items=[
            ("avatar", "Avatar", ""),
            ("hair", "Hair", ""),
            ("clothing", "Clothing", ""),
            ("accessory", "Accessory", ""),
            ("animation", "Animation", ""),
            ("background", "Background", ""),
        ],
        default="clothing",
    )
    bpy.types.Scene.gail_module_slot = StringProperty(name="Slot", default="")
    bpy.types.Scene.gail_avatar_id = StringProperty(name="Avatar ID", default="gail_default")
    bpy.types.Scene.gail_avatar_export_mode = EnumProperty(
        name="Avatar Export",
        items=[
            ("new_avatar", "New Avatar", ""),
            ("existing_avatar_update", "Existing Avatar Update", ""),
        ],
        default="new_avatar",
    )
    bpy.types.Scene.gail_avatar_folder = StringProperty(name="Avatar Folder", default="base_face")
    bpy.types.Scene.gail_export_profile = EnumProperty(
        name="Runtime Profile",
        items=export_profile_items,
        default="high",
    )
    bpy.types.Scene.gail_clothing_export_mode = EnumProperty(
        name="Clothing Export",
        items=[
            ("pieces", "Individual Pieces", ""),
            ("set", "Complete Set", ""),
        ],
        default="pieces",
    )
    bpy.types.Scene.gail_clothing_set_id = StringProperty(name="Clothing Set ID", default="")
    bpy.types.Scene.gail_module_relative_path = StringProperty(name="Relative Path", default="")
    bpy.types.Scene.gail_module_required = BoolProperty(name="Required", default=False)
    bpy.types.Scene.gail_module_auto_load = BoolProperty(name="Auto Load", default=False)
    bpy.types.Scene.gail_sync_partition_manifest = BoolProperty(name="Sync Partition Manifest", default=True)
    bpy.types.Scene.gail_clip_name = StringProperty(name="Clip Name", default="")
    bpy.types.Scene.gail_clip_display_name = StringProperty(name="Clip Display Name", default="")
    bpy.types.Scene.gail_clip_category = StringProperty(name="Category", default="idle")
    bpy.types.Scene.gail_clip_status = EnumProperty(
        name="Status",
        items=[
            ("approved", "Approved", ""),
            ("review", "Review", ""),
            ("deprecated", "Deprecated", ""),
        ],
        default="approved",
    )
    bpy.types.Scene.gail_clip_version = IntProperty(name="Version", default=1, min=1)
    bpy.types.Scene.gail_clip_frame_start = IntProperty(name="Frame Start", default=1, min=0)
    bpy.types.Scene.gail_clip_frame_end = IntProperty(name="Frame End", default=96, min=1)
    bpy.types.Scene.gail_clip_loop = BoolProperty(name="Loop", default=True)
    bpy.types.Scene.gail_clip_notes = StringProperty(name="Notes", default="")
    bpy.types.Scene.gail_register_clip_as_runtime_asset = BoolProperty(name="Register As Runtime Asset", default=True)
    bpy.types.Scene.gail_clip_runtime_relative_path = StringProperty(name="Runtime Path", default="")
    bpy.types.Scene.gail_clip_required = BoolProperty(name="Clip Required", default=False)
    bpy.types.Scene.gail_clip_auto_load = BoolProperty(name="Clip Auto Load", default=False)
    bpy.types.Scene.gail_pose_plan_pick = EnumProperty(name="Planned Pose", items=pose_plan_items)
    bpy.types.Scene.gail_pose_pick = EnumProperty(name="Pose Pick", items=pose_action_items)
    bpy.types.Scene.gail_pose_name = StringProperty(name="Pose Name", default="pose_idle_confident_v1")
    bpy.types.Scene.gail_pose_type = EnumProperty(
        name="Pose Type",
        items=[
            ("base_pose", "Base Pose", ""),
            ("gesture_pose", "Gesture Pose", ""),
            ("contact_pose", "Contact Pose", ""),
            ("expression_pose", "Expression Pose", ""),
            ("custom_pose", "Custom Pose", ""),
        ],
        default="base_pose",
    )
    bpy.types.Scene.gail_pose_role = EnumProperty(
        name="Pose Role",
        items=[
            ("loop_anchor", "Loop Anchor", ""),
            ("loop_midpoint", "Loop Midpoint", ""),
            ("sequence_key", "Sequence Key", ""),
        ],
        default="loop_anchor",
    )
    bpy.types.Scene.gail_pose_family = StringProperty(name="Pose Family", default="neutral_idle")
    bpy.types.Scene.gail_pose_loop_usage = EnumProperty(
        name="Loop Usage",
        items=[
            ("seamless", "Seamless Loop", ""),
            ("short_loop", "Short Loop", ""),
            ("sequence", "Sequence", ""),
        ],
        default="seamless",
    )
    bpy.types.Scene.gail_pose_status = EnumProperty(
        name="Pose Status",
        items=[
            ("approved", "Approved", ""),
            ("review", "Review", ""),
            ("capture_next", "Capture Next", ""),
        ],
        default="approved",
    )
    bpy.types.Scene.gail_pose_frame = IntProperty(name="Pose Frame", default=1, min=0)
    bpy.types.Scene.gail_pose_notes = StringProperty(name="Pose Notes", default="")
    bpy.types.Scene.gail_pose_save_after_capture = BoolProperty(name="Save After Capture", default=False)
    bpy.types.Scene.gail_pose_library_path = StringProperty(name="Pose Library Blend", subtype="FILE_PATH", default="")
    bpy.types.Scene.gail_pose_import_prefix = StringProperty(name="Pose Prefix", default="pose_")
    bpy.types.Scene.gail_loop_action_name = StringProperty(name="Clip Name", default="loop_custom_v1")
    bpy.types.Scene.gail_loop_category = StringProperty(name="Category", default="idle")
    bpy.types.Scene.gail_loop_start_pose = EnumProperty(name="Start Pose", items=pose_action_items)
    bpy.types.Scene.gail_loop_mid_pose = EnumProperty(name="Mid Pose", items=pose_action_items)
    bpy.types.Scene.gail_loop_end_pose = EnumProperty(name="End Pose", items=pose_action_items)
    bpy.types.Scene.gail_loop_frame_start = IntProperty(name="Start Frame", default=1, min=0)
    bpy.types.Scene.gail_loop_frame_mid = IntProperty(name="Mid Frame", default=48, min=0)
    bpy.types.Scene.gail_loop_frame_end = IntProperty(name="End Frame", default=96, min=1)
    bpy.types.Scene.gail_pipeline_include_review = BoolProperty(name="Include Review Clips", default=False)
    bpy.types.Scene.gail_generator_preset = EnumProperty(
        name="Preset",
        items=[
            ("capture_pose", "Capture Pose", ""),
            ("nod_small_v1", "Legacy Nod Test", ""),
            ("idle_body", "Generate Idle Body", ""),
            ("idle_face", "Generate Idle Face", ""),
            ("listen_body", "Generate Listen Body", ""),
            ("talk_body", "Generate Talk Body", ""),
        ],
        default="idle_body",
    )
    bpy.types.Scene.gail_generator_action_name = StringProperty(name="Generated Action", default="")
    bpy.types.Scene.gail_generator_config_path = StringProperty(name="Config Override", subtype="FILE_PATH", default="")
    bpy.types.Scene.gail_generator_save_after_run = BoolProperty(name="Save File", default=False)
    bpy.types.Scene.gail_rokoko_fbx_path = StringProperty(name="Source FBX", subtype="FILE_PATH", default="")
    bpy.types.Scene.gail_rokoko_clip_name = StringProperty(name="Imported Clip Name", default="")
    bpy.types.Scene.gail_rokoko_category = StringProperty(name="Category", default="idle")
    bpy.types.Scene.gail_rokoko_use_pose = EnumProperty(
        name="Retarget Pose",
        items=[
            ("CURRENT", "Current", ""),
            ("REST", "Rest", ""),
        ],
        default="CURRENT",
    )
    bpy.types.Scene.gail_rokoko_auto_scale = BoolProperty(name="Auto Scale", default=False)
    bpy.types.Scene.gail_rokoko_keep_imported = BoolProperty(name="Keep Imported Source", default=False)
    bpy.types.Scene.gail_rokoko_save_after_run = BoolProperty(name="Save File", default=False)


def unregister_properties() -> None:
    names = [
        "gail_repo_root",
        "gail_import_path",
        "gail_armature_pick",
        "gail_action_pick",
        "gail_armature_name",
        "gail_armature_data_name",
        "gail_module_id",
        "gail_module_display_name",
        "gail_module_kind",
        "gail_module_slot",
        "gail_avatar_id",
        "gail_avatar_export_mode",
        "gail_avatar_folder",
        "gail_export_profile",
        "gail_clothing_export_mode",
        "gail_clothing_set_id",
        "gail_module_relative_path",
        "gail_module_required",
        "gail_module_auto_load",
        "gail_sync_partition_manifest",
        "gail_clip_name",
        "gail_clip_display_name",
        "gail_clip_category",
        "gail_clip_status",
        "gail_clip_version",
        "gail_clip_frame_start",
        "gail_clip_frame_end",
        "gail_clip_loop",
        "gail_clip_notes",
        "gail_register_clip_as_runtime_asset",
        "gail_clip_runtime_relative_path",
        "gail_clip_required",
        "gail_clip_auto_load",
        "gail_pose_plan_pick",
        "gail_pose_pick",
        "gail_pose_name",
        "gail_pose_type",
        "gail_pose_role",
        "gail_pose_family",
        "gail_pose_loop_usage",
        "gail_pose_status",
        "gail_pose_frame",
        "gail_pose_notes",
        "gail_pose_save_after_capture",
        "gail_pose_library_path",
        "gail_pose_import_prefix",
        "gail_loop_action_name",
        "gail_loop_category",
        "gail_loop_start_pose",
        "gail_loop_mid_pose",
        "gail_loop_end_pose",
        "gail_loop_frame_start",
        "gail_loop_frame_mid",
        "gail_loop_frame_end",
        "gail_pipeline_include_review",
        "gail_generator_preset",
        "gail_generator_action_name",
        "gail_generator_config_path",
        "gail_generator_save_after_run",
        "gail_rokoko_fbx_path",
        "gail_rokoko_clip_name",
        "gail_rokoko_category",
        "gail_rokoko_use_pose",
        "gail_rokoko_auto_scale",
        "gail_rokoko_keep_imported",
        "gail_rokoko_save_after_run",
    ]
    for name in names:
        if hasattr(bpy.types.Scene, name):
            delattr(bpy.types.Scene, name)


def register():
    register_properties()
    for cls in CLASSES:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(CLASSES):
        try:
            bpy.utils.unregister_class(cls)
        except RuntimeError:
            pass
    unregister_properties()


if __name__ == "__main__":
    register()
