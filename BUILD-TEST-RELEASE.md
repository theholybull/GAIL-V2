# Build, Test, And Release

This document collects the operational commands required to work with the repository.

## Root Environment

Install dependencies from the repository root:

```powershell
npm install
```

The root toolchain covers:

- engine builds
- linting
- unit tests
- generated API docs

## Root Scripts

### Build

```powershell
npm run build
```

Builds engine flavors and type declarations.

Other build variants:

```powershell
npm run build:release
npm run build:debug
npm run build:profiler
npm run build:types
npm run build:umd
npm run build:esm
npm run build:esm:release
npm run build:esm:debug
npm run build:sourcemaps
```

### Watch Modes

```powershell
npm run watch
npm run watch:release
npm run watch:debug
npm run watch:profiler
npm run watch:umd
npm run watch:esm
npm run watch:esm:release
npm run watch:esm:debug
```

### Lint

```powershell
npm run lint
```

### Tests

```powershell
npm test
```

Additional validation:

```powershell
npm run test:coverage
npm run test:types
```

### Documentation

```powershell
npm run docs
```

This generates API docs into `docs/`, which is intentionally ignored by Git.

### Package Validation

```powershell
npm run publint
```

### Serve Build Output

```powershell
npm run serve
```

Serves the generated `build/` directory.

## Examples Application

The examples application has its own install and build lifecycle.

### Install

```powershell
cd examples
npm install
```

### Build

```powershell
npm run build
```

### Development

```powershell
npm run develop
```

### Watch

```powershell
npm run watch
```

### Serve

```powershell
npm run serve
```

### Lint

```powershell
npm run lint
```

### Metadata And Thumbnails

```powershell
npm run build:metadata
npm run build:thumbnails
```

### Clean Examples Output

```powershell
npm run clean
```

## Recommended Validation Sequence Before Pushing

From the root:

```powershell
npm install
npm run build
npm run lint
npm test
```

Then for the examples app:

```powershell
cd examples
npm install
npm run build
```

## Release-Relevant Facts

- package name: `playcanvas`
- root package outputs are emitted into `build/`
- package exports reference files under `build/` and `scripts/`
- examples are built separately into `examples/dist/`

## What Not To Commit

Never commit these after running local commands:

- `build/`
- `docs/`
- `coverage/`
- `examples/dist/`
- `node_modules/`
- test reports, logs, caches, or temporary artifacts
