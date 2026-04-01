# Repository Map

This document explains what each major path in the repository is for and why it matters.

## Root Files

- `.gitignore` - excludes generated output, local trash, logs, caches, and test artifacts
- `.gitattributes` - git attribute rules
- `.nvmrc` - preferred Node major version indicator
- `package.json` - root package metadata, scripts, dependency declarations, package exports
- `package-lock.json` - exact npm resolution lockfile for reproducible installs
- `build.mjs` - top-level engine build entrypoint
- `rollup.config.mjs` - engine bundling configuration
- `eslint.config.mjs` - lint rules
- `typedoc.json` - API documentation generation config
- `tsconfig.json` and `tsconfig.build.json` - TypeScript and declaration-generation config
- `README*.md` - public-facing repo docs in multiple languages
- `LICENSE` - MIT license
- `AGENTS.md` - contributor / agent working conventions
- `release.sh` - release-related shell helper

## Major Directories

### `.github/`

Repository automation and collaboration metadata.

Contains:

- GitHub Actions workflows
- issue and PR templates
- contribution and code of conduct files
- dependency automation config

This directory is operationally important because it defines CI and publishing behavior.

### `src/`

The engine source code. This is the primary codebase.

High-level layering in the project:

- `core/` - low-level utilities, math, data structures, and foundational helpers
- `platform/` - device, graphics, audio, input, and platform abstractions
- `scene/` - rendering, materials, scene graph, shader libraries, batching, sky, lighting
- `framework/` - application layer, components, assets, higher-level engine systems
- `extras/` - optional helpers
- `deprecated/` - legacy compatibility surfaces
- `index.js` - public export surface for the engine

The architectural dependency direction described in `AGENTS.md` is:

`core -> platform -> scene -> framework`

That hierarchy matters when making changes.

### `scripts/`

Runtime-accessible helper scripts exported by the package via `./scripts/*`.

These are part of the distributed package surface and should not be treated as throwaway tooling.

### `utils/`

Build-time helpers used by Rollup and TypeDoc.

Includes:

- rollup helpers
- custom plugins
- typedoc helpers

These files are required to reproduce builds from source.

### `test/`

Unit tests, fixtures, and test assets.

Important subareas:

- `test/assets/` - test fixtures and tiny binary samples used by tests
- `test/core/`, `test/platform/`, `test/scene/`, `test/framework/` - tests grouped by subsystem
- `fixtures.mjs`, `jsdom.mjs` - test bootstrap helpers

Tests run against source modules directly, not the generated build.

### `examples/`

A separate examples browser application for exploring engine features.

Important parts:

- `examples/package.json` - examples-specific dependencies and scripts
- `examples/src/` - examples browser source
- `examples/iframe/` - iframe-specific helpers and in-browser example runtime support
- `examples/assets/` - models, textures, audio, HDRIs, splats, and other example data
- `examples/scripts/` - metadata and thumbnail generation

This directory is large because it includes many real example assets. It is still rebuild-critical for the examples application.

## Generated Directories

These are intentionally not tracked:

- `build/` - engine build outputs
- `docs/` - generated API docs
- `coverage/` - test coverage reports
- `examples/dist/` - examples browser build output
- `node_modules/` and `examples/node_modules/` - installed dependencies

If these appear after local commands, that is normal. They should be deleted or ignored, not committed.

## Which Files Are Source Of Truth

The source of truth for rebuilding the project is:

1. tracked source files
2. lockfiles
3. config files
4. GitHub workflows

The source of truth is not:

- local build output
- local caches
- local test reports
- IDE metadata

## Suggested Reading Order For A New Maintainer

1. `README.md`
2. `REPOSITORY-DOCUMENTATION.md`
3. `REBUILD-AND-RECOVERY.md`
4. `BUILD-TEST-RELEASE.md`
5. `AGENTS.md`
6. `REPOSITORY-MAP.md`
