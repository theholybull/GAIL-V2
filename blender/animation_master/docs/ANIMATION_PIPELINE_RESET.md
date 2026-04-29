# Gail Animation Pipeline Reset

This is the corrected Blender-side workflow for Gail going forward.

## Why The Old Flow Failed

- The master file was acting as model source, pose source, clip source, and runtime source at the same time.
- Base pose was being inferred from frame state instead of stored explicitly.
- Rebuild scripts were copying scene pose state from file to file, which is fragile.
- Clip generation drifted because frame 1 of a clip was not a canonical stored pose.

## New Rules

- The canonical start pose must be stored as a named one-frame action.
- Clip generation starts from `base_pose_action`, not from current armature state.
- Clip tuning stays in JSON.
- The runtime file is disposable.
- The master file can be rebuilt, but only from explicit pose actions and generator configs.

## Files That Matter Now

- `manifests/bone_map.gail.json`
  - stable bone and mesh mapping
- `manifests/pose_registry.gail.json`
  - named pose actions that are approved or awaiting capture
- `manifests/clip_tuning.idle_base_v1.json`
  - all idle tuning, including the required `base_pose_action`
- `manifests/standing_baseline.gail.json`
  - canonical standing start/end anchors reused by standing-family clips
- `scripts/capture_current_pose_as_action.py`
  - captures the current armature pose as a one-frame action
- `scripts/generate_idle_base_v1.py`
  - builds body idle from the configured base pose action
- `scripts/generate_idle_face_v1.py`
  - builds face idle from config
- `scripts/rebuild_idle_from_action.py`
  - regenerates idle actions into a fresh rebuilt master
- `scripts/rebuild_idle_live.ps1`
  - full one-command master + runtime rebuild loop

## What You Will Do

1. Open `F:\Gail\gail_rig_master.blend`.
2. Put Gail into the exact approved start pose.
3. Do not key an animation clip.
4. Leave the rig posed exactly as approved.

## What To Run Next

Capture the pose action:

```powershell
powershell -ExecutionPolicy Bypass -Command "& 'C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe' 'F:\Gail\gail_rig_master.blend' -b --python 'F:\Gail\blender\animation_master\scripts\capture_current_pose_as_action.py' -- --armature 'VAMP Laurina for G8 Female' --action-name 'pose_idle_confident_v1' --frame 1 --save"
```

Then rebuild the idle stack:

```powershell
powershell -ExecutionPolicy Bypass -Command "& 'F:\Gail\blender\animation_master\scripts\rebuild_idle_live.ps1'"
```

## How Iteration Works After Capture

1. Keep `pose_idle_confident_v1` stable unless you intentionally want a new canonical idle pose.
2. For motion changes, edit `manifests/clip_tuning.idle_base_v1.json`.
3. Rebuild.
4. Review in `gail_rig.blend`.

## Standing Baseline Rule

- `standing_core_v1` is now the canonical standing-family baseline.
- Standing clips should record and preserve:
  - `baseline_name`
  - `start_anchor_frame`
  - `end_anchor_frame`
- For the current idle, those anchors are `1` and `96`.
- Future standing clips should close back to their standing baseline unless intentionally authored otherwise.

## When To Create A New Pose

Create a new pose action instead of mutating the old one when:

- the silhouette changes materially
- hand placement changes materially
- stance changes materially
- a different clip family needs a different default posture

Use versioned names:

- `pose_idle_confident_v1`
- `pose_listen_soft_v1`
- `pose_think_shifted_v1`

## Do Not Do These Again

- Do not use `.blend1` as a source of truth.
- Do not treat frame 1 of a clip as the canonical stored pose.
- Do not copy scene pose state from arbitrary files into the master.
- Do not overwrite the master without a backup.

## Continuation Notes

The next successful checkpoint is:

- Gail posed correctly in `gail_rig_master.blend`
- `pose_idle_confident_v1` captured
- `clip_tuning.idle_base_v1.json` referencing that action
- `rebuild_idle_live.ps1` producing a stable rebuild from that pose action

Only after that should idle tuning continue.
