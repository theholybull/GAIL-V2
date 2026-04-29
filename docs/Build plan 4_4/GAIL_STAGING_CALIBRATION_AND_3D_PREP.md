# Gail Staging Calibration and 3D Interaction Prep Plan (Pass/Fail)

Date: 2026-04-04
Scope: Manual avatar staging controls, deterministic transform locking, and preparation for environment interaction (not implemented yet)

## Goal
- Replace fragile auto-staging with deterministic manual calibration.
- Lock avatar transform profiles per device/view context.
- Prepare data and script interfaces so avatar can interact with a real 3D environment later.

## Proposed Workflow (Hybrid Recommended)
1. Blender normalization pass (coarse)
- Normalize unit scale, axes, root pivot, floor alignment.
- Export audit metadata (bounds, height, root orientation).

2. PlayCanvas calibration pass (fine)
- Manual controls for position/rotation/scale and floor/anchor offsets.
- Camera-aware framing tune per target profile.
- Save profile and mark locked.

3. Runtime lock/apply
- On startup, apply locked profile by target context (`desktop`, `tablet`, `mobile`, `kiosk`, `studio`).
- Auto-fit disabled when profile locked.

## Data Contract (to implement)
- File: `playcanvas-app/config/staging-profiles.json`
- Shape:
```json
{
  "version": 1,
  "profiles": {
    "desktop_default": {
      "avatarSystem": "gail_primary",
      "transform": { "position": [0,0,0], "rotationEuler": [0,180,0], "scale": [1,1,1] },
      "staging": { "anchor": "feet_center", "floorOffset": 0.0, "yawOffset": 0.0 },
      "cameraComp": { "fov": 45, "distanceBias": 0.0, "heightBias": 0.0 },
      "locked": true,
      "updatedAt": "ISO-8601"
    }
  }
}
```

## Scripts/Helpers to Build
1. PlayCanvas helper (manual calibrator)
- Script/module name: `staging-calibrator`
- Controls:
  - Translate XYZ (nudge + slider)
  - Rotate XYZ (focus on yaw)
  - Uniform/non-uniform scale
  - Set Ground, Face Camera, Reset, Capture, Lock/Unlock
- Outputs:
  - Writes selected profile to `staging-profiles.json`
  - Emits current transform + bounds to console/report

2. Blender helper (normalization pre-export)
- Script/module name: `normalize_avatar_staging.py`
- Operations:
  - Apply transforms
  - Set canonical axis convention
  - Recenter root pivot
  - Move lowest vertex to floor plane
- Outputs:
  - `staging-normalization-report.json`

## 3D Environment Maintenance Strategy (Prep)
When real environments are introduced, keep staging stable by separating concerns:
1. Avatar Staging Layer
- Avatar root transform controlled by staging profile only.
- Never bake environment offsets into avatar source rig.

2. Environment Anchor Layer
- Each environment has explicit anchors:
  - `idle_anchor`
  - `interaction_anchor_*`
  - `navigation_entry`
- Avatar snaps to anchors via interaction system, not ad-hoc transforms.

3. Interaction Contract Layer
- Define interaction points with:
  - world position
  - forward vector
  - required avatar pose/state
  - optional hand target(s)
- Future script APIs should consume this contract, not hardcoded coordinates.

4. Validation Layer
- For each environment scene, run a staging check that verifies:
  - feet grounded
  - no clipping through floor/walls at idle anchor
  - camera framing within tolerance

## Avatar-to-Environment Interaction Prep (Design now, build later)
Define contracts now so scripts are compatible later:
1. `environment-profile.json`
- Scene-level metadata and anchor registry.

2. `interaction-points.json`
- Named interaction targets with approach + alignment requirements.

3. `avatar-capabilities.json`
- What the avatar can do: reach height range, IK availability, locomotion modes.

4. Runtime resolver
- Future resolver flow:
  - choose interaction point
  - move avatar to approach anchor
  - align root transform
  - apply gesture/IK
  - return to idle anchor

## Pass/Fail Gates

| ID | Status | Priority | Area | Required Outcome | Verification | Pass Criteria |
|---|---|---|---|---|---|---|
| S1 | FAIL | Blocker | Manual Calibrator | PlayCanvas manual staging controls exist and are usable | Open client and adjust transform live | Position/rotation/scale changes visible immediately |
| S2 | FAIL | Blocker | Profile Persistence | Calibration can be saved and reloaded | Save profile, restart client, re-open scene | Same transform restored within tolerance |
| S3 | FAIL | Blocker | Lock Behavior | Locked profile disables auto-fit overrides | Lock profile then trigger normal startup flow | Avatar remains at locked transform |
| S4 | FAIL | High | Blender Normalization | Helper script normalizes source avatar consistently | Run normalization script on sample rig | Report generated and root/floor/axis rules satisfied |
| S5 | FAIL | High | Multi-Viewport Framing | Profile quality stable across target viewports | Test desktop/tablet/mobile screenshots | No off-screen avatar body parts at intended framing |
| S6 | FAIL | High | Environment Anchor Contract | Environment anchor schema finalized | Validate against one sample environment file | Schema complete and parseable by runtime |
| S7 | FAIL | Medium | Interaction Contract | Interaction points schema finalized | Validate sample `interaction-points.json` | Contains position/forward/pose requirements |
| S8 | FAIL | Medium | Tooling Documentation | Operator instructions for calibration workflow | Read runbook and execute end-to-end once | New operator can calibrate without source edits |

## Verification Commands (to run once implemented)
- `npm run check` (playcanvas + control panel)
- `powershell -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1 -BuildFirst`
- `powershell -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1 -EnsureBackend`
- `powershell -ExecutionPolicy Bypass -File .\tools\run-staging-calibration-smoke.ps1` (new)
- `python .\tools\normalize_avatar_staging.py --input <blend> --report <path>` (new)

## Ownership Suggestion
- PlayCanvas calibrator + runtime lock: Client/Runtime
- Blender normalization helper: Pipeline/Tools
- Contracts and validation rules: Tech Design + Runtime
- Operator docs and QA checklist: Product Ops
