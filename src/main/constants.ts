import * as path from 'path';

const lulumiRootPath = process.env.NODE_ENV === 'development'
  ? path.resolve(__dirname, '../../')
  : path.resolve(__dirname, '../');
const lulumiHelperPath = process.env.NODE_ENV === 'development'
  ? path.resolve(lulumiRootPath, 'src', 'helper')
  : path.resolve(lulumiRootPath, 'dist');

export default {
  lulumiRootPath,
  lulumiHelperPath,
  devUserData: `${path.resolve(lulumiRootPath, 'userData')}`,
  testUserData: `${path.resolve(lulumiRootPath, 'test', 'userData')}`,
  lulumiPagesCustomProtocol: 'lulumi://',
  lulumiPreloadPath: `${path.resolve(lulumiRootPath, 'dist')}`,
  lulumiPDFJSPath: `${path.resolve(lulumiHelperPath, 'pdfjs')}`,
  lulumiRev: 'c06a2275bd8d54e503494771c0bdd5325d3f64bb',
};
