const sizes = [
  'Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB',
];

const prettySize = {
  /**
   * Pretty print a size from bytes
   * @method pretty
   * @param {Number} size The number to pretty print
   * @param {Boolean} [nospace=false] Don't print a space
   * @param {Boolean} [one=false] Only print one character
   */
  process(size, nospace, one) {
    let mysize;
    let f;

    sizes.forEach((f, id) => {
      if (one) {
        f = f.slice(0, 1);
      }

      const s = 1024 ** id;
      let fixed;
      if (size >= s) {
        fixed = String((size / s).toFixed(1));
        if (fixed.indexOf('.0') === fixed.length - 2) {
          fixed = fixed.slice(0, -2);
        }
        mysize = fixed + (nospace ? '' : ' ') + f;
      }
    });

    // zero handling
    // always prints in Bytes
    if (!mysize) {
      f = (one ? sizes[0].slice(0, 1) : sizes[0]);
      mysize = `0${nospace ? '' : ' '}${f}`;
    }

    return mysize;
  },
};

export default prettySize;
