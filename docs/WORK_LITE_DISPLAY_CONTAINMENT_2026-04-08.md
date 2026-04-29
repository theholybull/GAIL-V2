# Work-Lite Display Containment Notes

Date: 2026-04-08

## Why This Exists

Work-lite was moved onto a short-term display containment path after the animated modular avatar path corrupted scene bounds and destabilized rendering. The goal of this state is to keep the lite client loading a visible avatar while preserving enough information to diagnose or unwind the workaround later.

## Active Display-Side Behavior

Primary file:

- `D:\Gail\playcanvas-app\src\work-lite-rebuild.ts`

Current containment changes that are intentionally being kept:

1. Skeletal animation is disabled for work-lite through `WORK_LITE_SKELETAL_ANIMATION_ENABLED = false`.
2. The body still loads, clothing and hair still load as modular display assets, and speech / blink logic still runs.
3. The body render path still applies `applyVisibleBodyFallback(...)` from `flattenEntityMaterials(...)` when usage is `body`.
4. Clothing, accessories, and hair still use `alignEntityToReference(...)` for generic reference-bounds scaling and placement.
5. Eye blink behavior still combines morph-target blink weights from `collectEyeMorphTargets(...)` with transform offsets from `collectEyelidRigNodes(...)`.

Latest temporary live-bundle containment:

6. The currently served `work-lite-rebuild.js` keeps the softer blink pass with much smaller rig-lid offsets to avoid the eyelid / eyeball collapse issue.
7. The currently served `work-lite-rebuild.js` also clamps body material gloss / shininess much more aggressively to reduce the wet or plastic look.
8. The work-lite body animation clip-loading path is intentionally removed from the live runtime until a unified modular runtime rig exists.

## Visible Side Effects In This State

### White or plain body mesh

Cause:

- `applyVisibleBodyFallback(...)` is forcing body materials into a safety-visible state instead of preserving the original skin-material look.
- This is why the avatar can appear like a plain white or flat-tinted mesh instead of using proper skin textures and shading.

Intent:

- This fallback was kept because it makes the body reliably visible while the rest of the work-lite display path is being stabilized.

### Clothing fit is approximate

Cause:

- Modular clothing, accessories, and hair are being aligned by `alignEntityToReference(...)` using broad reference bounds rather than a unified skinned runtime rig.
- That produces acceptable placement for some assets, but it is not a true garment fit system.

Observed effect:

- Clothing can sit too loose, too tight, or slightly offset even when the body itself loads correctly.

### Goofy or exaggerated blink behavior

Cause:

- The blink system is currently driving both morph-based eyelid closure and eyelid rig-node position offsets.
- If the exported avatar already has strong blink morphs, the additional rig-node offsets can over-close or distort the eyes.

Observed effect:

- Eyes can look exaggerated, asymmetrical, or otherwise unnatural during blink.

Temporary containment now in use:

- Blink is running in the live bundle, but with reduced rig-node offsets so the eyes stay visually contained.

## What This Containment Fixed

- Work-lite stopped trying to animate the full modular avatar assembly as if it were one coherent animated rig.
- Final avatar bounds returned to a normal standing range instead of collapsing far below the floor.
- The lite route can load into a stable static avatar state while the body clip path remains available for later reactivation.

## What This Containment Did Not Fix

- It does not restore proper skin-texture presentation for the body.
- It does not make modular clothing fit like a truly skinned outfit set.
- It does not resolve the headless-browser WebGL context-loss noise.
- It does not solve the underlying long-term need for a unified animated runtime rig path.
- Reintroducing body clip playback before a unified runtime rig exists will bring back the disappearing-body bounds regression.

## If This Comes Up Again

Check these functions first in `D:\Gail\playcanvas-app\src\work-lite-rebuild.ts`:

- `flattenEntityMaterials(...)`
- `applyVisibleBodyFallback(...)`
- `alignEntityToReference(...)`
- `collectEyeMorphTargets(...)`
- `collectEyelidRigNodes(...)`

Expected symptoms of this containment state:

- visible avatar body, but flat/white skin look
- modular clothing that only approximately fits
- blink motion present, but visually overdriven
- shell state showing static work-lite avatar motion instead of live skeletal clip playback

## Long-Term Exit From This State

When revisiting this area, the clean path is:

1. Replace the body visibility fallback with correct exported skin materials and textures.
2. Replace generic reference-bounds clothing placement with exports that share the same runtime rig and fit assumptions.
3. Choose one blink path per avatar export: morph-only or rig-node-only, not both layered blindly.
4. Replace the temporary handoff clip mapping with a true exported idle / talk / listen set for this rig combo.
5. Revisit whether modular work-lite can safely stay on body-only skeletal playback without reintroducing the old bounds corruption.