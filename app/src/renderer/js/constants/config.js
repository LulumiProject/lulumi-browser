import path from 'path';

let lulumiAppPath = process.env.NODE_ENV === 'development'
  ? `${__dirname}/../../../../`
  : `${__dirname}/../`;
lulumiAppPath = path.resolve(lulumiAppPath);

const searchEngine = [
  {
    name: 'Google',
    search: 'https://www.google.com/search?q=',
  },
  {
    name: 'Bing',
    search: 'https://www.bing.com/search?q=',
  },
];

const homepage = 'https://github.com/qazbnm456/lulumi-browser';
const pdfViewer = 'pdf-viewer';

const tabConfig = {
  defaultUrl: 'https://github.com/qazbnm456/lulumi-browser',
  defaultFavicon: 'https://github.com/favicon.ico',
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
  lulumiPagesPath: `${lulumiAppPath}/pages/`,
  lulumiPDFJSPath: `${lulumiAppPath}/pdfjs/`,
  lulumiAppPath,
  lulumiRev: '8ec00eb36d1d72ee38e395211bab52d2f9324631',
};
