# Workflow Workbench README

This document is the practical runbook for using Gail's workflow system.

## What It Does

The workflow workbench helps you:

- read documents and context
- extract key points
- compile structured findings
- draft email content
- prepare form field answers
- generate Codex-agent handoff briefs
- enforce human review before external actions

## Where To Use It

Operator panel route:

- `http://127.0.0.1:4180/panel/`

Panel section:

- `Workflow Workbench`

New shell-build helpers in panel:

- `Create Shell Build Workflow`
- `Run Next Ready Step`
- visual progress tracker (`% complete`, completed count, ready/running/failed counts)

## Quick Start

From repo root (`<repo-root>`, any drive letter):

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1
```

Open:

- `http://127.0.0.1:4180/panel/`

## Build and Test First

Use these before/after workflow changes:

```powershell
cd .\backend
npm.cmd run build

cd ..\web-control-panel
npm.cmd run build

cd ..\playcanvas-app
npm.cmd run build

cd ..
powershell -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1 -EnsureBackend -ShutdownWhenDone
```

Important:

- use `npm.cmd` in PowerShell on this machine
- use `-EnsureBackend` for test reliability

## Operator Workflow Steps

1. Prepare source material:
   - import files under `Document and Memory Import`
   - or paste direct context into workflow context body
2. Create workflow:
   - set title and objective
   - optional project ID
   - choose provider preference (`openai` or `local-llm`)
   - click `Create Workflow`
3. Plan steps:
   - click `Plan Steps`
   - verify step chain in the visual board
   - shell-focused workflows now auto-use a dedicated professional shell phase plan when objective/context matches shell build signals
4. Execute step:
   - click a step card to select it
   - click `Run Selected Step`
   - or click `Run Next Ready Step` for guided phase progression
   - inspect generated artifacts in step output
5. Review:
   - treat `needs_review` steps as approval gates
   - do not perform external actions without review

## API Endpoints

- `GET /workflows`
- `POST /workflows`
- `GET /workflows/:id`
- `PATCH /workflows/:id`
- `POST /workflows/:id/plan`
- `PATCH /workflows/:id/steps/:stepId`
- `POST /workflows/:id/steps/:stepId/run`

## Data and Persistence

Workflow state is persisted in SQLite:

- table: `workflows`
- includes context, steps, artifacts, and timestamps

## Safety Model

Current safeguards:

- no direct mail send from workflow run path
- no direct form submission from workflow run path
- human review step in the default workflow chain
- review states surfaced clearly in panel and API

## Troubleshooting

If workflow route returns `404` during tests:

1. stale backend is likely running old code
2. rerun tests with:
   - `powershell -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1 -EnsureBackend -ShutdownWhenDone`

If panel actions fail:

1. verify backend is up at `http://127.0.0.1:4180/health`
2. refresh provider status in panel
3. verify build artifacts exist for backend/control panel/app

## Related Docs

- [WORKFLOW_WORKBENCH.md](./WORKFLOW_WORKBENCH.md)
- [IMPLEMENTATION_PLAN_WORKFLOW.md](./IMPLEMENTATION_PLAN_WORKFLOW.md)
- [OPERATOR_MANUAL.md](./OPERATOR_MANUAL.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)


