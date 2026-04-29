# SSD Migration

## Target

The repo is intended to run from a removable SSD-backed root that may have different drive letters on different machines.

## Current Code Readiness

The current backend paths are relative enough that the repo can be moved without code edits:

- main SQLite path defaults to `../data/gail.sqlite` from [sqlite.ts](F:/Gail/backend/db/sqlite.ts)
- private SQLite path defaults to `../data/private/gail-private.sqlite` from [sqlite.ts](F:/Gail/backend/db/sqlite.ts)
- the control panel points to a configurable backend URL at runtime
- the runtime scripts now prefer repo-local Node at `runtime\nodejs`
- the stack can now be started from one command with [start-gail-stack.ps1](F:/Gail/tools/start-gail-stack.ps1)

## Recommended Move Process

1. Copy the repo to the SSD root you want to use on that machine
2. Reinstall Node dependencies in the moved location
3. Rebuild the backend and web control panel from the moved copy
4. Start testing from that copy only

## Helper Script

Use:

- [migrate-to-ssd.ps1](F:/Gail/tools/migrate-to-ssd.ps1)

Default behavior:

- source: `E:\Gail`
- target: `F:\Gail`

It excludes transient directories such as:

- `node_modules`
- `dist`
- `Library`
- `__pycache__`

## Portable Helper Scripts

Run these from the moved repo copy:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1
```

Then open:

- `http://127.0.0.1:4180/panel/`

## Preferred Portable Runtime Layout

For best portability across different PCs, keep this layout on the drive:

- `F:\Gail`
- `F:\Gail\runtime\nodejs`
- `F:\Gail\data`

That lets the repo use a drive-local Node runtime and keep all repo-managed data on the drive.

## Stack Manifest

The current managed startup definition lives in:

- [gail-stack.json](F:/Gail/tools/gail-stack.json)

As new repo-managed services are added, register them there and start them through:

- [start-gail-stack.ps1](F:/Gail/tools/start-gail-stack.ps1)
- [stop-gail-stack.ps1](F:/Gail/tools/stop-gail-stack.ps1)

## Important Limitation

Most of Gail can now run in a drive-portable way.

Current exception:

- Tailscale is still a machine-level Windows dependency and is not yet managed as a fully portable drive-local component

## Optional Explicit DB Paths

If you want the runtime DBs pinned explicitly, set:

```powershell
$repoRoot = (Get-Location).Path
$env:GAIL_SQLITE_PATH = Join-Path $repoRoot 'data\gail.sqlite'
$env:GAIL_PRIVATE_SQLITE_PATH = Join-Path $repoRoot 'data\private\gail-private.sqlite'
```
