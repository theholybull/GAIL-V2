/**
 * test/test-glb.js
 *
 * Unit tests for lib/glb.js
 *
 * Tests:
 *  1. parseGlb — rejects non-GLB
 *  2. parseGlb — rejects wrong version
 *  3. writeGlb / parseGlb roundtrip (JSON only, no binary)
 *  4. writeGlb / parseGlb roundtrip (with binary chunk)
 *  5. padding: output is always 4-byte aligned
 *  6. accInfo — extracts correct offset and count
 *  7. readF / writeF — round-trip float values
 *  8. compactBinaryBuffer — removes unused bufferViews
 */

"use strict";

const { parseGlb, writeGlb, accInfo, readF, writeF, compactBinaryBuffer } = require("../lib/glb");

// ── Helpers ───────────────────────────────────────────────────────

function makeGlb(gltf, binData) {
  const jsonStr = JSON.stringify(gltf);
  const jsonPad = (4 - (jsonStr.length % 4)) % 4;
  const jsonBuf = Buffer.from(jsonStr + " ".repeat(jsonPad), "utf8");

  let binBuf = null;
  if (binData) {
    const binPad = (4 - (binData.length % 4)) % 4;
    binBuf = binPad > 0 ? Buffer.concat([binData, Buffer.alloc(binPad)]) : binData;
  }

  const total = 12 + 8 + jsonBuf.length + (binBuf ? 8 + binBuf.length : 0);
  const out = Buffer.alloc(total);
  let off = 0;

  // Header
  out.writeUInt32LE(0x46546C67, off); off += 4; // magic
  out.writeUInt32LE(2,          off); off += 4; // version
  out.writeUInt32LE(total,      off); off += 4; // length

  // JSON chunk
  out.writeUInt32LE(jsonBuf.length, off); off += 4; // chunk length
  out.writeUInt32LE(0x4E4F534A,     off); off += 4; // chunk type JSON
  jsonBuf.copy(out, off); off += jsonBuf.length;

  // BIN chunk
  if (binBuf) {
    out.writeUInt32LE(binBuf.length, off); off += 4;
    out.writeUInt32LE(0x004E4942,    off); off += 4;
    binBuf.copy(out, off);
  }
  return out;
}

function makeBinFloats(values) {
  const buf = Buffer.allocUnsafe(values.length * 4);
  for (let i = 0; i < values.length; i++) buf.writeFloatLE(values[i], i * 4);
  return buf;
}

// ── GLB minimal valid GLTF ────────────────────────────────────────

const MINIMAL_GLTF = {
  asset: { version: "2.0" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: "root" }],
};

// ── Tests ─────────────────────────────────────────────────────────

