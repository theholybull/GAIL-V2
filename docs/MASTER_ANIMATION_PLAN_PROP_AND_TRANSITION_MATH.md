# Master Animation Plan 2: Props, Transition Math, and Scale Standard

Date: 2026-04-04

## Required Prop Packs
1. Office chair prop + compatible seated pose set.
2. Couch prop + compatible seated/lounge pose set.

## Transition Frame Math (No Guessing)
Given:
- distance in meters = d
- movement speed target (m/s) = v
- frame rate = fps

Formula:
- frames_translation = ceil((d / v) * fps)

Given:
- angular distance in degrees = a
- angular speed target (deg/s) = w
- frame rate = fps

Formula:
- frames_rotation = ceil((a / w) * fps)

Use final transition length:
- frames = max(frames_translation, frames_rotation, minimum_blend_frames)

## Smoothness Constraints
- enforce easing in/out
- enforce minimum blend floor
- detect and reject pop/jank/foot slide outliers

## Scale Standard (Blender -> PlayCanvas)
- Use one canonical scene scale and document export unit assumptions.
- Every imported prop and exported avatar/clip must pass scale validation.
- Reject assets that violate scale tolerance.

## Ordered Checklist
1. Add office chair prop and pose anchors.
2. Add couch prop and pose anchors.
3. Apply frame math formulas to all transition generation jobs.
4. Bake scale validation into export path.
5. Validate smoothness and approve only on pass.
