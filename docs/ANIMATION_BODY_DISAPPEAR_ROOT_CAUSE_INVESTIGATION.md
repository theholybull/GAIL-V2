# Animation Body Disappear / Mangle — Root Cause Investigation

**Date:** 2026-04-10  
**Status:** Investigation complete. No code changes made.  
**Investigator:** Copilot agent  
**Symptom:** When skeletal animations are enabled, the avatar body collapses into a mangled, distorted shape. Head disappears, torso compresses, limbs twist. Clips show `idle:loaded talk:loaded listen:loaded ack:loaded` — animations ARE loading and playing, but the body deforms incorrectly.

---

## Executive Summary

The avatar body mangles because the **animation GLB files use a different coordinate space than the avatar GLB**. Specifically:

1. **100× scale mismatch** — Animation GLBs store bone transforms in **centimeters** (DAZ Studio default). The avatar GLB stores bone transforms in **meters** (web/game standard).
2. **90° root rotation mismatch** — Animation GLBs have Z-up orientation on individual bones with a Y-up correction on the root `Victoria 8` node. The avatar GLB has Y-up baked directly into bone positions.
3. **Proxy mesh baked into animation clips** — Every converted animation GLB contains a skinned `AXPreviewProxy_Humanoid` mesh from the AnimoXtend addon. While this doesn't directly cause the mangle (the loading code only extracts the AnimTrack), it adds unnecessary weight and complexity.

The bone names are **identical** between both files (DAZ Genesis 8 naming: `hip`, `abdomenLower`, `abdomenUpper`, `chestLower`, `chestUpper`, etc.). The skeleton hierarchy is **identical**. The problem is purely a **coordinate space / unit scale mismatch** in the stored transform values.

---

## Evidence

### Rest Pose Transform Comparison

Extracted directly from the GLB JSON chunks:

| Bone | Animation GLB Translation | Avatar GLB Translation | Factor |
|------|--------------------------|----------------------|--------|
| hip | `[0, 1.68, -110.46]` | `[0.00002, 1.07, 0.02]` | ~100× |
| abdomenLower | `[0, 1.73, -1.39]` | `[-0.00002, 0.018, -0.015]` | ~100× |
| chestLower | `[0, 7.80, -0.41]` | `[0.000004, 0.078, -0.004]` | ~100× |
| chestUpper | `[0, 12.96, -3.50]` | `[-0.000006, 0.131, -0.036]` | ~100× |
| head | `[0, 5.00, 0.17]` | `[-0.00002, 0.049, 0.001]` | ~100× |
| lShldrBend | `[11.39, -1.57, -1.23]` | `[0.118, -0.014, -0.009]` | ~100× |
| lThighBend | `[7.88, -10.44, -1.54]` | `[0.080, -0.106, -0.016]` | ~100× |

**Hip rotation:**
- Animation: `[-0.707, 0, 0, 0.707]` (90° X rotation — Z-up to Y-up conversion)
- Avatar: `[-5.2e-08, 0, 0, 1]` (effectively identity — Y-up already baked in)

### Root Node Comparison

**Animation GLB root node (`Victoria 8`):**
- `rotation = [0.707, 0, 0, 0.707]` — 90° X-axis rotation (Z-up → Y-up)
- `scale = [0.01, 0.01, 0.01]` — centimeters → meters conversion
- This root compensation is correct FOR the animation's OWN skeleton, but PlayCanvas animation tracks target individual bones by name, bypassing this root node entirely.

**Avatar GLB root node (`Victoria 8__gail_export_tmp`):**
- `rotation = identity`
- `scale = identity`
- All transforms already baked into bone positions in meters, Y-up.

### Why the Mangle Happens

