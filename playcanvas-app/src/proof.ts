const statusElement = document.querySelector<HTMLDivElement>("#proof-status");
const canvas = document.querySelector<HTMLCanvasElement>("#proof-canvas");

if (!statusElement || !canvas) {
  throw new Error("Proof page is missing required DOM elements.");
}

const proofStatusElement = statusElement;
const proofCanvas = canvas;

void bootProofScene();

async function bootProofScene(): Promise<void> {
  const playcanvasUrl = "/vendor/playcanvas/build/playcanvas.mjs";
  const pc: any = await import(playcanvasUrl);
  setStatus("Engine loaded. Building minimal scene...");

  const app = new pc.Application(proofCanvas, {
    graphicsDeviceOptions: {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: false,
    },
  });

  app.setCanvasFillMode(pc.FILLMODE_NONE);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.start();

  const resize = () => {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    proofCanvas.style.width = `${width}px`;
    proofCanvas.style.height = `${height}px`;
    app.resizeCanvas(width, height);
  };
  resize();
  window.addEventListener("resize", resize);

  const camera = new pc.Entity("proof-camera");
  camera.addComponent("camera", {
    clearColor: new pc.Color(0.08, 0.1, 0.16, 1),
    farClip: 100,
    nearClip: 0.1,
    fov: 50,
  });
  camera.setLocalPosition(0, 0.8, 4);
  app.root.addChild(camera);

  const light = new pc.Entity("proof-light");
  light.addComponent("light", {
    type: "directional",
    color: new pc.Color(1, 0.96, 0.9),
    intensity: 2.2,
    castShadows: false,
  });
  light.setEulerAngles(45, 35, 0);
  app.root.addChild(light);

  const fill = new pc.Entity("proof-fill");
  fill.addComponent("light", {
    type: "omni",
    color: new pc.Color(0.25, 0.55, 1),
    intensity: 0.6,
    range: 12,
  });
  fill.setLocalPosition(-2, 2, 2);
  app.root.addChild(fill);

  const floor = new pc.Entity("proof-floor");
  floor.addComponent("render", {
    type: "box",
  });
  floor.setLocalScale(8, 0.1, 8);
  floor.setLocalPosition(0, -0.55, 0);
  app.root.addChild(floor);

  const floorMaterial = new pc.StandardMaterial();
  floorMaterial.diffuse = new pc.Color(0.15, 0.2, 0.28);
  floorMaterial.emissive = new pc.Color(0.02, 0.04, 0.06);
  floorMaterial.metalness = 0;
  floorMaterial.gloss = 0.15;
  floorMaterial.update();
  floor.render.meshInstances[0].material = floorMaterial;

  const box = new pc.Entity("proof-box");
  box.addComponent("render", {
    type: "box",
  });
  box.setLocalPosition(0, 0.35, 0);
  app.root.addChild(box);

  const boxMaterial = new pc.StandardMaterial();
  boxMaterial.diffuse = new pc.Color(0.95, 0.48, 0.18);
  boxMaterial.emissive = new pc.Color(0.18, 0.07, 0.02);
  boxMaterial.metalness = 0.1;
  boxMaterial.gloss = 0.4;
  boxMaterial.update();
  box.render.meshInstances[0].material = boxMaterial;

  const sphere = new pc.Entity("proof-sphere");
  sphere.addComponent("render", {
    type: "sphere",
  });
  sphere.setLocalPosition(1.8, 0.5, -0.4);
  sphere.setLocalScale(0.7, 0.7, 0.7);
  app.root.addChild(sphere);

  const sphereMaterial = new pc.StandardMaterial();
  sphereMaterial.diffuse = new pc.Color(0.2, 0.75, 1);
  sphereMaterial.emissive = new pc.Color(0.04, 0.09, 0.12);
  sphereMaterial.metalness = 0.05;
  sphereMaterial.gloss = 0.5;
  sphereMaterial.update();
  sphere.render.meshInstances[0].material = sphereMaterial;

  app.on("update", (dt: number) => {
    box.rotate(12 * dt, 22 * dt, 6 * dt);
    sphere.rotate(0, -30 * dt, 0);

    setStatus(
      [
        "Minimal documented PlayCanvas scene",
        `device ${String(app.graphicsDevice?.deviceType ?? "unknown")}`,
        `drawCalls ${app.stats.drawCalls.total}`,
        `cameras ${app.stats.frame.cameras}`,
        `canvas ${proofCanvas.width}x${proofCanvas.height}`,
      ].join(" | "),
    );
  });

  setStatus("Proof scene running.");
}

function setStatus(message: string): void {
  proofStatusElement.innerHTML = `<strong>Proof Scene</strong>${escapeHtml(message)}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
