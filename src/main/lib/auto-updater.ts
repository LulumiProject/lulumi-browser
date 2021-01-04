import { app, autoUpdater, ipcMain } from 'electron';

const platform = process.platform === 'darwin'
  ? 'osx'
  : process.platform;
const FEED_URL = `https://updater-for-lulumi-browser.herokuapp.com/update/${platform}`;
const version = app.getVersion();

export default {
  init(): any {
    autoUpdater.on(('error' as any), (err, msg) => {
      // eslint-disable-next-line no-console
      console.error(`Error fetching updates, ${msg} (${err.stack})`);
    });

    autoUpdater.setFeedURL({ url: `${FEED_URL}/${version}` });

    setTimeout(() => autoUpdater.checkForUpdates(), 1000 * 10);
    setInterval(() => autoUpdater.checkForUpdates(), 1000 * 60 * 5);
  },
  listen(windows: any): void {
    autoUpdater.once('update-downloaded', (event, releaseNotes, releaseName) => {
      Object.keys(windows).forEach((key) => {
        const id = parseInt(key, 10);
        const window = windows[id];
        window.webContents.send('update-available', {
          releaseNotes,
          releaseName,
        });
      });
    });
    ipcMain.once('quit-and-install', (event, data) => {
      if (data.accept) {
        autoUpdater.quitAndInstall();
      }
    });
  },
};
