// Read Victoria 8 scale values from animation GLB binary section
const fs = require("fs");

function glbCheck(p, label) {
  const buf = fs.readFileSync(p);
  // GLB header: 12 bytes. Chunk 0: chunkLength(4) chunkType(4) chunkData
  const jsonChunkLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonChunkLen).toString("utf8"));

  // Binary chunk starts after: 12 (header) + 8 (chunk0 header) + jsonChunkLen
  const binChunkOffset = 12 + 8 + jsonChunkLen;
  const binChunkLen = buf.readUInt32LE(binChunkOffset);
  const binStart = binChunkOffset + 8; // skip chunkLength(4) + chunkType(4)
  const binData = buf.slice(binStart, binStart + binChunkLen);

  const nodes = json.nodes || [];
  const anim = (json.animations || [])[0];
  if (!anim) { console.log(label + ": no animations"); return; }

  function readAccessorValues(accessorIdx) {
    const acc = json.accessors[accessorIdx];
    const bv = json.bufferViews[acc.bufferView];
    const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const count = acc.count;
    const compCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type] || 1;
    const vals = [];
    for (let i = 0; i < count; i++) {
      const row = [];
      for (let c = 0; c < compCount; c++) {
        row.push(binData.readFloatLE(byteOffset + (i * compCount + c) * 4));
      }
      vals.push(row);
    }
    return vals;
  }

  // Find Victoria 8 scale channel
  for (const ch of anim.channels) {
    const node = nodes[ch.target.node];
    if (node && node.name === "Victoria 8" && ch.target.path === "scale") {
      const sampler = anim.samplers[ch.sampler];
      const outputVals = readAccessorValues(sampler.output);
      console.log(label + ": Victoria 8/scale values = " + JSON.stringify(outputVals));
    }
    // Also check hip rotation/translation first keyframe
    if (node && node.name === "hip" && ch.target.path === "translation") {
      const sampler = anim.samplers[ch.sampler];
      const outputVals = readAccessorValues(sampler.output);
      console.log(label + ": hip/translation[0] = " + JSON.stringify(outputVals[0]) +
        "  (Y should be ~1.0 for correct meter-space)");
    }
  }
}

const base = "playcanvas-app/assets/animations/";
glbCheck(base + "27775_stand_still.glb", "idle");
glbCheck(base + "28154_explain.glb", "talk");
glbCheck(base + "27299_stand_and_nod.glb", "listen");
glbCheck(base + "ack_nod_small_v1.glb", "ack");
