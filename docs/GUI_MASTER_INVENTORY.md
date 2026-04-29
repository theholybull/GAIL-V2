# GUI Master Inventory (Fresh Build Blueprint)

This is the complete GUI scope currently implied by the repo's backend routes, shared contracts, operator panel implementation, and docs.

Use this as the source checklist for rebuilding the UI from scratch.

## Canonical Sources Used

- backend routes: `backend/api/domain-http-routes.ts`
- backend static client serving: `backend/api/http-server.ts`
- shared input contracts: `shared/contracts/service-inputs.ts`
- shared entities: `shared/contracts/entities.ts`
- workflow contracts: `shared/contracts/workflow.ts`
- auth contracts: `shared/contracts/auth.ts`
- voice/provider contracts: `shared/contracts/voice.ts`, `shared/contracts/provider-status.ts`
- current operator GUI: `web-control-panel/src/main.ts`
- operating docs: `docs/OPERATOR_MANUAL.md`, `docs/AUTH_PAIRING.md`, `docs/REMOTE_ACCESS.md`, `docs/WORKFLOW_WORKBENCH.md`

## Top-Level GUI Surfaces

You need these top-level frontends:

1. Operator Panel (`/panel/`)
2. Work-Lite Client (`/client/work-lite/`)
3. Client Proof Surface (`/client/proof/`)

## Operator Panel Tabs And Sections

Current panel sections in code:

- Request Context
- Pairing and Device Credentials
- Local and LAN Access
- Avatar System
- Voice Loop
- Camera Access
- Provider Status
- Dashboard Snapshot
- Device Registry
- Approval Queue
- Task Testing
- Project Tracking
- Document and Memory Import
- Workflow Workbench
- Workflow Instructions
- List Workflow
- Notes and Private Saves
- Shared Memory
- Conversation Sessions
- Hardwired Commands
- Asset Manifest
- Reminder Tracking
- Parts Tracking
- RAM-Only Private Session
- Approval Flow

Current tab grouping:

- Control
- Voice
- Organizer
- Workflow
- Instructions
- System

## Global GUI Infrastructure You Need

- request context bar:
  - base URL
  - device ID
  - device type
  - mode
  - explicit local save
  - device token storage/clear
- generic response/output viewer blocks
- error toast or inline error capture
- per-section refresh actions
- permission-aware disabled states
- status badges and audit timestamps

## Auth And Device GUI Modules

Required screens/components:

- auth status display (`GET /auth/status`)
- pairing session create (`POST /auth/pairing-sessions`)
- pairing completion form (`POST /auth/pairing-sessions/:id/complete`)
- token handling UX:
  - show/save/clear/apply token
- device registry:
  - list devices (`GET /devices`)
  - register device (`POST /devices`)
  - trust toggle (`PATCH /devices/:id/trust`)
  - sensitive access window controls (`PATCH /devices/:id/access-window`)

Critical fields from contracts:

- device: `id`, `type`, `name`, `defaultMode`, `qualityTier`, `trusted`
- optional capabilities: `supportsCamera`, `supportsWatchApproval`, `supportsRichAvatar`

## Access And Deployment GUI Modules

- access status view (`GET /access/status`)
- local URL display
- LAN URL display
- auth posture warnings
- remote/Tailscale guidance links

## Provider GUI Modules

- provider status dashboard (`GET /providers/status`)
- OpenAI config status (`GET /providers/openai-config`)
- OpenAI config update/clear (`PATCH /providers/openai-config`)
- provider telemetry display:
  - attempts, successes, failures, fallbacks, last failure reason

## Voice And Camera GUI Modules

Voice settings and runtime:

- read settings (`GET /voice/settings`)
- update settings (`PATCH /voice/settings`)
- engine catalog (`GET /voice/engines`)
- runtime status (`GET /voice/status`)
- warmup (`POST /voice/warmup`)
- speak/test (`POST /voice/speak`)

Voice fields:

- mode (`push_to_talk` or `wake_word`)
- wake word
- silence timeout
- auto resume
- preferred/fallback TTS
- OpenAI voice/instructions
- browser voice selection

Camera:

- camera capability matrix (`GET /camera/matrix`)
- local browser camera preview controls

## Conversation GUI Modules

- list sessions (`GET /conversation/sessions`)
- create session (`POST /conversation/sessions`)
- session detail (`GET /conversation/sessions/:id`)
- send message (`POST /conversation/sessions/:id/messages`)
- streaming reply mode (`POST /conversation/sessions/:id/messages/stream`)
- provider selection and fallback visibility
- used-provider and fallback reason display

## Memory, Notes, Import GUI Modules

Memory:

- list/search (`GET /memory/entries`)
- create (`POST /memory/entries`)
- update (`PATCH /memory/entries/:id`)
- delete (`DELETE /memory/entries/:id`)

