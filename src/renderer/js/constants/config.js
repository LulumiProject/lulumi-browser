import { nativeImage } from 'electron';
import path from 'path';

const lulumiRootPath = path.resolve(__dirname, '../');
const lulumiHelperPath = path.resolve(lulumiRootPath, './helper');

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
  lulumiRootPath,
  devUserData: `${lulumiRootPath}/userData`,
  testUserData: `${lulumiRootPath}/test/userData`,
  lulumiHelperPath,
  lulumiApiPath: `${lulumiHelperPath}/api`,
  lulumiPreloadPath: `${lulumiHelperPath}/preload`,
  lulumiPagesPath: `${lulumiHelperPath}/pages`,
  lulumiPDFJSPath: `${lulumiHelperPath}/pdfjs`,
  lulumiRev: '16e9f13240026358a7c2b7189c8bb38d59012415',
};
