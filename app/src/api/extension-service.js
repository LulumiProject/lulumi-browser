import apiFactory, { initializeExtensionApi } from './api-factory';

export default class ExtHostExtensionService {
  constructor(VueInstance) {
    this.ready = false;
    VueInstance.$electron.ipcRenderer.once('response-extension-manifest-maps', (event, manifestMap, manifestNameMap) => {
      if (Object.keys(manifestMap) !== 0) {
        initializeExtensionApi(apiFactory(VueInstance)).then((restoreOriginalModuleLoader) => {
          if (restoreOriginalModuleLoader) {
            this._triggerOnReady();
          }
        });
      }
    });
    VueInstance.$electron.ipcRenderer.send('request-extension-manifest-maps');
  }

  activate() {
    if (this.ready) {
      require('./test/extension-sample').activate();
    }
  }

  _triggerOnReady() {
    this.ready = true;
  }
};
