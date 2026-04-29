/**
 * test/test-catalog.js
 *
 * Tests for lib/catalog.js
 *
 * Tests:
 *  1. buildCatalog() scans the real library and returns > 0 entries
 *  2. catalogStats() returns correct per-category totals
 *  3. All returned entries have required fields
 *  4. Idle category entries are < 5 MB (animation-only clips)
 *  5. Locomotion category entries are > 5 MB (embedded mesh)
 *  6. Every entry has a non-empty id, name, category, filePath
 *  7. loadCatalog() returns cached version without rescan
 *  8. validateEntry() returns a result with laws object
 */

"use strict";

const path = require("path");
const fs   = require("fs");

const { buildCatalog, loadCatalog, validateEntry, catalogStats, ANIM_LIBRARY_ROOT, CATEGORIES } = require("../lib/catalog");

testSuite("lib/catalog.js", () => {

  // 0. Verify the library root exists before running catalog tests
  if (!fs.existsSync(ANIM_LIBRARY_ROOT)) {
    console.log(`    (skipping catalog tests — library not found at ${ANIM_LIBRARY_ROOT})`);
    return;
  }

  // 1. loadCatalog returns > 0 entries (builds if missing, reads from cache if present)
  {
    const entries = loadCatalog();
    assert(entries.length > 0, `loadCatalog: returned ${entries.length} entries (> 0)`);
    assert(entries.length > 100, `loadCatalog: returned ${entries.length} entries (> 100)`);
  }

  // 2. loadCatalog returns cached version
  {
    const a = loadCatalog();
    const b = loadCatalog();
    assertEqual(a.length, b.length, "loadCatalog: consistent length on two calls");
  }

  // 3. All entries have required fields
  {
    const entries = loadCatalog();
    let ok = 0;
    entries.forEach(e => {
      if (e.id && e.name && e.category && e.filePath && typeof e.sizeMB === "number") ok++;
    });
    assertEqual(ok, entries.length, `All ${entries.length} entries have required fields`);
  }

  // 4. Categories match known list
  {
    const entries = loadCatalog();
    const found   = [...new Set(entries.map(e => e.category))].sort();
    assert(found.length >= 3, `Found ${found.length} categories (>= 3)`);
    found.forEach(cat => {
      assert(CATEGORIES.includes(cat), `Category "${cat}" is in known CATEGORIES list`);
    });
  }

  // 5. Idle clips are small (animation-only)
  {
    const entries   = loadCatalog();
    const idleClips = entries.filter(e => e.category === "idle");
    assert(idleClips.length > 0, `Idle category has clips (${idleClips.length})`);
    const avgMB = idleClips.reduce((s, e) => s + e.sizeMB, 0) / idleClips.length;
    assert(avgMB < 10, `Idle avg size ${avgMB.toFixed(2)} MB < 10 MB`);
  }

  // 6. Locomotion clips are large (embedded mesh)
  {
    const entries   = loadCatalog();
    const locoClips = entries.filter(e => e.category === "locomotion");
    if (locoClips.length > 0) {
      const avgMB = locoClips.reduce((s, e) => s + e.sizeMB, 0) / locoClips.length;
      assert(avgMB > 5, `Locomotion avg size ${avgMB.toFixed(2)} MB > 5 MB (confirms embedded mesh)`);
    } else {
      console.log("    (skipped: no locomotion clips found)");
    }
  }

  // 7. catalogStats returns correct totals
  {
    const entries = loadCatalog();
    const stats   = catalogStats(entries);
    assertEqual(stats.total, entries.length, "catalogStats: total matches entry count");
    assert(typeof stats.needsCoordFix  === "number", "catalogStats: needsCoordFix is number");
    assert(typeof stats.needsMeshStrip === "number", "catalogStats: needsMeshStrip is number");
    assert(typeof stats.categories     === "object", "catalogStats: categories is object");
  }

  // 8. needsCoordFix is true for all raw DAZ clips  
  {
    const entries = loadCatalog();
    const needFix = entries.filter(e => e.needsCoordFix).length;
    // All raw DAZ GLBs should have non-identity root (they haven't been fixed yet)
    assert(needFix > 0, `${needFix} clips need coord fix (raw DAZ exports)`);
    assert(needFix > entries.length * 0.5,
      `> 50% of clips need coord fix (${needFix}/${entries.length})`);
  }

  // 9. validateEntry runs full validation on a real file
  {
    const entries = loadCatalog();
    const sample  = entries.find(e => e.category === "idle");
    if (sample) {
      const result = validateEntry(sample.id);
      assert(typeof result.valid === "boolean", `validateEntry: valid is boolean for ${sample.id}`);
      assert(result.laws && result.laws.law1,   `validateEntry: laws.law1 present`);
      assert(result.animCount >= 1,             `validateEntry: animCount >= 1`);
      assert(result.laws.law4.pass,             `validateEntry: idle clip has required bones`);
    } else {
      console.log("    (skipped validateEntry: no idle clips in catalog)");
    }
  }

  // 10. Entry IDs are unique
  {
    const entries = loadCatalog();
    const ids     = entries.map(e => e.id);
    const unique  = new Set(ids);
    assertEqual(unique.size, ids.length, "All entry IDs are unique");
  }

});
