import fs from'fs';
import path from 'path';

import apiFactory, { initializeExtensionApi } from './api-factory';

export default class ExtHostExtensionService {
  constructor(VueInstance) {
    this.ready = false;
    VueInstance.$electron.ipcRenderer.once('response-extension-manifest-maps', (event, manifestMap, manifestNameMap) => {
      if (Object.keys(manifestMap) !== 0) {
        initializeExtensionApi(apiFactory(VueInstance)).then((restoreOriginalModuleLoader) => {
          if (restoreOriginalModuleLoader) {
            this._triggerOnReady();
            this.manifestMap = manifestMap;
            this.manifestNameMap = manifestNameMap;
          }
        });
      }
    });
    VueInstance.$electron.ipcRenderer.send('request-extension-manifest-maps');
  }

  _triggerOnReady() {
    this.ready = true;
  }
};
