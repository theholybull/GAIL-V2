#!/usr/bin/env node
/**
 * fix-animation-coordinate-space.js
 *
 * Transforms animation GLB files from DAZ centimeters/Z-up space
 * to meters/Y-up space to match the Gail avatar GLB.
 *
 * The converted animation GLBs have a root "Victoria 8" node with:
 *   rotation = 90° around X  (Z-up → Y-up)
 *   scale    = 0.01           (centimeters → meters)
 *
 * The avatar GLB has these transforms baked into bone positions
 * with an identity root. This script bakes the root transform
 * into every bone so the animation data matches the avatar.
 */

const fs = require("fs");
const path = require("path");

// ── GLB binary parse / write ─────────────────────────────────────

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

function writeGlb(gltf, bin) {
  const jsonStr = JSON.stringify(gltf);
  const pad = (4 - (jsonStr.length % 4)) % 4;
  const jsonBuf = Buffer.from(jsonStr + " ".repeat(pad), "utf8");
  const binPad = bin ? (4 - (bin.length % 4)) % 4 : 0;
  const binPadded =
    bin && binPad > 0 ? Buffer.concat([bin, Buffer.alloc(binPad)]) : bin;
  const total = 12 + 8 + jsonBuf.length + (binPadded ? 8 + binPadded.length : 0);
  const hdr = Buffer.alloc(12);
  hdr.writeUInt32LE(0x46546c67, 0);
  hdr.writeUInt32LE(2, 4);
  hdr.writeUInt32LE(total, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(jsonBuf.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const parts = [hdr, jh, jsonBuf];
  if (binPadded) {
    const bh = Buffer.alloc(8);
    bh.writeUInt32LE(binPadded.length, 0);
    bh.writeUInt32LE(0x004e4942, 4);
    parts.push(bh, binPadded);
  }
  return Buffer.concat(parts);
}

// ── Quaternion helpers (glTF [x,y,z,w]) ──────────────────────────

function qMul(a, b) {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

function rotVec3(v, q) {
  const qc = [-q[0], -q[1], -q[2], q[3]];
  const r = qMul(qMul(q, [v[0], v[1], v[2], 0]), qc);
  return [r[0], r[1], r[2]];
}

// ── Accessor read / write ────────────────────────────────────────

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

function writeF(bin, info, vals) {
  for (let i = 0; i < vals.length; i++)
    for (let j = 0; j < info.cc; j++)
      bin.writeFloatLE(vals[i][j], info.off + i * info.stride + j * 4);
}

// ── Process one GLB ──────────────────────────────────────────────

function processGlb(inPath, outPath) {
  const raw = fs.readFileSync(inPath);
  const { gltf, bin } = parseGlb(raw);
  if (!bin) throw new Error("No binary chunk");

  // Detect root node
  const rootIdx = gltf.scenes[0].nodes[0];
  const rootNode = gltf.nodes[rootIdx];

  // Check if already processed (root has identity transform AND no animation scale curve on root)
  const hasRot = rootNode.rotation && rootNode.rotation.some((v, i) => Math.abs(v - [0, 0, 0, 1][i]) > 0.001);
  const hasScale = rootNode.scale && rootNode.scale.some((v) => Math.abs(v - 1) > 0.001);

  // Also check for root animation scale curves with non-identity values
  let hasRootAnimScale = false;
  if (gltf.animations) {
    for (const anim of gltf.animations) {
      for (const ch of anim.channels) {
        if (ch.target.node === rootIdx && ch.target.path === "scale") {
          const samp = anim.samplers[ch.sampler];
          const info = accInfo(gltf, samp.output);
          if (info.acc.componentType === 5126) {
            const vals = readF(bin, info);
            for (const v of vals) {
              if (Math.abs(v[0] - 1) > 0.001 || Math.abs(v[1] - 1) > 0.001 || Math.abs(v[2] - 1) > 0.001) {
                hasRootAnimScale = true;
                break;
              }
            }
          }
        }
      }
    }
  }

  if (!hasRot && !hasScale && !hasRootAnimScale) {
    console.log(`  SKIP ${path.basename(inPath)} (already in meters/Y-up)`);
    return "skip";
  }

  // Extract root rotation and scale from the actual root node values
  const rootRot = rootNode.rotation || [0, 0, 0, 1];
  const rootScale = rootNode.scale ? rootNode.scale[0] : 1; // uniform

  // Direct children of root (bone nodes only)
  const rootKids = new Set(rootNode.children || []);
  const rootBoneKids = new Set();
  for (const ci of rootKids) {
    const cn = gltf.nodes[ci];
    // Skip mesh-only nodes (e.g., AXPreviewProxy_Humanoid)
    if (cn.mesh !== undefined && !cn.children) continue;
    rootBoneKids.add(ci);
  }

  // ── Transform animation curves ──────────────────────────────
  if (gltf.animations) {
    for (const anim of gltf.animations) {
      for (const ch of anim.channels) {
        const ni = ch.target.node;
        const prop = ch.target.path;
        const samp = anim.samplers[ch.sampler];
        const info = accInfo(gltf, samp.output);

        // Verify FLOAT component type
        if (info.acc.componentType !== 5126) continue;

        if (prop === "translation") {
          const vals = readF(bin, info);
          if (rootBoneKids.has(ni)) {
            // Direct child of root: rotate + scale
            for (let i = 0; i < vals.length; i++) {
              const s = [vals[i][0] * rootScale, vals[i][1] * rootScale, vals[i][2] * rootScale];
              vals[i] = rotVec3(s, rootRot);
            }
          } else if (ni !== rootIdx) {
            // Deeper bone: just scale
            for (let i = 0; i < vals.length; i++) {
              vals[i] = [vals[i][0] * rootScale, vals[i][1] * rootScale, vals[i][2] * rootScale];
            }
          }
          writeF(bin, info, vals);
          // Update min/max
          if (info.acc.min && info.acc.max) {
            const mn = [Infinity, Infinity, Infinity];
            const mx = [-Infinity, -Infinity, -Infinity];
            for (const v of vals) { for (let j = 0; j < 3; j++) { mn[j] = Math.min(mn[j], v[j]); mx[j] = Math.max(mx[j], v[j]); } }
            info.acc.min = mn;
            info.acc.max = mx;
          }
        }

        if (prop === "rotation" && rootBoneKids.has(ni)) {
          const vals = readF(bin, info);
          for (let i = 0; i < vals.length; i++)
            vals[i] = qMul(rootRot, vals[i]);
          writeF(bin, info, vals);
          if (info.acc.min && info.acc.max) {
            const mn = [Infinity, Infinity, Infinity, Infinity];
            const mx = [-Infinity, -Infinity, -Infinity, -Infinity];
            for (const v of vals) { for (let j = 0; j < 4; j++) { mn[j] = Math.min(mn[j], v[j]); mx[j] = Math.max(mx[j], v[j]); } }
            info.acc.min = mn;
            info.acc.max = mx;
          }
        }

        // Neutralize root node curves: scale→[1,1,1], rotation→identity, translation→[0,0,0]
        if (ni === rootIdx) {
          if (prop === "scale") {
            const vals = readF(bin, info);
            for (let i = 0; i < vals.length; i++) vals[i] = [1, 1, 1];
            writeF(bin, info, vals);
            if (info.acc.min) info.acc.min = [1, 1, 1];
            if (info.acc.max) info.acc.max = [1, 1, 1];
          }
          if (prop === "rotation") {
            const vals = readF(bin, info);
            for (let i = 0; i < vals.length; i++) vals[i] = [0, 0, 0, 1];
            writeF(bin, info, vals);
            if (info.acc.min) info.acc.min = [0, 0, 0, 1];
            if (info.acc.max) info.acc.max = [0, 0, 0, 1];
          }
          if (prop === "translation") {
            const vals = readF(bin, info);
            for (let i = 0; i < vals.length; i++) vals[i] = [0, 0, 0];
            writeF(bin, info, vals);
            if (info.acc.min) info.acc.min = [0, 0, 0];
            if (info.acc.max) info.acc.max = [0, 0, 0];
          }
        }
      }
    }
  }

  // ── Fix rest-pose node transforms ───────────────────────────
  for (let i = 0; i < gltf.nodes.length; i++) {
    const nd = gltf.nodes[i];
    delete nd.mesh;
    delete nd.skin;

    if (i === rootIdx) {
      delete nd.rotation;
      delete nd.scale;
      delete nd.translation;
      delete nd.matrix;
      continue;
    }

    if (rootBoneKids.has(i)) {
      if (nd.translation) {
        const s = [nd.translation[0] * rootScale, nd.translation[1] * rootScale, nd.translation[2] * rootScale];
        nd.translation = rotVec3(s, rootRot);
      }
      if (nd.rotation) nd.rotation = qMul(rootRot, nd.rotation);
    } else {
      if (nd.translation) {
        nd.translation = [nd.translation[0] * rootScale, nd.translation[1] * rootScale, nd.translation[2] * rootScale];
      }
    }
  }

  // ── Strip mesh / skin / material data ───────────────────────
  delete gltf.meshes;
  delete gltf.skins;
  delete gltf.materials;
  delete gltf.textures;
  delete gltf.images;

  const out = writeGlb(gltf, bin);
  fs.writeFileSync(outPath, out);

  const inMB = (raw.length / 1048576).toFixed(2);
  const outMB = (out.length / 1048576).toFixed(2);
  console.log(`  OK   ${path.basename(inPath)}: ${inMB} → ${outMB} MB`);
  return "ok";
}

// ── Main ─────────────────────────────────────────────────────────

const dir = process.argv[2] || path.resolve(__dirname, "../playcanvas-app/assets/animations");
if (!fs.existsSync(dir)) { console.error("Directory not found:", dir); process.exit(1); }

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".glb"));
console.log(`Processing ${files.length} animation GLBs in ${dir}\n`);

let ok = 0, skip = 0, fail = 0;
for (const f of files) {
  const fp = path.join(dir, f);
  try {
    const r = processGlb(fp, fp);
    if (r === "skip") skip++;
    else ok++;
  } catch (e) {
    console.error(`  FAIL ${f}: ${e.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} fixed, ${skip} skipped, ${fail} failed.`);
if (fail > 0) process.exit(1);
