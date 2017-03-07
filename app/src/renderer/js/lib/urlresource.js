import config from '../constants/config';

function getLulumiExtUrl(relativeUrl) {
  return `${config.lulumiPagesCustomProtocol}${relativeUrl}.html`;
}

const urlResource = {
  aboutUrls(url) {
    switch (url) {
      case 'about:about':
        return getLulumiExtUrl('about/about');
      case 'about:blank':
      default:
        return url;
    }
  },
};

export default urlResource;
