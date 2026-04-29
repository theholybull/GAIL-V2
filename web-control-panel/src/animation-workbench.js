import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  avatarAssets: [],
  clothingAssets: [],
  hairAssets: [],
  animAssets: [],
  libraryItems: [],
  selectedAvatar: null,
  selectedClothingItems: [],
  selectedHair: null,
  selectedAnim: null,
  sequence: [],
  activeJob: null,
  fps: 30,
  gapFrames: 12,
  // ── Import Library ──
  importCatalog:    [],      // CatalogEntry[]
  importCategory:   "all",  // active filter chip
  importSearch:     "",      // search text
  importLoading:    false,
  importedIds:      new Set(), // ids already promoted
};

// ── DOM refs ───────────────────────────────────────────────────────────────
const el = {
  avatarList:        document.getElementById("avatarList"),
  clothingList:      document.getElementById("clothingList"),
  hairList:          document.getElementById("hairList"),
  animList:          document.getElementById("animList"),
  animSearchInput:   document.getElementById("animSearchInput"),
  sequenceTrack:     document.getElementById("sequenceTrack"),
  trackEmpty:        document.getElementById("trackEmpty"),
  clearSequenceBtn:  document.getElementById("clearSequenceBtn"),
  sendToBlenderBtn:  document.getElementById("sendToBlenderBtn"),
  jobBadge:          document.getElementById("jobBadge"),
  stateBadge:        document.getElementById("stateBadge"),
  refreshBtn:        document.getElementById("refreshBtn"),
  fpsInput:          document.getElementById("fpsInput"),
  gapFramesInput:    document.getElementById("gapFramesInput"),
  viewportCanvas:    document.getElementById("viewportCanvas"),
  viewportWrap:      document.getElementById("viewportWrap"),
  activeSlotSummary: document.getElementById("activeSlotSummary"),
  viewportStatus:    document.getElementById("viewportStatus"),
  nowPlayingLabel:   document.getElementById("nowPlayingLabel"),
  toast:             document.getElementById("toast"),
  camDistanceInput:  document.getElementById("camDistanceInput"),
  camHeightInput:    document.getElementById("camHeightInput"),
  camOrbitInput:     document.getElementById("camOrbitInput"),
  // ── Import Library ──
  importCategoryChips:  document.getElementById("importCategoryChips"),
  importSearchInput:    document.getElementById("importSearchInput"),
  importLibraryList:    document.getElementById("importLibraryList"),
  importLibraryStatus:  document.getElementById("importLibraryStatus"),
  importRefreshBtn:     document.getElementById("importRefreshBtn"),
};

// ── Three.js viewport ──────────────────────────────────────────────────────
let scene, camera, renderer, controls, clock;
let avatarMixer = null;
let currentAnimAction = null;
const sceneLayerMap = {};       // layerId -> THREE.Group
const loader = new GLTFLoader();
const layerLoadToken = {};
const TRACK_NAME_RE = /^(.*)\.(position|quaternion|scale|morphTargetInfluences(?:\[\d+\])?)$/;
const BONE_ALIAS_MAP = {
  hips: ["hip", "pelvis"],
  pelvis: ["pelvis", "hip"],
  spine: ["abdomenlower", "abdomen_upper", "abdomenupper", "spine"],
  spine1: ["abdomenupper", "chestlower", "chest"],
  spine2: ["chestlower", "chestupper", "chest"],
  neck: ["necklower", "neckupper", "neck"],
  head: ["head"],
  leftshoulder: ["lcollar", "leftcollar", "claviclel"],
  leftarm: ["lshldrbend", "lshoulder", "leftarm"],
  leftforearm: ["lforearmbend", "lforearm", "leftforearm"],
  lefthand: ["lhand", "lefthand"],
  rightshoulder: ["rcollar", "rightcollar", "clavicler"],
  rightarm: ["rshldrbend", "rshoulder", "rightarm"],
  rightforearm: ["rforearmbend", "rforearm", "rightforearm"],
  righthand: ["rhand", "righthand"],
  leftupleg: ["lthighbend", "lthigh", "leftupleg"],
  leftleg: ["lshin", "leftleg"],
  leftfoot: ["lfoot", "leftfoot"],
  lefttoebase: ["ltoe", "lefttoe", "lefttoebase"],
  rightupleg: ["rthighbend", "rthigh", "rightupleg"],
  rightleg: ["rshin", "rightleg"],
  rightfoot: ["rfoot", "rightfoot"],
  righttoebase: ["rtoe", "righttoe", "righttoebase"],
};

function setupViewport() {
  const canvas = el.viewportCanvas;
  const wrap = el.viewportWrap;
  if (!canvas || !wrap) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060a0e);
  scene.fog = new THREE.FogExp2(0x060a0e, 0.035);

  const w = wrap.clientWidth || 800;
  const h = wrap.clientHeight || 600;
  camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
  camera.position.set(0, 1.6, 3.2);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xfff4e8, 1.05);
  key.position.set(2, 4, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 20;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8ac7ff, 0.55);
  fill.position.set(-3, 2, -1);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.28);
  rim.position.set(0, 3, -4);
  scene.add(rim);

  // Ground disc
  const groundGeo = new THREE.CircleGeometry(2, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x13161a,
    roughness: 0.95,
    metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid lines on ground
  const gridHelper = new THREE.GridHelper(4, 20, 0x1f2429, 0x1a1e23);
  gridHelper.position.y = 0.001;
  scene.add(gridHelper);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.minDistance = 0.3;
  controls.maxDistance = 20;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.update();

  clock = new THREE.Clock();

  // Resize watcher
  new ResizeObserver(() => {
    const rw = wrap.clientWidth;
    const rh = wrap.clientHeight;
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
    renderer.setSize(rw, rh);
  }).observe(wrap);

  // Render loop
  (function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    if (avatarMixer) avatarMixer.update(dt);
    controls.update();
    renderer.render(scene, camera);
  })();
}

