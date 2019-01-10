import * as path from 'path';

const lulumiRootPath = process.env.NODE_ENV === 'development'
  ? path.resolve(__dirname, '../../')
  : path.resolve(__dirname, '../');
const lulumiHelperPath = path.resolve(lulumiRootPath, 'src', 'helper');

export default {
  lulumiRootPath,
  lulumiHelperPath,
  devUserData: `${path.resolve(lulumiRootPath, 'userData')}`,
  testUserData: `${path.resolve(lulumiRootPath, 'test', 'userData')}`,
  lulumiPagesCustomProtocol: 'lulumi://',
  lulumiPreloadPath: `${path.resolve(lulumiRootPath, 'dist')}`,
  lulumiPagesPath: `${path.resolve(lulumiHelperPath, 'pages')}`,
  lulumiPDFJSPath: `${path.resolve(lulumiHelperPath, 'pdfjs')}`,
  lulumiRev: '47040be4d8d66ce88752dff0e38948470ca3ff28',
};
