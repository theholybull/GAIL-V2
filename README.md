# Gail

## Current Lock Summary (2026-04-24)

- Locked checkpoint: [playcanvas-app/backups/20260424-env-backdrop33-lockdown](playcanvas-app/backups/20260424-env-backdrop33-lockdown)
- Active work-lite version salt: 20260424-env-backdrop33
- Night lighting: Light Level slider now responds in night mode (no fixed 10% lock)
- Persona placement persistence now includes avatar rotation in addition to avatar position and camera framing
- Build verification: playcanvas-app TypeScript build passes with exit code 0
- Proposed git tag for this checkpoint: env-backdrop33-lockdown-20260424

Gail is an operator-first, local-first AI presence platform for running workflow, voice, device, and avatar/runtime operations from one controlled host.

Current commercial posture:

- controlled pre-release
- pilot-oriented, not mass-market ready
- professional operator tooling first, public-facing experience second

Core product direction:

- PlayCanvas for avatar and presence rendering
- TypeScript contracts shared across services and clients
- local SQLite as the primary working store
- PowerSync-style local-first sync to cloud Postgres
- WebAuthn/passkeys and trusted-device flows for sensitive operations

Productization references:

- [PRODUCT_STRATEGY.md](docs/PRODUCT_STRATEGY.md)
- [COMMERCIAL_READINESS_CHECKLIST.md](docs/COMMERCIAL_READINESS_CHECKLIST.md)
- [PROFESSIONAL_SHELL_BUILD_PLAN.md](docs/PROFESSIONAL_SHELL_BUILD_PLAN.md)

## Current State

This repository now centers on an active PlayCanvas + web control shell runtime, with legacy exploration artifacts trimmed when they do not support the current build.

This is no longer just a sandbox repo. The active goal is to turn Gail into a marketable pre-release product with:

- one professional operator shell
- one reliable host runtime
- one repeatable avatar/export pipeline
- one controlled multi-device deployment story

Active scaffold targets:

- `backend`
- `shared`
- `playcanvas-app`
- `web-control-panel`
- `mobile-shell`
- `watch-client`
- `docs`

Preserved legacy/research areas:

- `backend/app`
- `blender_scripts`
- `scripts`
- `tools`
- `ollama`

## Active Runtime

Current working backend features include:

1. SQLite-backed organizer entities and conversation sessions
2. RAM-only private-session notes and RAM-only private conversation sessions
3. trusted-device, unlock-window, and approval flows
4. prototype-safe LAN pairing and issued device-token scaffolding
5. operator panel served from the backend at `/panel/`
6. OpenAI-backed conversation path with local fallback
7. shared memory file support for persistent non-private memory entries
8. access-status reporting for local and LAN URL discovery
9. workflow workbench for document review, compiled findings, draft email, draft form answers, and Codex-agent handoff preparation
10. export-status and export-run support for Operator Studio shell driven avatar/runtime export operations
11. per-page shell help, quick-start guidance, and guided mode for safer operator workflows

For day-to-day usage and testing, use:

- [OPERATOR_MANUAL.md](docs/OPERATOR_MANUAL.md)
- [AUTH_PAIRING.md](docs/AUTH_PAIRING.md)
- [REMOTE_ACCESS.md](docs/REMOTE_ACCESS.md)
- [WORKFLOW_WORKBENCH.md](docs/WORKFLOW_WORKBENCH.md)
- [WORKFLOW_README.md](docs/WORKFLOW_README.md)
- [WORKFLOW_CHEATSHEET.md](docs/WORKFLOW_CHEATSHEET.md)
- [IMPLEMENTATION_PLAN_WORKFLOW.md](docs/IMPLEMENTATION_PLAN_WORKFLOW.md)
- [GUI_MASTER_INVENTORY.md](docs/GUI_MASTER_INVENTORY.md)
- [Operator Studio Shell Prototype](web-control-panel/operator-studio-shell.html)
- [OPERATOR_STUDIO_HANDOFF_README.md](docs/OPERATOR_STUDIO_HANDOFF_README.md)
- [PROJECT_STATE.md](docs/PROJECT_STATE.md)
- [NEXT_STEPS.md](docs/NEXT_STEPS.md)

## Portable SSD Use

The repo is ready to run from an SSD-backed root even if the drive letter changes between machines.

See:

