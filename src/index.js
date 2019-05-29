const Apify = require('apify');
const helpers = require('./helpers');
const crawlerConfig = require('./crawlerConfig');

async function main() {
    const input = await Apify.getValue('INPUT');
    
    // Create RequestQueue
    const requestQueue = await Apify.openRequestQueue();

    // Clean urls
    input.startUrls = helpers.cleanUrl(input.startUrls)

    // Create requestList
    const requestList = new Apify.RequestList({sources: input.startUrls});
    await requestList.initialize();
    
    // Puppeteer options
    const launchPuppeteerOptions = input.proxyConfig || {};
    if (input.liveView) 
        launchPuppeteerOptions.liveView = true;

    // Logic run on page
    const handlePageFunction = async ({ page, request }) => {
        const input = await Apify.getValue('INPUT');

        console.log('Opened [' + request.userData.label + '] ' + request.url);
        
        // Wait for body tag to load
        await page.waitForSelector('body', {timeout: 60000});
        
        // Inject libraries to the page
        await Apify.utils.puppeteer.injectJQuery(page);
        await Apify.utils.puppeteer.injectUnderscore(page);
        
        // Wait for all elements to load
        if(input.waitForAjax){
                await page.evaluate(helpers.waitForAllElements);
        }
        
        // Add getDomain function to page context
        await page.evaluate(() => {
            window.getDomain = function(url){
                const host1 = url.split('://')[1];
                const host2 = host1.split('/')[0].split('.');
                return host2[host2.length - 2] + '.' + host2[host2.length - 1];
            };
        });
        
        // Enqueue all links on the page
        if(!input.maxDepth || input.maxDepth > request.userData.depth){
            await helpers.enqueueElements({
                page, requestQueue, request, input,
                selector: 'a', 
                attr: 'href'
            });
            await helpers.enqueueElements({
                page, requestQueue, request, input, 
                selector: 'frame', 
                attr: 'src'
            });
            await helpers.enqueueElements({
                page, requestQueue, request, input,
                selector: 'iframe', 
                attr: 'src'
            });
        }
        
        // Extract and save handles, emails, phone numbers
        var result = await page.evaluate(crawlerConfig.pageFunction, request.userData);
        result.data = Apify.utils.social.parseHandlesFromHtml(result.html);
        delete result.html
        await Apify.pushData(result)

    }

    const gotoFunction = crawlerConfig.gotoFunction
    
    // Create the crawler
    var crawlerOptions = {
	    requestList,
        requestQueue,
        handlePageFunction,
        handleFailedRequestFunction: async ({ request }) => {
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