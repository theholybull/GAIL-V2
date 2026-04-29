# Gail Verbal Feature Capture and Upgrade Backlog Plan (Pass/Fail)

Date: 2026-04-04
Scope: Add a feature-capture button and verbal memory flow that records update/upgrade ideas into a tracked todo backlog for future build rounds.

## Objective
- Capture feature/update ideas the moment they are spoken.
- Store them in a structured backlog tied to build stage/release round.
- Make them visible and actionable in Build Control Tower and avatar/display interfaces.

## Feature Requirements
1. New button in UI
- Label: `Add Feature Request`
- Visible in:
  - Build Control Tower
  - Display quick menu (or top utility row)

2. Verbal capture path
- Voice command examples:
  - `add feature request`
  - `log upgrade idea`
  - `add this to updates`
- System prompts for required fields if missing.

3. Required fields for each captured item
- title
- details
- source (`voice` or `typed`)
- stage target (`current_build`, `next_round`, `future_upgrade`)
- priority (`low`, `normal`, `high`, `critical`)
- timestamp
- capturedBy (user/device/agent)

4. Backlog storage
- `data/backlog/feature-upgrade-backlog.json`
- append-only create history + mutable status fields

5. Workflow integration
- Backlog item can be promoted into:
  - build task
  - workflow context item
  - change request
- Promotion creates linked IDs for traceability.

## Avatar and Display Access
Avatar must answer:
- "what feature requests are pending"
- "show upgrades for next round"
- "what did I add today"

Display/backlog controls:
- filter by stage/priority/status
- mark as planned/in-progress/done/deferred
- convert to build task

## Suggested UI Placement
- Build Control Tower: `Feature Inbox` panel
- Quick action button in top bar: `+ Feature`
- Display mode menu action: `Add Feature Request`

## API/Service Plan
Add endpoints:
- `POST /backlog/features`
- `GET /backlog/features`
- `PATCH /backlog/features/:id`
- `POST /backlog/features/:id/promote`

## Pass/Fail Gates
| ID | Status | Priority | Area | Requirement | Verification | Pass Criteria |
|---|---|---|---|---|---|---|
| VF1 | FAIL | Blocker | Button Capture | `Add Feature Request` button works in build UI | Create 3 entries from button | All entries saved and visible in backlog |
| VF2 | FAIL | Blocker | Verbal Memory | Voice command creates backlog entries | Add 3 entries by voice | Entries captured with source=voice and timestamps |
| VF3 | FAIL | High | Stage Routing | Items can be targeted to next build round/upgrade stage | Set mixed stage targets | Filters show correct stage grouping |
| VF4 | FAIL | High | Promotion Path | Backlog item can be promoted to task/workflow/change request | Promote 1 item to each type | Linked IDs stored and traceable |
| VF5 | FAIL | Medium | Avatar Recall | Avatar can summarize pending/newly added requests | Ask 5 recall questions | Answers match backlog records |

## Recommended Build Order
1. Backlog schema + storage service.
2. Add UI button and backlog panel.
3. Add voice command routing and capture prompts.
4. Add promote-to-task/workflow/change-request actions.
5. Add avatar recall/query support for backlog memory.

## Seeded Reminder Items (Added 2026-04-04)
- Reminder: source/select a texting animation clip for text-only mode and map it to `text_only_animation_clip` runtime setting.
- Reminder: validate that speaking animation is fully suppressed whenever typed/text-only mode is active.
