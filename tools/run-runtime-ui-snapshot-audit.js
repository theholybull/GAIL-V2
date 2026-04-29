/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("../playcanvas-app/node_modules/playwright");
const { buildChromiumLaunchOptions } = require("./playwright-renderer");

const BASE_URL = process.env.GAIL_BASE_URL || "http://127.0.0.1:4180";
const IMPORTER_URL = process.env.GAIL_IMPORTER_URL || "http://127.0.0.1:8888/";
const VIEWER_URL = process.env.GAIL_VIEWER_URL || "http://127.0.0.1:8778/metadata/viewer_runtime.html";

const VIEWPORTS = [
  { name: "desktop", width: 1920, height: 1080 },
  { name: "mobile", width: 390, height: 844 },
];

const SURFACES = [
  { id: "operator-panel", url: `${BASE_URL}/panel/`, readySelector: "body", settleMs: 1200 },
  { id: "operator-shell", url: `${BASE_URL}/panel/operator-studio-shell.html`, readySelector: "#studio-app", settleMs: 1600 },
  { id: "work-lite", url: `${BASE_URL}/client/work-lite/`, readySelector: "#app, #stage-canvas, canvas", settleMs: 7000 },
  { id: "phone-client", url: `${BASE_URL}/client/phone/`, readySelector: "#app, #stage-canvas, canvas", settleMs: 7000 },
  { id: "proof-client", url: `${BASE_URL}/client/proof/`, readySelector: "#app, #stage-canvas, canvas", settleMs: 7000 },
  { id: "display-client", url: `${BASE_URL}/display/`, readySelector: "#app, #stage-canvas, canvas", settleMs: 7000 },
  { id: "studio-alias", url: `${BASE_URL}/studio`, readySelector: "#studio-app", settleMs: 1600 },
  { id: "animation-importer", url: IMPORTER_URL, readySelector: "body", settleMs: 1800 },
  { id: "animation-viewer", url: VIEWER_URL, readySelector: "body", settleMs: 1800 },
];

const SHELL_GLOBAL_SELECTORS = [
  "#open-help",
  "#toggle-guided",
  "#open-command",
  "#open-change",
  "#toggle-console",
];

function stamp() {
  const d = new Date();
  const p = (v) => String(v).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function slugify(value) {
  return String(value || "untitled")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function takePageScreenshot(page, screenshotPath) {
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 120000 });
    return { screenshotPath, mode: "fullPage" };
  } catch (error) {
    const fallbackPath = screenshotPath.replace(/\.png$/i, ".viewport.png");
    await page.screenshot({ path: fallbackPath, fullPage: false, timeout: 45000 });
    return {
      screenshotPath: fallbackPath,
      mode: "viewportFallback",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function tryWaitForSelector(page, selector, timeout = 15000) {
  if (!selector) {
    return false;
  }
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function collectOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth = doc.clientWidth;
    const pageOverflow = (doc.scrollWidth > viewportWidth + 1) || (body && body.scrollWidth > viewportWidth + 1);
    const offenders = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      if (!(el instanceof HTMLElement)) {
        continue;
      }
      const className = String(el.className || "");
      if (className.includes("sr-only") || className.includes("visually-hidden")) {
        continue;
      }
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        continue;
      }
      if (rect.left < -1 || rect.right > viewportWidth + 1) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || "",
          className: className.slice(0, 120),
          text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 160),
        });
        if (offenders.length >= 30) {
          break;
        }
      }
    }
    return { pageOverflow, offenders };
  });
}

async function collectVisibleButtons(page, selector = 'button, [role="button"], input[type="button"], input[type="submit"]') {
  return page.evaluate((buttonSelector) => {
    const nodes = Array.from(document.querySelectorAll(buttonSelector));
    return nodes.map((el, index) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const hidden = el.offsetParent === null || style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
      return {
        index,
        text: (el.textContent || el.getAttribute("value") || "").trim().replace(/\s+/g, " "),
        id: el.id || "",
        className: String(el.className || "").slice(0, 120),
        disabled: Boolean(el.disabled) || el.getAttribute("aria-disabled") === "true",
        hidden,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }).filter((entry) => !entry.hidden && entry.width > 1 && entry.height > 1);
  }, selector);
}

