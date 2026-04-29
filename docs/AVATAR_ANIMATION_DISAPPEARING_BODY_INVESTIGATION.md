# Avatar Animation — Disappearing Body Investigation

**Date:** 2026-04-10
**Status:** Root causes identified, fixes documented
**Severity:** Critical — animations cannot be used in production

---

## Problem Statement

When skeletal animations are applied to the avatar in PlayCanvas, the avatar body disappears after the initial load. The avatar loads correctly as a static mesh, but the moment animation playback begins, the body geometry vanishes.

---

## Root Causes (3 independent issues found)

### Root Cause 1: Animation GLBs contain full mesh data (577 MB each)

**This is the primary cause of the disappearing body.**

The animation GLB files in `playcanvas-app/assets/animations/` are **577 MB each** instead of the expected ~1.7 MB. They contain the full Victoria 8 mesh, all morph targets, all materials, and all textures — the entire avatar baked into every animation clip.

| File | Current Size | Expected Size | Status |
|------|-------------|--------------|--------|
| `27775_stand_still.glb` | 577 MB | 1.75 MB | **BROKEN — full mesh baked in** |
| `28154_explain.glb` | 577 MB | 2.05 MB | **BROKEN — full mesh baked in** |
| `27299_stand_and_nod.glb` | 577 MB | 1.70 MB | **BROKEN — full mesh baked in** |
| `ack_nod_small_v1.glb` | 577 MB | ~1.7 MB | **BROKEN — full mesh baked in** |
| `idle_base_v1.glb` | 577 MB | ~1.7 MB | **BROKEN — full mesh baked in** |
| `idle.glb` | 577 MB | ~1.7 MB | **BROKEN — full mesh baked in** |
| `listen_base_v1.glb` | 577 MB | ~1.7 MB | **BROKEN — full mesh baked in** |
| `talk_base_v1.glb` | 577 MB | ~1.7 MB | **BROKEN — full mesh baked in** |

**Why this causes the body to disappear:** When PlayCanvas loads a 577 MB animation GLB, it instantiates a second complete avatar entity (mesh, skeleton, materials). The animation system then binds to this duplicate skeleton rather than the original body's skeleton. The duplicate mesh either:
- Renders at the origin with default transforms, making the original body invisible
- Has conflicting material/render states that fight with the first body
- Causes the original body's skeleton binding to break, collapsing the mesh to the origin (all vertices at 0,0,0)

**Correct behavior:** Animation GLBs should contain ONLY the armature (skeleton) and keyframe data — no mesh, no morph targets, no textures. The animation is then applied to the already-loaded avatar entity via `assignAnimation()`.

**Proof that correct files exist:** The `converted_animations_20260401/` library has the same animations at correct sizes:
- `converted_animations_20260401/idle/27775_stand_still.glb` → 1.75 MB (skeleton + keyframes only)
- `converted_animations_20260401/other/28154_explain.glb` → 2.05 MB
- `converted_animations_20260401/gesture/27299_stand_and_nod.glb` → 1.70 MB

### Root Cause 2: Blender export script bakes mesh into animation clips

The export script at `blender/animation_master/scripts/export_actions_glb.py` has a fallback path that selects ALL skinned meshes for export:

```python
# Line 64-73 of export_actions_glb.py
def select_armature_export_set(armature_name, collection_name):
    collection = bpy.data.collections.get(collection_name)
    if collection is not None:
        ensure_staging_selection(collection_name)
        return f"collection:{collection_name}"

    # FALLBACK: selects the armature AND all skinned meshes
    armature = bpy.data.objects.get(armature_name)
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        if any(mod.type == "ARMATURE" and mod.object == armature for mod in obj.modifiers):
            obj.select_set(True)  # <-- THIS exports the full body mesh
```

Combined with the export settings:
```python
export_skins=True,      # exports skin weights (mesh data)
export_morph=True,      # exports all 116 morph targets
export_morph_animation=True,  # exports morph animation data
```

**Result:** When the `EXP_clip_preview` collection is missing (it always is for production exports), the fallback fires and exports the entire Victoria 8 body, face, eyelashes, and all morph targets into every animation clip.

