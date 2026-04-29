# Naming Rules

## Action Name Grammar

Use this grammar for production actions:

```text
<category>_<descriptor>[_variant_##]_v#
```

Rules:

- lowercase only
- words separated by underscores
- no spaces
- no source tags in the action name
- no status tags in the action name
- version suffix is required
- variant token is optional

Examples:

- `idle_base_v1`
- `listen_base_v1`
- `think_base_v1`
- `talk_base_v1`
- `nod_small_v1`
- `idle_variant_01_v1`
- `remove_sweatshirt_v1`
- `put_on_jacket_v1`
- `adjust_hair_v1`

## Category Taxonomy

Use these primary categories:

- `idle`: neutral looping base states
- `listen`: attentive non-speaking states
- `think`: reflection or hesitation states
- `talk`: speaking body performance bases
- `react`: quick emotional reactions
- `gesture`: conversational hand and torso motion
- `emote`: broader expressive beats
- `ack`: affirmation or acknowledgement clips
- `transition`: state changes
- `locomotion`: support movement clips if later needed
- `interact`: generic body-world interactions
- `adjust`: self-touch or self-adjustment clips
- `remove`: clothing-removal interactions
- `put_on`: clothing-donning interactions
- `pose`: static holds used for staging or QA, not runtime by default
- `face`: reserved for future shape-key-only face clips

Examples by category:

- `react_surprised_small_v1`
- `gesture_hand_open_right_v1`
- `ack_yes_small_v1`
- `transition_idle_to_listen_v1`
- `adjust_sleeve_right_v1`
- `remove_sweatshirt_v1`
- `put_on_jacket_v1`
- `face_smile_soft_v1`

## Version Rules

- Increment the trailing version only when the clip meaning stays the same but the authored motion changes enough to replace the prior version.
- Do not bump the version for registry metadata edits only.
- Do not create `v2` just because export settings changed.
- Keep superseded actions archived, not deleted immediately.

Examples:

- `idle_base_v1` -> `idle_base_v2` if the baseline loop is reauthored.
- `nod_small_v1` stays `nod_small_v1` if only its notes or tags change.

## Variant Rules

Use `variant_##` when clips are siblings with the same intended use:

- `idle_variant_01_v1`
- `idle_variant_02_v1`
- `talk_variant_01_v1`

Do not mix variants and semantic names if the clip actually has a different purpose. `talk_emphasis_v1` is better than `talk_variant_04_v1` when the motion meaning is known.

## Status Tracking

Do not put status in the Blender action name.

Track status in metadata only:

- `blocking`
- `polish`
- `review`
- `approved`
- `deprecated`
- `hold`

## Import Source Tracking Convention

Track provenance in metadata using these fields:

- `source_type`: `custom`, `mixamo`, `mocap`, `marketplace`, `inhouse_cleanup`
- `source_name`
- `source_file`
- `source_clip`
- `retargeted_by`
- `cleanup_pass`

Example metadata:

```json
{
  "clip_name": "listen_base_v1",
  "source_type": "mixamo",
  "source_name": "Mixamo",
  "source_file": "Y_Bot_Listening.fbx",
  "source_clip": "mixamo.com",
  "retargeted_by": "gail_mixamo_pass_01",
  "cleanup_pass": "cleanup_2026_03_18"
}
```

## Preventing Blender From Deleting Actions

- Turn on `Fake User` for every production action.
- Register every production action in the clip registry JSON.
- Keep temporary import actions unregistered and isolated in `08_IMPORT_SOURCES`.
- Run the fake-user utility before closing Blender.

## Actions vs NLA

Use Actions for:

- clip ownership
- naming
- versioning
- library browsing
- export selection

Use NLA for:

- previewing loops
- testing transitions
- stitching body and face tracks for review
- staging export checks when a baked preview is needed

Do not use NLA strips as the canonical source of clip truth.
