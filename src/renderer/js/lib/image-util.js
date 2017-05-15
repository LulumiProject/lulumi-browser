/* eslint-disable no-new */
/**
 * A simple class for fetching images from URLs or files.
 * @class imageUtil
 */
const imageUtil = {
  /**
   * Extracts the image from a valid URL.
   * @param {String} input The input value.
   * @returns {String} The found image encoded by base64.
   */
  getBase64FromImageUrl(input) {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onerror = () => {
        reject();
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')
          .drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = input;
    });
  },

  /**
   * Extracts the scheme from a filepath.
   * @param {String} path The filepath.
   * @param {String} size The size of returned icon (small, normal, large).
   * @returns {String} The found image encoded by base64.
   */
  getBase64FromFileIcon(path, size = 'normal') {
    return new Promise((resolve, reject) => {
      require('electron').remote.app.getFileIcon(path, { size }, (err, icon) => {
        if (icon) {
          resolve(icon.toDataURL('image/png'));
        } else {
          reject(err);
        }
      });
    });
  },

  /**
   * Extracts the valid image from a URL.
   * @param {String} input The input value.
   * @param {Function} cb The callback function.
   */
  getWorkingImageUrl(input, cb) {
    const img = new window.Image();
    img.onload = () => cb(true);
    img.onerror = () => cb(false);
    img.src = input;
  },
};

export default imageUtil;
