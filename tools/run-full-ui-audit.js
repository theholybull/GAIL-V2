/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('../playcanvas-app/node_modules/playwright');

const BASE_URL = process.env.GAIL_BASE_URL || 'http://127.0.0.1:4180';
const PAGES = [
  '/panel/',
  '/panel/operator-studio-shell.html',
  '/client/work-lite/',
  '/client/phone/',
  '/client/proof/',
  '/display',
  '/studio'
];

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'mobile', width: 390, height: 844 }
];

function isIgnorableConsoleSignal(entry) {
  const text = String(entry || '');
  return (
    text.includes('GPU stall due to ReadPixels')
  );
}

function stamp() {
  const d = new Date();
  const p = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function collectPageAudit(browser, pagePath, vp) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const logs = [];
  const errors = [];
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      logs.push(`[${type}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    errors.push(String(err));
  });

  const url = `${BASE_URL}${pagePath}`;
  const result = {
    page: pagePath,
    viewport: vp.name,
    url,
    loaded: false,
    status: null,
    finalUrl: null,
    links: [],
    duplicateLinks: [],
    brokenLinks: [],
    buttons: { total: 0, clicked: 0, failed: 0, failures: [] },
    horizontalOverflow: false,
    overflowingElements: [],
    consoleWarningsOrErrors: [],
    pageErrors: []
  };

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    result.status = response ? response.status() : null;
    result.finalUrl = page.url();
    result.loaded = true;
    await page.waitForTimeout(600);

    const linkData = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map((a) => ({
        text: (a.textContent || '').trim(),
        href: a.getAttribute('href') || '',
      }));
    });
    result.links = linkData;

    const dupMap = new Map();
    for (const l of linkData) {
      const key = `${l.text}::${l.href}`;
      dupMap.set(key, (dupMap.get(key) || 0) + 1);
    }
    result.duplicateLinks = Array.from(dupMap.entries())
      .filter(([, count]) => count > 1)
      .map(([key, count]) => {
        const [text, href] = key.split('::');
        return { text, href, count };
      });

    const internalLinks = linkData
      .map((l) => l.href)
      .filter((href) => href && (href.startsWith('/') || href.startsWith(BASE_URL)));
    const uniqInternal = [...new Set(internalLinks)].slice(0, 40);
    for (const href of uniqInternal) {
      const target = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      try {
        const resp = await context.request.get(target, { timeout: 15000 });
        if (resp.status() >= 400) {
          result.brokenLinks.push({ href, status: resp.status() });
        }
      } catch (e) {
        result.brokenLinks.push({ href, status: 'request-failed', error: String(e) });
      }
    }

    const buttonMeta = await page.evaluate(() => {
      const sel = 'button, [role="button"], input[type="button"], input[type="submit"]';
      return Array.from(document.querySelectorAll(sel)).map((el, idx) => {
        const text = (el.textContent || el.getAttribute('value') || '').trim().replace(/\s+/g, ' ');
        return {
          index: idx,
          text,
          id: el.id || '',
          className: el.className || '',
          disabled: !!el.disabled || el.getAttribute('aria-disabled') === 'true'
        };
      });
    });
    result.buttons.total = buttonMeta.length;

    const maxClicks = Math.min(buttonMeta.length, 120);
    for (let i = 0; i < maxClicks; i += 1) {
      let ok;
      try {
        ok = await page.evaluate((index) => {
          const sel = 'button, [role="button"], input[type="button"], input[type="submit"]';
          const nodes = Array.from(document.querySelectorAll(sel));
          const el = nodes[index];
          if (!el) return { skip: true, reason: 'missing' };
          const style = window.getComputedStyle(el);
          const hidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
          if (hidden) return { skip: true, reason: 'hidden' };
          const rect = el.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) return { skip: true, reason: 'zero-size' };
          if (el.disabled || el.getAttribute('aria-disabled') === 'true') return { skip: true, reason: 'disabled' };
          el.click();
          return { skip: false };
        }, i);
      } catch (err) {
        const message = String(err || '');
        // Some pages intentionally navigate after button clicks; do not mark as hard page error.
        if (message.includes('Execution context was destroyed')) {
          try {
            await page.waitForLoadState('domcontentloaded', { timeout: 4000 });
          } catch {
            // best effort
          }
          continue;
        }
        throw err;
      }
      if (ok.skip) {
        continue;
      }
      result.buttons.clicked += 1;
      await page.waitForTimeout(120);
      if (page.isClosed()) {
        result.buttons.failed += 1;
        result.buttons.failures.push({ index: i, reason: 'page-closed-after-click' });
        break;
      }
    }

    try {
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const viewportWidth = doc.clientWidth;
        const pageOverflow = (doc.scrollWidth > viewportWidth + 1) || (body && body.scrollWidth > viewportWidth + 1);
        const offenders = [];
        const nodes = Array.from(document.querySelectorAll('body *'));
        for (const el of nodes) {
          if (!(el instanceof HTMLElement)) continue;
          const className = String(el.className || '');
          if (className.includes('sr-only') || className.includes('visually-hidden')) continue;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;
          const spillsViewport = rect.left < -1 || rect.right > viewportWidth + 1;
          if (spillsViewport) {
            const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120);
            offenders.push({ tag: el.tagName.toLowerCase(), id: el.id || '', className: className.slice(0, 80), text: txt });
            if (offenders.length >= 25) break;
          }
        }
        return { pageOverflow, offenders };
      });
      result.horizontalOverflow = overflow.pageOverflow;
      result.overflowingElements = overflow.offenders;
    } catch (err) {
      const message = String(err || '');
      if (!message.includes('Execution context was destroyed')) {
        throw err;
      }
      result.horizontalOverflow = false;
      result.overflowingElements = [];
    }

    result.consoleWarningsOrErrors = logs.filter((entry) => !isIgnorableConsoleSignal(entry)).slice(0, 120);
    result.pageErrors = errors.slice(0, 60);
  } catch (e) {
    result.pageErrors.push(String(e));
  }

  await context.close();
  return result;
}

async function main() {
  const outDir = path.resolve('docs', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `full-ui-audit-${stamp()}.json`);

  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const pagePath of PAGES) {
    for (const vp of VIEWPORTS) {
      console.log(`Auditing ${pagePath} (${vp.name})`);
      const r = await collectPageAudit(browser, pagePath, vp);
      results.push(r);
    }
  }
  await browser.close();

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalChecks: results.length,
    pagesWithErrors: results.filter((r) => (r.pageErrors && r.pageErrors.length) || (r.consoleWarningsOrErrors && r.consoleWarningsOrErrors.length)).length,
    pagesWithBrokenLinks: results.filter((r) => r.brokenLinks.length > 0).length,
    pagesWithOverflow: results.filter((r) => r.horizontalOverflow || r.overflowingElements.length > 0).length,
    totalButtonsSeen: results.reduce((sum, r) => sum + r.buttons.total, 0),
    totalButtonsClicked: results.reduce((sum, r) => sum + r.buttons.clicked, 0),
    results
  };

  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`Full UI audit report: ${outPath}`);
  console.log(`Checks: ${summary.totalChecks} PagesWithErrors: ${summary.pagesWithErrors} BrokenLinkPages: ${summary.pagesWithBrokenLinks} OverflowPages: ${summary.pagesWithOverflow}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
