# Runtime UI Audit 2026-04-20

This report is the current runtime/UI baseline for the active Gail repo at `D:\Gail 2.1\working_copy`.

## Scope

- built and launched the active stack from `working_copy`
- started the animation importer sidecar through the repo-local launcher
- started the animation viewer runtime
- exercised operator and client surfaces
- captured screenshots for UI and avatar-facing surfaces
- reviewed shell page layout and action behavior

## Artifacts

- raw runtime snapshot package: `cleanup-hub/runtime-audit-20260420-141419/`
- runtime snapshot JSON: `cleanup-hub/runtime-audit-20260420-141419/runtime-ui-snapshot-audit.json`
- full UI audit: `docs/reports/full-ui-audit-20260420-130756.json`
- final acceptance summary: `docs/reports/final-acceptance-20260420-124654.json`
- final acceptance markdown: `docs/reports/final-acceptance-20260420-124654.md`
- backend regression summary: `docs/reports/backend-test-report-20260420-124338.json`
- backend regression markdown: `docs/reports/backend-test-report-20260420-124338.md`

## What Was Verified

- backend, control panel, and PlayCanvas app all built cleanly from the active repo
- backend stack launched locally on `http://127.0.0.1:4180`
- animation importer responded on `http://127.0.0.1:8888/`
- animation viewer responded on `http://127.0.0.1:8778/metadata/viewer_runtime.html`
- top-level surfaces returned `200`:
  - `/panel/`
  - `/panel/operator-studio-shell.html`
  - `/client/work-lite/`
  - `/client/phone/`
  - `/client/proof/`
  - `/display/`
  - `/studio`
- backend regression suite passed `121/121`

## Runtime Snapshot Results

- captured `18` top-level surface screenshots across desktop and mobile
- captured `40` Operator Studio shell page screenshots across desktop and mobile
- exercised `168` shell action buttons with bounded waits
- `work-lite` and `display` both reached `Scene ready` and reported:
  - `idle`, `talk`, `listen`, and `ack` clips loaded
  - `morphs 18/18`
  - one visible canvas in both desktop and mobile runs
- `phone-client` and `proof-client` both rendered a visible canvas in desktop and mobile runs
- `work-lite`, `display`, and `phone-client` all requested runtime animation assets during capture

## Main Findings

### 1. Verification drift is still a release blocker

The current verification layer is not fully repo-relative yet.

Confirmed failures from final acceptance:

- stale hardcoded `d:\Gail\...` path expectations in Phase 3, Phase 4, and Phase 5 checks
- old launcher-script expectations reported `start=False stop=False`
- screenshot evidence capture in Phase 1 links/scripts smoke failed

This means the runtime is healthier than the acceptance summary suggests, but the verification contract itself still needs cleanup before it can be treated as a trusted release gate.

### 2. Work-lite and display still have mobile layout overflow

The full UI audit found real mobile overflow on:

- `/client/work-lite/`
- `/display/`

Observed offenders:

- header action row
- fullscreen button region
- loading status pill
- voice configuration rows and controls

Desktop also flagged the stage canvas as an overflow offender, but the stronger signal is the mobile header/voice layout overflow.

### 3. Operator Studio shell still has mobile overflow on some pages

The runtime snapshot audit found mobile overflow on:

- `Wardrobe`
- `Animations`
- `Asset Validation`
- `Preview`
- `Organizer`

Notes:

- `Wardrobe` overflow is content-driven and includes long persona instruction text
- `Animations` overflow includes long export-status and path strings
- `Asset Validation` and `Preview` overflow is heavily influenced by the mobile nav rail
- `Organizer` overflow includes long dashboard JSON/status rows

### 4. Export/report-related shell actions are not solid yet

The runtime snapshot audit captured error toasts for:

- `animation_refresh_report`
- `open_animation_viewer`
- `runtime_refresh_report`

Observed message:

- `Request timed out after 20000ms: POST /exports/run`

That points to export/report refresh behavior still being too slow or too tightly coupled to pipeline execution for shell use.

### 5. Animation viewer still has a missing-resource problem

Both desktop and mobile viewer captures recorded a `404` console error in the animation viewer surface. The page loads, but the viewer package is not fully clean yet.

### 6. Some shell error toasts are expected precondition failures, not regressions

Examples:

- no ready workflow step available
- no pending governance change
- no approved snapshot to roll back to
- empty OpenAI API key field
- missing read-file path
- no directives awaiting Gail approval

These should stay documented, but they are workflow-precondition issues rather than proof that the shell page is broken.

## Current Best Read Of System Health

Working now:

- active repo builds
- backend regression suite
- local stack startup
- core operator/client routes
- importer reachability
- viewer reachability
- work-lite/display avatar scene load
- shell screenshots and action audit baseline

Not solid yet:

- repo-relative acceptance scripts
- work-lite/display mobile layout containment
- some shell mobile page containment
- export/report action responsiveness
- animation viewer missing-resource cleanup

## Repair Order

1. make the verification layer repo-relative and remove stale `D:\Gail` assumptions
2. fix `work-lite` and `display` mobile header/voice layout overflow
3. fix mobile shell overflow on the five flagged pages
4. stabilize export/report shell actions so they do not time out on `POST /exports/run`
5. fix the animation viewer `404`
6. promote the animation importer fully into the repo after the current runtime baseline is stable
