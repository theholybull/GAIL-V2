# Operator Manual

This is the living manual for running, testing, and operating the current Gail build.

Update rule:

- update this file whenever a user-facing workflow changes
- update this file whenever a new required tool, script, route, or panel action is added
- keep this focused on how to use the system, not how it is implemented internally
- whenever a new runnable backend feature is added, update [run-backend-tests.ps1](../tools/run-backend-tests.ps1) and generate a new report in [reports](./reports)

## Current Scope

This manual covers the current working surfaces:

- backend API
- backend data storage
- prototype-safe auth and pairing
- device registration and trust
- approval workflow
- private mode testing
- operator control panel
- portable SSD use

It does not yet cover:

- PlayCanvas runtime usage
- phone/watch production clients
- WebAuthn/passkey setup
- PowerSync/Postgres deployment

## What Gail Can Do Right Now

Current working capabilities:

- start the Gail stack from a single command
- run a local backend server
- keep the backend alive under a hidden supervisor that restarts the Node child if it exits unexpectedly
- expose a dashboard overview summary for lightweight operational status
- create LAN-only pairing sessions and issue device tokens
- report exact local and LAN access URLs through a dedicated access-status surface
- accept token-backed paired-device identity while still allowing open prototype access by default
- persist projects, notes, lists, tasks, reminders, parts, cart items, approvals, and device records in SQLite
- separate normal notes from explicitly saved private notes
- keep unsaved private session notes in RAM only
- enforce Private Mode write restrictions
- enforce device-type route permissions
- enforce trusted registered devices for approval-sensitive flows
- require a live sensitive-action unlock window for approval-sensitive flows
- serve a browser-based operator panel from the backend
- support project, list, reminder, and part create/update flows from the operator panel
- support background backend start, readiness wait, and shutdown helpers for local automation
- support lightweight conversation sessions with mode-aware provider selection
- persist conversation sessions across backend restarts
- support workflow creation, planning, step execution, and review-oriented artifact generation from the operator panel
- route typed and voice control text into either hardwired command actions or planned workflows
- dispatch backend command actions into the PlayCanvas runtime or the Operator Studio shell, depending on which surface owns the action
- edit persisted local-LLM connection settings and switch the active private persona from shell surfaces
- run private mode with one of two configured local agents: `private_counselor` or `private_girlfriend`
- serve dropped work-lite client asset files directly from `/client-assets/...`
- detect nested dropped asset exports for the client manifest and ignore zero-byte files
- mark the modular work-lite avatar core bundle ready when base body, hair, work outfit, and idle are present
- run browser-based wake-word voice recognition on the work-lite client with mic lifecycle coordination, conversation routing, and auto-resume after response

## Required Software

Install these on the machine that will run the repo:

- Node.js LTS
- PowerShell
- a modern browser
- optional: DB Browser for SQLite
- optional: Git

Expected Node location for the helper scripts:

- preferred: `runtime\nodejs`
- fallback: `C:\Program Files\nodejs`

## Repo Layout You Actually Use

For day-to-day operation, the important paths are:

- [backend](../backend)
- [web-control-panel](../web-control-panel)
- [data](../data)
- [docs](.)
- [tools](../tools)

Important auth reference:

- [AUTH_PAIRING.md](./AUTH_PAIRING.md)
- [REMOTE_ACCESS.md](./REMOTE_ACCESS.md)
- [WORKFLOW_WORKBENCH.md](./WORKFLOW_WORKBENCH.md)
- [COMMAND_ROUTING.md](./COMMAND_ROUTING.md)
- [LOCAL_LLM_PRIVATE_PERSONAS.md](./LOCAL_LLM_PRIVATE_PERSONAS.md)

## Portable SSD Workflow

Run these from the repo root, regardless of drive letter:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1
```

Then open:

- `http://127.0.0.1:4180/panel/`

If you want a repo-local Node runtime instead of depending on the machine install, place Node under:

- `runtime\nodejs`

