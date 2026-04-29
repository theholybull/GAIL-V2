# Animation Trigger Implementation Baseline

Date: 2026-04-23

## Purpose

This document is the implementation starting point for the Gail animation system.
It merges the existing master animation plans, the Action Composer plan, and the
current `work-lite` runtime behavior into one execution contract.

This is not a speculative redesign.
It is the factual baseline for what exists now, what is still missing, and the
order we should build the next animation/trigger layers.

## Source Of Truth

Primary planning docs:

- `docs/MASTER_ANIMATION_PLAN_IDLE_FOUNDATION.md`
- `docs/MASTER_ANIMATION_PLAN_PROP_AND_TRANSITION_MATH.md`
- `docs/Build plan 4_4/GAIL_ANIMATION_ACTION_COMPOSER_PLAN.md`
- `docs/Build plan 4_4/GAIL_AI_AUTONOMY_AND_VOICE_PLAN.md`

Primary current runtime:

- `playcanvas-app/src/work-lite-rebuild.ts`

Primary Blender-side authoring area:

- `blender/animation_master/`

## Current Live Runtime State Machine

Confirmed in `work-lite-rebuild.ts`:

- skeletal animation states currently recognized:
  - `idle`
  - `talk`
  - `listen`
  - `ack`
  - `dance`
- runtime loads animation assets from the manifest by `kind === "animation"`
- animation tracks are assigned by slot:
  - `idle -> idle`
  - `talk -> talk`
  - `listen -> listen`
  - `ack -> ack`
- if `talk`, `listen`, or `ack` is missing, runtime falls back to `idle`

### Current desired-state logic

The active state is currently chosen from runtime conditions:

- `dance` when dance mode is active
- `talk` when Gail is speaking
- `listen` when follow-up or microphone listening is active
- `idle` otherwise

This means the live client already has a working base state machine, but it is
still narrower than the planned animation system.

## Current Live Trigger Classes

### 1. Conversation lifecycle triggers

These already drive animation changes indirectly through runtime state:

- assistant speaking -> `talk`
- active listening/follow-up listening -> `listen`
- silence/no command/no speech -> `idle`

### 2. Explicit command triggers

Current inline voice-command handling already supports:

- stop talking / silence
- switch to always listening
- switch to wake-word mode
- vision/camera look request
- switch persona:
  - `normal`
  - `private_counselor`
  - `private_girlfriend`
- dance start
- dance stop / return to idle

### 3. Persona triggers

Persona changes already alter:

- avatar asset selection
- voice/persona behavior
- dance path selection

Persona switching is live, but it is not yet tied to a fuller animation profile
set beyond the current base runtime states.

### 4. Procedural motion overlays

These are live and already improving realism:

- facial micro movement
- body breathing
- weight shift / settle
- long-response breathing pauses
- talk nod / mouth movement

These are not replacements for authored clips.
They are overlays on top of the skeletal state system.

## What The Plan Actually Requires Beyond Current Runtime

The master docs require more than the current five-state runtime.

### A. Idle-first authoring contract

Required:

- all loop families start from one neutral idle anchor
- all new actions must have idle-linked entry/exit behavior
- no clip family should be authored in isolation without the idle anchor

Current status:

- partially true in runtime behavior
- not yet formalized as an enforced build contract across every new clip family

### B. Text-only animation path

Required:

- text-only mode must use a typing/texting animation
- text-only mode must suppress talking mouth animation

Current status:

- explicitly required by the plan
- not yet implemented as a dedicated runtime state

### C. Trigger-driven action system

Required:

- animations should respond to more than just speak/listen/dance
- trigger classes should include:
  - conversation state
  - operator command
  - persona
  - device mode
  - text-only mode
  - vision/camera mode
  - scene/prop context

Current status:

- partly implemented through regex command handling
- not yet centralized as a formal trigger router or action contract

### D. Prop-based state families

Required:

- office chair prop + seated pose family
- couch prop + lounge pose family
- prop-ready anchor and transition math

Current status:

- planned in docs
- not yet implemented in runtime state families

### E. Action composition workflow

Required:

- drag/drop clip composition
- Blender-generated transition fills
- viewport preview
- approve or send back with correction notes

