# GPU Rendering Policy 2026-04-22

## Decision

Local Playwright verification tools now default to hardware GPU rendering instead of SwiftShader.

## Why

Several local audit and screenshot tools were launching Chromium with `--use-angle=swiftshader`, which forced software rendering. That made local probes poor evidence for real GPU usage and made it easy to mistake a CPU fallback path for normal runtime behavior.

## Affected Tools

- `tools/probe-worklite-persona.js`
- `tools/run-runtime-ui-snapshot-audit.js`
- `tools/capture_lucy_worklite_screenshot.js`
- `tools/verify-shared-hair-personas.js`

## Implementation

- added shared helper: `tools/playwright-renderer.js`
- default renderer mode: `hardware`
- explicit fallback mode: `swiftshader`
- each affected report now records `rendererMode`

## Usage

Default local behavior:

```powershell
node tools/probe-worklite-persona.js --persona=normal
```

Force software fallback only when intentionally testing it:

```powershell
node tools/probe-worklite-persona.js --persona=normal --renderer=swiftshader
```

or:

```powershell
$env:GAIL_PLAYWRIGHT_RENDERER='swiftshader'
node tools/run-runtime-ui-snapshot-audit.js
```

## Current Boundary

- local Playwright tooling is now aligned with real hardware rendering by default
- this does not prove every other part of the stack is GPU-accelerated
- if live GPU telemetry is needed, check browser GPU status and process-level GPU usage separately from these audit scripts
