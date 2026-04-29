// Deep audit of meili_hair and gail_top mesh/skin coverage
const fs = require("fs");

function glbJson(p) {
  const b = fs.readFileSync(p);
  const cl = b.readUInt32LE(12);
  return JSON.parse(b.slice(20, 20 + cl).toString("utf8"));
}

function auditMeshes(label, p) {
  const j = glbJson(p);
  const nodes = j.nodes || [];
  const meshes = j.meshes || [];
  const skins = j.skins || [];

  console.log("\n=== " + label + " ===");
  console.log("  Nodes: " + nodes.length + "  Meshes: " + meshes.length + "  Skins: " + skins.length);

  // For every node that has a mesh, check if it also has a skin
  const meshNodes = nodes.filter(function(n) { return n.mesh !== undefined; });
  console.log("  Mesh-bearing nodes (" + meshNodes.length + "):");
  meshNodes.forEach(function(n) {
    const hasSkin = n.skin !== undefined;
    const meshName = meshes[n.mesh] ? (meshes[n.mesh].name || "mesh_" + n.mesh) : "?";
    const primCount = meshes[n.mesh] ? (meshes[n.mesh].primitives || []).length : 0;
    console.log("    [" + (hasSkin ? "SKINNED" : "NO-SKIN") + "] node=" + n.name + "  mesh=" + meshName + "  prims=" + primCount);
  });

  if (skins.length > 0) {
    const s = skins[0];
    const joints = s.joints || [];
    const boneNames = joints.map(function(ji) { return nodes[ji] ? nodes[ji].name : "?"; });
    // Check arm/wrist bones
    const armBones = boneNames.filter(function(b) {
      return b.match(/forearm|wrist|ForeArm|Wrist|lForeArm|rForeArm|Hand|hand/i);
    });
    console.log("  Arm/wrist bones in skin: " + (armBones.join(", ") || "NONE"));
    // Check head/neck bones
    const headBones = boneNames.filter(function(b) {
      return b.match(/head|neck|skull|Head|Neck/i);
    });
    console.log("  Head/neck bones in skin: " + (headBones.join(", ") || "NONE"));
  }
}

auditMeshes("meili_hair", "playcanvas-app/assets/gail_lite/hair/meili_hair/meili_hair.glb");
auditMeshes("gail_top (sweater)", "playcanvas-app/assets/gail_lite/clothes/gail_top/gail_top.glb");
