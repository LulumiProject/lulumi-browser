export default (func, ...promisifyArgs) => {
  return new Promise((resolve, reject) => {
    func(...promisifyArgs, (err, ...cbRest) => {
      return err ? reject(err) : resolve(cbRest);
    });
  });
};
