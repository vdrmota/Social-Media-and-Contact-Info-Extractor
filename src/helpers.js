const Apify = require('apify');

module.exports = {
    // Convert any inconsistencies to correct format
    cleanUrl: function(urls) {
        for(let i = 0; i < urls.length; i++){
            let request = urls[i];
            if(typeof request === 'string'){request = {url: request};}
        if(request.url.length < 1){continue;}
        if(request.url.indexOf('http') < 0){
            request.url = ((request.url.indexOf('//') == 0) ? 'http:' : 'http://') + request.url;
        }
            request.userData = {label: 'ROOT', depth: 1, referrer: null};
            request.uniqueKey = request.url,
            urls[i] = request;
        }
        return urls
    },
    /**
     * Gets attribute as text from a ElementHandle.
     * @param {ElementHandle} element - The element to get attribute from.
     * @param {string} attr - Name of the attribute to get.
     */
    getAttribute: async function (element, attr){
        try{
            const prop = await element.getProperty(attr);
            return (await prop.jsonValue()).trim();
        }
        catch(e){return null;}
    },

    /**
     * Gets the domain name from a URL.
     * @param {url} element - The URL to get domain name from.
     */
    getDomain: function (url){
        const host1 = url.split('://')[1];
        if(!host1){return null;}
        const host2 = host1.split('/')[0].split('.');
        return host2[host2.length - 2] + '.' + host2[host2.length - 1];
    },

    /**
     * Waits until all elements on the page are loaded.
     * It needs to be used in page.evaluate.
     */
    waitForAllElements: async function (){
        let count = 0;
        const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));
        for(let i = 0; i < 10; i++){
            await timeout(200);
            const cCount = document.getElementsByTagName('*').length;
            if(cCount != count){count = cCount;}
            else{return;}
        }
    },

        /**
     * Adds links from a page to the RequestQueue.
     * @param {Page} page - Puppeteer Page object containing the link elements.
     * @param {RequestQueue} requestQueue - RequestQueue to add the requests to.
     * @param {Request} request - Current page Request.
     * @param {string} input - Main actor INPUT.
     * @param {string} selector - A selector representing the links.
     * @param {string} attr - Name of the element's attribute containing the link.
     */
    enqueueElements: async ({page, requestQueue, request, input, selector, attr}) => {
        for(const elem of await page.$$(selector)){
            const url = await module.exports.getAttribute(elem, attr);
            if(!url){continue;}
            const domain = module.exports.getDomain(url);
            if(!domain){continue;}
            const sameDomain = !('sameDomain' in input) || input.sameDomain;
            const isSameDomain = !sameDomain || module.exports.getDomain(request.url) === domain;
            const isAllowed = !input.skipDomains || input.skipDomains.indexOf(domain) < 0;
            if(isSameDomain && isAllowed){
                await requestQueue.addRequest(new Apify.Request({
                	url: url,
                	userData: {
                	    label: 'BRANCH', 
                	    depth: request.userData.depth + 1,
                	    referrer: request.url
                	}
                }));
            }
        }
    }

}

