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
  process(size: number, nospace = false, one = false): string {
    let mysize = '';
    let outF: string;

    sizes.forEach((f, id) => {
      let first = '';
      if (one) {
        first = f.slice(0, 1);
      }

      const s: number = 1024 ** id;
      let fixed: string;
      if (size >= s) {
        fixed = String((size / s).toFixed(1));
        if (fixed.indexOf('.0') === fixed.length - 2) {
          fixed = fixed.slice(0, -2);
        }
        mysize = fixed + (nospace ? '' : ' ') + first;
      }
    });

    // zero handling
    // always prints in Bytes
    if (!mysize) {
      outF = (one ? sizes[0].slice(0, 1) : sizes[0]);
      mysize = `0${nospace ? '' : ' '}${outF}`;
    }

    return mysize;
  },
};

export default prettySize;
