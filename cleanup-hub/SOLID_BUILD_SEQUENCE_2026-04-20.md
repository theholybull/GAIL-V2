# Solid Build Sequence 2026-04-20

This is the recommended order for turning the current Gail sprawl into a solid single-root build.

## Phase 1: Lock The Active System

Goal:

- stop drift

Actions:

1. keep `working_copy` as the only active repo
2. keep cleanup decisions logged in `cleanup-hub`
3. keep feature work inside repo boundaries only

Done enough to proceed:

- yes

## Phase 2: Pull In The Animation Importer

Goal:

- make animation import part of the repo-dependent system instead of a loose sidecar

Actions:

1. vendor importer source into `tools/anim-avatar-importer/`
2. keep or migrate its data/log outputs into repo-owned `data/`
3. make the animation library root configurable
4. make all output paths repo-relative
5. keep the current port `8888` contract so the shell animation workbench still works

Current helper added:

- `tools/start-animation-importer.ps1`
  - prefers a future integrated repo importer
  - currently falls back to the legacy sidecar importer root

Success criteria:

- shell can rely on a repo-local launcher
- importer no longer assumes external `working_copy` path hacks

## Phase 3: Stabilize Avatar Intake And Runtime Asset Contracts

Goal:

- make new avatar imports land in predictable places

Actions:

1. define a repo-owned avatar intake/staging root
2. normalize persona/main asset contract
3. reconcile `playcanvas-app/config/work-lite-modules.gail.json` with the actual asset tree
4. remove overlapping legacy/private/persona path ambiguity

Success criteria:

- imported avatars and clips land in controlled repo paths
- runtime manifest and real asset tree agree

## Phase 4: Implement Real Staging

Goal:

- replace fragile auto-staging with manual deterministic staging

Actions:

1. add `playcanvas-app/config/staging-profiles.json`
2. add manual calibrator controls
3. save/load locked profiles
4. disable auto-fit when a profile is locked
5. add a Blender normalization helper or equivalent audit step

Success criteria:

- staging becomes a controlled system, not a recurring visual firefight

## Phase 5: Exit Work-Lite Containment

Goal:

- move from temporary visible-avatar containment to a stable real runtime

Actions:

1. restore correct body materials and textures
2. settle on a real modular rig/runtime contract
3. resolve blink path duplication
4. reintroduce animation only when the rig/export path supports it

Success criteria:

- work-lite is no longer dependent on containment hacks to stay visible

## Phase 6: Harden The Product

Goal:

- turn the assembled system into something that can survive repeated use

Actions:

1. add shell smoke coverage
2. add importer smoke coverage
3. add staging smoke coverage
4. tighten docs drift checks
5. keep logs, state docs, and cleanup docs synchronized

Success criteria:

- one-command startup paths exist
- one-command verification exists for core flows
- the system is understandable and repeatable from one repo root

## Recommended Immediate Next Directive

If work starts now, the highest-leverage next implementation move is:

1. promote the animation importer into the repo
2. then clean the asset contract
3. then implement real staging

That order matches the current blocker chain:

- importer first
- staging second
- solid runtime third
