# Full 3D Environment, Interaction, Control, and Pose Pipeline Plan

Date: 2026-04-23

## Purpose

This document defines the next planning layer above the current Gail avatar
runtime.

It covers:

- full 3D environment needs
- emotion and animation trigger needs
- interactive object/system needs
- direct avatar control by keyboard or gamepad
- DAZ -> Blender -> AnimoXTend -> runtime animation generation flow

This is the planning baseline for building a richer, fully rendered interactive
scene instead of only a staged avatar surface.

## Straight Answer On Keyboard / Gamepad Control

This is not impossible.
It is also not a monumental task if we stage it correctly.

There are two versions of "control the avatar":

### 1. In-place avatar control

Examples:

- trigger emotes
- trigger poses
- rotate in place
- switch animation families
- force look-left / look-right / look-at-camera
- start dance / stop dance

This is a relatively small feature once the trigger router exists.

### 2. Full movement control

Examples:

- walk avatar through the environment
- turn with stick or keys
- approach anchors
- sit on chair/couch
- interact with props
- follow collision and camera rules

This is a bigger subsystem, but still reasonable.
It should be treated as a proper runtime system, not a quick patch.

## Reuse-First Strategy

Do not build the first environment shell from zero if a suitable base can be
imported and adapted.

Use a base environment for:

- room shell
- floors/walls/furniture
- rough lighting reference
- camera feel reference
- collision volume starting point

Then layer Gail-specific systems on top:

- anchors
- interaction points
- persona/environment triggers
- object logic
- animation routing
- action broker constraints

The imported environment should be treated as a visual and spatial base, not as
the source of truth for runtime behavior.

## What We Already Have

### Runtime avatar baseline

Current runtime already supports:

- modular avatar loading
- persona-based avatar switching
- baseline animation states:
  - `idle`
  - `talk`
  - `listen`
  - `ack`
  - `dance`
- procedural overlays:
  - facial micro movement
  - breathing
  - body settle
  - talk nod
  - long-response breath pauses

### Existing planning docs

- `docs/ANIMATION_TRIGGER_IMPLEMENTATION_BASELINE_2026-04-23.md`
- `docs/MASTER_ANIMATION_PLAN_IDLE_FOUNDATION.md`
- `docs/MASTER_ANIMATION_PLAN_PROP_AND_TRANSITION_MATH.md`
- `docs/Build plan 4_4/GAIL_STAGING_CALIBRATION_AND_3D_PREP.md`
- `docs/Build plan 4_4/GAIL_ANIMATION_ACTION_COMPOSER_PLAN.md`
- `docs/Build plan 4_4/GAIL_PRIVATE_PERSONA_AND_WARDROBE_PIPELINE_PLAN.md`
- `docs/DEVICE_MATRIX.md`
- `docs/ACTION_BROKER_RULES.md`

### Existing data/runtime structure

Already present:

- device display profiles with:
  - `sceneId`
  - `avatarTransform`
  - `cameraTransform`
- runtime asset catalog with:
  - avatar parts
  - baseline animation slots
  - background slots
- action broker rules for low/medium/high risk actions

### Existing animation pipeline building blocks

Confirmed in repo:

- Blender animation master workflow
- pose capture scripts
- pose-loop generation
- action export pipeline
- local AnimoXTend retarget/export pipeline
- action composer plan

### DAZ export reality

The intended DAZ export workflow exists in docs and is the right direction:

- avatar export
- hair export
- clothing export
- current pose export
- current animation export

But the DAZ script inventory is not yet a fully reliable production baseline in
the working tree.
It should be treated as partially restored until verified end-to-end.

## What We Need For A Full 3D Environment

### 1. Environment contract

We need real scene definitions, not only background swaps or named `sceneId`s.

Add:

- `data/environment/environment-profiles.json`

Each environment should define:

- `id`
- `label`
- `theme`
- `lightingProfile`
- `backgroundOrSkybox`
- `floorPlane`
- `collisionPolicy`
- `cameraProfiles`
- `anchors`
- `interactionPoints`
- `allowedDeviceProfiles`

### 2. Anchor system

Every environment should have explicit anchors:

- `idle_anchor`
- `navigation_entry`
- `camera_focus_anchor`
- `seat_chair_anchor`
- `seat_couch_anchor`
- `desk_anchor`
- `prop_anchor_*`

The avatar should never be placed in the world by ad-hoc coordinates once this
system exists.

### 3. Interaction point contract

Add:

- `data/environment/interaction-points.json`

