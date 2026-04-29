/**
 * lib/strip-fix.js
 *
 * Transforms an animation GLB from DAZ centimeter/Z-up space
 * to meter/Y-up space, AND strips all embedded mesh/skin/material
 * data — leaving a clean, animation-only GLB.
 *
 * What it does (in one pass over the binary buffer):
 *
 *  1. Reads the root node ("Victoria 8" or whatever scene root is)
 *  2. Bakes the root rotation (Z-up → Y-up, 90° X) and scale (0.01, cm→m)
 *     into every bone's rest-pose transform and animation curves.
 *  3. Sets root rest-pose to identity.
 *  4. Neutralises any animation curves on the root node (→ identity).
 *  5. Deletes meshes, skins, materials, textures, images from the JSON.
 *  6. Compacts the binary buffer to remove orphaned data.
 *  7. Returns the new GLB as a Buffer (no disk I/O here).
 *
 * ──────────────── coordinate maths background ────────────────────
 *
 *  DAZ exports a Victoria 8 rig with Z-up, centimeter units.
 *  The GLB root node carries the correction transform:
 *    rotation = [0.7071068, 0, 0, 0.7071068]   (90° around X)
 *    scale    = [0.01, 0.01, 0.01]              (cm → m)
 *
 *  Three.js / PlayCanvas want Y-up, metre units with an identity root.
 *  Baking the root into the bones gives exactly that.
 *
 *  For a direct child of root:
 *    new_translation = rotVec3(oldT * rootScale, rootRot)
 *    new_rotation    = qMul(rootRot, oldQ)
 *    # grand-children and deeper: only scale, no rotation bake
 *    new_translation = oldT * rootScale
 *
 *  Animation curves on direct root-children get the same treatment
 *  for each keyframe.
 * ─────────────────────────────────────────────────────────────────
 */

"use strict";

const { parseGlb, writeGlb, accInfo, readF, writeF, compactBinaryBuffer } = require("./glb");

// ── Quaternion helpers (glTF convention: [x, y, z, w]) ────────────

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
  // sandwich product: q * [v,0] * q*
  const qc = [-q[0], -q[1], -q[2], q[3]];
  const r   = qMul(qMul(q, [v[0], v[1], v[2], 0]), qc);
  return [r[0], r[1], r[2]];
}

// ── Core transform ────────────────────────────────────────────────

/**
 * Strip-and-fix an animation GLB.
 * Accepts either a Buffer (in-memory) or an absolute file path (string).
 *
 * @param {Buffer|string} input          - source data or path
 * @param {object}        [opts]
 * @param {boolean}       [opts.skipIfAlreadyFixed=true]
 *        If the root is already identity and there are no non-id anim curves,
 *        return the original buffer unchanged (no extra disk writes).
 * @returns {{ buf: Buffer, status: 'ok'|'skip'|'error', message: string }}
 */
