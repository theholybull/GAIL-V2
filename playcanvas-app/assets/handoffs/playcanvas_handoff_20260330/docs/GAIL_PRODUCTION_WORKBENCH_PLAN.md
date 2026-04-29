# Gail Production Workbench Plan

This document connects the new Blender add-on layer to the Gail production pipeline goals.

## Why this exists

The Gail production plan needs more than clip conversion. It needs:

1. canonical start/end poses for seamless action flow
2. easy pose-driven loop generation
3. avatar decomposition into runtime-friendly parts
4. per-avatar tuning for surface look
5. texture tier outputs so the backend can choose quality levels

## First working slice

The first add-on slice lives here:

- `D:\blender\animation_master\addons\gail_production_workbench`

It provides a UI for:

1. capturing a pose as a one-frame action
2. building a loop action from pose anchors
3. forcing an action to start/end on approved poses
4. partitioning avatar meshes into logical buckets
5. tuning skin material response
6. exporting a flat avatar color plus low/medium/high texture tiers

## How this ties to the Gail docs

The strongest overlap with existing Gail pipeline docs is:

- `D:\animation_master\docs\ANIMATION_PIPELINE_RESET.md`
- `D:\blender\animation_master\scripts\generate_pose_loop_clip.py`
- `D:\blender\animation_master\scripts\generate_regular_avatar_from_master.py`

The add-on is intentionally reusing those ideas in a UI-first form.

## What comes next

After the current GLB conversion batch is in a healthier place, the next implementation layer should be:

1. action blending UI using NLA strips and saved pose anchors
2. loop-cleaning tools for start/end position normalization
3. avatar package generation with manifest outputs
4. export presets tied to the Gail production categories
5. backend-facing texture and mesh LOD manifests

## Important limitation right now

The add-on is the first UI layer, not the finished production suite. It should be treated as:

1. a focused workbench for pose, loop, avatar prep, and texture tier setup
2. the foundation for the next round of streamlining against `D:\docs\gail_animation_production_plan.pdf`
