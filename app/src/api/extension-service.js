import fs from'fs';
import path from 'path';

import apiFactory, { initializeExtensionApi } from './api-factory';

export default class ExtHostExtensionService {
  constructor(VueInstance) {
    this.cwd = path.resolve('./extensions');
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
    this.extensions
      = fs.readdirSync(this.cwd).filter((file) => file.startsWith('.') === false).filter((file) => fs.lstatSync(path.join(this.cwd, file)).isDirectory());
    VueInstance.$electron.ipcRenderer.send('request-extension-manifest-maps', this.extensions);
  }

  activate() {
    if (this.ready) {
      this.extensions.forEach(extension => {
        require(`extensions/${extension}/background`).activate();
      });
    }
  }

  _triggerOnReady() {
    this.ready = true;
  }
};
