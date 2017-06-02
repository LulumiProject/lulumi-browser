import { nativeImage } from 'electron';
import path from 'path';

const searchEngine = [
  {
    name: 'Google',
    search: 'https://www.google.com/search?q=',
    autocomplete: 'https://suggestqueries.google.com/complete/search?client=youtube&q=',
  },
  {
    name: 'Bing',
    search: 'https://www.bing.com/search?q=',
    autocomplete: 'https://api.bing.com/osjson.aspx?query=',
  },
];

const homepage = 'https://github.com/qazbnm456/lulumi-browser';
const pdfViewer = 'pdf-viewer';

const tabConfig = {
  defaultUrl: 'https://github.com/qazbnm456/lulumi-browser',
  defaultFavicon: nativeImage
    .createFromPath(path.join(__static, 'icons', 'document.png'))
    .toDataURL('image/png'),
  lulumiFavicon: nativeImage
    .createFromPath(path.join(__static, 'icons', 'icon.png'))
    .toDataURL('image/png'),
};

export default {
  lulumiPagesCustomProtocol: 'lulumi://',
  tabConfig,
  aboutPages: {
    about: 'List of about pages',
  },
  searchEngine,
  currentSearchEngine: searchEngine[0],
  homepage,
  pdfViewer,
};