To run the backend test suite and generate a report:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1
```

Important:

- the plain command above assumes the backend is already running
- if you want the test harness to start the backend for you, use `-EnsureBackend`

To let the test suite start and stop the backend automatically:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1 -EnsureBackend -ShutdownWhenDone
```

To run the managed suite against a specific auth posture:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1 -EnsureBackend -AuthMode open
```

Background backend helpers:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\start-backend-background.ps1
powershell -ExecutionPolicy Bypass -File .\tools\stop-backend.ps1
```

Full stack helpers:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1
powershell -ExecutionPolicy Bypass -File .\tools\stop-gail-stack.ps1
```

Persistent backend behavior:

- the backend is now started under a hidden PowerShell supervisor
- the supervisor writes pid and lifecycle files under `data\runtime`
- if the Node backend child exits unexpectedly, the supervisor starts a fresh child automatically
- `stop-backend.ps1` now stops both the supervisor and the child

Expected workflow as the project progresses:

1. add feature
2. add or update automated test coverage
3. run the script
4. review the generated report
5. note the run in the build log

## Workflow Workbench

Operator path:

1. import or gather the source material you want Gail to work from
2. open the operator panel
3. go to `Workflow Workbench`
4. enter a title, objective, optional project id, and context
5. create the workflow
6. plan the steps
7. select the ready step from the visual workflow board
8. run the selected step
9. inspect the generated artifacts before moving to any external-facing draft step

Current behavior:

- workflows are stored in SQLite
- planning is deterministic and durable
- step output is shown directly in the panel
- email and form work currently stop at draft artifacts
- Codex work currently stops at a generated handoff brief

Reference:

- [WORKFLOW_WORKBENCH.md](./WORKFLOW_WORKBENCH.md)

## Providers, Local LLM, And Private Personas

Operator path:

1. open either the Operator Studio shell `Providers and Voice` page or the legacy operator panel provider section
2. refresh provider state first
3. confirm OpenAI status if you expect cloud behavior outside private mode
4. confirm the local LLM base URL and model match the Ollama host and pulled model on this machine
5. choose the default and active private persona
6. edit the counselor and girlfriend prompts if you need different local agent behavior
7. save the local-LLM config before testing private-mode conversation

Current behavior:

- `GET /providers/local-llm-config` returns the active Ollama connection settings plus both private persona prompts
- `PATCH /providers/local-llm-config` persists changes to the local model config and active persona selection
- private mode still forces `local-llm`
- private mode now uses the active configured persona prompt instead of one generic local private prompt
- persona switching can now be done either by editing the provider page or by using command phrases like `counselor mode`, `girlfriend mode`, or `doc im lonley`

Fast shell path when you just need to switch private personas:

1. open the Operator Studio shell
2. use the command palette or control input
3. say or type `counselor mode`, `girlfriend mode`, or `doc im lonley`
4. confirm `Active private persona` changed in the `Providers and Voice` page display surface

What the provider page itself is now for:

- changing the Ollama connection values
- changing which persona private mode should start with by default
- editing the actual counselor and girlfriend prompt text
- checking the built-in persona-switch phrases shown in the display surface

Reference:

- [LOCAL_LLM_PRIVATE_PERSONAS.md](./LOCAL_LLM_PRIVATE_PERSONAS.md)

## Data Storage

Current storage behavior:

- normal backend data goes to `data\gail.sqlite`
- explicit private note saves go to `data\private\gail-private.sqlite`
- unsaved private session notes stay in RAM only
- paired-device credentials and pairing sessions are stored in the primary SQLite database

Important distinction:

- Private Mode does not save normal organizer data
- Private Mode can save explicit private notes only when explicitly requested
- unsaved private session notes are wiped from RAM and are not stored in SQLite

## Starting the System

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\run-backend.ps1
```

When it is working:

- backend health route responds on `http://127.0.0.1:4180/health`
- panel is served at `http://127.0.0.1:4180/panel/`

### LAN Access

The backend now binds to `0.0.0.0` by default when started through the current server entrypoint and background launcher.

