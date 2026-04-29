/**
 * test/test-strip-fix.js
 *
 * Tests for lib/strip-fix.js
 *
 * Tests:
 *  1. Output is smaller than input when mesh is stripped
 *  2. Output passes validation (law1 + law4 + law5)
 *  3. Root rest-pose becomes identity after fix
 *  4. Hip translation Y moves into 0.5–2.0 m range
 *  5. Mesh/skin/material/texture/image entries removed from JSON
 *  6. Already-fixed and mesh-free GLB returns status "skip"
 *  7. Non-GLB input returns status "error"
 *  8. Animation curve count preserved (same number of channels)
 *  9. Hip Z becomes small (Y-up space confirmed)
 */

"use strict";

const { stripFix } = require("../lib/strip-fix");
const { validateBuffer, REQUIRED_BONES } = require("../lib/validate");
const { parseGlb } = require("../lib/glb");

// ── Synthetic GLB builder (with DAZ-space root) ───────────────────

const DAZ_ROOT_ROT   = [0.7071068, 0, 0, 0.7071068]; // 90° around X
const DAZ_ROOT_SCALE = [0.01, 0.01, 0.01];
// DAZ hip: [0, 1.678, -110.461] in centimeter/Z-up space
const DAZ_HIP_T = [0, 1.678, -110.461];

function makeDAZGlb(opts) {
  const o = opts || {};

  const nodes = [
    {
      name: "Victoria 8",
      rotation: DAZ_ROOT_ROT,
      scale:    DAZ_ROOT_SCALE,
      children: [1],
    },
    {
      name: "hip",
      translation: o.hipT || DAZ_HIP_T,
      children: [2],
    },
    { name: "pelvis", children: [3] },
  ];

  // Add required bones
  REQUIRED_BONES.filter(b => b !== "hip" && b !== "pelvis").forEach(b => nodes.push({ name: b }));

  // Binary: time + hip rotation keyframes
  const timeData = [0.0, 1.0];
  const rotData  = [0,0,0,1,  0,0,0,1];
  const binParts = [makeBF(timeData), makeBF(rotData)];

  // If includeMesh: add a dummy vertex position accessor
  let meshAccessorIdx = null;
  if (o.includeMesh) {
    binParts.push(makeBF([0,0,0, 1,0,0])); // 2 vec3 positions (dummy mesh)
    meshAccessorIdx = 2;
  }

  const bin = Buffer.concat(binParts);
  const bufferViews = [];
  let cursor = 0;
  bufferViews.push({ byteOffset: cursor, byteLength: timeData.length * 4 }); cursor += timeData.length * 4;
  bufferViews.push({ byteOffset: cursor, byteLength: rotData.length  * 4 }); cursor += rotData.length * 4;
  if (o.includeMesh) {
    bufferViews.push({ byteOffset: cursor, byteLength: 24 }); cursor += 24;
  }

  const accessors = [
    { bufferView: 0, byteOffset: 0, count: 2, type: "SCALAR", componentType: 5126 },
    { bufferView: 1, byteOffset: 0, count: 2, type: "VEC4",   componentType: 5126 },
  ];
  if (o.includeMesh) {
    accessors.push({ bufferView: 2, byteOffset: 0, count: 2, type: "VEC3", componentType: 5126 });
  }

  const gltf = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes,
    buffers: [{ byteLength: bin.length }],
    bufferViews,
    accessors,
    animations: [{
      name: "Animation",
      samplers: [{ input: 0, output: 1, interpolation: "LINEAR" }],
      channels: [{ sampler: 0, target: { node: 1, path: "rotation" } }],
    }],
  };

  if (o.includeMesh) {
    gltf.meshes = [{
      name: "TestMesh",
      primitives: [{ attributes: { POSITION: meshAccessorIdx } }],
    }];
    gltf.skins = [{
      name: "TestSkin",
      joints: [1, 2],
    }];
    gltf.materials = [{ name: "TestMat" }];
    gltf.textures  = [{ name: "TestTex" }];
    gltf.images    = [{ name: "TestImg" }];
  }

  return buildGlbBuf(gltf, bin);
}

