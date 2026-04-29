# Cleanup Hub

This folder is the control center for drive cleanup, repo consolidation, and agent governance.

Purpose:

- keep one source of truth for what Gail is and where active work lives
- stop new drift across `D:\`
- give the operator, manager, and builders one shared rulebook
- record cleanup decisions before files are moved, archived, or deleted

Operator rule:

- the human operator is the final authority for drive cleanup, repo moves, deletions, archival, credentials, and release decisions

In-product rule:

- Gail remains the final in-product AI review layer for manager/builder output before the product itself treats work as approved

Read order for future work:

1. `cleanup-hub/PROJECT_MAP.md`
2. `cleanup-hub/DRIVE_CLEANUP_PLAN.md`
3. `cleanup-hub/AGENT_GOVERNANCE.md`
4. `cleanup-hub/DOCUMENTATION_PROTOCOL.md`
5. `cleanup-hub/DECISION_LOG.md`

Current source of truth:

- active repo root: `D:\Gail 2.1\working_copy`

Working rule:

- if a file, folder, script, or repo is not clearly classified in this hub, treat it as decision-pending rather than silently editing, moving, or deleting it

Current baseline docs:

- `cleanup-hub/RUNTIME_UI_AUDIT_2026-04-20.md`
- `cleanup-hub/CURRENT_SYSTEM_ASSESSMENT_2026-04-20.md`
- `cleanup-hub/DEPENDENCY_BRINGUP_REPORT_2026-04-20.md`
- `cleanup-hub/PERSONA_ASSET_INGEST_REPORT_2026-04-20.md`
- `cleanup-hub/SHARED_HAIR_RUNTIME_MAPPING_2026-04-21.md`
- `cleanup-hub/SHARED_HAIR_VERIFICATION_2026-04-21.md`
- `cleanup-hub/WORKLITE_PERSONA_STAGING_AUDIT_2026-04-21.md`
- `cleanup-hub/AVATAR_AXIS_SCALE_FIX_2026-04-21.md`
- `cleanup-hub/CHERRY_RUNTIME_REFRESH_2026-04-21.md`
- `cleanup-hub/GAIL_RUNTIME_REFRESH_2026-04-21.md`
- `cleanup-hub/GAIL_HAIR_RUNTIME_FINDINGS_2026-04-21.md`
- `cleanup-hub/GAIL_TEXTURE_TIER_POLICY_2026-04-21.md`
- `cleanup-hub/GAIL_CURRENT_HAIR_REFRESH_2026-04-22.md`
- `cleanup-hub/GAIL_HAIR_FLOOR_FIX_2026-04-22.md`
- `cleanup-hub/GAIL_NEW_SOURCE_IMPORT_2026-04-23.md`
- `cleanup-hub/GAIL_NEW_HAIR_Y_FIX_2026-04-23.md`
- `cleanup-hub/HAIR_MATERIAL_SOFTCUT_2026-04-23.md`
- `cleanup-hub/AVATAR_RUNTIME_SINGLE_SOURCE_2026-04-23.md`
- `cleanup-hub/CHECKPOINT_SOLID_FALLBACK_2026-04-23.md`
- `cleanup-hub/CLEANUP_PASS_2026-04-23.md`
- `cleanup-hub/TOP_LEVEL_DRIVE_CLEANUP_2026-04-23.md`
- `cleanup-hub/ANIMATION_NATURAL_TIMING_2026-04-23.md`
- `cleanup-hub/FACIAL_MICRO_MOVEMENT_2026-04-23.md`
- `cleanup-hub/BODY_ALIVE_MOTION_2026-04-23.md`
- `cleanup-hub/CHECKPOINT_BODY_ALIVE_FALLBACK_2026-04-23.md`

Current staged asset baseline:

- `cleanup-hub/persona-ingest-20260420-1630`

Current known-good fallback:

- `D:\Gail 2.1\checkpoints\solid-fallback-20260423-1035-body-alive1`

Previous fallback:

- `D:\Gail 2.1\checkpoints\solid-fallback-20260423-0848`

Current cleanup rule:

- active repo folders should contain current source, docs, and the latest useful verification only
- bulky generated import/export artifacts and old test results belong in explicit checkpoints or archives, not in the day-to-day working copy
- old drive-root project/reference folders belong under `D:\Gail 2.1\legacy-hold\...`, not at top-level `D:\`
