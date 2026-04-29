// Temporary bone audit script - safe to delete after use
const fs = require("fs");

function glbJson(p) {
  const b = fs.readFileSync(p);
  const cl = b.readUInt32LE(12);
  return JSON.parse(b.slice(20, 20 + cl).toString("utf8"));
}

function auditAvatar(label, p) {
  const j = glbJson(p);
  const nodes = j.nodes || [];
  const scene = (j.scenes || [])[j.scene || 0] || {};
  const roots = scene.nodes || [];

  console.log("\n=== AVATAR: " + label + " ===");
  roots.forEach(function (ri) {
    const r = nodes[ri];
    console.log("  ROOT[" + ri + "]: " + r.name);
    (r.children || []).forEach(function (ci) {
      const c = nodes[ci];
      console.log("    child[" + ci + "]: " + c.name);
      (c.children || []).slice(0, 3).forEach(function (gi) {
        console.log("      grandchild[" + gi + "]: " + nodes[gi].name);
      });
    });
  });

  if (j.skins && j.skins.length > 0) {
    const joints = j.skins[0].joints || [];
    console.log("  Skin joints count: " + joints.length);
    console.log("  First skin joint: " + nodes[joints[0]].name);
  }
}

function auditAnim(label, p) {
  const j = glbJson(p);
  const nodes = j.nodes || [];
  const anims = j.animations || [];

  console.log("\n=== ANIM: " + label + " ===");
  if (anims.length === 0) { console.log("  No animations!"); return; }

  const anim = anims[0];
  console.log("  Anim[0] name: " + (anim.name || "(unnamed)") + "  channels: " + anim.channels.length);

  // Collect all unique targeted node names
  const targeted = new Set();
  (anim.channels || []).forEach(function (ch) {
    const n = nodes[ch.target.node];
    if (n) targeted.add(n.name + "/" + ch.target.path);
  });
  // Print first 10
  const targetArr = Array.from(targeted).slice(0, 10);
  console.log("  First 10 targeted nodes:");
  targetArr.forEach(function (t) { console.log("    " + t); });

  // Find which node has no animation targeting of a parent (i.e. the root of the anim)
  // Simple: look for "Victoria 8" or "hip" node channels
  const hipChannels = Array.from(targeted).filter(function (t) {
    return t.startsWith("hip/") || t.startsWith("Victoria 8/") || t.startsWith("pelvis/");
  });
  console.log("  Hip/root channels: " + (hipChannels.join(", ") || "NONE FOUND"));
}

const base = "playcanvas-app/assets/";
auditAvatar("gail_lite", base + "gail_lite/avatar/base_face/gail_base_avatar.glb");
auditAvatar("cherry", base + "gail/girlfriend/avatar/base_face/cherry_base_avatar.glb");
auditAvatar("vera", base + "gail/counselor/avatar/base_face/vera_base_avatar.glb");

auditAnim("idle.glb", base + "animations/idle.glb");
auditAnim("idle_base_v1.glb", base + "animations/idle_base_v1.glb");
auditAnim("talk_base_v1.glb", base + "animations/talk_base_v1.glb");
auditAnim("listen_base_v1.glb", base + "animations/listen_base_v1.glb");
