# Gail UI Overhaul Plan (Blender-Style) (Pass/Fail)

Date: 2026-04-04
Scope: Replace fragmented operator UI with a workspace-first shell focused on viewport work, AI workflow building, and drag-drop asset scene assembly.

## Vision
One shell. Three primary workspaces. Minimal clicks.

Primary workspaces:
- `Viewport` (stage/camera/avatar/framing)
- `AI Workflow` (prompt graph, runs, approvals, logs)
- `Scene Build` (asset browser + drag/drop + hierarchy + material/transform)

## Core UX Direction (Blender-Inspired)
1. Single dockable layout
- Top bar: workspace tabs + quick actions.
- Left panel: outliner/assets (collapsible).
- Center: main canvas (viewport/workflow/scene).
- Right panel: context properties/inspector.
- Bottom strip: timeline/log/tasks/output.

2. Workspace presets
- `Layout: Viewport Focus`
- `Layout: Workflow Focus`
- `Layout: Asset Build Focus`

3. Fast interaction model
- Keyboard-driven command palette.
- Right-click context actions in canvas/outliner.
- Drag-drop assets directly into scene graph.
- One-click frame reset and camera presets.

## Problems to Eliminate
- Too many disconnected pages for one task.
- Critical controls buried in settings blocks.
- Framing/viewport controls split across panels.
- Redundant controls for avatar/runtime scattered in multiple pages.
- Poor visual hierarchy and too much operator cognitive load.

## Information Architecture
Top-level tabs only:
- `Viewport`
- `AI Workflow`
- `Scene Build`
- `Ops` (secondary; health/providers/keys/devices)

Everything else becomes panel modules inside those tabs.

## Implemented Shell Module Inventory (Added 2026-04-06)

Current live shell deep links that already exist and must be treated as first-class workspace modules in this plan:

- `/panel/module/workflow-studio` - Workflow Studio
- `/panel/module/build-control-tower` - Build Control Tower
- `/panel/module/avatar-library` - Avatar Library
- `/panel/module/wardrobe-manager` - Wardrobe Manager
- `/panel/module/animation-library` - Animation Library
- `/panel/module/action-graph` - Action Graph
- `/panel/module/animation-state-machine` - Animation State Machine
- `/panel/module/gesture-expression` - Gesture and Expression
- `/panel/module/asset-binding` - Asset Binding and Validation
- `/panel/module/live-preview-stage` - Live Preview Stage
- `/panel/module/runtime-mapping` - Runtime Mapping (Client Last)
- `/panel/module/devices-auth` - Devices and Auth
- `/panel/module/providers-voice` - Providers and Voice
- `/panel/module/change-governance` - Change Governance
- `/panel/module/feature-inbox` - Feature Inbox
- `/panel/module/report-bugs` - Report Bugs
- `/panel/module/pass-review` - Pass Review
- `/panel/module/organizer-control` - Organizer Control

Current implementation note:

- `Live Preview Stage` and `Runtime Mapping (Client Last)` are live operator modules, but they are still diagnostics-first surfaces and do not yet satisfy the full staging/blending workspace target.
- `Animation Library` is live for catalog/export/viewer work, but the dedicated drag-drop action composer lane remains a blocker until clip composition, gap-fill, and review controls are promoted into the main workspace.

## Workspace Details
### Viewport
Goal: always-on framing and staging control.
- Canvas center: live render.
- Left: Scene Outliner (avatar, anchors, lights, camera).
- Right: Transform/Camera/Lighting/Material quick controls.
- Bottom: diagnostics timeline + event log.

Must-have quick tools:
- Frame avatar, reset camera, safe-area guides, device aspect previews.
- Manual staging controls (position/rotation/scale lock profile).
- Material finish presets (`neutral_matte` default).

### AI Workflow
Goal: build/run workflows without leaving the workspace.
- Center: node/step graph with run state.
- Left: workflow templates + context sources.
- Right: selected node settings + provider/model profile.
- Bottom: execution logs, artifacts, approvals.

Must-have quick tools:
- Create plan, run next, pause, approve/reject.
- Provider/model selector pinned (no deep menu).
- Replay/test transcript panel.

