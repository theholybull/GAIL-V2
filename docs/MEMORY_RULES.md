# Memory Rules

## Permanent Memory

Synced classes:

- projects
- parts
- reminders
- lists
- tasks
- source registry
- settings
- preferences
- approved notes
- shared memory entries captured through `/memory/entries`

## Session Memory

- active thread context
- current topic
- current device and mode

## Ephemeral Memory

- current UI state
- temporary selections
- current search results

## Device Memory

- last mode
- theme preference
- camera preference
- layout preference

## Private Memory

- RAM-only by default
- no cloud sync
- no normal memory write without explicit save
- explicit private note saves are stored in a separate private SQLite database path
- unsaved private session notes are kept only in RAM and are exposed through dedicated private-session endpoints
- Private Mode cannot read or write the shared memory file

## Shared Memory File

- default path: `data/memory/gail-memory.json`
- override path with `GAIL_MEMORY_PATH`
- used only for non-private shared memory entries
- recent entries are passed into normal-mode conversation generation

## Import Rule

- large exports, especially ChatGPT exports, must be staged before promotion into live memory
- stable facts go to shared memory
- project-specific material goes to projects or project-linked notes
- manuals and large reference files default to project-linked notes, not shared memory
- see [CHATGPT_IMPORT_PLAN.md](F:/Gail/docs/CHATGPT_IMPORT_PLAN.md)
