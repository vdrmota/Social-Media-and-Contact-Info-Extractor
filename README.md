# Contact Information Scraper

The actor crawls specified websites and extracts the following contact information from the web pages:

- Email addresses
- Phone numbers (from phone links or extracted from text)
- [LinkedIn](https://www.linkedin.com/) profiles
- [Twitter](https://twitter.com/) handles
- [Instagram](https://www.instagram.com/) profiles
- [Facebook](https://www.facebook.com/) user profiles or pages

The actor is useful for automated searching for company contact details, profiling of leads
and marketing campaigns. It supports both crawling of a list of URLs as well as recursive crawling of websites
by adding new links as they are found.

<!-- TODO: link to blog post once published -->


## Input Configuration

On input, the actor has several input options that specify which pages shall be crawled:

- **Start URLs** - A list of URLs of web pages where the crawler should start. You can enter multiple URLs,
  a text file with URLs or even a Google Sheets document. 
- **Maximum link depth** - Specifies how many links away from the web pages specified in Start URLs
  shall the crawler visit. If zero, the actor ignores the links and only crawls the Start URLs.
- **Stay within domain** - If enabled, the actor will only follow links that are on the same domain as the referring page.
  For example, if the setting is enabled and the actor finds on page http://www.example.com/some-page
  a link to http://www.another-domain.com/, it will not crawl the second page,
  since `www.example.com` is not the same as `www.another-domain.com`.

Note that the actor accepts additional input options that let you specify proxy servers, limit the number of pages etc.
See [Input](?section=input-schema) for details.


## Results

The actor stores its results into the default dataset associated with the actor run,
from where they can be downloaded in formats like JSON, HTML, CSV or Excel.
For each page crawled, the following contact information is extracted (including examples):

- **Emails**
  ```
  alice@example.com
  bob.newman@example.com
  carl+test@example.co.uk
  ```
- **Phone numbers** - These are extracted from phone links in HTML (e.g. `<a href='tel://123456789'>phone</a>`)
  ```
  123456789
  +123456789
  00123456789
  ```
- **Uncertain phone numbers** - These are extracted from the plain text of the web page using a number regular expressions.
  Note that due to the nature of the method, there might be false positives.
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

Additionally, the results contain information about the URL of the web page, domain,
and referring URL (if the page was linked from another page), and depth (how many links away from **Start URLs** was the page found).

For each page crawled, the resulting dataset contains a single record, which looks as follows (in JSON format):

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


## Notes

The actor is built using [Social utils](https://sdk.apify.com/docs/api/social) from the [Apify SDK](https://sdk.apify.com).
If you need to have more control about the crawling and data extraction process, you can relatively 
easily build a new actor using the Apify SDK. For more details, see [Actors documentation](https://apify.com/docs). You can also read more about this particular actor in our [blogpost](https://blog.apify.com/contact-information-scraper-7104cb0df25e).