async function collectStageSignals(page) {
  return page.evaluate(() => {
    const stageStatus = document.querySelector("#stage-status")?.textContent?.trim() || "";
    const avatarOverlay = document.querySelector("#avatar-motion-overlay")?.textContent?.trim() || "";
    const pageTitle = document.querySelector("#page-title")?.textContent?.trim() || document.title || "";
    const visibleCanvasCount = Array.from(document.querySelectorAll("canvas")).filter((canvas) => {
      if (!(canvas instanceof HTMLCanvasElement)) {
        return false;
      }
      const rect = canvas.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    }).length;
    const shellRows = Array.from(document.querySelectorAll("#shell-state-panel .shell-state-row")).map((row) => ({
      label: row.querySelector("span")?.textContent?.trim() || "",
      value: row.querySelector("strong")?.textContent?.trim() || "",
    }));
    return {
      pageTitle,
      stageStatus,
      avatarOverlay,
      visibleCanvasCount,
      shellRows,
    };
  });
}

async function getLatestToast(page) {
  return page.evaluate(() => {
    const toasts = Array.from(document.querySelectorAll("#toast-stack .toast"));
    if (toasts.length === 0) {
      return null;
    }
    const last = toasts[toasts.length - 1];
    const cls = String(last.className || "");
    let type = "info";
    if (cls.includes("toast-error")) {
      type = "error";
    } else if (cls.includes("toast-success")) {
      type = "success";
    }
    return { type, text: (last.textContent || "").trim() };
  });
}

async function dismissShellTransientUi(page) {
  await page.evaluate(() => {
    document.querySelectorAll("dialog[open]").forEach((dialog) => {
      if (typeof dialog.close === "function") {
        dialog.close();
      }
    });
    document.body.classList.remove("nav-open", "inspector-open");
  });
  await page.waitForTimeout(120);
}

async function shellOpenNavIfNeeded(page) {
  const visibleNavCount = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("#nav-groups nav button")).filter((button) => {
      const style = window.getComputedStyle(button);
      return button.offsetParent !== null && style.display !== "none" && style.visibility !== "hidden";
    }).length;
  });
  if (visibleNavCount > 0) {
    return;
  }
  const toggle = page.locator("#toggle-nav");
  if ((await toggle.count()) > 0) {
    try {
      await toggle.first().click({ timeout: 3000, force: true });
      await page.waitForTimeout(250);
    } catch {
      // best effort only
    }
  }
}

async function clickShellNavLabel(page, label) {
  await shellOpenNavIfNeeded(page);
  const clicked = await page.evaluate((targetLabel) => {
    const buttons = Array.from(document.querySelectorAll("#nav-groups nav button"));
    const match = buttons.find((button) => (button.textContent || "").trim() === targetLabel);
    if (!(match instanceof HTMLElement)) {
      return false;
    }
    match.click();
    return true;
  }, label);
  await page.waitForTimeout(900);
  return clicked;
}

