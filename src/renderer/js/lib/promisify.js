export default (func, ...promisifyArgs) => new Promise((resolve, reject) => {
  // eslint-disable-next-line no-confusing-arrow
  func(...promisifyArgs, (err, ...cbRest) => err ? reject(err) : resolve(cbRest));
});
