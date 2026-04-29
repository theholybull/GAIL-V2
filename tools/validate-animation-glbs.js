#!/usr/bin/env node
/**
 * validate-animation-glbs.js
 *
 * Validates that all animation GLBs in the pipeline conform to the
 * Gail Animation Laws — the invariants that MUST hold for animations
 * to work correctly with the avatar and clothing/hair.
 *
 * Laws checked:
 *  1. Root node animation curves must be identity (scale=[1,1,1],
 *     rotation=[0,0,0,1], translation=[0,0,0])
 *  2. Root node rest-pose must be identity (no rotation/scale)
 *  3. Hip translation must be in meters (Y value ~1.0-1.2)
 *  4. Bone names must match the body skeleton
 *  5. Coordinate space must be Y-up / meters
 *
 * Usage:
 *   node tools/validate-animation-glbs.js
 *   node tools/validate-animation-glbs.js path/to/specific.glb
 *
 * Exit code 0 = all pass, 1 = failures found
 */

const fs = require("fs");
const path = require("path");

// ── GLB parse ────────────────────────────────────────────────────

function parseGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("Not a GLB");
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
  const binOff = 20 + jsonLen;
  let bin = null;
  if (binOff < buf.length) {
    const binLen = buf.readUInt32LE(binOff);
    bin = Buffer.from(buf.slice(binOff + 8, binOff + 8 + binLen));
  }
  return { gltf, bin };
}

// ── Accessor helpers ─────────────────────────────────────────────

const COMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function accInfo(gltf, idx) {
  const acc = gltf.accessors[idx];
  const bv = gltf.bufferViews[acc.bufferView];
  const off = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const cc = COMP[acc.type];
  const stride = bv.byteStride || cc * 4;
  return { acc, off, cc, stride, count: acc.count };
}

function readF(bin, info) {
  const out = [];
  for (let i = 0; i < info.count; i++) {
    const row = [];
    for (let j = 0; j < info.cc; j++)
      row.push(bin.readFloatLE(info.off + i * info.stride + j * 4));
    out.push(row);
  }
  return out;
}

// ── Reference body bones (subset — the main chain) ──────────────

const REQUIRED_BONES = [
  "hip", "pelvis", "abdomenLower", "abdomenUpper",
  "chestLower", "chestUpper", "neckLower", "neckUpper", "head",
  "lCollar", "lShldrBend", "rCollar", "rShldrBend",
  "lThighBend", "lShin", "lFoot", "rThighBend", "rShin", "rFoot",
];

// ── Validate one GLB ─────────────────────────────────────────────