- [SSD_MIGRATION.md](docs/SSD_MIGRATION.md)
- [OPERATOR_MANUAL.md](docs/OPERATOR_MANUAL.md)
- [migrate-to-ssd.ps1](tools/migrate-to-ssd.ps1)
- [install-node-deps.ps1](tools/install-node-deps.ps1)
- [install-backend-deps.ps1](tools/install-backend-deps.ps1)
- [build-node-projects.ps1](tools/build-node-projects.ps1)
- [build-backend.ps1](tools/build-backend.ps1)
- [build-control-panel.ps1](tools/build-control-panel.ps1)
- [build-playcanvas-app.ps1](tools/build-playcanvas-app.ps1)
- [run-backend.ps1](tools/run-backend.ps1)
- [start-gail-stack.ps1](tools/start-gail-stack.ps1)
- [stop-gail-stack.ps1](tools/stop-gail-stack.ps1)
- [start-backend-background.ps1](tools/start-backend-background.ps1)
- [stop-backend.ps1](tools/stop-backend.ps1)
- [wait-backend-ready.ps1](tools/wait-backend-ready.ps1)
- [run-backend-tests.ps1](tools/run-backend-tests.ps1)

Served browser surfaces:

- operator panel: `http://127.0.0.1:4180/panel/`
- work-lite client: `http://127.0.0.1:4180/client/work-lite/`
- LAN operator panel: `http://<your-machine-ip>:4180/panel/`
- LAN work-lite client: `http://<your-machine-ip>:4180/client/work-lite/`

Fastest access helper:

- `powershell -ExecutionPolicy Bypass -File .\tools\show-access.ps1 -EnsureBackend`

Primary stack command:

- `powershell -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1`

Key runtime support surfaces:

- access status: `http://127.0.0.1:4180/access/status`
- provider status: `http://127.0.0.1:4180/providers/status`
- hardwired commands: `http://127.0.0.1:4180/commands`
- client asset manifest: `http://127.0.0.1:4180/client/asset-manifest`
- client-served asset files: `http://127.0.0.1:4180/client-assets/...`
- shared memory lifecycle: `GET/POST/PATCH/DELETE http://127.0.0.1:4180/memory/entries`
- provider telemetry is included in the provider status surface after live conversation traffic
- voice settings: `http://127.0.0.1:4180/voice/settings`
- voice engines: `http://127.0.0.1:4180/voice/engines`
- voice status: `http://127.0.0.1:4180/voice/status`
- voice speak: `http://127.0.0.1:4180/voice/speak`
- camera matrix: `http://127.0.0.1:4180/camera/matrix`
- auth status: `http://127.0.0.1:4180/auth/status`
- pairing session create: `POST http://127.0.0.1:4180/auth/pairing-sessions`
- pairing session complete: `POST http://127.0.0.1:4180/auth/pairing-sessions/:id/complete`
- workflow list/create/detail: `GET/POST http://127.0.0.1:4180/workflows` and `GET/PATCH http://127.0.0.1:4180/workflows/:id`
- workflow planning and execution: `POST http://127.0.0.1:4180/workflows/:id/plan` and `POST http://127.0.0.1:4180/workflows/:id/steps/:stepId/run`

Latest verified regression run:

- [backend-test-report-20260330-143457.md](docs/reports/backend-test-report-20260330-143457.md)
- result: `115 passed`, `0 failed`

## External Access

The backend now binds to `0.0.0.0` by default, which makes it reachable from other devices on the same network when Windows Firewall and the router allow it.

Practical meaning:

- local machine access still uses `http://127.0.0.1:4180/...`
- LAN access uses `http://<your-machine-ip>:4180/...`
- true internet access still requires a public entry point such as router port forwarding, a reverse proxy on a cloud host, or a tunnel product

If you want the repo to tell you exactly which URL to open from another device, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\show-access.ps1 -EnsureBackend
```

Recommended order:

1. confirm LAN access first
2. pair a test device on the local network and verify token-backed access
3. put the backend on a private Tailscale network for remote access
4. add auth and origin restrictions before exposing it broadly to anything public

Recommended private remote-access helper:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\show-remote-access.ps1 -EnsureBackend
```

Portable-runtime note:

- repo-managed runtime data stays on the drive under `data\`
- scripts now prefer repo-local Node at `runtime\nodejs`
- machine-installed Node is only a fallback
- Tailscale is still a machine-level dependency on Windows and is not currently fully portable from the drive, even though the repo helper now stages its installer and requested install path under `runtime\`

## Pairing Summary

Current pairing posture:

- the backend still defaults to `GAIL_AUTH_MODE=open`
- pairing can be performed from localhost or a private-LAN address
- pairing issues a real device token
- the operator panel can now create a pairing session, complete pairing, and store the returned token locally
- when a valid token is supplied, the backend prefers the paired device identity over spoofable request headers

This keeps development friction low while giving the project a real path away from header-only trust.

Quickest usable flow:

1. keep `GAIL_AUTH_MODE=open`
2. open the operator panel
3. create a pairing session
4. complete pairing
5. save the returned token
6. use the paired device in the request context