// ── Asset URL helper ────────────────────────────────────────────────────────
function toAssetUrl(resolvedPath) {
  if (!resolvedPath) return null;
  const norm = String(resolvedPath).replace(/\\/g, "/");
  if (norm.startsWith("/client-assets/")) return norm;
  if (norm.startsWith("/library-assets/")) return norm;

  const marker = "playcanvas-app/assets/";
  const idx = norm.indexOf(marker);
  if (idx >= 0) return "/client-assets/" + norm.slice(idx + marker.length);

  const fallback = norm.replace(/^\/+/, "");
  if (fallback.startsWith("animations/") || fallback.startsWith("gail/") || fallback.startsWith("handoffs/")) {
    return "/client-assets/" + fallback;
  }
  return null;
}

function setViewportStatus(msg) {
  if (el.viewportStatus) el.viewportStatus.textContent = msg || "";
}

function inferClothingSlot(asset) {
  const haystack = [
    asset?.slot,
    asset?.id,
    asset?.name,
    asset?.resolvedPath,
    asset?.filePath,
  ].filter(Boolean).join(" ").toLowerCase();

  if (!haystack) return null;
  if (/(hair|wig|bang|ponytail)/.test(haystack)) return "hair";
  if (/(shoe|boot|heel|sandal|footwear|sneaker)/.test(haystack)) return "footwear";
  if (/(pant|jean|trouser|short|skirt|lower)/.test(haystack)) return "lower";
  if (/(top|shirt|blazer|jacket|hoodie|coat|upper|camisole|bra)/.test(haystack)) return "upper";
  if (/(glove|bracelet|ring|necklace|earring|accessor)/.test(haystack)) return "accessories";
  return null;
}

function getClothingSlotKey(asset) {
  // Do not use generic category fallback, otherwise every clothing asset shares one slot.
  return asset?.slot || inferClothingSlot(asset) || asset?.id || asset?.name || "clothing";
}

function getClothingLayerId(asset) {
  return `clothing:${getClothingSlotKey(asset)}`;
}

function disposeMaterial(material) {
  if (!material || typeof material !== "object") return;
  for (const value of Object.values(material)) {
    if (value && typeof value === "object" && value.isTexture && typeof value.dispose === "function") {
      value.dispose();
    }
  }
  if (typeof material.dispose === "function") {
    material.dispose();
  }
}

function disposeObject3D(root) {
  if (!root) return;
  root.traverse((node) => {
    if (node.geometry && typeof node.geometry.dispose === "function") {
      node.geometry.dispose();
    }
    if (Array.isArray(node.material)) {
      node.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(node.material);
    }
  });
}

function removeSceneLayer(layerId) {
  const layer = sceneLayerMap[layerId];
  if (!layer || !scene) return;
  scene.remove(layer);
  disposeObject3D(layer);
  delete sceneLayerMap[layerId];
}

function clearNonAvatarLayers() {
  if (!scene) return;
  const keys = Object.keys(sceneLayerMap);
  for (const key of keys) {
    if (key !== "avatar") {
      removeSceneLayer(key);
    }
  }
}

function formatBytes(bytes) {
  const num = Number(bytes || 0);
  if (!Number.isFinite(num) || num <= 0) return "";
  if (num < 1024) return `${num} B`;
  const kb = num / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function tuneMaterialForPreview(material) {
  if (!material || typeof material !== "object") return;
  if ("metalness" in material && Number.isFinite(material.metalness)) {
    material.metalness = Math.min(material.metalness, 0.06);
  }
  if ("roughness" in material && Number.isFinite(material.roughness)) {
    material.roughness = Math.max(material.roughness, 0.8);
  }
  if ("envMapIntensity" in material && Number.isFinite(material.envMapIntensity)) {
    material.envMapIntensity = Math.min(material.envMapIntensity, 0.35);
  }
}

function normalizeRigName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/mixamorig[:_]?/g, "")
    .replace(/genesis\s*8\s*female/g, "genesis8female")
    .replace(/victoria\s*8/g, "victoria8")
    .replace(/[^a-z0-9]/g, "");
}

function parseTrackBinding(trackName) {
  const match = TRACK_NAME_RE.exec(trackName);
  if (!match) return null;
  return {
    targetPath: match[1],
    property: match[2],
  };
}

function buildTargetNodeMaps(root) {
  const byExact = new Map();
  const byNormalized = new Map();
  root?.traverse((node) => {
    if (!node?.name) return;
    if (!byExact.has(node.name)) {
      byExact.set(node.name, node);
    }
    const normalized = normalizeRigName(node.name);
    if (normalized && !byNormalized.has(normalized)) {
      byNormalized.set(normalized, node);
    }
  });
  return { byExact, byNormalized };
}

function findRetargetNode(sourceName, targetMaps) {
  if (!sourceName) return null;
  if (targetMaps.byExact.has(sourceName)) {
    return targetMaps.byExact.get(sourceName);
  }

  const normalized = normalizeRigName(sourceName);
  if (targetMaps.byNormalized.has(normalized)) {
    return targetMaps.byNormalized.get(normalized);
  }

  const aliases = BONE_ALIAS_MAP[normalized] || [];
  for (const alias of aliases) {
    if (targetMaps.byNormalized.has(alias)) {
      return targetMaps.byNormalized.get(alias);
    }
  }

  return null;
}