Each interaction point should define:

- `id`
- `environmentId`
- `type`
- `position`
- `forward`
- `approachAnchor`
- `requiredState`
- `allowedTriggers`
- `riskLevel`
- `brokerAction`
- `leftHandTarget`
- `rightHandTarget`
- `notes`

### 4. Avatar capability contract

Add:

- `data/environment/avatar-capabilities.json`

This should define:

- standing support
- seated support
- chair support
- couch support
- locomotion mode
- reach height range
- left/right hand interaction support
- IK availability
- gesture family support

## What We Need For Emotion And Triggering

### Current problem

Right now the avatar has life, but not a formal emotion layer.

We have:

- state-based animation
- procedural face/body motion
- voice-driven talk/listen behavior

We do not yet have:

- explicit emotional state mapping
- intensity control by context
- emotion-aware gesture flavor
- persona-aware pose selection

### Add emotion trigger map

Add:

- `data/animation/emotion-trigger-map.json`

This should map triggers to:

- emotion family
- posture bias
- facial bias
- gesture intensity
- breathing profile
- idle variation family
- transition softness

### Trigger classes

Use these trigger classes:

- conversation state
- intent type
- persona
- device mode
- environment context
- interaction target
- operator command
- direct control input

### Emotion families to support first

- neutral
- attentive
- technical_focus
- warm
- playful
- reassuring
- concerned
- celebratory
- flirtatious
- reflective

## What We Need For Interactive Objects

The first useful interaction targets should be:

- office chair
- couch
- desk or bench
- monitor/screen
- mug
- phone/tablet
- note board / task wall
- window/look target

For each object family we need:

- anchor
- approach rule
- pose family
- optional hand target
- return-to-idle path

## Direct Control Plan

### Phase C1: Emote / pose pad

This is the easiest version and should come first.

Keyboard/gamepad can trigger:

- idle variants
- listen pose
- ack
- dance
- typing
- look left/right/up/down
- chair sit
- couch sit
- inspect object

This can be implemented without world locomotion.

### Phase C2: Stage rotation / camera-relative control

Keyboard/gamepad can:

- rotate avatar
- nudge to anchors
- cycle camera profiles
- toggle persona animation profile

Useful for testing and operator direction.

### Phase C3: Full locomotion control

Keyboard/gamepad can:

- walk forward/back
- strafe/turn
- snap to interaction anchors
- sit/stand
- exit interaction state

This needs:

- collision support
- anchor resolver
- movement state family
- camera follow rules

## Recommended Keyboard / Gamepad Mapping

### Keyboard

- `W A S D`: move / nudge / future locomotion
- `Q E`: turn left/right
- `1 2 3 4 5`: idle/listen/talk/ack/typing quick states
- `R`: reset to idle anchor
- `F`: interact with nearest anchor
- `C`: sit chair / stand toggle
- `V`: couch / lounge toggle
- `G`: dance toggle

### Gamepad

- left stick: move
- right stick: rotate / camera
- `A`: interact / confirm
- `B`: cancel / exit state
- `X`: emote wheel / pose wheel
- `Y`: context action
- d-pad: quick state selectors
- shoulders: cycle anchors or objects

## Animation / Pose Content Reality

Yes, we are going to need a lot of animation and pose content.

That is expected, not a failure of planning.

The key is to avoid authoring everything as full bespoke clips.

We should build the content in four layers:

### Layer 1: anchor poses

Examples:

- neutral standing
- focused standing
- talk standing
- typing standing
- prop-ready
- chair seated neutral
- couch seated neutral

### Layer 2: short loop families

Examples:

- idle variations
- listen variations
- talk variations
- typing loop
- chair idle
- couch idle

### Layer 3: transitions

Generated or authored between anchors:

- idle -> listen
- idle -> talk
- idle -> typing
- stand -> chair
- stand -> couch
- interaction enter / exit

### Layer 4: composed actions

Examples:

- walk to desk -> sit -> type
- pick up mug -> hold -> set down
- look to monitor -> explain -> return

## DAZ -> Blender -> AnimoXTend Pipeline We Need

Your stated workflow is correct:

1. export animation and pose material from DAZ
2. bring that into Blender
3. use AnimoXTend / generation pipeline to create the in-between motion
4. clean and approve the result
5. export runtime-ready clips

That should become the standard production pipeline.

### Pipeline layers

#### P1. DAZ export layer

Needed outputs:

- avatar/body
- hair
- clothing
- static poses
- animation ranges