1. `loadAnimationTrack()` loads the animation GLB as a container and extracts `asset.resource.animations[0].resource` — the raw AnimTrack.
2. The AnimTrack contains absolute local transforms for each bone (translation, rotation, scale at each keyframe).
3. These transforms are in **centimeters, Z-up** space (matching the animation GLB's skeleton).
4. The anim component applies these transforms to the avatar's entity hierarchy starting from `rootBone = hip`.
5. The avatar expects transforms in **meters, Y-up** space.
6. Result: bone positions are 100× too large and rotated 90° on the wrong axis.
7. The mesh deforms to these wildly wrong skeleton positions → body mangle.

### Node/Bone Name Match Verification

Both files use identical DAZ Genesis 8 bone names. Full skeleton comparison confirmed 170+ matching bone names including:
- Core body: `hip`, `abdomenLower`, `abdomenUpper`, `chestLower`, `chestUpper`, `neckLower`, `neckUpper`, `head`
- Arms: `lCollar`, `lShldrBend`, `lShldrTwist`, `lForearmBend`, `lForearmTwist`, `lHand` (and right-side equivalents)
- Legs: `lThighBend`, `lThighTwist`, `lShin`, `lFoot` (and right-side equivalents)
- Fingers, toes, face bones — all match exactly.

Minor differences (non-breaking):
- Hair bones: Animation has `Ponytail`, `Ponytail_2`. Avatar has `Back`, `RightFront`, `LeftFront`.
- Root node names differ: `Victoria 8` vs `Victoria 8__gail_export_tmp`.
- Animation has `AXPreviewProxy_Humanoid` (proxy mesh node, absent from avatar).

### GLB Structure Comparison

| Property | Animation GLB (26965_stand_still.glb) | Avatar GLB (gail_base_avatar.glb) |
|----------|--------------------------------------|----------------------------------|
| File size | 1.75 MB | 384 MB |
| Meshes | 1 (`Genesis8Female.001` — proxy) | 2 (`Genesis8Female.001`, `Genesis8FemaleEyelashes.001`) |
| Skins | 1 (`Victoria 8`, 172 joints) | 1 (`Victoria 8__gail_export_tmp`, 173 joints) |
| Animations | 1 (`Animation`, 517 channels) | 0 |
| Root scale | 0.01 (centimeters → meters) | 1.0 (identity) |
| Root rotation | 90° X-axis | Identity |
| Coordinate space | DAZ native (centimeters, Z-up on bones) | Web standard (meters, Y-up baked) |

---

## Source of the Problem

### The AnimoXtend Conversion Pipeline

The 1,892 converted animation GLBs in `converted_animations_20260401/` were produced by the **AnimoXtend Local Pipeline** documented at `E:\docs\ANIMOXTEND_LOCAL_PIPELINE.md`:

1. AnimoXtend NPZ clips are loaded onto `BufferArmature` in Blender
2. Retargeted onto `Victoria 8` armature in `D:\test_v3_mapped.blend`
3. Exported as GLB using Blender's glTF exporter

The export produced GLBs with:
- The DAZ-native centimeter coordinate space on individual bones
- A root `Victoria 8` node with `scale=0.01` and `rotation=90°X` to provide the correct visual result when the FULL hierarchy (root included) is instantiated
- The `AXPreviewProxy_Humanoid` proxy mesh left in the export (should have been excluded)
- `export_skins=True` and `export_morph=True` flags in the export script, embedding skin data

### The Avatar Export Pipeline

The avatar GLB (`gail_base_avatar.glb`) was exported from the Blender `gail_rig_master.blend` / `gail_rig.blend` using `export_playcanvas_assets.py`. This export:
- Baked the Y-up rotation and meter scale directly into every bone position
- Produced bones with near-identity rest rotations
- Resulted in a flat/clean coordinate space with no root transform compensation needed

### Why This Hasn't Been Caught Before

The `phone.ts` reference client was **never confirmed working** with these animation files on this avatar. The code structure exists, but the animation code path was untested. The `WORK_LITE_SKELETAL_ANIMATION_ENABLED` flag was `false` in the production client since the beginning.

---

## Bloated Animation Files Inventory

The Blender export script (`export_actions_glb.py`) has a fallback path in `select_armature_export_set()` that, when the `EXP_clip_preview` collection is missing, selects ALL skinned meshes plus the armature for export. Combined with `export_skins=True` and `export_morph=True`, this bakes the full 564 MB Victoria 8 mesh (116 morph targets) into every exported clip.

### Files to Delete

**Working copy (2.26 GB):**
```
working_copy/blender/animation_master/exports/glb/clips/approved/ack/ack_nod_small_v1.glb — 564 MB
working_copy/blender/animation_master/exports/glb/clips/approved/idle/idle_base_v1.glb — 564 MB
working_copy/blender/animation_master/exports/glb/clips/approved/listen/listen_base_v1.glb — 564 MB
working_copy/blender/animation_master/exports/glb/clips/approved/talk/talk_base_v1.glb — 564 MB
```

**E: drive (580 MB):**
```
E:\animation_master\exports\glb\clips\..\idle_base_v1.glb — 157 MB
E:\animation_master\exports\glb\clips\..\listen_base_v1.glb — 157 MB
E:\idle_a1.glb — 266 MB
```

**D: drive (295 MB):**
```
D:\Gail\blender\animation_master\exports\glb\clips\..\idle_base_v1.glb — 147 MB
D:\Gail\blender\animation_master\exports\glb\clips\..\listen_base_v1.glb — 147 MB
```

**Total bloated files: ~3.1 GB**

---

## Resource Inventory

### What Exists Where

| Location | Contents | Size | Status |
|----------|---------|------|--------|
| `converted_animations_20260401/` (workspace root) | 1,892 retargeted GLB clips | ~5.9 GB | **Wrong coordinate space** |
| `D:\Gail\data\animation_viewer\animations/` | Same 1,892 clips (canonical copy) | ~5.9 GB | **Wrong coordinate space** |
| `E:\converted_animations_20260401/` | Same 1,892 clips (backup) | ~5.9 GB | **Wrong coordinate space** |
| `working_copy/playcanvas-app/assets/animations/` | 8 selected clips (~1.7 MB each) | ~14 MB | **Wrong coordinate space** |
| `working_copy/blender/animation_master/exports/glb/clips/` | 4 bloated clips (564 MB each) | 2.26 GB | **Delete — full mesh baked in** |
| `E:\animation_master\manifests/` | Bone maps, clip tuning, registries | — | Correct reference data |
| `E:\animation_master\scripts/` | Export, retarget, validation scripts | — | Correct reference scripts |
| `E:\animation_master\docs/` | Pipeline reset, naming rules, workflow SOP | — | Correct reference docs |

### Key Configuration Files

| File | Purpose |
|------|---------|
| `blender/animation_master/manifests/bone_map.gail.json` | Maps semantic bone names → DAZ bone names |
| `blender/animation_master/manifests/mixamo_bone_map.gail.json` | Maps semantic → Mixamo source bone names |
| `blender/animation_master/scripts/mixamo_to_gail.py` | Mixamo FBX → Gail rig retarget (Blender script) |
| `blender/animation_master/scripts/export_actions_glb.py` | Blender → GLB clip export |
| `blender/animation_master/scripts/export_clip_common.py` | Shared export helpers (staging, selection) |
| `playcanvas-app/config/work-lite-modules.gail.json` | Runtime asset manifest (4 animation entries) |
| `playcanvas-app/src/work-lite-rebuild.ts` | Production client (animation code gated behind false flag) |

---

## Solution Options (Ranked by Correctness)

### Option A: Fix the Blender Export Pipeline (RECOMMENDED)

Re-export all animation clips from Blender with transforms that match the avatar's coordinate space.

**What needs to happen:**
1. Open the master Blender file containing the retargeted animations
2. Modify the export script to apply the armature root's transforms (0.01 scale + 90° X rotation) to all bone transforms before export, OR change the export settings to match how the avatar was exported
3. Exclude the `AXPreviewProxy_Humanoid` mesh from animation exports — use `export_skins=False` and `export_morph=False` for animation-only clips
4. Export animations as armature-only (skeleton + keyframes, NO mesh)
5. Verify the exported GLB has bone rest transforms that match `gail_base_avatar.glb`

**Export settings needed:**
```python
bpy.ops.export_scene.gltf(
    filepath=str(filepath),
    export_format="GLB",
    use_selection=True,
    export_animations=True,
    export_nla_strips=False,
    export_animation_mode="ACTIVE_ACTIONS",
    export_force_sampling=True,
    export_skins=False,        # <-- CHANGED from True
    export_morph=False,         # <-- CHANGED from True
    export_morph_animation=False, # <-- CHANGED from True
    export_yup=True,
    export_apply_modifiers=True,  # Bake transforms
)
```

**Critical:** The armature must be set up so that individual bone transforms are in meters/Y-up BEFORE export, matching how the avatar armature was configured.

**Pros:** Fixes all 1,892 clips at the source. Clean pipeline going forward.
**Cons:** Requires Blender, the master rig file, and the retargeted animation actions.

### Option B: Post-Process the GLB Files (Node.js/Python Script)

Write a script that reads each animation GLB, transforms the animation curve values from centimeters/Z-up to meters/Y-up, strips the proxy mesh, and writes corrected GLBs.

**What the script would do:**
1. Read the GLB binary
2. Parse the JSON chunk
3. For each animation channel:
   - If targeting translation: multiply all values by 0.01 (cm → m) and swap Y/Z axes
   - If targeting rotation: apply the 90° X inverse rotation to all quaternion values
4. Remove the mesh and skin data
5. Update the root node to identity transform
6. Write the corrected GLB

**Pros:** No Blender needed. Can process all 1,892 files automatically.
**Cons:** Complex transform math. Risk of subtle rotation errors. Harder to validate.

### Option C: Runtime Transform Correction in PlayCanvas

Modify the animation loading code to transform AnimTrack curve values at load time.

**What would change in `work-lite-rebuild.ts`:**
1. After `loadAnimationTrack()` returns the AnimTrack
2. Iterate all curves in the track
3. For translation curves: scale values by 0.01 and swap Y/Z
4. For rotation curves: pre-multiply by the inverse root rotation
5. Then assign the corrected track to the anim component

**Pros:** No file changes needed. Quick to test.
**Cons:** Runtime overhead. Hacky. Doesn't fix the underlying data problem. PlayCanvas AnimTrack API may not expose curve data for modification.

### Option D: Re-Run AnimoXtend Pipeline with Correct Settings

Re-run the AnimoXtend local pipeline with export settings that produce meter-scale, Y-up, armature-only GLBs.

**What needs to happen:**
1. Modify `D:\tools\animoxtend_local_retarget_export.py` to:
   - Apply armature transforms before export
   - Export with `export_skins=False`
   - Use `export_apply_modifiers=True`
2. Re-run `D:\tools\run-animoxtend-local-pipeline.ps1` for all categories
3. Verify output matches avatar coordinate space

**Pros:** Uses existing infrastructure. Scalable for future clips.
**Cons:** Requires the AnimoXtend addon and API access. May need significant pipeline changes.

---

## Validation Checklist (For Whichever Solution Is Chosen)

Before enabling `WORK_LITE_SKELETAL_ANIMATION_ENABLED = true`:

- [ ] Pick ONE animation GLB (e.g., `idle_base_v1.glb`)
- [ ] Extract its `hip` node rest translation — should be within 10% of avatar's: `[~0, ~1.07, ~0.02]`
- [ ] Extract its `hip` node rest rotation — should be near identity: `[~0, 0, 0, ~1]`
- [ ] Confirm no mesh node exists in the GLB (or mesh count = 0)
- [ ] Confirm no skin data in the GLB (skins count = 0 or absent)
- [ ] Load in PlayCanvas with animation enabled
- [ ] Avatar body should appear normally — no distortion, no collapse
- [ ] Animation should play — visible idle sway or breathing motion
- [ ] Switch between idle/talk/listen states — body responds correctly
- [ ] Clothing layers render correctly during animation
- [ ] No console errors related to skeleton/bone/joint

---

## Files Checked During This Investigation

### Workspace (working_copy)
- `playcanvas-app/src/work-lite-rebuild.ts` — Production client, animation loading code
- `playcanvas-app/src/phone.ts` — Reference client, same loading approach
- `playcanvas-app/config/work-lite-modules.gail.json` — Asset manifest with 4 animation entries
- `playcanvas-app/assets/gail/avatar/base_face/gail_base_avatar.glb` — Avatar GLB (384 MB)
- `playcanvas-app/assets/animations/*.glb` — 8 animation clips (~1.7 MB each)
- `blender/animation_master/manifests/bone_map.gail.json` — DAZ bone mapping
- `blender/animation_master/manifests/mixamo_bone_map.gail.json` — Mixamo → DAZ mapping
- `blender/animation_master/scripts/export_actions_glb.py` — Bloated export script
- `blender/animation_master/scripts/export_clip_common.py` — Export helper with fallback mesh selection
- `blender/animation_master/exports/glb/clips/` — 4 bloated 564 MB exports

### Converted Animation Library
- `converted_animations_20260401/idle/26965_stand_still.glb` — Sample clip analyzed
- `D:\Gail\data\animation_viewer\ANIMATION_LIBRARY_README.md` — Library documentation

### E: Drive
- `E:\animation_master\scripts/mixamo_to_gail.py` — Retarget pipeline (correct bone mapping)
- `E:\animation_master\docs/ANIMATION_PIPELINE_RESET.md` — Pipeline rules
- `E:\animation_master\docs/NAMING_RULES.md` — Action naming grammar
- `E:\animation_master\docs/WORKFLOW_SOP.md` — Full workflow procedure
- `E:\animation_master\docs/MASTER_STRUCTURE.md` — Collection tree and naming
- `E:\animation_master\exports/reports/armature_bones_report.json` — 170 bone inventory
- `E:\docs/ANIMOXTEND_LOCAL_PIPELINE.md` — AnimoXtend conversion pipeline docs

### D: Drive
- `D:\Gail\data\animation_viewer\ANIMATION_LIBRARY_README.md` — Canonical library docs
- `D:\Gail\data\animation_viewer\animations/` — 1,892 clip canonical copy

---

## Previous Failed Attempt (Commit 2ba09fc)

The previous attempt:
1. Replaced 8 bloated 577 MB animation GLBs with correct 1.7 MB versions ✅
2. Enabled `WORK_LITE_SKELETAL_ANIMATION_ENABLED = true` ✅
3. Wired animation loading with `rootBone = "hip"` ✅
4. Result: Body mangled because animation transforms are in wrong coordinate space ❌

The flag was reverted to `false` and the app rebuilt to restore normal avatar display.

The clips loaded and played successfully — the infrastructure works. The ONLY problem is the transform data in the animation files.

---

## Conclusion

The animation pipeline is structurally sound. Bone names match. The loading code works. The anim component wiring is correct. The single blocking issue is that the 1,892 converted animation GLBs store bone transforms in DAZ-native centimeters/Z-up space while the avatar expects meters/Y-up space. Fix the coordinate space in the animation exports and animations will work.
