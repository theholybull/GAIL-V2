import argparse
import json
import sys
from pathlib import Path

import bpy


SCRIPT_ROOT = Path(__file__).resolve().parent
if str(SCRIPT_ROOT) not in sys.path:
    sys.path.insert(0, str(SCRIPT_ROOT))

from animoxtend_local_retarget_export import (  # noqa: E402
    configure_scene,
    ensure_addon_registered,
    ensure_dir,
    find_armature,
    find_or_create_buffer_human,
    load_source_motion,
    retarget_to_target,
    write_json,
)


def parse_args() -> argparse.Namespace:
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    return parser.parse_args(argv)


def read_json(path: Path):
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def remove_action_if_exists(action_name: str) -> None:
    action = bpy.data.actions.get(action_name)
    if action is not None:
        bpy.data.actions.remove(action)


def ensure_action_fake_user(action_name: str):
    action = bpy.data.actions.get(action_name)
    if action is None:
        raise RuntimeError(f"Missing action after retarget: {action_name}")
    action.use_fake_user = True
    return action


def clone_keyframe(source_keyframe, dest_keyframe, frame_offset: float) -> None:
    dest_keyframe.co = (source_keyframe.co.x + frame_offset, source_keyframe.co.y)
    dest_keyframe.handle_left = (
        source_keyframe.handle_left.x + frame_offset,
        source_keyframe.handle_left.y,
    )
    dest_keyframe.handle_right = (
        source_keyframe.handle_right.x + frame_offset,
        source_keyframe.handle_right.y,
    )
    dest_keyframe.interpolation = source_keyframe.interpolation
    dest_keyframe.easing = source_keyframe.easing
    dest_keyframe.handle_left_type = source_keyframe.handle_left_type
    dest_keyframe.handle_right_type = source_keyframe.handle_right_type


def append_action_into_sequence(destination_action, source_action, frame_offset: int, hold_frames: int) -> int:
    source_start = int(source_action.frame_range[0])
    source_end = int(source_action.frame_range[1])
    inserted_end = source_end + frame_offset

    for source_curve in source_action.fcurves:
        destination_curve = destination_action.fcurves.find(source_curve.data_path, index=source_curve.array_index)
        if destination_curve is None:
            destination_curve = destination_action.fcurves.new(source_curve.data_path, index=source_curve.array_index)
            destination_curve.group = source_curve.group

        for source_keyframe in source_curve.keyframe_points:
            destination_keyframe = destination_curve.keyframe_points.insert(
                source_keyframe.co.x + frame_offset,
                source_keyframe.co.y,
                options={"FAST"},
            )
            clone_keyframe(source_keyframe, destination_keyframe, frame_offset)

        if hold_frames > 0:
            hold_frame = inserted_end + hold_frames
            hold_value = source_curve.evaluate(source_end)
            hold_keyframe = destination_curve.keyframe_points.insert(hold_frame, hold_value, options={"FAST"})
            hold_keyframe.interpolation = "CONSTANT"

            for keyframe in destination_curve.keyframe_points:
                if int(round(keyframe.co.x)) == inserted_end:
                    keyframe.interpolation = "CONSTANT"

        destination_curve.update()

    destination_action.use_fake_user = True
    return inserted_end + hold_frames


