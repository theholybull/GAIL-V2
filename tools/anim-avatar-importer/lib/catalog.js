/**
 * lib/catalog.js
 *
 * Scans the converted_animations_20260401/ library and builds a
 * JSON catalog of every clip with validation metadata.
 *
 * The catalog is cached to data/catalog.json and rebuilt on request.
 * Each entry is a CatalogEntry (see typedef below).
 *
 * Scanning 1892 GLBs reads only the header of each file (first 4 KB)
 * to collect structural metadata without loading the full binary chunk.
 * Full validation (reading animation accessor data) runs when requested
 * per clip or via the batch-validate route.
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const { parseGlb }       = require("./glb");
const { validateGlb }    = require("./validate");
const { ANIMATION_LIBRARY_ROOT, CATALOG_PATH, ensureToolDataRoot } = require("./paths");

// ── Paths ─────────────────────────────────────────────────────────

const ANIM_LIBRARY_ROOT = ANIMATION_LIBRARY_ROOT;

const CATEGORIES = [
  "idle", "locomotion", "gesture", "emote",
  "combat", "horror", "interaction", "traversal", "other",
];

// ── Typedef ───────────────────────────────────────────────────────

/**
 * @typedef {Object} CatalogEntry
 * @property {string}   id          - "<category>/<basename_no_ext>"
 * @property {string}   name        - filename without extension
 * @property {string}   category    - folder / animation category
 * @property {string}   filePath    - absolute path
 * @property {number}   sizeMB      - file size in MB
 * @property {number}   meshCount   - number of mesh entries in GLTF
 * @property {number}   skinCount   - number of skin entries
 * @property {number}   nodeCount   - number of nodes
 * @property {number}   animCount   - number of animation entries
 * @property {number}   channelCount- total animation channels
 * @property {boolean}  needsCoordFix
 * @property {boolean}  needsMeshStrip
 * @property {boolean|null} valid   - null = not yet validated (metadata only)
 * @property {string[]} errors      - from last validation, or []
 * @property {string[]} warnings    - from last validation, or []
 */

// ── Scan ──────────────────────────────────────────────────────────

/**
 * Build a fast structural snapshot of a GLB by reading only enough
 * of the JSON chunk to extract node/mesh/anim counts.
 * Returns null on any error (file is skipped silently).
 * @param {string} filePath
 * @param {string} category
 * @returns {CatalogEntry|null}
 */
function scanGlb(filePath, category) {
  let stat;
  try { stat = fs.statSync(filePath); }
  catch (e) { return null; }

  const sizeMB = parseFloat((stat.size / 1048576).toFixed(2));
  const name   = path.basename(filePath, ".glb");
  const id     = `${category}/${name}`;

  let gltf;
  try {
    // Read just enough to parse the JSON chunk (max first 512 KB covers all GLTF headers)
    const head = Buffer.allocUnsafe(Math.min(stat.size, 512 * 1024));
    const fd   = fs.openSync(filePath, "r");
    fs.readSync(fd, head, 0, head.length, 0);
    fs.closeSync(fd);
    const jsonLen = head.readUInt32LE(12);
    const jsonEnd = 20 + jsonLen;
    let jsonBuf;
    if (jsonEnd <= head.length) {
      jsonBuf = head.slice(20, jsonEnd);
    } else {
      // JSON chunk larger than 512 KB — fall back to full read
      const full = fs.readFileSync(filePath);
      jsonBuf = full.slice(20, 20 + full.readUInt32LE(12));
    }
    gltf = JSON.parse(jsonBuf.toString("utf8"));
  } catch (e) {
    return null;
  }

  const meshCount    = (gltf.meshes    || []).length;
  const skinCount    = (gltf.skins     || []).length;
  const nodeCount    = (gltf.nodes     || []).length;
  const animCount    = (gltf.animations || []).length;
  const channelCount = (gltf.animations || []).reduce(
    (s, a) => s + (a.channels || []).length, 0);

  // Root identity check (no binary read needed — just look at JSON)
  let needsCoordFix  = false;
  const rootIdx      = gltf.scenes?.[0]?.nodes?.[0];
  if (rootIdx !== undefined) {
    const rootNode = gltf.nodes[rootIdx];
    const rot      = rootNode.rotation;
    const sca      = rootNode.scale;
    if (rot && (Math.abs(rot[0]) > 0.001 || Math.abs(rot[1]) > 0.001 ||
                Math.abs(rot[2]) > 0.001 || Math.abs(rot[3] - 1) > 0.001)) {
      needsCoordFix = true;
    }
    if (sca && (Math.abs(sca[0] - 1) > 0.001 || Math.abs(sca[1] - 1) > 0.001 ||
                Math.abs(sca[2] - 1) > 0.001)) {
      needsCoordFix = true;
    }
  }

  const needsMeshStrip = meshCount > 0;

  return {
    id, name, category, filePath, sizeMB,
    meshCount, skinCount, nodeCount, animCount, channelCount,
    needsCoordFix, needsMeshStrip,
    valid:    null,
    errors:   [],
    warnings: [],
  };
}