async function safeSurfaceCapture(browser, surface, viewport, outDir) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const assetRequests = [];

  page.on("console", (msg) => {
    if (msg.type() === "warning" || msg.type() === "error") {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });
  page.on("requestfinished", (request) => {
    const url = request.url();
    if (url.includes("/client-assets/") || url.endsWith(".glb") || url.endsWith(".gltf")) {
      assetRequests.push(url);
    }
  });

  const result = {
    surfaceId: surface.id,
    viewport: viewport.name,
    url: surface.url,
    status: null,
    finalUrl: null,
    ready: false,
    screenshotPath: null,
    consoleWarningsOrErrors: [],
    pageErrors: [],
    overflow: { pageOverflow: false, offenders: [] },
    buttons: [],
    stage: {},
    assetRequests: [],
  };

  try {
    const response = await page.goto(surface.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    result.status = response ? response.status() : null;
    result.finalUrl = page.url();
    result.ready = await tryWaitForSelector(page, surface.readySelector, 20000);
    await page.waitForTimeout(surface.settleMs || 1500);
    result.overflow = await collectOverflow(page);
    result.buttons = await collectVisibleButtons(page);
    result.stage = await collectStageSignals(page);
    result.assetRequests = [...new Set(assetRequests)].sort();
    result.consoleWarningsOrErrors = consoleMessages.slice(0, 80);
    result.pageErrors = pageErrors.slice(0, 40);

    const screenshotPath = path.join(outDir, `${viewport.name}-${slugify(surface.id)}.png`);
    const screenshot = await takePageScreenshot(page, screenshotPath);
    result.screenshotPath = screenshot.screenshotPath;
    result.screenshotMode = screenshot.mode;
    if (screenshot.error) {
      result.pageErrors.push(`Screenshot fallback: ${screenshot.error}`);
    }
  } catch (error) {
    result.pageErrors.push(error instanceof Error ? error.message : String(error));
  } finally {
    await context.close();
  }

  return result;
}

async function clickShellAction(page, actionId) {
  const clickResult = await page.evaluate((id) => {
    const button = document.querySelector(`#action-list button[data-action-id="${id}"]`);
    if (!(button instanceof HTMLElement)) {
      return { clicked: false, reason: "missing" };
    }
    const style = window.getComputedStyle(button);
    const rect = button.getBoundingClientRect();
    const hidden = button.offsetParent === null || style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
    const disabled = button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true";
    if (hidden || rect.width < 2 || rect.height < 2) {
      return { clicked: false, reason: "hidden" };
    }
    if (disabled) {
      return { clicked: false, reason: "disabled" };
    }
    button.click();
    return { clicked: true, reason: null };
  }, actionId);

  await page.waitForTimeout(850);
  const pending = await page.evaluate(() => Boolean(document.querySelector("#action-list .action-btn.is-pending")));
  const toast = await getLatestToast(page);
  await dismissShellTransientUi(page);

  return {
    actionId,
    clicked: clickResult.clicked,
    skippedReason: clickResult.reason,
    pendingAfterWait: pending,
    toast,
  };
}

async function clickShellSelector(page, selector) {
  const loc = page.locator(selector);
  if ((await loc.count()) < 1) {
    return { selector, clicked: false, skippedReason: "missing", toast: null };
  }
  let clicked = false;
  try {
    await loc.first().click({ timeout: 3000, force: true });
    clicked = true;
  } catch (error) {
    return {
      selector,
      clicked: false,
      skippedReason: error instanceof Error ? error.message : String(error),
      toast: null,
    };
  }
  await page.waitForTimeout(500);
  const toast = await getLatestToast(page);
  await dismissShellTransientUi(page);
  return { selector, clicked, skippedReason: null, toast };
}

async function captureShellNavAudit(browser, viewport, auditRoot) {
  const screenshotDir = path.join(auditRoot, "shell-pages", viewport.name);
  ensureDir(screenshotDir);

  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "warning" || msg.type() === "error") {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });
  page.on("dialog", async (dialog) => {
    try {
      await dialog.accept();
    } catch {
      // ignore
    }
  });

  const report = {
    viewport: viewport.name,
    url: `${BASE_URL}/panel/operator-studio-shell.html`,
    globalButtons: [],
    pages: [],
    consoleWarningsOrErrors: [],
    pageErrors: [],
  };

  try {
    await page.goto(`${BASE_URL}/panel/operator-studio-shell.html`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("#studio-app", { timeout: 15000 });
    await page.waitForTimeout(1200);
    report.consoleWarningsOrErrors = consoleMessages.slice(0, 80);
    report.pageErrors = pageErrors.slice(0, 40);

    for (const selector of SHELL_GLOBAL_SELECTORS) {
      report.globalButtons.push(await clickShellSelector(page, selector));
    }

    await shellOpenNavIfNeeded(page);
    const navLabels = await page.evaluate(() => {
      const seen = new Set();
      return Array.from(document.querySelectorAll("#nav-groups nav button"))
        .map((button) => {
          const style = window.getComputedStyle(button);
          const hidden = button.offsetParent === null || style.display === "none" || style.visibility === "hidden";
          return {
            label: (button.textContent || "").trim(),
            hidden,
          };
        })
        .filter((entry) => entry.label && !entry.hidden && !seen.has(entry.label) && seen.add(entry.label));
    });

    for (const entry of navLabels) {
      const clickedNav = await clickShellNavLabel(page, entry.label);
      if (!clickedNav) {
        report.pages.push({
          navLabel: entry.label,
          pageTitle: null,
          screenshotPath: null,
          overflow: { pageOverflow: false, offenders: [] },
          buttons: [],
          actions: [],
          error: "Navigation button not found at click time.",
        });
        continue;
      }

      try {
        const pageTitle = await page.locator("#page-title").textContent().catch(() => "");
        const overflow = await collectOverflow(page);
        const buttons = await collectVisibleButtons(page, "#action-list button");
        const screenshotPath = path.join(screenshotDir, `${slugify(pageTitle || entry.label)}.png`);
        const screenshot = await takePageScreenshot(page, screenshotPath);

        const actions = [];
        const actionIds = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("#action-list button[data-action-id]"))
            .map((button) => button.getAttribute("data-action-id") || "")
            .filter(Boolean);
        });
        for (const actionId of actionIds) {
          actions.push(await clickShellAction(page, actionId));
        }

        report.pages.push({
          navLabel: entry.label,
          pageTitle: (pageTitle || "").trim(),
          screenshotPath: screenshot.screenshotPath,
          screenshotMode: screenshot.mode,
          overflow,
          buttons,
          actions,
          screenshotError: screenshot.error || null,
        });
      } catch (error) {
        report.pages.push({
          navLabel: entry.label,
          pageTitle: null,
          screenshotPath: null,
          overflow: { pageOverflow: false, offenders: [] },
          buttons: [],
          actions: [],
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    await context.close();
  }

  return report;
}

async function main() {
  const id = stamp();
  const repoRoot = path.resolve(__dirname, "..");
  const auditRoot = path.join(repoRoot, "cleanup-hub", `runtime-audit-${id}`);
  const surfaceDir = path.join(auditRoot, "surface-shots");
  ensureDir(surfaceDir);

  const { rendererMode, launchOptions } = buildChromiumLaunchOptions();
  const browser = await chromium.launch(launchOptions);

  try {
    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      rendererMode,
      importerUrl: IMPORTER_URL,
      viewerUrl: VIEWER_URL,
      auditRoot,
      surfaces: [],
      shell: [],
    };

    for (const viewport of VIEWPORTS) {
      for (const surface of SURFACES) {
        console.log(`Capturing ${surface.id} (${viewport.name})`);
        const viewportDir = path.join(surfaceDir, viewport.name);
        ensureDir(viewportDir);
        report.surfaces.push(await safeSurfaceCapture(browser, surface, viewport, viewportDir));
      }
      console.log(`Auditing operator shell pages (${viewport.name})`);
      report.shell.push(await captureShellNavAudit(browser, viewport, auditRoot));
    }

    const summary = {
      surfaceChecks: report.surfaces.length,
      surfacesWithOverflow: report.surfaces.filter((entry) => entry.overflow.pageOverflow || entry.overflow.offenders.length > 0).length,
      surfacesWithConsoleSignals: report.surfaces.filter((entry) => entry.consoleWarningsOrErrors.length > 0 || entry.pageErrors.length > 0).length,
      shellPagesChecked: report.shell.reduce((sum, entry) => sum + entry.pages.length, 0),
      shellPagesWithOverflow: report.shell.reduce((sum, entry) => sum + entry.pages.filter((page) => page.overflow.pageOverflow || page.overflow.offenders.length > 0).length, 0),
      shellActionChecks: report.shell.reduce((sum, entry) => sum + entry.pages.reduce((pageSum, pageInfo) => pageSum + pageInfo.actions.length, 0), 0),
      shellActionsPendingAfterWait: report.shell.reduce((sum, entry) => sum + entry.pages.reduce((pageSum, pageInfo) => pageSum + pageInfo.actions.filter((action) => action.pendingAfterWait).length, 0), 0),
      shellActionErrorToasts: report.shell.reduce((sum, entry) => sum + entry.pages.reduce((pageSum, pageInfo) => pageSum + pageInfo.actions.filter((action) => action.toast && action.toast.type === "error").length, 0), 0),
    };

    const outPath = path.join(auditRoot, "runtime-ui-snapshot-audit.json");
    fs.writeFileSync(outPath, JSON.stringify({ ...report, summary }, null, 2));
    console.log(`Runtime UI snapshot audit: ${outPath}`);
    console.log(`Renderer: ${rendererMode}`);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
