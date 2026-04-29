/**
 * lib/validate.js
 *
 * Validates animation GLBs against the Gail Animation Laws.
 * Returns a structured result — never throws.
 *
 * Five laws (from ANIMATION_RIGGING_RULES.md):
 *
 *  LAW 1 — Root rest-pose must be identity
 *           Root node must NOT have a non-identity rotation or scale.
 *           (Victoria 8 DAZ exports have rotation=90°X, scale=0.01 —
 *            those must be baked in via fix-strip before import.)
 *
 *  LAW 2 — Root animation curves must be identity
 *           Any keyframe curves on the root node must emit only
 *           identity values (scale=[1,1,1], rot=[0,0,0,1], trans=[0,0,0])
 *           so the avatar doesn't get globally scaled/rotated.
 *
 *  LAW 3 — Hip Y must be in meters / Y-up space
 *           Hip.translation.y must be in [0.5, 2.0].
 *           A value > 50 indicates centimeter space (not fixed yet).
 *
 *  LAW 4 — Required bones must be present
 *           All bones in REQUIRED_BONES must appear in gltf.nodes by name.
 *
 *  LAW 5 — Must have at least one animation
 *           gltf.animations must be non-empty.
 *
 * Additionally, we report advisory information that the UI uses:
 *  - needsCoordFix  (root non-identity → run fix-animation-coordinate-space)
 *  - needsMeshStrip (has more than 0 meshes with significant data)
 *  - sizeMB, meshCount, skinCount, nodeCount, animCount, channelCount
 */

"use strict";

const fs   = require("fs");
const path = require("path");
const { parseGlb, accInfo, readF } = require("./glb");

// ── Required bone names ───────────────────────────────────────────

const REQUIRED_BONES = [
  "hip", "pelvis",
  "abdomenLower", "abdomenUpper",
  "chestLower", "chestUpper",
  "neckLower", "neckUpper", "head",
  "lCollar", "lShldrBend",
  "rCollar", "rShldrBend",
  "lThighBend", "lShin", "lFoot",
  "rThighBend", "rShin", "rFoot",
];

// ── Result shape ─────────────────────────────────────────────────

/**
 * @typedef {Object} LawResult
 * @property {boolean} pass
 * @property {string[]} issues  - human-readable problem descriptions
 */

/**
 * @typedef {Object} ValidationResult
 * @property {string}   name           - basename of the file
 * @property {string}   filePath       - absolute path
 * @property {number}   sizeMB         - file size in megabytes
 * @property {boolean}  valid          - true iff all laws pass
 * @property {boolean}  needsCoordFix  - root is non-identity (run fix-strip first)
 * @property {boolean}  needsMeshStrip - non-zero mesh count
 * @property {number}   meshCount
 * @property {number}   skinCount
 * @property {number}   nodeCount
 * @property {number}   animCount
 * @property {number}   channelCount
 * @property {Object}   laws           - { law1, law2, law3, law4, law5 } each a LawResult
 * @property {string[]} errors         - aggregated from failing laws
 * @property {string[]} warnings
 */

// ── Public: validate a single file ───────────────────────────────

/**
 * Validate a GLB file and return a ValidationResult.
 * Never throws — file errors are captured in errors[].
 * @param {string} filePath
 * @returns {ValidationResult}
 */
