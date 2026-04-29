# Backend

This directory now contains two tracks:

- `backend/app`: preserved Python/FastAPI exploration from the earlier Unity-first phase
- `backend/api`, `backend/services`, `backend/brokers`, `backend/providers`, `backend/sync`: active TypeScript scaffold for the current web-first architecture

The TypeScript scaffold is Phase 1 only. It defines structure and contracts, not live runtime behavior.

Current AI provider behavior:

- The backend now loads `.env.local` and `.env` from `backend/` and the repo root before startup.
- OpenAI routing requires either `OPENAI_API_KEY` in the environment or a stored key written through `PATCH /providers/openai-config`.
- The local provider uses Ollama via persisted config exposed at `GET/PATCH /providers/local-llm-config` and defaults to model `dolphin-mistral:7b`.
- `private_girlfriend` can override the base model and now defaults to `dolphin-mistral:7b` (or `GAIL_OLLAMA_MODEL`) unless `GAIL_OLLAMA_GIRLFRIEND_MODEL` is set.
- Private mode now supports two configured local personas: `private_counselor` and `private_girlfriend`.
- The active private persona prompt is injected into local private-mode requests before they are sent to Ollama.
- Useful local LLM env vars: `GAIL_OLLAMA_MODEL`, `GAIL_OLLAMA_TIMEOUT_MS`, `GAIL_OLLAMA_KEEP_ALIVE`.

