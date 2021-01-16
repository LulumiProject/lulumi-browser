import * as path from 'path';

const lulumiRootPath = process.env.NODE_ENV === 'development'
  ? path.resolve(__dirname, '../../')
  : path.resolve(__dirname, '../');
const lulumiHelperPath = process.env.NODE_ENV === 'development'
  ? path.resolve(lulumiRootPath, 'src', 'helper')
  : path.resolve(lulumiRootPath, 'dist');
const lulumiPreloadPath = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../.electron-vue/config').port}`
  : path.resolve(lulumiRootPath, 'dist');

export default {
  lulumiRootPath,
  lulumiHelperPath,
  lulumiPreloadPath,
  devUserData: `${path.resolve(lulumiRootPath, 'userData')}`,
  testUserData: `${path.resolve(lulumiRootPath, 'test', 'userData')}`,
  lulumiPagesCustomProtocol: 'lulumi',
  lulumiPDFJSPath: `${path.resolve(lulumiHelperPath, 'pdfjs')}`,
  lulumiRev: '9d2efbaa0bb8d90e30c1b73a7fcc620e9f453781',
};
