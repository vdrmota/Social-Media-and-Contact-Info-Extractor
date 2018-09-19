# act-social-extractor
Apify actor for extracting e-mails, phone numbers and social network links from a website.

This actor crawls a specified website and extracts all e-mails, phone numbers and social network links.

**INPUT**

Input is a JSON object with the following properties:

```javascript
{ 
    "startUrl": START_URL,
    "maxDepth": MAX_CRAWLING_DEPTH,
    "sameDomain": ONLY_FROM_SAME_DOMAIN,
    "skipDomains": DOMAINS_TO_SKIP,
    "puppeteerOptions": LAUNCH_PUPPETEER_OPTIONS
}
```

__startUrl__ is the only required attribute. This is the start page URL.  
__maxDepth__ defines how deep the crawler will go until it stops, by default unlimited.  
__sameDomain__ specifies if the crawler should only follow links from the same domain, default is __true__.  
__skipDomains__ can contain an array of domains that will not be followed (in case __sameDomain__ is set to __false__).
__puppeteerOptions__ is a PuppeteerCrawler parameter [launchPuppeteerOptions](https://www.apify.com/docs/sdk/apify-runtime-js/latest#LaunchPuppeteerOptions).
