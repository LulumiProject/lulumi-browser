import constants from '../mainBrowserWindow/constants';

function getLulumiExtUrl(relativeUrl: string): string {
  return `${constants.lulumiPagesCustomProtocol}${relativeUrl}`;
}

const urlResource = {
  aboutUrls(url: string): string {
    switch (url) {
      case 'about:about':
        return getLulumiExtUrl('about/#/');
      case 'about:blank':
        return url;
      case 'about:downloads':
        return getLulumiExtUrl('about/#/downloads');
      case 'about:extensions':
        return getLulumiExtUrl('about/#/extensions');
      case 'about:history':
        return getLulumiExtUrl('about/#/history');
      case 'about:lulumi':
        return getLulumiExtUrl('about/#/lulumi');
      case 'about:newtab':
        return getLulumiExtUrl('about/#/newtab');
      case 'about:preferences':
        return getLulumiExtUrl('about/#/preferences');
      case 'about:gpu':
        return 'chrome://gpu';
      default:
        return getLulumiExtUrl('about/#/');
    }
  },
};

export default urlResource;
