import * as path from 'path';

const lulumiRootPath = process.env.NODE_ENV === 'development'
  ? path.resolve(__dirname, '../../../../')
  : path.resolve(__dirname, '../');
const lulumiHelperPath = path.resolve(lulumiRootPath, './helper');

export default {
  lulumiRootPath,
  lulumiHelperPath,
  devUserData: `${lulumiRootPath}/userData`,
  testUserData: `${lulumiRootPath}/test/userData`,
  lulumiPagesCustomProtocol: 'lulumi://',
  lulumiApiPath: `${lulumiHelperPath}/api`,
  lulumiPreloadPath: `${lulumiHelperPath}/preload`,
  lulumiPagesPath: `${lulumiHelperPath}/pages`,
  lulumiPDFJSPath: `${lulumiHelperPath}/pdfjs`,
  lulumiRev: 'bdf4512963c6d39e19ab7976cb8f865110c720e7',
};
