# Mode Rules

## Work Mode

- concise
- practical
- low visual overhead
- task and workflow first

## Home/Shop Mode

- warmer presentation
- richer presence
- useful before theatrical

## Private Mode

- no cloud calls
- no sync
- RAM-only by default
- distinct theme, avatar look, and behavior
- no automatic permanent task or reminder creation
- backend HTTP layer blocks persistent writes for projects, lists, tasks, reminders, parts, and cart while `x-gail-mode: private` is active
- private note writes require `x-gail-explicit-local-save: true` and `privateOnly=true`
- private conversation sessions remain device-bound and RAM-only
- shared memory file routes are blocked in Private Mode

## Lightweight Mode

- reduced rendering
- terse output
- watch-first constraints

## Focus Mode

- reduced chatter
- task-driven summaries
- interruptions limited to important prompts
