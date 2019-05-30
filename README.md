# Contact Information Scraper
**Overview**

This crawler lets you scrape contact information from entire domains. After you supply the root domain (eg www.apify.com), the crawler will retrieve any:

- Phone numbers
- Emails
- Facebook accounts
- Twitter handles
- LinkedIn accounts
- Instagram handles

that are featured on the website and all its pages. As such, this crawler is useful for mining contact information of organizations and online services.

**Input Settings**

The crawler lets you specify:

- How deep it should crawl into a website's links.
- Whether it should crawl only within the root domain.
- Whether it should crawl HTML frames.
- Whether it should use a proxy.
- The maximum number of pages it should crawl.
- Whether it should store all sublinks.

**Results**

The crawler stores the results in a dataset, which can be exported into JSON, HTML, XML, RSS, CSV or Excel. Here is an example JSON output:

```json
[{
  "url": "https://apify.com/privacy-policy#cookies",
  "domain": "apify.com",
  "depth": 2,
  "referrerUrl": "http://www.apify.com",
  "emails": [
    "support@apify.com"
  ],
  "phones": [],
  "phonesUncertain": [
    "04788290"
  ],
  "linkedIns": [],
  "twitters": [
    "https://twitter.com/apify"
  ],
  "instagrams": [],
  "facebooks": [
    "https://www.facebook.com/apifytech"
  ]
}]
```
