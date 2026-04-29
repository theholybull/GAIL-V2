# Workflow Workbench

This document defines the new workflow layer for Gail. It exists to make document-heavy operator work repeatable without allowing the system to silently act outside review.

## Purpose

The workflow workbench is the operator-facing path for:

- reading imported documents and pasted context
- extracting the important parts
- compiling structured findings
- drafting outbound email content
- preparing form answers
- generating a Codex-agent handoff
- forcing a human review gate before anything external happens

This is a planning-and-preparation surface. It does not send email or submit forms directly in this first version.

## Operator Surface

The workbench is exposed in the browser operator panel at:

- `http://127.0.0.1:4180/panel/`

Section name:

- `Workflow Workbench`

Primary controls:

- `Create Workflow`
- `Load Workflow`
- `Plan Steps`
- `Run Selected Step`

Primary fields:

- workflow title
- linked project id
- objective
- provider preference
- workflow id
- context item title
- context body
- selected step id

## Workflow Model

Each workflow stores:

- a durable workflow id
- title
- objective
- status
- optional linked project id
- provider preference
- context items
- planned steps
- generated artifacts
- created and updated timestamps

Current workflow statuses:

- `draft`
- `planned`
- `active`
- `waiting_review`
- `done`
- `archived`

Current step kinds:

- `document_summary`
- `data_compile`
- `draft_email`
- `fill_form`
- `codex_agent`
- `human_review`

Current step statuses:

- `pending`
- `ready`
- `running`
- `completed`
- `needs_review`
- `blocked`
- `failed`

## Current Execution Behavior

Planning:

- the backend creates a deterministic workflow plan
- the first step becomes `ready`
- each later step depends on the previous step
- the workflow becomes `planned`

Step execution:

- a step can only run when its dependencies are complete or already at review
- the backend persists a running state first
- the backend then generates artifacts for that step
- review-sensitive steps return `needs_review`
- non-review steps return `completed`

Current fallback behavior:

- if OpenAI is unavailable, or `local-llm` is selected, the workflow engine uses the built-in heuristic path
- this keeps the workflow usable during offline or partially configured development

## Artifacts Produced

Current artifact types:

- summary
- report
- email subject
- email body
- form fields JSON
- Codex agent brief
- review checklist

The first version is designed to produce operator-reviewable material, not hidden machine-side action.

## API Surface

Current backend routes:

- `GET /workflows`
- `POST /workflows`
- `GET /workflows/:id`
- `PATCH /workflows/:id`
- `POST /workflows/:id/plan`
- `PATCH /workflows/:id/steps/:stepId`
- `POST /workflows/:id/steps/:stepId/run`

These routes currently follow the task capability boundary:

- read requires `tasks_read`
- write requires `tasks_write`

## Storage

Workflow state is persisted in SQLite in the `workflows` table.

Stored fields:

- `id`
- `title`
- `objective`
- `status`
- `project_id`
- `provider_preference`
- `context_items_json`
- `steps_json`
- `created_at`
- `updated_at`

This means workflow plans and outputs survive backend restarts and SSD recovery as long as the repo data store is preserved.

## Expected Operator Flow

1. import source documents into notes or memory if needed
2. open `Workflow Workbench`
3. create a workflow with the objective and context
4. plan the steps
5. select the ready step
6. run the step
7. inspect generated artifacts
8. continue through the chain until review-sensitive output is ready
9. manually review before any external send, form submission, or delegated coding work

## Safety Boundary

This feature is intentionally conservative.

Current safeguards:

- no direct outbound email send
- no direct form submission
- no silent Codex execution from the workflow engine
- explicit human review step in the default plan
- review-required status for external-facing draft artifacts

This keeps Gail useful for preparation while avoiding invisible external side effects.

## Test Coverage

The backend regression script now verifies:

- workflow creation
- workflow listing
- workflow planning
- workflow step execution
- artifact persistence after execution

Test harness:

- [run-backend-tests.ps1](../tools/run-backend-tests.ps1)

## Next Expansion Path

The next safe upgrades should be:

1. connect workflow context to imported notes and memory selectors in the UI
2. add step-by-step approval controls instead of only run-by-id
3. support explicit operator confirmation for email send
4. support explicit operator confirmation for form submission
5. support structured agent launch handoff instead of only brief generation
6. add richer OpenAI planning with strict JSON parsing and heuristic fallback

Do not skip the review boundary when adding those later stages.