**Fix required:** The export script needs an animation-only export path that exports ONLY the armature with `export_skins=False`, `export_morph=False`, and uses `use_selection=True` with only the armature selected.

### Root Cause 3: Work-lite-rebuild.ts has animation playback disabled

Even if the animation files were correct, **the animation system is never wired up** in the production client.

In `playcanvas-app/src/work-lite-rebuild.ts`:

```typescript
// Line 146
const WORK_LITE_SKELETAL_ANIMATION_ENABLED = false;
// Comment: "Do not re-enable body skeletal playback in work-lite
// until the modular avatar ships with a unified runtime rig."
```

**What's missing vs the working phone.ts implementation:**

| Step | phone.ts (WORKS) | work-lite-rebuild.ts (BROKEN) |
|------|-----------------|------------------------------|
| Load animation tracks | `loadAnimationTrack(pc, app, "idle", URL)` | `loadAnimationTrack` defined but **never called** |
| Add anim component | `avatarEntity.addComponent("anim", {...})` | **Not done** |
| Set rootBone | `animComponent.rootBone = skeletonRoot` | **Not done** |
| Assign animations | `animComponent.assignAnimation("idle", track)` | **Not done** |
| Start playback | `animComponent.baseLayer?.play("idle")` | **Not done** |
| Rebind skeleton | `animComponent.rebind?.()` | **Not done** |

The `getDisplayAssets()` function also filters to only `clothing`, `accessory`, and `hair` kinds — **animation assets are excluded from loading** even though they appear in the manifest with `kind: "animation"`.

---

## What PlayCanvas Needs to Load and Animate This Avatar

### Step-by-step runtime pipeline (what must happen in order):

1. **Load the base avatar GLB** (body mesh + armature + morph targets)
   - File: `gail_base_avatar.glb` (~8-12 MB)
   - Contains: Victoria 8 mesh, 173 skinned joints, 116 morph targets
   - Method: `loadContainerEntity()` → `asset.resource.instantiateRenderEntity()`
   - This creates the entity hierarchy with render components and skeleton

2. **Position and align the body** in the scene
   - Measure bounds, compute alignment offset
   - Set local position to center the avatar at the floor

3. **Load clothing/hair/accessory GLBs** (separate modules)
   - Each module has its own mesh skinned to the same skeleton
   - Attach as children of the stage root, aligned to body position
   - These share the same bone names as the base avatar

4. **Load animation-only GLBs** (skeleton + keyframes, NO mesh)
   - File size: ~1.5–2.5 MB each
   - Method: Load as `container` asset, extract track:
     ```typescript
     const asset = new pc.Asset(name, "container", { url });
     // after load:
     const track = asset.resource.animations[0].resource;
     ```
   - The track contains keyframe data referencing bone names

5. **Add the `anim` component to the avatar entity**
   ```typescript
   avatarEntity.addComponent("anim", {
     activate: true,
     speed: 1,
   });
   ```

6. **Set the skeleton root bone**
   ```typescript
   const skeletonRoot = findEntityByName(avatarEntity, "hip") ?? avatarEntity;
   animComponent.rootBone = skeletonRoot;
   ```
   - The root bone tells PlayCanvas where the skeleton hierarchy starts
   - For Victoria 8 / Genesis 8 Female rig, this is the `hip` bone

7. **Assign animation tracks by name**
   ```typescript
   animComponent.assignAnimation("idle", idleTrack);
   animComponent.assignAnimation("talk", talkTrack);
   animComponent.assignAnimation("listen", listenTrack);
   ```

8. **Start playback and rebind**
   ```typescript
   animComponent.baseLayer?.play("idle");
   animComponent.rebind?.();
   ```
   - `rebind()` ensures the skeleton binding is fresh after assignment

9. **Transition between states at runtime**
   ```typescript
   animComponent.baseLayer.transition("talk", 0.17); // 170ms blend
   ```

### Critical requirements for animation GLBs:

- **Must contain:** Armature with correct bone names matching the avatar skeleton
- **Must NOT contain:** Mesh data, morph targets, textures, materials
- **Bone name mapping:** Must match the Victoria 8 production rig (hip → spine chain, bilateral limbs)
- **File size sanity check:** Any animation GLB > 5 MB has mesh baked in. Fix it.
- **Coordinate system:** `export_yup=True` in Blender export (Y-up for glTF/PlayCanvas)

