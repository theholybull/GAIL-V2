# Asset And Repo Hygiene

This file defines what should stay in the repository and what should remain local-only.

## Commit What Is Hard To Recreate

Keep these in Git:

- source code
- build and tooling configuration
- lockfiles
- tests and fixtures
- examples source
- examples assets that are required for the examples application to function
- GitHub workflow and project metadata
- permanent operational documentation

## Do Not Commit Rebuildable Output

Never commit:

- `build/`
- `docs/`
- `coverage/`
- `examples/dist/`
- `node_modules/`
- `examples/node_modules/`

These outputs are machine-generated and must be treated as disposable.

## Do Not Commit Local Trash

Examples:

- `.DS_Store`
- `Thumbs.db`
- `Desktop.ini`
- IDE settings under `.idea/` and `.vscode/`
- logs, temp files, cache folders, and test report output

The repository `.gitignore` now covers these categories explicitly.

## Binary Assets

This repository already contains large binary assets under `examples/assets/`.

Rules:

- keep binaries only when they are required to run examples or tests
- do not add duplicate renders, exports, or local scratch assets
- do not check in temporary source files from DCC tools unless they are intentional repository inputs
- review file size before commit

## Large File Policy

Current GitHub behavior:

- files under 100 MB can still be pushed
- files above 50 MB trigger warnings and should be reviewed carefully

Current LFS-tracked file:

- `examples/assets/models/pbr-house.glb`

If the repository starts accumulating more large binaries, move future oversized assets to Git LFS instead of normal Git blobs.

## Test Output Hygiene

`npm test` itself should not create permanent repo data, but coverage and reporting tools can.

Keep these local only:

- `coverage/`
- `.nyc_output/`
- `*.lcov`
- `junit.xml`
- `test-results/`
- `reports/`
- `artifacts/`

## Documentation Hygiene

There are two classes of docs in this repository:

- permanent, handwritten docs committed to Git
- generated docs emitted by TypeDoc into `docs/`

Only the handwritten docs should be edited and committed. Generated docs should be recreated as needed.

## Quick Pre-Push Check

Before pushing:

```powershell
git status --short
```

If you see generated directories, logs, coverage output, local editor files, or temporary assets, clean them before committing.
