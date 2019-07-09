const Apify = require('apify');
const _ = require('underscore');
const domain = require('getdomain');

const { Request } = Apify;

async function extractUrlsFromPage(page, selector, sameDomain, urlDomain) {
  /* istanbul ignore next */
  const output = await page.$$eval(selector, linkEls => linkEls
    .map(link => link.href)
    .filter(href => !!href));

  return output.filter(url => (sameDomain ? module.exports.getDomain(url) === urlDomain : true));
}

function createRequestOptions(sources, userData = {}) {
  return sources
    .map(src => (typeof src === 'string' ? { url: src } : src))
    .filter(({ url }) => {
      try {
        return new URL(url).href;
      } catch (err) {
        return false;
      }
    })
    .map((rqOpts) => {
      const rqOptsWithData = rqOpts;
      rqOptsWithData.userData = { ...rqOpts.userData, ...userData };
      return rqOptsWithData;
    });
}

function createRequests(requestOptions, pseudoUrls) {
  if (!(pseudoUrls && pseudoUrls.length)) {
    return requestOptions.map(opts => new Request(opts));
  }

  const requests = [];
  requestOptions.forEach((opts) => {
    pseudoUrls
      .filter(purl => purl.matches(opts.url))
      .forEach((purl) => {
        const request = purl.createRequest(opts);
        requests.push(request);
      });
  });
  return requests;
}

async function addRequestsToQueueInBatches(requests, requestQueue, batchSize = 5) {
  const queueOperationInfos = [];
  requests.forEach(async (request) => {
    /* eslint-disable no-await-in-loop */
    queueOperationInfos.push(requestQueue.addRequest(request));
    if (queueOperationInfos.length % batchSize === 0) await Promise.all(queueOperationInfos);
    /* eslint-enable no-await-in-loop */
  });
  return Promise.all(queueOperationInfos);
}

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

  crawlFrames: async (page) => {
    const socialHandles = {};
    page.mainFrame().childFrames().forEach(async (item) => {
      const html = await item.content();
      let childSocialHandles = null;
      const childParseData = {};
      try {
        childSocialHandles = Apify.utils.social.parseHandlesFromHtml(html, childParseData);

        ['emails', 'phones', 'phonesUncertain', 'linkedIns', 'twitters', 'instagrams', 'facebooks'].forEach((field) => {
          socialHandles[field] = childSocialHandles[field];
        });
      } catch (e) {
        console.log(e);
      }
    });


    ['emails', 'phones', 'phonesUncertain', 'linkedIns', 'twitters', 'instagrams', 'facebooks'].forEach((field) => {
      socialHandles[field] = _.uniq(socialHandles[field]);
    });

    return new Promise((resolve) => {
      resolve(socialHandles);
    });
  },

  mergeSocial(frames, main) {
    const output = main;

    Object.keys(output).forEach((key) => {
      output[key] = _.uniq(main[key].concat(frames[key]));
    });

    return output;
  },

  enqueueUrls: async (options = {}) => {
    const {
      page,
      requestQueue,
      selector = 'a',
      sameDomain,
      urlDomain,
      depth,
    } = options;

    const urls = await extractUrlsFromPage(page, selector, sameDomain, urlDomain);

    const requestOptions = createRequestOptions(urls, { depth: depth + 1 });

    const requests = createRequests(requestOptions);
    return addRequestsToQueueInBatches(requests, requestQueue);
  },
};
