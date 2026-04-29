# Gail Project Instructions

## Mandatory Read Order

Before changing code, docs, drive layout, or agent behavior, read:

1. `cleanup-hub/PROJECT_MAP.md`
2. `cleanup-hub/DRIVE_CLEANUP_PLAN.md`
3. `cleanup-hub/AGENT_GOVERNANCE.md`
4. `cleanup-hub/DOCUMENTATION_PROTOCOL.md`

## Source Of Truth

- Active repo root: `D:\Gail 2.1\working_copy`
- This is the only normal write location for Gail product work.
- Sidecar repos, backups, and old workstreams are read-only unless the operator explicitly approves a migration task.

## Project Overview

Gail is an operator-first, local-first AI presence platform. Web-first architecture using PlayCanvas, shared TypeScript contracts, local SQLite primary storage, OpenAI plus local fallback providers, and an operator shell controlling workflows, runtime, devices, and exports.

## Authority Model

- The human operator is the final authority for drive cleanup, deletes, archive moves, credentials, and release decisions.
- **Gail** is the primary in-product AI and final in-product review authority for manager/builder output.
- The manager coordinates work and routes completed directives into Gail's review path.

## Architecture

- **Backend**: Node.js TypeScript, SQLite via `node:sqlite`
- **Shared contracts**: `shared/contracts/`
- **Providers**: OpenAI primary, Ollama local fallback/private
- **Client**: PlayCanvas work-lite runtime, phone surface, Operator Studio shell
- **Workflow layer**: SQLite-persisted step plans with review gates
- **Agent layer**: manager-alpha plus builders with bounded write scopes

## Naming Convention

- The primary AI is **Gail**.
- The manager agent is `manager-alpha`.
- Builder agents are `builder-a` and `builder-b`.
- The operator is the human user and final authority over cleanup and release control.

## Code Conventions

- Use `createScaffoldId(prefix)` from `shared/utils/id.ts` for new IDs
- SQLite repos implement custom store interfaces for complex types
- Services are composed in `backend/bootstrap.ts`
- Routes are defined inline in `backend/api/domain-http-routes.ts`
- Persisted JSON fields use `_json` suffix
- Timestamps are ISO strings from `new Date().toISOString()`
- Private mode data stays RAM-only or in the private SQLite database

## Agent System

1. Human operator
2. Gail
3. manager-alpha
4. builder-a
5. builder-b

Directive rule:

- completed work enters Gail review
- destructive cleanup or cross-repo actions still require operator approval

## Workspace And Cleanup Rules

- Do not create new Gail project roots on `D:\`
- Do not use backup repos as active workspaces
- Do not move, archive, or delete classified folders without logging the decision first
- Do not perform destructive drive cleanup without operator approval
- Record cleanup and consolidation decisions in `cleanup-hub/DECISION_LOG.md`

## Logging Rules

- Every directive, status change, and agent action gets a timestamped log entry
- Logs are append-only JSONL files in `data/agent-logs/`
- Cleanup actions must include source path, target path, reason, and approval status

## Documentation Sync

When behavior changes materially, update:

- `docs/BUILD_LOG.md`
- `docs/CHANGE_LOG.md`
- `docs/PROJECT_STATE.md`
- relevant `cleanup-hub` files when governance or source-of-truth changes
- do not treat work as complete until `cleanup-hub/DOCUMENTATION_PROTOCOL.md` is satisfied

## Git And Backup

- Use `tools/git-backup.ps1` for automated GitHub pushes when appropriate
- Commit messages follow `[agent] description`
- Never force push or reset shared branches
