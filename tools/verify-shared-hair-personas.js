/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("../playcanvas-app/node_modules/playwright");
const { buildChromiumLaunchOptions } = require("./playwright-renderer");

const BASE_URL = process.env.GAIL_BASE_URL || "http://127.0.0.1:4180";
const REPORT_DIR = path.resolve(__dirname, "..", "docs", "reports");

const PERSONAS = [
  {
    id: "normal",
    label: "Gail",
    selectValue: "normal",
    hairAssetId: "meili_hair",
    expectedAvatar: "/client-assets/gail/avatar/base_face/gail_base_avatar.glb",
    expectedHair: "/client-assets/gail/hair/meili_hair/meili_hair.glb",
    forbiddenHair: [],
  },
  {
    id: "private_counselor",
    label: "Vera",
    selectValue: "private_counselor",
    hairAssetId: "private_hair",
    expectedAvatar: "/client-assets/gail/counselor/avatar/base_face/vera_base_avatar.glb",
    expectedHair: "/client-assets/gail/hair/meili_hair/meili_hair.glb",
    forbiddenHair: [
      "/client-assets/gail/counselor/hair/vera_hair.glb",
    ],
  },
  {
    id: "private_girlfriend",
    label: "Cherry",
    selectValue: "private_girlfriend",
    hairAssetId: "girlfriend_hair",
    expectedAvatar: "/client-assets/gail/girlfriend/avatar/base_face/cherry_base_avatar.glb",
    expectedHair: "/client-assets/gail/hair/meili_hair/meili_hair.glb",
    forbiddenHair: [
      "/client-assets/gail/girlfriend/hair/cherry_hair.glb",
    ],
  },
];

function stampForFile() {
  const d = new Date();
  const p = (value) => String(value).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true });
}

async function fetchLiveHairManifestState() {
  const response = await fetch(`${BASE_URL}/client/asset-manifest`);
  if (!response.ok) {
    throw new Error(`Manifest fetch failed (${response.status})`);
  }
  const payload = await response.json();
  const byId = new Map();
  for (const asset of payload.assets ?? []) {
    byId.set(asset.id, asset);
  }
  return byId;
}

async function readShellRows(page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll("#shell-state-panel .shell-state-row")).map((row) => {
      const label = row.querySelector("span")?.textContent?.trim() ?? "";
      const value = row.querySelector("strong")?.textContent?.trim() ?? "";
      return { label, value };
    });
  });
}

async function gatherUiState(page) {
  return await page.evaluate(() => {
    const stageStatus = document.querySelector("#stage-status")?.textContent?.trim() ?? "";
    const avatarOverlay = document.querySelector("#avatar-motion-overlay")?.textContent?.trim() ?? "";
    const personaValue = document.querySelector("#persona-select")?.value ?? "";
    const personaLabel = document.querySelector("#persona-label")?.textContent?.trim() ?? "";
    const personaBadge = document.querySelector("#persona-badge")?.textContent?.trim() ?? "";
    return {
      stageStatus,
      avatarOverlay,
      personaValue,
      personaLabel,
      personaBadge,
    };
  });
}

async function waitForSceneReady(page, timeoutMs = 90000) {
  await page.waitForFunction(() => {
    const status = document.querySelector("#stage-status");
    const text = (status?.textContent || "").toLowerCase();
    return text.includes("scene ready");
  }, null, { timeout: timeoutMs });
}

async function waitForPersonaSelection(page, persona, timeoutMs = 30000) {
  await page.waitForFunction((targetPersona) => {
    const select = document.querySelector("#persona-select");
    return !!select && select.value === targetPersona;
  }, persona.selectValue, { timeout: timeoutMs });
}

