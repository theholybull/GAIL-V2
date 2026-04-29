import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667 });
  try {
    await page.goto('http://127.0.0.1:4180/gail-mobile/?v=zoom1', { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.log('Navigation warning:', e.message);
  }
  await new Promise(r => setTimeout(r, 8000));
  await page.screenshot({ path: 'test-gail-mobile-zoom1.png' });
  await browser.close();
  console.log('DONE');
})();