function makeBF(values) {
  const buf = Buffer.allocUnsafe(values.length * 4);
  values.forEach((v, i) => buf.writeFloatLE(v, i * 4));
  return buf;
}

function buildGlbBuf(gltf, bin) {
  const jsonStr = JSON.stringify(gltf);
  const jsonPad = (4 - (jsonStr.length % 4)) % 4;
  const jsonBuf = Buffer.from(jsonStr + " ".repeat(jsonPad), "utf8");
  const binPad  = (4 - (bin.length % 4)) % 4;
  const binFull = binPad > 0 ? Buffer.concat([bin, Buffer.alloc(binPad)]) : bin;
  const total   = 12 + 8 + jsonBuf.length + 8 + binFull.length;
  const out = Buffer.alloc(total);
  let off = 0;
  out.writeUInt32LE(0x46546C67, off); off += 4;
  out.writeUInt32LE(2,          off); off += 4;
  out.writeUInt32LE(total,      off); off += 4;
  out.writeUInt32LE(jsonBuf.length, off); off += 4;
  out.writeUInt32LE(0x4E4F534A,     off); off += 4;
  jsonBuf.copy(out, off); off += jsonBuf.length;
  out.writeUInt32LE(binFull.length, off); off += 4;
  out.writeUInt32LE(0x004E4942,     off); off += 4;
  binFull.copy(out, off);
  return out;
}

// ── Tests ─────────────────────────────────────────────────────────

