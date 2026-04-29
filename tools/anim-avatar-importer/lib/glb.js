/**
 * lib/glb.js
 *
 * GLB (binary GLTF) parse / write / compact helpers.
 * Zero external dependencies — pure Node.js Buffer operations.
 *
 * GLB format:
 *   [0]  magic    uint32  0x46546C67 ("glTF")
 *   [4]  version  uint32  2
 *   [8]  length   uint32  total file bytes
 *   [12] JSON chunk length uint32
 *   [16] JSON chunk type  uint32  0x4E4F534A ("JSON")
 *   [20..20+jsonLen] JSON text (space-padded to 4-byte boundary)
 *   [20+jsonLen]     BIN chunk length uint32
 *   [20+jsonLen+4]   BIN chunk type   uint32  0x004E4942 ("BIN\0")
 *   [20+jsonLen+8..] binary data      (zero-padded to 4-byte boundary)
 */

"use strict";

const GLB_MAGIC     = 0x46546C67;
const CHUNK_JSON    = 0x4E4F534A;
const CHUNK_BIN     = 0x004E4942;

const COMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

// ── Parse ────────────────────────────────────────────────────────

/**
 * Parse a GLB Buffer into { gltf, bin }.
 * gltf = parsed JSON object (mutate freely).
 * bin  = mutable copy of the binary chunk (null if none).
 * @param {Buffer} buf
 * @returns {{ gltf: object, bin: Buffer|null }}
 */
function parseGlb(buf) {
  if (buf.readUInt32LE(0) !== GLB_MAGIC) throw new Error("Not a GLB file (bad magic)");
  const version = buf.readUInt32LE(4);
  if (version !== 2) throw new Error(`Unsupported GLB version: ${version}`);

  const jsonLen = buf.readUInt32LE(12);
  const jsonChunkType = buf.readUInt32LE(16);
  if (jsonChunkType !== CHUNK_JSON) throw new Error("First chunk is not JSON");

  const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));

  const binOff = 20 + jsonLen;
  let bin = null;
  if (binOff + 8 <= buf.length) {
    const binLen = buf.readUInt32LE(binOff);
    const binType = buf.readUInt32LE(binOff + 4);
    if (binType !== CHUNK_BIN) throw new Error("Second chunk is not BIN");
    bin = Buffer.from(buf.slice(binOff + 8, binOff + 8 + binLen));
  }

  return { gltf, bin };
}

// ── Write ────────────────────────────────────────────────────────

/**
 * Serialise { gltf, bin } back into a GLB Buffer.
 * Both JSON and binary chunks are padded to 4-byte boundaries.
 * @param {object} gltf
 * @param {Buffer|null} bin
 * @returns {Buffer}
 */
function writeGlb(gltf, bin) {
  const jsonStr  = JSON.stringify(gltf);
  const jsonPad  = (4 - (jsonStr.length % 4)) % 4;
  const jsonBuf  = Buffer.from(jsonStr + " ".repeat(jsonPad), "utf8");

  let binPadded = null;
  if (bin && bin.length > 0) {
    const pad = (4 - (bin.length % 4)) % 4;
    binPadded = pad > 0 ? Buffer.concat([bin, Buffer.alloc(pad)]) : bin;
  }

  const total = 12                         // GLB header
    + 8 + jsonBuf.length                   // JSON chunk header + data
    + (binPadded ? 8 + binPadded.length : 0); // BIN chunk (optional)

  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonChunkHeader.writeUInt32LE(CHUNK_JSON, 4);

  const parts = [header, jsonChunkHeader, jsonBuf];

  if (binPadded) {
    const binChunkHeader = Buffer.alloc(8);
    binChunkHeader.writeUInt32LE(binPadded.length, 0);
    binChunkHeader.writeUInt32LE(CHUNK_BIN, 4);
    parts.push(binChunkHeader, binPadded);
  }

  return Buffer.concat(parts);
}

// ── Accessor helpers ─────────────────────────────────────────────

