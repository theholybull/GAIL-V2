# Command Routing

This document describes how command phrases move through Gail, how the backend resolves them, and what the current client surfaces do with the resulting action.

## Current Routes

Backend command and control entrypoints:

- `POST /commands/execute`
  Purpose: direct hardwired command lookup by phrase.
- `POST /control/intents`
  Purpose: route free text into either a matched command or a planned workflow.
- `GET /commands`
  Purpose: inspect hardwired commands plus saved phrase mappings.
- `POST /commands/mappings`
  Purpose: persist additional phrases for an existing command key.

Primary backend implementation:

- [backend/services/command-service.ts](../backend/services/command-service.ts)
- [backend/services/control-intent-service.ts](../backend/services/control-intent-service.ts)
- [backend/brokers/action-broker.ts](../backend/brokers/action-broker.ts)
- [shared/command-definitions/hardwired-commands.ts](../shared/command-definitions/hardwired-commands.ts)

## Resolution Model

The backend resolves text in two stages.

1. Hardwired command match.
   Input text is normalized and compared against built-in phrases plus persisted custom mappings.
2. Workflow fallback.
   If no command matches, the text becomes a workflow objective and the planner produces a reviewable workflow draft.

This means free text control never disappears into a black box.

- If it matches a known command, the response action is `command`.
- If it does not match, the response action is `workflow`.

## Private Mode And Local Personas

Private-mode control and conversation still force the `local-llm` provider.

Current behavior:

- the local provider reads persisted local-model settings from `GET/PATCH /providers/local-llm-config`
- private mode uses one of two configured local personas:
  - `private_counselor`
  - `private_girlfriend`
- the active private persona is selected in provider config and injected into the local system prompt before Ollama generation

This means private-mode routing is now both local-only and persona-aware.

## Important Backend Actions

The backend returns action names from the hardwired command table. Current important action names include:

- `switch_mode_work`
- `switch_mode_private`
- `switch_private_persona_counselor`
- `switch_private_persona_girlfriend`
- `open_tasks`
- `open_build_control_tower`
- `show_build_approval_queue`
- `run_build_script`
- `show_build_results`
- `capture_build_screenshot`
- `analyze_build_screenshot`
- `request_build_changes`
- `approve_build_step`
- `show_pending_changes`
- `show_last_approved_change`
- `explain_change_reason`
- `approve_change`
- `reject_change`
- `rollback_last_approved`
- `show_change_history`
- `set_display_mode_wake_word`
- `set_display_mode_always_listening`
- `set_display_mode_typed`
- `open_menu`
- `exit_fullscreen`
- `close_program`
- `report_bug`
- `help`
- `add_feature_request`

These action names are the canonical contract between backend and client surfaces.

## Persona Switch Phrases

Current hardwired phrases for private persona switching:

- `counselor mode`
- `private counselor mode`
- `girlfriend mode`
- `private girlfriend mode`
- `doc im lonley`

Expected actions:

- counselor phrases -> `switch_private_persona_counselor`
- girlfriend phrases -> `switch_private_persona_girlfriend`

## PlayCanvas Runtime Wiring

The PlayCanvas client consumes backend control responses in [playcanvas-app/src/main.ts](../playcanvas-app/src/main.ts).

Current runtime-owned local actions:

- `switch_mode_work`
- `switch_mode_private`
- `switch_private_persona_counselor`
- `switch_private_persona_girlfriend`
- `open_menu`
- `exit_fullscreen`
- `set_display_mode_wake_word`
- `set_display_mode_always_listening`
- `set_display_mode_typed`
- `close_program`

Current runtime behavior:

- mode-switch actions update the local runtime mode and reload the matching conversation session state
- private-persona switch actions patch `/providers/local-llm-config` so the next private reply uses the selected persona
- display mode actions patch client runtime settings and backend voice mode
- `open_menu` opens the runtime quick menu locally
- `exit_fullscreen` exits display mode locally
- `close_program` asks the browser to close and falls back to a status message when blocked
- shell-oriented actions open Operator Studio Shell in a new tab with the backend action attached in the URL

## Operator Studio Shell Wiring

Primary shell implementation:

- [web-control-panel/src/operator-studio-shell.js](../web-control-panel/src/operator-studio-shell.js)

Current shell behavior:

- command palette entries include a backend-control route for free text input
- matched backend actions map onto existing shell pages and action buttons where possible
- persona-switch actions patch `/providers/local-llm-config`, refresh provider data, and open the `Providers and Voice` page
- workflow fallthrough opens Workflow Studio and selects the created workflow
- runtime-only actions like `switch_mode_work` are explicitly reported as runtime-facing rather than silently ignored

Current shell-owned routed actions:

- `open_tasks` -> Organizer Control page
- `open_build_control_tower` -> Build Control Tower page
- `show_build_approval_queue` -> Build Control Tower page
- `run_build_script` -> Build Control Tower action
- `show_build_results` -> Build Control Tower action
- `capture_build_screenshot` -> Build Control Tower action
- `analyze_build_screenshot` -> Build Control Tower action
- `request_build_changes` -> Build Control Tower action
- `approve_build_step` -> Build Control Tower action
- `show_pending_changes` -> Change Governance page
- `show_last_approved_change` -> Change Governance page
- `explain_change_reason` -> Change Governance page
- `approve_change` -> Change Governance action
- `reject_change` -> Change Governance action
- `rollback_last_approved` -> Change Governance action
- `show_change_history` -> Change Governance action
- `report_bug` -> Report Bugs page
- `add_feature_request` -> Feature Inbox page
- `help` -> shell help surface

## Operator Expectations

What operators should expect now:

- saying or typing a known command into runtime workflow-control mode produces a visible side effect, not only a summary string
- shell command palette input can be routed through the same backend control path used by runtime voice and typed control
- free text that is not a command becomes a reviewable workflow plan rather than being dropped
- private persona switch phrases should change the active private agent, not open a workflow plan, once the backend is running the current build
- build, governance, reporting, and feature actions land in the shell pages that already own those workflows

## Testing Guidance

Minimal verification set:

1. `POST /commands/execute` with `show tasks`.
   Expected: matched command with `action: open_tasks`.
2. `POST /control/intents` with `show tasks`.
   Expected: `action: command`.
3. `POST /control/intents` with non-command free text.
   Expected: `action: workflow`.
4. `POST /control/intents` with `doc im lonley`.
   Expected: `action: command` with `switch_private_persona_girlfriend`.
5. Runtime workflow-control input with `show tasks`.
   Expected: shell opens Organizer Control page.
6. Runtime or shell input with `counselor mode` or `girlfriend mode`.
   Expected: `activePrivatePersona` changes through `/providers/local-llm-config`.

If a command resolves but has no side effect, first check whether the action belongs to the runtime or the shell. The backend action name is the source of truth.