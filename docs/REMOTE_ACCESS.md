# Remote Access

This document defines the recommended remote-access model for Gail in the current phase.

## Goal

Keep Gail simple and rugged:

- one local host runs the backend
- other devices reach that host through the existing web portal
- remote access uses a private network overlay instead of public exposure first

## Recommended Access Model

Use:

1. local Gail host
2. existing backend web surfaces
3. Tailscale as the private remote network
4. paired-device tokens as the app-level identity path

Do not make SSH the primary user access surface.

SSH can still exist later for maintenance, but Gail itself should stay web-first.

## Why Tailscale

For this project, Tailscale is the best near-term fit because it is:

- simple to operate
- reliable across home, shop, and mobile devices
- private by default
- better aligned with a single local host than public port forwarding
- easy to remove or replace later without redesigning Gail itself

## Current Repo Support

Current repo support includes:

- `GET /access/status`
- [show-access.ps1](../tools/show-access.ps1)
- [show-remote-access.ps1](../tools/show-remote-access.ps1)
- [install-tailscale.ps1](../tools/install-tailscale.ps1)
- [start-gail-stack.ps1](../tools/start-gail-stack.ps1)
- [gail-stack.json](../tools/gail-stack.json)

## Portability Reality

Current state:

- Gail code, data, and preferred Node runtime can now live on the removable drive
- the scripts prefer `runtime\nodejs` before using a machine install
- Tailscale itself is still a machine-level dependency on Windows
- the repo helper now stages the MSI download under `runtime\downloads` and requests installation under `runtime\Tailscale` where the installer allows it

That means the Gail stack is now much more drive-portable, but the private remote-network layer is still host-installed.

## Setup Flow

### 1. Start Gail on the host

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1
```

### 2. Confirm local and LAN access

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\show-access.ps1 -EnsureBackend
```

### 3. Install Tailscale on the host

If `winget` is available:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\install-tailscale.ps1
```

The helper now:

- fetches the current official amd64 MSI from `pkgs.tailscale.com`
- stores the installer under `runtime\downloads`
- requests installation under `runtime\Tailscale`

Windows still treats Tailscale as a machine-level dependency even when the binaries are placed on the drive.

### 4. Join the host to your tailnet

Sign the Gail host into your Tailscale network.

### 5. Install Tailscale on remote devices

Install Tailscale on:

- phone
- tablet
- laptop
- other workstations

Sign those devices into the same tailnet.

### 6. Print the private remote URLs

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\show-remote-access.ps1 -EnsureBackend
```

### 7. Pair devices inside Gail

After network reachability exists, pair the device in Gail itself so it gets:

- a paired-device record
- a device token
- server-side device identity

See:

- [AUTH_PAIRING.md](./AUTH_PAIRING.md)

## Recommended Daily Use

### Same LAN

Use:

- `http://<host-lan-ip>:4180/panel/`
- `http://<host-lan-ip>:4180/client/work-lite/`

### Remote

Use:

- `http://<tailscale-ip>:4180/panel/`
- `http://<tailscale-ip>:4180/client/work-lite/`

or the Tailscale DNS form when available.

## Security Posture

Current recommended posture:

- network access via Tailscale
- app access still in `GAIL_AUTH_MODE=open` while actively prototyping
- paired-device tokens used for the devices you care about

Recommended tightening path:

1. keep Tailscale as the network boundary
2. move Gail to `paired_required_for_sensitive`
3. add token revocation and re-issue
4. later move normal access toward `paired`

## Do Not Use First

Avoid these as the first remote solution:

- public router port forwarding
- broad public reverse proxy exposure
- SSH as the normal user workflow

## Troubleshooting

If remote access does not work:

- confirm Gail is running on the host
- confirm `show-access.ps1` prints a healthy local/LAN surface
- confirm Tailscale is installed and signed in on the host
- confirm the client device is on the same tailnet
- confirm Windows Firewall allows the backend port for the active network profile
- rerun [show-remote-access.ps1](../tools/show-remote-access.ps1)

If the host is reachable over Tailscale but Gail is not:

- confirm the backend is bound to `0.0.0.0`
- confirm the backend port is still `4180`
- confirm the client is opening `/panel/` or `/client/work-lite/`

## Summary

The best way to do remote access for Gail right now is:

- keep Gail on one local host
- keep the UI web-first
- use Tailscale as the private remote network
- use Gail pairing and device tokens as the app-level identity path