function remapClipForAvatar(clip, sourceScene, targetScene) {
  const targetMaps = buildTargetNodeMaps(targetScene);
  const sourceTopLevel = new Set((sourceScene?.children || []).map((node) => normalizeRigName(node.name)));
  const remappedTracks = [];
  let mappedCount = 0;
  let droppedRootCount = 0;

  for (const track of clip.tracks) {
    const binding = parseTrackBinding(track.name);
    if (!binding) continue;

    const sourcePath = binding.targetPath;
    const pathParts = sourcePath.split("/").filter(Boolean);
    const sourceNodeName = pathParts[pathParts.length - 1] || sourcePath;
    const normalizedSourceNode = normalizeRigName(sourceNodeName);

    if (sourceTopLevel.has(normalizedSourceNode) && ["position", "quaternion", "scale"].includes(binding.property)) {
      droppedRootCount += 1;
      continue;
    }

    const targetNode = findRetargetNode(sourceNodeName, targetMaps);
    if (!targetNode) {
      continue;
    }

    const nextTrack = track.clone();
    nextTrack.name = `${targetNode.name}.${binding.property}`;
    remappedTracks.push(nextTrack);
    mappedCount += 1;
  }

  return {
    clip: new THREE.AnimationClip(clip.name, clip.duration, remappedTracks),
    mappedCount,
    droppedRootCount,
    sourceTrackCount: clip.tracks.length,
  };
}

function resolveLibraryItemSrc(item) {
  const candidates = [
    item.previewUrl,
    item.resolvedPath,
    item.filePath,
    item.path,
    item.sourcePath,
    item.relativePath,
  ];

  if (item.files && typeof item.files === "object") {
    const preferred = [item.files.glb, item.files.gltf, item.files.fbx, item.files.anim, item.files.npz];
    for (const p of preferred) candidates.push(p);
    for (const p of Object.values(item.files)) candidates.push(p);
  }

  for (const candidate of candidates) {
    const url = toAssetUrl(candidate);
    if (url) return url;
  }
  return null;
}

// ── Skeleton rebinding (clothing/hair share avatar bones by name) ───────────
function rebindToAvatarSkeleton(group) {
  // Collect avatar bones from first avatar SkinnedMesh we can find
  if (!sceneLayerMap["avatar"]) return;
  const boneMap = new Map();
  sceneLayerMap["avatar"].traverse((node) => {
    if (node.isBone) boneMap.set(node.name, node);
  });
  if (boneMap.size === 0) return;

  group.traverse((node) => {
    if (!node.isSkinnedMesh) return;
    const sk = node.skeleton;
    const newBones = sk.bones.map((b) => boneMap.get(b.name) || b);
    const newSkeleton = new THREE.Skeleton(newBones, sk.boneInverses);
    node.bind(newSkeleton, node.matrixWorld);
  });
}

// ── Load a layer GLB (avatar / clothing / hair) ─────────────────────────────
async function loadSceneLayer(url, layerId, opts = {}) {
  if (!url || !scene) return;
  const thisToken = (Number(layerLoadToken[layerId]) || 0) + 1;
  layerLoadToken[layerId] = thisToken;

  // Drop the previous avatar early to reduce memory spikes when switching heavy models.
  if (layerId === "avatar" && sceneLayerMap.avatar) {
    if (avatarMixer) {
      avatarMixer.stopAllAction();
      avatarMixer.uncacheRoot(sceneLayerMap.avatar);
    }
    removeSceneLayer("avatar");
    avatarMixer = null;
    currentAnimAction = null;
  }

  const sizeText = formatBytes(opts.fileSizeBytes);
  if (layerId === "avatar" && Number(opts.fileSizeBytes || 0) >= 150 * 1024 * 1024) {
    setViewportStatus("Loading avatar (large file " + sizeText + ")...");
  } else {
    setViewportStatus("Loading " + layerId + (sizeText ? ` (${sizeText})` : "") + "...");
  }

  try {
    const gltf = await new Promise((resolve, reject) =>
      loader.load(
        url,
        resolve,
        (evt) => {
          if (layerLoadToken[layerId] !== thisToken) return;
          if (evt && Number.isFinite(evt.total) && evt.total > 0) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setViewportStatus("Loading " + layerId + `... ${pct}%`);
          } else {
            const loadedText = formatBytes(evt?.loaded || 0);
            if (loadedText) {
              setViewportStatus("Loading " + layerId + `... ${loadedText}`);
            }
          }
        },
        reject,
      )
    );

    if (layerLoadToken[layerId] !== thisToken) {
      return;
    }

    // Remove old layer (non-avatar layers keep old state until replacement succeeds)
    if (sceneLayerMap[layerId]) {
      removeSceneLayer(layerId);
    }

    const group = gltf.scene;
    group.traverse((node) => {
      if (node.isMesh || node.isSkinnedMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (Array.isArray(node.material)) {
          node.material.forEach(tuneMaterialForPreview);
        } else {
          tuneMaterialForPreview(node.material);
        }
      }
    });
    scene.add(group);
    sceneLayerMap[layerId] = group;

    if (layerId === "avatar") {
      // Set up animation mixer on the avatar
      avatarMixer = new THREE.AnimationMixer(group);
      currentAnimAction = null;

      // Fit camera to model
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const height = size.y;
      camera.position.set(center.x, center.y + height * 0.05, height * 1.6);
      controls.target.set(center.x, center.y + height * 0.35, 0);
      controls.update();

      // Play embedded T-pose / idle if present
      if (gltf.animations && gltf.animations.length > 0) {
        const action = avatarMixer.clipAction(gltf.animations[0]);
        action.play();
        currentAnimAction = action;
      }

      // Rebind any already-loaded garment layers
      for (const [lid, grp] of Object.entries(sceneLayerMap)) {
        if (lid !== "avatar") rebindToAvatarSkeleton(grp);
      }
    } else {
      rebindToAvatarSkeleton(group);
    }

    if (layerLoadToken[layerId] === thisToken) {
      setViewportStatus("");
    }
    updateSlotSummary();
  } catch (err) {
    console.error("loadSceneLayer", layerId, err);
    if (layerLoadToken[layerId] === thisToken) {
      setViewportStatus("Error loading " + layerId + ": " + err.message);
    }
  }
}

