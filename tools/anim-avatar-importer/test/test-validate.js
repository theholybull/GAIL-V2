/**
 * test/test-validate.js
 *
 * Unit tests for lib/validate.js
 *
 * Tests use synthetic GLBs built in-memory — no disk files required.
 *
 * Tests:
 *  1. validateBuffer — good animation passes all 5 laws
 *  2. validateBuffer — root non-identity rotation → law1 fail
 *  3. validateBuffer — root non-identity scale → law1 fail
 *  4. validateBuffer — root anim scale curve ≠ [1,1,1] → law2 fail
 *  5. validateBuffer — hip Y out of range → law3 fail
 *  6. validateBuffer — hip in centimeters (Y > 50) → law3 fail with hint
 *  7. validateBuffer — missing required bone → law4 fail
 *  8. validateBuffer — no animations → law5 fail
 *  9. validateBuffer — no binary chunk → error result
 * 10. validateGlb    — reads a real handoff GLB from disk (if available)
 */

"use strict";

const path = require("path");
const { validateBuffer, validateGlb, REQUIRED_BONES } = require("../lib/validate");
const { REPO_ROOT } = require("../lib/paths");

// ── GLB builder helpers ───────────────────────────────────────────

const COMP_SIZES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

/**
 * Build a minimal but valid animation GLB in memory.
 *
 * @param {object} overrides   - properties to override in the config
 * @param {object} [overrides.rootRot]      - [x,y,z,w]  root node rotation
 * @param {object} [overrides.rootScale]    - [x,y,z]    root node scale
 * @param {number} [overrides.hipY]         - hip translation Y
 * @param {boolean}[overrides.includeMesh]  - add a mesh entry
 * @param {boolean}[overrides.noAnims]      - omit animations
 * @param {string[]}[overrides.missingBones] - remove these from node list
 * @param {boolean}[overrides.animOnRoot]   - add a scale anim curve on root
 * @returns {Buffer}
 */
function buildSyntheticGlb(overrides) {
  const o = overrides || {};

  // ── Nodes ──────────────────────────────────────────────────────
  const nodes = [
    // index 0 = root "Victoria 8"
    Object.assign(
      { name: "Victoria 8", children: [1] },
      o.rootRot   ? { rotation:    o.rootRot   } : {},
      o.rootScale ? { scale:       o.rootScale } : {}
    ),
    // index 1 = hip
    { name: "hip", translation: [0, o.hipY !== undefined ? o.hipY : 1.05, 0], children: [2] },
    // index 2 = pelvis
    { name: "pelvis", children: [3] },
    // indices 3.. = required bones
  ];

  // Add all required bones except those in missingBones
  const skip = new Set(o.missingBones || []);
  const remaining = REQUIRED_BONES.filter(b => b !== "hip" && b !== "pelvis" && !skip.has(b));
  remaining.forEach(b => nodes.push({ name: b }));

  // ── Build animation data in binary ────────────────────────────
  // We'll create a simple 2-keyframe rotation animation on node 1 (hip)
  // time: [0.0, 1.0] → accessor 0 (SCALAR×2)
  // hip rotation: [[0,0,0,1],[0,0,0,1]] → accessor 1 (VEC4×2)
  // If animOnRoot: add a scale accessor for root → accessor 2 (VEC3×2) value [2,2,2]

  const timeData  = [0.0, 1.0];    // 2 floats
  const rotData   = [0,0,0,1,  0,0,0,1]; // 8 floats
  const scaleData = [2,2,2,  2,2,2];      // 6 floats (intentionally non-identity for law2 test)

  const binParts = [
    makeBinFloatArray(timeData),
    makeBinFloatArray(rotData),
  ];
  if (o.animOnRoot) binParts.push(makeBinFloatArray(scaleData));

  const bin = Buffer.concat(binParts);

  // BufferViews
  const bufferViews = [];
  let cursor = 0;
  bufferViews.push({ byteOffset: cursor, byteLength: timeData.length * 4 });
  cursor += timeData.length * 4;
  bufferViews.push({ byteOffset: cursor, byteLength: rotData.length * 4 });
  cursor += rotData.length * 4;
  if (o.animOnRoot) {
    bufferViews.push({ byteOffset: cursor, byteLength: scaleData.length * 4 });
    cursor += scaleData.length * 4;
  }

  // Accessors
  const accessors = [
    { bufferView: 0, byteOffset: 0, count: 2, type: "SCALAR", componentType: 5126 }, // times
    { bufferView: 1, byteOffset: 0, count: 2, type: "VEC4",   componentType: 5126 }, // hip rot
  ];
  if (o.animOnRoot) {
    accessors.push(
      { bufferView: 2, byteOffset: 0, count: 2, type: "VEC3", componentType: 5126 }  // root scale
    );
  }

  // Animation
  const gltf = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes,
    buffers: [{ byteLength: bin.length }],
    bufferViews,
    accessors,
  };

  if (o.includeMesh) {
    gltf.meshes = [{ name: "TestMesh", primitives: [] }];
  }

  if (!o.noAnims) {
    const samplers = [
      { input: 0, output: 1, interpolation: "LINEAR" }, // hip rotation
    ];
    const channels = [
      { sampler: 0, target: { node: 1, path: "rotation" } },
    ];
    if (o.animOnRoot) {
      samplers.push({ input: 0, output: 2, interpolation: "LINEAR" });
      channels.push({ sampler: 1, target: { node: 0, path: "scale" } });
    }
    gltf.animations = [{ name: "Test", samplers, channels }];
  }

  return buildGlbBuffer(gltf, bin);
}

