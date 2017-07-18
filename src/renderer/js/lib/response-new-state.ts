import { ipcRenderer } from 'electron';
import { store } from 'lulumi';

/* tslint:disable:max-line-length */

export default
  (getters, newStart: number, newPages: store.PageObjectList, newCurrentPageIndex: number, downloads) => {
    ipcRenderer.send('response-app-state', {
      ready: true,
      newState: {
        pid: newStart + (newPages.length - 1),
        pages: newPages,
        currentPageIndex: newCurrentPageIndex,
        currentSearchEngine: getters.currentSearchEngine,
        homepage: getters.homepage,
        pdfViewer: getters.pdfViewer,
        tabConfig: getters.tabConfig,
        lang: getters.lang,
        downloads: downloads.filter(download => download.state !== 'progressing'),
        history: getters.history,
      },
    });
  };
