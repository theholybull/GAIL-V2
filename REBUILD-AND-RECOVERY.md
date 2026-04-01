# Rebuild And Recovery

This file is the disaster-recovery guide for this repository. If the local SSD dies, the goal is to restore the project from GitHub with no hidden machine-specific knowledge.

## Recovery Goal

A successful recovery means:

1. the repository can be cloned from GitHub
2. dependencies can be installed from lockfiles
3. the engine can be built
4. tests can be run
5. the examples application can be built and served
6. generated outputs can be recreated locally without needing to be stored in Git

## Canonical Remote

- GitHub repository: `https://github.com/theholybull/GAIL-V2`
- Default branch: `main`

## System Requirements

- Git
- Node.js `>= 18.0.0`
- npm compatible with the installed Node version
- Enough disk space for repository checkout, dependency installs, and generated build output

Recommended checks:

```powershell
git --version
node -v
npm -v
```

## Clean Recovery Procedure

### 1. Clone The Repository

```powershell
git clone https://github.com/theholybull/GAIL-V2.git
cd GAIL-V2
```

### 2. Install Root Dependencies

```powershell
npm install
```

The root install is required for:

- engine build tooling
- linting
- unit tests
- typedoc generation

### 3. Build The Engine

```powershell
npm run build
```

Generated output appears under `build/`. That directory is not tracked and must always be considered reproducible output.

### 4. Validate The Engine

```powershell
npm run lint
npm test
```

Optional validation:

```powershell
npm run test:coverage
npm run docs
```

Notes:

- `npm run test:coverage` creates coverage output and should not be committed
- `npm run docs` creates generated API docs in `docs/` and should not be committed

### 5. Install And Build The Examples App

```powershell
cd examples
npm install
npm run build
npm run serve
```

For development mode:

```powershell
npm run develop
```

To make the examples app explicitly use a local engine build:

```powershell
$env:ENGINE_PATH = "..\\build\\playcanvas.mjs"
npm run develop
```

To make the examples app use engine source directly:

```powershell
$env:ENGINE_PATH = "..\\src\\index.js"
npm run develop
```

## Project Layout Required For Recovery

The following paths are recovery-critical and must remain in Git:

- `.github/` - CI, publish, and project workflow metadata
- `src/` - engine source
- `scripts/` - engine runtime/support scripts included by package exports
- `utils/` - build and typedoc helpers
- `test/` - test suite and fixtures
- `examples/` - examples browser source, config, and assets
- `package.json` and `package-lock.json` - root dependency graph
- `examples/package.json` and `examples/package-lock.json` - examples dependency graph
- `tsconfig*.json`, `eslint.config.mjs`, `typedoc.json`, `rollup.config.mjs`, `build.mjs` - build and tooling configuration
- `README*.md`, `LICENSE`, `AGENTS.md` - repo-level documentation and usage context

## Recovery Checklist

Use this checklist after a fresh clone:

- root `npm install` completed without error
- `npm run build` produced `build/`
- `npm test` completed
- `examples/npm install` completed
- `examples/npm run build` produced `examples/dist`
- `examples/npm run serve` starts the browser app

## What Must Not Be Trusted As Permanent

These are ephemeral and must be recreated after recovery:

- `node_modules/`
- `examples/node_modules/`
- `build/`
- `examples/dist/`
- `coverage/`
- `docs/`
- local IDE settings
- temporary logs and caches

## Large Asset Handling

This repository contains large example binaries under `examples/assets/`.

Current LFS-tracked asset:

- `examples/assets/models/pbr-house.glb`

That file is intentionally stored through Git LFS so the repository history does not keep carrying the raw blob directly.

If future assets cross GitHub's recommended 50 MB threshold, add them to Git LFS before or during commit history migration instead of keeping them as normal Git blobs.

## If GitHub Is The Only Surviving Copy

You do not need any local zip backup if the GitHub repository remains intact. The correct order is:

1. clone
2. install
3. build
4. test
5. regenerate outputs

Do not try to recover generated directories from stale local copies unless GitHub or the lockfiles are unavailable.

## If GitHub And Local Machine Are Both At Risk

Maintain more than one recovery path:

1. keep GitHub as the canonical source
2. keep a periodic zipped export outside the primary SSD
3. keep repository access credentials documented outside the machine
4. avoid storing unrecoverable work only in generated folders

## Known Current Defaults

- Branch name: `main`
- Remote name: `origin`
- Root package name: `playcanvas`
- Root package version in this snapshot: `2.18.0-beta.0`
- Root Node requirement: `>=18.0.0`