function validateGlb(filePath) {
  const errors = [];
  const warnings = [];
  const name = path.basename(filePath);

  let gltf, bin;
  try {
    const raw = fs.readFileSync(filePath);
    ({ gltf, bin } = parseGlb(raw));
  } catch (err) {
    return { name, errors: [`Cannot read: ${err.message}`], warnings };
  }

  if (!bin) {
    return { name, errors: ["No binary chunk in GLB"], warnings };
  }

  // ── Law 1: Root identity rest-pose ──────────────────────────
  const rootIdx = gltf.scenes?.[0]?.nodes?.[0];
  if (rootIdx === undefined) {
    errors.push("No root node in scene");
    return { name, errors, warnings };
  }
  const rootNode = gltf.nodes[rootIdx];

  if (rootNode.rotation) {
    const q = rootNode.rotation;
    const isIdentity = Math.abs(q[0]) < 0.001 && Math.abs(q[1]) < 0.001 &&
                        Math.abs(q[2]) < 0.001 && Math.abs(q[3] - 1) < 0.001;
    if (!isIdentity) {
      errors.push(`Root rest-pose rotation is [${q.map(v => v.toFixed(4))}], expected identity [0,0,0,1]`);
    }
  }
  if (rootNode.scale) {
    const s = rootNode.scale;
    const isUnity = Math.abs(s[0] - 1) < 0.001 && Math.abs(s[1] - 1) < 0.001 && Math.abs(s[2] - 1) < 0.001;
    if (!isUnity) {
      errors.push(`Root rest-pose scale is [${s.map(v => v.toFixed(4))}], expected [1,1,1]`);
    }
  }

  // ── Law 2: Root animation curves must be identity ───────────
  if (gltf.animations) {
    for (const anim of gltf.animations) {
      for (const ch of anim.channels) {
        if (ch.target.node !== rootIdx) continue;
        const prop = ch.target.path;
        const samp = anim.samplers[ch.sampler];
        const info = accInfo(gltf, samp.output);
        if (info.acc.componentType !== 5126) continue;
        const vals = readF(bin, info);

        if (prop === "scale") {
          for (const v of vals) {
            if (Math.abs(v[0] - 1) > 0.001 || Math.abs(v[1] - 1) > 0.001 || Math.abs(v[2] - 1) > 0.001) {
              errors.push(`Root animation SCALE curve has non-identity value [${v.map(x => x.toFixed(4))}] — will shrink/grow body`);
              break;
            }
          }
        }
        if (prop === "rotation") {
          for (const v of vals) {
            if (Math.abs(v[0]) > 0.001 || Math.abs(v[1]) > 0.001 ||
                Math.abs(v[2]) > 0.001 || Math.abs(v[3] - 1) > 0.001) {
              errors.push(`Root animation ROTATION curve has non-identity value [${v.map(x => x.toFixed(4))}]`);
              break;
            }
          }
        }
        if (prop === "translation") {
          for (const v of vals) {
            if (Math.abs(v[0]) > 0.01 || Math.abs(v[1]) > 0.01 || Math.abs(v[2]) > 0.01) {
              errors.push(`Root animation TRANSLATION curve has non-zero value [${v.map(x => x.toFixed(4))}]`);
              break;
            }
          }
        }
      }
    }
  }

  // ── Law 3: Hip translation in meters / Y-up ─────────────────
  // Find hip node
  const nodeNames = gltf.nodes.map(n => n.name);
  const hipIdx = nodeNames.indexOf("hip");
  if (hipIdx < 0) {
    errors.push("No 'hip' bone found in node list");
  } else {
    const hip = gltf.nodes[hipIdx];
    const t = hip.translation || [0, 0, 0];
    // In meters/Y-up, hip Y should be ~1.0-1.2
    if (t[1] < 0.5 || t[1] > 2.0) {
      errors.push(`Hip rest-pose Y=${t[1].toFixed(4)}; expected 0.5-2.0 (meters/Y-up). Got centimeters or Z-up?`);
    }
    // Z should be small (not the "up" axis)
    if (Math.abs(t[2]) > 0.5) {
      warnings.push(`Hip Z=${t[2].toFixed(4)} is large — may be Z-up coordinate space`);
    }
  }

  // ── Law 4: Required bone names present ──────────────────────
  const nameSet = new Set(nodeNames);
  const missing = REQUIRED_BONES.filter(b => !nameSet.has(b));
  if (missing.length > 0) {
    errors.push(`Missing required bones: ${missing.join(", ")}`);
  }

  // ── Law 5: Has at least one animation ───────────────────────
  if (!gltf.animations || gltf.animations.length === 0) {
    errors.push("No animations found in GLB");
  }

  return { name, errors, warnings };
}

// ── Main ─────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  let glbFiles = [];

  if (args.length > 0) {
    // Explicit files
    glbFiles = args.filter(f => f.endsWith(".glb"));
  } else {
    // Default: scan the animations directory
    const animDir = path.join(__dirname, "..", "playcanvas-app", "assets", "animations");
    if (!fs.existsSync(animDir)) {
      console.error(`Animation directory not found: ${animDir}`);
      process.exit(1);
    }
    glbFiles = fs.readdirSync(animDir)
      .filter(f => f.endsWith(".glb"))
      .map(f => path.join(animDir, f));
  }

  if (glbFiles.length === 0) {
    console.error("No GLB files to validate.");
    process.exit(1);
  }

  console.log("=== Gail Animation Law Validator ===\n");

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const filePath of glbFiles) {
    const result = validateGlb(filePath);
    const status = result.errors.length > 0 ? "FAIL" : "PASS";
    const icon = status === "PASS" ? "\u2713" : "\u2717";
    console.log(`${icon} ${result.name}: ${status}`);

    for (const err of result.errors) {
      console.log(`    ERROR: ${err}`);
      totalErrors++;
    }
    for (const warn of result.warnings) {
      console.log(`    WARN:  ${warn}`);
      totalWarnings++;
    }
  }

  console.log(`\n--- Summary: ${glbFiles.length} files, ${totalErrors} errors, ${totalWarnings} warnings ---`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