// ── Play animation from a GLB file ──────────────────────────────────────────
async function playAnimFromGlb(url, name) {
  if (!url) return;
  const filePath = url.split("?")[0].toLowerCase();
  if (!filePath.endsWith(".glb")) {
    setViewportStatus("NPZ animations require Blender compose");
    return;
  }
  if (!avatarMixer) {
    setViewportStatus("Load an avatar first");
    return;
  }
  setViewportStatus("Loading animation...");
  try {
    const gltf = await new Promise((resolve, reject) =>
      loader.load(url, resolve, undefined, reject)
    );
    if (!gltf.animations || gltf.animations.length === 0) {
      setViewportStatus("No animation tracks in file");
      return;
    }
    if (currentAnimAction) {
      currentAnimAction.fadeOut(0.25);
    }
    const clip = gltf.animations[0];
    const remapped = remapClipForAvatar(clip, gltf.scene, sceneLayerMap["avatar"]);
    if (!remapped.mappedCount) {
      setViewportStatus("No compatible tracks found for this avatar rig");
      return;
    }
    const action = avatarMixer.clipAction(remapped.clip, sceneLayerMap["avatar"]);
    action.reset().fadeIn(0.25).play();
    currentAnimAction = action;
    if (el.nowPlayingLabel) {
      el.nowPlayingLabel.textContent = "Playing: " + (name || clip.name || url.split("/").pop());
      el.nowPlayingLabel.hidden = false;
    }
    setViewportStatus(`Retargeted ${remapped.mappedCount}/${remapped.sourceTrackCount} tracks` + (remapped.droppedRootCount ? `, dropped ${remapped.droppedRootCount} root tracks` : ""));
  } catch (err) {
    console.error("playAnimFromGlb", err);
    setViewportStatus("Error loading anim: " + err.message);
  }
}

// ── Camera presets ──────────────────────────────────────────────────────────
const CAMERA_PRESETS = {
  front:         { pos: [0, 1.4, 3],   target: [0, 1, 0] },
  side:          { pos: [3, 1.4, 0],   target: [0, 1, 0] },
  three_quarter: { pos: [2, 1.6, 2.2], target: [0, 1, 0] },
  closeup:       { pos: [0, 1.7, 0.9], target: [0, 1.6, 0] },
  overhead:      { pos: [0, 5, 0.5],   target: [0, 0.5, 0] },
  low:           { pos: [0, 0.3, 3],   target: [0, 0.8, 0] },
};

function applyCameraPreset(name) {
  const p = CAMERA_PRESETS[name];
  if (!p || !camera) return;
  camera.position.set(...p.pos);
  controls.target.set(...p.target);
  controls.update();
}

// ── Slot summary HUD ────────────────────────────────────────────────────────
function updateSlotSummary() {
  if (!el.activeSlotSummary) return;
  const slots = [
    { label: "Avatar",   val: state.selectedAvatar   },
    {
      label: "Clothing",
      val: state.selectedClothingItems.length
        ? `${state.selectedClothingItems.length} pieces`
        : null,
    },
    { label: "Hair",     val: state.selectedHair     },
  ];
  el.activeSlotSummary.innerHTML = "";
  slots.forEach(({ label, val }) => {
    const pill = document.createElement("span");
    pill.className = "vp-slot-pill" + (val ? " filled" : "");
    pill.textContent = val ? label + ": " + (val.name || val.id || val) : label;
    el.activeSlotSummary.appendChild(pill);
  });
}

// ── Panel rendering ─────────────────────────────────────────────────────────
function makeAssetItem(asset, isSelected, onClick, dragData) {
  const div = document.createElement("div");
  div.className = "asset-item" + (isSelected ? " active" : "");
  if (dragData) {
    div.draggable = true;
    div.dataset.drag = JSON.stringify(dragData);
    div.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("application/workbench-anim", div.dataset.drag);
      e.dataTransfer.effectAllowed = "copy";
    });
  }
  div.innerHTML = [
    "<span class='item-name'>" + escHtml(asset.name || asset.id || "Unnamed") + "</span>",
    asset.type ? "<span class='item-meta'>" + escHtml(asset.type) + "</span>" : "",
    dragData ? "<span class='item-drag-hint'>drag to strip</span>" : "",
  ].join("");
  div.addEventListener("click", onClick);
  return div;
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAvatarPanel() {
  if (!el.avatarList) return;
  el.avatarList.innerHTML = "";
  if (!state.avatarAssets.length) {
    el.avatarList.innerHTML = "<p style='padding:16px;color:var(--muted);font-size:12px'>No avatar assets found</p>";
    return;
  }
  state.avatarAssets.forEach((asset) => {
    const size = formatBytes(asset.fileSizeBytes);
    el.avatarList.appendChild(
      makeAssetItem(
        { ...asset, type: size || asset.type },
        state.selectedAvatar?.id === asset.id,
        () => onSelectAvatar(asset),
      )
    );
  });
}

