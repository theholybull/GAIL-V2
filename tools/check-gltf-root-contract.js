/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const EPSILON = 1e-4;
const files = process.argv.slice(2);

if (files.length === 0) {
  console.error("Usage: node tools/check-gltf-root-contract.js <file.glb> [...]");
  process.exit(1);
}

function approxEqual(left, right) {
  return Math.abs(left - right) <= EPSILON;
}

function isIdentityTranslation(values) {
  if (!Array.isArray(values)) return true;
  return values.length === 3 && values.every((value) => approxEqual(value, 0));
}

function isIdentityRotation(values) {
  if (!Array.isArray(values)) return true;
  return values.length === 4
    && approxEqual(values[0], 0)
    && approxEqual(values[1], 0)
    && approxEqual(values[2], 0)
    && approxEqual(values[3], 1);
}

function isIdentityScale(values) {
  if (!Array.isArray(values)) return true;
  return values.length === 3 && values.every((value) => approxEqual(value, 1));
}

function readGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.readUInt32LE(0) !== 0x46546c67) {
    throw new Error(`Not a GLB file: ${filePath}`);
  }
  const jsonLength = buffer.readUInt32LE(12);
  return JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength));
}

const report = [];
let hasFailure = false;

for (const file of files) {
  const resolved = path.resolve(file);
  const gltf = readGlb(resolved);
  const scene = gltf.scenes?.[gltf.scene || 0];
  const rootIndex = scene?.nodes?.[0];
  const rootNode = typeof rootIndex === "number" ? gltf.nodes?.[rootIndex] : undefined;
  const entry = {
    file: resolved,
    rootIndex,
    rootName: rootNode?.name ?? null,
    translation: rootNode?.translation ?? null,
    rotation: rootNode?.rotation ?? null,
    scale: rootNode?.scale ?? null,
    passes:
      isIdentityTranslation(rootNode?.translation)
      && isIdentityRotation(rootNode?.rotation)
      && isIdentityScale(rootNode?.scale),
  };
  if (!entry.passes) {
    hasFailure = true;
  }
  report.push(entry);
}

console.log(JSON.stringify(report, null, 2));

if (hasFailure) {
  process.exit(1);
}
