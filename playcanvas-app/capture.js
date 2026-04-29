import puppeteer from 'puppeteer';
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('http://127.0.0.1:4180/gail-mobile/?v=clothed1', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 24000));
        await page.screenshot({ path: 'test-gail-mobile-clothed1.png' });
        await browser.close();
        console.log('SCREENSHOT_SUCCESS');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
