
const { chromium } = require("playwright");

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const url = "http://127.0.0.1:4180/gail-mobile/?v=avatarfix2";
    const outputPath = "test-gail-mobile-avatarfix2.png";

    try {
        console.log(`Navigating to ${url} ...`);
        await page.goto(url, { timeout: 60000 });
        console.log("Navigated, waiting 20 seconds...");
        await new Promise(resolve => setTimeout(resolve, 20000));
        await page.screenshot({ path: outputPath });
        console.log(`Screenshot saved to ${outputPath}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }

    await browser.close();
    console.log("Done.");
})();

