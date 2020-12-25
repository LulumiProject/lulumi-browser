/**
 * This file is used specifically and only for development. It installs
 * `vue-devtools`. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

/* eslint-disable no-console */

const { app } = require('electron');

if (typeof process.env.NODE_ENV === 'string') {
  // we don't have to reassign the value to `process.env.NODE_ENV`
  // since above webpack 4, the value has been set automatically
  // in built files according to the `mode` variable
} else {
  // Set environment for development
  process.env.NODE_ENV = 'development';
}

app.on('browser-window-created', (event, window) => {
  window.webContents.once('dom-ready', () => {
    window.webContents.openDevTools({ mode: 'bottom', active: false });
  });
});

// Install `vue-devtools`
require('electron').app.whenReady().then(() => {
  require('devtron').install();
  const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer');
  installExtension(VUEJS_DEVTOOLS)
    .then()
    .catch((err) => {
      console.error(`(lulumi-browser) Unable to install \`vue-devtools\`: \n${err}`);
    });
});

// Require `main` process to boot app
require('./index');
