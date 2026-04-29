# Gail Private Persona, Wardrobe Pipeline, and Material Finish Plan (Pass/Fail)

Date: 2026-04-04
Scope: Add private sub-modes, avatar/clothing inheritance logic, shell controls for persona assets, DAZ export workflow prep, and mesh shine reduction.

## Persona Modes (Private)
- `private_counselor` (default when entering private)
- `private_girlfriend` (switch phrase trigger)

Requested trigger phrase:
- `"doc im lonley"` (exact phrase support)

Recommended robustness:
- Also accept `"doc i'm lonely"` and `"doc im lonely"` as alias phrases.

## Required Behavior
1. Mode defaults
- Entering private mode sets active private persona to `private_counselor`.
- Phrase `doc im lonley` switches to `private_girlfriend`.

2. Avatar/wardrobe inheritance rules
- Main avatar owns: body + hair + clothing + accessories.
- Counselor fallback rules:
  - If counselor body/hair/clothing/accessory not set, inherit all missing parts from main.
- Girlfriend fallback rules:
  - If girlfriend body/hair not set, inherit body and hair from main.
  - Girlfriend must not inherit clothing/accessories from main unless explicitly enabled later.

## Proposed Asset Layout
Use one canonical root per runtime avatar system (example shown for `gail`):

- `playcanvas-app/assets/gail/main/`
  - `avatar/body/*.glb`
  - `avatar/hair/*.glb`
  - `avatar/clothing/*.glb`
  - `avatar/accessories/*.glb`
- `playcanvas-app/assets/gail/private/counselor/`
  - `avatar/body/*.glb`
  - `avatar/hair/*.glb`
  - `avatar/clothing/*.glb`
  - `avatar/accessories/*.glb`
- `playcanvas-app/assets/gail/private/girlfriend/`
  - `avatar/body/*.glb`
  - `avatar/hair/*.glb`
  - `avatar/clothing/*.glb` (optional, explicit only)
  - `avatar/accessories/*.glb` (optional, explicit only)

## Runtime Config Files to Add
- `data/client/private-persona-settings.json`
- `data/client/private-persona-asset-map.json`

Suggested schema fields:
- `defaultPrivatePersona`
- `phraseTriggers[]`
- `personas.main|private_counselor|private_girlfriend`
- per-part asset refs: `body`, `hair`, `clothing[]`, `accessories[]`
- fallback policy flags per persona:
  - `inheritBodyFromMain`
  - `inheritHairFromMain`
  - `inheritClothingFromMain`
  - `inheritAccessoriesFromMain`

## Shell UX Additions (Operator Studio)
Add a new page in shell: `Private Persona Manager`

Controls:
- Active private persona selector.
- Trigger phrase editor list (with enable/disable).
- Asset pickers by part: body/hair/clothing/accessories per persona.
- Fallback policy toggles per persona.
- Import actions:
  - `Import DAZ Export` (single file)
  - `Run DAZ Capture` (guides user to DAZ script path)
  - `Run Blender Normalize + Convert` (pipeline)
- Dry-run validation pane showing resolved final asset set for each persona.

## DAZ -> Blender -> PlayCanvas Pipeline
Current repo reality (as of 2026-04-04):
- `tools/daz-export-scripts/README.md` lists several scripts.
- Only these are currently present in folder:
  - `export_current_pose_preset.dsa`
  - `export_current_animation_preset.dsa`
- Missing from folder (must be restored/added):
  - `export_avatar_fbx.dsa`
  - `export_all_clothing_fbx.dsa`
  - `export_fitted_wearables_fbx.dsa`
  - `export_selected_clothing_fbx.dsa`
  - `export_selected_hair_fbx.dsa`

Pipeline plan:
1. DAZ export
- Export body/hair/clothing from active figure (manual script-run in DAZ).

2. Blender normalization
- Recenter, axis normalize, apply transforms, merge/clean materials.
- Generate report JSON per export.

3. PlayCanvas packaging
- Convert to target GLB names + place in persona folder.
- Update persona asset map.
- Run manifest refresh check.

## Mesh Shine Reduction Plan
Primary fix path:
1. In Blender (source fix)
- Normalize Principled BSDF defaults for skin/clothes/hair.
- Remove unintended metallic values.
- Raise roughness into sane ranges by material class.
- Export GLB with controlled material settings.

2. In PlayCanvas (runtime safety clamp)
- Keep/enhance existing material tuning path in `playcanvas-app/src/main.ts`.
- Add stricter matte profile presets by usage (`body`, `clothing`, `hair`).
- Force `metalness=0` and remove metalness/spec maps for non-metal surfaces unless whitelisted.

3. Shell controls
- Add "Material Finish" presets:
  - `cinematic_soft`
  - `neutral_matte` (default)
  - `performance_matte`

## Pass/Fail Gates
| ID | Status | Priority | Area | Requirement | Verification | Pass Criteria |
|---|---|---|---|---|---|---|
| PVT1 | FAIL | Blocker | Mode Default | Private mode enters `private_counselor` | Switch to private and inspect active persona | Active persona always `private_counselor` unless overridden by trigger |
| PVT2 | FAIL | Blocker | Phrase Trigger | `doc im lonley` switches to `private_girlfriend` | Send trigger via typed + voice control intent | Persona changes and state persists for session |
| PVT3 | FAIL | Blocker | Counselor Inheritance | Counselor inherits full missing stack from main | Clear counselor assets then load private counselor | Body/hair/clothing/accessories all resolve without missing parts |
| PVT4 | FAIL | Blocker | Girlfriend Inheritance | Girlfriend inherits only body+hair when missing | Clear girlfriend assets then load private girlfriend | Body/hair resolve; clothing/accessories remain explicit-only |
| PVT5 | FAIL | High | Shell Controls | Operator can set persona assets and fallback flags | Use new shell page to edit + save | Settings persist and affect runtime manifest resolution |
| PVT6 | FAIL | High | DAZ Pipeline | Missing DAZ scripts restored and runnable | Validate script inventory + run one export | Export file + metadata sidecar generated |
| PVT7 | FAIL | High | Shine Quality | Matte finish defaults remove plastic/glossy look | Run visual check on body/hair/clothes under stage lighting | No over-shine artifacts on non-metal surfaces |
| PVT8 | FAIL | Medium | Validation | Dry-run resolved asset report available | Trigger validation in shell | Report lists final selected assets and fallback sources per persona |

## Implementation Notes
- Keep this as a neutral persona-routing system in code (config-driven persona IDs).
- Label text in UI can remain user-editable while core routing uses stable IDs.
- Avoid hardcoding direct clothing assumptions in loader logic; use policy map instead.

## Recommended Build Order
1. Add private persona config schema + backend service read/write.
2. Add command phrase mapping and private persona state transitions.
3. Add loader inheritance resolver in PlayCanvas client.
4. Add shell page for persona asset assignment + fallback toggles.
5. Restore/add DAZ clothing/avatar export scripts and pipeline hooks.
6. Add matte profile controls + visual regression checks.
