# Gail Animation Importer & Avatar Import Tool

A rock-solid, self-contained tool for browsing, validating, strip-fixing, and
importing the 1892 converted animation clips into the Gail PlayCanvas runtime.

**Port:** 8888  
**Zero external dependencies** — pure Node.js and Three.js (loaded from CDN)

---

## Quick Start

```powershell
# From the anim_avatar_importer/ directory:
node server.js
# Open browser to: http://localhost:8888/
```

Or use the launcher:
```powershell
.\start.ps1
```

---

## Architecture

```
anim_avatar_importer/
├── server.js              HTTP server — port 8888, all API routes
├── index.html             Animation Browser + 3-D Preview + Importer UI
├── avatar-import.html     Avatar part registration and import log
├── lib/
│   ├── glb.js             GLB binary parse/write/compact helpers
│   ├── validate.js        5-law animation validator
│   ├── strip-fix.js       Coordinate space bake + mesh strip
│   ├── catalog.js         Animation library scanner and catalog cache
│   └── importer.js        Strip-fix + validate + promote to target
├── test/
│   ├── run-tests.js       Test runner (all suites or single file)
│   ├── test-glb.js        GLB parse/write/compact tests
│   ├── test-validate.js   Validation law tests
│   ├── test-strip-fix.js  Coordinate fix + mesh strip tests
│   └── test-catalog.js    Library scan tests
├── data/
│   ├── catalog.json       Generated — rebuilt by /api/catalog/rebuild
│   └── import-log.json    Log of all imports performed
├── package.json
├── README.md
├── start.ps1
└── start.sh
```

---

## Animation Library

Source library: `../converted_animations_20260401/`

| Category     | Clips | Typical Size | Status         |
|-------------|-------|-------------|----------------|
| idle        | 22    | ~1.7 MB     | Good (anim-only) |
| gesture     | 103   | ~2.1 MB     | Good           |
| emote       | 84    | ~3.5 MB     | Mixed          |
| combat      | 230   | ~6.2 MB     | Mixed          |
| horror      | varies| varies      | Review needed  |
| interaction | varies| varies      | Review needed  |
| locomotion  | 368   | ~220 MB     | All need strip |
| traversal   | varies| varies      | Review needed  |
| other       | varies| varies      | Review needed  |

**Total: 1892 clips**

---

## Five Animation Laws

Every clip must pass all five laws before import:

| Law | Description |
|-----|-------------|
| **Law 1** | Root node rest-pose must be identity (no rotation, no scale) |
| **Law 2** | Root node animation curves must be identity at every keyframe |
| **Law 3** | Hip bone Y translation must be 0.5–2.0 m (metre/Y-up space) |
| **Law 4** | All 19 required bones must be present by name |
| **Law 5** | At least one animation must exist in the GLB |

Raw DAZ exports fail Law 1 (root has `rotation=[0.707,0,0,0.707]`, `scale=[0.01,0.01,0.01]`).
Running **strip-fix** bakes the root transform into every bone and sets the root to identity.

---

## Strip-Fix Pipeline

DAZ exports use **Z-up, centimeters**. The Gail avatar uses **Y-up, metres**.

The `lib/strip-fix.js` module:
1. Reads `root.rotation` (90° X) and `root.scale` (0.01)
2. Bakes rotation+scale into direct child bone rest poses
3. Bakes scale (only) into grandchild and deeper bone rest poses
4. Bakes rotation+scale into animation curves of direct children
5. Neutralises root animation curves → identity
6. Sets root node transform to identity
7. Removes `meshes`, `skins`, `materials`, `textures`, `images`
8. Compacts the binary buffer (drops orphaned bufferViews)

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/status`                | Server status + catalog stats |
| GET  | `/api/catalog`               | Full catalog (all 1892 entries) |
| GET  | `/api/catalog?category=idle` | Filtered by category |
| GET  | `/api/catalog/category/:cat` | Same, via path |
| POST | `/api/catalog/rebuild`       | Rescan library, update catalog.json |
| POST | `/api/validate`              | `{ id }` → full 5-law result |
| POST | `/api/validate-batch`        | `{ ids[] }` → array of results |
| GET  | `/api/preview-glb?id=...`    | Strip-fix in memory, return GLB buffer |
| GET  | `/api/handoff-glbs`          | List handoff bundle animation files |
| GET  | `/api/handoff-glb/:name`     | Serve a handoff GLB |
| POST | `/api/import-single`         | `{ id }` → strip-fix+validate+copy |
| POST | `/api/import`                | `{ ids[] }` → batch import |
| GET  | `/api/imported`              | Read import-log.json |

---

## CLI Usage

```powershell
# Validate a single GLB file
node test/run-tests.js path\to\animation.glb

# Run full test suite
node test/run-tests.js

# Build catalog only (no server)
npm run build-catalog
```

---

## Import Target

```
working_copy/playcanvas-app/assets/animations/
```

Imported clips are named: `<category>__<original_name>.glb`
(e.g. `idle__Bored_Idle.glb`, `locomotion__Walk_Forward.glb`)

The import log is at `data/import-log.json`.

---

## Integration with Gail Shell

Once the server is running, add it to the Surface Deck by pointing a tile at:
`http://localhost:8888/`

The server runs independently of the main backend (port 4180).  
API routes can optionally be proxied through `http-server.ts` if needed.

---

## Required Bone Names

```
hip  pelvis  abdomenLower  abdomenUpper
chestLower  chestUpper  neckLower  neckUpper  head
lCollar  lShldrBend  rCollar  rShldrBend
lThighBend  lShin  lFoot
rThighBend  rShin  rFoot
```

---

## Troubleshooting

**Catalog not loading:** Click "↺ Rebuild Catalog" in the browser. This scans
all 1892 clips (takes ~5–15 s). Progress is streamed to the browser.

**Preview fails for large clips:** The server strips in memory before sending.
If the source file is corrupt, the preview reports "Strip-fix error".

**Law 3 failure (Hip Y):** The clip hasn't been run through strip-fix. The
importer does this automatically. Handoff bundle clips are already fixed.

**Port 8888 in use:** Stop any other server on that port, then re-run.