That means:

- the local machine can still use `http://127.0.0.1:4180/...`
- other devices on the same network can use `http://<host-machine-ip>:4180/...`

Before testing from another device, make sure:

- Windows Firewall allows inbound TCP `4180`
- the host machine and test device are on the same network
- you use the host machine's actual LAN IP, not `127.0.0.1`

The quickest way to confirm the usable URLs is:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\show-access.ps1 -EnsureBackend
```

That helper:

- starts the backend if needed
- reads `GET /access/status`
- prints the local operator-panel URL
- prints each detected private-LAN URL for the operator panel and work-lite client
- prints current auth warnings so you know whether the host is still broadly open on the LAN

### Internet Access

Binding to `0.0.0.0` is only the first step. To make Gail reachable from outside the local network, add one of these:

- router port forwarding to TCP `4180`
- a reverse proxy on a public server
- a secure tunnel such as Cloudflare Tunnel or Tailscale funnel-style access

Do not expose the current backend broadly without adding:

- authentication
- origin restrictions
- transport security such as HTTPS

### Recommended Remote Access

For this project, the recommended remote path is:

- keep Gail on the local host
- keep using the normal web portal
- use Tailscale as the private network path

That means remote devices should still open:

- `/panel/`
- `/client/work-lite/`

but over the Tailscale address instead of the raw LAN address.

Fastest helper:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\show-remote-access.ps1 -EnsureBackend
```

If Tailscale is not installed yet and `winget` is available:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\install-tailscale.ps1
```

The repo helper caches the installer under `runtime\downloads` and requests installation under `runtime\Tailscale`, but Windows still treats Tailscale as a machine-level dependency.

See:

- [REMOTE_ACCESS.md](./REMOTE_ACCESS.md)

Important portability note:

- Gail itself can now prefer repo-local runtime dependencies from the drive
- Tailscale is still a machine-level dependency on Windows and does not currently live entirely on the removable drive

## Auth And Pairing

The current backend supports two identity paths:

- legacy prototype request headers
- real paired-device tokens

### Prototype Default

The server currently defaults to:

- `GAIL_AUTH_MODE=open`

That means:

- any device can still access the service while development continues
- pairing is optional right now, not mandatory
- a valid paired token is still useful because it gives you a real authenticated device path to test

### What Pairing Does

Pairing is the current bridge between â€œwide open prototypeâ€ and â€œfuture real remote accessâ€.

Current behavior:

- the device must begin pairing from localhost or a private-LAN address
- the backend creates a short-lived pairing session
- the backend returns a pairing code
- pairing completion registers the device as paired
- the backend issues a device token
- later requests can use that token from anywhere

### What Pairing Does Not Do Yet

It does not yet:

- force all devices to be paired
- revoke tokens through the operator panel
- enforce a full admin-auth layer for pairing approval
- replace later WebAuthn/passkey work

### Auth Status Route

Use:

- `GET /auth/status`

Expected fields:

- `authMode`
- `pairingRequired`
- `pairingRequiredForSensitive`

### Access Status Route

Use:

- `GET /access/status`

This returns:

- current bind host
- current port
- current auth mode
- local URLs
- detected private-LAN URLs
- access warnings

## Using the Operator Panel

The operator panel is the current easiest test surface.

Open:

- `http://127.0.0.1:4180/panel/`

### Request Context

Use the top context section to control the headers the panel sends:

- Backend URL
- Device ID
- Device Type
- Mode
- Explicit local save

These affect backend policy.

Examples:

- use `web_admin` for setup and device registration
- use `iphone` or `uconsole` for normal organizer actions
- use `watch` for approval resolution testing
- use `private` mode when testing private-session and private-note rules

The Request Context block now also includes:

- `Device Token`
- `Save Token`
- `Clear Token`

Behavior:

- if the token field is empty, the panel behaves like the original prototype flow and uses headers only
- if the token field contains a token, the panel sends a bearer credential and the backend prefers the paired device identity over spoofable header identity
- `Save Token` stores the token in browser `localStorage`
- `Clear Token` removes the token from browser `localStorage`

## Pairing In The Operator Panel

The panel now includes a dedicated pairing section.

Recommended first-use flow:

1. open the panel on a machine that is on the same LAN as the Gail host
2. click `Refresh` in the auth section and verify the current auth mode
3. click `Create Pairing Session`
4. confirm `Pairing Session ID` and `Pairing Code` populate
5. fill in the pair-device fields
6. click `Complete Pairing`
7. confirm the response includes a paired device, a credential, and an `authToken`
8. confirm the panel auto-fills the `Device Token` field
9. click `Save Token` if you want the browser to keep the token
10. click `Use Paired Device In Context` to switch the panelâ€™s request context to the paired device

Important:

- the panel stores the token locally for convenience only
- this is prototype operator storage, not the final secure-storage model
- pairing and trust are different controls

### Health

Use `Refresh Health` to confirm the backend is alive.

Expected result:

- status shows `Online`

### Dashboard Snapshot

Use `Refresh` in the overview section to fetch a lightweight summary of:

- record counts
- pending approvals
- recent projects and tasks
- pending cart items
- current reminders, parts, lists, and notes

Current use:

- quick smoke check after startup
- lightweight watch-safe status view
- fast confirmation that recent creates are visible to the backend

### Device Registry

Use this section to register devices before trust-sensitive testing.

Common flow:

1. register an iPhone or uConsole device
2. register a watch device
3. mark them trusted if needed
4. unlock the current device when testing sensitive actions
5. switch the request context to those device IDs when testing approvals

Sensitive-action access window:

- `Unlock Current Device` grants a short-lived sensitive-action window
- `Lock Current Device` clears that window immediately
- `Untrust Current Device` also clears the sensitive-action window
- trusted alone is no longer enough for approval-sensitive flows

Important relationship to pairing:

- pairing proves the device has a real credential path
- trust controls whether the device is allowed to participate in sensitive actions
- the unlock window controls when a trusted device may use those sensitive routes

### Approvals

Use this section to inspect and resolve approval records.

Current intended use:

1. create a cart item
2. request cart approval
3. copy the approval ID
4. switch context to a trusted watch device
5. resolve the approval as `approved`
6. switch back to the requesting device
7. commit the approval from the cart section

Current edge behavior:

- approvals can be resolved as `approved` or `rejected`
- rejected approvals cannot be committed
- expired approvals cannot be resolved or committed
- private saved notes stay out of normal note reads and only appear in private-mode note reads
- Private Mode blocks approval-sensitive automation even for trusted and unlocked devices
- Private Mode dashboard overview hides normal organizer data and only surfaces private note context
- normal conversation sessions default to the OpenAI provider path
- Private Mode conversation sessions force the local provider path
- conversation sessions survive backend restart when stored in the main SQLite database
- Private Mode conversation sessions are RAM-only, device-bound, and do not survive restart

### Tasks

Use this section to:

- create tasks
- confirm task route permissions
- test watch blocking by switching Device Type to `watch`

### Projects

Use this section to:

- create a project
- update summary, tags, and status
- capture a project ID for later organizer linking

### Lists

Use this section to:

- create a list
- add a list item
- mark a list item complete

The panel auto-fills the latest created list ID and item ID after successful actions.

### Notes

Use this section to test:

- normal note creation
- private saved notes

For explicit private note save:

1. set Mode to `private`
2. check `Explicit local save`
3. set `privateOnly`
4. create the note

Expected behavior:

- the note is stored separately from normal notes

### Reminders

Use this section to:

- create reminders
- update reminder details and status

### Parts

Use this section to:

- create part records
- update status, source details, and compatibility notes

### Private Session

Use this section to test RAM-only private note capture.

Requirements:

- Mode must be `private`

Use:

- `Add RAM-Only Note`
- `Refresh`
- `Wipe Private Session`

Expected behavior:

