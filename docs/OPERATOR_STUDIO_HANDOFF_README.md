# Operator Studio Handoff README

This file is the complete handoff of what was built for the new Operator Studio shell, what is live, what is still scaffolded, and what to do next.

## Important Clarification

Current implementation is a **web-based shell UI** (browser shell), not a native desktop shell.

Location:

- `F:\Gail\web-control-panel\operator-studio-shell.html`

If RAM pressure is high in Chrome, next step is to wrap this into a desktop shell process (Electron/Tauri) or optimize browser memory footprint.

## What Was Built

### 1. Full Operator Shell Page

Created:

- `F:\Gail\web-control-panel\operator-studio-shell.html`

This includes:

- left navigation (page registry)
- center workspace (settings, displays, actions, working canvas)
- right inspector (entities/routes/checklist)
- bottom console
- command palette dialog
- change-request dialog

### 2. Dedicated Shell Stylesheet

Created:

- `F:\Gail\web-control-panel\src\styles\operator-studio-shell.css`

Includes:

- studio layout styling
- dense control styling
- responsive drawer behavior for smaller screens
- density modes (`studio`, `compact`, `ultra`)
- avatar mini-preview styling

### 3. Shell Runtime Script

Created:

- `F:\Gail\web-control-panel\src\operator-studio-shell.js`

Includes:

- page registry
- nav rendering and filtering
- page rendering logic
- command palette (`Ctrl+K`)
- density persistence (`localStorage`)
- responsive nav/inspector drawer toggles
- shell console logging
- backend calls for wired modules
- change request submission flow
- avatar mini-preview updates in Avatar Library page

## Live-Wired Pages (Backend Connected)

### Workflow Studio

Connected actions:

- refresh workflows (`GET /workflows`)
- create workflow (`POST /workflows`)
- plan selected workflow (`POST /workflows/:id/plan`)
- run ready step (`POST /workflows/:id/steps/:stepId/run`)

### Devices and Auth

Connected actions:

- refresh auth/devices (`GET /auth/status`, `GET /devices`)
- create pairing session (`POST /auth/pairing-sessions`)
- register quick device (`POST /devices`)
- unlock first device (`PATCH /devices/:id/access-window`)

### Providers and Voice

Connected actions:

- refresh providers + voice (`GET /providers/status`, `GET /providers/openai-config`, `GET /voice/settings`, `GET /voice/status`)
- save voice settings (`PATCH /voice/settings`)
- warmup voice (`POST /voice/warmup`)
- voice test (`POST /voice/speak`)

### Organizer Control

Connected actions:

- refresh organizer surfaces (`GET /dashboard/overview`, `/projects`, `/tasks`, `/reminders`, `/approvals`)
- quick task create (`POST /tasks`)
- approval refresh (`GET /approvals`)

## Scaffolded Pages (Not Yet Wired)

These currently render structure only:

- Avatar Library (has mini render UI only)
- Wardrobe Manager
- Animation Library
- Action Graph
- Animation State Machine
- Gesture and Expression
- Asset Binding and Validation
- Live Preview Stage
- Runtime Mapping (client-last by plan)

## Change Submission System (Requested Feature)

Added on every page:

- topbar button: `Submit Changes`
- action area button: `Submit Changes`

Dialog fields:

- page (auto-filled)
- title
- details

Submission behavior:

1. tries backend note submit:
   - `POST /notes`
2. if backend unavailable:
   - queues in local storage key:
   - `gail.operator.change.queue`

## Small-Display and Density Support

Implemented:

- responsive drawers for nav + inspector on small displays
- backdrop close behavior
- compact breakpoints
- density selector:
  - `Studio`
  - `Compact`
  - `Ultra Dense`

Persisted setting key:

- `gail.operator.shell.density`

## Avatar Mini Render

Added mini render in shell working canvas section:

- visible only on `Avatar Library` page
- updates using selected settings:
  - profile
  - LOD
  - material

This is intentionally a lightweight shell preview, not the full client runtime renderer.

## Animation Page Wiring

The shell Animation Library and Runtime Mapping pages should expose the active PlayCanvas export entrypoints and runtime-profile choices.

Authoritative doc source:

- `F:\Gail\docs\PLAYCANVAS_AVATAR_PIPELINE.md`

Required repo-local script paths:

- `F:\Gail\tools\export-avatar-assets.ps1`
- `F:\Gail\tools\export-playcanvas-pipeline.ps1`

Required runtime profile values:

- `high`
- `medium`
- `low`

Animation Library should show:

- export runner path
- pipeline runner path
- active runtime profile
- animation viewer URL

Runtime Mapping should show:

- pipeline runner path
- active runtime profile
- active avatar system
- active asset root

## Related Files Added/Updated During This Build

### New docs and planning

- `F:\Gail\docs\GUI_MASTER_INVENTORY.md`
- `F:\Gail\docs\IMPLEMENTATION_PLAN_WORKFLOW.md`
- `F:\Gail\docs\WORKFLOW_README.md`
- `F:\Gail\docs\WORKFLOW_CHEATSHEET.md`
- `F:\Gail\docs\WORKFLOW_WORKBENCH.md`
- `F:\Gail\docs\OPERATOR_STUDIO_HANDOFF_README.md` (this file)

### New shell/prototype artifacts

- `F:\Gail\web-control-panel\operator-studio-prototype.html`
- `F:\Gail\web-control-panel\operator-studio-shell.html`
- `F:\Gail\web-control-panel\src\styles\operator-studio-shell.css`
- `F:\Gail\web-control-panel\src\operator-studio-shell.js`

### Existing shell integration updates

- `F:\Gail\web-control-panel\src\main.ts` (workflow/instructions tab and layout updates)
- `F:\Gail\web-control-panel\src\styles\theme.css` (workflow UI styling)

### Backend/workflow foundation updates already completed

- workflow contracts, repository, service, routes, validators, DB schema
- backend tests extended for workflow endpoints

## How To Open

Primary shell:

- `http://127.0.0.1:4180/panel/operator-studio-shell.html`

Earlier rough mock:

- `http://127.0.0.1:4180/panel/operator-studio-prototype.html`

## RAM / Performance Note

Current shell is browser-hosted. If Chrome RAM usage is too high:

1. prefer one-tab operation for shell
2. avoid opening both prototype + shell at once
3. move this shell into a native container (Electron/Tauri) as next step
4. then optimize memory by:
   - lazy-loading page modules
   - deferring heavy lists
   - trimming console buffer

## Exact Next Build Tasks (For AI Continuation)

1. convert web shell to desktop shell container (requested by user)
2. wire Avatar Library to real backend/runtime asset sources
3. wire Wardrobe Manager to slot/preset storage
4. wire Animation Library + state machine editors
5. wire Action Graph
6. keep client page work deferred until operator shell is approved
7. preserve `Submit Changes` flow on every page

## Operator Intent Summary

User wants:

- DAZ-like control center
- everything configurable, easy to reach
- operator/build tool first
- client page last
- clear way to submit change requests from every page
- less RAM pressure than a plain browser-heavy workflow