Document import:

- import endpoint (`POST /imports/documents`)
- upload support:
  - JSON, text, markdown, CSV, PDF
- target selection:
  - shared memory
  - project note
- archive-original toggle

Notes:

- list (`GET /notes`)
- create (`POST /notes`)
- update (`PATCH /notes/:id`)
- private-only note path handling

## Organizer Entity GUI Modules

Projects:

- list/create/update (`GET/POST/PATCH /projects`)
- fields: title, summary, status, tags

Lists:

- list/create/update list (`GET/POST/PATCH /lists`)
- add/update list item (`POST /lists/:id/items`, `PATCH /lists/:id/items/:itemId`)

Tasks:

- list/create/update (`GET/POST/PATCH /tasks`)
- fields: title, details, project, due date, priority, status

Reminders:

- list/create/update (`GET/POST/PATCH /reminders`)
- fields: title, remindAt, details, linkedTaskId, status

Parts:

- list/create/update (`GET/POST/PATCH /parts`)
- fields: title, sourceType, partNumber, sourceUrl, compatibilityNotes, status, projectId

Cart:

- list/create/update (`GET/POST/PATCH /cart`)
- approval request (`POST /cart/:id/approve-request`)
- approval commit (`POST /cart/:id/approve-commit`)
- blocked direct approve state handling (`202 pending_approval`)

Approvals:

- list/create/resolve (`GET/POST/PATCH /approvals`)
- status lifecycle:
  - pending
  - approved
  - rejected
  - expired

## Private Session GUI Modules

- private session state (`GET /private/session`)
- add RAM-only note (`POST /private/session/notes`)
- wipe private session (`POST /private/session/wipe`)
- private-mode guardrails in UI

## Workflow GUI Modules (New System)

Core workflow routes:

- `GET /workflows`
- `POST /workflows`
- `GET /workflows/:id`
- `PATCH /workflows/:id`
- `POST /workflows/:id/plan`
- `PATCH /workflows/:id/steps/:stepId`
- `POST /workflows/:id/steps/:stepId/run`

Workflow model screens/components:

- workflow list/grid
- workflow detail editor:
  - title
  - objective
  - status
  - project link
  - provider preference
  - context items
- visual step board:
  - step dependencies
  - step status
  - assignee
  - run action
- artifacts viewer:
  - markdown/plain text/json artifact rendering
  - fallback/provider metadata
- review gate controls for `needs_review` steps

Workflow step kinds to represent in UI:

- document_summary
- data_compile
- draft_email
- fill_form
- codex_agent
- human_review

## Commands And Automation GUI Modules

- command catalog (`GET /commands`)
- command execution (`POST /commands/execute`)
- action-broker output panel

## Client Runtime And Asset GUI Modules

- runtime system setting:
  - `GET /client/runtime-settings`
  - `PATCH /client/runtime-settings`
- asset manifest:
  - `GET /client/asset-manifest`
- client asset health view:
  - present vs missing assets
  - required directories
  - avatar readiness status

Also support static browsable access for:

- `/client-assets/...`

## State Models You Must Mirror In The GUI

Core entities:

- Project
- Note
- ListRecord and ListItem
- Task
- Reminder
- PartRecord
- CartItem
- ApprovalRequest
- ConversationSession and ConversationMessage
- MemoryEntry
- Workflow, WorkflowStep, WorkflowArtifact, WorkflowContextItem
- DeviceProfile and PairingSession/AuthStatus
- VoiceSettings/VoiceStatus
- ProviderStatus/OpenAiConfigStatus

## Mode And Permission UX Rules

Your rebuilt GUI must surface and enforce:

- current mode (`work`, `home_shop`, `private`, `lightweight`, `focus`)
- auth posture (`open`, `paired`, `paired_required_for_sensitive`)
- sensitive action requirements:
  - trusted device
  - unlock window
  - non-private mode for sensitive flows
- route capability mismatches with clear messages

## Fresh-Build Screen Checklist

Minimum screens:

1. Session/Auth shell
2. Access and deployment status
3. Providers and OpenAI configuration
4. Voice and camera
5. Dashboard overview
6. Devices and approvals
7. Organizer entities:
   - projects
   - notes
   - lists
   - tasks
   - reminders
   - parts
   - cart
8. Memory and document import
9. Conversation sessions
10. Workflow workbench
11. Workflow instructions/help
12. Command execution
13. Client runtime and asset health
14. Private session

## Test-Gated Definition Of Ready

Before implementing changes in the fresh GUI build, keep this gate:

1. `npm.cmd run build` in `backend`
2. `npm.cmd run build` in `web-control-panel`
3. `npm.cmd run build` in `playcanvas-app`
4. `powershell -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1 -EnsureBackend -ShutdownWhenDone`

The workflow system is ready for use now in current form and already covered in the regression harness.

