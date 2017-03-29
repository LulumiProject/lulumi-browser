import { ipcMain, session } from 'electron';

export default {
  onWillDownload(mainWindow, config) {
    session.defaultSession.on('will-download', (event, item, webContents) => {
      const itemURL = item.getURL();
      if (item.getMimeType() === 'application/pdf'
        && itemURL.indexOf('blob:') !== 0
        && itemURL.indexOf('#pdfjs.action=download') === -1
        && itemURL.indexOf('skip=true') === -1) {
        event.preventDefault();
        const qs = require('querystring');
        const param = qs.stringify({ file: itemURL });
        const PDFViewerURL = `file://${config.lulumiPDFJSPath}/web/viewer.html`;
        mainWindow.webContents.send('open-pdf', {
          location: `${PDFViewerURL}?${param}`,
          webContentsId: webContents.id,
        });
      } else {
        const totalBytes = item.getTotalBytes();
        const startTime = item.getStartTime();
        mainWindow.webContents.send('will-download-any-file', {
          webContentsId: webContents.id,
          name: item.getFilename(),
          url: item.getURL(),
          totalBytes,
          isPaused: item.isPaused(),
          canResume: item.canResume(),
          startTime,
          state: 'init',
        });

        ipcMain.on('pause-downloads-progress', (event, remoteStartTime) => {
          if (startTime === remoteStartTime) {
            item.pause();
          }
        });
        ipcMain.on('resume-downloads-progress', (event, remoteStartTime) => {
          if (startTime === remoteStartTime) {
            item.resume();
          }
        });
        ipcMain.on('cancel-downloads-progress', (event, remoteStartTime) => {
          if (startTime === remoteStartTime) {
            item.cancel();
          }
        });

        item.on('updated', (event, state) => {
          mainWindow.webContents.send('update-downloads-progress', {
            startTime: item.getStartTime(),
            getReceivedBytes: item.getReceivedBytes(),
            savePath: item.getSavePath(),
            isPaused: item.isPaused(),
            canResume: item.canResume(),
            state,
          });
        });

        item.on('done', (event, state) => {
          ipcMain.removeAllListeners([
            'pause-downloads-progress',
            'resume-downloads-progress',
            'cancel-downloads-progress',
          ]);
          mainWindow.webContents.send('complete-downloads-progress', {
            name: item.getFilename(),
            startTime: item.getStartTime(),
            state,
          });
        });
      }
    });
  },
  setPermissionRequestHandler() {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      // eslint-disable-next-line no-console
      console.log(permission);
      callback(true);
    });
  },
};
