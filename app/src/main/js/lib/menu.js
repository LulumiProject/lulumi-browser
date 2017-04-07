import { app, Menu, BrowserWindow } from 'electron';

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Tab',
        accelerator: 'CmdOrCtrl+T',
        click: () => BrowserWindow.getFocusedWindow().webContents.send('new-tab'),
      },
      {
        label: 'Close Tab',
        accelerator: 'CmdOrCtrl+W',
        click: () => BrowserWindow.getFocusedWindow().webContents.send('tab-close'),
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      {
        role: 'undo',
      },
      {
        role: 'redo',
      },
      {
        type: 'separator',
      },
      {
        role: 'cut',
      },
      {
        role: 'copy',
      },
      {
        role: 'paste',
      },
      process.platform === 'darwin' ? {
        role: 'pasteandmatchstyle',
      } : {},
      {
        role: 'delete',
      },
      {
        role: 'selectall',
      },
      {
        type: 'separator',
      },
      {
        label: 'Find',
        accelerator: 'CmdOrCtrl+F',
        click: () => BrowserWindow.getFocusedWindow().webContents.send('startFindInPage'),
      },
      {
        label: 'Speech',
        submenu: [
          {
            role: 'startspeaking',
          },
          {
            role: 'stopspeaking',
          },
        ],
      },
    ],
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => BrowserWindow.getFocusedWindow().webContents.send('reload'),
      },
      {
        role: 'forcereload',
      },
      {
        role: 'toggledevtools',
      },
      {
        type: 'separator',
      },
      {
        role: 'resetzoom',
      },
      {
        role: 'zoomin',
      },
      {
        role: 'zoomout',
      },
      {
        type: 'separator',
      },
      {
        role: 'togglefullscreen',
      },
    ],
  },
  {
    role: 'window',
    submenu: [
      {
        role: 'minimize',
      },
      {
        role: 'close',
      },
      process.platform === 'darwin' ? {
        type: 'separator',
      } : {},
      process.platform === 'darwin' ? {
        label: 'Bring All to Front',
        role: 'front',
      } : {},
    ],
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: () => require('electron').shell.openExternal('http://electron.atom.io'),
      },
    ],
  },
];

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      {
        role: 'about',
      },
      {
        type: 'separator',
      },
      {
        role: 'services',
        submenu: [],
      },
      {
        type: 'separator',
      },
      {
        role: 'hide',
      },
      {
        role: 'hideothers',
      },
      {
        role: 'unhide',
      },
      {
        type: 'separator',
      },
      {
        role: 'quit',
      },
    ],
  });
}

const menu = Menu.buildFromTemplate(template);

export default {
  init() {
    Menu.setApplicationMenu(menu);
  },
};
