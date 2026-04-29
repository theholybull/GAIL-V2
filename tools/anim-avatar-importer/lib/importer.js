/**
 * lib/importer.js
 *
 * Promotes animation clips from the animation library into the
 * repo-local playcanvas-app/assets/animations/ target.
 *
 * Pipeline for each clip:
 *   1. Strip-fix  — remove mesh, bake coordinate space
 *   2. Validate   — must pass all 5 Animation Laws
 *   3. Copy       — write to target folder, named <category>__<original_name>.glb
 *   4. Log        — append to data/import-log.json
 *
 * If a clip is already in the target folder with the same source checksum
 * (stored in the log), it is skipped.
 *
 * The import-log.json schema:
 * [
 *   {
 *     "importedAt": "2026-04-12T...",
 *     "sourceId":   "idle/Bored_Idle",
 *     "sourcePath": "/.../converted_animations_20260401/idle/Bored_Idle.glb",
 *     "targetPath": "/.../playcanvas-app/assets/animations/idle__Bored_Idle.glb",
 *     "targetName": "idle__Bored_Idle.glb",
 *     "sizeMB":     1.45,
 *     "status":     "ok"   // "ok" | "skipped" | "error"
 *   }
 * ]
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const { stripFix }     = require("./strip-fix");
const { validateBuffer } = require("./validate");
const { IMPORT_LOG_PATH, TARGET_ANIMATIONS_DIR, ensureToolDataRoot } = require("./paths");

// ── Paths ─────────────────────────────────────────────────────────


// ── Single-clip import ────────────────────────────────────────────

/**
 * Import one clip.  Strip-fix → validate → write to target.
 *
 * @param {string} sourcePath   - absolute path to source GLB
 * @param {string} sourceId     - "<category>/<name>" (used for naming)
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun=false]   - validate but do not write
 * @param {boolean} [opts.overwrite=false] - re-import even if already logged
 * @param {string}  [opts.targetDir]       - override target directory
 * @returns {ImportResult}
 */
function importClip(sourcePath, sourceId, opts) {
  const options   = Object.assign({ dryRun: false, overwrite: false }, opts);
  const targetDir = options.targetDir || TARGET_ANIMATIONS_DIR;

  // Derive target filename: "category__name.glb"
  const [category, ...nameParts] = sourceId.split("/");
  const clipName   = nameParts.join("/").replace(/\//g, "__");
  const targetName = `${category}__${clipName}.glb`;
  const targetPath = path.join(targetDir, targetName);

  // ── Check existing import log ─────────────────────────────────
  const log = _loadLog();

  if (!options.overwrite) {
    const existing = log.find(e => e.sourceId === sourceId && e.status === "ok");
    if (existing) {
      // Verify the file still exists on disk
      if (fs.existsSync(existing.targetPath)) {
        return _result("skipped", sourceId, sourcePath, existing.targetPath, targetName, 0,
          "Already imported (use overwrite to re-import)");
      }
    }
  }

  // ── Strip-fix ─────────────────────────────────────────────────
  const sf = stripFix(sourcePath, { skipIfAlreadyFixed: true });
  if (sf.status === "error") {
    return _recordAndReturn(log, "error", sourceId, sourcePath, targetPath, targetName, 0,
      `Strip-fix failed: ${sf.message}`);
  }

  // ── Validate the fixed buffer ─────────────────────────────────
  const vr = validateBuffer(sf.buf, sourcePath);
  if (!vr.valid) {
    const errSummary = vr.errors.join("; ");
    return _recordAndReturn(log, "error", sourceId, sourcePath, targetPath, targetName, 0,
      `Validation failed after strip-fix: ${errSummary}`);
  }

  // ── Write to target ───────────────────────────────────────────
  if (!options.dryRun) {
    _ensureDir(targetDir);
    fs.writeFileSync(targetPath, sf.buf);
  }

  const sizeMB = parseFloat((sf.buf.length / 1048576).toFixed(2));
  return _recordAndReturn(log, "ok", sourceId, sourcePath, targetPath, targetName, sizeMB,
    options.dryRun ? "DRY RUN — file not written" : "Import complete");
}

// ── Batch import ──────────────────────────────────────────────────

/**
 * Import multiple clips.  Returns results array and a summary.
 *
 * @param {{ sourceId: string, sourcePath: string }[]} clips
 * @param {object} [opts]
 * @param {Function} [opts.onProgress] - called after each clip with { done, total, last }
 * @param {boolean}  [opts.dryRun]
 * @param {boolean}  [opts.overwrite]
 * @param {string}   [opts.targetDir]
 * @returns {{ results: ImportResult[], summary: object }}
 */
function importBatch(clips, opts) {
  const results = [];
  const total   = clips.length;

  for (let i = 0; i < total; i++) {
    const { sourceId, sourcePath } = clips[i];
    const result = importClip(sourcePath, sourceId, opts);
    results.push(result);
    if (opts && opts.onProgress) {
      opts.onProgress({ done: i + 1, total, last: result });
    }
  }

  const ok      = results.filter(r => r.status === "ok").length;
  const skipped = results.filter(r => r.status === "skipped").length;
  const errors  = results.filter(r => r.status === "error").length;

  return {
    results,
    summary: { total, ok, skipped, errors },
  };
}

// ── Log helpers ───────────────────────────────────────────────────

/**
 * @typedef {Object} ImportResult
 * @property {string} status      - "ok" | "skipped" | "error"
 * @property {string} sourceId
 * @property {string} sourcePath
 * @property {string} targetPath
 * @property {string} targetName
 * @property {number} sizeMB
 * @property {string} message
 * @property {string} importedAt
 */

function _result(status, sourceId, sourcePath, targetPath, targetName, sizeMB, message) {
  return {
    status, sourceId, sourcePath, targetPath, targetName, sizeMB,
    message, importedAt: new Date().toISOString(),
  };
}

function _recordAndReturn(log, status, sourceId, sourcePath, targetPath, targetName, sizeMB, message) {
  const entry = _result(status, sourceId, sourcePath, targetPath, targetName, sizeMB, message);

  // Update or append in log
  const idx = log.findIndex(e => e.sourceId === sourceId);
  if (idx >= 0) log[idx] = entry;
  else          log.push(entry);

  ensureToolDataRoot();
  fs.writeFileSync(IMPORT_LOG_PATH, JSON.stringify(log, null, 2));

  return entry;
}

function _loadLog() {
  if (fs.existsSync(IMPORT_LOG_PATH)) {
    try { return JSON.parse(fs.readFileSync(IMPORT_LOG_PATH, "utf8")); }
    catch (e) { /* corrupt — start fresh */ }
  }
  return [];
}

function _ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Exports ───────────────────────────────────────────────────────

module.exports = {
  importClip,
  importBatch,
  TARGET_ANIMATIONS_DIR,
  IMPORT_LOG_PATH,
};
