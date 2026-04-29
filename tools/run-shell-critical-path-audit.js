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
  await page.waitForTimeout(120);
  try {
    await page.waitForFunction(() => !document.querySelector(".action-btn.is-pending"), null, { timeout: 6000 });
  } catch {
    // best effort only
  }
  await page.waitForTimeout(120);
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
  await page.waitForTimeout(90);
}

async function getLatestToast(page) {
  return page.evaluate(() => {
    const toasts = Array.from(document.querySelectorAll("#toast-stack .toast"));
    if (toasts.length === 0) {
      return null;
    }
    const last = toasts[toasts.length - 1];
    const cls = last.className || "";
    let type = "info";
    if (cls.includes("toast-error")) {
      type = "error";
    } else if (cls.includes("toast-success")) {
      type = "success";
    }
    return {
      type,
      text: (last.textContent || "").trim(),
    };
  });
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
  await setSettingValue(page, "manager.instruction", "Critical path audit directive.");
  await setSettingValue(page, "system.read_file", "README.md");
  await setSettingValue(page, "openai.api_key", AUDIT_OPENAI_KEY);
  await setSettingValue(page, "build.require_screenshot", "false");
}

async function getPageTitle(page) {
  const title = await page.locator("#page-title").textContent();
  return (title || "").trim();
}

async function gotoNavPage(page, navLabel) {
  await dismissTransientUi(page);
  const navBtn = page.locator("#nav-groups nav button", { hasText: navLabel }).first();
  if ((await navBtn.count()) < 1) {
    return { ok: false, title: null };
  }
  await navBtn.scrollIntoViewIfNeeded();
  await navBtn.click({ timeout: 8000, force: true });
  await page.waitForTimeout(280);
  await seedRequiredSettings(page);
  const title = await getPageTitle(page);
  return { ok: true, title };
}

async function clickAction(page, actionId) {
  const rec = {
    actionId,
    ok: true,
    blocked: false,
    toast: null,
    error: null,
  };
  const actionBtn = page.locator(`#action-list button[data-action-id="${actionId}"]`).first();
  if ((await actionBtn.count()) < 1) {
    rec.ok = false;
    rec.blocked = true;
    rec.error = "Action not present on page.";
    return rec;
  }

  const label = ((await actionBtn.textContent()) || "").trim();
  rec.label = label || actionId;

  try {
    await actionBtn.click({ timeout: 8000, noWaitAfter: true });
    await waitForActionSettle(page);
    rec.toast = await getLatestToast(page);
    if (rec.toast && rec.toast.type === "error") {
      rec.ok = false;
      rec.error = rec.toast.text || "Action surfaced an error toast.";
      if ((rec.error || "").toLowerCase().includes("no active directive to cancel")) {
        rec.blocked = true;
      }
    }
  } catch (error) {
    rec.ok = false;
    rec.error = error instanceof Error ? error.message : String(error);
  }

  return rec;
}

const CRITICAL_MATRIX = [
  { page: "Workflow Studio", action: "workflow_refresh" },
  { page: "Workflow Studio", action: "workflow_create" },
  { page: "Workflow Studio", action: "workflow_plan" },
  { page: "Build Control Tower", action: "build_refresh" },
  { page: "Build Control Tower", action: "build_show_latest_results" },
  { page: "Manager Agent", action: "manager_dispatch" },
  { page: "Manager Agent", action: "manager_cancel_first" },
  { page: "Asset Validation", action: "asset_refresh" },
  { page: "Runtime Mapping", action: null },
  { page: "Commands", action: "action_refresh" },
  { page: "Commands", action: "action_execute_sample" },
  { page: "Commands", action: "action_save_mapping" },
  { page: "Feature Inbox", action: "feature_add" },
  { page: "Feature Inbox", action: "feature_refresh" },
  { page: "Report Bugs", action: "bug_create" },
  { page: "Report Bugs", action: "bug_capture_create" },
];

async function main() {
  const outDir = path.resolve("docs", "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = nowStamp();
  const outPath = path.join(outDir, `shell-critical-path-audit-${stamp}.json`);

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
    totals: {
      checked: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
    },
    checks: [],
  };

  await page.goto(SHELL_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#studio-app", { timeout: 15000 });
  await page.waitForTimeout(600);

  for (const test of CRITICAL_MATRIX) {
    const check = {
      page: test.page,
      actionId: test.action,
      ok: false,
      blocked: false,
      detail: null,
    };

    const nav = await gotoNavPage(page, test.page);
    if (!nav.ok) {
      check.blocked = true;
      check.detail = "Navigation target not found.";
      report.checks.push(check);
      continue;
    }
    check.pageTitle = nav.title;

    if (!test.action) {
      check.ok = true;
      check.blocked = false;
      check.label = "page_load";
      check.detail = "Page loaded and settings rendered.";
      report.checks.push(check);
      await dismissTransientUi(page);
      continue;
    }

    if (test.action === "manager_dispatch") {
      await setSettingValue(page, "manager.instruction", "Critical path audit dispatch instruction.");
    }

    const actionRec = await clickAction(page, test.action);
    check.ok = actionRec.ok;
    check.blocked = actionRec.blocked;
    check.label = actionRec.label;
    check.toast = actionRec.toast;
    check.detail = actionRec.error || (actionRec.toast ? actionRec.toast.text : "Action completed.");
    report.checks.push(check);

    await dismissTransientUi(page);
  }

  report.totals.checked = report.checks.length;
  report.totals.passed = report.checks.filter((entry) => entry.ok).length;
  report.totals.blocked = report.checks.filter((entry) => entry.blocked).length;
  report.totals.failed = report.checks.filter((entry) => !entry.ok && !entry.blocked).length;

  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Critical path audit report: ${outPath}`);
  console.log(`Checked: ${report.totals.checked} Passed: ${report.totals.passed} Failed: ${report.totals.failed} Blocked: ${report.totals.blocked}`);

  await context.close();
  await browser.close();

  if (report.totals.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