- notes appear in the private session output
- notes do not appear in normal `/notes`
- wipe clears them immediately

### Cart Approval Flow

Current approval flow is multi-step.

1. create a cart item
2. request approval
3. note the generated approval ID
4. resolve approval from a trusted approval-capable device
5. commit the approval

Important:

- directly patching cart status to `approved` does not finalize approval
- approval-sensitive flows require registered trusted devices

## Current Backend Rules

### Private Mode

Blocked in Private Mode:

- persistent project writes
- persistent list writes
- persistent task writes
- persistent reminder writes
- persistent part writes
- persistent cart writes

Allowed in Private Mode:

- RAM-only private session notes
- explicit private note saves when:
  - `x-gail-explicit-local-save: true`
  - `privateOnly = true`

### Device Rules

Current device-type behavior:

- `watch` can use health, approval routes, device listing, and private-session routes
- `watch` is blocked from organizer CRUD routes like tasks/projects/lists/cart writes
- `iphone`, `uconsole`, `kiosk`, and `web_admin` are allowed broader organizer access

### Trust Rules

Approval-sensitive routes require:

- a registered device ID
- a trusted device record
- a matching device type

Current trust-sensitive flows:

- cart approval request
- approval resolution
- approval commit

These now also require:

- the device to have an active `sensitiveActionsUnlockedUntil` window in the future

Current approval edge rules:

- pending approvals can be resolved once
- rejected approvals stay rejected until a new approval is requested
- expired approvals are treated as closed and require a new approval request
- untrusted devices lose any sensitive-action unlock window immediately
- device-type/header mismatches are blocked even when the device ID is registered
- Private Mode blocks approval requests, approval resolution, and approval commits
- `service` devices are blocked from private-session routes
- conversation sessions are mode-bound and reject cross-mode message writes
- normal work-mode conversation sessions can be handed off across same-mode non-watch devices
- Private Mode conversation sessions block cross-device handoff

## Useful API Routes

Current important routes:

- `GET /health`
- `GET /access/status`
- `GET /auth/status`
- `POST /auth/pairing-sessions`
- `POST /auth/pairing-sessions/:id/complete`
- `GET /dashboard/overview`
- `GET /devices`
- `POST /devices`
- `PATCH /devices/:id/trust`
- `PATCH /devices/:id/access-window`
- `GET /approvals`
- `POST /approvals`
- `PATCH /approvals/:id`
- `GET /tasks`
- `POST /tasks`
- `GET /projects`
- `POST /projects`
- `PATCH /projects/:id`
- `GET /lists`
- `POST /lists`
- `POST /lists/:id/items`
- `PATCH /lists/:id/items/:itemId`
- `GET /notes`
- `POST /notes`
- `GET /memory/entries`
- `POST /memory/entries`
- `PATCH /memory/entries/:id`
- `DELETE /memory/entries/:id`
- `POST /imports/documents`
- `GET /providers/status`
- `GET /commands`
- `POST /commands/execute`
- `GET /voice/settings`
- `GET /voice/engines`
- `PATCH /voice/settings`
- `GET /voice/status`
- `POST /voice/speak`
- `GET /camera/matrix`
- `GET /client-assets/*`
- `GET /conversation/sessions`
- `POST /conversation/sessions`
- `GET /conversation/sessions/:id`
- `POST /conversation/sessions/:id/messages`
- `GET /reminders`
- `POST /reminders`
- `PATCH /reminders/:id`
- `GET /parts`
- `POST /parts`
- `PATCH /parts/:id`
- `GET /cart`
- `POST /cart`
- `POST /cart/:id/approve-request`
- `POST /cart/:id/approve-commit`
- `GET /private/session`
- `POST /private/session/notes`
- `POST /private/session/wipe`
- `GET /client/asset-manifest`

## Expected Test Sequence

If you want a practical sanity test after a move or rebuild:

