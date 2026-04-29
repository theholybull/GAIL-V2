# Facial Micro Movement - 2026-04-23

Purpose:

- add subtle natural face motion while idle/listening/speaking
- avoid fixed scripted expression loops
- move expression groups together instead of twitching isolated morphs

Files changed:

- `playcanvas-app/src/work-lite-rebuild.ts`
- `playcanvas-app/index.html`

Runtime behavior:

- added a randomized facial micro-motion state machine
- retargets expression groups every `0.7` to `2.7` seconds
- eases into targets rather than snapping
- groups tiny mouth open, lower lip, chin, jaw, smile, and squint movement
- uses paired left/right smile and squint values with slight asymmetry
- dampens the micro layer while speaking so speech visemes remain readable
- keeps the motion runtime-only; no GLBs, Blender exports, or avatar config changed

Current cache key:

- `20260423-face-micro1`

Verification:

- `tools/build-playcanvas-app.ps1`: passed
- animation validator: passed `11` files, `0` errors, `0` warnings
- D working copy and live C mirror match for:
  - `playcanvas-app/src/work-lite-rebuild.ts`
  - `playcanvas-app/index.html`
  - `playcanvas-app/dist/playcanvas-app/src/work-lite-rebuild.js`
- live `/client/work-lite/` serves cache key `20260423-face-micro1`
- served JS contains `updateFacialMicroMotion` and `randomRange`

Tuning notes:

- if the face feels too busy, reduce the random target ranges in `updateFacialMicroMotion`
- if the mouth looks too still, raise `mouthBase`, `lowerLipTarget`, and `jawOpenTarget` ranges slightly
- if asymmetry reads crooked instead of alive, reduce `smileAsymTarget` and `squintAsymTarget`
