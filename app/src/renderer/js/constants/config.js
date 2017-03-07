import path from 'path';

let lulumiAppPath = process.env.NODE_ENV === 'development'
  ? `${__dirname}/../../../../`
  : `${__dirname}/../`;
lulumiAppPath = path.resolve(lulumiAppPath);

export default {
  lulumiPagesCustomProtocol: 'lulumi://',
  newtab: {
    defaultUrl: 'https://github.com/qazbnm456/lulumi-browser',
    defaultFavicon: 'https://github.com/favicon.ico',
  },
  aboutPages: {
    about: 'List of about pages',
  },
  defaultSearchEngine: 'https://www.google.com/search?q=',
  lulumiPagesPath: `${lulumiAppPath}/pages/`,
  lulumiPDFJSPath: `${lulumiAppPath}/pdfjs/`,
  lulumiAppPath,
};
