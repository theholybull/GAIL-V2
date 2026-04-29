# Gail Remediation Plan (P0/P1/P2)

## P0 (Do immediately, 1-2 days)

1. Enforce build integrity before startup.
- Problem: stale `dist` can break work-lite.
- Fix:
  - In `start-gail-stack.ps1`, default `-BuildFirst` to on, or auto-run build if source is newer than dist.
  - Add a startup health check for required frontend modules before server reports ready.
- Effort: 2-4 hours.
- Risk reduction: High.

2. Remove/guard dead external link (`127.0.0.1:8778`).
- Problem: broken “Open Surface” link.
- Fix:
  - Update `playcanvas-app/src/main.ts` to hide/disable that link unless service reachable.
  - Show explicit “viewer service offline” badge instead of dead link.
- Effort: 1-2 hours.
- Risk reduction: High (operator trust).

3. Add CI gate for type-check + UI smoke.
- Problem: no workflow-level guardrails in active repo.
- Fix:
  - Add `.github/workflows/ci.yml` for:
    - backend/playcanvas/control-panel `npm run check`
    - a minimal Playwright smoke check for `/panel/` and `/client/work-lite/`.
- Effort: 3-6 hours.
- Risk reduction: High.

## P1 (Next sprint, 3-5 days)

1. Fix mobile/tablet framing and off-canvas behavior in Operator Studio shell.
- Files:
  - `web-control-panel/src/styles/operator-studio-shell.css`
  - `web-control-panel/src/operator-studio-shell.js`
  - `web-control-panel/operator-studio-shell.html`
- Fixes:
  - Ensure hidden drawer controls are not focus/click targets when closed.
  - Improve drawer close behavior/backdrop hit reliability.
  - Reduce below-fold critical actions on mobile.
- Effort: 1-2 days.
- Impact: High UX clarity.

2. Reflow work-lite action controls for small screens.
- Files:
  - `playcanvas-app/src/main.ts`
  - `playcanvas-app/src/styles/work-lite.css`
- Fixes:
  - Wrap/stack action buttons at narrow widths.
  - Keep primary actions always visible in viewport.
- Effort: 1 day.
- Impact: High usability.

3. Reduce operator panel cognitive overload.
- File: `web-control-panel/src/main.ts`
- Fixes:
  - Collapse advanced sections by default.
  - Introduce “Basic / Advanced” mode.
  - Remove duplicate action placements.
- Effort: 1-2 days.
- Impact: High operator efficiency.

## P2 (Stabilization/refactor, 1-2 weeks)

1. Break up monolith UI files.
- Files:
  - `playcanvas-app/src/main.ts`
  - `web-control-panel/src/main.ts`
  - `web-control-panel/src/operator-studio-shell.js`
- Plan:
  - Split into modules by concern: layout, state, api-client, actions, voice, workflow, auth.
- Effort: 4-7 days.
- Impact: High maintainability.

2. Split backend route monolith.
- File: `backend/api/domain-http-routes.ts`
- Plan:
  - Route modules by domain (`auth`, `voice`, `workflow`, `devices`, `client-assets`).
- Effort: 2-4 days.
- Impact: Medium-high maintainability.

3. Repo hygiene cleanup.
- Targets:
  - Duplicate addon staging trees under `tools/_addon_stage*`
  - Oversized report retention policy in `docs/reports`
- Effort: 1-2 days.
- Impact: Medium, but improves velocity.

## Recommended execution order

1. P0.1 build integrity
2. P0.2 dead-link guard
3. P0.3 CI gate
4. P1.1 operator shell mobile fixes
5. P1.2 work-lite mobile reflow
6. P1.3 panel simplification
7. P2 refactors/hygiene

## Staging and 3D Environment Prep (Added 2026-04-04)

A dedicated plan with pass/fail criteria has been added:
- `GAIL_STAGING_CALIBRATION_AND_3D_PREP.md`

This staging track should be treated as part of P1/P2 readiness because incorrect transform/framing will block production-quality environment integration.

Recommended insertion into execution order:
1. P0.1 build integrity
2. P0.2 dead-link guard
3. P0.3 CI gate
4. P1.0 staging calibrator contract + profile persistence
5. P1.1 operator shell mobile fixes
6. P1.2 work-lite mobile reflow
7. P1.3 panel simplification
8. P2 staging normalization + interaction contract implementation
9. P2 refactors/hygiene

## AI Autonomy and Voice Standardization (Added 2026-04-04)

A dedicated plan with pass/fail criteria has been added:
- `GAIL_AI_AUTONOMY_AND_VOICE_PLAN.md`

This track is a release-critical dependency for unattended operation and production voice consistency.

