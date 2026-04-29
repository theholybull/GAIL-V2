/**
 * test/run-tests.js
 *
 * Test runner for the Gail Animation Importer library.
 * Zero external dependencies — pure Node.js.
 *
 * Usage:
 *   node test/run-tests.js
 *   node test/run-tests.js <path-to-glb>   # validate one specific file
 *
 * Exit code 0 = all pass, 1 = failures.
 */

"use strict";

const path = require("path");

// simple assert
let passed = 0;
let failed = 0;
const SUITES = [];

function suite(name, fn) {
  SUITES.push({ name, fn });
}

// ── Run ───────────────────────────────────────────────────────────

async function main() {
  const singleFile = process.argv[2];

  if (singleFile) {
    runSingleFileValidation(singleFile);
    return;
  }

  // Load all suites
  require("./test-glb");
  require("./test-validate");
  require("./test-strip-fix");
  require("./test-catalog");

  console.log("═════════════════════════════════════════");
  console.log("  Gail Animation Importer — Test Suite");
  console.log("═════════════════════════════════════════\n");

  for (const s of global.__TEST_SUITES || []) {
    console.log(`\n── ${s.name} ──`);
    try {
      await s.fn();
    } catch (e) {
      recordFail(`[${s.name}] Uncaught: ${e.message}`);
    }
  }

  console.log("\n═════════════════════════════════════════");
  console.log(`  ${passed} passed  /  ${failed} failed`);
  console.log("═════════════════════════════════════════");
  process.exit(failed > 0 ? 1 : 0);
}

function runSingleFileValidation(filePath) {
  const abs = path.resolve(filePath);
  console.log(`\nValidating: ${abs}\n`);

  const { validateGlb } = require("../lib/validate");
  const result = validateGlb(abs);

  console.log(`File: ${result.name}`);
  console.log(`Size: ${result.sizeMB} MB`);
  console.log(`Valid: ${result.valid ? "✓ YES" : "✗ NO"}`);
  console.log(`Needs coord fix: ${result.needsCoordFix}`);
  console.log(`Needs mesh strip: ${result.needsMeshStrip}`);
  console.log(`Meshes: ${result.meshCount}, Nodes: ${result.nodeCount}, Anims: ${result.animCount}, Channels: ${result.channelCount}`);
  console.log("\nLaws:");
  const lawNames = {
    law1: "Root rest-pose identity",
    law2: "Root anim curves identity",
    law3: "Hip Y in metres",
    law4: "Required bones present",
    law5: "Has animation",
  };
  for (const [k, lbl] of Object.entries(lawNames)) {
    const l = result.laws[k];
    console.log(`  ${l.pass ? "✓" : "✗"} ${lbl}`);
    if (!l.pass) l.issues.forEach(i => console.log(`      → ${i}`));
  }
  if (result.warnings.length) {
    console.log("\nWarnings:");
    result.warnings.forEach(w => console.log(`  ⚠ ${w}`));
  }
}

// ── Assertion helpers (exported for test files to use) ────────────

global.__TEST_SUITES = [];
global.__recordPass  = (name) => { passed++; console.log(`  ✓ ${name}`); };
global.__recordFail  = (name) => { failed++; console.error(`  ✗ ${name}`); };

function recordFail(msg) { failed++; console.error(`  ✗ ${msg}`); }

global.testSuite = function testSuite(name, fn) {
  global.__TEST_SUITES.push({ name, fn });
};

global.assert = function assert(condition, message) {
  if (condition) {
    global.__recordPass(message || "assert");
  } else {
    global.__recordFail(message || "assert FAILED");
  }
};

global.assertEqual = function assertEqual(a, b, message) {
  const msg = message || `${JSON.stringify(a)} === ${JSON.stringify(b)}`;
  if (JSON.stringify(a) === JSON.stringify(b)) {
    global.__recordPass(msg);
  } else {
    global.__recordFail(`${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`);
  }
};

global.assertThrows = function assertThrows(fn, message) {
  try { fn(); global.__recordFail(message || "expected throw but did not"); }
  catch (e) { global.__recordPass(message || "throws as expected"); }
};

main().catch(e => { console.error(e); process.exit(1); });
