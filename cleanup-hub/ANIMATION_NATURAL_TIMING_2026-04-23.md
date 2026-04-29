# Animation Natural Timing - 2026-04-23

Purpose:

- make the current `work-lite` avatar animation loops and transitions feel slower, smoother, and less twitchy
- keep the change runtime-only so no avatar GLBs, animation GLBs, or Blender exports are modified

Files changed:

- `playcanvas-app/src/work-lite-rebuild.ts`
- `playcanvas-app/index.html`

Runtime tuning:

- normal skeletal playback speed changed to `0.86x`
- dance playback speed changed to `0.68x`
- idle/talk/listen/ack/dance transition crossfades were lengthened
- talk/listen/idle confirmation delays were slightly increased
- short per-state hold times were added so the avatar does not flicker rapidly between states
- idle pose blend and talk amount easing were softened
- client cache key changed to `20260423-anim-natural1`

Boundary:

- no GLB assets changed
- no Blender/export scripts changed
- no avatar runtime config changed
- hair material settings from `20260423-hair-cull1` remain otherwise unchanged

Verification:

- `tools/build-playcanvas-app.ps1`: passed
- animation validator: passed `11` files, `0` errors, `0` warnings
- D source and live C mirror match for:
  - `playcanvas-app/src/work-lite-rebuild.ts`
  - `playcanvas-app/index.html`
  - `playcanvas-app/dist/playcanvas-app/src/work-lite-rebuild.js`
- live `/client/work-lite/` serves cache key `20260423-anim-natural1`
- served `/client/work-lite-rebuild.js?v=20260423-anim-natural1` contains the new speed/hold tuning

Operator follow-up:

- visual confirmation is needed for final feel
- if motion feels too sleepy, raise `WORK_LITE_ANIMATION_PLAYBACK_SPEED` from `0.86` toward `0.9`
- if transitions still pop, increase the relevant transition duration by about `0.1`
- if speech feels delayed, reduce the `talk` confirmation delay/hold slightly
