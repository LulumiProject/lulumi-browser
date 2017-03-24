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
  lulumiPagesPath: `${lulumiAppPath}/pages/`,
  lulumiPDFJSPath: `${lulumiAppPath}/pdfjs/`,
  lulumiAppPath,
  lulumiRev: '6332715b788571ac46c4ca1b9bb326a7809f4c7a',
};
