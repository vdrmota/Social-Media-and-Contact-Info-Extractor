const Apify = require('apify');
const helpers = require('./helpers');
const crawlerConfig = require('./crawler_config');

// TODOs:
// - The "extract-domain" is not good, for example, for:
//  console.log(extractDomain('xxxx.co.uk'))
// it prints:
// "co.uk", but it should be "xxxx.co.uk"
// - Please use Lint with the Apify coding style to improve the code quality
// - Do not use hard-coded constants (e.g. "60000")
// -



async function main() {
    const input = await Apify.getValue('INPUT');
    if (!input) throw new Error('There is no input!');

    // Create RequestQueue
    const requestQueue = await Apify.openRequestQueue();

    // Create requestList
    const requestList = new Apify.RequestList({
        sources: input.startUrls
    });

    // Initialize request list
    await requestList.initialize();

    // Add some URL attributes
    requestList.requests.forEach((el,i) => requestList[i] = helpers.prepareUrl(el))

    // Puppeteer options
    const launchPuppeteerOptions = input.proxyConfig || {};
    if (input.liveView) launchPuppeteerOptions.liveView = true;

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
        result.referrerUrl = request.userData.referrer
        result.url = await page.url();
        result.domain = await helpers.getDomain(result.url);

        // Extract and save handles, emails, phone numbers
        let socialHandles = await Apify.utils.social.parseHandlesFromHtml(result.html);

        // Merge frames with main
        var mergedSocial = helpers.mergeSocial(frameSocialHandles, socialHandles);
        Object.assign(result, mergedSocial)

        // Clean up
        delete result.html;

        // Store results
        await Apify.pushData(result);
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
            // TODO: I think we should also output failed pages, maybe add a new input option for that
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
