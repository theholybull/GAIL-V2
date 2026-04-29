# Body Alive Motion - 2026-04-23

Purpose:

- add subtle full-body life on top of the current animation clips
- make idle/listening/speaking feel less static
- keep the change runtime-only and reversible

Files changed:

- `playcanvas-app/src/work-lite-rebuild.ts`
- `playcanvas-app/index.html`

Runtime behavior:

- added a randomized body-alive motion state machine
- breathing now has randomized rate, depth, easing, and occasional inhale holds
- chest/spine rise and fall is shared into shoulders, head, arms, and torso posture
- subtle weight shift moves through spine/torso/hip-style sway without moving the feet
- existing head, neck, shoulder, and arm overlays now take the breathing layer as input
- long browser-speech chunks schedule a small breath pause before queued follow-up speech
- speech breath pauses also drive the body inhale layer

Current cache key:

- `20260423-body-alive1`

Boundary:

- no avatar GLBs changed
- no animation GLBs changed
- no Blender/export scripts changed
- no avatar runtime config changed
- this is procedural runtime motion, not baked animation

Verification:

- `tools/build-playcanvas-app.ps1`: passed
- animation validator: passed `11` files, `0` errors, `0` warnings
- D working copy and live C mirror match for:
  - `playcanvas-app/src/work-lite-rebuild.ts`
  - `playcanvas-app/index.html`
  - `playcanvas-app/dist/playcanvas-app/src/work-lite-rebuild.js`
- live `/client/work-lite/` serves cache key `20260423-body-alive1`
- served JS contains `updateBodyAliveMotion` and `scheduleSpeechBreathPause`

Tuning notes:

- if breathing is too visible, reduce `breathDepthTarget`, `chestLift`, and `shoulderLift` ranges in `updateBodyAliveMotion`
- if she still feels too still, raise `weightShiftTarget`, `hipSwayTarget`, or `breathDepthTarget` slightly
- if speech pauses feel too long, reduce `pauseMs` in `scheduleSpeechBreathPause`
- if speech feels rushed, increase the long-text threshold or pause range in `scheduleSpeechBreathPause`
