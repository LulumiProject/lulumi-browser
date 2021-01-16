/* eslint-disable @typescript-eslint/no-unused-vars */

import { app, BrowserView } from 'electron';
import { Store } from 'vuex';
import * as fs from 'fs';
import * as path from 'path';
import urlUtil from '../../renderer/lib/url-util';
import constants from '../constants';
import fetch from './fetch';

const { default: mainStore } = require('../../shared/store/mainStore');
const store: Store<any> = mainStore.getStore();

export default class View {
  public browserView: BrowserView;
  public tabId: number;
  public tabIndex: number;

  private window: Electron.BrowserWindow;
  private preloadCachePath: string;

  public constructor(window: Electron.BrowserWindow, tabIndex: number, tabId: number, url: string) {
    this.preloadCachePath = '';
    if (process.env.NODE_ENV === 'development') {
      this.fetchPreload(`${constants.lulumiPreloadPath}/webview-preload.js`);
    }
    this.browserView = new BrowserView({
      webPreferences: {
        preload: (this.preloadCachePath.length === 0)
          ? path.join(constants.lulumiPreloadPath, 'webview-preload.js')
          : this.preloadCachePath,
        enableRemoteModule: true,
        nodeIntegration: false,
        nodeIntegrationInSubFrames: true,
        worldSafeExecuteJavaScript: true,
        contextIsolation: true,
        sandbox: false,
        partition: 'persist:lulumi',
        plugins: true,
        nativeWindowOpen: false,
        webSecurity: true,
        javascript: true,
      },
    });

    this.tabId = tabId;
    this.tabIndex = tabIndex;

    store.dispatch('setBrowserViewId', {
      browserViewId: this.browserView.id,
      tabId: this.tabId,
    });

    this.window = window;

    this.webContents.addListener('did-start-loading', (event) => {
      this.window.webContents.send('browser-view-did-start-loading', {
        event: {},
        eventName: 'onDidStartLoading',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    // eslint-disable-next-line no-shadow
    this.webContents.addListener('did-navigate', (event, url) => {
      this.window.webContents.send('browser-view-did-navigate', {
        event: { url },
        eventName: 'onDidNavigate',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('page-title-updated', (event, title) => {
      this.window.webContents.send('browser-view-page-title-updated', {
        event: { title },
        eventName: 'onPageTitleUpdated',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('dom-ready', (event) => {
      this.window.webContents.send('browser-view-dom-ready', {
        event: {},
        eventName: 'onDomReady',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('did-frame-finish-load', (event, isMainFrame) => {
      this.window.webContents.send('browser-view-did-frame-finish-load', {
        event: { isMainFrame },
        eventName: 'onDidFrameFinishLoad',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('page-favicon-updated', (event, favicons) => {
      this.window.webContents.send('browser-view-page-favicon-updated', {
        event: { favicons },
        eventName: 'onPageFaviconUpdated',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('did-stop-loading', (event) => {
      this.window.webContents.send('browser-view-did-stop-loading', {
        event: {},
        eventName: 'onDidStopLoading',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    // eslint-disable-next-line max-len
    this.webContents.addListener('did-fail-load', (event, errorCode, _, validatedURL, isMainFrame) => {
      this.window.webContents.send('browser-view-did-fail-load', {
        event: { errorCode, validatedURL, isMainFrame, url: this.window.webContents.getURL() },
        eventName: 'onDidFailLoad',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('ipc-message', (event, channel) => {
      this.window.webContents.send('browser-view-ipc-message', {
        event: { channel },
        eventName: 'onIpcMessage',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    // eslint-disable-next-line no-shadow
    this.webContents.addListener('update-target-url', (event, url) => {
      this.window.webContents.send('browser-view-update-target-url', {
        event: { url },
        eventName: 'onUpdateTargetUrl',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('media-started-playing', (event) => {
      this.window.webContents.send('browser-view-media-started-playing', {
        event: {},
        eventName: 'onMediaStartedPlaying',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('media-paused', (event) => {
      this.window.webContents.send('browser-view-media-paused', {
        event: {},
        eventName: 'onMediaPaused',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('enter-html-full-screen', (event) => {
      this.window.webContents.send('browser-view-enter-html-full-screen', {
        event: {},
        eventName: 'onEnterHtmlFullScreen',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('leave-html-full-screen', (event) => {
      this.window.webContents.send('browser-view-leave-html-full-screen', {
        event: {},
        eventName: 'onLeaveHtmlFullScreen',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('new-window', (event) => {
      this.window.webContents.send('browser-view-new-window', {
        event: {},
        eventName: 'onNewWindow',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    this.webContents.addListener('context-menu', (event, params) => {
      this.window.webContents.send('browser-view-context-menu', {
        event: { params },
        eventName: 'onContextMenu',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });
    // eslint-disable-next-line no-shadow
    this.webContents.addListener('will-navigate', (event, url) => {
      this.window.webContents.send('browser-view-will-navigate', {
        event: { url },
        eventName: 'onWillNavigate',
        tabId: this.tabId,
        tabIndex: this.tabIndex,
      });
    });

    this.window.setBrowserView(this.browserView);
    this.browserView.setAutoResize({
      width: true,
      height: true,
      horizontal: false,
      vertical: false,
    });
    this.fitWindow();
    this.webContents.loadURL(urlUtil.getUrlFromInput(url));
  }

  public get id(): number {
    return this.browserView.id;
  }

  public get webContents(): Electron.WebContents {
    return this.browserView.webContents;
  }

  public async fitWindow(): Promise<void> {
    const { width } = this.window.getContentBounds();
    const height = await this.window.webContents
      .executeJavaScript(`
        document.getElementById("app").offsetHeight;
      `);

    this.browserView.setBounds({
      x: 0,
      y: 72,
      width,
      height: height - /* nav */ 72 - /* status-bar */ 22,
    });
  }

  public destroy(): boolean {
    this.browserView.destroy();
    return this.browserView.isDestroyed();
  }

  private fetchPreload(preloadPath: string): void {
    this.preloadCachePath = path.join(app.getPath('userData'), 'webview-preload.js');
    fetch(preloadPath, (result) => {
      if (result.ok) {
        if (!fs.existsSync(path.dirname(this.preloadCachePath))) {
          fs.mkdirSync(path.dirname(this.preloadCachePath));
        }
        fs.writeFileSync(this.preloadCachePath, result.body);
      }
    });
  }
}
