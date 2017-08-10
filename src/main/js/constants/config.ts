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
  lulumiRev: '337d4456a1c78cfb0fc3bf8e84ec5ecbadd4ec51',
};
