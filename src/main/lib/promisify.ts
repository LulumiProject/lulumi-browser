/* eslint-disable no-confusing-arrow */

export default (func, ...promisifyArgs) => new Promise((resolve, reject) => {
  func(...promisifyArgs, (err, ...cbRest) => err ? reject(err) : resolve(cbRest));
});
