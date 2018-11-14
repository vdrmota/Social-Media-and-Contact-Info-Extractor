# actor-social-extractor
Apify actor for extracting e-mails, phone numbers and social network links from a website.

This actor crawls a specified website and extracts all e-mails, phone numbers and social network links.

**INPUT**

Input is a JSON object with the following properties:

```javascript
{ 
    "startUrls": START_URL_ARRAY,
    "maxDepth": MAX_CRAWLING_DEPTH,
    "sameDomain": ONLY_FROM_SAME_DOMAIN,
    "skipDomains": DOMAINS_TO_SKIP,
    "proxyConfig": LAUNCH_PUPPETEER_OPTIONS
}
```

* `startUrls` is the only required attribute. This an array of start URLs.  It should look like this:  
```javascript
"startUrls": [
    "https://www.google.com",
    "https://www.amazon.com",
    "https://www.apify.com",
    ...
]
```  
* `maxDepth` defines how deep the crawler will go until it stops, by default unlimited.  
* `sameDomain` specifies if the crawler should only follow links from the same domain, default is `true`.
* `skipDomains` can contain an array of domains that will not be followed (in case `sameDomain` is set to `false`), e.g:
```javascript
"skipDomains": [
    "google.com",
    "amazon.com"
]
```  
* `proxyConfig` define Apify proxy configuration, it should respect this format:  
```javascript
"proxyConfig": {
    "useApifyProxy": true,
    "apifyProxyGroups": [
        "RESIDENTIAL",
        ...
    ]
}
```    
* `liveView` sets if Apify live view will be enabled.
