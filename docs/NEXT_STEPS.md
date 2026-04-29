# Next Steps

Current active execution plan: [EXECUTION_ROADMAP_2026-04-29.md](./EXECUTION_ROADMAP_2026-04-29.md).

Current safety baseline:

- full local lockdown backup: `D:\Gail 2.1\lockdown-backups\working_copy_lockdown_20260429-085311`
- GitHub source/control snapshot: `backup/d-root-lockdown-20260429`
- active root: `D:\Gail 2.1\working_copy`

## Working Rule

For every phase and every new feature:

1. implement or change the feature
2. add or update coverage in [run-backend-tests.ps1](../tools/run-backend-tests.ps1) when the feature affects a runnable backend flow
3. run the test script
4. store the generated report in [reports](./reports)
5. note the change and report run in [BUILD_LOG.md](./BUILD_LOG.md)

## Immediate Next Build Targets

1. Expand backend coverage for:
   - `paired_required_for_sensitive` route enforcement with token-backed happy-path coverage
   - provider/session edge behavior after fallback
   - richer provider health and latency/status surfaces
   - cross-device permission-matrix edge cases
   - camera/presence trigger edge cases
   - shared-memory capture and retrieval rules
2. Add the first credential-management operations:
   - token revocation
   - token re-issue
   - paired-device inspection in the operator panel
3. Add Tailscale-aware operational checks only after the helper-script path is stable:
   - host status verification
   - tailnet address detection in docs and scripts
   - remote smoke-test checklist
4. Add websocket or live session groundwork only after the HTTP flow remains covered by the report suite.
5. Begin preparing the next interactive layer:
   - richer operator panel coverage for conversation history inspection, memory search filters, and provider diagnostics
   - real avatar rendering and animation hookup in the PlayCanvas work-lite client once the exported base avatar and idle assets are ready
6. When the ChatGPT export arrives, follow the staged import plan in [CHATGPT_IMPORT_PLAN.md](./CHATGPT_IMPORT_PLAN.md):
   - stage the export first
   - classify into `memory`, `project`, `project_note`, or `ignore`
   - review and de-duplicate
   - only then promote into live memory and project stores
7. When the animation/avatar drive is inserted again, continue from the integrated handoff bundle now living at `playcanvas-app/assets/handoffs/playcanvas_handoff_20260330` instead of redoing first-pass runtime wiring.
8. Add a Visual Studio utility/launcher project to the workspace solution so common operations can be run with one click after restart:
   - start Gail stack
   - start animation viewer
   - run AnimoXtend setup check
   - run AnimoXtend rig setup
   - run base animation pipeline batch
9. Push the repo from prototype posture to marketable pilot posture:
   - define the release-grade page set for Operator Studio shell
   - add shell smoke coverage for pilot-critical flows
   - document host requirements, install path, backup path, and rollback path
   - produce one clean demo script and one first-operator onboarding flow
   - use `PRODUCT_STRATEGY.md` and `COMMERCIAL_READINESS_CHECKLIST.md` as the gate instead of informal judgment
10. Integrate the dedicated phone runtime page into the shell entry map:
   - mount `/client/phone/` as the mobile-first presentation surface
   - keep the phone shell tile scoped to avatar + lower-third translucent chat only
   - preserve fallback-avatar startup behavior with animations `27775` (idle), `27299` (listen), and `28154` (talk)

## Deferred Until Animation Drive Is Connected

When the external animation/avatar drive is inserted, resume the runtime-contract consolidation work:

1. Formalize a first-class rig profile manifest.
   - legacy/current fallback rig
   - next-gen rig
   - armature identity
   - runtime morph mapping
   - supported action families

2. Formalize a first-class runtime action manifest.
   - named actions instead of filename-driven clip wiring
   - anchors
   - loops
   - transitions
   - one-shots
   - ambient/off-screen/recovery tags

3. Formalize a first-class avatar bundle manifest.
   - base avatar
   - hair
   - clothing
   - accessories
   - texture tiers for `low` / `medium` / `high`

4. Map the new rig to the same action contract used by the current fallback system.

5. Bring kiosk/presence behaviors into the runtime through named actions rather than clip-specific code paths.