/**
 * Build accessor metadata (byte offset, component count, stride).
 * @param {object} gltf
 * @param {number} accessorIndex
 * @returns {{ acc, off, cc, stride, count }}
 */
function accInfo(gltf, accessorIndex) {
  const acc = gltf.accessors[accessorIndex];
  const bv  = gltf.bufferViews[acc.bufferView];
  const off = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const cc  = COMP[acc.type];
  const stride = bv.byteStride || cc * 4;
  return { acc, off, cc, stride, count: acc.count };
}

/**
 * Read all values from a FLOAT32 accessor in the binary buffer.
 * Returns Array<Array<number>> (outer = keyframe, inner = components).
 * @param {Buffer} bin
 * @param {{ off, cc, stride, count }} info
 * @returns {number[][]}
 */
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

/**
 * Write values back into a FLOAT32 accessor in the binary buffer (in-place).
 * @param {Buffer} bin
 * @param {{ off, cc, stride }} info
 * @param {number[][]} vals
 */
function writeF(bin, info, vals) {
  for (let i = 0; i < vals.length; i++)
    for (let j = 0; j < info.cc; j++)
      bin.writeFloatLE(vals[i][j], info.off + i * info.stride + j * 4);
}

// ── Buffer compaction ─────────────────────────────────────────────

/**
 * Compact the binary buffer after accessors/bufferViews have been removed.
 *
 * After stripping meshes, skins, etc. from the GLTF JSON, there are
 * bufferViews and accessors that are no longer referenced.  This
 * function rebuilds:
 *   1. gltf.bufferViews — only keeping views used by remaining accessors
 *   2. gltf.accessors   — with updated bufferView indices
 *   3. gltf.buffers[0]  — byte length updated
 *   4. the binary Buffer — only keeping data from kept bufferViews
 *
 * The GLTF JSON (animations, animation samplers, etc.) must already
 * reference the correct accessor indices before calling this.
 *
 * @param {object} gltf   - GLTF JSON (mutated in-place)
 * @param {Buffer} bin    - current full binary buffer
 * @returns {Buffer}      - compacted binary buffer
 */
function compactBinaryBuffer(gltf, bin) {
  if (!gltf.accessors || gltf.accessors.length === 0) return Buffer.alloc(0);

  // Collect all bufferView indices that are still referenced by accessors.
  const usedBvSet = new Set();
  for (const acc of gltf.accessors) {
    if (acc.bufferView !== undefined) usedBvSet.add(acc.bufferView);
  }

  // Build remapping: old bufferView index → new index and new byte offset
  const oldToNew = new Map(); // old bvIdx → new bvIdx
  const newBvList = [];
  const chunks   = [];
  let cursor = 0;

  for (let oldIdx = 0; oldIdx < (gltf.bufferViews || []).length; oldIdx++) {
    if (!usedBvSet.has(oldIdx)) continue;
    const bv   = gltf.bufferViews[oldIdx];
    const start = bv.byteOffset || 0;
    const end   = start + bv.byteLength;
    const slice = bin.slice(start, end);
    const align = (4 - (cursor % 4)) % 4;
    if (align > 0) {
      chunks.push(Buffer.alloc(align));
      cursor += align;
    }
    oldToNew.set(oldIdx, newBvList.length);
    newBvList.push({ byteOffset: cursor, byteLength: bv.byteLength });
    chunks.push(slice);
    cursor += bv.byteLength;
  }

  // Patch accessor bufferView indices
  for (const acc of gltf.accessors) {
    if (acc.bufferView !== undefined) {
      acc.bufferView = oldToNew.get(acc.bufferView);
    }
  }

  gltf.bufferViews = newBvList;
  if (gltf.buffers && gltf.buffers.length > 0) {
    gltf.buffers[0].byteLength = cursor;
  }

  return cursor > 0 ? Buffer.concat(chunks) : Buffer.alloc(0);
}

// ── Exports ──────────────────────────────────────────────────────

module.exports = {
  parseGlb,
  writeGlb,
  accInfo,
  readF,
  writeF,
  compactBinaryBuffer,
};
