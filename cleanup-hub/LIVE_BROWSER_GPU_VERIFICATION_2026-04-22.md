# Live Browser GPU Verification 2026-04-22

## Goal

Verify which GPU the real browser path is using for WebGL, then pin the live browser to the high-performance GPU if needed.

## Browser Found

- Edge executable: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- Chrome executable: not present in the standard local install paths checked during this pass

## Machine GPU State

- discrete GPU: `NVIDIA GeForce RTX 4050 Laptop GPU`
- integrated GPU: `Intel(R) UHD Graphics`

## Initial Edge WebGL Result

Before any graphics-preference change, a live Edge WebGL probe reported:

- vendor: `Google Inc. (Intel)`
- renderer: `ANGLE (Intel, Intel(R) UHD Graphics (0x0000A7A8) Direct3D11 vs_5_0 ps_5_0, D3D11)`

That confirmed the real browser path was using the integrated GPU, not the RTX 4050.

## Applied Fix

Set the Windows per-app graphics preference for Edge:

- registry key: `HKCU:\Software\Microsoft\DirectX\UserGpuPreferences`
- value name: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- value data: `GpuPreference=2;`

`GpuPreference=2;` is the Windows high-performance setting.

## Verified Result After Fix

After setting the Windows graphics preference, the same live Edge WebGL probe reported:

- vendor: `Google Inc. (NVIDIA)`
- renderer: `ANGLE (NVIDIA, NVIDIA GeForce RTX 4050 Laptop GPU (0x000028A1) Direct3D11 vs_5_0 ps_5_0, D3D11)`

That confirms the real Edge browser path now resolves to the RTX 4050 for WebGL.

## Notes

- this verification used the real Edge executable, not the local Playwright SwiftShader path
- Windows had no explicit per-app GPU preference for Edge before this change
- `msedgewebview2.exe` was not present at the standard path checked in this pass
- earlier GPU engine counters also showed `Code.exe` using the NVIDIA GPU during this session

## Operator Guidance

- fully restart any already-open Edge windows before judging behavior in the live client
- if a future browser is added, give it the same Windows graphics preference treatment before drawing performance conclusions
