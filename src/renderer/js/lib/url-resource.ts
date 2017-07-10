import config from '../constants/config';

function getLulumiExtUrl(relativeUrl: string): string {
  return `${config.lulumiPagesCustomProtocol}${relativeUrl}`;
}

const urlResource = {
  aboutUrls(url: string): string {
    switch (url) {
      case 'about:about':
        return getLulumiExtUrl('about/#/');
      case 'about:lulumi':
        return getLulumiExtUrl('about/#/lulumi');
      case 'about:preferences':
        return getLulumiExtUrl('about/#/preferences');
      case 'about:downloads':
        return getLulumiExtUrl('about/#/downloads');
      case 'about:history':
        return getLulumiExtUrl('about/#/history');
      case 'about:extensions':
        return getLulumiExtUrl('about/#/extensions');
      case 'about:newtab':
        return getLulumiExtUrl('about/#/newtab');
      case 'about:blank':
        return url;
      default:
        return getLulumiExtUrl('about/#/');
    }
  },
};

export default urlResource;
