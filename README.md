# Contact Information Scraper

The actor crawls websites and extracts the following contact information from them:

- Emails
- Phone numbers
- Facebook pages or profiles
- Twitter handles
- LinkedIn profiles
- Instagram profiles

It is useful for automated searching for company contact details, profiling of leads
and marketing campaigns. The actor supports both list of URLs and recursive crawling of websites.

<!-- TODO: link to blog post once published -->


## Input Configuration

The crawler lets you specify:

- How deep it should crawl into a website's links.
- Whether it should crawl only within the root domain.
- Whether it should crawl HTML frames.
- Whether it should use a proxy.
- The maximum number of pages it should crawl.


## Results

For each page loaded

- Emails
  ```
  alice@example.com
  bob.newman@example.com
  ```
- Phone numbers (from elements such as )
- Uncertain phone numbers - extracted from free text

### Emails



### LinkedIn profiles

```
https://www.linkedin.com/in/alan-turing
en.linkedin.com/in/alan-turing
linkedin.com/in/alan-turing
```

The crawler stores the results in a dataset, which can be exported into JSON, HTML, XML, RSS, CSV or Excel. Here is an example JSON output:

- How deep it should crawl into a website's links.
- Whether it should crawl only within the root domain.
- Whether it should crawl HTML frames.
- Whether it should use a proxy.
- The maximum number of pages it should crawl.



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
