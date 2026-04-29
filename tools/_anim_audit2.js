// Audit actual animation files referenced in manifest + vera body bone dupes
const fs = require("fs");

function glbJson(p) {
  const b = fs.readFileSync(p);
  const cl = b.readUInt32LE(12);
  return JSON.parse(b.slice(20, 20 + cl).toString("utf8"));
}

function auditAnim(label, p) {
  const j = glbJson(p);
  const nodes = j.nodes || [];
  const anims = j.animations || [];

  console.log("\n=== ANIM: " + label + " ===");
  if (anims.length === 0) { console.log("  No animations!"); return; }

  const anim = anims[0];
  console.log("  Name: " + (anim.name || "(unnamed)") + "  channels: " + anim.channels.length);

  // Collect unique targeted node names
  const targeted = new Map(); // nodeName -> paths
  (anim.channels || []).forEach(function (ch) {
    const n = nodes[ch.target.node];
    if (n) {
      const name = n.name;
      if (!targeted.has(name)) targeted.set(name, []);
      targeted.get(name).push(ch.target.path);
    }
  });

  // Print nodes that are the "root" candidates
  const rootCandidates = Array.from(targeted.keys()).filter(function (k) {
    return k === "hip" || k === "Victoria 8" || k === "Genesis 8 Female" || k === "pelvis";
  });
  console.log("  Root/hip channels: " + JSON.stringify(rootCandidates));

  // Check Victoria 8 scale value
  if (targeted.has("Victoria 8")) {
    const scalerIdx = (anim.channels || []).find(function (ch) {
      return nodes[ch.target.node]?.name === "Victoria 8" && ch.target.path === "scale";
    });
    if (scalerIdx) {
      const sampler = anim.samplers[scalerIdx.sampler];
      const outputAccessor = j.accessors[sampler.output];
      console.log("  Victoria 8 scale accessor: type=" + outputAccessor.type + " count=" + outputAccessor.count);
      if (outputAccessor.min) console.log("  Victoria 8 scale min=" + outputAccessor.min);
      if (outputAccessor.max) console.log("  Victoria 8 scale max=" + outputAccessor.max);
    }
  }

  // Check hip translation Y range
  const hipTransCh = (anim.channels || []).find(function (ch) {
    return nodes[ch.target.node]?.name === "hip" && ch.target.path === "translation";
  });
  if (hipTransCh) {
    const sampler = anim.samplers[hipTransCh.sampler];
    const outputAccessor = j.accessors[sampler.output];
    console.log("  hip/translation accessor: type=" + outputAccessor.type + " count=" + outputAccessor.count);
    if (outputAccessor.min) console.log("  hip/translation min=" + JSON.stringify(outputAccessor.min));
    if (outputAccessor.max) console.log("  hip/translation max=" + JSON.stringify(outputAccessor.max));
  }
}

function auditVeraBones(p) {
  const j = glbJson(p);
  const nodes = j.nodes || [];
  // Count hip.xxx bones
  const hipNodes = nodes.filter(function (n) { return n.name && n.name.startsWith("hip"); });
  console.log("\n=== Vera hip bone duplicates ===");
  hipNodes.forEach(function (n) {
    const childCount = (n.children || []).length;
    console.log("  " + n.name + "  children:" + childCount);
  });

  // What skins exist?
  if (j.skins) {
    console.log("  Skin count: " + j.skins.length);
    j.skins.forEach(function (s, i) {
      console.log("  Skin[" + i + "] name=" + (s.name || "?") + " joints=" + s.joints.length + " first_joint=" + nodes[s.joints[0]].name);
    });
  }
}

const base = "playcanvas-app/assets/";
auditAnim("27775_stand_still (idle)", base + "animations/27775_stand_still.glb");
auditAnim("28154_explain (talk)", base + "animations/28154_explain.glb");
auditAnim("27299_stand_and_nod (listen)", base + "animations/27299_stand_and_nod.glb");
auditAnim("ack_nod_small_v1 (ack)", base + "animations/ack_nod_small_v1.glb");

auditVeraBones(base + "gail/counselor/avatar/base_face/vera_base_avatar.glb");
