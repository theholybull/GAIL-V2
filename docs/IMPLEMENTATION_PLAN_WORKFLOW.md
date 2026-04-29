# Workflow Workbench Implementation Plan

This plan covers the next stages for turning Gail's current workflow workbench into a production-ready orchestration layer for AI-assisted operations.

## Scope

Target capability:

- AI-supervised workflows
- document and context ingestion
- structured data compilation
- draft email and form preparation
- Codex-agent handoff generation
- strict review and approval controls before external actions

Current baseline (already implemented):

- workflow CRUD and step execution routes
- SQLite persistence for workflow state
- operator-panel visual workflow board
- heuristic planning and artifact generation
- regression coverage in `tools/run-backend-tests.ps1`

## Phase 1: Stabilize Current Workflow Layer

Goals:

- lock API contracts
- harden validation and error semantics
- improve observability

Tasks:

1. Add response envelope consistency for all workflow routes.
2. Add explicit error codes for `blocked`, `not_found`, and `validation_error`.
3. Add backend logs with workflow and step IDs for every `plan` and `run` call.
4. Add deterministic route tests for negative cases:
   - invalid step ID
   - blocked dependency
   - invalid status transitions

Exit criteria:

- all workflow API paths have deterministic test coverage for success and failure
- logs are sufficient to trace every workflow run end-to-end

## Phase 2: Data Inputs and Context Quality

Goals:

- improve context quality and source traceability

Tasks:

1. Add context picker in operator panel for existing notes/memory items.
2. Add source metadata linking on each context item:
   - source type
   - source id
   - imported timestamp
3. Add context dedupe and truncation strategy for oversized payloads.
4. Add workflow artifact provenance fields:
   - provider used
   - fallback status
   - source references used

Exit criteria:

- operator can build workflows without manual copy/paste only
- generated artifacts can be traced back to source inputs

## Phase 3: Provider Intelligence Upgrade

Goals:

- move planning/execution from heuristic-first to provider-first with safe fallback

Tasks:

1. Add provider-based planner path with strict JSON schema output.
2. Keep heuristic fallback when provider fails or is unavailable.
3. Add retry policy and timeout policy per step kind.
4. Add cost/latency telemetry per run.

Exit criteria:

- planner chooses provider path when available
- fallback remains deterministic and covered by tests

## Phase 4: External Action Gates (Email/Form)

Goals:

- support actual action execution without losing safety

Tasks:

1. Add explicit approval route for step-level execution of external actions.
2. Add mail connector integration behind approval-only route.
3. Add form submission connector integration behind approval-only route.
4. Record immutable action audit entries:
   - approved by
   - approved at
   - payload hash
   - execution result

Exit criteria:

- no external action can run without explicit operator approval
- audit trail exists for every external side effect

## Phase 5: Agent Orchestration

Goals:

- convert Codex brief generation into optional managed execution

Tasks:

1. Add agent execution mode:
   - `brief_only`
   - `execute_with_review`
2. Capture agent outputs as workflow artifacts.
3. Add review checkpoints for code-changing tasks before merge/apply.
4. Add rollback notes and post-run verification checklist.

Exit criteria:

- Codex agent runs are structured, reviewable, and recoverable

## Testing and Release Discipline

Mandatory gating before implementation changes land:

1. `npm.cmd run build` in:
   - `backend`
   - `web-control-panel`
   - `playcanvas-app`
2. `powershell -ExecutionPolicy Bypass -File .\tools\run-backend-tests.ps1 -EnsureBackend -ShutdownWhenDone`
3. New tests for each new workflow route behavior.

## Operational Notes

- Always run backend tests with `-EnsureBackend` to avoid stale-process false failures.
- Keep generated reports out of version control.
- Maintain docs in:
  - `docs/WORKFLOW_WORKBENCH.md`
  - `docs/OPERATOR_MANUAL.md`
  - `docs/ARCHITECTURE.md`

