/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("../playcanvas-app/node_modules/playwright");
const { buildChromiumLaunchOptions } = require("./playwright-renderer");

const BASE_URL = process.env.GAIL_BASE_URL || "http://127.0.0.1:4180";
function readArg(name, fallback) {
  const token = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(token));
  if (!match) {
    return fallback;
  }
  return match.slice(token.length);
}

const targetPath = readArg("path", "/client/work-lite/");
const TARGET_URL = `${BASE_URL}${targetPath}`;

function stamp() {
  const d = new Date();
  const p = (value) => String(value).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function main() {
  const outDir = path.resolve("docs", "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const id = stamp();
  const screenshotPath = path.join(outDir, `lucy-worklite-display-${id}.png`);
  const reportPath = path.join(outDir, `lucy-worklite-display-${id}.json`);

  const requests = [];
  const { rendererMode, launchOptions } = buildChromiumLaunchOptions();
  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  page.on("requestfinished", (request) => {
    const url = request.url();
    if (url.includes("/client-assets/")) {
      requests.push(url);
    }
  });

  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#app", { timeout: 20000 });

  let stageInfo = {};
  let tries = 0;
  while (tries < 220) {
    tries += 1;
    stageInfo = await page.evaluate(() => {
      const stageStatus = document.querySelector("#stage-status")?.textContent?.trim() ?? "";
      const avatarOverlay = document.querySelector("#avatar-motion-overlay")?.textContent?.trim() ?? "";
      const shellRows = Array.from(document.querySelectorAll("#shell-state-panel .shell-state-row")).map((row) => {
        const label = row.querySelector("span")?.textContent?.trim() ?? "";
        const value = row.querySelector("strong")?.textContent?.trim() ?? "";
        return { label, value };
      });
      const privatePersona = shellRows.find((row) => row.label === "Private persona")?.value ?? "";
      return {
        stageStatus,
        avatarOverlay,
        privatePersona,
      };
    });

    const lucyRequested = requests.some((url) => url.includes("/gail/private/avatar/base_face/lucy_base_avatar.glb"));
    const hairRequested = requests.some((url) => url.includes("/gail/private/hair/lucy_hair/lucy_hair.glb"));
    const topRequested = requests.some((url) => url.includes("/gail/private/clothing/private_top.glb"));
    const pantsRequested = requests.some((url) => url.includes("/gail/private/clothing/private_pants.glb"));
    const hasOverlay = typeof stageInfo.avatarOverlay === "string" && stageInfo.avatarOverlay.toLowerCase().includes("morphs");
    const webglLost = String(stageInfo.stageStatus || "").toLowerCase().includes("webgl context lost");
    const stageLooksReady = /ready|loaded|scene/i.test(String(stageInfo.stageStatus || ""));

    if (lucyRequested && hairRequested && topRequested && pantsRequested && hasOverlay && stageLooksReady && !webglLost) {
      break;
    }
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const uniqueRequests = [...new Set(requests)].sort();
  const report = {
    timestamp: new Date().toISOString(),
    url: TARGET_URL,
    rendererMode,
    screenshotPath,
    stageInfo,
    loadedLucyAvatar: uniqueRequests.some((url) => url.includes("/gail/private/avatar/base_face/lucy_base_avatar.glb")),
    loadedLucyHair: uniqueRequests.some((url) => url.includes("/gail/private/hair/lucy_hair/lucy_hair.glb")),
    loadedPrivateTop: uniqueRequests.some((url) => url.includes("/gail/private/clothing/private_top.glb")),
    loadedPrivatePants: uniqueRequests.some((url) => url.includes("/gail/private/clothing/private_pants.glb")),
    clientAssetRequests: uniqueRequests,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Screenshot: ${screenshotPath}`);
  console.log(`Report: ${reportPath}`);
  console.log(`Renderer: ${rendererMode}`);
  console.log(`Loaded Lucy avatar: ${report.loadedLucyAvatar}`);

  await context.close();
  await browser.close();

  if (!report.loadedLucyAvatar) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
