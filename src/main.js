const Apify = require('apify');
const helpers = require('./helpers');
const crawlerConfig = require('./crawler_config');


const PAGE_GOTO_TIMEOUT_SECS = 200;
const WAIT_FOR_BODY_SECS = 60;

Apify.main(async () => {
    const input = await Apify.getValue('INPUT');
    if (!input) throw new Error('There is no input!');

    // Create RequestQueue
    const requestQueue = await Apify.openRequestQueue();

    // Create requestList
    const requestList = new Apify.RequestList({
        sources: input.startUrls,
    });

    // Initialize request list
    await requestList.initialize();

    // Add some URL attributes
    // TODO: This is a bad design - it's accessing an internal field of RequestList,
    // this needs to be done before calling new Apify.RequestList constructor
    requestList.requests.forEach((el, i) => requestList[i] = helpers.prepareUrl(el));

    // Puppeteer options
    const launchPuppeteerOptions = input.proxyConfig || {};
    if (input.liveView) launchPuppeteerOptions.liveView = true;
    launchPuppeteerOptions.stealth = true;
    launchPuppeteerOptions.useChrome = true;

    // Create the crawler
    const crawlerOptions = {
        requestList,
        requestQueue,
        handlePageFunction: async ({ page, request }) => {
            console.log(`Processing ${request.url}`);

            // Wait for body tag to load
            await page.waitForSelector('body', {
                timeout: WAIT_FOR_BODY_SECS * 1000,
            });

            // Enqueue all links on the page
            if (typeof input.maxDepth !== 'number' || input.maxDepth > request.userData.depth) {
                await helpers.enqueueElements({
                    page,
                    requestQueue,
                    request,
                    input,
                    selector: 'a',
                    attr: 'href',
                });
            }

            // Crawl HTML frames
            let frameSocialHandles = {};
            if (input.considerChildFrames) {
                frameSocialHandles = await helpers.crawlFrames(page);
            }

            // Generate result
            const result = {};
            result.html = await page.content();
            result.depth = request.userData.depth;
            result.referrerUrl = request.userData.referrer;
            result.url = await page.url();
            result.domain = await helpers.getDomain(result.url);

            // Extract and save handles, emails, phone numbers
            const socialHandles = await Apify.utils.social.parseHandlesFromHtml(result.html);

            // Merge frames with main
            const mergedSocial = helpers.mergeSocial(frameSocialHandles, socialHandles);
            Object.assign(result, mergedSocial);

            // Clean up
            delete result.html;

            // Store results
            await Apify.pushData(result);
        },
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed 4 times`);
        },
        launchPuppeteerOptions,
        gotoFunction: async ({ page, request }) => {
            console.log('Loading ' + request.url);

            // Block resources such as images and CSS files, to increase crawling speed
            await Apify.utils.puppeteer.blockRequests(page);

            return await page.goto(request.url, {
                timeout: PAGE_GOTO_TIMEOUT_SECS * 1000,
                waitUntil: "domcontentloaded"
            });
        },
    };

    // Limit requests
    if (input.maxRequests) crawlerOptions.maxRequestsPerCrawl = input.maxRequests;

    // Create crawler
    const crawler = new Apify.PuppeteerCrawler(crawlerOptions);

    // Run crawler
    await crawler.run();
});