---

## Current State of Each Pipeline Component

### Blender Export Pipeline
| Component | Status | Notes |
|-----------|--------|-------|
| Avatar mesh export (`export_playcanvas_assets.py`) | Working | Correctly exports modular body/hair/clothing GLBs |
| Animation clip export (`export_actions_glb.py`) | **BROKEN** | Fallback path bakes full mesh into every clip |
| clip_registry manifest | Working | 4 approved clips defined correctly |
| EXP_clip_preview collection | **MISSING** | Must exist in Blender scene for animation-only export |

### Converted Animation Library
| Component | Status | Notes |
|-----------|--------|-------|
| 1,892 GLB clips in `converted_animations_20260401/` | Working | Correct format, ~1.7 MB each, skeleton + keyframes only |
| Bone compatibility with Gail avatar | Validated | 173 target joints, all core bones match |
| Bone compatibility with Lucy avatar | Validated | 170 target joints, core bones match (3 optional missing) |

### PlayCanvas Runtime
| Component | Status | Notes |
|-----------|--------|-------|
| Avatar mesh loading | Working | Body loads and renders correctly |
| Modular clothing/hair loading | Working | Loads and aligns correctly |
| Morph target animation (speech, blink) | Working | 116 morphs, visemes, eye blink all functional |
| Bone-driven head/neck movement | Working | Driven by speech amplitude at runtime |
| Skeletal animation loading | **DISABLED** | `loadAnimationTrack` exists but never called |
| Anim component setup | **MISSING** | No `addComponent("anim")` call |
| Animation state transitions | **MISSING** | State tracking exists but no actual playback |
| phone.ts reference client | Working | Full animation pipeline functional (but uses hardcoded URLs) |

### Asset Files in Production
| File | Status | Notes |
|------|--------|-------|
| `assets/animations/27775_stand_still.glb` | **WRONG SIZE** (577 MB) | Must be replaced with animation-only version (1.75 MB) |
| `assets/animations/28154_explain.glb` | **WRONG SIZE** (577 MB) | Must be replaced |
| `assets/animations/27299_stand_and_nod.glb` | **WRONG SIZE** (577 MB) | Must be replaced |
| `assets/animations/ack_nod_small_v1.glb` | **WRONG SIZE** (577 MB) | Must be replaced |
| `assets/animations/idle_base_v1.glb` | **WRONG SIZE** (577 MB) | Must be replaced |
| `assets/animations/idle.glb` | **WRONG SIZE** (577 MB) | Must be replaced |
| `assets/animations/talk_base_v1.glb` | **WRONG SIZE** (577 MB) | Must be replaced |
| `assets/animations/listen_base_v1.glb` | **WRONG SIZE** (577 MB) | Must be replaced |

---

## Fix Plan

### Fix 1: Replace animation GLBs with correct versions from converted library

Copy the correct animation-only GLBs from `converted_animations_20260401/` to replace the bloated 577 MB files:

```
converted_animations_20260401/idle/27775_stand_still.glb  →  playcanvas-app/assets/animations/27775_stand_still.glb
converted_animations_20260401/other/28154_explain.glb     →  playcanvas-app/assets/animations/28154_explain.glb
converted_animations_20260401/gesture/27299_stand_and_nod.glb  →  playcanvas-app/assets/animations/27299_stand_and_nod.glb
```

For `ack_nod_small_v1.glb`, `idle_base_v1.glb`, `idle.glb`, `talk_base_v1.glb`, `listen_base_v1.glb` — these are duplicates or aliases. Map them:
- `idle_base_v1.glb` → copy of `27775_stand_still.glb` 
- `idle.glb` → copy of `27775_stand_still.glb`
- `talk_base_v1.glb` → copy of `28154_explain.glb`
- `listen_base_v1.glb` → copy of `27299_stand_and_nod.glb`

For `ack_nod_small_v1.glb` — needs a suitable micro-nod from the library or a re-export from Blender with the correct settings.

### Fix 2: Wire animation loading in work-lite-rebuild.ts

After avatar body loads, add:

