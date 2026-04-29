/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("../playcanvas-app/node_modules/playwright");

const BASE_URL = process.env.GAIL_BASE_URL || "http://127.0.0.1:4180";
const SHELL_URL = `${BASE_URL}/panel/operator-studio-shell.html`;
const AUDIT_OPENAI_KEY = process.env.OPENAI_API_KEY || "sk-audit-placeholder";

function nowStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

async function waitForActionSettle(page) {
  await page.waitForTimeout(150);
  try {
    await page.waitForFunction(() => !document.querySelector(".action-btn.is-pending"), null, { timeout: 4500 });
  } catch {
    // best effort
  }
  await page.waitForTimeout(150);
}

async function getLatestToast(page) {
  return page.evaluate(() => {
    const toasts = Array.from(document.querySelectorAll("#toast-stack .toast"));
    if (toasts.length === 0) {
      return null;
    }
    const last = toasts[toasts.length - 1];
    const cls = last.className;
    let type = "info";
    if (cls.includes("toast-error")) {
      type = "error";
    } else if (cls.includes("toast-success")) {
      type = "success";
    }
    return { type, text: last.textContent || "" };
  });
}

async function getPageTitle(page) {
  const title = await page.locator("#page-title").textContent();
  return (title || "").trim();
}

async function dismissTransientUi(page) {
  await page.evaluate(() => {
    document.querySelectorAll("dialog[open]").forEach((dialog) => {
      if (typeof dialog.close === "function") {
        dialog.close();
      }
    });
    document.body.classList.remove("nav-open", "inspector-open");
  });
  await page.waitForTimeout(100);
}

async function setSettingValue(page, key, value) {
  return page.evaluate(({ domId, nextValue }) => {
    const element = document.getElementById(domId);
    if (!element) {
      return false;
    }
    element.value = String(nextValue);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }, { domId: `setting-${key}`, nextValue: value });
}

async function seedRequiredSettings(page) {
  await setSettingValue(page, "manager.instruction", "Audit dispatch directive for UI validation.");
  await setSettingValue(page, "system.read_file", "README.md");
  await setSettingValue(page, "openai.api_key", AUDIT_OPENAI_KEY);
  await setSettingValue(page, "build.require_screenshot", "false");
}

async function clickAndRecord(page, buttonHandle, context) {
  const label = (await buttonHandle.textContent())?.trim() || "(no label)";
  const actionId = (await buttonHandle.getAttribute("data-action-id")) || "";
  const rec = {
    page: context.page,
    section: context.section,
    actionId,
    label,
    ok: true,
    blocked: false,
    toast: null,
    error: null,
  };
  try {
    await buttonHandle.click({ timeout: 10000 });
    await waitForActionSettle(page);
    rec.toast = await getLatestToast(page);
    if (rec.toast && rec.toast.type === "error") {
      rec.ok = false;
      rec.error = rec.toast?.text || "Shell console indicates failure.";
      if ((rec.error || "").toLowerCase().includes("unable to resolve blender executable")) {
        rec.blocked = true;
      }
    }
  } catch (error) {
    rec.ok = false;
    rec.error = error instanceof Error ? error.message : String(error);
    if ((rec.error || "").toLowerCase().includes("unable to resolve blender executable")) {
      rec.blocked = true;
    }
  }
  return rec;
}

async function retryActionWithPreconditions(page, rec) {
  if (rec.ok || rec.blocked) {
    return rec;
  }
  const message = (rec.error || "").toLowerCase();
  let handled = false;

  if (message.includes("directive instruction field")) {
    handled = await setSettingValue(page, "manager.instruction", "Audit dispatch directive for UI validation.");
  } else if (message.includes("openai api key must not be empty")) {
    handled = await setSettingValue(page, "openai.api_key", AUDIT_OPENAI_KEY);
  } else if (message.includes("set a file path in read file path first")) {
    handled = await setSettingValue(page, "system.read_file", "README.md");
  } else if (message.includes("screenshot analysis evidence")) {
    handled = await setSettingValue(page, "build.require_screenshot", "false");
  } else if (message.includes("no issue available to attach screenshot")) {
    const createButton = page.locator('#action-list button[data-action-id="bug_create"]');
    if ((await createButton.count()) > 0) {
      const createRec = await clickAndRecord(page, await createButton.first().elementHandle(), { page: rec.page, section: rec.section });
      handled = createRec.ok;
    }
  } else if (message.includes("no active directive to cancel")) {
    handled = await setSettingValue(page, "manager.instruction", "Audit cancel flow precondition dispatch.");
    const dispatchButton = page.locator('#action-list button[data-action-id="manager_dispatch"]');
    if ((await dispatchButton.count()) > 0) {
      const dispatchRec = await clickAndRecord(page, await dispatchButton.first().elementHandle(), { page: rec.page, section: rec.section });
      handled = handled || dispatchRec.ok;
    }
  }

  if (!handled) {
    return rec;
  }

  await dismissTransientUi(page);
  let target = null;
  if (rec.actionId) {
    const candidate = page.locator(`#action-list button[data-action-id="${rec.actionId}"]`);
    if ((await candidate.count()) > 0) {
      target = await candidate.first().elementHandle();
    }
  }
  if (!target) {
    const byText = page.locator("#action-list button", { hasText: rec.label });
    if ((await byText.count()) > 0) {
      target = await byText.first().elementHandle();
    }
  }
  if (!target) {
    return rec;
  }

  const retryRec = await clickAndRecord(page, target, { page: rec.page, section: rec.section });
  retryRec.retryOf = rec.error;
  return retryRec;
}

