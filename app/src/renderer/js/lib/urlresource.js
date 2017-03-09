import config from '../constants/config';

function getLulumiExtUrl(relativeUrl) {
  return `${config.lulumiPagesCustomProtocol}${relativeUrl}`;
}

const urlResource = {
  aboutUrls(url) {
    switch (url) {
      case 'about:lulumi':
        return getLulumiExtUrl('about/#/lulumi');
      case 'about:preferences':
        return getLulumiExtUrl('about/#/preferences');
      case 'about:about':
        return getLulumiExtUrl('about/#/');
      case 'about:blank':
      default:
        return url;
    }
  },
};

export default urlResource;
