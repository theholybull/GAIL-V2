# D Root Lockdown Smoke Report

Date: 2026-04-29

## Purpose

Confirm the live backend is now serving from the active D root after the lockdown backup and managed test run.

## Backend Start

Started with:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\Gail 2.1\working_copy\tools\start-backend-background.ps1"
```

Result:

- backend process started
- listening on port `4180`
- health route responded successfully

## Route Checks

### Health

Route:

- `GET http://127.0.0.1:4180/health`

Result:

- `ok: true`
- `service: gail-backend`

### Runtime Settings

Route:

- `GET http://127.0.0.1:4180/client/runtime-settings`

Result:

- `activeAvatarSystem: gail_primary`
- `activeAssetRoot: gail`
- `displayInputMode: wake_word`
- `bodyMorphControls.enabledDuringMotion: true`

### Asset Manifest

Route:

- `GET http://127.0.0.1:4180/client/asset-manifest?assetRoot=gail_lite`

Result:

- `avatarReady: true`
- `selectedAssetRoot: gail_lite`
- `manifestSource: catalog`
- first required directory resolved to:
  - `D:\Gail 2.1\working_copy\playcanvas-app\assets\gail\avatar\base_face`

Remaining optional missing assets reported:

- `gail outfit bundle`
- `gail accessories bundle`
- `private bracelets`
- `work background`
- `private background`

These are not blocking the core avatar readiness result.

## Process Check

Port `4180` listener:

- process: `node.exe`
- command: `dist/backend/server.js`

Supervisor log:

- backend child started at `2026-04-29T09:10:06`
- backend child pid: `24640`

## Conclusion

PASS.

The live route smoke no longer reports the old C working-copy asset directories. The current backend route behavior is aligned to:

- `D:\Gail 2.1\working_copy`

