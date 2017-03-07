const { ipcRenderer } = require('electron');

process.once('loaded', () => {
  ipcRenderer.on('alert', (event, data) => {
    alert(data);
  });
});