function renderClothingPanel() {
  if (!el.clothingList) return;
  el.clothingList.innerHTML = "";
  if (!state.clothingAssets.length) {
    el.clothingList.innerHTML = "<p style='padding:16px;color:var(--muted);font-size:12px'>No clothing assets found</p>";
    return;
  }
  state.clothingAssets.forEach((asset) => {
    el.clothingList.appendChild(
      makeAssetItem(
        asset,
        state.selectedClothingItems.some((item) => item.id === asset.id),
        () => onSelectClothing(asset),
      )
    );
  });
}

function renderHairPanel() {
  if (!el.hairList) return;
  el.hairList.innerHTML = "";
  if (!state.hairAssets.length) {
    el.hairList.innerHTML = "<p style='padding:16px;color:var(--muted);font-size:12px'>No hair assets found</p>";
    return;
  }
  state.hairAssets.forEach((asset) => {
    el.hairList.appendChild(
      makeAssetItem(asset, state.selectedHair?.id === asset.id, () => onSelectHair(asset))
    );
  });
}

function renderAnimPanel() {
  if (!el.animList) return;
  el.animList.innerHTML = "";
  const query = (el.animSearchInput?.value || "").toLowerCase();

  // Manifest animations (GLBs playable in the viewport)
  const manifestAnims = state.animAssets.filter(
    (a) => !query || (a.name || "").toLowerCase().includes(query)
  );
  // Library items
  const libItems = state.libraryItems.filter(
    (a) => !query || (a.name || a.fileName || "").toLowerCase().includes(query)
  );

  if (!manifestAnims.length && !libItems.length) {
    el.animList.innerHTML = "<p style='padding:16px;color:var(--muted);font-size:12px'>No animations found</p>";
    return;
  }

  if (manifestAnims.length) {
    const hdr = document.createElement("p");
    hdr.style.cssText = "padding:8px 12px 4px;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)";
    hdr.textContent = "Scene animations";
    el.animList.appendChild(hdr);

    manifestAnims.forEach((asset) => {
      const src = toAssetUrl(asset.resolvedPath);
      el.animList.appendChild(
        makeAssetItem(
          { ...asset, name: asset.name || asset.id },
          state.selectedAnim?.id === asset.id,
          () => onSelectAnim(asset, src),
          src ? { type: "anim", id: asset.id, name: asset.name, src } : null
        )
      );
    });
  }

  if (libItems.length) {
    const hdr = document.createElement("p");
    hdr.style.cssText = "padding:8px 12px 4px;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)";
    hdr.textContent = "Animation library";
    el.animList.appendChild(hdr);

    libItems.forEach((item) => {
      const src = resolveLibraryItemSrc(item);
      const itemId = item.id || item.fileName || item.name || item.annotation;
      const itemName = item.name || item.fileName || item.annotation || item.id;
      el.animList.appendChild(
        makeAssetItem(
          { id: itemId, name: itemName, type: item.ext || item.type || item.status || item.category },
          state.selectedAnim?.id === itemId,
          () => onSelectAnim({ id: itemId, name: itemName, resolvedPath: item.resolvedPath || item.filePath }, src),
          src ? { type: "anim", id: itemId, name: itemName, src } : null
        )
      );
    });
  }
}

// ── Selection handlers ──────────────────────────────────────────────────────
function onSelectAvatar(asset) {
  state.selectedAvatar = asset;
  // Switching avatar invalidates prior garments and hair bindings.
  state.selectedClothingItems = [];
  state.selectedHair = null;
  clearNonAvatarLayers();
  if (el.nowPlayingLabel) {
    el.nowPlayingLabel.hidden = true;
    el.nowPlayingLabel.textContent = "";
  }
  renderAvatarPanel();
  renderClothingPanel();
  renderHairPanel();
  const url = toAssetUrl(asset.resolvedPath);
  if (url) loadSceneLayer(url, "avatar", { fileSizeBytes: asset.fileSizeBytes });
  else setViewportStatus("No GLB path for avatar: " + (asset.id || ""));
  updateSlotSummary();
}

function onSelectClothing(asset) {
  const slotKey = getClothingSlotKey(asset);
  const layerId = getClothingLayerId(asset);
  const existingIndex = state.selectedClothingItems.findIndex((item) => item.id === asset.id);

  if (existingIndex >= 0) {
    state.selectedClothingItems.splice(existingIndex, 1);
    removeSceneLayer(layerId);
    renderClothingPanel();
    updateSlotSummary();
    setViewportStatus(`Removed clothing: ${asset.name || asset.id || slotKey}`);
    return;
  }

  const sameSlotIndex = state.selectedClothingItems.findIndex((item) => getClothingSlotKey(item) === slotKey);
  if (sameSlotIndex >= 0) {
    const prev = state.selectedClothingItems[sameSlotIndex];
    removeSceneLayer(getClothingLayerId(prev));
    state.selectedClothingItems.splice(sameSlotIndex, 1);
  }

  state.selectedClothingItems.push(asset);
  renderClothingPanel();
  const url = toAssetUrl(asset.resolvedPath);
  if (url) loadSceneLayer(url, layerId, { fileSizeBytes: asset.fileSizeBytes });
  else setViewportStatus("No GLB path for clothing: " + (asset.id || ""));
  updateSlotSummary();
}