testSuite("lib/strip-fix.js", () => {

  // 1. Output is smaller when mesh is stripped
  {
    const input  = makeDAZGlb({ includeMesh: true });
    const { buf, status } = stripFix(input);
    assert(status !== "error", "With mesh: status !== error");
    assert(buf.length < input.length, `With mesh: output (${buf.length}) < input (${input.length})`);
  }

  // 2. Output passes validation
  {
    const input  = makeDAZGlb({});
    const { buf, status } = stripFix(input);
    assert(status !== "error", "After strip-fix: status !== error");
    const vr = validateBuffer(buf, "strip-fix-test.glb");
    assert(vr.laws.law1.pass, `After strip-fix: law1 pass (root rest-pose identity)`);
    assert(vr.laws.law4.pass, `After strip-fix: law4 pass (required bones present)`);
    assert(vr.laws.law5.pass, `After strip-fix: law5 pass (has animation)`);
  }

  // 3. Root rest-pose becomes identity
  {
    const input    = makeDAZGlb({});
    const { buf }  = stripFix(input);
    const { gltf } = parseGlb(buf);
    const root     = gltf.nodes[gltf.scenes[0].nodes[0]];
    const noRot    = !root.rotation || root.rotation.every((v, i) => Math.abs(v - [0,0,0,1][i]) < 0.001);
    const noScale  = !root.scale    || root.scale.every(v => Math.abs(v - 1) < 0.001);
    assert(noRot,   "Root rest-pose: rotation is identity after fix");
    assert(noScale, "Root rest-pose: scale is identity after fix");
  }

  // 4. Hip Y moves to 0.5–2.0 m range
  {
    const input    = makeDAZGlb({}); // DAZ_HIP_T = [0, 1.678, -110.461]
    const { buf }  = stripFix(input);
    const { gltf } = parseGlb(buf);
    const nodeNames = gltf.nodes.map(n => n.name || "");
    const hipIdx    = nodeNames.indexOf("hip");
    const hipT      = gltf.nodes[hipIdx].translation || [0, 0, 0];

    // After baking: Y should end up in [0.5, 2.0] metres
    // For DAZ hip [0, 1.678, -110.461] in Z-up cm:
    //   scaled: [0, 0.01678, -1.10461]
    //   rotVec3 by 90°X: [0, 1.10461, 0.01678]   (Y and Z swap and Z negated)
    // So the output hip Y should be ≈ 1.1
    assert(hipT[1] >= 0.5 && hipT[1] <= 2.0,
      `Hip Y after fix: ${hipT[1].toFixed(4)} is in [0.5, 2.0]`);
  }

  // 5. Mesh/skin/material/texture/image removed from JSON
  {
    const input    = makeDAZGlb({ includeMesh: true });
    const { buf }  = stripFix(input);
    const { gltf } = parseGlb(buf);
    assert(!gltf.meshes    || gltf.meshes.length === 0,
      "After strip-fix: meshes removed");
    assert(!gltf.skins     || gltf.skins.length === 0,
      "After strip-fix: skins removed");
    assert(!gltf.materials || gltf.materials.length === 0,
      "After strip-fix: materials removed");
    assert(!gltf.textures  || gltf.textures.length === 0,
      "After strip-fix: textures removed");
    assert(!gltf.images    || gltf.images.length === 0,
      "After strip-fix: images removed");
  }

  // 6. Already-fixed, mesh-free → returns "skip"
  {
    // Build a glb that is already in Y-up metres (no root rot/scale, hip Y=1.1)
    const alreadyFixed = (() => {
      const nodes = [
        { name: "Victoria 8", children: [1] }, // no rotation, no scale
        { name: "hip", translation: [0, 1.1, 0], children: [2] },
        { name: "pelvis", children: [] },
        ...REQUIRED_BONES.filter(b => b !== "hip" && b !== "pelvis").map(b => ({ name: b })),
      ];
      const timeData = [0.0, 1.0];
      const rotData  = [0,0,0,1,  0,0,0,1];
      const bin = Buffer.concat([makeBF(timeData), makeBF(rotData)]);
      const gltf = {
        asset: { version: "2.0" }, scene: 0,
        scenes: [{ nodes: [0] }], nodes,
        buffers: [{ byteLength: bin.length }],
        bufferViews: [
          { byteOffset: 0, byteLength: 8 },
          { byteOffset: 8, byteLength: 32 },
        ],
        accessors: [
          { bufferView: 0, byteOffset: 0, count: 2, type: "SCALAR", componentType: 5126 },
          { bufferView: 1, byteOffset: 0, count: 2, type: "VEC4",   componentType: 5126 },
        ],
        animations: [{
          name: "Animation",
          samplers: [{ input: 0, output: 1 }],
          channels: [{ sampler: 0, target: { node: 1, path: "rotation" } }],
        }],
      };
      return buildGlbBuf(gltf, bin);
    })();

    const { status } = stripFix(alreadyFixed, { skipIfAlreadyFixed: true });
    assertEqual(status, "skip", "Already-fixed, no-mesh: status is 'skip'");
  }

  // 7. Non-GLB input returns status "error"
  {
    const { status } = stripFix(Buffer.from("this is not a GLB file"));
    assertEqual(status, "error", "Non-GLB: status is 'error'");
  }

  // 8. Animation channel count is preserved
  {
    const input    = makeDAZGlb({});
    const { buf }  = stripFix(input);
    const { gltf } = parseGlb(buf);
    assertEqual(gltf.animations.length, 1, "After fix: 1 animation");
    assertEqual(gltf.animations[0].channels.length, 1, "After fix: 1 channel preserved");
  }

  // 9. Hip Z is small (Y-up) after fix
  {
    const input    = makeDAZGlb({});
    const { buf }  = stripFix(input);
    const { gltf } = parseGlb(buf);
    const nodeNames = gltf.nodes.map(n => n.name || "");
    const hipIdx    = nodeNames.indexOf("hip");
    const hipT      = gltf.nodes[hipIdx].translation || [0, 0, 0];
    assert(Math.abs(hipT[2]) < 0.5,
      `Hip Z after fix: ${hipT[2].toFixed(4)} is small (Y-up space confirmed)`);
  }

});