def main() -> int:
    args = parse_args()
    manifest_path = Path(args.manifest)
    manifest = read_json(manifest_path)
    report_path = Path(manifest["report_path"])
    progress_path = Path(manifest["progress_path"])
    clips = manifest.get("clips", [])
    total_clips = len(clips)

    report = {
        "manifest_path": str(manifest_path),
        "blend_file": bpy.data.filepath,
        "processed": [],
        "sequence_action": None,
        "errors": [],
    }
    progress = {
        "status": "starting",
        "total": total_clips,
        "completed": 0,
        "failed": 0,
        "current_clip": None,
        "percent": 0,
        "report_path": str(report_path),
    }
    write_json(progress_path, progress)

    try:
        addon_root_parent = Path(manifest["addon_root_parent"])
        api_key = Path(manifest["api_key_file"]).read_text(encoding="utf-8").strip()
        if not api_key:
            raise RuntimeError("API key file is empty")

        ensure_addon_registered(addon_root_parent)

        scene = bpy.context.scene
        source_armature = find_or_create_buffer_human(scene, manifest.get("source_armature_name", "BufferArmature"))
        target_armature = find_armature(manifest["target_armature_name"])
        if target_armature is None:
            raise RuntimeError(f"Target armature not found: {manifest['target_armature_name']}")

        source_root_name = configure_scene(scene, source_armature, target_armature, Path(manifest["target_mapping_path"]))
        sequence_name = str(manifest.get("sequence_name") or "composed_sequence")
        gap_frames_default = int(manifest.get("gap_frames") or 0)
        server_host = manifest.get("server_host", "https://zoe-api.sensetime.com/animoxtend")

        remove_action_if_exists(sequence_name)
        sequence_action = bpy.data.actions.new(sequence_name)
        sequence_action.use_fake_user = True
        cursor_frame = 1

        for clip in clips:
            progress["status"] = "running"
            progress["current_clip"] = clip["action_name"]
            progress["percent"] = int((progress["completed"] / total_clips) * 100) if total_clips else 100
            write_json(progress_path, progress)

            clip_report = {
                "id": clip.get("id"),
                "label": clip.get("label"),
                "source_path": clip.get("source_path"),
                "source_type": clip.get("source_type"),
                "action_name": clip.get("action_name"),
            }
            try:
                source_path = Path(clip["source_path"])
                if source_path.suffix.lower() != ".npz":
                    raise RuntimeError(f"Unsupported source type for compose job: {source_path.suffix or 'unknown'}")
                if not source_path.exists():
                    raise RuntimeError(f"Missing source path: {source_path}")

                remove_action_if_exists(clip["action_name"])
                load_source_motion(source_armature, source_path, clip["action_name"], source_root_name)
                frame_start, frame_end = retarget_to_target(
                    scene,
                    source_armature,
                    target_armature,
                    api_key,
                    server_host,
                    clip["action_name"],
                )
                action = ensure_action_fake_user(clip["action_name"])

                hold_frames = int(clip.get("gap_after_frames") if clip.get("gap_after_frames") is not None else gap_frames_default)
                frame_offset = cursor_frame - frame_start
                sequence_end = append_action_into_sequence(sequence_action, action, frame_offset, hold_frames)
                cursor_frame = sequence_end + 1

                clip_report["frame_start"] = frame_start
                clip_report["frame_end"] = frame_end
                clip_report["sequence_end"] = sequence_end
                clip_report["gap_after_frames"] = hold_frames
                report["processed"].append(clip_report)
                progress["completed"] += 1
                progress["percent"] = int((progress["completed"] / total_clips) * 100) if total_clips else 100
                write_json(progress_path, progress)
                print(f"WORKBENCH_IMPORTED {clip['action_name']}")
            except Exception as exc:  # pragma: no cover
                clip_report["error"] = repr(exc)
                report["errors"].append(clip_report)
                progress["completed"] += 1
                progress["failed"] += 1
                progress["percent"] = int((progress["completed"] / total_clips) * 100) if total_clips else 100
                write_json(progress_path, progress)
                print(f"WORKBENCH_ERROR {clip.get('action_name', 'unknown')} {exc}")

        sequence_action.use_fake_user = True
        report["sequence_action"] = sequence_name

        target_armature.animation_data_create()
        target_armature.animation_data.action = sequence_action
        scene.frame_start = 1
        scene.frame_end = max(int(sequence_action.frame_range[1]), 1)

        output_blend_path = Path(manifest.get("output_blend_path") or bpy.data.filepath)
        ensure_dir(output_blend_path)
        bpy.ops.wm.save_as_mainfile(filepath=str(output_blend_path), copy=False)
        report["output_blend_path"] = str(output_blend_path)
    except Exception as exc:  # pragma: no cover
        report["fatal_error"] = repr(exc)
        progress["status"] = "failed"

    write_json(report_path, report)
    if report.get("fatal_error"):
        progress["status"] = "failed"
    elif report["errors"]:
        progress["status"] = "completed_with_errors"
    else:
        progress["status"] = "completed"
    progress["current_clip"] = None
    progress["percent"] = 100 if total_clips else 0
    write_json(progress_path, progress)

    return 0 if (not report.get("fatal_error") and not report["errors"]) else 1


if __name__ == "__main__":
    raise SystemExit(main())