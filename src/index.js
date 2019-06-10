const Apify = require('apify');
const helpers = require('./helpers');
const crawlerConfig = require('./crawlerConfig');

async function main() {
    const input = await Apify.getValue('INPUT');

    // Create RequestQueue
    const requestQueue = await Apify.openRequestQueue();

    // Create requestList
    const requestList = new Apify.RequestList({
        sources: input.startUrls
    });

    // Add some URL attributes
    requestList.sources = await helpers.prepareUrl(requestList.sources);

    // Initialize request list
    await requestList.initialize();

    console.log(requestList)

    // Puppeteer options
    const launchPuppeteerOptions = input.proxyConfig || {};
    if (input.liveView)
        launchPuppeteerOptions.liveView = true;

    // Logic run on page
    const handlePageFunction = async ({
        page,
        request
    }) => {
        console.log('Opened [' + request.userData.label + '] ' + request.url);

        // Wait for body tag to load
        await page.waitForSelector('body', {
            timeout: 60000
        });

        // Enqueue all links on the page
        if (!input.maxDepth || input.maxDepth > request.userData.depth) {
            await helpers.enqueueElements({
                page,
                requestQueue,
                request,
                input,
                selector: 'a',
                attr: 'href'
            });
        }

        // Crawl HTML frames
        var frameSocialHandles = {}
        if (input.considerChildFrames)
            frameSocialHandles = await helpers.crawlFrames(page);

        // Generate result
        var result = {}
        result.html = await page.content();
        result.depth = request.userData.depth
        result.referrerURL = request.userData.referrer
        result.url = await page.url();
        result.domain = await helpers.getDomain(result.url);

        // Extract and save handles, emails, phone numbers
        let socialHandles = await Apify.utils.social.parseHandlesFromHtml(result.html);

        // Merge frames with main
        var mergedSocial = helpers.mergeSocial(frameSocialHandles, socialHandles);
        Object.assign(result, mergedSocial)

        // Clean up
        delete result.html

        // Store results
        await Apify.pushData(result)

    }

    const gotoFunction = crawlerConfig.gotoFunction

    // Create the crawler
    var crawlerOptions = {
        requestList,
        requestQueue,
        handlePageFunction,
        handleFailedRequestFunction: async ({
            request
        }) => {
            console.log(`Request ${request.url} failed 4 times`);
        },
        launchPuppeteerOptions,
        gotoFunction
    };

    // Limit requests
    if (input.maxRequests)
        crawlerOptions.maxRequestsPerCrawl = input.maxRequests;

    // Create crawler
    const crawler = new Apify.PuppeteerCrawler(crawlerOptions);

    // Run crawler
    await crawler.run();
};

module.exports = main;