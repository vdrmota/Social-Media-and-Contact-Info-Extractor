const Apify = require('apify');

module.exports = {

    gotoFunction: async ({
        page,
        request
    }) => {
        await page.setRequestInterception(true)
        page.on('request', intercepted => {
            const type = intercepted.resourceType();
            if (type === 'image' || type === 'stylesheet') {
                intercepted.abort();
            } else {
                intercepted.continue();
            }
        })
        console.log('Accessing ' + request.url);
        await Apify.utils.puppeteer.hideWebDriver(page);
        return await page.goto(request.url, {
            timeout: 200000,
            waitUntil: "domcontentloaded"
        });
    }
};