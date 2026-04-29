
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { chromium } = require('../playcanvas-app/node_modules/playwright');

const BASE_URL = process.env.GAIL_BASE_URL || 'http://127.0.0.1:4180';
const REPORT_DIR = path.resolve(__dirname, '..', 'docs', 'reports');

function stampForFile() {
  const d = new Date();
  const p = (value) => String(value).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function buildHeaders(persona = 'private_girlfriend', includeContentType = false) {
  const headers = {
    'x-gail-device-id': 'regression-private-dance',
    'x-gail-device-type': 'kiosk',
    'x-gail-mode': 'private',
    'x-gail-private-persona': persona,
  };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function privateChatProbe() {
  const startSessionResponse = await fetch(`${BASE_URL}/conversation/sessions`, {
    method: 'POST',
    headers: buildHeaders('private_girlfriend', true),
    body: JSON.stringify({ title: 'private dance regression probe' }),
  });

  if (!startSessionResponse.ok) {
    throw new Error(`Session create failed (${startSessionResponse.status})`);
  }

  const sessionPayload = await startSessionResponse.json();
  const sessionId = sessionPayload.id;
  const question = 'hello gail, confirm private mode is active in one short sentence.';

  const startedAt = performance.now();
  const replyResponse = await fetch(`${BASE_URL}/conversation/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: buildHeaders('private_girlfriend', true),
    body: JSON.stringify({ content: question }),
  });
  const latencyMs = Math.round(performance.now() - startedAt);

  if (!replyResponse.ok) {
    throw new Error(`Message send failed (${replyResponse.status})`);
  }

  const replyPayload = await replyResponse.json();
  const replyText = String(replyPayload.reply?.content || '').trim();
  return {
    sessionId,
    latencyMs,
    reply: replyText,
    replyLength: replyText.length,
    usedProvider: replyPayload.usedProvider || null,
  };
}

async function danceUiProbe() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLines = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error' || type === 'warning' || text.includes('[dance]')) {
      consoleLines.push(`[${type}] ${text}`);
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(String(err));
  });

  await page.goto(`${BASE_URL}/client/work-lite/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#persona-select', { timeout: 45000 });
  await page.waitForSelector('#chat-input', { timeout: 45000 });
  await page.waitForTimeout(1200);

  await page.selectOption('#persona-select', 'private_girlfriend');
  await page.waitForFunction(() => {
    const status = document.querySelector('#stage-status');
    const text = (status?.textContent || '').toLowerCase();
    return text.includes('scene ready');
  }, null, { timeout: 90000 });
  await page.waitForTimeout(1000);

  await page.fill('#chat-input', 'lets dance');
  await page.click('#chat-send');
  await page.waitForTimeout(12000);

  const stageStatus = await page.$eval('#stage-status', (el) => (el.textContent || '').trim()).catch(() => 'missing-stage-status');
  const chatTail = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#chat-log .chat-row'));
    return rows.slice(-4).map((row) => (row.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  });

  const avatarVisible = await page.evaluate(() => {
    const canvas = document.querySelector('#stage-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      return false;
    }
    const rect = canvas.getBoundingClientRect();
    return rect.width > 10 && rect.height > 10;
  });

  await context.close();
  await browser.close();

  const danceLogs = consoleLines.filter((line) => line.includes('[dance]'));
  const hardFailures = consoleLines.filter((line) => {
    const lower = line.toLowerCase();
    return lower.includes('failed to start dance') || lower.includes('aborting') || lower.includes('uncaught');
  });

  return {
    danceLogHitCount: danceLogs.length,
    danceLogTail: danceLogs.slice(-5),
    stageStatus,
    chatTail,
    avatarVisible,
    hardFailureCount: hardFailures.length,
    hardFailureTail: hardFailures.slice(-10),
    pageErrorCount: pageErrors.length,
    pageErrors: pageErrors.slice(0, 20),
  };
}

async function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const privateChat = await privateChatProbe();
  const danceProbe = await danceUiProbe();

  const overallPass =
    privateChat.replyLength > 0 &&
    danceProbe.avatarVisible === true &&
    danceProbe.danceLogHitCount > 0 &&
    danceProbe.hardFailureCount === 0 &&
    danceProbe.pageErrorCount === 0;

  const report = {
    timestamp: new Date().toISOString(),
    overallPass,
    privateChat,
    danceProbe,
  };

  const outPath = path.join(REPORT_DIR, `private-dance-regression-${stampForFile()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`Report: ${outPath}`);
  console.log(`overallPass=${overallPass} latencyMs=${privateChat.latencyMs} danceLogs=${danceProbe.danceLogHitCount} pageErrors=${danceProbe.pageErrorCount}`);

  if (!overallPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