### Scene Build
Goal: drag/drop assets and assemble personas/scenes quickly.
- Left: asset library + filters (body/hair/clothing/accessories/animations/backgrounds).
- Center: scene assembly canvas + hierarchy.
- Right: asset inspector + import/export + fallback policy toggles.
- Bottom: import queue + conversion status.

Must-have quick tools:
- Drag asset to slot.
- Validate compatibility.
- Apply to persona (`main`, `private_counselor`, `private_girlfriend`).
- Run pipeline actions (DAZ import handoff, Blender normalize, publish).

## Settings Redesign
Current settings sprawl becomes:
- `Quick Settings` (top-right utility menu): mode, profile, quality, voice, provider.
- `Deep Settings` (Ops tab): auth/devices/keys/advanced runtime.

Rule:
- No workflow-critical setting may require more than 2 clicks from active workspace.

## Framing and Display Standards
- Fixed safe frame overlay for all device targets.
- No primary action below fold at 1280x720 and 390x844.
- Inspector width constrained to avoid canvas starvation.
- Drawer/panel states persist per workspace.

## Drag-and-Drop Standards
- Supported drops: `.glb`, `.gltf`, textures, compatible manifests.
- Drop feedback states: `valid`, `invalid`, `requires-conversion`.
- Every drop creates a visible import job card with status.

## Pass/Fail Gates
| ID | Status | Priority | Area | Requirement | Verification | Pass Criteria |
|---|---|---|---|---|---|---|
| UI1 | FAIL | Blocker | Navigation | Three primary workspaces replace page maze | Open shell and perform 3 core tasks | Each task starts from one workspace with <=2 context switches |
| UI2 | FAIL | Blocker | Framing | Viewport safe frame + camera quick tools always accessible | Resize desktop/mobile + run framing actions | No off-screen critical controls; frame reset works every time |
| UI3 | FAIL | Blocker | Workflow Build | Workflow creation/plan/run in one workspace | Build and run test workflow | No page hopping required; logs visible in same workspace |
| UI4 | FAIL | Blocker | Scene Build | Drag-drop assets into scene/persona slots | Drop valid/invalid assets | Correct validation state and import job visibility |
| UI5 | FAIL | High | Settings Simplification | Quick settings accessible globally | Change voice/provider/quality from each workspace | Changes applied in <=2 clicks |
| UI6 | FAIL | High | Redundancy Removal | Duplicate controls removed or merged | Audit old pages vs new modules | No duplicate runtime apply controls across workspaces |
| UI7 | FAIL | High | Responsive Layout | Desktop/tablet/mobile maintain usability | Run viewport + workflow + scene tests at target sizes | No primary action hidden/off-screen |
| UI8 | FAIL | Medium | Learnability | New operator can complete top 5 tasks quickly | Timed usability test | >=80% task success without guidance |

## Build Phases
1. Phase A (Shell framework)
- Implement workspace tab shell and docked panel regions.
- Keep old pages behind feature flag.

2. Phase B (Viewport workspace)
- Move staging/framing/material controls into unified viewport workspace.
- Add safe frame + device previews.

3. Phase C (AI Workflow workspace)
- Embed planning/runs/logs in one panel set.

4. Phase D (Scene Build workspace)
- Add drag-drop, asset slots, persona assignment, import queue.

5. Phase E (Ops + cleanup)
- Move deep settings to Ops.
- Remove redundant legacy controls.

## Technical Implementation Targets
- `web-control-panel/src/operator-studio-shell.js`
- `web-control-panel/src/styles/operator-studio-shell.css`
- `web-control-panel/operator-studio-shell.html`
- `playcanvas-app/src/main.ts` (viewport integration hooks)
- shared config contracts for workspace state persistence

## Definition of Done
- UI gates `UI1` to `UI7` = PASS.
- Existing critical actions still available.
- Legacy shell paths removed or disabled by default.

## UI v2 Selected Style (Added 2026-04-04)

Selected style is now locked to Asset-First Studio (Mockup 4):
- `GAIL_UI_ASSET_FIRST_STUDIO_V2_SPEC.md`

This includes:
- mandatory noob help blocks on every page,
- dedicated `Report Bugs` workspace page,
- screenshot capture + persistent issue logging pipeline.
