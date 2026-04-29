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


def get_bone_map_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "blender" / "animation_master" / "manifests" / "bone_map.gail.json"


def get_pipeline_script_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "tools" / "export-playcanvas-pipeline.ps1"


def get_mixamo_retarget_script_path(scene: bpy.types.Scene) -> Path:
    return get_repo_root(scene) / "blender" / "animation_master" / "scripts" / "mixamo_to_gail.py"


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


def choose_module_relative_path(scene: bpy.types.Scene) -> str:
    if scene.gail_module_relative_path.strip():
        return scene.gail_module_relative_path.strip().replace("\\", "/")

    module_id = slugify(scene.gail_module_id)
    kind = scene.gail_module_kind
    if kind == "avatar":
        return f"gail/avatar/{scene.gail_avatar_folder}/{module_id}.glb"
    if kind == "hair":
        return f"gail/hair/{module_id}/{module_id}.glb"
    if kind == "clothing":
        return f"gail/clothes/{module_id}/{module_id}.glb"
    if kind == "accessory":
        return f"gail/accessories/{module_id}/{module_id}.glb"
    if kind == "animation":
        return f"animations/{module_id}.glb"
    return f"backgrounds/{module_id}.jpg"


def choose_clip_runtime_path(scene: bpy.types.Scene) -> str:
    if scene.gail_clip_runtime_relative_path.strip():
        return scene.gail_clip_runtime_relative_path.strip().replace("\\", "/")
    return f"animations/{slugify(scene.gail_clip_name)}.glb"


def module_search_directories(kind: str, relative_path: str) -> list[str]:
    directory = str(Path(relative_path).parent).replace("\\", "/")
    if kind == "avatar":
        return ["gail/avatar"]
    if kind == "hair":
        return ["gail/hair"]
    if kind == "clothing":
        return ["gail/clothes"]
    if kind == "accessory":
        return ["gail/accessories"]
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
    payload.setdefault("project", "gail")
    payload.setdefault("source_master_file", str(Path(bpy.data.filepath)))
    payload.setdefault("regular_avatar_file", str(get_repo_root(scene) / "gail_rig.blend"))
    payload["armature_object"] = armature_name

    output_folder = str((get_assets_root(scene) / Path(relative_path).parent).resolve())

    if kind == "avatar":
        payload["body_face_group"] = {
            "objects": mesh_names,
            "output_folder": output_folder,
        }
        save_json(manifest_path, payload)
        return

    key_map = {
        "hair": "hair_groups",
        "clothing": "clothing_groups",
        "accessory": "accessory_groups",
    }
    list_key = key_map.get(kind)
    if not list_key:
        save_json(manifest_path, payload)
        return

    payload.setdefault(list_key, [])
    group_entry = {
        "name": module_id,
        "objects": mesh_names,
        "output_folder": output_folder,
    }

    replaced = False
    for index, entry in enumerate(payload[list_key]):
        if entry.get("name") == module_id:
            payload[list_key][index] = group_entry
            replaced = True
            break
    if not replaced:
        payload[list_key].append(group_entry)

    save_json(manifest_path, payload)


def upsert_clip_registry(scene: bpy.types.Scene, clip_name: str, frame_start: int, frame_end: int) -> None:
    manifest_path = get_clip_registry_path(scene)
    payload = load_json(manifest_path)
    payload.setdefault("manifest_version", "v1")
    payload.setdefault("project", "gail")
    payload.setdefault("master_file", str(get_repo_root(scene) / "gail_rig.blend"))
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
            "source_file": Path(bpy.data.filepath).name,
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