function onSelectHair(asset) {
  state.selectedHair = asset;
  renderHairPanel();
  const url = toAssetUrl(asset.resolvedPath);
  if (url) loadSceneLayer(url, "hair", { fileSizeBytes: asset.fileSizeBytes });
  else setViewportStatus("No GLB path for hair: " + (asset.id || ""));
}

function onSelectAnim(asset, src) {
  state.selectedAnim = asset;
  renderAnimPanel();
  if (src) playAnimFromGlb(src, asset.name);
  else setViewportStatus("NPZ requires Blender compose");
}

// ── Sequence strip ──────────────────────────────────────────────────────────
function renderSequence() {
  if (!el.sequenceTrack) return;
  el.sequenceTrack.querySelectorAll(".seq-card").forEach((c) => c.remove());

  if (el.trackEmpty) {
    el.trackEmpty.style.display = state.sequence.length ? "none" : "flex";
  }

  state.sequence.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "seq-card";
    card.draggable = true;
    card.dataset.seqIdx = idx;

    card.innerHTML = [
      "<span class='seq-num'>" + (idx + 1) + "</span>",
      "<div style='flex:1;min-width:0'>",
      "  <div class='seq-name'>" + escHtml(item.name || item.id || "Anim") + "</div>",
      "  <div class='seq-type'>" + escHtml(item.type || "anim") + "</div>",
      "</div>",
      idx > 0 ? "<span class='seq-gap'>+" + state.gapFrames + "f</span>" : "",
      "<button class='seq-remove' type='button' title='Remove'>x</button>",
    ].join("");

    card.querySelector(".seq-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      state.sequence.splice(idx, 1);
      renderSequence();
    });

    // Drag-reorder within strip
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("application/seq-reorder", String(idx));
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      const fromIdx = parseInt(e.dataTransfer.getData("application/seq-reorder"), 10);
      if (!isNaN(fromIdx) && fromIdx !== idx) {
        const [moved] = state.sequence.splice(fromIdx, 1);
        state.sequence.splice(idx, 0, moved);
        renderSequence();
      }
    });

    el.sequenceTrack.appendChild(card);
  });
}

// Drop from anim panel to strip
el.sequenceTrack?.addEventListener("dragover", (e) => {
  if (e.dataTransfer.types.includes("application/workbench-anim")) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }
});
el.sequenceTrack?.addEventListener("drop", (e) => {
  const raw = e.dataTransfer.getData("application/workbench-anim");
  if (!raw) return;
  e.preventDefault();
  try {
    const item = JSON.parse(raw);
    state.sequence.push(item);
    renderSequence();
  } catch (_) {}
});

// ── Tab switching ───────────────────────────────────────────────────────────
document.querySelectorAll(".top-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".top-tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    const pane = document.getElementById("top-tab-" + btn.dataset.topTab);
    if (pane) pane.classList.add("active");
  });
});

// ── Camera controls ─────────────────────────────────────────────────────────
document.querySelectorAll(".cam-btn[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => applyCameraPreset(btn.dataset.preset));
});

el.camDistanceInput?.addEventListener("input", () => {
  if (!camera || !controls) return;
  const dist = parseFloat(el.camDistanceInput.value);
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, dist);
  controls.update();
});

el.camHeightInput?.addEventListener("input", () => {
  if (!controls) return;
  controls.target.y = 1 + parseFloat(el.camHeightInput.value);
  controls.update();
});

el.camOrbitInput?.addEventListener("input", () => {
  if (!camera || !controls) return;
  const angle = THREE.MathUtils.degToRad(parseFloat(el.camOrbitInput.value));
  const dist = camera.position.distanceTo(controls.target);
  camera.position.set(
    controls.target.x + Math.sin(angle) * dist,
    camera.position.y,
    controls.target.z + Math.cos(angle) * dist
  );
  controls.update();
});

// ── Strip controls ──────────────────────────────────────────────────────────
el.fpsInput?.addEventListener("change", () => {
  state.fps = parseInt(el.fpsInput.value, 10) || 30;
});
el.gapFramesInput?.addEventListener("change", () => {
  state.gapFrames = parseInt(el.gapFramesInput.value, 10) || 0;
  renderSequence();
});
el.clearSequenceBtn?.addEventListener("click", () => {
  state.sequence = [];
  renderSequence();
});

// ── Anim search ─────────────────────────────────────────────────────────────
el.animSearchInput?.addEventListener("input", renderAnimPanel);

// ── Send to Blender ──────────────────────────────────────────────────────────
el.sendToBlenderBtn?.addEventListener("click", async () => {
  if (!state.sequence.length) {
    showToast("Add animations to the sequence strip first");
    return;
  }
  try {
    // Save ephemeral collection
    const collectionRes = await fetch("/animation-workbench/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "workbench-" + Date.now(),
        type: "action_sequence",
        gapFrames: state.gapFrames,
        items: state.sequence.map((s) => ({
          id: s.id,
          label: s.name || s.id,
          sourcePath: s.src || s.id,
          sourceType: "glb",
          category: s.type || undefined,
        })),
      }),
    });
    if (!collectionRes.ok) throw new Error("Collection save failed: " + collectionRes.status);
    const collectionData = await collectionRes.json();
    const collectionId = collectionData.collections?.at(-1)?.id;
    if (!collectionId) throw new Error("No collection ID returned from server");

    // Fire Blender job
    const jobRes = await fetch("/animation-workbench/jobs/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId }),
    });
    if (!jobRes.ok) throw new Error("Job start failed: " + jobRes.status);
    const jobData = await jobRes.json();
    const jobId = jobData.id;
    if (!jobId) throw new Error("No job ID returned from server");
    state.activeJob = { jobId, status: "running" };
    updateJobBadge();
    pollJob(jobId);
  } catch (err) {
    showToast("Error: " + err.message);
  }
});