Current status:

- fully planned
- not yet implemented

## The State System We Should Build Next

This is the recommended near-term animation state contract.

### Core baseline states

These should be considered Phase 1 mandatory:

- `idle_neutral`
- `idle_focused`
- `listen`
- `talk`
- `ack`
- `typing`

### Extended states

These should be Phase 2 after baseline states are stable:

- `dance`
- `vision_inspect`
- `prop_ready`
- `seat_office_idle`
- `seat_office_talk`
- `seat_office_listen`
- `seat_couch_idle`
- `seat_couch_talk`
- `seat_couch_listen`

### Overlay systems that remain procedural

- blink
- eye focus
- subtle mouth asymmetry
- breathing
- shoulder/chest lift
- small body settle

## Trigger Model We Should Build Next

The next implementation should use trigger classes, not one-off animation hacks.

### Trigger class 1: conversation state

Drives:

- `idle_neutral`
- `listen`
- `talk`
- `ack`

Sources:

- microphone active
- assistant speaking
- response completed
- short confirmation response

### Trigger class 2: interaction mode

Drives:

- `typing` when mode is text-only / typed
- suppress talk mouth movement when no spoken output is occurring

Sources:

- shell voice mode
- typed chat submit
- text-only workflow node

### Trigger class 3: explicit command

Drives:

- dance
- look/vision inspect
- stop action
- seated/scene actions later

Sources:

- voice commands
- shell action buttons
- command execution API

### Trigger class 4: persona

Drives:

- animation profile selection
- pose flavor
- allowed action set

Examples:

- Gail normal -> grounded work/presentational baseline
- Vera -> more restrained, clinical, measured
- Cherry -> warmer, softer, more playful

### Trigger class 5: scene / prop context

Drives:

- standing vs seated
- office chair family
- couch family
- prop-ready transitions

## Required Build Order

This is the order that best matches the existing plans and avoids drift.

### Phase 1: Lock baseline standing interaction system

1. Keep one neutral standing idle anchor as the root.
2. Split baseline states into:
   - `idle_neutral`
   - `listen`
   - `talk`
   - `ack`
   - `typing`
3. Implement typed/text-only trigger routing.
4. Ensure typed/text-only suppresses talk mouth animation.
5. Keep facial/body micro motion as overlays, not separate clip families.

### Phase 2: Formalize trigger routing

1. Create a trigger router contract:
   - conversation trigger
   - command trigger
   - persona trigger
   - mode trigger
   - prop/scene trigger
2. Stop scattering animation decisions across unrelated conditionals.
3. Make trigger -> target state resolution explicit and inspectable.

### Phase 3: Add seated/prop families

1. Build office chair prop + anchor poses.
2. Build couch prop + anchor poses.
3. Add `prop_ready` and seated state families.
4. Apply transition math from the master plan for generated transitions.

### Phase 4: Add action composition workflow

1. UI timeline / clip ordering
2. compose request/result contracts
3. Blender compose job
4. viewport preview
5. approve/send-back review loop

## Pass / Fail Gates For The Next Implementation Pass

### Gate T1: Typed/text-only animation correctness

Pass when:

- typed interactions use `typing`
- speaking mouth animation does not fire in text-only mode

### Gate T2: Trigger-to-state determinism

Pass when:

- each trigger class maps to a known target state
- conflicting triggers resolve predictably
- current target state can be explained from runtime data

### Gate T3: Idle-first continuity

Pass when:

- every new baseline clip family can enter from idle and return to idle cleanly
- no hard pop between standing baseline states

### Gate T4: Persona flavor without state drift

Pass when:

- persona changes alter animation style/profile
- persona changes do not break the same baseline state contract

### Gate T5: Prop family readiness

Pass when:

- chair and couch states have defined anchors
- seated transitions are math-driven, not guessed

## Immediate Next Step

The next concrete implementation should be:

1. introduce the dedicated `typing` state
2. route typed/text-only interaction into that state
3. suppress speaking mouth/talk behavior when typed/text-only is active
4. document the trigger resolution contract in code comments and project logs

That is the smallest useful slice that directly advances the plan without
rebuilding the whole animation system at once.
