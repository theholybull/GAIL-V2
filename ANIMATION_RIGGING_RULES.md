# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  ⚠️  ANIMATION RIGGING RULES — READ BEFORE TOUCHING ANIMATIONS  ⚠️         ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# There are 1,892 pre-converted animation GLB clips at:
#
#     D:\Gail\data\animation_viewer\animations\
#
# These are ANIMATION-ONLY (skeleton + keyframes). NO mesh. NO textures.
# Each clip is ~1.7 MB. They drive the base avatar at runtime.
#
# RULE 1: Animation GLBs must NOT contain mesh or texture data.
# RULE 2: If an animation GLB is larger than 5 MB, it has mesh baked in — FIX IT.
# RULE 3: The base avatar loads ONCE. Animations swap via the PlayCanvas anim system.
# RULE 4: The Blender Export Addon merges DAZ rig → animation rig. Use it.
# RULE 5: NEVER create 370 MB animation files. That means the full avatar is baked in.
#
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  ANIMATION LAWS — enforced by tools/validate-animation-glbs.js             ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# LAW 1: Root node REST-POSE must be identity (no rotation, no scale).
#         The fix script bakes root transforms into bone curves.
#
# LAW 2: Root node ANIMATION CURVES must be identity.
#         scale=[1,1,1], rotation=[0,0,0,1], translation=[0,0,0].
#         A non-identity root scale curve (e.g. 0.01) leaks onto the hip
#         via PlayCanvas's findByPath([]) → this path resolution, collapsing
#         the avatar to a 5mm ball. This was the April 2026 "disappearing body" bug.
#
# LAW 3: Hip rest-pose translation must be in meters, Y-up.
#         Y ≈ 1.0 – 1.2. If Y > 50, coordinates are still in centimeters.
#
# LAW 4: All required body bones must be present by name.
#         hip, pelvis, abdomenLower, abdomenUpper, chestLower, chestUpper,
#         neckLower, neckUpper, head, lCollar, rCollar, etc.
#
# LAW 5: Clothing/hair GLBs share the same skeleton as the body.
#         At runtime, their skin instances are re-resolved to point to
#         the body's animated skeleton via bindGarmentToSkeleton().
#         Without re-binding, clothing stays frozen in T-pose.
#
# PIPELINE:
#   1. Raw animations from DAZ/Blender go through fix-animation-coordinate-space.js
#   2. validate-animation-glbs.js runs during build (build-playcanvas-app.ps1)
#   3. If validation fails, the build stops — fix before deploying.
#
# See: data/animation_viewer/ANIMATION_LIBRARY_README.md for full details.