function updateJobBadge() {
  if (!el.jobBadge) return;
  const job = state.activeJob;
  if (!job) { el.jobBadge.textContent = ""; el.jobBadge.className = "badge"; return; }
  const labels = { running: "Composing...", done: "Done", error: "Error" };
  el.jobBadge.textContent = labels[job.status] || job.status;
  el.jobBadge.className = "badge badge-" + (job.status === "done" ? "ok" : job.status === "error" ? "err" : "run");
}

async function pollJob(jobId) {
  try {
    const res = await fetch("/animation-workbench/jobs/latest");
    if (!res.ok) return;
    const data = await res.json();
    // Only update state if this is still the job we fired
    if (data && data.id === jobId) {
      const mapped = data.status === "completed" || data.status === "completed_with_errors" ? "done"
        : data.status === "failed" ? "error"
        : "running";
      if (state.activeJob) state.activeJob.status = mapped;
      updateJobBadge();
      if (mapped === "running") {
        setTimeout(() => pollJob(jobId), 2000);
      } else if (mapped === "done") {
        showToast(data.status === "completed_with_errors" ? "Blender compose complete (with errors)." : "Blender compose complete!");
      } else if (mapped === "error") {
        showToast("Blender error: " + (data.error || "unknown"));
      }
    }
  } catch (_) {
    // silently stop polling on network error
  }
}

// ── Refresh ─────────────────────────────────────────────────────────────────
el.refreshBtn?.addEventListener("click", refreshState);

async function refreshState() {
  if (el.stateBadge) { el.stateBadge.textContent = "Loading..."; el.stateBadge.className = "badge badge-run"; }
  try {
    const res = await fetch("/animation-workbench/state");
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();

    // Avatar assets
    state.avatarAssets = extractAssetsOfKind(data, "avatar");
    // Clothing
    state.clothingAssets = extractAssetsOfKind(data, "clothing");
    // Hair
    state.hairAssets = extractAssetsOfKind(data, "hair");
    // Animations from asset manifest
    state.animAssets = extractAssetsOfKind(data, "animation");
    // Library items
    state.libraryItems = data.animationLibrary?.items || data.libraryItems || [];

    renderAvatarPanel();
    renderClothingPanel();
    renderHairPanel();
    renderAnimPanel();
    updateSlotSummary();

    if (el.stateBadge) { el.stateBadge.textContent = "Live"; el.stateBadge.className = "badge badge-ok"; }
  } catch (err) {
    if (el.stateBadge) { el.stateBadge.textContent = "Error"; el.stateBadge.className = "badge badge-err"; }
    console.error("refreshState", err);
  }
}

function extractAssetsOfKind(data, kind) {
  // Try flat asset map first, then nested structures
  const out = [];
  const assetMap = data.assetMap || {};
  for (const [id, asset] of Object.entries(assetMap)) {
    if ((asset.kind || asset.type || asset.category || "").toLowerCase().includes(kind)) {
      out.push({ ...asset, id });
    }
  }

  const manifestAssets = data.assetManifest?.assets || data.assets || [];
  manifestAssets.forEach((asset) => {
    const k = (asset.kind || asset.type || asset.category || "").toLowerCase();
    if (k.includes(kind)) {
      const id = asset.id || asset.name;
      if (!out.find((o) => o.id === id)) {
        out.push({ ...asset, id });
      }
    }
  });

  // Also check dedicated top-level arrays
  const arr = data[kind + "s"] || data[kind + "Assets"] || [];
  arr.forEach((a) => { if (!out.find((o) => o.id === (a.id || a.name))) out.push(a); });
  return out;
}

// ── Toast ────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  if (!el.toast) return;
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (el.toast) el.toast.hidden = true; }, 3500);
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Import Library panel ──────────────────────────────────────────────────────
// Talks to the anim_avatar_importer server on http://localhost:8888
// ─────────────────────────────────────────────────────────────────────────────
const IMPORTER_BASE = `${window.location.protocol}//${window.location.hostname}:8888`;
const IMPORT_CATEGORIES = ["idle","locomotion","gesture","emote","combat","horror","interaction","traversal","other"];
const IMPORT_PAGE_SIZE  = 80;  // max items rendered per category view

function setImportStatus(msg, isError) {
  if (!el.importLibraryStatus) return;
  el.importLibraryStatus.textContent = msg || "";
  el.importLibraryStatus.className = "import-lib-status" + (isError ? " err" : "");
}

// Fetch full catalog from importer then render
async function loadImportCatalog() {
  if (state.importLoading) return;
  state.importLoading = true;
  setImportStatus("Loading catalog…");
  renderImportCategoryChips();
  if (el.importLibraryList) el.importLibraryList.innerHTML = "";

  try {
    const [catalogRes, importedRes] = await Promise.all([
      fetch(IMPORTER_BASE + "/api/catalog"),
      fetch(IMPORTER_BASE + "/api/imported").catch(() => null),
    ]);
    if (!catalogRes.ok) throw new Error(`Catalog fetch failed: ${catalogRes.status}`);
    state.importCatalog = await catalogRes.json();
    if (importedRes && importedRes.ok) {
      const log = await importedRes.json();
      state.importedIds = new Set((log.entries || log || []).map(e => e.sourceId || e.id).filter(Boolean));
    }
    setImportStatus(`${state.importCatalog.length} clips`);
  } catch (err) {
    state.importCatalog = [];
    setImportStatus("Import server offline — run tools/start-animation-importer.ps1 on port 8888", true);
  } finally {
    state.importLoading = false;
  }
  renderImportCategoryChips();
  renderImportPanel();
}

