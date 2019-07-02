const Apify = require('apify');
const _ = require('underscore');
const domain = require('getdomain');

module.exports = {
  async getAttribute(element, attr) {
    try {
      const prop = await element.getProperty(attr);
      return (await prop.jsonValue()).trim();
    } catch (e) {
      return null;
    }
  },

  getDomain(url) {
    return domain.get(url);
  },

  enqueueElements: async ({
    page,
    requestQueue,
    request,
    input,
    selector,
    attr,
  }) => {
    for (const elem of await page.$$(selector)) {
      const url = await module.exports.getAttribute(elem, attr);
      if (!url) {
        continue;
      }
      const domain = module.exports.getDomain(url);
      if (!domain) {
        continue;
      }

      // Check if same domain is required
      let shouldEnqueue = true;
      if (input.sameDomain) { shouldEnqueue = module.exports.getDomain(request.url) === domain; }

      if (shouldEnqueue) {
        await requestQueue.addRequest(new Apify.Request({
          url,
          userData: {
            depth: request.userData.depth + 1,
            referrer: request.url,
          },
        }));
      }
    }
  },

  crawlFrames: async (page) => {
    const socialHandles = {};
    for (const childFrame of page.mainFrame().childFrames()) {
      const html = await childFrame.content();
      let childSocialHandles = null;
      const childParseData = {};
      try {
        childSocialHandles = Apify.utils.social.parseHandlesFromHtml(html, childParseData);

        // Extract phones from links separately, they are high-certainty
        const childLinkUrls = await childFrame.$$eval('a', linkEls => linkEls.map(link => link.href).filter(href => !!href));

        ['emails', 'phones', 'phonesUncertain', 'linkedIns', 'twitters', 'instagrams', 'facebooks'].forEach((field) => {
          socialHandles[field] = childSocialHandles[field];
        });
      } catch (e) {
        console.log(e);
      }
    }

    ['emails', 'phones', 'phonesUncertain', 'linkedIns', 'twitters', 'instagrams', 'facebooks'].forEach((field) => {
      socialHandles[field] = _.uniq(socialHandles[field]);
    });

    return new Promise((resolve, reject) => {
      resolve(socialHandles);
    });
  },

  mergeSocial(frames, main) {
    const output = main;

    for (const key in output) {
      main[key] = _.uniq(main[key].concat(frames[key]));
    }

    return output;
  },
};

