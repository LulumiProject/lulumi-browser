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
      {
        role: 'pasteandmatchstyle',
      },
      {
        role: 'delete',
      },
      {
        role: 'selectall',
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
  // Edit menu.
  template[2].submenu.push(
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
  );
  // Window menu.
  template[4].submenu = [
    {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      role: 'close',
    },
    {
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize',
    },
    {
      label: 'Zoom',
      role: 'zoom',
    },
    {
      type: 'separator',
    },
    {
      label: 'Bring All to Front',
      role: 'front',
    },
  ];
}

const menu = Menu.buildFromTemplate(template);

export default {
  init() {
    Menu.setApplicationMenu(menu);
  },
};