1. Extract animation assets from manifest (filter `kind === "animation"`)
2. Load each animation GLB as a container asset
3. Extract animation tracks from `asset.resource.animations[0].resource`
4. Add `anim` component to body entity
5. Set `rootBone` to the `hip` entity
6. Assign tracks by slot name (idle, talk, listen, ack)
7. Start idle playback
8. Wire state transitions into the existing `setAnimationState()` function

### Fix 3: Fix the Blender export_actions_glb.py script

Create a dedicated `EXP_clip_preview` collection in the Blender master file that contains ONLY the armature (no meshes). Or modify the fallback path to select only the armature:

```python
# Instead of selecting all skinned meshes:
armature.select_set(True)
bpy.context.view_layer.objects.active = armature
# Do NOT select any mesh objects
```

And change export settings for animation-only exports:
```python
export_skins=False,     # Don't export skin weights (no mesh)
export_morph=False,     # Don't export morph targets
export_morph_animation=False,
```

---

## Why It Worked Before (Legacy/Phone Client)

The `phone.ts` client works because:

1. It uses **hardcoded direct URLs** pointing to the same animation GLB files
2. The animation loading code is fully implemented (addComponent, rootBone, assignAnimation, play, rebind)
3. It was likely built and tested when the animation files were **correct** (1.7 MB versions)
4. It doesn't use the manifest/catalog system — it goes directly to the files

The work-lite-rebuild replaced the phone client as the production surface but:
- Animation code was not ported over
- The flag `WORK_LITE_SKELETAL_ANIMATION_ENABLED = false` was set as a safeguard
- At some point, the animation files were re-exported from Blender with the fallback path, ballooning to 577 MB
- The bloated files never triggered an error because they were never loaded (animations disabled)

---

## Validation Checklist

- [ ] Animation GLB file sizes < 5 MB each
- [ ] Animation GLBs contain no mesh instances (verify in PlayCanvas model viewer or gltf-transform)
- [ ] `loadAnimationTrack` called for each animation slot
- [ ] `anim` component added to avatar body entity
- [ ] `rootBone` set to `hip` bone entity
- [ ] All tracks assigned via `assignAnimation()`
- [ ] Playback starts with `baseLayer.play("idle")`
- [ ] `rebind()` called after all assignments
- [ ] Avatar body remains visible during idle animation
- [ ] State transitions (idle → talk → listen) blend smoothly
- [ ] Clothing/hair modules still render correctly during animation
- [ ] No console errors related to skeleton binding

---

## Change Log

| Date | Action | Result |
|------|--------|--------|
| 2026-04-10 | Investigation started | Three root causes identified |
| 2026-04-10 | Verified converted library has correct files | 1.7 MB animations match skeleton |
| 2026-04-10 | Rig compatibility validated | 173 joints match between avatar and animations |
| 2026-04-10 | phone.ts confirmed as working reference | Full animation pipeline works there |
| 2026-04-10 | Replaced 8 animation GLBs (577→1.7 MB each) | Copied from converted_animations_20260401 library |
| 2026-04-10 | Wired animation loading in work-lite-rebuild.ts | Enabled flag, loads tracks from manifest, adds anim component, sets rootBone, assigns tracks, starts idle playback, transitions via baseLayer.transition() |
| 2026-04-10 | TypeScript compilation | Clean — no errors in playcanvas-app or backend |
| 2026-04-10 | Manifest verification | All 4 animation assets present=true, correct sizes, correct slots |
| 2026-04-10 | Asset serving verification | GLB files served via /client-assets/ at 200 OK |

### Files Changed
- `playcanvas-app/assets/animations/*.glb` — Replaced all 8 files (577 MB → 1.7 MB each)
- `playcanvas-app/src/work-lite-rebuild.ts` — Enabled `WORK_LITE_SKELETAL_ANIMATION_ENABLED`, added animation loading pipeline, wired state transitions to `animComponent.baseLayer.transition()`

### What Was NOT Changed (and why)
- `blender/animation_master/scripts/export_actions_glb.py` — NOT fixed yet. The fallback mesh selection and export_skins/export_morph flags still produce bloated files. This needs a Blender-side fix to prevent future bad exports. The current fix bypasses the issue by using pre-converted animation-only files.
- `phone.ts` — Not modified, still uses hardcoded URLs. Already works.
