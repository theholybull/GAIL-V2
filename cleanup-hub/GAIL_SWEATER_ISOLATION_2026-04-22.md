# Gail Sweater Isolation - 2026-04-22

## Goal

Isolate whether the visible lines on Gail are coming from the sweater/top layer rather than the hair.

## Change Applied

Only the active Gail wardrobe preset was changed.

Updated files:

- `D:\Gail 2.1\working_copy\data\client\wardrobe-presets.json`
- `C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy\data\client\wardrobe-presets.json`

Change:

- `gail_workwear.slots.upper`
  - from: `gail_outfit_top`
  - to: `null`

No runtime code, manifest ids, or asset files were changed for this isolate.

## Verification

Live backend verification:

- `GET /client/wardrobe-presets`
- active preset: `gail_workwear`
- returned slots now include:
  - `"upper": null`

## Backups

Preset backups saved in:

- `cleanup-hub/gail-sweater-isolation-20260422/wardrobe-presets.D.before.json`
- `cleanup-hub/gail-sweater-isolation-20260422/wardrobe-presets.C.before.json`

## Next Check

Refresh the live client and inspect Gail without the sweater:

- `http://127.0.0.1:4180/client/work-lite/`

If the lines disappear, the sweater/top asset is the problem.
If the lines remain, the problem is elsewhere and the sweater can be restored from the backup.