function validateGlb(filePath) {
  const name     = path.basename(filePath);
  const warnings = [];

  const makeLaw = () => ({ pass: true, issues: [] });
  const laws = {
    law1: makeLaw(), // root rest-pose identity
    law2: makeLaw(), // root anim curves identity
    law3: makeLaw(), // hip Y in meters
    law4: makeLaw(), // required bones present
    law5: makeLaw(), // has animation
  };

  const fail = (law, msg) => {
    laws[law].pass = false;
    laws[law].issues.push(msg);
  };

  // ── File read ───────────────────────────────────────────────
  let stat;
  try { stat = fs.statSync(filePath); }
  catch (e) {
    return _errorResult(filePath, `Cannot stat file: ${e.message}`);
  }
  const sizeMB = stat.size / 1048576;

  let gltf, bin;
  try {
    const raw = fs.readFileSync(filePath);
    ({ gltf, bin } = parseGlb(raw));
  } catch (e) {
    return _errorResult(filePath, `Cannot parse GLB: ${e.message}`);
  }

  if (!bin) {
    return _errorResult(filePath, "GLB has no binary chunk");
  }

  // ── Structural counts ───────────────────────────────────────
  const meshCount    = (gltf.meshes    || []).length;
  const skinCount    = (gltf.skins     || []).length;
  const nodeCount    = (gltf.nodes     || []).length;
  const animCount    = (gltf.animations || []).length;
  const channelCount = (gltf.animations || []).reduce(
    (sum, a) => sum + (a.channels || []).length, 0);

  // ── Find root and hip nodes ─────────────────────────────────
  const rootIdx = gltf.scenes?.[0]?.nodes?.[0];
  if (rootIdx === undefined) {
    return _errorResult(filePath, "No root node in scene.nodes[0]");
  }
  const rootNode = gltf.nodes[rootIdx];
  const nodeNames = gltf.nodes.map(n => n.name || "");
  const hipIdx    = nodeNames.indexOf("hip");

  // ── LAW 1: Root rest-pose must be identity ──────────────────
  const rootRot = rootNode.rotation;
  const rootSca = rootNode.scale;
  if (rootRot) {
    const [x, y, z, w] = rootRot;
    const isId = Math.abs(x) < 0.001 && Math.abs(y) < 0.001 &&
                 Math.abs(z) < 0.001 && Math.abs(w - 1) < 0.001;
    if (!isId) {
      fail("law1", `Root rest-pose rotation [${rootRot.map(v => v.toFixed(4))}] ≠ identity [0,0,0,1]`);
    }
  }
  if (rootSca) {
    const [sx, sy, sz] = rootSca;
    const isId = Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001 && Math.abs(sz - 1) < 0.001;
    if (!isId) {
      fail("law1", `Root rest-pose scale [${rootSca.map(v => v.toFixed(4))}] ≠ [1,1,1]`);
    }
  }

  // ── LAW 2: Root animation curves must be identity ───────────
  if (gltf.animations) {
    for (const anim of gltf.animations) {
      for (const ch of anim.channels) {
        if (ch.target.node !== rootIdx) continue;
        const prop  = ch.target.path;
        const samp  = anim.samplers[ch.sampler];
        let info;
        try { info = accInfo(gltf, samp.output); }
        catch (e) { warnings.push(`Cannot read accessor for ${prop}: ${e.message}`); continue; }
        if (info.acc.componentType !== 5126) continue; // only check FLOAT
        const vals = readF(bin, info);

        if (prop === "scale") {
          for (const v of vals) {
            if (Math.abs(v[0] - 1) > 0.001 || Math.abs(v[1] - 1) > 0.001 || Math.abs(v[2] - 1) > 0.001) {
              fail("law2", `Root scale curve value [${v.map(x => x.toFixed(4))}] ≠ [1,1,1]`);
              break;
            }
          }
        }
        if (prop === "rotation") {
          for (const v of vals) {
            if (Math.abs(v[0]) > 0.001 || Math.abs(v[1]) > 0.001 ||
                Math.abs(v[2]) > 0.001 || Math.abs(v[3] - 1) > 0.001) {
              fail("law2", `Root rotation curve value [${v.map(x => x.toFixed(4))}] ≠ [0,0,0,1]`);
              break;
            }
          }
        }
        if (prop === "translation") {
          for (const v of vals) {
            if (Math.abs(v[0]) > 0.01 || Math.abs(v[1]) > 0.01 || Math.abs(v[2]) > 0.01) {
              fail("law2", `Root translation curve value [${v.map(x => x.toFixed(4))}] ≠ [0,0,0]`);
              break;
            }
          }
        }
      }
    }
  }

  // ── LAW 3: Hip Y in meters ──────────────────────────────────
  if (hipIdx < 0) {
    fail("law3", "Node named 'hip' not found");
  } else {
    const hip = gltf.nodes[hipIdx];
    const t   = hip.translation || [0, 0, 0];
    if (t[1] < 0.5 || t[1] > 2.0) {
      if (t[1] > 50) {
        fail("law3", `Hip Y=${t[1].toFixed(2)} — still in centimeters (needs coord fix)`);
      } else {
        fail("law3", `Hip Y=${t[1].toFixed(4)} is outside expected range [0.5, 2.0] m`);
      }
    }
    if (Math.abs(t[2]) > 0.5) {
      warnings.push(`Hip Z=${t[2].toFixed(4)} is large — may indicate Z-up space`);
    }
  }

  // ── LAW 4: Required bones present ──────────────────────────
  const nameSet = new Set(nodeNames);
  const missing = REQUIRED_BONES.filter(b => !nameSet.has(b));
  if (missing.length > 0) {
    fail("law4", `Missing required bones: ${missing.join(", ")}`);
  }

  // ── LAW 5: Has at least one animation ──────────────────────
  if (animCount === 0) {
    fail("law5", "No animations found in GLB");
  }

  // ── Aggregate ───────────────────────────────────────────────
  const errors = Object.values(laws).flatMap(l => l.issues);
  const valid  = errors.length === 0;

  // Advisory flags — root non-identity means fix-strip hasn't run yet
  const needsCoordFix  = !laws.law1.pass;
  const needsMeshStrip = meshCount > 0;

  return {
    name,
    filePath,
    sizeMB: parseFloat(sizeMB.toFixed(2)),
    valid,
    needsCoordFix,
    needsMeshStrip,
    meshCount,
    skinCount,
    nodeCount,
    animCount,
    channelCount,
    laws,
    errors,
    warnings,
  };
}

