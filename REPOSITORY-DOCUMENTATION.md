# Repository Documentation

This repository includes source-controlled documentation intended to survive local machine loss and make a full rebuild possible from GitHub alone.

## Start Here

- [REBUILD-AND-RECOVERY.md](REBUILD-AND-RECOVERY.md) - disaster recovery, first-clone bootstrap, and restore procedure
- [REPOSITORY-MAP.md](REPOSITORY-MAP.md) - directory-by-directory map of the codebase
- [BUILD-TEST-RELEASE.md](BUILD-TEST-RELEASE.md) - build, test, lint, docs, examples, and release workflow
- [ASSET-AND-REPO-HYGIENE.md](ASSET-AND-REPO-HYGIENE.md) - what belongs in Git, what does not, and cleanup rules

## Why These Docs Exist

This project contains a large engine codebase, a separate examples application, generated outputs, and heavy binary assets. The documentation in this repository is focused on:

- rebuilding the project from a bare clone
- reducing dependency on any one SSD or workstation
- explaining where critical code and metadata live
- keeping generated trash and transient test output out of version control

## Important Distinction

- `docs/` is generated output from `npm run docs` and is intentionally ignored by Git
- the files listed above are the permanent, source-controlled operational docs
