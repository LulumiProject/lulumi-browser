import Vue from 'vue';
import Vuex from 'vuex';
import { BrowserWindow, ipcMain } from 'electron';

import { actions } from './actions';
import { getters } from './getters';
import modules from './modules';

Vue.use(Vuex);

const windows: Electron.BrowserWindow[] = [];

const broadcastMutations = (store) => {
  store.subscribe((mutation) => {
    Object.keys(windows).forEach((id) => {
      windows[id].send('vuex-apply-mutation', mutation);
    });
  });
};

const store = new Vuex.Store({
  actions,
  getters,
  modules,
  plugins: [broadcastMutations],
  strict: process.env.NODE_ENV !== 'production',
});

ipcMain.on('vuex-connect', (event: Electron.Event) => {
  const window = BrowserWindow.fromWebContents(event.sender);

  window.on('close', () => {
    delete windows[window.id];
  });

  windows[window.id] = window;
  event.returnValue = store.state;
});

ipcMain.on('vuex-action', (event, action) => {
  const type: string = action.type;
  store.dispatch(type, ...action.payload);
});

export default windows;
