
const { chromium } = require("playwright");

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on("console", msg => {
        console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
    });

    page.on("pageerror", err => {
        console.log(`PAGE ERROR: ${err.message}`);
    });

    try {
        console.log("Navigating to http://127.0.0.1:4180/gail-mobile/?v=diag1 ...");
        await page.goto("http://127.0.0.1:4180/gail-mobile/?v=diag1", { timeout: 30000 });
        console.log("Navigated, waiting 20 seconds...");
        await new Promise(resolve => setTimeout(resolve, 20000));
    } catch (e) {
        console.log(`Navigation failed: ${e.message}`);
    }

    await browser.close();
    console.log("Done.");
})();

