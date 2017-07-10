import path from 'path';

const lulumiRootPath = process.env.NODE_ENV === 'development'
  ? path.resolve(__dirname, '../../../../')
  : path.resolve(__dirname, '../');
const lulumiHelperPath = path.resolve(lulumiRootPath, './helper');

export default {
  devUserData: `${lulumiRootPath}/userData`,
  testUserData: `${lulumiRootPath}/test/userData`,
  lulumiPagesCustomProtocol: 'lulumi://',
  lulumiRootPath,
  lulumiHelperPath,
  lulumiApiPath: `${lulumiHelperPath}/api`,
  lulumiPreloadPath: `${lulumiHelperPath}/preload`,
  lulumiPagesPath: `${lulumiHelperPath}/pages`,
  lulumiPDFJSPath: `${lulumiHelperPath}/pdfjs`,
  lulumiRev: '3ef1a2dcccbfa608ee4e6aa9165ad2e237e6b7e2',
};