function makeBinFloatArray(values) {
  const buf = Buffer.allocUnsafe(values.length * 4);
  values.forEach((v, i) => buf.writeFloatLE(v, i * 4));
  return buf;
}

function buildGlbBuffer(gltf, bin) {
  const jsonStr = JSON.stringify(gltf);
  const jsonPad = (4 - (jsonStr.length % 4)) % 4;
  const jsonBuf = Buffer.from(jsonStr + " ".repeat(jsonPad), "utf8");
  const binPad  = bin ? (4 - (bin.length % 4)) % 4 : 0;
  const binFull = bin ? (binPad > 0 ? Buffer.concat([bin, Buffer.alloc(binPad)]) : bin) : null;
  const total   = 12 + 8 + jsonBuf.length + (binFull ? 8 + binFull.length : 0);
  const out = Buffer.alloc(total);
  let off = 0;
  out.writeUInt32LE(0x46546C67, off); off += 4;
  out.writeUInt32LE(2,          off); off += 4;
  out.writeUInt32LE(total,      off); off += 4;
  out.writeUInt32LE(jsonBuf.length, off); off += 4;
  out.writeUInt32LE(0x4E4F534A,     off); off += 4;
  jsonBuf.copy(out, off); off += jsonBuf.length;
  if (binFull) {
    out.writeUInt32LE(binFull.length, off); off += 4;
    out.writeUInt32LE(0x004E4942,     off); off += 4;
    binFull.copy(out, off);
  }
  return out;
}

// ── Tests ─────────────────────────────────────────────────────────