Execution order addition:
1. P0.1 build integrity
2. P0.2 dead-link guard
3. P0.3 CI gate
4. P1.0 staging calibrator contract + profile persistence
5. P1.1 operator shell mobile fixes
6. P1.2 work-lite mobile reflow
7. P1.3 panel simplification
8. P2 staging normalization + interaction contract implementation
9. P2.1 AI routing/personality/voice config lock
10. P2.2 model upgrade + replay validation
11. P2.3 UK voice unification + failover drills
12. P2 refactors/hygiene

## Private Persona + Wardrobe + Material Finish Track (Added 2026-04-04)

A dedicated plan with pass/fail criteria has been added:
- `GAIL_PRIVATE_PERSONA_AND_WARDROBE_PIPELINE_PLAN.md`

This track is required before shipping private persona behavior and appearance controls.

Execution order addition:
1. P0.1 build integrity
2. P0.2 dead-link guard
3. P0.3 CI gate
4. P1.0 staging calibrator contract + profile persistence
5. P1.1 operator shell mobile fixes
6. P1.2 work-lite mobile reflow
7. P1.3 panel simplification
8. P2 staging normalization + interaction contract implementation
9. P2.1 AI routing/personality/voice config lock
10. P2.2 model upgrade + replay validation
11. P2.3 UK voice unification + failover drills
12. P2.4 private persona mode + wardrobe inheritance + shell manager
13. P2.5 DAZ export restoration + blender pipeline hooks + anti-shine pass
14. P2 refactors/hygiene

## UI Overhaul Track (Added 2026-04-04)

A dedicated Blender-style UI overhaul plan has been added:
- `GAIL_UI_OVERHAUL_PLAN.md`

Execution order addition:
1. P0.1 build integrity
2. P0.2 dead-link guard
3. P0.3 CI gate
4. P1.0 staging calibrator contract + profile persistence
5. P1.1 operator shell mobile fixes
6. P1.2 work-lite mobile reflow
7. P1.3 panel simplification
8. P1.4 blender-style shell framework (workspace tabs + dock layout)
9. P1.5 viewport workspace (framing/staging/material quick tools)
10. P1.6 AI workflow workspace (plan/run/log in one surface)
11. P1.7 scene build workspace (drag-drop assets + slot mapping)
12. P2 staging normalization + interaction contract implementation
13. P2.1 AI routing/personality/voice config lock
14. P2.2 model upgrade + replay validation
15. P2.3 UK voice unification + failover drills
16. P2.4 private persona mode + wardrobe inheritance + shell manager
17. P2.5 DAZ export restoration + blender pipeline hooks + anti-shine pass
18. P2 refactors/hygiene

## Documentation Coverage Remediation (Added 2026-04-06)

Build-plan documentation must explicitly acknowledge the current shell route model and the implemented API surface so audits stop classifying shipped modules as undocumented.

Shell documentation rule:

- Use shell deep links in build-plan docs for operator workspaces, not API endpoints or dead placeholder labels.
- Preferred shell route form is `/panel/module/<module-id>`.
- Legacy labels `/build/control-tower`, `/governance/control`, `/backlog/features`, and `/reports/bugs` should only be referenced as compatibility aliases, not as the primary documented shell route.

API routes already implemented in repo and requiring explicit build-plan coverage when they are in scope:

- `/access/status`
- `/animations/catalog`
- `/approvals/:id`
- `/auth/pairing-sessions`
- `/auth/pairing-sessions/:id/complete`
- `/cart`
- `/cart/:id`
- `/cart/:id/approve-commit`
- `/cart/:id/approve-request`
- `/commands/execute`
- `/commands/mappings`
- `/control/intents`
- `/conversation/sessions`
- `/conversation/sessions/:id`
- `/conversation/sessions/:id/messages`
- `/conversation/sessions/:id/messages/stream`
- `/devices/:id/access-window`
- `/devices/:id/trust`
- `/governance/changes`
- `/governance/changes/:id`
- `/governance/changes/:id/decision`
- `/governance/history`
- `/governance/rollback/last-approved`
- `/imports/documents`
- `/lists`
- `/lists/:id`
- `/lists/:id/items`
- `/lists/:id/items/:itemId`
- `/memory/entries`
- `/memory/entries/:id`
- `/notes`
- `/notes/:id`
- `/parts`
- `/parts/:id`
- `/private/session`
- `/private/session/notes`
- `/private/session/wipe`
- `/projects/:id`
- `/reminders/:id`
- `/tasks/:id`
- `/viewer/health`
- `/voice/engines`
- `/voice/speak`
- `/voice/warmup`
- `/workflows/:id`
- `/workflows/:id/plan`
- `/workflows/:id/steps/:stepId`
- `/workflows/:id/steps/:stepId/run`
