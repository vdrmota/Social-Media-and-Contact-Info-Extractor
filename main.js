const Apify = require('apify');
const request = require('request-promise');

async function saveScreenshot(name, page){
    try{
        const screenshotBuffer = await page.screenshot();
        await Apify.setValue(name + '.png', screenshotBuffer, { contentType: 'image/png' });
        const html = await page.evaluate(() => document.body.innerHTML);
        await Apify.setValue(name + '.html', html, { contentType: 'text/html' });
    }
    catch(e){console.log('unable to save screenshot: ' + name);}
}

async function getText(element){
    try{
        const prop = await element.getProperty('textContent');
        return (await prop.jsonValue()).trim();
    }
    catch(e){return null;}
}

async function getAttribute(element, attr){
    try{
        const prop = await element.getProperty(attr);
        return (await prop.jsonValue()).trim();
    }
    catch(e){return null;}
}

function getDomain(url){
    const host1 = url.split('://')[1];
    if(!host1){return null;}
    const host2 = host1.split('/')[0].split('.');
    return host2[host2.length - 2] + '.' + host2[host2.length - 1];
}

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

Apify.main(async () => {
    const input = await Apify.getValue('INPUT');
    
    console.log('opening request queue');
    const requestQueue = await Apify.openRequestQueue();
    if(!input.startUrl){throw new Error('Missinq "startUrl" attribute in INPUT!');}
    
    await requestQueue.addRequest(new Apify.Request({ 
    	url: input.startUrl,
    	userData: {label: 'START', depth: 1, referrer: null}
    }));
	
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
    
    const pageFunction = async (userData) => {
        try{
            var domain = getDomain(window.location.href);
            
            var TEL_REGEX = /(tel|phone|telephone)(\s*):(\s*)([\+\-\d\s]+)/gi;
            var EMAIL_REGEX = /[a-zA-Z0-9._-]+@(?!(1\.5x)|(2x))([-a-zA-Z0-9]+\.)+([a-zA-Z]{2,15})/gi;
            var LINKEDIN_URL_REGEX = /http(s)?\:\/\/[a-zA-Z]+\.linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/g;
            var INSTAGRAM_URL_REGEX = /(?:(^|[^0-9a-z]))(((http|https):\/\/)?((www\.)?(?:instagram.com|instagr.am)\/([A-Za-z0-9_.]{2,30})))/ig;
            var TWITTER_HANDLE_REGEX = /(?:(?:http|https):\/\/)?(?:www.)?(?:twitter.com)\/(?!(oauth|account|tos|privacy|signup|home|hashtag|search|login|widgets|i|settings|start|share|intent|oct)([\'\"\?\.\/]|$))([A-Za-z0-9_]{1,15})/igm;
            
            var html = $('body').html();
            //var referrerUrl = (context.request.type === 'StartUrl') ? 'N/A' : context.request.referrer.url;
            
            // instagram urls
            var matches;
            var instagramUrls = [];
            while((matches = INSTAGRAM_URL_REGEX.exec(html)) !== null){
                instagramUrls.push(matches[2].replace('http://', 'https://'));
            }
            
            // add https:// to urls which doens't have protocol. If http:// then replace to https://
            var twitterUrls = _.uniq(html.match(TWITTER_HANDLE_REGEX));
            _.each(twitterUrls, function (element, index, list){
                if (!element.match(/(http|https):\/\//i))
                    element = 'https://' + element;

                element = element.replace('http://', 'https://').replace('www.', '');

                twitterUrls[index] = element;
            });
            
            var result = {
                url: window.location.href,
                domain: domain,
                depth: userData.depth,
                //label: context.request.label,
                referrerUrl: userData.referrer,
                emails: _.uniq(_.invoke(html.match(EMAIL_REGEX), 'toLowerCase')).filter(function(item) {
                    if (item.startsWith("'") || item.startsWith("//")){return false;}
                    return ! /\.(png|jpg|jpeg|gif)/i.test(item);
                }),
                phones: _.uniq(html.match(TEL_REGEX)),
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
    
    const handlePageFunction = async ({ page, request }) => {
        console.log('page open: ' + request.userData.label + ' - ' + request.url);
            
        page.on('console', msg => {
            for(let i = 0; i < msg.args.length; ++i){
                console.log(`${i}: ${msg.args[i]}`);
            }
        });
        
        await page.waitForSelector('body', {timeout: 60000});
        
        await Apify.utils.puppeteer.injectJQuery(page);
        await Apify.utils.puppeteer.injectUnderscore(page);
        
        await page.evaluate(waitForAllElements);
        
        await page.evaluate(() => {
            window.getDomain = function(url){
                const host1 = url.split('://')[1];
                const host2 = host1.split('/')[0].split('.');
                return host2[host2.length - 2] + '.' + host2[host2.length - 1];
            };
        });
        
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
        
        const result = await page.evaluate(pageFunction, request.userData);
        if(result){await Apify.pushData(result);}
    };

    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
        handlePageFunction,
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed 4 times`);
	},
	maxRequestRetries: 1,
	maxConcurrency: input.parallels || 1,
	pageOpsTimeoutMillis: 999999,
	launchPuppeteerOptions: input.puppeteerOptions || {},
	gotoFunction
    });

    console.log('running the crawler')
    await crawler.run();
});
