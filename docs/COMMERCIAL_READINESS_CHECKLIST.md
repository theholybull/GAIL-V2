# Commercial Readiness Checklist

## Date

2026-04-02

## Use

Use this checklist before calling Gail a real pilot-ready product.

Status values:

- `not started`
- `in progress`
- `ready for pilot`
- `ready for release`

## 1. Product Definition

- Product positioning is clear in the README and product docs: `in progress`
- One primary buyer/operator profile is defined: `in progress`
- One core demo story is defined and repeatable: `in progress`
- Experimental features are separated from release features: `not started`
- V1 scope is explicitly bounded: `in progress`

## 2. Operator Experience

- Operator shell pages reflect real backend/runtime behavior instead of placeholders: `in progress`
- Page help and quick-start guidance exist for first-time operators: `in progress`
- Guided mode exists for ordered critical workflows: `in progress`
- Sensitive actions show clear review and confirmation: `in progress`
- Critical shell flows can be completed without switching tools constantly: `in progress`

## 3. Runtime And Avatar Delivery

- Blender export path is documented and repeatable: `in progress`
- Runtime profile targeting is implemented and understandable: `in progress`
- Backend runtime status matches real asset/export state: `in progress`
- Client runtime consumes the exported assets predictably: `in progress`
- One clean host-to-client avatar demo path exists: `not started`

## 4. Reliability

- One-command startup and stop path exists: `in progress`
- Backend recovery behavior is verified: `in progress`
- Critical shell routes have smoke coverage: `not started`
- Export routes and shell-triggered export flows have repeatable validation: `not started`
- Errors are visible, actionable, and operator-readable: `in progress`

## 5. Security And Trust Posture

- Current auth posture is documented honestly: `in progress`
- Device pairing and token-backed identity work for pilot scenarios: `in progress`
- Sensitive actions are guarded by confirmation and trust rules: `in progress`
- Prototype-only trust gaps are explicitly documented: `not started`
- Release posture for open vs paired vs paired-required modes is defined: `not started`

## 6. Deployment And Operations

- Local install/run path is documented: `in progress`
- LAN deployment path is documented: `in progress`
- Remote-access recommendation path is documented: `in progress`
- Backup and restore workflow is documented: `not started`
- Update/rollback procedure exists: `not started`
- Host hardware requirements are documented: `not started`

## 7. Commercial Packaging

- Product name and concise pitch are stable: `in progress`
- Pilot package contents are defined: `not started`
- Supported client classes are defined: `in progress`
- What is included vs excluded in a pilot deployment is documented: `not started`
- Pricing and engagement model draft exists: `not started`

## 8. Documentation And Sales Readiness

- README is product-facing enough for a serious technical reviewer: `in progress`
- Operator manual covers the actual supported workflows: `in progress`
- Product strategy doc exists and is current: `in progress`
- Build log, change log, and project state stay synchronized: `in progress`
- Demo script or pilot walkthrough exists: `not started`

## 9. Go / No-Go Gate For Paid Pilot

Do not call Gail ready for a paid pilot until these are all true:

- one clean demo narrative works end to end
- operator shell critical pages are real and stable
- export/runtime path is repeatable
- install/run docs work on a fresh machine or fresh clone path
- auth limitations are explicit and acceptable for the pilot context
- smoke validation exists for core routes and shell dependencies

## Immediate Commercialization Work

1. tighten README positioning and active product language
2. finish shell hardening and critical page completion
3. add shell-focused smoke coverage for pilot-critical routes
4. define the exact pilot deployment package and host requirements
5. produce one scripted demo path and one operator onboarding path