// ── Quick-validate from a Buffer (no disk read) ───────────────────

/**
 * Same as validateGlb but consumes an in-memory Buffer.
 * filePath is used only for display name.
 * @param {Buffer} buf
 * @param {string} [filePath]
 * @returns {ValidationResult}
 */
function validateBuffer(buf, filePath) {
  filePath = filePath || "<buffer>";
  const name     = path.basename(filePath);
  const sizeMB   = parseFloat((buf.length / 1048576).toFixed(2));
  const warnings = [];

  const makeLaw = () => ({ pass: true, issues: [] });
  const laws = {
    law1: makeLaw(),
    law2: makeLaw(),
    law3: makeLaw(),
    law4: makeLaw(),
    law5: makeLaw(),
  };

  const fail = (law, msg) => { laws[law].pass = false; laws[law].issues.push(msg); };

  let gltf, bin;
  try { ({ gltf, bin } = parseGlb(buf)); }
  catch (e) { return _errorResult(filePath, `Cannot parse GLB: ${e.message}`); }
  if (!bin) return _errorResult(filePath, "GLB has no binary chunk");

  const meshCount    = (gltf.meshes    || []).length;
  const skinCount    = (gltf.skins     || []).length;
  const nodeCount    = (gltf.nodes     || []).length;
  const animCount    = (gltf.animations || []).length;
  const channelCount = (gltf.animations || []).reduce(
    (sum, a) => sum + (a.channels || []).length, 0);

  const rootIdx = gltf.scenes?.[0]?.nodes?.[0];
  if (rootIdx === undefined) return _errorResult(filePath, "No root node");

  const rootNode  = gltf.nodes[rootIdx];
  const nodeNames = gltf.nodes.map(n => n.name || "");
  const hipIdx    = nodeNames.indexOf("hip");

  // LAW 1
  const rootRot = rootNode.rotation;
  const rootSca = rootNode.scale;
  if (rootRot) {
    const [x,y,z,w] = rootRot;
    if (!(Math.abs(x)<0.001 && Math.abs(y)<0.001 && Math.abs(z)<0.001 && Math.abs(w-1)<0.001))
      fail("law1", `Root rest-pose rotation [${rootRot.map(v=>v.toFixed(4))}] ≠ identity`);
  }
  if (rootSca) {
    const [sx,sy,sz] = rootSca;
    if (!(Math.abs(sx-1)<0.001 && Math.abs(sy-1)<0.001 && Math.abs(sz-1)<0.001))
      fail("law1", `Root rest-pose scale [${rootSca.map(v=>v.toFixed(4))}] ≠ [1,1,1]`);
  }

  // LAW 2
  if (gltf.animations) {
    for (const anim of gltf.animations) {
      for (const ch of anim.channels) {
        if (ch.target.node !== rootIdx) continue;
        const prop = ch.target.path;
        const samp = anim.samplers[ch.sampler];
        let info;
        try { info = accInfo(gltf, samp.output); } catch(e) { continue; }
        if (info.acc.componentType !== 5126) continue;
        const vals = readF(bin, info);
        if (prop === "scale") {
          for (const v of vals) {
            if (Math.abs(v[0]-1)>0.001||Math.abs(v[1]-1)>0.001||Math.abs(v[2]-1)>0.001) {
              fail("law2", `Root scale curve ≠ [1,1,1]`); break;
            }
          }
        }
        if (prop === "rotation") {
          for (const v of vals) {
            if (Math.abs(v[0])>0.001||Math.abs(v[1])>0.001||Math.abs(v[2])>0.001||Math.abs(v[3]-1)>0.001) {
              fail("law2", `Root rotation curve ≠ identity`); break;
            }
          }
        }
        if (prop === "translation") {
          for (const v of vals) {
            if (Math.abs(v[0])>0.01||Math.abs(v[1])>0.01||Math.abs(v[2])>0.01) {
              fail("law2", `Root translation curve ≠ [0,0,0]`); break;
            }
          }
        }
      }
    }
  }

  // LAW 3
  if (hipIdx < 0) {
    fail("law3", "Node 'hip' not found");
  } else {
    const t = gltf.nodes[hipIdx].translation || [0,0,0];
    if (t[1] < 0.5 || t[1] > 2.0) {
      fail("law3", `Hip Y=${t[1].toFixed(t[1]>50?0:4)}${t[1]>50?" (centimeters—needs fix)":""}`);
    }
    if (Math.abs(t[2]) > 0.5) warnings.push(`Hip Z=${t[2].toFixed(4)} large`);
  }

  // LAW 4
  const nameSet = new Set(nodeNames);
  const missing = REQUIRED_BONES.filter(b => !nameSet.has(b));
  if (missing.length > 0) fail("law4", `Missing bones: ${missing.join(", ")}`);

  // LAW 5
  if (animCount === 0) fail("law5", "No animations found");

  const errors         = Object.values(laws).flatMap(l => l.issues);
  const valid          = errors.length === 0;
  const needsCoordFix  = !laws.law1.pass;
  const needsMeshStrip = meshCount > 0;

  return {
    name, filePath, sizeMB, valid,
    needsCoordFix, needsMeshStrip,
    meshCount, skinCount, nodeCount, animCount, channelCount,
    laws, errors, warnings,
  };
}

// ── Internal helpers ──────────────────────────────────────────────

function _errorResult(filePath, msg) {
  const emptyLaw = { pass: false, issues: [msg] };
  return {
    name:           path.basename(filePath),
    filePath,
    sizeMB:         0,
    valid:          false,
    needsCoordFix:  false,
    needsMeshStrip: false,
    meshCount: 0, skinCount: 0, nodeCount: 0, animCount: 0, channelCount: 0,
    laws: { law1: emptyLaw, law2: { pass: true, issues: [] },
            law3: { pass: true, issues: [] }, law4: { pass: true, issues: [] },
            law5: { pass: true, issues: [] } },
    errors:   [msg],
    warnings: [],
  };
}

module.exports = { validateGlb, validateBuffer, REQUIRED_BONES };
