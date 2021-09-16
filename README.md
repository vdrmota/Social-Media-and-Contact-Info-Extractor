## Features

Our free Contact Details Scraper can crawl any website and extract the following contact information for individuals listed on the website:

- Email addresses
- Phone numbers (from phone links or extracted from text)
- [LinkedIn](https://www.linkedin.com/) profiles
- [Twitter](https://twitter.com/) handles
- [Instagram](https://www.instagram.com/) profiles
- [Facebook](https://www.facebook.com/) user profiles or pages

## Why scrape contact information?
Scraping contact details can give you a fast way to get lead generation data for your marketing and sales teams. Harvesting contact details can help you populate and maintain an up-to-date database of contacts, leads, and prospective customers. Instead of manually visiting web pages and copy-pasting names and numbers, you can extract the data and rapidly sort it in spreadsheets or feed it directly into your existing workflow.

Check out our [industry pages](https://apify.com/industries/marketing-and-media) for use cases and more ideas on how you can take advantage of web scraping.

## Tutorial
Read our [step-by-step guide](https://blog.apify.com/contact-information-scraper-7104cb0df25e/) to using Contact Details Scraper.

## Input Configuration
The actor offers several input options to let you specify which pages will be crawled:

- **Start URLs** - Lets you add a list of URLs of web pages where the scraper should start. You can enter multiple URLs, upload a text file with URLs, or even use a Google Sheets document. 
- **Maximum link depth** - Specifies how deep the actor will scrape links from the web pages specified in the Start URLs. If zero, the actor ignores the links and only crawls the Start URLs.
- **Stay within domain** - If enabled, the actor will only follow links that are on the same domain as the referring page. For example, if the setting is enabled and the actor finds a link on http://www.example.com/some-page to http://www.another-domain.com/, it will not crawl the second page, because `www.example.com` is not the same as `www.another-domain.com`.

The actor also accepts additional input options that let you specify proxy servers, limit the number of pages, etc.

## Results
The actor stores its results into the default dataset associated with the actor run. You can then download the results in formats such as JSON, HTML, CSV, XML, or Excel. For each page crawled, the following contact information is extracted (examples shown):

- **Emails**
  ```
  alice@example.com
  bob.newman@example.com
  carl+test@example.co.uk
  ```
- **Phone numbers** - These are extracted from phone links in HTML (e.g. `<a href='tel://123456789'>phone</a>`).
  ```
  123456789
  +123456789
  00123456789
  ```
- **Uncertain phone numbers** - These are extracted from the plain text of the web page using a number of regular expressions. Note that this approach can generate false positives.
  ```
  +123.456.7890
  123456789
  123-456-789
  ```
- **LinkedIn profiles**
  ```
  https://www.linkedin.com/in/alan-turing
  en.linkedin.com/in/alan-turing
  linkedin.com/in/alan-turing
  ```
- **Twitter profiles**
  ```
  https://www.twitter.com/apify
  twitter.com/apify
  ```
- **Instagram profiles**
  ```
  https://www.instagram.com/old_prague
  www.instagram.com/old_prague/
  instagr.am/old_prague
  ```
- **Facebook profiles or pages**
  ```
  https://www.facebook.com/apifytech
  facebook.com/apifytech
  fb.com/apifytech
  https://www.facebook.com/profile.php?id=123456789
  ```

The results also contain information about the URL of the web page, domain, and referring URL (if the page was linked from another page), and depth (how many links away from **Start URLs** the page was found).

For each page crawled, the resulting dataset contains a single record, which looks like this (in JSON format):

```json
{
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
}
```
## Personal data
You should be aware that your results might contain personal data. Personal data is protected by GDPR in the European Union and by other regulations around the world. You should not scrape personal data unless you have a legitimate reason to do so. If you're unsure whether your reason is legitimate, consult your lawyers. You can also read our blog post on the [legality of web scraping](https://blog.apify.com/is-web-scraping-legal/).

## Notes
This actor was built using [utils.social](https://sdk.apify.com/docs/api/social) from the [Apify SDK](https://sdk.apify.com). If you need to have more control over the crawling and data extraction process, you can relatively easily build a new actor using the Apify SDK. For more details on how to build actors, see our [documentation](https://apify.com/docs).
