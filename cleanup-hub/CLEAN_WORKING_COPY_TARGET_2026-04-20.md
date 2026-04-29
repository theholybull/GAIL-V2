# Clean Working Copy Target 2026-04-20

The clean working copy target is the existing active repo:

- `D:\Gail 2.1\working_copy`

Do not create another sibling repo or another `clean working copy` folder on `D:\`.

That would increase the exact drift this cleanup is trying to remove.

## Definition Of Clean Working Copy

The repo should become:

- the only active Gail code root
- repo-relative for all required tooling
- able to launch core runtime, shell, and importer from repo-local scripts
- explicit about what is source, generated output, runtime state, and archive-only material

## Standalone Target Layout

### Must Live In Repo

- backend
- shared contracts
- Operator Studio shell
- work-lite and phone runtime
- Blender export/tool manifests needed for current runtime
- startup/build/test/export scripts
- cleanup governance docs
- animation importer code
- importer launcher script
- staging profile config and later calibrator support

### May Stay External But Must Be Repo-Relative Or Configurable

- very large converted animation library payload
- large raw source avatar assets that are not practical to commit

Rule:

- if a large asset library remains outside git for size reasons, its location must still be configured from the repo and documented as a first-class dependency

## Target Importer Placement

Preferred target:

- `tools/anim-avatar-importer/`

Why:

- already Node-based and self-contained
- already conceptually part of the shell animation workflow
- fits the existing repo automation/tooling layer

## Target Animation Library Placement

Preferred target if kept repo-local but outside normal source control:

- `data/animation-library/converted_animations_20260401/`

Alternative:

- keep the current sibling library but make the path configurable through:
  - env var
  - repo config
  - launcher script

## Target Runtime / Import Contracts

Importer output should be repo-relative and explicit:

- animations into `playcanvas-app/assets/animations/`
- avatar import outputs into a controlled repo-owned staging root, not random loose folders
- logs into repo `data/`

## Target Staging Contracts

Add first-class repo files for staging:

- `playcanvas-app/config/staging-profiles.json`
- later a repo-local calibration report path under `data/reports/`

The staging system should own:

- manual position/rotation/scale
- floor offset
- yaw offset
- camera compensation
- lock/unlock state by target profile

## Clean Working Copy Rules

- no hardcoded `F:\Gail` in active runbooks
- no hardcoded `D:\Gail` when the active root is `D:\Gail 2.1\working_copy`
- no loose root-level diagnostic files treated as part of product source
- no sidecar-only tool required for normal operation if it can be repo-vendored safely

## First Promotion Moves

1. vendor animation importer code into repo
2. add repo-local importer launcher
3. make importer paths configurable and repo-relative
4. define the staging profile contract
5. clean the runtime asset contract
6. then start hardening and smoke coverage from that single repo root