1. start backend
2. open `/panel/`
3. refresh health
4. refresh auth status
5. create a pairing session
6. complete pairing and confirm a token is returned
7. save the token in the panel
8. use the paired device in the request context
9. refresh dashboard overview
10. register a trusted iPhone device
11. register a trusted watch device
12. unlock the iPhone sensitive-action window
13. unlock the watch sensitive-action window
14. create a task as iPhone
15. confirm task creation fails when switched to watch
16. create a cart item as trusted iPhone
17. confirm approval request is blocked when the iPhone is re-locked
18. unlock the iPhone again and request approval
19. confirm approval resolution is blocked when the watch is re-locked
20. unlock the watch again and resolve approval
21. commit approval as trusted iPhone
22. switch to Private Mode
23. add a RAM-only private session note
24. create an explicit private note save
25. confirm the two private note paths behave differently
26. create a shared memory entry
27. confirm shared memory survives a managed backend restart
28. create a normal conversation message and confirm it returns either the OpenAI result or the local fallback result
29. search shared memory for a known term
30. refresh provider status and confirm OpenAI/local entries are present
31. execute a hardwired command such as `show tasks`
32. refresh the client asset manifest and confirm expected asset slots are listed with any detected resolved file paths
33. confirm the core avatar bundle reports ready when the base body, hair, vest, pants, boots, and idle are present
34. update a shared memory entry and confirm the search results change
35. delete a shared memory entry and confirm it no longer appears
36. send a normal conversation message and confirm provider telemetry changes on `/providers/status`
37. set voice mode to `push_to_talk` and confirm the silence timeout can be increased
38. switch to `wake_word`, speak the wake phrase, and confirm listening resumes after the spoken response
39. refresh `/camera/matrix` and confirm the current device type rules are visible
40. set preferred TTS to an OpenAI engine and confirm `/voice/speak` falls back locally if cloud TTS is unavailable
41. set browser TTS as primary and confirm it still works offline

Or use the automated script:

- [run-backend-tests.ps1](../tools/run-backend-tests.ps1)

Current fully automated local workflow:

- build backend
- build control panel
- build playcanvas app
- start backend in the background
- wait for `/health`
- run the regression suite
- stop the backend

The helper scripts now manage the active backend by port as well as pid-file tracking, so stale listeners on `4180` are cleared before automated test runs.

Reports are written to:

- [reports](./reports)

Served local browser surfaces:

- operator panel: `http://127.0.0.1:4180/panel/`
- work-lite client: `http://127.0.0.1:4180/client/work-lite/`

## Troubleshooting

If the backend does not start:

- confirm Node is installed
- run `tools\install-backend-deps.ps1`
- run `tools\build-backend.ps1`

If the panel opens but actions fail:

- confirm the backend is running on `127.0.0.1:4180`
- check the Response Log panel
- verify Device ID, Device Type, and Mode are set correctly

If the work-lite client opens but looks stale:

- rebuild with [build-playcanvas-app.ps1](../tools/build-playcanvas-app.ps1)
- refresh `http://127.0.0.1:4180/client/work-lite/`
- confirm `dist/playcanvas-app/src/main.js` exists under the repo

If dropped assets are not detected:

- confirm the files are not zero-byte exports
- confirm they are under `playcanvas-app\assets`
- refresh `http://127.0.0.1:4180/client/asset-manifest`
- if a resolved path appears there, confirm the same file is reachable under `http://127.0.0.1:4180/client-assets/...`

If approval actions fail:

- confirm the device is registered
- confirm the device is trusted
- confirm the device type matches the registered record
- confirm the current token, if present, belongs to the device you expect

If pairing actions fail:

- confirm the device is on localhost or a private LAN
- confirm the pairing session has not expired
- confirm the pairing code matches exactly
- confirm you are not trying to reuse an already completed session
- confirm you are not assuming pairing alone grants sensitive-action permission

If Private Mode note actions fail:

- confirm Mode is `private`
- for RAM-only notes, use the private session section
- for explicit private save, enable `Explicit local save` and `privateOnly`

## OpenAI and Memory Configuration