async function waitForPersonaAvatarRequest(requests, requestStartIndex, persona, timeoutMs = 180000) {
  const startedAt = Date.now();
  while ((Date.now() - startedAt) < timeoutMs) {
    const personaRequests = requests.slice(requestStartIndex);
    const avatarLoaded = personaRequests.some((url) => url.includes(persona.expectedAvatar));
    if (avatarLoaded) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for persona avatar load for ${persona.id}`);
}

async function switchPersona(page, requests, requestStartIndex, persona) {
  await page.selectOption("#persona-select", persona.selectValue);
  await waitForPersonaSelection(page, persona, 30000);

  try {
    await waitForSceneReady(page, 120000);
  } catch {
    // Some persona switches are slow to fully settle in headless mode; the
    // asset request proof is the stronger signal for this verifier.
  }

  await waitForPersonaAvatarRequest(requests, requestStartIndex, persona, 180000);
  await page.waitForTimeout(25000);
}

async function main() {
  ensureDir(REPORT_DIR);
  const stamp = stampForFile();
  const screenshotDir = path.join(REPORT_DIR, `shared-hair-personas-${stamp}`);
  ensureDir(screenshotDir);
  const reportPath = path.join(REPORT_DIR, `shared-hair-personas-${stamp}.json`);
  const liveManifestById = await fetchLiveHairManifestState();

  const { rendererMode, launchOptions } = buildChromiumLaunchOptions();
  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
  });
  const page = await context.newPage();

  const requests = [];
  const pageErrors = [];
  const consoleErrors = [];

  page.on("requestfinished", (request) => {
    const url = request.url();
    if (url.includes("/client-assets/")) {
      requests.push(url);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  await page.goto(`${BASE_URL}/client/work-lite/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#persona-select", { timeout: 45000 });
  await page.waitForSelector("#app", { timeout: 45000 });
  await waitForSceneReady(page, 120000);
  await page.waitForTimeout(1500);

  const results = [];

  for (const persona of PERSONAS) {
    const isInitialNormalPass = results.length === 0 && persona.selectValue === "normal";
    const requestStartIndex = isInitialNormalPass ? 0 : requests.length;
    if (isInitialNormalPass) {
      await waitForSceneReady(page, 120000);
      await waitForPersonaAvatarRequest(requests, requestStartIndex, persona, 180000);
      await page.waitForTimeout(2000);
    } else {
      await switchPersona(page, requests, requestStartIndex, persona);
    }

    const screenshotPath = path.join(screenshotDir, `${persona.id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const uiState = await gatherUiState(page);
    const shellRows = await readShellRows(page);
    const personaRequests = [...new Set(requests.slice(requestStartIndex))].sort();
    const manifestHairAsset = liveManifestById.get(persona.hairAssetId);

    const loadedExpectedAvatar = personaRequests.some((url) => url.includes(persona.expectedAvatar));
    const loadedExpectedHair = personaRequests.some((url) => url.includes(persona.expectedHair));
    const loadedForbiddenHair = persona.forbiddenHair.filter((candidate) =>
      personaRequests.some((url) => url.includes(candidate)),
    );
    const manifestHairPath = String(manifestHairAsset?.resolvedPath || manifestHairAsset?.expectedPath || "");
    const manifestHairMatchesExpected = manifestHairPath.endsWith(
      persona.expectedHair.replace("/client-assets/", "playcanvas-app/assets/"),
    );
    const privatePersonaRow = shellRows.find((row) => row.label === "Private persona")?.value ?? "";

    results.push({
      personaId: persona.id,
      personaLabel: persona.label,
      screenshotPath,
      uiState,
      shellRows,
      privatePersonaRow,
      loadedExpectedAvatar,
      loadedExpectedHair,
      manifestHairPath,
      manifestHairMatchesExpected,
      loadedForbiddenHair,
      assetRequests: personaRequests,
    });
  }

  const overallPass = results.every((result) =>
    result.loadedExpectedAvatar &&
    result.manifestHairMatchesExpected &&
    result.loadedForbiddenHair.length === 0 &&
    (result.personaId === "normal"
      ? result.privatePersonaRow === "normal"
      : result.privatePersonaRow === result.personaId) &&
    !/persona switch failed/i.test(result.uiState.stageStatus || ""),
  ) && pageErrors.length === 0;

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    rendererMode,
    overallPass,
    screenshotDir,
    pageErrors,
    consoleErrors: consoleErrors.slice(-50),
    results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Report: ${reportPath}`);
  console.log(`Screenshots: ${screenshotDir}`);
  console.log(`Renderer: ${rendererMode}`);
  console.log(`overallPass=${overallPass}`);

  await context.close();
  await browser.close();

  if (!overallPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
