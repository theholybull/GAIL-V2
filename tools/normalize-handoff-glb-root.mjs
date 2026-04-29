import fs from "node:fs";
import path from "node:path";

function identityMatrix() {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
}

function multiplyMatrices(a, b) {
  const out = new Array(16).fill(0);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      for (let i = 0; i < 4; i += 1) {
        out[row * 4 + col] += a[row * 4 + i] * b[i * 4 + col];
      }
    }
  }
  return out;
}

function quaternionToMatrix([x, y, z, w]) {
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;
  return [
    1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0,
    2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0,
    2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0,
    0, 0, 0, 1,
  ];
}

function trsToMatrix(translation, rotation, scale) {
  const matrix = quaternionToMatrix(rotation);
  matrix[0] *= scale[0];
  matrix[1] *= scale[1];
  matrix[2] *= scale[2];
  matrix[4] *= scale[0];
  matrix[5] *= scale[1];
  matrix[6] *= scale[2];
  matrix[8] *= scale[0];
  matrix[9] *= scale[1];
  matrix[10] *= scale[2];
  matrix[12] = translation[0];
  matrix[13] = translation[1];
  matrix[14] = translation[2];
  return matrix;
}

function matrixToTrs(matrix) {
  const translation = [matrix[12], matrix[13], matrix[14]];
  const sx = Math.hypot(matrix[0], matrix[1], matrix[2]);
  const sy = Math.hypot(matrix[4], matrix[5], matrix[6]);
  const sz = Math.hypot(matrix[8], matrix[9], matrix[10]);
  const scale = [sx, sy, sz];
  const m00 = matrix[0] / sx;
  const m01 = matrix[1] / sx;
  const m02 = matrix[2] / sx;
  const m10 = matrix[4] / sy;
  const m11 = matrix[5] / sy;
  const m12 = matrix[6] / sy;
  const m20 = matrix[8] / sz;
  const m21 = matrix[9] / sz;
  const m22 = matrix[10] / sz;
  const trace = m00 + m11 + m22;
  let x;
  let y;
  let z;
  let w;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1.0) * 2;
    w = 0.25 * s;
    x = (m21 - m12) / s;
    y = (m02 - m20) / s;
    z = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
    w = (m21 - m12) / s;
    x = 0.25 * s;
    y = (m01 + m10) / s;
    z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
    w = (m02 - m20) / s;
    x = (m01 + m10) / s;
    y = 0.25 * s;
    z = (m12 + m21) / s;
  } else {
    const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
    w = (m10 - m01) / s;
    x = (m02 + m20) / s;
    y = (m12 + m21) / s;
    z = 0.25 * s;
  }
  return {
    translation,
    rotation: [x, y, z, w],
    scale,
  };
}

function nodeToMatrix(node) {
  if (Array.isArray(node.matrix) && node.matrix.length === 16) {
    return [...node.matrix];
  }
  return trsToMatrix(
    node.translation ?? [0, 0, 0],
    node.rotation ?? [0, 0, 0, 1],
    node.scale ?? [1, 1, 1],
  );
}

function hasNonIdentityTransform(node) {
  const t = node.translation ?? [0, 0, 0];
  const r = node.rotation ?? [0, 0, 0, 1];
  const s = node.scale ?? [1, 1, 1];
  return Math.abs(t[0]) > 1e-8 || Math.abs(t[1]) > 1e-8 || Math.abs(t[2]) > 1e-8
    || Math.abs(r[0]) > 1e-8 || Math.abs(r[1]) > 1e-8 || Math.abs(r[2]) > 1e-8 || Math.abs(r[3] - 1) > 1e-8
    || Math.abs(s[0] - 1) > 1e-8 || Math.abs(s[1] - 1) > 1e-8 || Math.abs(s[2] - 1) > 1e-8
    || Array.isArray(node.matrix);
}

function readGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67) {
    throw new Error(`Not a GLB file: ${filePath}`);
  }
  let offset = 12;
  const chunks = [];
  while (offset < buffer.length) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + length;
    chunks.push({ length, type, data: buffer.slice(start, end) });
    offset = end;
  }
  const jsonChunk = chunks.find((chunk) => chunk.type === 0x4e4f534a);
  if (!jsonChunk) {
    throw new Error(`Missing JSON chunk: ${filePath}`);
  }
  return {
    buffer,
    chunks,
    gltf: JSON.parse(jsonChunk.data.toString("utf8")),
  };
}

function writeGlb(filePath, gltf, originalChunks) {
  const jsonString = JSON.stringify(gltf);
  const jsonPadding = (4 - (jsonString.length % 4)) % 4;
  const jsonData = Buffer.from(jsonString + " ".repeat(jsonPadding), "utf8");
  const rebuiltChunks = originalChunks.map((chunk) => {
    if (chunk.type === 0x4e4f534a) {
      return { type: chunk.type, data: jsonData };
    }
    return { type: chunk.type, data: chunk.data };
  });
  const totalLength = 12 + rebuiltChunks.reduce((sum, chunk) => sum + 8 + chunk.data.length, 0);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const buffers = [header];
  for (const chunk of rebuiltChunks) {
    const chunkHeader = Buffer.alloc(8);
    chunkHeader.writeUInt32LE(chunk.data.length, 0);
    chunkHeader.writeUInt32LE(chunk.type, 4);
    buffers.push(chunkHeader, chunk.data);
  }
  fs.writeFileSync(filePath, Buffer.concat(buffers));
}

function normalizeFile(filePath) {
  const { chunks, gltf } = readGlb(filePath);
  const sceneIndex = gltf.scene ?? 0;
  const scene = gltf.scenes?.[sceneIndex];
  const nodes = gltf.nodes ?? [];
  if (!scene?.nodes?.length) {
    throw new Error(`No scene roots in ${filePath}`);
  }
  const changes = [];
  for (const rootIndex of scene.nodes) {
    const rootNode = nodes[rootIndex];
    if (!rootNode || !hasNonIdentityTransform(rootNode)) {
      continue;
    }
    if (rootNode.mesh != null || rootNode.skin != null || rootNode.camera != null) {
      continue;
    }
    const rootMatrix = nodeToMatrix(rootNode);
    for (const childIndex of rootNode.children ?? []) {
      const childNode = nodes[childIndex];
      if (!childNode) {
        continue;
      }
      const bakedMatrix = multiplyMatrices(rootMatrix, nodeToMatrix(childNode));
      const baked = matrixToTrs(bakedMatrix);
      delete childNode.matrix;
      childNode.translation = baked.translation.map((value) => Number(value.toFixed(9)));
      childNode.rotation = baked.rotation.map((value) => Number(value.toFixed(9)));
      childNode.scale = baked.scale.map((value) => Number(value.toFixed(9)));
    }
    delete rootNode.matrix;
    rootNode.translation = [0, 0, 0];
    rootNode.rotation = [0, 0, 0, 1];
    rootNode.scale = [1, 1, 1];
    changes.push({ rootIndex, rootName: rootNode.name, childCount: (rootNode.children ?? []).length });
  }
  writeGlb(filePath, gltf, chunks);
  return changes;
}

const inputPaths = process.argv.slice(2);
if (inputPaths.length === 0) {
  console.error("Usage: node normalize-handoff-glb-root.mjs <file.glb> [more.glb...]");
  process.exit(1);
}

for (const inputPath of inputPaths) {
  const filePath = path.resolve(inputPath);
  const backupPath = `${filePath}.pre_root_normalize`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
  const changes = normalizeFile(filePath);
  console.log(JSON.stringify({ filePath, backupPath, changes }, null, 2));
}