# Avatar Export Layout

## Intent

The exporter now treats avatars as isolated runtime roots instead of one shared asset bucket.

That solves two practical problems:

1. new avatars need their own base package without overwriting existing ones
2. existing avatars need modular updates without pretending every change is a full rebuild

## Runtime Root

Every avatar exports under:

```text
playcanvas-app/assets/gail/avatars/<avatar_id>/
```

## Structure

```text
<avatar_id>/
|-- base/
|   `-- <avatar_id>_base_avatar.glb
|-- hair/
|   `-- <hair_id>/
|       `-- <hair_id>.glb
|-- clothing/
|   |-- pieces/
|   |   `-- <piece_id>/
|   |       `-- <piece_id>.glb
|   `-- sets/
|       `-- <set_id>/
|           `-- <set_id>.glb
`-- accessories/
    `-- <accessory_id>/
        `-- <accessory_id>.glb
```

## Export Modes

### `new_avatar`

Use this for:

- first export of a new avatar
- base body/face changes that should replace the base package

Effect:

- exports base avatar
- exports any selected modular items too

### `existing_avatar_update`

Use this for:

- new hair
- new clothes
- new accessories
- incremental replacements for an existing avatar root

Effect:

- modular exports remain isolated under the avatar root
- batch base export is skipped unless you explicitly export an avatar module

## Clothing Modes

### `pieces`

Each selected clothing mesh becomes its own exported asset.

Best for:

- upper/lower separation
- footwear swaps
- layered outfits

### `set`

The selected clothing meshes export together as one runtime asset.

Best for:

- locked outfits
- curated look presets
- outfit bundles that should stay together

## Manifest Shape

`asset_partition.gail.json` now supports:

```json
{
  "avatar_exports": {
    "gail_default": {
      "avatar_id": "gail_default",
      "export_mode": "new_avatar",
      "body_face_group": {},
      "hair_groups": [],
      "clothing_groups": [],
      "clothing_sets": [],
      "accessory_groups": []
    }
  }
}
```

The exporter still accepts the old top-level `body_face_group`, `hair_groups`, `clothing_groups`, and `accessory_groups` structure for backward compatibility.

## Naming Expectations

Recommended object names in Blender:

- `rig_gail_master`
- `geo_gail_body`
- `geo_gail_face`
- `geo_hair_<name>`
- `geo_cloth_<slot>_<name>`
- `geo_acc_<slot>_<name>`

The add-on uses those names cleanly when building per-piece clothing ids.

## Example

For avatar `gail_default`:

- base avatar:
  - `gail/avatars/gail_default/base/gail_default_base_avatar.glb`
- hair:
  - `gail/avatars/gail_default/hair/meili_hair/meili_hair.glb`
- clothing piece:
  - `gail/avatars/gail_default/clothing/pieces/urban_action_vest/urban_action_vest.glb`
- clothing set:
  - `gail/avatars/gail_default/clothing/sets/urban_action_set/urban_action_set.glb`
- accessory:
  - `gail/avatars/gail_default/accessories/urban_action_bracelets/urban_action_bracelets.glb`