#### P2. Blender ingest layer

Needed tasks:

- import DAZ exports
- normalize axis/scale
- map to Gail production rig
- register provenance

#### P3. Pose-to-motion generation layer

Use:

- AnimoXTend generation / retarget tools
- pose-loop generation
- action composition

Outputs:

- transition fills
- loop variants
- short composite actions

#### P4. Cleanup / approval layer

Needed checks:

- no foot slide
- no wrist collapse
- no shoulder breakage
- no floor clipping
- good contact alignment
- loop continuity

#### P5. Runtime export layer

Outputs:

- approved clip GLBs
- clip metadata
- interaction/state assignment

## What Is Already Built Toward That Pipeline

Already present:

- pose capture tools
- pose-loop generation tools
- animation master workflow
- action export tooling
- AnimoXTend local retarget/export pipeline
- action composer planning doc

Still missing or not yet fully locked:

- verified end-to-end DAZ export inventory
- standardized static-pose ingestion flow
- approved pose-to-transition generation workflow
- runtime mapping for interaction families
- high-volume review tooling for hundreds of poses

## What We Can Reuse From PlayCanvas

Official PlayCanvas reuse paths worth using:

### 1. Asset Store / Sketchfab store

PlayCanvas officially exposes a built-in Asset Store in the Editor, with:

- PlayCanvas-curated assets
- sky boxes
- templates
- textures
- Sketchfab models

This is the best place to look for:

- room/environment base meshes
- furniture
- props
- HDR/skybox assets

### 2. Third-person controller tutorial project

PlayCanvas has an official third-person controller tutorial project.

This is a good starting point for:

- keyboard movement
- camera follow
- physics-backed movement
- control structure

We should not copy it blindly into Gail, but it is a valid base for the control
layer if we move beyond in-place emote control.

### 3. Touch joypad tutorial/library

PlayCanvas has an official touchscreen joypad control tutorial/library.

This is useful for:

- mobile display modes
- kiosk touch control
- future on-screen movement/emote pads

### 4. Templates

PlayCanvas templates are the right reuse mechanism for:

- room chunks
- props
- interaction stations
- anchor-marked prefabs

Imported environment pieces should become templates once they are cleaned.

## Recommended Reuse Policy

### Reuse now

- environment shell
- furniture
- prop meshes
- skybox / HDR / lighting references
- control starter pattern

### Build ourselves

- interaction contract
- anchor system
- emotion trigger map
- Gail animation resolver
- persona-aware state logic
- DAZ/Blender/Animo pose-to-motion pipeline

### Avoid relying on external packs for

- Gail-specific animation semantics
- persona behavior
- interaction logic
- runtime action safety
- final avatar rig rules

## Recommended Build Order

### Phase 1: Contracts first

1. environment profiles
2. interaction points
3. avatar capabilities
4. emotion trigger map

### Phase 2: Direct-control starter path

1. keyboard emote/pose controls
2. gamepad emote/pose controls
3. direct trigger routing to state system

This gives immediate operator value without full locomotion.

### Phase 3: Pose and animation ingestion

1. verify DAZ export script inventory
2. define pose export naming and sidecars
3. define Blender ingest path for static poses and short ranges
4. define AnimoXTend generation jobs for in-betweens

### Phase 4: Standing environment interactions

1. inspect object
2. look target
3. desk anchor
4. prop-ready anchor

### Phase 5: Seated families

1. office chair
2. couch
3. seated idle/listen/talk
4. seated interaction enter/exit transitions

### Phase 6: Full locomotion

1. movement state family
2. anchor navigation
3. collision / snap rules
4. camera follow / framing rules

### Phase 7: Action composer production flow

1. drag/drop sequence design
2. Blender compose jobs
3. viewport preview
4. approve / correction workflow

## Recommended Decision

Do not start with full free-roam locomotion.

Start with:

1. environment contracts
2. keyboard/gamepad emote + pose control
3. DAZ pose/animation ingestion baseline
4. seated/prop interaction families

That gets visible progress quickly and also builds the right foundation for the
fully rendered interactive scene later.

## Immediate Next Step

The best next implementation slice is:

1. define the environment/interaction/emotion JSON contracts
2. add keyboard-triggered and gamepad-triggered direct state controls
3. add `typing` and seated target states to the animation plan
4. standardize the DAZ pose export -> Blender ingest -> generation review path

That is the fastest path to making the avatar feel controllable, interactive,
and ready for a real scene without jumping straight into a messy locomotion
system.