testSuite("lib/glb.js", () => {

  // 1. rejects non-GLB
  assertThrows(
    () => parseGlb(Buffer.from("not a glb file")),
    "parseGlb throws on non-GLB"
  );

  // 2. rejects wrong version
  const wrongVersion = makeGlb(MINIMAL_GLTF, null);
  wrongVersion.writeUInt32LE(1, 4); // overwrite version → 1
  assertThrows(
    () => parseGlb(wrongVersion),
    "parseGlb throws on version ≠ 2"
  );

  // 3. JSON-only roundtrip (no binary)
  {
    const buf = makeGlb(MINIMAL_GLTF, null);
    const { gltf, bin } = parseGlb(buf);
    assert(bin === null, "JSON-only GLB: bin is null");
    assertEqual(gltf.nodes[0].name, "root", "Roundtrip: root node name preserved");
    assertEqual(gltf.scenes[0].nodes[0], 0, "Roundtrip: scene root index preserved");
  }

  // 4. Roundtrip with binary chunk
  {
    const floatValues = [1.0, 2.5, -0.5];
    const binData = makeBinFloats(floatValues);
    const buf = makeGlb(MINIMAL_GLTF, binData);
    const { gltf, bin } = parseGlb(buf);
    assert(bin !== null, "With-binary GLB: bin is not null");
    assert(bin.length >= binData.length, "With-binary GLB: bin has correct length");
    for (let i = 0; i < floatValues.length; i++) {
      const v = bin.readFloatLE(i * 4);
      assert(Math.abs(v - floatValues[i]) < 1e-6, `Float roundtrip [${i}]: ${floatValues[i]}`);
    }
  }

  // 5. writeGlb output is 4-byte aligned
  {
    for (let extraLen = 0; extraLen < 4; extraLen++) {
      const gltf2 = Object.assign({}, MINIMAL_GLTF, { _pad: "x".repeat(extraLen) });
      const bin2 = Buffer.alloc(extraLen + 1);
      const out = writeGlb(gltf2, bin2);
      assert(out.length % 4 === 0, `writeGlb output is 4-byte aligned (extraLen=${extraLen})`);
    }
  }

  // 6. writeGlb / parseGlb full roundtrip
  {
    const testGltf = {
      asset: { version: "2.0" },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ name: "Victoria 8", rotation: [0.7071068, 0, 0, 0.7071068], scale: [0.01, 0.01, 0.01] }],
    };
    const testBin = Buffer.alloc(32, 0xAB);
    const encoded = writeGlb(testGltf, testBin);
    const { gltf: decoded, bin: decodedBin } = parseGlb(encoded);
    assertEqual(decoded.nodes[0].name, "Victoria 8", "writeGlb→parseGlb: node name");
    assert(Math.abs(decoded.nodes[0].rotation[0] - 0.7071068) < 1e-6, "writeGlb→parseGlb: rotation preserved");
    assert(decodedBin !== null, "writeGlb→parseGlb: bin not null");
    // First byte should be 0xAB
    assert(decodedBin[0] === 0xAB, "writeGlb→parseGlb: binary data preserved");
  }

  // 7. accInfo extracts correct numbers
  {
    const floats = [1.0, 2.0, 3.0, 4.0];
    const bin = makeBinFloats(floats);
    const gltf = {
      bufferViews: [{ byteOffset: 0, byteLength: 16 }],
      accessors:   [{ bufferView: 0, byteOffset: 0, count: 4, type: "SCALAR", componentType: 5126 }],
    };
    const info = accInfo(gltf, 0);
    assertEqual(info.count, 4,  "accInfo: count = 4");
    assertEqual(info.cc,    1,  "accInfo: cc = 1 for SCALAR");
    assertEqual(info.off,   0,  "accInfo: offset = 0");
    assertEqual(info.stride, 4, "accInfo: stride = 4");
  }

  // 8. readF / writeF round-trip
  {
    const original = [[1.1, 2.2, 3.3], [4.4, 5.5, 6.6]];
    const bin = Buffer.alloc(2 * 3 * 4);
    const gltf = {
      bufferViews: [{ byteOffset: 0, byteLength: 24 }],
      accessors:   [{ bufferView: 0, byteOffset: 0, count: 2, type: "VEC3", componentType: 5126 }],
    };
    const info = accInfo(gltf, 0);
    writeF(bin, info, original);
    const readBack = readF(bin, info);
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        assert(Math.abs(readBack[i][j] - original[i][j]) < 1e-4,
          `readF/writeF roundtrip [${i}][${j}]: ${original[i][j]}`);
      }
    }
  }

  // 9. compactBinaryBuffer removes unused bufferViews
  {
    // Two bufferViews of 8 bytes each; only accessor 0 → bufferView 0 is kept
    const gltf2 = {
      bufferViews: [
        { byteOffset: 0, byteLength: 8 },
        { byteOffset: 8, byteLength: 8 },
      ],
      accessors: [
        { bufferView: 0, byteOffset: 0, count: 2, type: "SCALAR", componentType: 5126 },
        // accessor 1 (uses bufferView 1) is REMOVED before calling compact
      ],
      buffers: [{ byteLength: 16 }],
    };
    const bigBin = Buffer.alloc(16);
    bigBin.writeFloatLE(9.9, 0);  // bv0 float 0
    bigBin.writeFloatLE(8.8, 4);  // bv0 float 1
    bigBin.writeFloatLE(7.7, 8);  // bv1 (should be dropped)

    const compact = compactBinaryBuffer(gltf2, bigBin);
    assert(compact.length <= 8, "compactBinaryBuffer: output smaller after dropping unused bv");
    assertEqual(gltf2.bufferViews.length, 1, "compactBinaryBuffer: 1 bufferView remains");
    // Read the values back
    const info2 = accInfo(gltf2, 0);
    const vals  = readF(compact, info2);
    assert(Math.abs(vals[0][0] - 9.9) < 1e-4, "compactBinaryBuffer: value 9.9 preserved");
    assert(Math.abs(vals[1][0] - 8.8) < 1e-4, "compactBinaryBuffer: value 8.8 preserved");
  }

});