function stripFix(input, opts) {
  const options = Object.assign({ skipIfAlreadyFixed: true }, opts);

  // ── Load ──────────────────────────────────────────────────────
  let raw;
  try {
    if (Buffer.isBuffer(input)) {
      raw = input;
    } else {
      const fs = require("fs");
      raw = fs.readFileSync(input);
    }
  } catch (e) {
    return { buf: null, status: "error", message: `Cannot read input: ${e.message}` };
  }

  let gltf, bin;
  try {
    ({ gltf, bin } = parseGlb(raw));
  } catch (e) {
    return { buf: null, status: "error", message: `Cannot parse GLB: ${e.message}` };
  }

  if (!bin) {
    return { buf: raw, status: "error", message: "GLB has no binary chunk" };
  }

  // ── Find root ─────────────────────────────────────────────────
  const rootIdx  = gltf.scenes[0].nodes[0];
  const rootNode = gltf.nodes[rootIdx];

  // ── Already-fixed detection ──────────────────────────────────
  const hasNonIdRot   = rootNode.rotation && rootNode.rotation.some(
    (v, i) => Math.abs(v - [0, 0, 0, 1][i]) > 0.001);
  const hasNonIdScale = rootNode.scale && rootNode.scale.some(v => Math.abs(v - 1) > 0.001);

  let rootAnimScaleNonId = false;
  if (gltf.animations) {
    outer: for (const anim of gltf.animations) {
      for (const ch of anim.channels) {
        if (ch.target.node !== rootIdx || ch.target.path !== "scale") continue;
        const samp = anim.samplers[ch.sampler];
        let info;
        try { info = accInfo(gltf, samp.output); } catch(e) { continue; }
        if (info.acc.componentType !== 5126) continue;
        const vals = readF(bin, info);
        for (const v of vals) {
          if (Math.abs(v[0]-1)>0.001 || Math.abs(v[1]-1)>0.001 || Math.abs(v[2]-1)>0.001) {
            rootAnimScaleNonId = true;
            break outer;
          }
        }
      }
    }
  }

  const alreadyFixed = !hasNonIdRot && !hasNonIdScale && !rootAnimScaleNonId;
  if (alreadyFixed && options.skipIfAlreadyFixed) {
    // Still strip mesh data if present
    const meshCount = (gltf.meshes || []).length;
    if (meshCount === 0) {
      return { buf: raw, status: "skip", message: "Already in meters/Y-up, no mesh to strip" };
    }
    // Fall through to strip mesh but skip baking
  }

  // ── Extract root bake params ──────────────────────────────────
  const rootRot   = rootNode.rotation || [0, 0, 0, 1];
  const rootScale = rootNode.scale ? rootNode.scale[0] : 1; // uniform

  // Identify direct children of the root node that are skeleton bones
  const rootKids     = new Set(rootNode.children || []);
  const rootBoneKids = new Set();
  for (const ci of rootKids) {
    const cn = gltf.nodes[ci];
    // Skip pure mesh nodes (mesh reference but no children)
    if (cn.mesh !== undefined && !(cn.children && cn.children.length > 0)) continue;
    rootBoneKids.add(ci);
  }

  // ── Bake animation curves ─────────────────────────────────────
  if (!alreadyFixed && gltf.animations) {
    for (const anim of gltf.animations) {
      for (const ch of anim.channels) {
        const ni   = ch.target.node;
        const prop = ch.target.path;
        const samp = anim.samplers[ch.sampler];
        let info;
        try { info = accInfo(gltf, samp.output); } catch(e) { continue; }
        if (info.acc.componentType !== 5126) continue;

        if (prop === "translation") {
          const vals = readF(bin, info);
          if (rootBoneKids.has(ni)) {
            // direct root child: rotate + scale
            for (let i = 0; i < vals.length; i++) {
              const s = vals[i].map(c => c * rootScale);
              vals[i] = rotVec3(s, rootRot);
            }
          } else if (ni !== rootIdx) {
            // deeper bone: scale only
            for (let i = 0; i < vals.length; i++)
              vals[i] = vals[i].map(c => c * rootScale);
          }
          writeF(bin, info, vals);
          _updateMinMax(info.acc, vals);
        }

        if (prop === "rotation" && rootBoneKids.has(ni)) {
          const vals = readF(bin, info);
          for (let i = 0; i < vals.length; i++)
            vals[i] = qMul(rootRot, vals[i]);
          writeF(bin, info, vals);
          _updateMinMax(info.acc, vals);
        }

        // Neutralise root node curves
        if (ni === rootIdx) {
          const vals = readF(bin, info);
          if (prop === "scale") {
            for (let i = 0; i < vals.length; i++) vals[i] = [1, 1, 1];
            if (info.acc.min) info.acc.min = [1, 1, 1];
            if (info.acc.max) info.acc.max = [1, 1, 1];
          }
          if (prop === "rotation") {
            for (let i = 0; i < vals.length; i++) vals[i] = [0, 0, 0, 1];
            if (info.acc.min) info.acc.min = [0, 0, 0, 1];
            if (info.acc.max) info.acc.max = [0, 0, 0, 1];
          }
          if (prop === "translation") {
            for (let i = 0; i < vals.length; i++) vals[i] = [0, 0, 0];
            if (info.acc.min) info.acc.min = [0, 0, 0];
            if (info.acc.max) info.acc.max = [0, 0, 0];
          }
          writeF(bin, info, vals);
        }
      }
    }
  }

  // ── Bake rest-pose node transforms ───────────────────────────
  if (!alreadyFixed) {
    for (let i = 0; i < gltf.nodes.length; i++) {
      const nd = gltf.nodes[i];

      // Always remove mesh/skin references from nodes
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
          const s = nd.translation.map(c => c * rootScale);
          nd.translation = rotVec3(s, rootRot);
        }
        if (nd.rotation) nd.rotation = qMul(rootRot, nd.rotation);
      } else {
        // deeper nodes: scale only
        if (nd.translation)
          nd.translation = nd.translation.map(c => c * rootScale);
        // remove mesh/skin already done above
      }
    }
  } else {
    // Already fixed — just strip mesh/skin node refs
    for (const nd of gltf.nodes) {
      delete nd.mesh;
      delete nd.skin;
    }
  }

  // ── Strip mesh / skin / material data from JSON ───────────────
  delete gltf.meshes;
  delete gltf.skins;
  delete gltf.materials;
  delete gltf.textures;
  delete gltf.images;
  // Samplers (the texture sampler kind, not animation) can also go
  if (gltf.samplers && gltf.animations) {
    // Keep samplers array if it may also hold animation samplers
    // (GLTF has separate gltf.samplers for texture samplers;
    //  animation samplers live in gltf.animations[n].samplers)
    delete gltf.samplers;
  }

  // ── Compact binary buffer ─────────────────────────────────────
  // Remove accessors / bufferViews for skin weights, joint indices,
  // vertex positions, normals, UVs — anything that was only used by mesh.
  // We only keep bufferViews that are still referenced by remaining accessors.
  // Animation accessors still reference their bufferViews; those are kept.
  const compactedBin = compactBinaryBuffer(gltf, bin);

  const outBuf = writeGlb(gltf, compactedBin.length > 0 ? compactedBin : null);
  return { buf: outBuf, status: "ok", message: "Strip-fix complete" };
}

// ── Helper ────────────────────────────────────────────────────────

function _updateMinMax(acc, vals) {
  if (!acc.min || !acc.max) return;
  const n  = vals[0].length;
  const mn = new Array(n).fill(Infinity);
  const mx = new Array(n).fill(-Infinity);
  for (const v of vals) {
    for (let j = 0; j < n; j++) {
      if (v[j] < mn[j]) mn[j] = v[j];
      if (v[j] > mx[j]) mx[j] = v[j];
    }
  }
  acc.min = mn;
  acc.max = mx;
}

module.exports = { stripFix };
