# GitHub Backup Manifest - 2026-04-29

Remote: `https://github.com/theholybull/GAIL-V2`

Branch target: `backup/d-root-lockdown-20260429`

This GitHub backup is a clean orphan snapshot of the current `D:\Gail 2.1\working_copy` source tree. It is intentionally not pushed from the existing local branch history because the local history contains a tracked API key file. The snapshot branch has no parents, so it does not carry that old history forward.

## Full Local Lockdown Copy

The full byte-for-byte working copy backup remains local here:

`D:\Gail 2.1\lockdown-backups\working_copy_lockdown_20260429-085311`

That local backup is the complete working copy, including bulky binary assets and ignored/generated files. Use it as the "do not lose what we have" copy.

## GitHub Snapshot Scope

The GitHub snapshot is for source control, docs, scripts, manifests, and normal-sized project assets. It excludes:

- Local secrets and environment files.
- Runtime logs and PID files.
- Files ignored by `.gitignore` unless explicitly forced into the snapshot.
- Files larger than 95 MB, because GitHub rejects normal Git blobs over 100 MB and Git LFS quota should not be assumed safe for this entire asset set.

## Secret Exclusions

The following sensitive paths are excluded from the GitHub snapshot:

- `tools/animoxtend_api_key.txt`
- `.env`
- `.env.local`
- `backend/.env`
- `backend/.env.local`
- `data/providers/openai-config.json`
- `data/providers/local-llm-config.json`

No secret values are recorded in this manifest.

## Large File Exclusions

The following files were over the 95 MB GitHub snapshot threshold and are preserved in the local lockdown copy instead:

- `blender/animation_master/exports/playcanvas_profiles/high/gail/avatar/base_face/gail_base_avatar.glb`
- `blender/animation_master/source/daz_fig0_manual_import.blend`
- `blender/animation_master/source/gail_master_v2_direct_mixamo_idle_preview.blend`
- `blender/animation_master/source/gail_master_v2_mixamo_idle_preview.blend`
- `blender/animation_master/source/retarget_gail_mixamo.blend`
- `data/animation-library/converted_animations_20260401/locomotion/26474_turn_around_aim_the_gun.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26501_step_back.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26504_run_backwards_with_rifle_down.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26508_step_back.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26556_boxing_sidestep.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26561_step_forward_and_throw_punches_to_the_left_and_right.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26569_carry_the_box_and_walk_on.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26639_walk_forward.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26644_walk_backwards.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26659_tiptoe_and_turn_left.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26663_tiptoe_and_turn_right.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26667_walk_forward.glb`
- `data/animation-library/converted_animations_20260401/locomotion/26668_walk_forward.glb`
- `data/environment/candidates/env_blend/env_optimized_2k.blend`
- `data/environment/candidates/env_blend/env_optimized_2k.glb`
- `data/environment/candidates/modern_country_home/modern_country_home_optimized_2k.blend`
- `data/environment/candidates/modern_country_home/modern_country_home_optimized_2k.blend1`
- `gail_rig.blend`
- `gail_rig.blend1`
- `gail_rig_master.blend`
- `playcanvas-app/assets/gail/counselor/avatar/base_face/vera_base_avatar.glb`
- `playcanvas-app/assets/gail/girlfriend/avatar/base_face/cherry_base_avatar.glb`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/idle_alt.bloated.glb.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/idle_alt.glb.pre_sanitize.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/idle_cover.bloated.glb.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/idle_cover.glb.pre_sanitize.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/idle_default.bloated.glb.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/idle_default.glb.pre_sanitize.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/listen_ack.bloated.glb.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/listen_ack.glb.pre_sanitize.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/listen_focus.bloated.glb.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/listen_focus.glb.pre_sanitize.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/wave_hello.bloated.glb.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/assets/animations/wave_hello.glb.pre_sanitize.bak`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/blender/animation_builder_test_output.blend`
- `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330/blender/test_avatar.blend`

## Restore Notes

To restore the full local state, use the local lockdown copy. To restore the source-control state, clone the GitHub branch and then copy required bulky assets from the lockdown backup or from the eventual asset archive/LFS plan.

This split keeps the project safe today without risking a failed GitHub push or leaking old local history.
