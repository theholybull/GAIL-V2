# Gail Execution Roadmap - 2026-04-29

This is the active build queue after the D-root lockdown backup and GitHub snapshot.

## Ground Rules

- `D:\Gail 2.1\working_copy` is the active source of truth.
- `D:\Gail 2.1\lockdown-backups\working_copy_lockdown_20260429-085311` is the full safety copy.
- `backup/d-root-lockdown-20260429` on GitHub is the clean source/control snapshot.
- C is no longer the place to experiment. It only receives promoted, tested working copies.
- Promotion requires the promotion gate, not vibes.

## Operator Commands

Quick status:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\show-gail-status.ps1
```

Start the stack:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\start-gail-stack.ps1 -AuthMode open
```

Stop the stack:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\stop-gail-stack.ps1
```

Run the full promotion gate:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\run-promotion-gate.ps1
```

Run the gate without creating another large backup:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\run-promotion-gate.ps1 -SkipBackup
```

## Phase 1: Shell Unification

Goal: one operator shell that shows status and launches the right tools.

Deliverables:

- Quick status command.
- Promotion gate command.
- Stack manifest expanded from backend-only into backend plus shell/tool surfaces.
- Operator Studio page that shows runtime health, backup status, avatar readiness, build/test evidence, and next action.

Exit criteria:

- A new operator can start, stop, inspect, test, and back up Gail from one documented path.
- No script assumes the old `D:\Gail` path.
- The backend route smoke proves assets resolve under `D:\Gail 2.1\working_copy`.

## Phase 2: Runtime Contract

Goal: stop wiring avatar behavior from scattered files and browser state.

Deliverables:

- `data/client/avatar-runtime.json` remains the source of truth for avatar systems and wardrobe presets.
- Add environment anchors for named daily-life points: idle spot, conversation spot, kitchen, sofa, doorway, dance/open floor, mirror/wardrobe.
- Add animation action manifest for named actions: idle, listen, talk, ack, wave, walk, turn, sit, stand, dance, recovery.
- Add wardrobe compatibility manifest for body, hair, clothing, footwear, accessories, and quality tiers.

Exit criteria:

- Work-lite can place Gail from named anchors rather than hand-tuned localStorage.
- Shell can explain why an avatar/wardrobe/action is or is not ready.

## Phase 3: Feature Tracks A-I

A. Kiosk animation library:

- Curate loops and transitions into named categories.
- Add validator coverage for required clips, loop tags, root transforms, and PlayCanvas readiness.
- Add shell controls for kiosk playlists and ambient behavior.

B. Avatar import pipeline:

- One import folder.
- One normalized manifest.
- One validation report.
- One promote button/script after tests pass.

C. Wardrobe:

- Slot manifest for top, bottom, shoes, hair, accessories, and full outfits.
- Compatibility checks against active body and persona.
- Operator preview with known-good rollback.

D. Breast/body jiggle:

- Treat this as runtime body physics/morph control, not one-off code.
- Add a tuning manifest with limits, presets, disable switch, and device quality tiers.
- Gate it behind visual verification and performance checks.

E. Environment placement:

- Environment anchor manifest.
- Saved navigation points.
- Daily-life route graph for where Gail should stand, sit, walk, and idle.

F. Personality and emotion engine:

- Mood state, conversation memory, relationship state, and scene context.
- Emotion outputs map to voice tone, facial expression, animation action, and idle behavior.
- Private personas stay local/private by default.

G. Gamepad control:

- Browser Gamepad API input layer.
- Mapped actions for move, look, emote, focus, follow, and mode switching.
- Shell diagnostic view for connected controllers and button maps.

H. Codex-like agent interface:

- Agent inbox and task board.
- Build/test command launcher.
- Evidence panel for reports and logs.
- Human approval for risky operations.

I. Distribution:

- Installer/portable package strategy.
- Asset archive strategy for files too large for GitHub.
- Rollback and restore scripts.
- First-operator onboarding checklist.

## Immediate Queue

1. Verify the current D-root stack with `show-gail-status.ps1`.
2. Run `run-promotion-gate.ps1 -SkipBackup` to prove the current edited working copy.
3. Expand `tools/gail-stack.json` with shell/tool surface entries.
4. Add the Operator Studio status page that reads the same backend/runtime surfaces.
5. Start the runtime contract work with environment anchors and action manifest.
