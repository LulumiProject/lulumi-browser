import { lulumiPagesCustomProtocol } from '../constants/config';

function getLulumiExtUrl(relativeUrl) {
  return `${lulumiPagesCustomProtocol}${relativeUrl}`;
}

const urlResource = {
  aboutUrls(url) {
    switch (url) {
      case 'about:about':
        return getLulumiExtUrl('about/about.html');
      case 'about:blank':
      default:
        return url;
    }
  },
};

export default urlResource;
