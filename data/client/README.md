# Client Runtime Data

Active avatar/runtime source of truth:

- `avatar-runtime.json`

Do not edit these legacy split files for active avatar changes:

- `runtime-settings.json`
- `wardrobe-presets.json`

The shell-facing endpoints still exist:

- `GET/PATCH /client/runtime-settings`
- `GET/PATCH/POST/DELETE /client/wardrobe-presets`
- `GET /client/asset-manifest`

Those endpoints now read/write `avatar-runtime.json` so Avatar Library and Wardrobe remain the operator-facing control surfaces.