async function main() {
  const outDir = path.resolve("docs", "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = nowStamp();
  const outPath = path.join(outDir, `ui-click-audit-${stamp}.json`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("dialog", async (dialog) => {
    try {
      await dialog.accept();
    } catch {
      // ignore
    }
  });

  const report = {
    timestamp: new Date().toISOString(),
    url: SHELL_URL,
    global: [],
    pages: [],
    totals: { checked: 0, failed: 0 },
  };

  await page.goto(SHELL_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#studio-app", { timeout: 15000 });
  await page.waitForTimeout(700);

  const globalSelectors = [
    "#open-help",
    "#toggle-guided",
    "#open-command",
    "#open-change",
    "#toggle-console",
  ];
  for (const selector of globalSelectors) {
    const loc = page.locator(selector);
    if ((await loc.count()) < 1) {
      continue;
    }
    let visible = false;
    try {
      visible = await loc.first().isVisible();
    } catch {
      visible = false;
    }
    if (!visible) {
      continue;
    }
    const rec = await clickAndRecord(page, await loc.elementHandle(), { page: "global", section: "topbar" });
    report.global.push(rec);
    await dismissTransientUi(page);
  }

  const navLabels = await page.evaluate(() => {
    const labels = [];
    const seen = new Set();
    const buttons = Array.from(document.querySelectorAll("#nav-groups nav button"));
    for (const button of buttons) {
      const label = (button.textContent || "").trim();
      if (!label) {
        continue;
      }
      const style = window.getComputedStyle(button);
      const hidden = button.offsetParent === null || style.display === "none" || style.visibility === "hidden";
      if (hidden || seen.has(label)) {
        continue;
      }
      seen.add(label);
      labels.push(label);
    }
    return labels;
  });

  for (const navLabel of navLabels) {
    await dismissTransientUi(page);
    const btn = page.locator("#nav-groups nav button", { hasText: navLabel }).first();
    if ((await btn.count()) < 1) {
      continue;
    }
    const pageName = ((await btn.textContent()) || "").trim();
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ timeout: 10000, force: true });
    await page.waitForTimeout(350);
    await seedRequiredSettings(page);

    const pageTitle = await getPageTitle(page);
    const pageRec = { page: pageTitle || pageName, actions: [] };

    const actionIds = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("#action-list button"))
        .map((button) => button.getAttribute("data-action-id") || "")
        .filter(Boolean);
    });

    for (const actionId of actionIds) {
      const actionButton = page.locator(`#action-list button[data-action-id="${actionId}"]`);
      if ((await actionButton.count()) < 1) {
        continue;
      }
      const actionHandle = await actionButton.first().elementHandle();
      const firstRec = await clickAndRecord(page, actionHandle, { page: pageRec.page, section: "action-list" });
      const rec = await retryActionWithPreconditions(page, firstRec);
      pageRec.actions.push(rec);
      await dismissTransientUi(page);
    }

    report.pages.push(pageRec);
  }

  const all = [
    ...report.global,
    ...report.pages.flatMap((entry) => entry.actions),
  ];
  report.totals.checked = all.length;
  report.totals.blocked = all.filter((entry) => entry.blocked).length;
  report.totals.failed = all.filter((entry) => !entry.ok && !entry.blocked).length;

  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`UI click audit report: ${outPath}`);
  console.log(`Checked: ${report.totals.checked} Failed: ${report.totals.failed} Blocked: ${report.totals.blocked}`);

  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