- `GAIL_AUTH_MODE`
  - controls whether the backend is `open`, `paired`, or `paired_required_for_sensitive`
- `OPENAI_API_KEY`
  - enables the normal OpenAI conversation path
- `OPENAI_MODEL`
  - optional override for the default model
- `OPENAI_BASE_URL`
  - optional override for the Responses API base URL
- `GAIL_MEMORY_PATH`
  - optional override for the shared memory file path

If `OPENAI_API_KEY` is not set, normal conversation sessions still default to the OpenAI provider selection, but replies fall back to the local provider automatically.

## Maintenance Notes

When the project progresses, update this manual for:

- new run/build scripts
- new panel sections
- new approval or trust flows
- new device restrictions
- new auth requirements
- new storage behavior
- new production deployment steps

This file should stay aligned with:

- [PROJECT_STATE.md](./PROJECT_STATE.md)
- [BUILD_LOG.md](./BUILD_LOG.md)
- [MODE_RULES.md](./MODE_RULES.md)
- [MEMORY_RULES.md](./MEMORY_RULES.md)

## Shared Voice Baseline

Current shared client voice baseline:
- mode: `wake_word`
- wake word: `hey gail`
- silence timeout: `4200`
- auto resume after response: `true`
- primary TTS: `openai-gpt-4o-mini-tts`
- fallback TTS: `browser-speech-synthesis`
- OpenAI voice: `nova`
- OpenAI instructions: `Speak with a soft feminine voice and a light UK English accent. Sound warm, calm, and natural. Avoid American pronunciation. Keep delivery gentle, lightly expressive, and conversational. Do not sound robotic, flat, deep, or masculine.`

## Work-Lite Voice Loop

The work-lite client (`/client/work-lite/`) now has a full browser `SpeechRecognition` loop for wake-word voice input. This matches the capability of the web control panel and main PlayCanvas client.

How it works:

1. on page load, the client reads voice settings from `GET /voice/settings`
2. if the device type supports STT (`kiosk`, `uconsole`, `iphone`, `web_admin`) and voice mode is `wake_word` or `always_listening`, the browser mic is activated
3. the client listens continuously for the wake word `hey gail`
4. once the wake word is detected, subsequent speech is buffered until a silence period of 4200ms
5. the buffered transcript is sent as a conversation message via `POST /conversation/sessions/{id}/messages`
6. while Gail is speaking (TTS playback), the mic is paused to avoid feedback
7. after the response finishes, the mic automatically resumes
8. voice settings are re-synced from the backend every 3 seconds, so operator shell changes to voice mode take effect without page reload

UI elements on the work-lite page:

- `Voice input` row in the shell-state panel shows current voice loop state
- `#voice-runtime-note` shows live status messages (listening, wake word heard, error, etc.)
- `#voice-loop-restart` button allows manual mic restart if the browser stops the recognition

Troubleshooting work-lite voice:

- if `Voice input` shows `unsupported`, the browser does not expose `SpeechRecognition` — use Chrome or Edge
- if `Voice input` shows `error`, check the browser console for mic permission or network errors
- if the mic activates but the wake word is never detected, speak clearly and ensure the wake word matches exactly (`hey gail`)
- if the voice loop keeps restarting, check `shouldBlockVoiceRetry` logic — the client blocks rapid retries after repeated failures
- if voice mode shows `typed` or `push_to_talk`, the voice loop will not auto-activate — change the mode in the Operator Studio shell
- the voice loop only runs on device types with `sttSupported: true` in the backend device capability matrix

Files involved:

- `playcanvas-app/src/work-lite-rebuild.ts` — client-side voice loop implementation
- `backend/services/voice-service.ts` — voice settings persistence and device capability matrix
- `backend/api/domain-http-routes.ts` — voice HTTP routes (`GET /voice/settings`, `GET /voice/status`, `PATCH /voice/settings`, `POST /voice/speak`)
- `shared/contracts/voice.ts` — `VoiceSettings` interface