testSuite("lib/validate.js", () => {

  // 1. Good animation passes all laws
  {
    const buf    = buildSyntheticGlb({});
    const result = validateBuffer(buf, "good_anim.glb");
    assert(result.valid === true,            "Good anim: valid = true");
    assert(result.laws.law1.pass,            "Good anim: law1 pass");
    assert(result.laws.law2.pass,            "Good anim: law2 pass");
    assert(result.laws.law3.pass,            "Good anim: law3 pass");
    assert(result.laws.law4.pass,            "Good anim: law4 pass");
    assert(result.laws.law5.pass,            "Good anim: law5 pass");
    assert(result.errors.length === 0,       "Good anim: no errors");
  }

  // 2. Root non-identity rotation → law1 fail
  {
    const buf    = buildSyntheticGlb({ rootRot: [0.7071068, 0, 0, 0.7071068] });
    const result = validateBuffer(buf, "bad_rot.glb");
    assert(!result.valid,               "Root rotation: valid = false");
    assert(!result.laws.law1.pass,      "Root rotation: law1 fails");
    assert(result.needsCoordFix,        "Root rotation: needsCoordFix = true");
    assert(result.laws.law1.issues.length > 0, "Root rotation: law1 has issue text");
  }

  // 3. Root non-identity scale → law1 fail
  {
    const buf    = buildSyntheticGlb({ rootScale: [0.01, 0.01, 0.01] });
    const result = validateBuffer(buf, "bad_scale.glb");
    assert(!result.valid,          "Root scale: valid = false");
    assert(!result.laws.law1.pass, "Root scale: law1 fails");
    assert(result.needsCoordFix,   "Root scale: needsCoordFix = true");
  }

  // 4. Root animation scale curve ≠ [1,1,1] → law2 fail
  {
    const buf    = buildSyntheticGlb({ animOnRoot: true });
    const result = validateBuffer(buf, "bad_anim_scale.glb");
    assert(!result.valid,          "Anim scale curve: valid = false");
    assert(!result.laws.law2.pass, "Anim scale curve: law2 fails");
    assert(result.laws.law1.pass,  "Anim scale curve: law1 still passes (rest pose fine)");
  }

  // 5. Hip Y out of range (too low → 0.0)
  {
    const buf    = buildSyntheticGlb({ hipY: 0.0 });
    const result = validateBuffer(buf, "bad_hip_low.glb");
    assert(!result.valid,          "Hip Y too low: valid = false");
    assert(!result.laws.law3.pass, "Hip Y too low: law3 fails");
  }

  // 6. Hip in centimeters (Y = 105 cm)
  {
    const buf    = buildSyntheticGlb({ hipY: 105.0 });
    const result = validateBuffer(buf, "hip_centimeters.glb");
    assert(!result.valid,          "Hip centimeters: valid = false");
    assert(!result.laws.law3.pass, "Hip centimeters: law3 fails");
    assert(result.laws.law3.issues[0].includes("centimeter"),
      "Hip centimeters: issue text mentions centimeters");
  }

  // 7. Missing required bone
  {
    const buf    = buildSyntheticGlb({ missingBones: ["lFoot", "rFoot"] });
    const result = validateBuffer(buf, "missing_bones.glb");
    assert(!result.valid,          "Missing bones: valid = false");
    assert(!result.laws.law4.pass, "Missing bones: law4 fails");
    assert(result.laws.law4.issues[0].includes("lFoot"), "Missing bones: issue mentions lFoot");
  }

  // 8. No animations → law5 fail
  {
    const buf    = buildSyntheticGlb({ noAnims: true });
    const result = validateBuffer(buf, "no_anims.glb");
    assert(!result.valid,          "No anims: valid = false");
    assert(!result.laws.law5.pass, "No anims: law5 fails");
  }

  // 9. Has a mesh → needsMeshStrip = true (does not fail laws by itself)
  {
    const buf    = buildSyntheticGlb({ includeMesh: true });
    const result = validateBuffer(buf, "has_mesh.glb");
    assert(result.needsMeshStrip === true, "Has mesh: needsMeshStrip = true");
    assert(result.meshCount === 1,         "Has mesh: meshCount = 1");
    // Mesh presence alone doesn't fail any law — it's advisory
    assert(result.valid === true,          "Has mesh: still valid (mesh is advisory)");
  }

  // 10. REQUIRED_BONES constant has at least 19 entries
  {
    assert(REQUIRED_BONES.length >= 19, `REQUIRED_BONES has ${REQUIRED_BONES.length} entries (>= 19)`);
    assert(REQUIRED_BONES.includes("hip"),   "REQUIRED_BONES includes hip");
    assert(REQUIRED_BONES.includes("lFoot"), "REQUIRED_BONES includes lFoot");
    assert(REQUIRED_BONES.includes("head"),  "REQUIRED_BONES includes head");
  }

  // 11. validateGlb on a real handoff file (skip if not present)
  {
    const handoffGlb = path.resolve(
      REPO_ROOT, "playcanvas-app", "assets",
      "handoffs", "playcanvas_handoff_20260330", "assets", "animations", "idle_default.glb"
    );
    const fs = require("fs");
    if (fs.existsSync(handoffGlb)) {
      const result = validateGlb(handoffGlb);
      assert(result.sizeMB > 0.5 && result.sizeMB < 5,
        `Real handoff idle_default.glb: size ${result.sizeMB} MB (expected 0.5–5)`);
      assert(result.animCount >= 1,
        `Real handoff idle_default.glb: has ${result.animCount} animation(s)`);
      assert(result.laws.law4.pass,
        `Real handoff idle_default.glb: all required bones present`);
      assert(result.laws.law5.pass,
        `Real handoff idle_default.glb: has animation data`);
    } else {
      console.log("    (skipped real-file test — handoff GLB not found)");
    }
  }

});