def build_asset_entry(scene: bpy.types.Scene, module_id: str, relative_path: str) -> dict:
    return {
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


def export_selected_objects(filepath: Path, export_morph: bool, export_animations: bool) -> None:
    filepath.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        export_format="GLB",
        use_selection=True,
        export_animations=export_animations,
        export_nla_strips=False,
        export_animation_mode="ACTIVE_ACTIONS",
        export_force_sampling=True,
        export_skins=True,
        export_morph=export_morph,
        export_morph_animation=export_animations and export_morph,
        export_yup=True,
    )


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
        final_name = action_name or "nod_small_v1"
        args = ["--armature", armature_name, "--action-name", final_name]
        if body_bones.get("head"):
            args.extend(["--head-bone", body_bones["head"]])
        if body_bones.get("neck"):
            args.extend(["--neck-bone", body_bones["neck"]])
        if body_bones.get("chest"):
            args.extend(["--chest-bone", body_bones["chest"]])
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

        module_id = slugify(scene.gail_module_id or meshes[0].name)
        relative_path = choose_module_relative_path(scene)
        armature = find_armature(context, scene.gail_armature_name)
        if scene.gail_sync_partition_manifest and not armature:
            self.report({"ERROR"}, "No armature found for partition sync.")
            return {"CANCELLED"}

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


