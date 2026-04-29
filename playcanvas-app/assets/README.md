# PlayCanvas Asset Intake

Current expected drop targets for the work-lite client:

- `avatar/base-avatar.glb`
  - temporary or primary rigged avatar
- `animations/idle.glb`
  - current idle animation test asset
- `backgrounds/work-bg.jpg`
  - 2D work-mode background plate
- `backgrounds/private-bg.jpg`
  - 2D Private Mode background plate

Current modular Gail asset paths already recognized by the runtime:

- `gail/avatar/base_face/gail_base_avatar.glb`
- `gail/hair/meili_hair/meili_hair.glb`
- `gail/clothes/urban_action_vest/urban_action_vest.glb`
- `gail/clothes/urban_action_pants/urban_action_pants.glb`
- `gail/clothes/urban_action_boots/urban_action_boots.glb`
- `gail/accessories/urban_action_bracelets/urban_action_bracelets.glb`

Idle animation fallback path also recognized:

- `..\blender\animation_master\exports\glb\clips\approved\idle\idle_base_v1.glb`

Prepared folders for the next asset pass:

- `environments/`
  - 3D room/environment assets
- `props/`
  - interactive room props and furniture
- `textures/`
  - shared texture maps or overrides
- `audio/`
  - later ambient/audio assets

If you only have a temporary image right now:

- put the work image at `backgrounds/work-bg.jpg`
- if you have a second image for Private Mode, put it at `backgrounds/private-bg.jpg`

If you have a temporary avatar file with a different name:

- rename/copy it to `avatar/base-avatar.glb`

If the idle animation is still being tuned:

- you can drop it in later as `animations/idle.glb`
- the asset manifest will keep reporting that slot as missing until it exists
