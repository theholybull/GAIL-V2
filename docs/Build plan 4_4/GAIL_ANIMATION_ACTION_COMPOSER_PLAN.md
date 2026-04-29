# Gail Animation Action Composer Plan (Drag-Drop to Blender to Viewport) (Pass/Fail)

Date: 2026-04-04
Scope: UI-integrated animation composition for larger actions by assembling clips/poses, blending transitions in Blender, previewing in viewport, and saving or sending back with correction notes.

## Goal
- Build larger actions from smaller clips with drag/drop.
- Use Blender as the authoritative blend/interpolation engine.
- Return generated action to viewport for immediate review.
- Support approve/save OR reject/send-back with correction instructions.

## Existing Capability Confirmed
Current repo already has core building blocks:
- Blender add-on supports pose capture and pose-loop generation from start/mid/end poses.
- Add-on supports clip export and pipeline execution.
- Smoke test exists for pose-loop generation (`smoke_test_pose_loop.py`).
- Pipeline docs already define clip export path and runtime mirror.

## New UI Surface: Action Composer
Add under `AI Workflow` and `Scene Build` as a shared module, or separate page if needed.

### Main Panels
1. Left: Clip/pose library
- Search and filter by category (idle/listen/talk/gesture/custom).
- Drag sources include:
  - existing approved clips
  - captured poses
  - imported temporary clips

2. Center: Composition timeline
- Drop lane supports ordered blocks (A -> B -> C ...).
- Each boundary shows transition segment controls.
- Blend handles for overlap duration and interpolation type.

3. Right: Blend and export inspector
- Transition mode: linear, bezier, hermite (or mapped equivalents supported by Blender script).
- Gap fill settings: hold, auto-inbetween, ease-in/out.
- Output config: action name, category, frame rate, target avatar id.

4. Bottom: Job and review
- Blender run status
- Preview status
- Save/Publish button
- Send Back button with required correction note

## Workflow
1. Operator drags clips/poses into composition timeline.
2. UI validates sequence and creates compose request JSON.
3. Backend launches Blender compose job (headless or live attach).
4. Blender script generates composite action with transition fills.
5. Action exported to clip path and mirrored to runtime animation assets.
6. Viewport auto-loads generated clip and plays preview.
7. Operator chooses:
- `Save / Publish` (approved)
- `Send Back For Correction` (requires instruction text)

## Data Contracts
### Compose request file
- `data/animation/compose-requests/<requestId>.json`
- includes:
  - source clip ids/paths
  - ordering
  - transition settings per boundary
  - output clip metadata

### Compose result file
- `data/animation/compose-results/<requestId>.json`
- includes:
  - status
  - generated action name
  - output clip path
  - warnings (foot sliding, discontinuity, missing bones)

### Review record
- `data/animation/review-log.json`
- includes:
  - request id
  - reviewer decision (`approved` / `correction_requested`)
  - correction notes
  - timestamp

## Backend/API Plan
Add endpoints:
- `POST /animations/compose`
- `GET /animations/compose/:id`
- `POST /animations/compose/:id/review`

Execution notes:
- Compose endpoint triggers Blender runner script.
- Status endpoint returns progress + errors.
- Review endpoint gates whether clip status becomes `approved`.

## Blender Integration Plan
Primary integration target:
- extend existing add-on/script path already used for pose clip generation.

Implementation path:
1. Add composition script that can:
- load sequence of actions/poses
- place them on timeline
- insert transition keys/inbetweens across gaps
- bake to single output action

2. Reuse existing export operators to emit GLB clip.
3. Write compose result JSON + diagnostics.

## Viewport Preview Requirements
- On compose success, preview auto-queues in work-lite viewport.
- Playback controls: play/pause/loop/speed.
- Visual warnings overlay if Blender reported continuity risk.

## Send Back For Correction
- Required fields:
  - reason category (timing, pose quality, transition, clipping, style)
  - free-text instruction
- System writes correction note into review log and keeps clip unapproved.

## Pass/Fail Gates
| ID | Status | Priority | Area | Requirement | Verification | Pass Criteria |
|---|---|---|---|---|---|---|
| AC1 | FAIL | Blocker | Drag-Drop Compose | Clips/poses can be dragged into ordered timeline | Build 3-clip sequence in UI | Sequence persists and validates |
| AC2 | FAIL | Blocker | Blender Gap Fill | Blender fills transitions between sequence items | Run compose job with non-trivial gaps | Output action generated without hard discontinuity |
| AC3 | FAIL | Blocker | Viewport Preview | Generated action auto-plays in viewport | Compose then open viewport preview | Clip plays with controls available |
| AC4 | FAIL | Blocker | Review Decision | Operator can Save/Publish or Send Back with notes | Run both decision paths | Approved clips publish; rejected clips log corrections |
| AC5 | FAIL | High | Diagnostics | Compose result includes warnings/errors and trace | Run failing + passing jobs | Logs include actionable error details |
| AC6 | FAIL | High | Beginner Help | Action Composer has noob quick-start and examples | Open page help panel | Beginner can complete first compose in <=5 steps |

## UI Help Requirements (Noob-Friendly)
Action Composer help must include:
- "What this does"
- "First 5 clicks"
- "If clip looks wrong, do this"
- sample correction note templates

## Recommended Build Order
1. UI timeline drag/drop skeleton and compose request model.
2. Backend compose endpoints and job state model.
3. Blender composition script extension from pose-loop path.
4. Viewport preview handshake.
5. Review + correction flow and persistent logs.
6. Help content and guided mode steps.
