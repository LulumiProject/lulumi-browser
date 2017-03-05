const imageUtil = {
  getBase64FromImageUrl(url) {
    /* eslint-disable no-new */
    new Promise((resolve, reject) => {
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
      img.src = url;
    });
  },
  getWorkingImageUrl(url, cb) {
    const img = new window.Image();
    img.onload = () => cb(true);
    img.onerror = () => cb(false);
    img.src = url;
  },
};

export default imageUtil;
