const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    console.log('Navigating to http://127.0.0.1:4180/gail-mobile/ ...');
    await page.goto('http://127.0.0.1:4180/gail-mobile/', { waitUntil: 'networkidle' });
    console.log('Waiting 20 seconds...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    await page.screenshot({ path: 'test-gail-mobile-shot.png' });
    console.log('Screenshot saved to test-gail-mobile-shot.png');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