// ── Full rebuild ──────────────────────────────────────────────────

/**
 * Scan all 1892 clips and write the catalog to disk.
 * Calls onProgress({ done, total, current }) after each file if provided.
 * @param {{ onProgress?: Function, libraryRoot?: string }} [opts]
 * @returns {CatalogEntry[]}
 */
function buildCatalog(opts) {
  const options = opts || {};
  const root    = options.libraryRoot || ANIM_LIBRARY_ROOT;

  if (!fs.existsSync(root)) {
    throw new Error(`Animation library not found: ${root}`);
  }

  const entries = [];

  for (const cat of CATEGORIES) {
    const catDir = path.join(root, cat);
    if (!fs.existsSync(catDir)) continue;

    let files;
    try { files = fs.readdirSync(catDir).filter(f => f.endsWith(".glb")).sort(); }
    catch (e) { continue; }

    for (const f of files) {
      const entry = scanGlb(path.join(catDir, f), cat);
      if (entry) entries.push(entry);
      if (options.onProgress) {
        options.onProgress({ done: entries.length, total: null, current: entry ? entry.id : f });
      }
    }
  }

  // Persist catalog
  ensureToolDataRoot();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(entries, null, 2));

  return entries;
}

// ── Load from disk ────────────────────────────────────────────────

/**
 * Load catalog from disk (build it first if missing).
 * @returns {CatalogEntry[]}
 */
function loadCatalog() {
  if (fs.existsSync(CATALOG_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
      if (Array.isArray(parsed) && parsed.length > 0) {
        const currentRoot = ANIM_LIBRARY_ROOT.replaceAll("\\", "/").toLowerCase();
        const firstPath = typeof parsed[0].filePath === "string"
          ? parsed[0].filePath.replaceAll("\\", "/").toLowerCase()
          : "";
        if (firstPath.startsWith(currentRoot + "/")) {
          return parsed;
        }
      }
    } catch (e) {
      // corrupted — rebuild
    }
  }
  return buildCatalog();
}

// ── Validate one entry (full binary scan) ─────────────────────────

/**
 * Run a full 5-law validation on a single catalog entry and update it.
 * The updated entry is also saved back to the catalog file.
 * @param {string} entryId    - "<category>/<name>"
 * @returns {CatalogEntry}
 */
function validateEntry(entryId) {
  const catalog = loadCatalog();
  const idx     = catalog.findIndex(e => e.id === entryId);
  if (idx < 0) throw new Error(`Catalog entry not found: ${entryId}`);

  const entry  = catalog[idx];
  const result = validateGlb(entry.filePath);

  entry.valid        = result.valid;
  entry.errors       = result.errors;
  entry.warnings     = result.warnings;
  entry.needsCoordFix  = result.needsCoordFix;
  entry.needsMeshStrip = result.needsMeshStrip;

  ensureToolDataRoot();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));

  return { ...entry, laws: result.laws };
}

// ── Summary stats ─────────────────────────────────────────────────

/**
 * Return per-category and overall summary statistics.
 * @param {CatalogEntry[]} catalog
 * @returns {object}
 */
function catalogStats(catalog) {
  const perCat = {};
  for (const cat of CATEGORIES) {
    const clips = catalog.filter(e => e.category === cat);
    perCat[cat] = {
      total:          clips.length,
      needsCoordFix:  clips.filter(e => e.needsCoordFix).length,
      needsMeshStrip: clips.filter(e => e.needsMeshStrip).length,
      validated:      clips.filter(e => e.valid !== null).length,
      passing:        clips.filter(e => e.valid === true).length,
      totalSizeMB:    parseFloat(clips.reduce((s, e) => s + (e.sizeMB || 0), 0).toFixed(1)),
    };
  }
  return {
    total:          catalog.length,
    needsCoordFix:  catalog.filter(e => e.needsCoordFix).length,
    needsMeshStrip: catalog.filter(e => e.needsMeshStrip).length,
    validated:      catalog.filter(e => e.valid !== null).length,
    passing:        catalog.filter(e => e.valid === true).length,
    totalSizeMB:    parseFloat(catalog.reduce((s, e) => s + (e.sizeMB || 0), 0).toFixed(1)),
    categories:     perCat,
  };
}

// ── Internal ─────────────────────────────────────────────────────

module.exports = {
  buildCatalog,
  loadCatalog,
  validateEntry,
  catalogStats,
  ANIM_LIBRARY_ROOT,
  CATALOG_PATH,
  CATEGORIES,
};
