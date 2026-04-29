# Architecture

## Active Foundation

The active system direction is now web-first and local-first:

- PlayCanvas client for avatar and presence rendering
- shared TypeScript contracts across backend and clients
- local SQLite as the primary working store
- cloud Postgres as the cross-device sync layer
- PowerSync-compatible sync design
- WebAuthn/passkeys and trusted devices for sensitive flows

## Current Auth Posture

The current authentication posture is deliberately staged:

- prototype default: `GAIL_AUTH_MODE=open`
- real paired-device token path: available now
- stricter mode for sensitive routes: `paired_required_for_sensitive`
- future stricter baseline: `paired`

Meaning:

- the system can keep moving during prototype work
- paired identity can already be exercised end to end
- later hardening should extend this path, not replace it

## System Separation

- assistant intelligence
- automation and tool actions through brokers
- workflow orchestration for document review, structured prep, and human-gated execution
- presentation and avatar logic
- memory and sync
- private mode isolation

## Workflow Layer

The active backend now includes a durable workflow layer intended for operator-supervised AI work.

Current responsibilities:

- store workflow plans in SQLite
- attach manual context and imported material summaries
- produce deterministic step plans
- generate reviewable artifacts for summaries, compiled findings, emails, forms, and Codex handoff
- keep a human review gate in the default execution chain

The workflow layer is an orchestration surface, not a silent side-effect engine. External actions should continue to require explicit operator review and later, explicit operator approval.

## Current Repo Reality

Older Unity and Python exploration code remains in this repository as preserved reference material. It is not the active target architecture for the current scaffold.