function renderImportCategoryChips() {
  if (!el.importCategoryChips) return;
  const counts = {};
  IMPORT_CATEGORIES.forEach(c => counts[c] = 0);
  state.importCatalog.forEach(e => { if (counts[e.category] !== undefined) counts[e.category]++; });

  const chips = [{ key: "all", label: `All (${state.importCatalog.length})` }]
    .concat(IMPORT_CATEGORIES.map(c => ({ key: c, label: `${c} (${counts[c]})` })));

  el.importCategoryChips.innerHTML = chips.map(chip =>
    `<button class="import-chip${state.importCategory === chip.key ? " active" : ""}" data-cat="${chip.key}">${escHtml(chip.label)}</button>`
  ).join("");

  el.importCategoryChips.querySelectorAll(".import-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      state.importCategory = btn.dataset.cat;
      state.importSearch   = el.importSearchInput ? el.importSearchInput.value : "";
      renderImportCategoryChips();
      renderImportPanel();
    });
  });
}

function getFilteredImportClips() {
  const q   = (state.importSearch || "").toLowerCase();
  const cat = state.importCategory;
  return state.importCatalog.filter(e =>
    (cat === "all" || e.category === cat) &&
    (!q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
  );
}

function renderImportPanel() {
  if (!el.importLibraryList) return;
  el.importLibraryList.innerHTML = "";

  if (!state.importCatalog.length) {
    el.importLibraryList.innerHTML = `<p class="import-empty">${state.importLoading ? "Loading…" : "No clips — is the import server running?"}</p>`;
    return;
  }

  const clips = getFilteredImportClips();
  const shown = clips.slice(0, IMPORT_PAGE_SIZE);

  shown.forEach(entry => {
    const div = document.createElement("div");
    div.className = "import-item";
    div.dataset.id = entry.id;

    const badges = [];
    if (entry.needsCoordFix)  badges.push(`<span class="import-badge warn">DAZ</span>`);
    if (entry.needsMeshStrip) badges.push(`<span class="import-badge info">${entry.sizeMB}MB</span>`);
    if (state.importedIds.has(entry.id)) badges.push(`<span class="import-badge ok">imported</span>`);

    div.innerHTML = [
      `<div class="import-item-body">`,
      `  <span class="import-item-name">${escHtml(entry.name)}</span>`,
      `  <span class="import-item-cat">${escHtml(entry.category)}</span>`,
      `  <span class="import-item-badges">${badges.join("")}</span>`,
      `</div>`,
      `<div class="import-item-actions">`,
      `  <button class="import-play-btn" type="button" title="Preview in viewport">▶</button>`,
      `  <button class="import-btn${state.importedIds.has(entry.id) ? " done" : ""}" type="button"`,
      `    data-id="${escHtml(entry.id)}">${state.importedIds.has(entry.id) ? "Re-import" : "Import"}</button>`,
      `</div>`,
    ].join("");

    div.querySelector(".import-play-btn").addEventListener("click", () => {
      const previewUrl = `${IMPORTER_BASE}/api/preview-glb?id=${encodeURIComponent(entry.id)}`;
      playAnimFromGlb(previewUrl, entry.name);
    });

    div.querySelector(".import-btn").addEventListener("click", async (e) => {
      await doImportClip(entry.id, e.currentTarget, div);
    });

    el.importLibraryList.appendChild(div);
  });

  if (clips.length > IMPORT_PAGE_SIZE) {
    const more = document.createElement("p");
    more.className = "import-more";
    more.textContent = `Showing ${IMPORT_PAGE_SIZE} of ${clips.length} — refine the search to see more.`;
    el.importLibraryList.appendChild(more);
  }
}

async function doImportClip(id, btn, itemEl) {
  btn.disabled = true;
  btn.textContent = "Importing…";
  try {
    const res = await fetch(IMPORTER_BASE + "/api/import-single", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
    state.importedIds.add(id);
    btn.textContent  = "Re-import";
    btn.disabled     = false;
    btn.classList.add("done");
    const badge = itemEl.querySelector(".import-item-badges");
    if (badge && !badge.querySelector(".import-badge.ok")) {
      badge.insertAdjacentHTML("beforeend", `<span class="import-badge ok">imported</span>`);
    }
    showToast(`Imported: ${data.name || id}`);
    setImportStatus(`Imported: ${data.name || id}`);
  } catch (err) {
    btn.textContent = "Import";
    btn.disabled    = false;
    showToast("Import error: " + err.message);
    setImportStatus("Error: " + err.message, true);
  }
}

// Import tab wiring
el.importSearchInput?.addEventListener("input", () => {
  state.importSearch = el.importSearchInput.value;
  renderImportPanel();
});

el.importRefreshBtn?.addEventListener("click", () => loadImportCatalog());

// Load import catalog when the Import tab is activated
document.querySelectorAll(".top-tab[data-top-tab='import']").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!state.importCatalog.length && !state.importLoading) loadImportCatalog();
  });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
setupViewport();
renderSequence();
refreshState();
