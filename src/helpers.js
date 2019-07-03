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
};
