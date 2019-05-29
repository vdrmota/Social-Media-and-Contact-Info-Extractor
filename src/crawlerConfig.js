const Apify = require('apify');

module.exports = {

    pageFunction: async (userData) => {
        // current page domain
        const domain = getDomain(window.location.href);
        
        try{
            
            // current html
            const html = $('body').html();
            
            const result = {
                url: window.location.href,
                domain: domain,
                depth: userData.depth,
                referrerUrl: userData.referrer,
                html: html
            };
            
            return result
        
        } 
        catch(e){
            console.log("ERROR: " + e);
            return {domain: domain, error: e.toString()};
        }
    },

    gotoFunction: async ({ page, request }) => {
    	await page.setRequestInterception(true)
    	page.on('request', intercepted => {
    	    const type = intercepted.resourceType();
    		if(type === 'image' || type === 'stylesheet'){intercepted.abort();}
    		else{intercepted.continue();}
    	})
    	console.log('Accessing ' + request.url);
    	await Apify.utils.puppeteer.hideWebDriver(page);
    	return await page.goto(request.url, {timeout: 200000});
    }
};