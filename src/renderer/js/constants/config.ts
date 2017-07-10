import { nativeImage } from 'electron';
import path from 'path';

declare const __static;

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
    .toDataURL(),
  lulumiFavicon: nativeImage
    .createFromPath(path.join(__static, 'icons', 'icon.png'))
    .toDataURL(),
};

export default {
  tabConfig,
  searchEngine,
  homepage,
  pdfViewer,
  lulumiPagesCustomProtocol: 'lulumi://',
  aboutPages: {
    about: 'List of about pages',
  },
  currentSearchEngine: searchEngine[0],
};
