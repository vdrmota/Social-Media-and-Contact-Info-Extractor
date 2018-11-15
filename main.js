const Apify = require('apify');
const request = require('request-promise');

/**
 * Gets attribute as text from a ElementHandle.
 * @param {ElementHandle} element - The element to get attribute from.
 * @param {string} attr - Name of the attribute to get.
 */
async function getAttribute(element, attr){
    try{
        const prop = await element.getProperty(attr);
        return (await prop.jsonValue()).trim();
    }
    catch(e){return null;}
}

/**
 * Gets the domain name from a URL.
 * @param {url} element - The URL to get domain name from.
 */
function getDomain(url){
    const host1 = url.split('://')[1];
    if(!host1){return null;}
    const host2 = host1.split('/')[0].split('.');
    return host2[host2.length - 2] + '.' + host2[host2.length - 1];
}

/**
 * Waits until all elements on the page are loaded.
 * It needs to be used in page.evaluate.
 */
async function waitForAllElements(){
    let count = 0;
    const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));
    for(let i = 0; i < 10; i++){
        await timeout(1000);
        const cCount = document.getElementsByTagName('*').length;
        if(cCount != count){count = cCount;}
        else{return;}
    }
}

/** Main function */
Apify.main(async () => {
const input = await Apify.getValue('INPUT');
    
    // Create RequestQueue
    console.log('opening request queue');
    const requestQueue = await Apify.openRequestQueue();
	
    // Check if attribute is an Array
    if(!Array.isArray(input.startUrls)){
        throw new Error('INPUT.startUrls must be an array!');
    }
    // Convert any inconsistencies to correct format
    for(let i = 0; i < input.startUrls.length; i++){
        let request = input.startUrls[i];
        if(typeof request === 'string'){request = {url: request};}
	if(request.url.length < 1){continue;}
	if(request.url.indexOf('http') < 0){
	    request.url = ((request.url.indexOf('//') == 0) ? 'https:' : 'https://') + request.url;
	}
        request.userData = {label: 'START', depth: 1, referrer: null};
	request.uniqueKey = request.url,
        input.startUrls[i] = request;
    }
    // Create RequestList
    const requestList = new Apify.RequestList({sources: input.startUrls});
    await requestList.initialize();
	
    /** Function for loading new page.
     * Disables all unnecessary requests and hides Puppeteer. */
    const gotoFunction = async ({ page, request }) => {
    	await page.setRequestInterception(true)
    	page.on('request', intercepted => {
    	    const type = intercepted.resourceType();
    		if(type === 'image' || type === 'stylesheet'){intercepted.abort();}
    		else{intercepted.continue();}
    	})
    	console.log('going to: ' + request.url);
    	await Apify.utils.puppeteer.hideWebDriver(page);
    	return await page.goto(request.url, {timeout: 200000});
    };
    
    /** 
     * Main function for extracting social infor from a page.
     * It needs to be used in page.evaluate. 
     * @param {Object} userData - Current request.userData object.
     */
    const pageFunction = async (userData) => {
        try{
            // current page domain
            const domain = getDomain(window.location.href);
            
            // regular expressions for extraction
            const TEL_REGEX = /(tel|phone|telephone)(\s*):(\s*)(\+?)\d([\+\-\d\s]+)/gi;
            const EMAIL_REGEX = /[a-zA-Z0-9._-]+@(?!(1\.5x)|(2x))([-a-zA-Z0-9]+\.)+([a-zA-Z]{2,15})/gi;
            const LINKEDIN_URL_REGEX = /http(s)?\:\/\/[a-zA-Z]+\.linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/g;
            const INSTAGRAM_URL_REGEX = /(?:(^|[^0-9a-z]))(((http|https):\/\/)?((www\.)?(?:instagram.com|instagr.am)\/([A-Za-z0-9_.]{2,30})))/ig;
            const TWITTER_HANDLE_REGEX = /(?:(?:http|https):\/\/)?(?:www.)?(?:twitter.com)\/(?!(oauth|account|tos|privacy|signup|home|hashtag|search|login|widgets|i|settings|start|share|intent|oct)([\'\"\?\.\/]|$))([A-Za-z0-9_]{1,15})/igm;
            
            // current html
            const html = $('body').html();
            
            // instagram urls
            let matches;
            const instagramUrls = [];
            while((matches = INSTAGRAM_URL_REGEX.exec(html)) !== null){
                instagramUrls.push(matches[2].replace('http://', 'https://'));
            }
            
            // add https:// to urls which don't have protocol. If http:// then replace to https://
            const twitterUrls = _.uniq(html.match(TWITTER_HANDLE_REGEX));
            _.each(twitterUrls, function (element, index, list){
                if (!element.match(/(http|https):\/\//i))
                    element = 'https://' + element;

                element = element.replace('http://', 'https://').replace('www.', '');

                twitterUrls[index] = element;
            });
            
            const result = {
                url: window.location.href,
                domain: domain,
                depth: userData.depth,
                referrerUrl: userData.referrer,
                emails: _.uniq(_.invoke(html.match(EMAIL_REGEX), 'toLowerCase')).filter(function(item) {
                    if (item.startsWith("'") || item.startsWith("//")){return false;}
                    return ! /\.(png|jpg|jpeg|gif)/i.test(item);
                }),
                phones: _.uniq(_.uniq(html.match(TEL_REGEX)).map(s => {
                    const sa = s.split(':');
                    return sa[sa.length - 1].trim();
                })),
                linkedInUrls: _.uniq(html.match(LINKEDIN_URL_REGEX)),
                instagramUrls: _.uniq(_.invoke(instagramUrls, 'toLowerCase')),
                twitterUrls: _.uniq(_.invoke(twitterUrls, 'toLowerCase'))
            };
            
            if(result.emails && result.emails.length > 0){return result;}
            else{return null;}
        
        } 
        catch(e){
            console.log("ERROR: " + e);
            return {domain: domain, error: e.toString()};
        }
    };
    
    /**
     * Adds links from a page to the RequestQueue.
     * @param {Page} page - Puppeteer Page object containing the link elements.
     * @param {RequestQueue} requestQueue - RequestQueue to add the requests to.
     * @param {Request} request - Current page Request.
     * @param {string} input - Main actor INPUT.
     * @param {string} selector - A selector representing the links.
     * @param {string} attr - Name of the element's attribute containing the link.
     */
    const enqueueElements = async ({page, requestQueue, request, input, selector, attr}) => {
        for(const elem of await page.$$(selector)){
            const url = await getAttribute(elem, attr);
            if(!url){continue;}
            const domain = getDomain(url);
            if(!domain){continue;}
            const sameDomain = !('sameDomain' in input) || input.sameDomain;
            const isSameDomain = !sameDomain || getDomain(request.url) === domain;
            const isAllowed = !input.skipDomains || input.skipDomains.indexOf(domain) < 0;
            if(isSameDomain && isAllowed){
                await requestQueue.addRequest(new Apify.Request({
                	url: url,
                	userData: {
                	    label: 'SUBPAGE', 
                	    depth: request.userData.depth + 1,
                	    referrer: request.url
                	}
                }));
            }
        }
    }
    
    /**
     * Main crawler function.
     * Handles processing of each Puppeteer page request.
     */
    const handlePageFunction = async ({ page, request }) => {
        console.log('page open: ' + request.userData.label + ' - ' + request.url);
            
        // Log messages from browser console
        page.on('console', msg => {
            for(let i = 0; i < msg.args.length; ++i){
                console.log(`${i}: ${msg.args[i]}`);
            }
        });
        
        // Wait for body tag to load
        await page.waitForSelector('body', {timeout: 60000});
        
        // Inject libraries to the page
        await Apify.utils.puppeteer.injectJQuery(page);
        await Apify.utils.puppeteer.injectUnderscore(page);
        
        // Wait for all elements to load
        await page.evaluate(waitForAllElements);
        
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
            await enqueueElements({
                page, requestQueue, request, input,
                selector: 'a', 
                attr: 'href'
            });
            await enqueueElements({
                page, requestQueue, request, input, 
                selector: 'frame', 
                attr: 'src'
            });
            await enqueueElements({
                page, requestQueue, request, input,
                selector: 'iframe', 
                attr: 'src'
            });
        }
        
        // Extract social info from the page
        const result = await page.evaluate(pageFunction, request.userData);
        if(result){await Apify.pushData(result);}
    };

    const launchPuppeteerOptions = input.proxyConfig || {};
    if(input.liveView){launchPuppeteerOptions.liveView = true;}
	
    // Create the crawler
    const crawler = new Apify.PuppeteerCrawler({
	requestList,
        requestQueue,
        handlePageFunction,
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed 4 times`);
    	},
    	launchPuppeteerOptions,
    	gotoFunction
    });

    // Start the crawler
    console.log('running the crawler')
    await crawler.run();
});
