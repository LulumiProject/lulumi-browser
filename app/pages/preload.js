const { ipcRenderer } = require('electron');

process.once('loaded', () => {
  if (document.location.href.startsWith('lulumi://')) {
    /* eslint-disable no-new */
    new Promise((resolve) => {
      ipcRenderer.send('lulumi-scheme-loaded', document.location.href.substr(9).split('/'));
      ipcRenderer.on('sent-data', (event, data) => {
        resolve(data);
      });
    }).then((data) => {
      const script = document.createElement('script');
      const tmp = `data = ${JSON.stringify(data)}`;
      script.innerHTML = `
        let data = null;
        eval('${tmp}');
        Process.start(data);
      `;
      document.body.appendChild(script);
    });
  }
});
