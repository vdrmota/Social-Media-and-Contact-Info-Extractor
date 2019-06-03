# Contact Information Scraper
**Overview**

This crawler lets you scrape contact information from entire domains. After you supply the start URL (eg www.apify.com), the crawler will retrieve any:

- Phone numbers
- Emails
- Facebook accounts
- Twitter handles
- LinkedIn accounts
- Instagram handles

it finds on the website and all its pages. As such, this crawler is useful for mining contact information of organizations and online services.

**Input Settings**

The crawler lets you specify:

- How deep it should crawl into a website's links.
- Whether it should crawl only within the root domain.
- Whether it should crawl HTML frames.
- Whether it should use a proxy.
- The maximum number of pages it should crawl.

**Results**

The crawler stores the results in a dataset, which can be exported into JSON, HTML, XML, RSS, CSV or Excel. Here is an example JSON output:

```json
[{
  "url": "http://www.robertlmyers.com/index.html",
  "domain": "robertlmyers.com",
  "depth": 2,
  "referrerUrl": "http://www.robertlmyers.com",
  "emails": [
    "info@robertlmyers.com"
  ],
  "phones": [],
  "phonesUncertain": [
    "717.393.3643"
  ],
  "linkedIns": [],
  "twitters": [],
  "instagrams": [],
  "facebooks": [
    "https://www.facebook.com/robertlmyers/"
  ]
}]
```