class GAIL_OT_run_mixamo_retarget(bpy.types.Operator):
    bl_idname = "gail.run_mixamo_retarget"
    bl_label = "Retarget Mixamo FBX"
    bl_description = "Import a Mixamo FBX and retarget it onto Gail's armature"

    def execute(self, context: bpy.types.Context):
        scene = context.scene
        script_path = get_mixamo_retarget_script_path(scene)
        source_fbx = resolve_scene_path(scene, scene.gail_mixamo_fbx_path.strip())
        if not str(source_fbx):
            self.report({"ERROR"}, "Choose a Mixamo FBX first.")
            return {"CANCELLED"}
        if not script_path.exists():
            self.report({"ERROR"}, f"Missing retarget script: {script_path}")
            return {"CANCELLED"}
        if not source_fbx.exists():
            self.report({"ERROR"}, f"Missing source FBX: {source_fbx}")
            return {"CANCELLED"}

        args = [
            "--source-fbx",
            str(source_fbx),
            "--category",
            scene.gail_mixamo_category.strip() or "gesture",
            "--status",
            scene.gail_mixamo_status,
            "--retargeted-by",
            scene.gail_mixamo_retargeted_by.strip() or "gail_mixamo_pass_01",
            "--cleanup-pass",
            scene.gail_mixamo_cleanup_pass.strip() or "mixamo_import",
        ]

        if scene.gail_armature_name.strip():
            args.extend(["--target-armature", scene.gail_armature_name.strip()])
        if scene.gail_mixamo_clip_name.strip():
            args.extend(["--clip-name", scene.gail_mixamo_clip_name.strip()])
        if scene.gail_mixamo_loop:
            args.append("--loop")
        if scene.gail_mixamo_register:
            args.append("--register")
        if scene.gail_mixamo_keep_imported:
            args.append("--keep-imported")
        if scene.gail_mixamo_save_after_run:
            args.append("--save")

        try:
            run_blender_script_in_process(script_path, args)
        except Exception as exc:  # noqa: BLE001
            self.report({"ERROR"}, str(exc))
            return {"CANCELLED"}

        self.report({"INFO"}, "Mixamo retarget complete.")
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

        module = layout.box()
        module.label(text="Module Builder")
        module.prop(scene, "gail_module_id")
        module.prop(scene, "gail_module_display_name")
        module.prop(scene, "gail_module_kind")
        module.prop(scene, "gail_module_slot")
        if scene.gail_module_kind == "avatar":
            module.prop(scene, "gail_avatar_folder")
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

        generator = layout.box()
        generator.label(text="Generator")
        generator.prop(scene, "gail_generator_preset")
        generator.prop(scene, "gail_generator_action_name")
        generator.prop(scene, "gail_generator_config_path")
        generator.prop(scene, "gail_generator_save_after_run")
        generator.operator("gail.run_generator", icon="MODIFIER")

        mixamo = layout.box()
        mixamo.label(text="Mixamo")
        mixamo.prop(scene, "gail_mixamo_fbx_path")
        mixamo.prop(scene, "gail_mixamo_clip_name")
        mixamo.prop(scene, "gail_mixamo_category")
        mixamo.prop(scene, "gail_mixamo_status")
        mixamo.prop(scene, "gail_mixamo_loop")
        mixamo.prop(scene, "gail_mixamo_register")
        mixamo.prop(scene, "gail_mixamo_keep_imported")
        mixamo.prop(scene, "gail_mixamo_save_after_run")
        mixamo.operator("gail.run_mixamo_retarget", icon="ARMATURE_DATA")

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
    GAIL_OT_export_clip,
    GAIL_OT_run_pipeline,
    GAIL_OT_run_generator,
    GAIL_OT_run_mixamo_retarget,
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
    bpy.types.Scene.gail_avatar_folder = StringProperty(name="Avatar Folder", default="base_face")
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
    bpy.types.Scene.gail_pipeline_include_review = BoolProperty(name="Include Review Clips", default=False)
    bpy.types.Scene.gail_generator_preset = EnumProperty(
        name="Preset",
        items=[
            ("capture_pose", "Capture Pose", ""),
            ("nod_small_v1", "Generate Nod", ""),
            ("idle_body", "Generate Idle Body", ""),
            ("idle_face", "Generate Idle Face", ""),
            ("listen_body", "Generate Listen Body", ""),
            ("talk_body", "Generate Talk Body", ""),
        ],
        default="nod_small_v1",
    )
    bpy.types.Scene.gail_generator_action_name = StringProperty(name="Generated Action", default="")
    bpy.types.Scene.gail_generator_config_path = StringProperty(name="Config Override", subtype="FILE_PATH", default="")
    bpy.types.Scene.gail_generator_save_after_run = BoolProperty(name="Save File", default=False)
    bpy.types.Scene.gail_mixamo_fbx_path = StringProperty(name="Mixamo FBX", subtype="FILE_PATH", default="")
    bpy.types.Scene.gail_mixamo_clip_name = StringProperty(name="Clip Name", default="")
    bpy.types.Scene.gail_mixamo_category = StringProperty(name="Category", default="gesture")
    bpy.types.Scene.gail_mixamo_status = EnumProperty(
        name="Status",
        items=[
            ("approved", "Approved", ""),
            ("review", "Review", ""),
            ("deprecated", "Deprecated", ""),
        ],
        default="review",
    )
    bpy.types.Scene.gail_mixamo_loop = BoolProperty(name="Loop", default=False)
    bpy.types.Scene.gail_mixamo_register = BoolProperty(name="Register Clip", default=True)
    bpy.types.Scene.gail_mixamo_keep_imported = BoolProperty(name="Keep Imported", default=False)
    bpy.types.Scene.gail_mixamo_save_after_run = BoolProperty(name="Save File", default=False)
    bpy.types.Scene.gail_mixamo_retargeted_by = StringProperty(name="Retargeted By", default="gail_mixamo_pass_01")
    bpy.types.Scene.gail_mixamo_cleanup_pass = StringProperty(name="Cleanup Pass", default="mixamo_import")


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
        "gail_avatar_folder",
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
        "gail_pipeline_include_review",
        "gail_generator_preset",
        "gail_generator_action_name",
        "gail_generator_config_path",
        "gail_generator_save_after_run",
        "gail_mixamo_fbx_path",
        "gail_mixamo_clip_name",
        "gail_mixamo_category",
        "gail_mixamo_status",
        "gail_mixamo_loop",
        "gail_mixamo_register",
        "gail_mixamo_keep_imported",
        "gail_mixamo_save_after_run",
        "gail_mixamo_retargeted_by",
        "gail_mixamo_cleanup_pass",
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
        bpy.utils.unregister_class(cls)
    unregister_properties()


if __name__ == "__main__":
    register()
