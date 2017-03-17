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

export default {
  lulumiPagesCustomProtocol: 'lulumi://',
  newtab: {
    defaultUrl: 'https://github.com/qazbnm456/lulumi-browser',
    defaultFavicon: 'https://github.com/favicon.ico',
  },
  aboutPages: {
    about: 'List of about pages',
  },
  searchEngine,
  currentSearchEngine: searchEngine[0],
  homepage,
  lulumiPagesPath: `${lulumiAppPath}/pages/`,
  lulumiPDFJSPath: `${lulumiAppPath}/pdfjs/`,
  lulumiAppPath,
  lulumiRev: 'b0b91e04d4c3b06559064e3317e9e85cec29675c',
};
