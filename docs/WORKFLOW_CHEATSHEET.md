# Workflow Workbench Cheat Sheet

Use this when you want fast execution without reading the full docs.

## Start Stack

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1
```

Open:

- `http://127.0.0.1:4180/panel/`

## Build + Test Gate

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

Target:

- all builds pass
- backend tests pass

## Panel Workflow (Fast Path)

Section:

- `Workflow Workbench`

Steps:

1. Fill `Workflow Title` and `Objective`.
2. Optional: add `Project ID`.
3. Set `Provider Preference` (`openai` or `local-llm`).
4. Fill `Context Item Title` and `Context Body`.
5. Click `Create Workflow`.
6. Click `Plan Steps`.
7. Click a step card (auto-fills `Selected Step ID`).
8. Click `Run Selected Step`.
9. Review artifacts in `workflow-step-output`.

## Step Meaning

- `document_summary`: extracts key facts
- `data_compile`: produces structured findings
- `draft_email`: drafts email subject/body
- `fill_form`: drafts form fields
- `codex_agent`: creates Codex handoff brief
- `human_review`: final review gate

## Status Meaning

- `ready`: can run now
- `pending`: waiting on dependency
- `running`: in progress
- `completed`: done
- `needs_review`: operator review required
- `failed`: run failed, inspect output/error

## API Quick Calls

- `GET /workflows`
- `POST /workflows`
- `POST /workflows/:id/plan`
- `POST /workflows/:id/steps/:stepId/run`

## Common Fixes

If `/workflows` returns `404` during tests:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1 -EnsureBackend -ShutdownWhenDone
```

If panel action fails:

1. Check `http://127.0.0.1:4180/health`
2. Refresh panel
3. Re-run build gate

## Safety Rules

- do not send email directly from draft artifacts without review
- do not submit forms without review
- treat `needs_review` as mandatory human checkpoint

## Reference

- [Workflow README](./WORKFLOW_README.md)
- [Workflow Workbench](./WORKFLOW_WORKBENCH.md)
- [Workflow Implementation Plan](./IMPLEMENTATION_PLAN_WORKFLOW.md)
- [Operator Studio Shell](../web-control-panel/operator-studio-shell.html)

