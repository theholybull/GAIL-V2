// Audit gail_top and meili_hair vs body skeleton bone names
const fs = require("fs");

function glbJson(p) {
  const b = fs.readFileSync(p);
  const cl = b.readUInt32LE(12);
  return JSON.parse(b.slice(20, 20 + cl).toString("utf8"));
}

function getNodeIndex(nodes, name) {
  return nodes.findIndex(function(n) { return n.name === name; });
}

function auditSkin(label, p) {
  const j = glbJson(p);
  const nodes = j.nodes || [];
  console.log("\n=== " + label + " ===");

  if (!j.skins || j.skins.length === 0) {
    console.log("  No skins.");
    return [];
  }

  const skin = j.skins[0];
  const joints = skin.joints || [];
  const boneNames = joints.map(function(ji) { return nodes[ji] ? nodes[ji].name : "?"; });
  console.log("  Joint count: " + boneNames.length);
  console.log("  First 10: " + boneNames.slice(0, 10).join(", "));
  return boneNames;
}

// Load body bone names
const bodyBones = auditSkin("gail body (gail_lite)", "playcanvas-app/assets/gail_lite/avatar/base_face/gail_base_avatar.glb");

// Load top bone names
const topBones = auditSkin("gail_top (sweater)", "playcanvas-app/assets/gail_lite/clothes/gail_top/gail_top.glb");
const pantsBones = auditSkin("gail_pants", "playcanvas-app/assets/gail_lite/clothes/gail_pants/gail_pants.glb");
const hairBones = auditSkin("meili_hair", "playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb");

// Find bones in top that are NOT in body
console.log("\n=== Bones in gail_top NOT in body skeleton ===");
const missing = topBones.filter(function(b) { return !bodyBones.includes(b); });
if (missing.length === 0) { console.log("  None (all match)"); }
else { missing.forEach(function(b) { console.log("  MISSING: " + b); }); }

console.log("\n=== Bones in meili_hair NOT in body skeleton ===");
const missingHair = hairBones.filter(function(b) { return !bodyBones.includes(b); });
if (missingHair.length === 0) { console.log("  None (all match)"); }
else { missingHair.forEach(function(b) { console.log("  MISSING: " + b); }); }

// Check eyebrow/eyelash node status (these should be parented to head bone)
const bodyJ = glbJson("playcanvas-app/assets/gail_lite/avatar/base_face/gail_base_avatar.glb");
const bodyNodes = bodyJ.nodes || [];
console.log("\n=== gail body non-bone mesh nodes ===");
const sceneRootIdx = (bodyJ.scenes[bodyJ.scene || 0].nodes || [])[0];
const sceneRoot = bodyNodes[sceneRootIdx];
(sceneRoot.children || []).forEach(function(ci) {
  const c = bodyNodes[ci];
  if (c.name !== "hip") {
    const childCount = (c.children || []).length;
    const hasMesh = c.mesh !== undefined;
    console.log("  Node: " + c.name + " (mesh=" + hasMesh + " children=" + childCount + ")");
  }
});
