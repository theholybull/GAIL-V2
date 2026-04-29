# Master Animation Plan 1: Idle Foundation and Sequencing

Date: 2026-04-04

## Rules
1. Start from a single neutral idle anchor pose.
2. No transition or loop may be authored without idle anchor first.
3. Build in strict order. Do not skip ahead.

## Ordered Checklist
1. Lock neutral idle base pose and timing baseline.
2. Build idle variation loops from same anchor constraints.
3. Add texting animation for text-only mode.
4. Ensure text-only mode suppresses talk/mouth animation.
5. Build transitions: idle -> target -> idle for each state.
6. Validate continuity before any publish state.

## Acceptance
- Every new action has idle-linked entry/exit.
- Text-only behavior never uses talking animation.
