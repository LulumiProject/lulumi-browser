import { Menu, BrowserWindow } from 'electron';
import { is } from 'electron-util';
import i18n from '../../i18n';
const { openProcessManager } = require('electron-process-manager');

const getTemplate = () => {
  const template = [
    {
      label: i18n.t('edit.title'),
      submenu: [
        {
          label: i18n.t('edit.undo'),
          role: 'undo',
        },
        {
          label: i18n.t('edit.redo'),
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: i18n.t('edit.cut'),
          role: 'cut',
        },
        {
          label: i18n.t('edit.copy'),
          role: 'copy',
        },
        {
          label: i18n.t('edit.paste'),
          role: 'paste',
        },
        is.macos ? {
          label: i18n.t('edit.pasteAndMatchStyle'),
          role: 'pasteandmatchstyle',
        } : {},
        {
          label: i18n.t('edit.delete'),
          role: 'delete',
        },
        {
          label: i18n.t('edit.selectAll'),
          role: 'selectall',
        },
        {
          type: 'separator',
        },
        {
          label: i18n.t('edit.find'),
          accelerator: 'CmdOrCtrl+F',
          click: () => BrowserWindow.getFocusedWindow().webContents.send('start-find-in-page'),
        },
        {
          label: i18n.t('edit.speech.title'),
          submenu: [
            {
              label: i18n.t('edit.speech.startSpeaking'),
              role: 'startspeaking',
            },
            {
              label: i18n.t('edit.speech.stopSpeaking'),
              role: 'stopspeaking',
            },
          ],
        },
      ],
    },
    {
      label: i18n.t('view.title'),
      submenu: [
        {
          label: i18n.t('view.reload'),
          accelerator: 'CmdOrCtrl+R',
          click: () => BrowserWindow.getFocusedWindow().webContents.send('reload'),
        },
        {
          label: i18n.t('view.forceReload'),
          accelerator: 'Shift+CmdOrCtrl+R',
          click: () => BrowserWindow.getFocusedWindow().webContents.send('force-reload'),
        },
        {
          type: 'separator',
        },
        {
          label: i18n.t('view.toggleFullscreen'),
          role: 'togglefullscreen',
        },
        {
          label: i18n.t('view.resetZoom'),
          role: 'resetzoom',
        },
        {
          label: i18n.t('view.zoomIn'),
          role: 'zoomin',
        },
        {
          label: i18n.t('view.zoomOut'),
          role: 'zoomout',
        },
        {
          type: 'separator',
        },
        {
          label: i18n.t('view.viewSource'),
          accelerator: is.macos ? 'Alt+Command+U' : 'Ctrl+U',
          click: () => BrowserWindow.getFocusedWindow().webContents.send('view-source'),
        },
        {
          label: i18n.t('view.toggleDevTools'),
          accelerator: is.macos ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: () => BrowserWindow.getFocusedWindow().webContents.send('toggle-dev-tools'),
        },
        {
          label: i18n.t('view.javascriptPanel'),
          accelerator: is.macos ? 'Alt+Command+J' : 'Ctrl+Shift+J',
          click: () => BrowserWindow.getFocusedWindow().webContents.send('javascript-panel'),
        },
      ],
    },
    {
      label: i18n.t('window.title'),
      role: 'window',
      submenu: [
        {
          label: i18n.t('window.minimize'),
          role: 'minimize',
        },
        {
          label: i18n.t('window.close'),
          role: 'close',
        },
        is.macos ? {
          type: 'separator',
        } : {},
        is.macos ? {
          label: i18n.t('window.front'),
          role: 'front',
        } : {},
        is.macos ? {
          type: 'separator',
        } : {},
        {
          label: i18n.t('window.processManager'),
          click: () => openProcessManager(),
        },
      ],
    },
  ];

  if (is.macos) {
    const appName = require('electron').app.getName();
    template.unshift({
      label: i18n.t('file.title'),
      submenu: [
        {
          label: i18n.t('file.newTab'),
          accelerator: 'CmdOrCtrl+T',
          click: () => BrowserWindow.getFocusedWindow().webContents.send('new-tab'),
        },
        {
          label: i18n.t('file.newWindow'),
          accelerator: 'CmdOrCtrl+N',
          click: () => (BrowserWindow as any).createWindow(),
        },
        is.macos ? {
          type: 'separator',
        } : {},
        {
          label: i18n.t('file.closeTab'),
          accelerator: 'CmdOrCtrl+W',
          click: () => BrowserWindow.getFocusedWindow().webContents.send('tab-close'),
        },
      ],
    });
    template.unshift({
      label: appName,
      submenu: [
        {
          label: i18n.t('app.about', { appName }),
          click: () => BrowserWindow.getFocusedWindow().webContents.send('new-tab', {
            url: 'about:lulumi',
            follow: true,
          }),
        },
        {
          type: 'separator',
        },
        {
          label: i18n.t('app.services.title'),
          role: 'services',
          submenu: [],
        },
        {
          type: 'separator',
        },
        {
          label: i18n.t('app.hide', { appName }),
          role: 'hide',
        },
        {
          label: i18n.t('app.hideOthers'),
          role: 'hideothers',
        },
        {
          label: i18n.t('app.unhide'),
          role: 'unhide',
        },
        {
          type: 'separator',
        },
        {
          label: i18n.t('app.quit', { appName }),
          role: 'quit',
        },
      ],
    });
    template.push({
      label: i18n.t('help.title'),
      role: 'help',
      submenu: [
        {
          label: i18n.t('help.reportIssue'),
          click: () => BrowserWindow.getFocusedWindow().webContents.send('new-tab', {
            url: 'https://github.com/LulumiProject/lulumi-browser/issues',
            follow: true,
          }),
        },
        {
          label: i18n.t('help.forceReload'),
          click: () => BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache(),
        },
        {
          label: i18n.t('help.toggleDevTools'),
          click: () => BrowserWindow.getFocusedWindow().webContents.toggleDevTools(),
        },
      ],
    });
  }

  return Menu.buildFromTemplate((template as any));
};

export default {
  init() {
    Menu.setApplicationMenu(getTemplate());
  },
  setLocale(locale) {
    i18n.locale = locale;
  },
};
