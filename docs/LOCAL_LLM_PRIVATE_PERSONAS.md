# Local LLM And Private Personas

This document describes the live local-LLM configuration surface, how private personas are selected, and where operators change those settings.

## Current Backend Routes

- `GET /providers/local-llm-config`
  Purpose: inspect the current Ollama connection settings and private persona prompts.
- `PATCH /providers/local-llm-config`
  Purpose: update the local model connection, default/active private persona, and the counselor/girlfriend system prompts.

Related provider routes:

- `GET /providers/status`
- `GET /providers/openai-config`
- `PATCH /providers/openai-config`

## Current Config Model

The backend persists local-model settings in `data/providers/local-llm-config.json`.

Current fields:

- `baseUrl`
  Ollama API base URL.
- `model`
  Ollama model tag currently used for local generation.
- `timeoutMs`
  Request timeout for Ollama generation calls.
- `keepAlive`
  Ollama `keep_alive` value.
- `defaultPrivatePersona`
  Persona selected for a fresh private-mode session if no override is supplied.
- `activePrivatePersona`
  Persona the backend currently uses for private-mode local generation.
- `personas.private_counselor.systemPrompt`
  System prompt for the counselor private agent.
- `personas.private_girlfriend.systemPrompt`
  System prompt for the girlfriend private agent.

## Private Personas

The current live private personas are:

- `private_counselor`
  Intended for calm, reflective, emotionally stabilizing private conversations.
- `private_girlfriend`
  Intended for warm, affectionate, emotionally present private conversations.

Private mode still enforces `local-llm`. The new behavior is that private mode is no longer one generic local prompt. The local provider now injects the active private persona prompt into the Ollama system prompt before generation.

## Shell Wiring

Both current shell surfaces now expose the local-LLM config:

- Operator Studio shell: `Providers and Voice`
  File: `web-control-panel/src/operator-studio-shell.js`
- Legacy operator test panel: provider section in `web-control-panel/src/main.ts`

Operator Studio now supports:

- reading local model connection settings
- reading the default and active private persona
- editing counselor and girlfriend local system prompts
- saving the full local-LLM + private persona config through one page action

Current control phrases for persona switching:

- `counselor mode`
- `private counselor mode`
- `girlfriend mode`
- `private girlfriend mode`
- `doc im lonley`

## Runtime Behavior

Current private-mode behavior:

1. Private mode still routes conversation generation to `local-llm` only.
2. The local provider reads the configured active private persona.
3. The persona-specific prompt is appended to the local system prompt.
4. Ollama generates the reply using the configured model and connection settings.

Current command-routing behavior:

- the backend resolves persona switch phrases into `switch_private_persona_counselor` or `switch_private_persona_girlfriend`
- the PlayCanvas runtime applies those actions locally by patching `/providers/local-llm-config`
- the Operator Studio shell applies those actions through its command router and then refreshes the provider page

Normal-mode behavior is unchanged:

- OpenAI remains the default normal-mode provider when configured.
- `local-llm` remains the fallback provider when OpenAI is unavailable or fails.

## Validation Guidance

Minimal verification set:

1. `GET /providers/local-llm-config`
   Expected: current Ollama connection values plus both persona prompts.
2. `PATCH /providers/local-llm-config`
   Expected: saved values round-trip cleanly.
3. Private-mode conversation request after changing `activePrivatePersona`
   Expected: reply comes from `local-llm` with the newly selected persona prompt in effect.
4. Operator Studio `Providers and Voice` page refresh after save
   Expected: settings surface reloads with the saved values.

## Current Limits

- Private persona selection is currently backend-config-driven, not a fully separate runtime asset/persona-state machine.
- The two private personas currently differ by local agent prompt and selected active persona, not by fully separate command maps or avatar pipelines.
- Browser-level integration tests for persona switching in the shell are still pending.