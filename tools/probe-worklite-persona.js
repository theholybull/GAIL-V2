/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("../playcanvas-app/node_modules/playwright");
const { buildChromiumLaunchOptions } = require("./playwright-renderer");

const BASE_URL = process.env.GAIL_BASE_URL || "http://127.0.0.1:4180";
const REPORT_DIR = path.resolve(__dirname, "..", "docs", "reports");

function readArg(name, fallback) {
  const token = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(token));
  if (!match) {
    return fallback;
  }
  return match.slice(token.length);
}

function readBoolArg(name, fallback = false) {
  const value = readArg(name, fallback ? "true" : "false");
  return String(value).toLowerCase() === "true";
}

function stampForFile() {
  const d = new Date();
  const p = (value) => String(value).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const PERSONA_ALIAS = {
  girlfriend: "private_girlfriend",
  cherry: "private_girlfriend",
  counselor: "private_counselor",
  vera: "private_counselor",
};

async function main() {
  const personaRaw = readArg("persona", "normal");
  const persona = PERSONA_ALIAS[personaRaw] ?? personaRaw;
  const settleMs = Number(readArg("settleMs", persona === "normal" ? "6000" : "30000"));
  const skipSwitch = readBoolArg("skipSwitch", false);
  const urlSuffix = readArg("urlSuffix", "");
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const stamp = stampForFile();
  const screenshotPath = path.join(REPORT_DIR, `worklite-persona-${personaRaw}-${stamp}.png`);
  const reportPath = path.join(REPORT_DIR, `worklite-persona-${personaRaw}-${stamp}.json`);

  const { rendererMode, launchOptions } = buildChromiumLaunchOptions();
  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const requests = [];
  const failedRequests = [];
  const responseErrors = [];
  const pageErrors = [];
  const consoleLines = [];

  page.on("requestfinished", (request) => {
    const url = request.url();
    if (url.includes("/client-assets/") || url.includes("/providers/local-llm-config")) {
      requests.push(url);
    }
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.includes("/client-assets/") || url.includes("/providers/local-llm-config")) {
      failedRequests.push({
        url,
        method: request.method(),
        failure: request.failure()?.errorText ?? "unknown",
      });
    }
  });
  page.on("response", (response) => {
    const url = response.url();
    if ((url.includes("/client-assets/") || url.includes("/providers/local-llm-config")) && response.status() >= 400) {
      responseErrors.push({
        url,
        status: response.status(),
        statusText: response.statusText(),
      });
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning" || msg.text().includes("[persona]")) {
      consoleLines.push(`[${type}] ${msg.text()}`);
    }
  });

  await page.goto(`${BASE_URL}/client/work-lite/${urlSuffix}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#persona-select", { timeout: 45000 });
  await page.waitForSelector("#app", { timeout: 45000 });

  if (persona !== "normal" && !skipSwitch) {
    await page.selectOption("#persona-select", persona);
  }
  await page.waitForTimeout(settleMs);

  const uiState = await page.evaluate(() => {
    return {
      stageStatus: document.querySelector("#stage-status")?.textContent?.trim() ?? "",
      personaSelect: document.querySelector("#persona-select")?.value ?? "",
      personaLabel: document.querySelector("#persona-label")?.textContent?.trim() ?? "",
      personaBadge: document.querySelector("#persona-badge")?.textContent?.trim() ?? "",
      shellRows: Array.from(document.querySelectorAll("#shell-state-panel .shell-state-row")).map((row) => ({
        label: row.querySelector("span")?.textContent?.trim() ?? "",
        value: row.querySelector("strong")?.textContent?.trim() ?? "",
      })),
    };
  });

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    rendererMode,
    urlSuffix,
    persona,
    settleMs,
    screenshotPath,
    uiState,
    requests: [...new Set(requests)].sort(),
    failedRequests,
    responseErrors,
    pageErrors,
    consoleLines: consoleLines.slice(-200),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report: ${reportPath}`);
  console.log(`Screenshot: ${screenshotPath}`);
  console.log(`Renderer: ${rendererMode}`);

  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
