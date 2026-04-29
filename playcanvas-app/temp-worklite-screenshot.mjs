import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1577, height: 766 } });

await page.goto('http://127.0.0.1:4180/client/work-lite/', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

for (const seconds of [10, 20, 30, 40, 50]) {
  await page.waitForTimeout(10000);
  await page.screenshot({
    path: `D:/Gail/Temp/worklite-shots/shot-${seconds}s.png`,
    fullPage: false,
  });
}

await browser.close();