import path from 'path';

const lulumiRootPath = process.env.NODE_ENV === 'development'
  ? path.resolve(__dirname, '../../../../')
  : path.resolve(__dirname, '../');
const lulumiHelperPath = path.resolve(lulumiRootPath, './helper');

export default {
  lulumiRootPath,
  lulumiHelperPath,
  delayedInit: 3000,
  devUserData: `${lulumiRootPath}/userData`,
  testUserData: `${lulumiRootPath}/test/userData`,
  lulumiPagesCustomProtocol: 'lulumi://',
  lulumiApiPath: `${lulumiHelperPath}/api`,
  lulumiPreloadPath: `${lulumiHelperPath}/preload`,
  lulumiPagesPath: `${lulumiHelperPath}/pages`,
  lulumiPDFJSPath: `${lulumiHelperPath}/pdfjs`,
  lulumiRev: 'b07b91d6e9e8db2373b854a47056b747dfc97f8c',
};
